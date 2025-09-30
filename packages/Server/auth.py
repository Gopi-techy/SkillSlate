"""
JWT Authentication utilities
"""
from jose import JWTError, jwt
from datetime import datetime, timedelta
from functools import wraps
from flask import request, jsonify
import logging

logger = logging.getLogger(__name__)

class AuthManager:
    """Authentication manager for JWT operations"""
    
    def __init__(self, secret_key, algorithm='HS256', expiration_hours=24):
        self.secret_key = secret_key
        self.algorithm = algorithm
        self.expiration_hours = expiration_hours
    
    def create_access_token(self, user_id, email):
        """Create JWT access token"""
        expires_delta = timedelta(hours=self.expiration_hours)
        expire = datetime.utcnow() + expires_delta
        
        to_encode = {
            "sub": str(user_id),
            "email": email,
            "exp": expire,
            "iat": datetime.utcnow()
        }
        
        try:
            encoded_jwt = jwt.encode(
                to_encode, 
                self.secret_key, 
                algorithm=self.algorithm
            )
            logger.info(f"Access token created for user: {email}")
            return encoded_jwt
        except Exception as e:
            logger.error(f"Error creating access token: {e}")
            return None
    
    def verify_token(self, token):
        """Verify JWT token and return user info"""
        try:
            payload = jwt.decode(
                token, 
                self.secret_key, 
                algorithms=[self.algorithm]
            )
            return payload, None
        except JWTError as e:
            logger.warning(f"Token verification failed: {e}")
            return None, str(e)
        except Exception as e:
            logger.error(f"Unexpected error verifying token: {e}")
            return None, "Token verification failed"
    
    def get_current_user(self):
        """Get current user from Authorization header"""
        auth_header = request.headers.get('Authorization')
        if not auth_header:
            return None, "No authorization header"
        
        try:
            scheme, token = auth_header.split(' ')
            if scheme.lower() != 'bearer':
                return None, "Invalid authorization scheme"
            
            payload, error = self.verify_token(token)
            if error:
                return None, error
            
            return payload, None
        except ValueError:
            return None, "Invalid authorization header format"
    
    def require_auth(self, f):
        """Decorator to require authentication"""
        @wraps(f)
        def decorated_function(*args, **kwargs):
            user_info, error = self.get_current_user()
            if error:
                return jsonify({"error": error}), 401
            
            # Add user info to request context
            request.current_user = user_info
            return f(*args, **kwargs)
        
        return decorated_function

# Legacy functions for backward compatibility
def create_access_token(user_id, email, secret_key, algorithm='HS256', expiration_hours=24):
    """Create JWT access token (legacy function)"""
    auth_manager = AuthManager(secret_key, algorithm, expiration_hours)
    return auth_manager.create_access_token(user_id, email)

def verify_token(token, secret_key, algorithm='HS256'):
    """Verify JWT token and return user info (legacy function)"""
    auth_manager = AuthManager(secret_key, algorithm)
    return auth_manager.verify_token(token)

def get_current_user(secret_key, algorithm='HS256'):
    """Get current user from Authorization header (legacy function)"""
    auth_manager = AuthManager(secret_key, algorithm)
    return auth_manager.get_current_user()

def require_auth(secret_key, algorithm='HS256'):
    """Decorator to require authentication (legacy function)"""
    auth_manager = AuthManager(secret_key, algorithm)
    return auth_manager.require_auth
