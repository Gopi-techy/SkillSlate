from datetime import datetime
from bson import ObjectId
from config.database import db_instance

class User:
    def __init__(self, name, email, password=None, github_connected=False):
        self.name = name
        self.email = email
        self.password = password
        self.github_connected = github_connected
        self.created_at = datetime.utcnow()
        self.updated_at = datetime.utcnow()
        self.last_login = None
    
    @staticmethod
    def get_collection():
        """Get the users collection"""
        return db_instance.get_collection('users')
    
    def save(self):
        """Save user to database"""
        user_doc = {
            'name': self.name,
            'email': self.email,
            'password': self.password,
            'githubConnected': self.github_connected,
            'createdAt': self.created_at,
            'updatedAt': self.updated_at,
            'lastLogin': self.last_login
        }
        
        collection = self.get_collection()
        result = collection.insert_one(user_doc)
        return result.inserted_id
    
    @staticmethod
    def find_by_email(email):
        """Find user by email"""
        collection = User.get_collection()
        return collection.find_one({'email': email})
    
    @staticmethod
    def find_by_id(user_id):
        """Find user by ID"""
        collection = User.get_collection()
        return collection.find_one({'_id': ObjectId(user_id)})
    
    @staticmethod
    def update_last_login(user_id):
        """Update user's last login time"""
        collection = User.get_collection()
        collection.update_one(
            {'_id': ObjectId(user_id)},
            {'$set': {'lastLogin': datetime.utcnow()}}
        )
    
    @staticmethod
    def update_github_connection(user_id, connected):
        """Update user's GitHub connection status"""
        collection = User.get_collection()
        collection.update_one(
            {'_id': ObjectId(user_id)},
            {'$set': {'githubConnected': connected, 'updatedAt': datetime.utcnow()}}
        )
    
    @staticmethod
    def to_dict(user_doc):
        """Convert user document to dictionary (without password)"""
        if not user_doc:
            return None
        
        return {
            'id': str(user_doc['_id']),
            'name': user_doc['name'],
            'email': user_doc['email'],
            'githubConnected': user_doc.get('githubConnected', False),
            'createdAt': user_doc.get('createdAt', '').isoformat() if user_doc.get('createdAt') else None,
            'lastLogin': user_doc.get('lastLogin', '').isoformat() if user_doc.get('lastLogin') else None
        }
