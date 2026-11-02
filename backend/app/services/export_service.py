import csv
import io
import json
from typing import List, Dict, Any
from app.database.mongo import db_manager

class ExportService:
    def export_conversations_csv(self, business_id: str) -> str:
        """Generates a CSV string of all messages for the specified business."""
        msg_col = db_manager.get_collection("messages")
        messages = list(msg_col.find({"business_id": str(business_id)}))

        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(["Message ID", "Conversation ID", "Sender", "Message Content", "Answer Status", "Sentiment", "Created At"])

        for m in messages:
            writer.writerow([
                m.get("_id"),
                m.get("conversation_id"),
                m.get("sender"),
                m.get("message", "").replace('\n', ' '),
                m.get("answer_status", ""),
                m.get("sentiment", ""),
                m.get("created_at")
            ])

        return output.getvalue()

    def export_analytics_csv(self, business_id: str) -> str:
        """Generates a CSV string of daily analytics for the specified business."""
        analytics_col = db_manager.get_collection("analytics")
        records = list(analytics_col.find({"business_id": str(business_id)}))

        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(["Date", "Total Chats", "Total Questions", "Answered Count", "Unanswered Count"])

        for r in records:
            writer.writerow([
                r.get("date"),
                r.get("total_chats", 0),
                r.get("total_questions", 0),
                r.get("answered_count", 0),
                r.get("unanswered_count", 0)
            ])

        return output.getvalue()

    def export_unanswered_csv(self, business_id: str) -> str:
        """Generates a CSV string of unanswered questions for the specified business."""
        unans_col = db_manager.get_collection("unanswered_questions")
        records = list(unans_col.find({"business_id": str(business_id)}))

        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(["Question ID", "Conversation ID", "Question", "Status", "Resolution Notes", "Created At"])

        for r in records:
            writer.writerow([
                r.get("_id"),
                r.get("conversation_id"),
                r.get("question", "").replace('\n', ' '),
                r.get("resolution_status", "pending"),
                r.get("resolution_notes", ""),
                r.get("created_at")
            ])

        return output.getvalue()

export_service = ExportService()
