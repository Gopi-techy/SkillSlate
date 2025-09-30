#!/usr/bin/env python3
"""
SkillSlate Backend Server Runner

Simple script to run the Flask development server with proper configuration.
"""

import os
import sys
from app import app
from config import Config

def main():
    """Main function to run the Flask server"""
    print("🚀 Starting SkillSlate Backend API...")
    print(f"📍 Environment: {Config.FLASK_ENV}")
    print(f"🔧 Debug Mode: {Config.FLASK_DEBUG}")
    print(f"🌐 Server URL: http://localhost:{Config.FLASK_PORT}")
    print(f"🔗 Frontend URL: {Config.FRONTEND_URL}")
    print(f"🗄️  MongoDB URI: {Config.MONGODB_URI}")
    print("-" * 50)
    
    try:
        app.run(
            debug=Config.FLASK_DEBUG,
            port=Config.FLASK_PORT,
            host='0.0.0.0',
            threaded=True
        )
    except KeyboardInterrupt:
        print("\n👋 Shutting down SkillSlate Backend API...")
        sys.exit(0)
    except Exception as e:
        print(f"❌ Error starting server: {e}")
        sys.exit(1)

if __name__ == '__main__':
    main()
