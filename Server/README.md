# SkillSlate Backend API

A Python Flask backend with MongoDB for the SkillSlate application.

## 🚀 Features

- **User Authentication**: Register, login, logout, profile management
- **JWT Token Security**: Secure token-based authentication
- **MongoDB Integration**: NoSQL database for flexible data storage
- **Password Hashing**: Bcrypt for secure password storage
- **CORS Support**: Cross-origin requests for frontend integration
- **Modular Structure**: Clean, organized codebase

## 📁 Project Structure

```
Server/
├── app.py                 # Main application entry point
├── requirements.txt       # Python dependencies
├── env.example           # Environment variables template
├── README.md             # This file
├── config/               # Configuration files
│   ├── __init__.py
│   └── database.py       # MongoDB connection
├── models/               # Data models
│   ├── __init__.py
│   └── user.py          # User model
├── routes/               # API routes
│   ├── __init__.py
│   └── auth.py          # Authentication routes
└── utils/                # Utility functions
    ├── __init__.py
    └── validators.py     # Input validation
```

## 🛠️ Setup

### Prerequisites

- Python 3.8+
- MongoDB (local or cloud)
- pip

### Installation

1. **Clone and navigate to the server directory:**

   ```bash
   cd apps/Server
   ```

2. **Create virtual environment:**

   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies:**

   ```bash
   pip install -r requirements.txt
   ```

4. **Set up environment variables:**

   ```bash
   cp env.example .env
   # Edit .env with your configuration
   ```

5. **Start MongoDB:**

   ```bash
   # Local MongoDB
   mongod

   # Or use MongoDB Atlas (cloud)
   # Update MONGODB_URI in .env
   ```

6. **Run the server:**
   ```bash
   python app.py
   ```

## 🔧 Environment Variables

Create a `.env` file with the following variables:

```env
# Flask Configuration
FLASK_ENV=development
SECRET_KEY=your-super-secret-key-change-in-production

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/
DATABASE_NAME=skillslate

# Server Configuration
PORT=5000
```

## 📡 API Endpoints

### Health Check

- `GET /api/health` - Server health status

### Authentication

- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout (requires token)
- `GET /api/auth/profile` - Get user profile (requires token)
- `GET /api/auth/verify` - Verify JWT token (requires token)

### Request/Response Examples

#### Register User

```bash
POST /api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

Response:

```json
{
  "message": "User registered successfully",
  "user": {
    "id": "user_id",
    "name": "John Doe",
    "email": "john@example.com",
    "githubConnected": false,
    "token": "jwt_token_here"
  }
}
```

#### Login User

```bash
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}
```

Response:

```json
{
  "message": "Login successful",
  "user": {
    "id": "user_id",
    "name": "John Doe",
    "email": "john@example.com",
    "githubConnected": false,
    "token": "jwt_token_here"
  }
}
```

#### Get Profile (Protected Route)

```bash
GET /api/auth/profile
Authorization: Bearer jwt_token_here
```

Response:

```json
{
  "user": {
    "id": "user_id",
    "name": "John Doe",
    "email": "john@example.com",
    "githubConnected": false,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "lastLogin": "2024-01-01T00:00:00.000Z"
  }
}
```

## 🔒 Security Features

- **Password Hashing**: Bcrypt for secure password storage
- **JWT Tokens**: Secure token-based authentication
- **Input Validation**: Email, password, and name validation
- **CORS Configuration**: Restricted to frontend origins
- **Error Handling**: Secure error messages

## 🧪 Testing

Test the API using curl or a tool like Postman:

```bash
# Health check
curl http://localhost:5000/api/health

# Register user
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"John Doe","email":"john@example.com","password":"password123"}'

# Login user
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john@example.com","password":"password123"}'
```

## 🚀 Deployment

### Production Considerations

1. **Environment Variables**: Use strong SECRET_KEY
2. **Database**: Use MongoDB Atlas or secure MongoDB instance
3. **HTTPS**: Enable SSL/TLS in production
4. **WSGI Server**: Use Gunicorn for production
5. **Process Manager**: Use PM2 or similar for process management

### Using Gunicorn

```bash
pip install gunicorn
gunicorn -w 4 -b 0.0.0.0:5000 app:app
```

## 🔧 Development

### Adding New Routes

1. Create new blueprint in `routes/` directory
2. Register blueprint in `app.py`
3. Add corresponding models in `models/` if needed

### Database Schema

#### Users Collection

```javascript
{
  "_id": ObjectId,
  "name": String,
  "email": String (unique),
  "password": String (hashed),
  "githubConnected": Boolean,
  "createdAt": DateTime,
  "updatedAt": DateTime,
  "lastLogin": DateTime
}
```

## 📝 License

This project is part of the SkillSlate application.
