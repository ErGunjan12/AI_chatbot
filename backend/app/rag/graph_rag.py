import re
from typing import List, Dict, Any, Tuple
from app.database.mongo import db_manager

class SimpleKnowledgeGraph:
    """
    Graph RAG module for relationship-dense entities:
    Extracts Subject-Predicate-Object triples from business documents and traverses connected nodes.
    Used selectively when queries require associative entity relationship resolution.
    """
    RELATION_PATTERNS = [
        # Entity has price
        (r'([\w\s]+?)\s+(?:costs|is priced at|price is|costs about)\s+([\$₹€\d,]+(?:\s*(?:per|\/)\s*\w+)?)', "HAS_PRICE"),
        # Entity has refund policy
        (r'([\w\s]+?)\s+(?:has a|comes with a|features a)\s+(\d+[\s-]day(?:\s*money-back)?\s*refund\s*policy)', "HAS_REFUND_POLICY"),
        # Entity delivery timeframe
        (r'([\w\s]+?)\s+(?:delivers in|delivered within|takes)\s+(\d+[\s-](?:to\s*\d+)?\s*(?:business\s*)?days)', "DELIVERY_TIMEFRAME"),
        # Contact / support
        (r'(?:support|contact|help desk)\s+(?:email is|is available at|at)\s+([\w\.-]+@[\w\.-]+\.\w+)', "SUPPORT_EMAIL"),
        (r'(?:support|contact|call us at)\s+(?:is|at|phone)?\s*(\+?[\d\s-]{8,15})', "SUPPORT_PHONE")
    ]

    def extract_triples_from_text(self, text: str, business_id: str, document_id: str) -> List[Dict[str, Any]]:
        triples: List[Dict[str, Any]] = []
        for line in text.split('\n'):
            line = line.strip()
            if not line:
                continue
            for pattern, relation in self.RELATION_PATTERNS:
                matches = re.findall(pattern, line, re.IGNORECASE)
                for m in matches:
                    if isinstance(m, tuple) and len(m) == 2:
                        subj, obj = m[0].strip(), m[1].strip()
                    elif isinstance(m, str):
                        subj, obj = "Business", m.strip()
                    else:
                        continue
                    triples.append({
                        "business_id": business_id,
                        "document_id": document_id,
                        "subject": subj,
                        "predicate": relation,
                        "object": obj,
                        "raw_context": line[:200]
                    })
        return triples

    def store_triples(self, triples: List[Dict[str, Any]]):
        if not triples:
            return
        col = db_manager.get_collection("knowledge_graph_triples")
        col.insert_many(triples)

    def search_graph(self, query: str, business_id: str) -> List[Dict[str, Any]]:
        """
        Traverses matching graph nodes for the query within tenant business boundary.
        """
        col = db_manager.get_collection("knowledge_graph_triples")
        tokens = set(re.findall(r'\b\w+\b', query.lower()))
        if not tokens:
            return []

        all_triples = list(col.find({"business_id": str(business_id)}))
        matched = []
        for t in all_triples:
            subj_tokens = set(re.findall(r'\b\w+\b', t.get("subject", "").lower()))
            obj_tokens = set(re.findall(r'\b\w+\b', t.get("object", "").lower()))
            if tokens.intersection(subj_tokens) or tokens.intersection(obj_tokens):
                matched.append(t)
        return matched[:5]

    def delete_document_triples(self, business_id: str, document_id: str):
        col = db_manager.get_collection("knowledge_graph_triples")
        col.delete_many({"business_id": str(business_id), "document_id": str(document_id)})

knowledge_graph = SimpleKnowledgeGraph()
