from flask import Flask, request, jsonify
from flask_cors import CORS
from config import Config
from models import Database
from auth import create_access_token, require_auth, verify_token
import re

app = Flask(__name__)
CORS(app, origins=[Config.FRONTEND_URL])

# Initialize database
db = Database(Config.MONGODB_URI, Config.MONGODB_DATABASE)

def validate_email(email):
    """Basic email validation"""
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None

def validate_password(password):
    """Basic password validation"""
    return len(password) >= 6

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({"status": "healthy", "message": "SkillSlate API is running"})

@app.route('/api/auth/signup', methods=['POST'])
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
        token = create_access_token(user['_id'], user['email'])
        
        return jsonify({
            "message": "User created successfully",
            "user": user,
            "token": token
        }), 201
        
    except Exception as e:
        return jsonify({"error": "Internal server error"}), 500

@app.route('/api/auth/login', methods=['POST'])
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
        token = create_access_token(user['_id'], user['email'])
        
        return jsonify({
            "message": "Login successful",
            "user": user,
            "token": token
        }), 200
        
    except Exception as e:
        return jsonify({"error": "Internal server error"}), 500

@app.route('/api/auth/verify', methods=['GET'])
@require_auth
def verify_token_endpoint():
    """Verify token and get user info"""
    try:
        user_info = request.current_user
        user_id = user_info['sub']
        
        # Get user from database
        user = db.get_user_by_id(user_id)
        if not user:
            return jsonify({"error": "User not found"}), 404
        
        return jsonify({
            "message": "Token is valid",
            "user": user
        }), 200
        
    except Exception as e:
        return jsonify({"error": "Internal server error"}), 500

@app.route('/api/auth/logout', methods=['POST'])
@require_auth
def logout():
    """User logout endpoint (client-side token removal)"""
    return jsonify({"message": "Logout successful"}), 200

@app.route('/api/user/profile', methods=['GET'])
@require_auth
def get_profile():
    """Get user profile"""
    try:
        user_info = request.current_user
        user_id = user_info['sub']
        
        user = db.get_user_by_id(user_id)
        if not user:
            return jsonify({"error": "User not found"}), 404
        
        return jsonify({"user": user}), 200
        
    except Exception as e:
        return jsonify({"error": "Internal server error"}), 500

@app.route('/api/user/profile', methods=['PUT'])
@require_auth
def update_profile():
    """Update user profile"""
    try:
        user_info = request.current_user
        user_id = user_info['sub']
        data = request.get_json()
        
        # Allowed fields for update
        allowed_fields = ['name', 'github_connected']
        update_data = {}
        
        for field in allowed_fields:
            if field in data:
                update_data[field] = data[field]
        
        if not update_data:
            return jsonify({"error": "No valid fields to update"}), 400
        
        # Update user
        success = db.update_user(user_id, update_data)
        if not success:
            return jsonify({"error": "Failed to update user"}), 500
        
        # Get updated user
        user = db.get_user_by_id(user_id)
        
        return jsonify({
            "message": "Profile updated successfully",
            "user": user
        }), 200
        
    except Exception as e:
        return jsonify({"error": "Internal server error"}), 500

@app.errorhandler(404)
def not_found(error):
    return jsonify({"error": "Endpoint not found"}), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({"error": "Internal server error"}), 500

if __name__ == '__main__':
    print(f"Starting SkillSlate API server...")
    print(f"Frontend URL: {Config.FRONTEND_URL}")
    print(f"MongoDB URI: {Config.MONGODB_URI}")
    app.run(debug=Config.FLASK_DEBUG, port=Config.FLASK_PORT, host='0.0.0.0')
