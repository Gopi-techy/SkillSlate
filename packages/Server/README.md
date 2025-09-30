# SkillSlate Backend API

A simple Flask backend with MongoDB for the SkillSlate application authentication system.

## Features

- **User Authentication**: Signup, login, logout
- **JWT Tokens**: Secure token-based authentication
- **Password Hashing**: bcrypt for secure password storage
- **MongoDB**: NoSQL database for user data
- **CORS Support**: Frontend communication enabled
- **Profile Management**: User profile CRUD operations

## Setup

### Prerequisites

- Python 3.8+
- MongoDB (local or cloud)
- pip

### Installation

1. **Navigate to server directory:**

   ```bash
   cd apps/Server
   ```

2. **Install dependencies:**

   ```bash
   pip install -r requirements.txt
   ```

3. **Set up environment variables:**
   Create a `.env` file in the `apps/Server` directory:

   ```env
   MONGODB_URI=mongodb://localhost:27017/skillslate
   MONGODB_DATABASE=skillslate
   JWT_SECRET_KEY=your-super-secret-jwt-key-change-this-in-production
   JWT_ALGORITHM=HS256
   JWT_EXPIRATION_HOURS=24
   FLASK_ENV=development
   FLASK_DEBUG=True
   FLASK_PORT=5000
   FRONTEND_URL=http://localhost:3000
   ```

4. **Start MongoDB:**

   - Local: `mongod`
   - Or use MongoDB Atlas (cloud)

5. **Run the server:**
   ```bash
   python app.py
   ```

The API will be available at `http://localhost:5000`

## API Endpoints

### Authentication

#### POST `/api/auth/signup`

Register a new user.

**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe"
}
```

**Response:**

```json
{
  "message": "User created successfully",
  "user": {
    "_id": "user_id",
    "email": "user@example.com",
    "name": "John Doe",
    "github_connected": false,
    "created_at": "2024-01-01T00:00:00Z"
  },
  "token": "jwt_token_here"
}
```

#### POST `/api/auth/login`

Login with email and password.

**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**

```json
{
  "message": "Login successful",
  "user": {
    "_id": "user_id",
    "email": "user@example.com",
    "name": "John Doe",
    "github_connected": false
  },
  "token": "jwt_token_here"
}
```

#### GET `/api/auth/verify`

Verify JWT token and get user info.

**Headers:**

```
Authorization: Bearer <jwt_token>
```

**Response:**

```json
{
  "message": "Token is valid",
  "user": {
    "_id": "user_id",
    "email": "user@example.com",
    "name": "John Doe"
  }
}
```

#### POST `/api/auth/logout`

Logout (client-side token removal).

### User Profile

#### GET `/api/user/profile`

Get user profile (requires authentication).

**Headers:**

```
Authorization: Bearer <jwt_token>
```

#### PUT `/api/user/profile`

Update user profile (requires authentication).

**Request Body:**

```json
{
  "name": "Updated Name",
  "github_connected": true
}
```

### Utility

#### GET `/api/health`

Health check endpoint.

**Response:**

```json
{
  "status": "healthy",
  "message": "SkillSlate API is running"
}
```

## Database Schema

### Users Collection

```javascript
{
  "_id": ObjectId,
  "email": String (unique),
  "password": String (bcrypt hashed),
  "name": String,
  "github_connected": Boolean,
  "created_at": Date,
  "updated_at": Date
}
```

## Security Features

- **Password Hashing**: bcrypt with salt
- **JWT Tokens**: Secure authentication tokens
- **CORS**: Configured for frontend communication
- **Input Validation**: Email format and password strength
- **Error Handling**: Comprehensive error responses

## Development

### Running in Development Mode

```bash
export FLASK_ENV=development
export FLASK_DEBUG=True
python app.py
```

### Testing with curl

```bash
# Signup
curl -X POST http://localhost:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123","name":"Test User"}'

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# Verify token
curl -X GET http://localhost:5000/api/auth/verify \
  -H "Authorization: Bearer <your_jwt_token>"
```

## Production Deployment

1. Change `JWT_SECRET_KEY` to a secure random string
2. Set `FLASK_ENV=production`
3. Set `FLASK_DEBUG=False`
4. Use a production MongoDB instance
5. Set up proper CORS origins
6. Use a WSGI server like Gunicorn

## Error Codes

- `400`: Bad Request (validation errors)
- `401`: Unauthorized (invalid credentials/token)
- `404`: Not Found (user not found)
- `500`: Internal Server Error
