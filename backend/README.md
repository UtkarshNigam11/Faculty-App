# Faculty Substitute Backend API

## Setup

1. Install PostgreSQL on your system
2. Create a database named `faculty_substitute`
3. Update `.env` file with your PostgreSQL credentials
4. Run the schema to create tables:
   ```bash
   psql -U postgres -d faculty_substitute -f database/schema.sql
   ```

## Installation

```bash
npm install
```

## Running the server

Development mode (with auto-restart):
```bash
npm run dev
```

Production mode:
```bash
npm start
```

## API Endpoints

### Health Check
- `GET /api/health` - Check if API is running

### Users
- `GET /api/users` - Get all users
- `GET /api/users/:id` - Get user by ID
- `POST /api/users/register` - Register new user
- `POST /api/users/login` - Login user

### Substitute Requests
- `GET /api/requests` - Get all pending requests
- `GET /api/requests/teacher/:teacherId` - Get requests by teacher
- `POST /api/requests` - Create new request
- `PUT /api/requests/:id/accept` - Accept a request
- `PUT /api/requests/:id/cancel` - Cancel a request
- `DELETE /api/requests/:id` - Delete a request

## Database Schema

### users
- id, name, email, password, department, phone, created_at

### substitute_requests
- id, teacher_id, subject, date, time, duration, classroom, notes, status, accepted_by, created_at, updated_at
