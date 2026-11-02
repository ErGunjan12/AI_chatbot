import re
from typing import Dict, Any

class AgenticQueryRouter:
    """
    Lightweight, controlled agentic query router.
    Categorizes customer intents to guide retrieval strategy and prevent out-of-domain drift.
    Never hallucinates or bypasses the knowledge base.
    """
    INTENT_KEYWORDS = {
        "pricing": [
            "price", "cost", "pricing", "rate", "fee", "how much", "charge",
            "subscription", "plan", "discount", "offer", "expensive", "cheap", "inr", "usd", "$"
        ],
        "refund_policy": [
            "refund", "return", "money back", "cancel", "cancellation", "warranty",
            "guarantee", "exchange", "replace", "damaged"
        ],
        "delivery_policy": [
            "delivery", "shipping", "courier", "track", "dispatch", "arrive",
            "delivery time", "how long", "express", "international shipping", "address"
        ],
        "business_info": [
            "address", "location", "contact", "phone", "email", "support hour",
            "working hour", "who are you", "about the company", "founder", "headquarters"
        ],
        "product_info": [
            "product", "feature", "item", "specs", "specification", "version",
            "model", "how does it work", "compatible", "size", "color"
        ],
    }

    OUT_OF_DOMAIN_KEYWORDS = [
        "write code", "python script", "solve math", "weather in", "write an essay",
        "who is the president", "tell me a joke", "recipe for", "translate this sentence",
        "chocolate chip", "cookie", "cake recipe", "capital of", "who was", "who is the",
        "make cookies", "bake", "tiramisu", "recipe"
    ]

    def route_query(self, query: str) -> Dict[str, Any]:
        q_lower = query.lower().strip()

        # Check for obvious out-of-domain queries
        if any(ood in q_lower for ood in self.OUT_OF_DOMAIN_KEYWORDS):
            return {
                "intent": "unknown_unsupported",
                "confidence": 0.95,
                "is_out_of_domain": True,
                "strategy": "direct_fallback",
                "filter_hint": None
            }

        # Score matching intents
        scores: Dict[str, int] = {}
        for intent, keywords in self.INTENT_KEYWORDS.items():
            score = sum(1 for kw in keywords if re.search(r'\b' + re.escape(kw) + r'\b', q_lower))
            if score > 0:
                scores[intent] = score

        if scores:
            best_intent = max(scores, key=scores.get)
            return {
                "intent": best_intent,
                "confidence": min(0.9, 0.5 + 0.15 * scores[best_intent]),
                "is_out_of_domain": False,
                "strategy": "hybrid_reranked",
                "filter_hint": best_intent
            }

        return {
            "intent": "general_faq",
            "confidence": 0.60,
            "is_out_of_domain": False,
            "strategy": "hybrid_reranked",
            "filter_hint": None
        }

agentic_router = AgenticQueryRouter()
