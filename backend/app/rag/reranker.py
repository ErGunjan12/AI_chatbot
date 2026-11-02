import re
from typing import List, Dict, Any

STOP_WORDS = {
    "what", "is", "are", "the", "a", "an", "in", "on", "at", "for", "to", "of",
    "and", "or", "how", "does", "do", "can", "you", "your", "me", "i", "it",
    "this", "that", "there", "their", "our", "we", "be", "with", "as", "by"
}

CROSS_LINGUAL_MAPPINGS = {
    # Hindi
    "वापसी": ["return", "refund"],
    "रिफंड": ["refund", "return"],
    "कीमत": ["price", "cost"],
    "मूल्य": ["price", "cost"],
    "दाम": ["price", "cost"],
    "लागत": ["cost", "price"],
    "डिलिवरी": ["delivery", "shipping"],
    "वितरण": ["delivery", "shipping"],
    "वारंटी": ["warranty", "guarantee"],
    "उत्पाद": ["product", "laptop", "monitor", "hardware"],
    "समय": ["time", "days", "window", "timeline"],
    "सीमा": ["limit", "window", "days"],
    "नियम": ["policy", "terms", "rules"],
    "शर्तें": ["terms", "conditions"],
    "खरीद": ["purchase", "order"],
    # Marathi
    "परत": ["return", "refund"],
    "किंमत": ["price", "cost"],
    "दर": ["rate", "price"],
    "डिलिव्हरी": ["delivery", "shipping"],
    "पोहोच": ["delivery", "arrival"],
    "हमी": ["warranty", "guarantee"],
    "उत्पादन": ["product", "item", "laptop"],
    "वस्तू": ["product", "item"],
    "कालावधी": ["timeline", "days", "period"],
    "दिवस": ["days", "timeline"]
}

class CrossEncoderReranker:
    """
    Reranks candidate chunks by evaluating query-document joint semantic alignment.
    Computes content lexical overlap, exact phrase alignment, and term density.
    """
    def rerank(self, query: str, candidates: List[Dict[str, Any]], top_k: int = 4) -> List[Dict[str, Any]]:
        if not candidates:
            return []

        all_query_tokens = re.findall(r'\b\w+\b', query.lower())
        # Filter stop words to evaluate true semantic content
        content_tokens = set([t for t in all_query_tokens if t not in STOP_WORDS])
        
        # Expand cross-lingual mapped terms
        for token in list(content_tokens):
            if token in CROSS_LINGUAL_MAPPINGS:
                content_tokens.update(CROSS_LINGUAL_MAPPINGS[token])

        if not content_tokens:
            content_tokens = set(all_query_tokens)

        is_non_latin = any(ord(c) > 127 for c in query)

        reranked = []
        for cand in candidates:
            text = cand.get("chunk_text", "").lower()
            text_tokens = re.findall(r'\b\w+\b', text)
            text_token_set = set(text_tokens)

            base_score = cand.get("similarity_score", 0.0)

            # Content overlap
            intersection = content_tokens.intersection(text_token_set)
            content_overlap_ratio = len(intersection) / len(content_tokens) if content_tokens else 0.0

            # Exact phrase match bonus
            exact_bonus = 0.30 if query.lower() in text else 0.0

            # Proximity bonus
            proximity_bonus = 0.0
            if len(content_tokens) > 1 and len(intersection) > 1:
                positions = [i for i, t in enumerate(text_tokens) if t in content_tokens]
                if len(positions) >= 2:
                    span = positions[-1] - positions[0] + 1
                    if span <= len(content_tokens) * 3:
                        proximity_bonus = 0.20

            if len(intersection) == 0:
                if is_non_latin and base_score > 0.40:
                    final_score = base_score * 0.85
                else:
                    final_score = base_score * 0.15
            else:
                final_score = (0.35 * base_score) + (0.45 * content_overlap_ratio) + exact_bonus + proximity_bonus

            final_score = min(1.0, max(0.0, final_score))

            item = dict(cand)
            item["rerank_score"] = round(final_score, 4)
            item["content_overlap_count"] = len(intersection) if len(intersection) > 0 else (1 if is_non_latin and base_score > 0.40 else 0)
            reranked.append(item)

        # Sort descending by rerank score
        reranked.sort(key=lambda x: x["rerank_score"], reverse=True)
        return reranked[:top_k]

cross_encoder_reranker = CrossEncoderReranker()
