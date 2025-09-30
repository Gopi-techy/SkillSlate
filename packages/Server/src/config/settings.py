"""
Application configuration settings
"""
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

class Config:
    """Application configuration class"""
    
    # MongoDB Configuration
    MONGODB_URI = os.getenv('MONGODB_URI', 'mongodb://localhost:27017/skillslate')
    MONGODB_DATABASE = os.getenv('MONGODB_DATABASE', 'skillslate')
    
    # JWT Configuration
    JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY', 'your-super-secret-jwt-key-change-this-in-production')
    JWT_ALGORITHM = os.getenv('JWT_ALGORITHM', 'HS256')
    JWT_EXPIRATION_HOURS = int(os.getenv('JWT_EXPIRATION_HOURS', 24))
    
    # Flask Configuration
    FLASK_ENV = os.getenv('FLASK_ENV', 'development')
    FLASK_DEBUG = os.getenv('FLASK_DEBUG', 'True').lower() == 'true'
    FLASK_PORT = int(os.getenv('FLASK_PORT', 5000))
    
    # CORS Configuration
    FRONTEND_URL = os.getenv('FRONTEND_URL', 'http://localhost:3000')
    
    @classmethod
    def validate_config(cls):
        """Validate configuration settings"""
        required_settings = [
            'MONGODB_URI',
            'JWT_SECRET_KEY'
        ]
        
        missing_settings = []
        for setting in required_settings:
            if not getattr(cls, setting) or getattr(cls, setting).startswith('your-super-secret'):
                missing_settings.append(setting)
        
        if missing_settings:
            raise ValueError(f"Missing or invalid configuration: {', '.join(missing_settings)}")
        
        return True
