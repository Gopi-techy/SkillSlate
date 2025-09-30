from pymongo import MongoClient
import os

class Database:
    def __init__(self):
        self.mongodb_uri = os.environ.get('MONGODB_URI', 'mongodb://localhost:27017/')
        self.database_name = os.environ.get('DATABASE_NAME', 'skillslate')
        self.client = None
        self.db = None
    
    def connect(self):
        """Connect to MongoDB"""
        try:
            self.client = MongoClient(self.mongodb_uri)
            self.db = self.client[self.database_name]
            # Test connection
            self.client.admin.command('ping')
            print(f"✅ Connected to MongoDB: {self.mongodb_uri}")
            return True
        except Exception as e:
            print(f"❌ Failed to connect to MongoDB: {e}")
            return False
    
    def disconnect(self):
        """Disconnect from MongoDB"""
        if self.client:
            self.client.close()
            print("🔌 Disconnected from MongoDB")
    
    def get_collection(self, collection_name):
        """Get a collection from the database"""
        if self.db is not None:
            return self.db[collection_name]
        return None

# Global database instance
db_instance = Database()
