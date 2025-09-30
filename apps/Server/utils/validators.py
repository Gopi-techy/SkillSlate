import re
from datetime import datetime

def validate_email(email):
    """Validate email format"""
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None

def validate_password(password):
    """Validate password strength"""
    if len(password) < 6:
        return False, "Password must be at least 6 characters long"
    
    if len(password) > 128:
        return False, "Password must be less than 128 characters"
    
    return True, "Password is valid"

def validate_name(name):
    """Validate name format"""
    if not name or len(name.strip()) < 2:
        return False, "Name must be at least 2 characters long"
    
    if len(name) > 100:
        return False, "Name must be less than 100 characters"
    
    # Check for valid characters (letters, spaces, hyphens, apostrophes)
    pattern = r"^[a-zA-Z\s\-']+$"
    if not re.match(pattern, name.strip()):
        return False, "Name contains invalid characters"
    
    return True, "Name is valid"

def validate_user_data(data):
    """Validate user registration/login data"""
    errors = {}
    
    # Validate email
    if not data.get('email'):
        errors['email'] = 'Email is required'
    elif not validate_email(data['email']):
        errors['email'] = 'Invalid email format'
    
    # Validate password (for registration)
    if 'password' in data:
        if not data['password']:
            errors['password'] = 'Password is required'
        else:
            is_valid, message = validate_password(data['password'])
            if not is_valid:
                errors['password'] = message
    
    # Validate name (for registration)
    if 'name' in data:
        if not data['name']:
            errors['name'] = 'Name is required'
        else:
            is_valid, message = validate_name(data['name'])
            if not is_valid:
                errors['name'] = message
    
    return len(errors) == 0, errors
