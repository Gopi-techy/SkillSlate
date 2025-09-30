"""
Authentication API routes
"""
from flask import Blueprint, request, jsonify
from src.database.connection import Database
from src.auth.jwt_manager import AuthManager
from src.config.settings import Config
import re
import logging

logger = logging.getLogger(__name__)

# Create blueprint
auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')

# Initialize services
db = Database(Config.MONGODB_URI, Config.MONGODB_DATABASE)
auth_manager = AuthManager(Config.JWT_SECRET_KEY, Config.JWT_ALGORITHM, Config.JWT_EXPIRATION_HOURS)

def validate_email(email):
    """Basic email validation"""
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None

def validate_password(password):
    """Basic password validation"""
    return len(password) >= 6

@auth_bp.route('/signup', methods=['POST'])
def signup():
    """User registration endpoint"""
    try:
        data = request.get_json()
        
        # Validate required fields
        if not data or not data.get('email') or not data.get('password'):
            return jsonify({"error": "Email and password are required"}), 400
        
        email = data['email'].lower().strip()
        password = data['password']
        name = data.get('name', '').strip()
        
        # Validate email format
        if not validate_email(email):
            return jsonify({"error": "Invalid email format"}), 400
        
        # Validate password strength
        if not validate_password(password):
            return jsonify({"error": "Password must be at least 6 characters long"}), 400
        
        # Create user
        user, error = db.create_user(email, password, name)
        if error:
            return jsonify({"error": error}), 400
        
        # Create access token
        token = auth_manager.create_access_token(user['_id'], user['email'])
        if not token:
            return jsonify({"error": "Failed to create access token"}), 500
        
        logger.info(f"User registered successfully: {email}")
        return jsonify({
            "message": "User created successfully",
            "user": user,
            "token": token
        }), 201
        
    except Exception as e:
        logger.error(f"Signup error: {e}")
        return jsonify({"error": "Internal server error"}), 500

@auth_bp.route('/login', methods=['POST'])
def login():
    """User login endpoint"""
    try:
        data = request.get_json()
        
        # Validate required fields
        if not data or not data.get('email') or not data.get('password'):
            return jsonify({"error": "Email and password are required"}), 400
        
        email = data['email'].lower().strip()
        password = data['password']
        
        # Authenticate user
        user, error = db.authenticate_user(email, password)
        if error:
            return jsonify({"error": error}), 401
        
        # Create access token
        token = auth_manager.create_access_token(user['_id'], user['email'])
        if not token:
            return jsonify({"error": "Failed to create access token"}), 500
        
        logger.info(f"User logged in successfully: {email}")
        return jsonify({
            "message": "Login successful",
            "user": user,
            "token": token
        }), 200
        
    except Exception as e:
        logger.error(f"Login error: {e}")
        return jsonify({"error": "Internal server error"}), 500

@auth_bp.route('/verify', methods=['GET'])
@auth_manager.require_auth
def verify_token_endpoint():
    """Verify token and get user info"""
    try:
        user_info = request.current_user
        user_id = user_info['sub']
        
        # Get user from database
        user = db.get_user_by_id(user_id)
        if not user:
            return jsonify({"error": "User not found"}), 404
        
        logger.info(f"Token verified for user: {user['email']}")
        return jsonify({
            "message": "Token is valid",
            "user": user
        }), 200
        
    except Exception as e:
        logger.error(f"Token verification error: {e}")
        return jsonify({"error": "Internal server error"}), 500

@auth_bp.route('/logout', methods=['POST'])
@auth_manager.require_auth
def logout():
    """User logout endpoint (client-side token removal)"""
    try:
        user_info = request.current_user
        logger.info(f"User logged out: {user_info.get('email', 'Unknown')}")
        return jsonify({"message": "Logout successful"}), 200
    except Exception as e:
        logger.error(f"Logout error: {e}")
        return jsonify({"error": "Internal server error"}), 500
