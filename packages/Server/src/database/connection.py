"""
Database connection and operations
"""
from datetime import datetime
from pymongo import MongoClient
from bson import ObjectId
import bcrypt
import logging

logger = logging.getLogger(__name__)

class Database:
    """Database connection and user operations"""
    
    def __init__(self, uri, database_name):
        self.client = MongoClient(uri)
        self.db = self.client[database_name]
        self.users = self.db.users
        
        # Create indexes
        self._create_indexes()
    
    def _create_indexes(self):
        """Create database indexes for better performance"""
        try:
            # Create unique index on email
            self.users.create_index("email", unique=True)
            logger.info("Database indexes created successfully")
        except Exception as e:
            logger.warning(f"Could not create indexes: {e}")
    
    def create_user(self, email, password, name=None):
        """Create a new user with hashed password"""
        try:
            # Check if user already exists
            if self.users.find_one({"email": email}):
                return None, "User already exists"
            
            # Hash password
            salt = bcrypt.gensalt()
            hashed_password = bcrypt.hashpw(password.encode('utf-8'), salt)
            
            # Create user document
            user_data = {
                "email": email,
                "password": hashed_password,
                "name": name or "",
                "github_connected": False,
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            }
            
            result = self.users.insert_one(user_data)
            user_data["_id"] = str(result.inserted_id)
            
            # Remove password from response
            del user_data["password"]
            logger.info(f"User created successfully: {email}")
            return user_data, None
            
        except Exception as e:
            logger.error(f"Error creating user: {e}")
            return None, str(e)
    
    def authenticate_user(self, email, password):
        """Authenticate user with email and password"""
        try:
            user = self.users.find_one({"email": email})
            
            if not user:
                return None, "Invalid credentials"
            
            # Check password
            if bcrypt.checkpw(password.encode('utf-8'), user["password"]):
                # Remove password from response
                user["_id"] = str(user["_id"])
                del user["password"]
                logger.info(f"User authenticated successfully: {email}")
                return user, None
            else:
                return None, "Invalid credentials"
                
        except Exception as e:
            logger.error(f"Error authenticating user: {e}")
            return None, "Authentication failed"
    
    def get_user_by_id(self, user_id):
        """Get user by ID"""
        try:
            user = self.users.find_one({"_id": ObjectId(user_id)})
            if user:
                user["_id"] = str(user["_id"])
                # Remove password if it exists
                if "password" in user:
                    del user["password"]
            return user
        except Exception as e:
            logger.error(f"Error getting user by ID: {e}")
            return None
    
    def update_user(self, user_id, update_data):
        """Update user data"""
        try:
            update_data["updated_at"] = datetime.utcnow()
            result = self.users.update_one(
                {"_id": ObjectId(user_id)},
                {"$set": update_data}
            )
            return result.modified_count > 0
        except Exception as e:
            logger.error(f"Error updating user: {e}")
            return False
    
    def delete_user(self, user_id):
        """Delete user account"""
        try:
            result = self.users.delete_one({"_id": ObjectId(user_id)})
            return result.deleted_count > 0
        except Exception as e:
            logger.error(f"Error deleting user: {e}")
            return False
    
    def get_user_stats(self, user_id):
        """Get user statistics"""
        try:
            user = self.get_user_by_id(user_id)
            if not user:
                return None
            
            # Add any additional stats here
            stats = {
                "account_age_days": (datetime.utcnow() - user["created_at"]).days,
                "github_connected": user.get("github_connected", False)
            }
            
            return stats
        except Exception as e:
            logger.error(f"Error getting user stats: {e}")
            return None
