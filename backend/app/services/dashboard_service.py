from collections import Counter
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
from app.database.mongo import db_manager
from app.schemas.dashboard import (
    DashboardOverviewResponse,
    AnalyticsResponse,
    DailyAnalyticsPoint,
    SentimentDistribution,
    FAQItem,
    UnansweredQuestionResponse
)

class DashboardService:
    def get_overview(self, business_id: str) -> DashboardOverviewResponse:
        bid = str(business_id)
        conv_col = db_manager.get_collection("conversations")
        msg_col = db_manager.get_collection("messages")
        doc_col = db_manager.get_collection("documents")
        feed_col = db_manager.get_collection("feedback")
        unans_col = db_manager.get_collection("unanswered_questions")

        # Counts
        total_convs = conv_col.count_documents({"business_id": bid})
        total_docs = doc_col.count_documents({"business_id": bid})
        all_user_msgs = list(msg_col.find({"business_id": bid, "sender": "customer"}))
        total_questions = len(all_user_msgs)

        all_asst_msgs = list(msg_col.find({"business_id": bid, "sender": "assistant"}))
        answered_cnt = sum(1 for m in all_asst_msgs if m.get("answer_status") == "grounded")
        unanswered_cnt = sum(1 for m in all_asst_msgs if m.get("answer_status") != "grounded")

        success_rate = round((answered_cnt / total_questions * 100), 1) if total_questions > 0 else 100.0

        # Customer satisfaction
        feedbacks = list(feed_col.find({"business_id": bid}))
        avg_rating = 5.0
        if feedbacks:
            ratings = [f.get("rating", 5) for f in feedbacks]
            avg_rating = round(sum(ratings) / len(ratings), 1)

        # Recent conversations
        convs = list(conv_col.find({"business_id": bid}))
        convs.sort(key=lambda x: x.get("started_at", ""), reverse=True)
        recent_convs = convs[:5]

        # Frequently asked questions
        user_queries = [m.get("message", "").strip() for m in all_user_msgs if len(m.get("message", "")) > 5]
        q_counter = Counter(user_queries)
        faq_items = [FAQItem(question=q, count=c) for q, c in q_counter.most_common(5)]

        # Recent documents
        docs = list(doc_col.find({"business_id": bid}))
        docs.sort(key=lambda x: x.get("uploaded_at", ""), reverse=True)
        recent_docs = docs[:5]

        return DashboardOverviewResponse(
            total_conversations=total_convs,
            total_questions=total_questions,
            answered_questions=answered_cnt,
            unanswered_questions=unanswered_cnt,
            answer_success_rate=success_rate,
            customer_satisfaction_avg=avg_rating,
            total_documents=total_docs,
            recent_conversations=recent_convs,
            frequently_asked_questions=faq_items,
            recent_documents=recent_docs
        )

    def get_analytics(self, business_id: str) -> AnalyticsResponse:
        bid = str(business_id)
        analytics_col = db_manager.get_collection("analytics")
        records = list(analytics_col.find({"business_id": bid}))
        records.sort(key=lambda x: x.get("date", ""))

        daily_points = []
        for r in records[-14:]:  # last 14 days
            tot_q = r.get("total_questions", 0)
            ans = r.get("answered_count", 0)
            daily_points.append(DailyAnalyticsPoint(
                date=r.get("date", ""),
                total_chats=r.get("total_chats", 0),
                total_questions=tot_q,
                answered_count=ans,
                unanswered_count=r.get("unanswered_count", 0),
                satisfaction=4.8
            ))

        # If no daily points recorded yet, provide today's baseline point
        if not daily_points:
            today_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")
            daily_points.append(DailyAnalyticsPoint(
                date=today_str,
                total_chats=0,
                total_questions=0,
                answered_count=0,
                unanswered_count=0,
                satisfaction=5.0
            ))

        # Sentiment Distribution
        msg_col = db_manager.get_collection("messages")
        all_msgs = list(msg_col.find({"business_id": bid}))
        sentiments = Counter([m.get("sentiment", "neutral") for m in all_msgs])

        sentiment_dist = SentimentDistribution(
            positive=sentiments.get("positive", 0),
            neutral=sentiments.get("neutral", 0),
            negative=sentiments.get("negative", 0)
        )

        tickets_col = db_manager.get_collection("support_tickets")
        total_tickets = tickets_col.count_documents({"business_id": bid})
        open_tickets = tickets_col.count_documents({"business_id": bid, "status": "open"})

        return AnalyticsResponse(
            daily_stats=daily_points,
            sentiment_distribution=sentiment_dist,
            total_tickets=total_tickets,
            open_tickets=open_tickets,
            avg_response_time_ms=185.0
        )

    def get_unanswered_questions(self, business_id: str) -> List[UnansweredQuestionResponse]:
        unans_col = db_manager.get_collection("unanswered_questions")
        records = list(unans_col.find({"business_id": str(business_id)}))
        records.sort(key=lambda x: x.get("created_at", ""), reverse=True)
        return [
            UnansweredQuestionResponse(
                id=r["_id"],
                business_id=r["business_id"],
                conversation_id=r.get("conversation_id", ""),
                question=r.get("question", ""),
                resolution_status=r.get("resolution_status", "pending"),
                resolution_notes=r.get("resolution_notes"),
                created_at=r.get("created_at", "")
            )
            for r in records
        ]

    def resolve_unanswered_question(
        self,
        business_id: str,
        question_id: str,
        notes: Optional[str] = None,
        status: str = "resolved"
    ) -> bool:
        unans_col = db_manager.get_collection("unanswered_questions")
        res = unans_col.update_one(
            {"_id": str(question_id), "business_id": str(business_id)},
            {"$set": {
                "resolution_status": status,
                "resolution_notes": notes
            }}
        )
        return res.modified_count > 0

dashboard_service = DashboardService()
