import json
import os
import uuid
import re
import socket
from datetime import datetime
from typing import Any, Dict, List, Optional
import pymongo
from app.core.config import settings

class JSONMongoCollection:
    """
    Lightweight, persistent document collection adhering to PyMongo's interface.
    Used for local development and offline environments, persisting to JSON on disk.
    """
    def __init__(self, db_dir: str, name: str):
        self.name = name
        self.file_path = os.path.join(db_dir, f"{name}.json")
        self._ensure_file()

    def _ensure_file(self):
        if not os.path.exists(self.file_path):
            with open(self.file_path, "w", encoding="utf-8") as f:
                json.dump([], f)

    def _read_data(self) -> List[Dict[str, Any]]:
        try:
            with open(self.file_path, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            return []

    def _write_data(self, data: List[Dict[str, Any]]):
        with open(self.file_path, "w", encoding="utf-8") as f:
            json.dump(data, f, default=str, indent=2)

    def _match(self, doc: Dict[str, Any], filter_query: Dict[str, Any]) -> bool:
        if not filter_query:
            return True
        for key, expected in filter_query.items():
            if key == "$or":
                if not any(self._match(doc, cond) for cond in expected):
                    return False
                continue
            if key == "$and":
                if not all(self._match(doc, cond) for cond in expected):
                    return False
                continue
            val = doc.get(key)
            if isinstance(expected, dict):
                if "$in" in expected and val not in expected["$in"]:
                    return False
                if "$nin" in expected and val in expected["$nin"]:
                    return False
                if "$ne" in expected and val == expected["$ne"]:
                    return False
                if "$gte" in expected and (val is None or val < expected["$gte"]):
                    return False
                if "$lte" in expected and (val is None or val > expected["$lte"]):
                    return False
                if "$gt" in expected and (val is None or val <= expected["$gt"]):
                    return False
                if "$lt" in expected and (val is None or val >= expected["$lt"]):
                    return False
                if "$regex" in expected:
                    pattern = expected["$regex"]
                    flags = re.IGNORECASE if expected.get("$options") == "i" else 0
                    if not re.search(pattern, str(val or ""), flags=flags):
                        return False
            elif val != expected:
                return False
        return True

    def find_one(self, filter_query: Optional[Dict[str, Any]] = None, projection: Optional[Dict[str, Any]] = None) -> Optional[Dict[str, Any]]:
        data = self._read_data()
        filter_query = filter_query or {}
        for doc in data:
            if self._match(doc, filter_query):
                res = dict(doc)
                if projection and projection.get("_id") == 0:
                    res.pop("_id", None)
                return res
        return None

    def find(self, filter_query: Optional[Dict[str, Any]] = None, projection: Optional[Dict[str, Any]] = None):
        data = self._read_data()
        filter_query = filter_query or {}
        matched = [doc for doc in data if self._match(doc, filter_query)]
        return JSONCursor(matched, projection)

    def insert_one(self, document: Dict[str, Any]):
        data = self._read_data()
        doc = dict(document)
        if "_id" not in doc:
            doc["_id"] = str(uuid.uuid4())
        data.append(doc)
        self._write_data(data)
        class InsertResult:
            def __init__(self, inserted_id):
                self.inserted_id = inserted_id
        return InsertResult(doc["_id"])

    def insert_many(self, documents: List[Dict[str, Any]]):
        data = self._read_data()
        inserted_ids = []
        for d in documents:
            doc = dict(d)
            if "_id" not in doc:
                doc["_id"] = str(uuid.uuid4())
            inserted_ids.append(doc["_id"])
            data.append(doc)
        self._write_data(data)
        class InsertManyResult:
            def __init__(self, ids):
                self.inserted_ids = ids
        return InsertManyResult(inserted_ids)

    def update_one(self, filter_query: Dict[str, Any], update_query: Dict[str, Any], upsert: bool = False):
        data = self._read_data()
        matched = False
        modified_count = 0
        for doc in data:
            if self._match(doc, filter_query):
                matched = True
                if "$set" in update_query:
                    for k, v in update_query["$set"].items():
                        doc[k] = v
                if "$inc" in update_query:
                    for k, v in update_query["$inc"].items():
                        doc[k] = doc.get(k, 0) + v
                modified_count = 1
                break
        if not matched and upsert:
            new_doc = dict(filter_query)
            if "$set" in update_query:
                new_doc.update(update_query["$set"])
            if "_id" not in new_doc:
                new_doc["_id"] = str(uuid.uuid4())
            data.append(new_doc)
            modified_count = 1

        if modified_count > 0:
            self._write_data(data)

        class UpdateResult:
            def __init__(self, matched_cnt, mod_cnt):
                self.matched_count = matched_cnt
                self.modified_count = mod_cnt
        return UpdateResult(1 if matched else 0, modified_count)

    def update_many(self, filter_query: Dict[str, Any], update_query: Dict[str, Any]):
        data = self._read_data()
        modified_count = 0
        for doc in data:
            if self._match(doc, filter_query):
                if "$set" in update_query:
                    for k, v in update_query["$set"].items():
                        doc[k] = v
                if "$inc" in update_query:
                    for k, v in update_query["$inc"].items():
                        doc[k] = doc.get(k, 0) + v
                modified_count += 1
        if modified_count > 0:
            self._write_data(data)
        class UpdateResult:
            def __init__(self, mod_cnt):
                self.modified_count = mod_cnt
        return UpdateResult(modified_count)

    def delete_one(self, filter_query: Dict[str, Any]):
        data = self._read_data()
        deleted_count = 0
        new_data = []
        found = False
        for doc in data:
            if not found and self._match(doc, filter_query):
                found = True
                deleted_count = 1
                continue
            new_data.append(doc)
        if deleted_count > 0:
            self._write_data(new_data)
        class DeleteResult:
            def __init__(self, del_cnt):
                self.deleted_count = del_cnt
        return DeleteResult(deleted_count)

    def delete_many(self, filter_query: Dict[str, Any]):
        data = self._read_data()
        new_data = [doc for doc in data if not self._match(doc, filter_query)]
        deleted_count = len(data) - len(new_data)
        if deleted_count > 0:
            self._write_data(new_data)
        class DeleteResult:
            def __init__(self, del_cnt):
                self.deleted_count = del_cnt
        return DeleteResult(deleted_count)

    def count_documents(self, filter_query: Optional[Dict[str, Any]] = None) -> int:
        data = self._read_data()
        filter_query = filter_query or {}
        return sum(1 for doc in data if self._match(doc, filter_query))

    def create_index(self, *args, **kwargs):
        return "index_ok"


class JSONCursor:
    def __init__(self, items: List[Dict[str, Any]], projection: Optional[Dict[str, Any]] = None):
        self._items = items
        self._projection = projection
        self._skip = 0
        self._limit = None

    def sort(self, key_or_list, direction: int = pymongo.ASCENDING):
        if isinstance(key_or_list, list):
            for k, d in reversed(key_or_list):
                reverse = (d == pymongo.DESCENDING or d == -1)
                self._items.sort(key=lambda x: (x.get(k) is None, x.get(k, "")), reverse=reverse)
        elif isinstance(key_or_list, str):
            reverse = (direction == pymongo.DESCENDING or direction == -1)
            self._items.sort(key=lambda x: (x.get(key_or_list) is None, x.get(key_or_list, "")), reverse=reverse)
        return self

    def skip(self, n: int):
        self._skip = n
        return self

    def limit(self, n: int):
        self._limit = n
        return self

    def __iter__(self):
        end = None if self._limit is None else self._skip + self._limit
        for item in self._items[self._skip:end]:
            res = dict(item)
            if self._projection and self._projection.get("_id") == 0:
                res.pop("_id", None)
            yield res

    def to_list(self, length: Optional[int] = None) -> List[Dict[str, Any]]:
        return list(self)


class DatabaseManager:
    def __init__(self):
        self.is_connected = False
        self.is_local_fallback = False
        self.client = None
        self.db = None
        self._collections = {}
        self.init_db()

    def init_db(self):
        # If running against MongoDB Atlas or explicitly configured remote Mongo
        if settings.MONGODB_URI.startswith("mongodb+srv://") or os.environ.get("FORCE_MONGO_CONNECT") == "true":
            try:
                client = pymongo.MongoClient(
                    settings.MONGODB_URI,
                    serverSelectionTimeoutMS=2000,
                    connectTimeoutMS=2000
                )
                client.admin.command('ping')
                self.client = client
                self.db = client[settings.DATABASE_NAME]
                self.is_connected = True
                self.is_local_fallback = False
                self._create_indexes()
                print(f"[DatabaseManager] Connected to MongoDB Atlas cluster.")
                return
            except Exception as e:
                print(f"[DatabaseManager] MongoDB Atlas connection failed ({e}). Falling back to local persistent store.")

        # Default local persistent JSON storage adapter (instant zero-latency startup)
        self.is_connected = True
        self.is_local_fallback = True
        self.db = None

    def _create_indexes(self):
        if self.is_local_fallback or self.db is None:
            return
        try:
            self.db.users.create_index([("email", pymongo.ASCENDING)], unique=True)
            self.db.users.create_index([("business_id", pymongo.ASCENDING)])
            self.db.businesses.create_index([("business_slug", pymongo.ASCENDING)], unique=True)
            self.db.businesses.create_index([("owner_id", pymongo.ASCENDING)])
            self.db.documents.create_index([("business_id", pymongo.ASCENDING)])
            self.db.document_chunks.create_index([("business_id", pymongo.ASCENDING), ("document_id", pymongo.ASCENDING)])
            self.db.conversations.create_index([("business_id", pymongo.ASCENDING)])
            self.db.messages.create_index([("conversation_id", pymongo.ASCENDING)])
            self.db.messages.create_index([("business_id", pymongo.ASCENDING)])
            self.db.unanswered_questions.create_index([("business_id", pymongo.ASCENDING)])
            self.db.support_tickets.create_index([("business_id", pymongo.ASCENDING)])
            self.db.feedback.create_index([("business_id", pymongo.ASCENDING)])
            self.db.chatbot_settings.create_index([("business_id", pymongo.ASCENDING)], unique=True)
            self.db.analytics.create_index([("business_id", pymongo.ASCENDING), ("date", pymongo.ASCENDING)])
        except Exception as ex:
            print(f"[DatabaseManager] Index setup warning: {ex}")

    def get_collection(self, name: str):
        if not self.is_local_fallback and self.db is not None:
            return self.db[name]
        if name not in self._collections:
            self._collections[name] = JSONMongoCollection(settings.LOCAL_DB_DIR, name)
        return self._collections[name]

db_manager = DatabaseManager()

def get_db():
    return db_manager
