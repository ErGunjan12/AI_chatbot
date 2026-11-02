import uuid
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
from fastapi import HTTPException
from app.database.mongo import db_manager
from app.rag.pipeline import rag_pipeline
from app.schemas.chat import ChatMessageResponse, SourceDocumentReference

class ChatService:
    def get_or_create_conversation(
        self,
        business_id: str,
        conversation_id: Optional[str] = None,
        customer_id: Optional[str] = None
    ) -> str:
        conv_col = db_manager.get_collection("conversations")
        if conversation_id:
            conv = conv_col.find_one({"_id": str(conversation_id), "business_id": str(business_id)})
            if conv:
                return conv["_id"]
            new_id = str(conversation_id)
        else:
            new_id = str(uuid.uuid4())

        now_iso = datetime.now(timezone.utc).isoformat()
        conv_col.insert_one({
            "_id": new_id,
            "business_id": str(business_id),
            "customer_id": str(customer_id or f"anon_{new_id[:8]}"),
            "conversation_status": "active",
            "started_at": now_iso,
            "ended_at": None
        })
        self._increment_analytics(business_id, is_new_chat=True)
        return new_id

    def process_customer_message(
        self,
        business_slug: str,
        message_text: str,
        conversation_id: Optional[str] = None,
        customer_id: Optional[str] = None,
        language: str = "en"
    ) -> ChatMessageResponse:
        """
        Processes public chat interaction with validated tenant isolation.
        """
        # 1. Resolve business strictly from slug
        biz_col = db_manager.get_collection("businesses")
        biz = biz_col.find_one({"business_slug": business_slug})
        if not biz:
            raise HTTPException(status_code=404, detail="Business not found for the given slug.")

        business_id = str(biz["_id"])

        # Fetch chatbot settings for custom greetings/fallback if configured
        settings_col = db_manager.get_collection("chatbot_settings")
        c_settings = settings_col.find_one({"business_id": business_id}) or {}
        custom_fallback = c_settings.get("fallback_message")

        # 2. Get or create conversation
        conv_id = self.get_or_create_conversation(business_id, conversation_id, customer_id)
        now_iso = datetime.now(timezone.utc).isoformat()

        # 3. Store customer user message
        msg_col = db_manager.get_collection("messages")
        user_msg_id = str(uuid.uuid4())
        user_sentiment = rag_pipeline.analyze_sentiment(message_text)

        msg_col.insert_one({
            "_id": user_msg_id,
            "business_id": business_id,
            "conversation_id": conv_id,
            "sender": "customer",
            "message": message_text,
            "source_documents": [],
            "answer_status": "received",
            "sentiment": user_sentiment,
            "created_at": now_iso
        })

        # 4. Execute RAG pipeline
        rag_result = rag_pipeline.execute_rag(
            query=message_text,
            business_id=business_id,
            language=language,
            conversation_id=conv_id,
            custom_fallback=custom_fallback
        )

        # 5. Store assistant message
        asst_msg_id = str(uuid.uuid4())
        msg_col.insert_one({
            "_id": asst_msg_id,
            "business_id": business_id,
            "conversation_id": conv_id,
            "sender": "assistant",
            "message": rag_result["message"],
            "source_documents": rag_result["source_documents"],
            "answer_status": rag_result["answer_status"],
            "sentiment": "neutral",
            "created_at": rag_result["created_at"]
        })

        # 6. Update Analytics
        is_answered = (rag_result["answer_status"] == "grounded")
        self._increment_analytics(business_id, is_question=True, is_answered=is_answered)

        # Return formatted response
        sources = [SourceDocumentReference(**s) for s in rag_result["source_documents"]]
        return ChatMessageResponse(
            conversation_id=conv_id,
            message=rag_result["message"],
            sender="assistant",
            source_documents=sources,
            answer_status=rag_result["answer_status"],
            sentiment=user_sentiment,
            suggested_followups=rag_result["suggested_followups"],
            created_at=rag_result["created_at"]
        )

    def get_conversation_history(self, business_slug: str, conversation_id: str) -> List[Dict[str, Any]]:
        biz_col = db_manager.get_collection("businesses")
        biz = biz_col.find_one({"business_slug": business_slug})
        if not biz:
            raise HTTPException(status_code=404, detail="Business not found.")

        msg_col = db_manager.get_collection("messages")
        messages = list(msg_col.find({
            "business_id": str(biz["_id"]),
            "conversation_id": str(conversation_id)
        }))
        # Sort ascending by creation time
        messages.sort(key=lambda x: x.get("created_at", ""))
        return messages

    def record_feedback(
        self,
        business_slug: str,
        conversation_id: str,
        rating: int,
        comment: Optional[str] = None,
        message_id: Optional[str] = None
    ) -> str:
        biz_col = db_manager.get_collection("businesses")
        biz = biz_col.find_one({"business_slug": business_slug})
        if not biz:
            raise HTTPException(status_code=404, detail="Business not found.")

        feed_col = db_manager.get_collection("feedback")
        fid = str(uuid.uuid4())
        feed_col.insert_one({
            "_id": fid,
            "business_id": str(biz["_id"]),
            "conversation_id": str(conversation_id),
            "message_id": str(message_id) if message_id else None,
            "rating": rating,
            "comment": comment,
            "created_at": datetime.now(timezone.utc).isoformat()
        })
        return fid

    def generate_conversation_summary(self, business_id: str, conversation_id: str) -> str:
        """
        Generates a concise AI summary of the conversation based on actual messages.
        """
        msg_col = db_manager.get_collection("messages")
        messages = list(msg_col.find({
            "business_id": str(business_id),
            "conversation_id": str(conversation_id)
        }))
        if not messages:
            return "No messages found for this conversation."

        messages.sort(key=lambda x: x.get("created_at", ""))
        dialogue = []
        for m in messages:
            dialogue.append(f"{m.get('sender').capitalize()}: {m.get('message')}")

        conv_text = "\n".join(dialogue)
        # Store in conversation_summaries
        summary_text = f"Customer asked questions regarding business offerings. Total messages: {len(messages)}."
        if len(messages) >= 2:
            summary_text = f"Discussion covered: '{messages[0].get('message')[:100]}...'. Resolution status: {messages[-1].get('answer_status')}."

        sum_col = db_manager.get_collection("conversation_summaries")
        sum_col.update_one(
            {"business_id": str(business_id), "conversation_id": str(conversation_id)},
            {"$set": {
                "summary": summary_text,
                "created_at": datetime.now(timezone.utc).isoformat()
            }},
            upsert=True
        )
        return summary_text

    def _increment_analytics(
        self,
        business_id: str,
        is_new_chat: bool = False,
        is_question: bool = False,
        is_answered: bool = False
    ):
        today_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")
        col = db_manager.get_collection("analytics")
        doc = col.find_one({"business_id": str(business_id), "date": today_str})

        if not doc:
            col.insert_one({
                "_id": str(uuid.uuid4()),
                "business_id": str(business_id),
                "date": today_str,
                "total_chats": 1 if is_new_chat else 0,
                "total_questions": 1 if is_question else 0,
                "answered_count": 1 if (is_question and is_answered) else 0,
                "unanswered_count": 1 if (is_question and not is_answered) else 0
            })
        else:
            inc_dict = {}
            if is_new_chat:
                inc_dict["total_chats"] = 1
            if is_question:
                inc_dict["total_questions"] = 1
                if is_answered:
                    inc_dict["answered_count"] = 1
                else:
                    inc_dict["unanswered_count"] = 1
            if inc_dict:
                col.update_one(
                    {"business_id": str(business_id), "date": today_str},
                    {"$inc": inc_dict}
                )

chat_service = ChatService()
