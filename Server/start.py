#!/usr/bin/env python3
"""
Clean startup script for SkillSlate API server
Shows only essential messages
"""

import os
import sys
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Suppress Flask debug messages
import logging
logging.getLogger('werkzeug').setLevel(logging.ERROR)

from app import create_app, db_instance

def main():
    """Main function to start the server cleanly"""
    print("🚀 Starting SkillSlate API...")
    
    # Connect to database
    if not db_instance.connect():
        print("❌ Database connection failed")
        return 1
    
    # Create indexes
    users_collection = db_instance.get_collection('users')
    if users_collection is not None:
        try:
            users_collection.create_index('email', unique=True)
        except Exception:
            pass  # Index might already exist
    
    # Create and run the app
    app = create_app()
    
    port = int(os.environ.get('PORT', 5000))
    
    print(f"✅ Server ready at http://localhost:{port}")
    print("📡 API endpoints available")
    print("🛑 Press Ctrl+C to stop")
    print("-" * 40)
    
    try:
        app.run(host='0.0.0.0', port=port, debug=False, use_reloader=False)
    except KeyboardInterrupt:
        print("\n🛑 Server stopped")
        db_instance.disconnect()
        return 0
    except Exception as e:
        print(f"❌ Server error: {e}")
        return 1

if __name__ == '__main__':
    sys.exit(main())
