from flask import Blueprint, request, jsonify
from flask_bcrypt import Bcrypt
import jwt
from datetime import datetime, timedelta
import os
import requests
from functools import wraps
from models.user import User

# Initialize Blueprint
auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')

# Initialize Bcrypt
bcrypt = Bcrypt()

# JWT configuration
SECRET_KEY = os.environ.get('SECRET_KEY', 'your-secret-key-change-in-production')
TOKEN_EXPIRATION = timedelta(hours=24)

def token_required(f):
    """Decorator to require JWT token for protected routes"""
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('Authorization')
        
        if not token:
            return jsonify({'message': 'Token is missing'}), 401
        
        try:
            # Remove 'Bearer ' prefix if present
            if token.startswith('Bearer '):
                token = token[7:]
            
            data = jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
            current_user = User.find_by_id(data['user_id'])
            
            if not current_user:
                return jsonify({'message': 'User not found'}), 401
                
        except jwt.ExpiredSignatureError:
            return jsonify({'message': 'Token has expired'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'message': 'Invalid token'}), 401
        
        return f(current_user, *args, **kwargs)
    
    return decorated

def generate_token(user_id):
    """Generate JWT token for user"""
    return jwt.encode({
        'user_id': str(user_id),
        'exp': datetime.utcnow() + TOKEN_EXPIRATION
    }, SECRET_KEY, algorithm='HS256')

@auth_bp.route('/register', methods=['POST'])
def register():
    """User registration endpoint"""
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['name', 'email', 'password']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'message': f'{field} is required'}), 400
        
        # Check if user already exists
        existing_user = User.find_by_email(data['email'])
        if existing_user:
            return jsonify({'message': 'User with this email already exists'}), 400
        
        # Hash password
        hashed_password = bcrypt.generate_password_hash(data['password']).decode('utf-8')
        
        # Create user
        user = User(
            name=data['name'],
            email=data['email'],
            password=hashed_password,
            github_connected=False
        )
        
        # Save user to database
        user_id = user.save()
        
        # Generate JWT token
        token = generate_token(user_id)
        
        # Return user data (without password)
        user_data = User.to_dict(User.find_by_id(user_id))
        user_data['token'] = token
        
        return jsonify({
            'message': 'User registered successfully',
            'user': user_data
        }), 201
        
    except Exception as e:
        return jsonify({'message': f'Registration failed: {str(e)}'}), 500

@auth_bp.route('/login', methods=['POST'])
def login():
    """User login endpoint"""
    try:
        data = request.get_json()
        
        # Validate required fields
        if not data.get('email') or not data.get('password'):
            return jsonify({'message': 'Email and password are required'}), 400
        
        # Find user by email
        user_doc = User.find_by_email(data['email'])
        if not user_doc:
            return jsonify({'message': 'Invalid email or password'}), 401
        
        # Check password
        if not bcrypt.check_password_hash(user_doc['password'], data['password']):
            return jsonify({'message': 'Invalid email or password'}), 401
        
        # Generate JWT token
        token = generate_token(user_doc['_id'])
        
        # Update last login time
        User.update_last_login(user_doc['_id'])
        
        # Return user data (without password)
        user_data = User.to_dict(user_doc)
        user_data['token'] = token
        
        return jsonify({
            'message': 'Login successful',
            'user': user_data
        }), 200
        
    except Exception as e:
        return jsonify({'message': f'Login failed: {str(e)}'}), 500

@auth_bp.route('/profile', methods=['GET'])
@token_required
def get_profile(current_user):
    """Get user profile endpoint"""
    try:
        user_data = User.to_dict(current_user)
        return jsonify({'user': user_data}), 200
        
    except Exception as e:
        return jsonify({'message': f'Failed to get profile: {str(e)}'}), 500

@auth_bp.route('/logout', methods=['POST'])
@token_required
def logout(current_user):
    """User logout endpoint"""
    # In a more complex system, you might want to blacklist the token
    # For now, we'll just return a success message
    return jsonify({'message': 'Logout successful'}), 200

@auth_bp.route('/verify', methods=['GET'])
@token_required
def verify_token(current_user):
    """Verify JWT token endpoint"""
    user_data = User.to_dict(current_user)
    return jsonify({
        'message': 'Token is valid',
        'user': user_data
    }), 200

@auth_bp.route('/github/login', methods=['POST'])
def github_login():
    """Login or register with GitHub access token"""
    try:
        data = request.get_json()
        access_token = data.get('access_token')
        
        if not access_token:
            return jsonify({'message': 'GitHub access token is required'}), 400
            
        # Get GitHub user info
        headers = {
            'Authorization': f'Bearer {access_token}',
            'Accept': 'application/vnd.github+json'
        }
        response = requests.get('https://api.github.com/user', headers=headers)
        if not response.ok:
            return jsonify({'message': 'Failed to get GitHub user info'}), 400
            
        github_user = response.json()
        
        # Get GitHub user email
        emails_response = requests.get('https://api.github.com/user/emails', headers=headers)
        if not emails_response.ok:
            return jsonify({'message': 'Failed to get GitHub user emails'}), 400
            
        github_emails = emails_response.json()
        primary_email = next((email['email'] for email in github_emails if email['primary']), None)
        if not primary_email:
            return jsonify({'message': 'No primary email found in GitHub account'}), 400
            
        # Find or create user by email
        user_doc = User.find_by_email(primary_email)
        if user_doc:
            # EXISTING USER: Merge GitHub account with existing email/password account
            # Update the github_connected flag
            User.update_github_connection(user_doc['_id'], True)
            print(f"✅ Linked GitHub account to existing user: {primary_email}")
        else:
            # NEW USER: Create account from GitHub
            user_doc = User(
                name=github_user['name'] or github_user['login'],
                email=primary_email,
                password=bcrypt.generate_password_hash(os.urandom(32).hex()).decode('utf-8'),  # Random password for GitHub-only accounts
                github_connected=True
            )
            user_id = user_doc.save()
            user_doc = User.find_by_id(user_id)
            print(f"✅ Created new user from GitHub: {primary_email}")
            
        # Generate JWT token for the user
        token = generate_token(user_doc['_id'])
        
        # Update last login time
        User.update_last_login(user_doc['_id'])
        
        # Return user data with token
        user_data = User.to_dict(user_doc)
        user_data['token'] = token
        
        return jsonify({
            'message': 'GitHub login successful',
            'user': user_data
        }), 200
        
    except Exception as e:
        print(f"❌ GitHub login error: {str(e)}")
        return jsonify({'message': f'GitHub login failed: {str(e)}'}), 500
