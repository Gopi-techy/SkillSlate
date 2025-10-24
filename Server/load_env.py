import os
from dotenv import load_dotenv
from pathlib import Path

# Get the absolute path to the directory containing this script
BASE_DIR = Path(__file__).resolve().parent

# Construct path to .env file
env_path = BASE_DIR / '.env'

# Load environment variables
load_dotenv(dotenv_path=env_path)

# Check if variables are loaded
github_vars = {
    'GITHUB_CLIENT_ID': os.getenv('GITHUB_CLIENT_ID'),
    'GITHUB_CLIENT_SECRET': os.getenv('GITHUB_CLIENT_SECRET'),
    'GITHUB_REDIRECT_URI': os.getenv('GITHUB_REDIRECT_URI'),
    'GITHUB_SCOPES': os.getenv('GITHUB_SCOPES')
}

print("\nEnvironment variables status:")
for key, value in github_vars.items():
    print(f"{key}: {'✓ Set' if value else '✗ Not set'}")