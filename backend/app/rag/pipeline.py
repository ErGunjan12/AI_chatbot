import os
import re
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional, Tuple
from openai import OpenAI
from app.core.config import settings
from app.database.mongo import db_manager
from app.rag.hybrid_fusion import hybrid_retriever
from app.rag.agentic_router import agentic_router
from app.rag.graph_rag import knowledge_graph
from app.rag.reranker import CROSS_LINGUAL_MAPPINGS
from app.schemas.chat import SourceDocumentReference

LANGUAGE_PROMPTS = {
    "en": {
        "name": "English",
        "fallback": "I don't have this information in the available business documents. Please contact the business support team.",
        "lang_inst": "Respond in English."
    },
    "hi": {
        "name": "Hindi",
        "fallback": "मेरे पास उपलब्ध व्यावसायिक दस्तावेज़ों में यह जानकारी नहीं है। कृपया हमारी सहायता टीम से संपर्क करें।",
        "lang_inst": "Respond in clear, natural Hindi (Devanagari script)."
    },
    "mr": {
        "name": "Marathi",
        "fallback": "माझ्याकडे उपलब्ध व्यवसाय दस्तऐवजांमध्ये ही माहिती नाही. कृपया व्यवसाय समर्थन कार्यसंघाशी संपर्क साधा.",
        "lang_inst": "Respond in clear, natural Marathi (Devanagari script)."
    }
}

STOP_WORDS = {
    "what", "is", "are", "the", "a", "an", "in", "on", "at", "for", "to", "of",
    "and", "or", "how", "does", "do", "can", "you", "your", "me", "i", "it",
    "this", "that", "there", "their", "our", "we", "be", "with", "as", "by"
}

