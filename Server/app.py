from flask import Flask, jsonify
from flask_cors import CORS
from datetime import datetime
import os
from config.database import db_instance
from routes.auth import auth_bp
from routes.github import github_bp

def create_app():
    """Create and configure the Flask application"""
    app = Flask(__name__)
    app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'your-secret-key-change-in-production')
    
    # Initialize CORS with more permissive settings for development
    CORS(app, 
         origins=['http://localhost:3000', 'http://localhost:3001', 'http://localhost:5173', 'http://127.0.0.1:3001'],
         methods=['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
         allow_headers=['Content-Type', 'Authorization', 'Accept'],
         supports_credentials=True)
    
    # Additional CORS headers for preflight requests
    @app.after_request
    def after_request(response):
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
        response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
        return response
    
    # Register blueprints
    app.register_blueprint(auth_bp)
    app.register_blueprint(github_bp)
    
    # Health check endpoint
    @app.route('/api/health', methods=['GET'])
    def health_check():
        """Health check endpoint"""
        return jsonify({
            'status': 'healthy',
            'message': 'SkillSlate API is running',
            'timestamp': datetime.utcnow().isoformat(),
            'database': 'connected' if db_instance.client else 'disconnected'
        })
    
    # Error handlers
    @app.errorhandler(404)
    def not_found(error):
        return jsonify({'message': 'Endpoint not found'}), 404
    
    @app.errorhandler(500)
    def internal_error(error):
        return jsonify({'message': 'Internal server error'}), 500
    
    return app

if __name__ == '__main__':
    # Connect to database
    if not db_instance.connect():
        print("❌ Failed to connect to database. Exiting...")
        exit(1)
    
    # Create indexes for better performance
    users_collection = db_instance.get_collection('users')
    if users_collection is not None:
        users_collection.create_index('email', unique=True)
        print("📊 Database indexes created")
    
    # Create and run the app
    app = create_app()
    
    port = int(os.environ.get('PORT', 5000))
    debug = os.environ.get('FLASK_ENV') == 'development'
    
    print(f"🚀 Starting SkillSlate API server on port {port}")
    print(f"📊 MongoDB connected to: {db_instance.mongodb_uri}")
    print(f"🔧 Debug mode: {debug}")
    print(f"🌐 CORS enabled for frontend origins")
    
    try:
        app.run(host='0.0.0.0', port=port, debug=debug)
    except KeyboardInterrupt:
        print("\n🛑 Shutting down server...")
        db_instance.disconnect()