class RAGPipeline:
    def __init__(self):
        self.client: Optional[OpenAI] = None
        if settings.OPENAI_API_KEY:
            try:
                self.client = OpenAI(api_key=settings.OPENAI_API_KEY)
            except Exception as e:
                print(f"[RAGPipeline] OpenAI client initialization error: {e}")

    def analyze_sentiment(self, text: str) -> str:
        """
        Lightweight sentiment classification: positive, neutral, negative.
        Used for prioritization and dashboard analytics.
        """
        t = text.lower()
        positive_words = ["great", "good", "excellent", "awesome", "thanks", "thank", "helpful", "perfect", "love", "fast", "best"]
        negative_words = ["bad", "terrible", "worst", "broken", "scam", "cheat", "fraud", "horrible", "angry", "poor", "issue", "problem", "disappointed", "refund"]

        pos_count = sum(1 for w in positive_words if re.search(r'\b' + re.escape(w) + r'\b', t))
        neg_count = sum(1 for w in negative_words if re.search(r'\b' + re.escape(w) + r'\b', t))

        if neg_count > pos_count:
            return "negative"
        elif pos_count > neg_count:
            return "positive"
        return "neutral"

    def _generate_fallback_response(
        self,
        language: str,
        custom_fallback: Optional[str] = None
    ) -> str:
        if custom_fallback:
            return custom_fallback
        lang_config = LANGUAGE_PROMPTS.get(language, LANGUAGE_PROMPTS["en"])
        return lang_config["fallback"]

    def _build_context_prompt(self, chunks: List[Dict[str, Any]], graph_triples: List[Dict[str, Any]]) -> str:
        context_parts = []
        for idx, c in enumerate(chunks, 1):
            meta = c.get("metadata", {})
            doc_name = meta.get("document_name", "Document")
            page_num = meta.get("page_number", 1)
            text = c.get("chunk_text", "").strip()
            context_parts.append(f"[Document {idx}: {doc_name} (Page {page_num})]\n{text}\n")

        if graph_triples:
            context_parts.append("\n[Verified Relationship Facts]:")
            for t in graph_triples:
                context_parts.append(f"- {t.get('subject')} {t.get('predicate')} {t.get('object')} ({t.get('raw_context', '')})")

        return "\n".join(context_parts)

    def _generate_local_extractive_answer(
        self,
        query: str,
        chunks: List[Dict[str, Any]],
        language: str,
        fallback_msg: str
    ) -> Tuple[str, str]:
        """
        Deterministic, grounded fallback answer extractor used when OpenAI API is not configured.
        Extracts verbatim sentences with highest content term overlap from retrieved chunks.
        Never hallucinates outside the retrieved text.
        """
        if not chunks:
            return fallback_msg, "unanswered_fallback"

        all_query_words = set(re.findall(r'\b\w+\b', query.lower()))
        content_words = all_query_words - STOP_WORDS
        
        # Expand cross-lingual mapped terms
        for token in list(content_words):
            if token in CROSS_LINGUAL_MAPPINGS:
                content_words.update(CROSS_LINGUAL_MAPPINGS[token])

        if not content_words:
            content_words = all_query_words

        is_non_latin = any(ord(c) > 127 for c in query)
        matched_sentences = []

        for chunk in chunks:
            text = chunk.get("chunk_text", "")
            sentences = re.split(r'(?<=[.!?\n])\s+', text)
            for s in sentences:
                s_clean = s.strip()
                if len(s_clean) < 15:
                    continue
                s_words = set(re.findall(r'\b\w+\b', s_clean.lower()))
                overlap = len(content_words.intersection(s_words))
                if overlap > 0:
                    matched_sentences.append((overlap, s_clean))

        if not matched_sentences:
            if is_non_latin and chunks:
                # Take key sentences from top chunk
                top_text = chunks[0].get("chunk_text", "")
                top_sents = [s.strip() for s in re.split(r'(?<=[.!?\n])\s+', top_text) if len(s.strip()) > 15]
                matched_sentences = [(1, s) for s in top_sents[:2]]
            else:
                return fallback_msg, "unanswered_fallback"

        matched_sentences.sort(key=lambda x: x[0], reverse=True)
        top_sentences = [s for _, s in matched_sentences[:3]]
        answer_body = " ".join(top_sentences)

        prefixes = {
            "en": "Based on the business documents:",
            "hi": "व्यावसायिक दस्तावेज़ों के अनुसार:",
            "mr": "व्यावसायिक दस्तऐवजांनुसार:"
        }
        prefix = prefixes.get(language, prefixes["en"])
        return f"{prefix} {answer_body}", "grounded"

    def execute_rag(
        self,
        query: str,
        business_id: str,
        language: str = "en",
        conversation_id: Optional[str] = None,
        custom_instructions: Optional[str] = None,
        custom_fallback: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Complete end-to-end production RAG execution pipeline:
        1. Query classification (Agentic router)
        2. Guardrail check (Out of domain check)
        3. Hybrid retrieval (Semantic + BM25)
        4. Cross-Encoder reranking
        5. Graph RAG entity augmentation (if applicable)
        6. Context validation & Evidence thresholding
        7. Grounded LLM generation
        8. Source attribution & Unanswered question logging
        """
        start_time = datetime.now(timezone.utc)
        lang_config = LANGUAGE_PROMPTS.get(language, LANGUAGE_PROMPTS["en"])
        fallback_text = self._generate_fallback_response(language, custom_fallback)
        sentiment = self.analyze_sentiment(query)

        # Step 1: Agentic Query Routing
        route_info = agentic_router.route_query(query)
        if route_info.get("is_out_of_domain"):
            self._log_unanswered_question(business_id, conversation_id, query)
            return {
                "message": fallback_text,
                "answer_status": "unanswered_fallback",
                "source_documents": [],
                "sentiment": sentiment,
                "suggested_followups": ["What products do you offer?", "What is your pricing?", "What is your return policy?"],
                "created_at": datetime.now(timezone.utc).isoformat()
            }

        # Step 2: Hybrid Retrieval + Cross-Encoder Reranking
        retrieved_chunks = hybrid_retriever.retrieve(
            query=query,
            business_id=business_id,
            top_k=4
        )

        # Step 3: Graph RAG traversal (if query involves relationships)
        graph_triples = []
        if route_info["intent"] in ["pricing", "refund_policy", "delivery_policy", "business_info"]:
            graph_triples = knowledge_graph.search_graph(query, business_id)

        # Step 4: Relevance Thresholding & Grounding Check
        # If no chunks retrieved, score is too weak (< 0.25), or zero content overlap, trigger unknown fallback
        max_score = max([c.get("rerank_score", c.get("similarity_score", 0)) for c in retrieved_chunks], default=0.0)
        has_content_overlap = any(c.get("content_overlap_count", 1) > 0 for c in retrieved_chunks)
        is_non_latin = any(ord(c) > 127 for c in query)

        if not retrieved_chunks or max_score < 0.20 or (not has_content_overlap and not is_non_latin and not graph_triples):
            self._log_unanswered_question(business_id, conversation_id, query)
            return {
                "message": fallback_text,
                "answer_status": "unanswered_fallback",
                "source_documents": [],
                "sentiment": sentiment,
                "suggested_followups": ["What products do you offer?", "What is your pricing?", "What is your return policy?"],
                "created_at": datetime.now(timezone.utc).isoformat()
            }

        # Prepare source references
        source_refs: List[SourceDocumentReference] = []
        seen_docs = set()
        for c in retrieved_chunks:
            meta = c.get("metadata", {})
            doc_id = meta.get("document_id", "")
            doc_name = meta.get("document_name", "Business Document")
            page_num = meta.get("page_number", 1)
            key = f"{doc_id}_{page_num}"
            if key not in seen_docs:
                seen_docs.add(key)
                source_refs.append(SourceDocumentReference(
                    document_id=doc_id,
                    document_name=doc_name,
                    page_number=page_num,
                    similarity_score=c.get("rerank_score", c.get("similarity_score")),
                    snippet=c.get("chunk_text", "")[:180] + "..."
                ))

        # Step 5: LLM Generation
        context_str = self._build_context_prompt(retrieved_chunks, graph_triples)

        system_instruction = (
            "You are a professional business customer support assistant.\n"
            "CRITICAL INSTRUCTIONS:\n"
            "1. Answer ONLY using the provided retrieved business documents and verified facts.\n"
            "2. Never use your general knowledge to invent or fabricate business-specific information, prices, policies, or contacts.\n"
            "3. If the provided context does not contain sufficient facts to answer the question accurately, "
            f"you MUST reply strictly with: '{fallback_text}'\n"
            "4. Never hallucinate or extrapolate.\n"
            f"5. {lang_config['lang_inst']}\n"
            f"{custom_instructions or ''}"
        )

        user_prompt = f"Customer Question: {query}\n\nRetrieved Business Documents Context:\n{context_str}\n\nAnswer:"

        if self.client and settings.OPENAI_API_KEY:
            try:
                response = self.client.chat.completions.create(
                    model=settings.OPENAI_MODEL,
                    messages=[
                        {"role": "system", "content": system_instruction},
                        {"role": "user", "content": user_prompt}
                    ],
                    temperature=0.1,  # Strict precision
                    max_tokens=600
                )
                answer = response.choices[0].message.content.strip()

                # Step 6: Grounding validation
                if fallback_text.lower() in answer.lower() or "i don't have this information" in answer.lower():
                    self._log_unanswered_question(business_id, conversation_id, query)
                    return {
                        "message": fallback_text,
                        "answer_status": "unanswered_fallback",
                        "source_documents": [],
                        "sentiment": sentiment,
                        "suggested_followups": ["Contact Support", "View FAQs"],
                        "created_at": datetime.now(timezone.utc).isoformat()
                    }

                status = "grounded"
            except Exception as e:
                print(f"[RAGPipeline] OpenAI API call failed: {e}. Using deterministic extractive fallback.")
                answer, status = self._generate_local_extractive_answer(query, retrieved_chunks, language, fallback_text)
                if status == "unanswered_fallback":
                    self._log_unanswered_question(business_id, conversation_id, query)
        else:
            answer, status = self._generate_local_extractive_answer(query, retrieved_chunks, language, fallback_text)
            if status == "unanswered_fallback":
                self._log_unanswered_question(business_id, conversation_id, query)

        # Generate suggested followups
        suggested = self._extract_suggested_followups(retrieved_chunks)

        return {
            "message": answer,
            "answer_status": status,
            "source_documents": [s.model_dump() for s in source_refs] if status == "grounded" else [],
            "sentiment": sentiment,
            "suggested_followups": suggested,
            "created_at": datetime.now(timezone.utc).isoformat()
        }

    def _log_unanswered_question(self, business_id: str, conversation_id: Optional[str], question: str):
        """Logs an unsupported or unanswered question for owner review."""
        try:
            col = db_manager.get_collection("unanswered_questions")
            # Avoid logging exact duplicate within the conversation
            existing = col.find_one({
                "business_id": str(business_id),
                "question": question,
                "resolution_status": "pending"
            })
            if not existing:
                col.insert_one({
                    "business_id": str(business_id),
                    "conversation_id": str(conversation_id or "direct_chat"),
                    "question": question,
                    "resolution_status": "pending",
                    "resolution_notes": None,
                    "created_at": datetime.now(timezone.utc).isoformat()
                })
        except Exception as e:
            print(f"[RAGPipeline] Error logging unanswered question: {e}")

    def _extract_suggested_followups(self, chunks: List[Dict[str, Any]]) -> List[str]:
        suggestions = []
        for c in chunks:
            text = c.get("chunk_text", "")
            # Look for lines ending with question marks in document text
            questions = re.findall(r'([A-Z][^\n\?]+\?)', text)
            for q in questions:
                clean_q = q.strip()
                if 10 < len(clean_q) < 80 and clean_q not in suggestions:
                    suggestions.append(clean_q)
                    if len(suggestions) >= 3:
                        return suggestions
        if not suggestions:
            return ["Can you provide more details?", "How can I contact support?", "What are your business hours?"]
        return suggestions

rag_pipeline = RAGPipeline()
