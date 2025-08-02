---
title: QuickDesk Backend API
emoji: 🎫
colorFrom: blue
colorTo: purple
sdk: docker
app_port: 7860
suggested_hardware: cpu-basic
suggested_storage: small
---

# QuickDesk Backend API

A comprehensive help desk system backend built with Flask, providing REST API endpoints for ticket management, user authentication, and administrative functions.

## Features

- 🔐 JWT-based authentication
- 🎫 Complete ticket management system
- 👥 Role-based access control (Admin, Agent, End User)
- 📁 File attachment support
- 🔔 Notification system
- 📊 Dashboard analytics
- 🗳️ Ticket voting system

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/auth/me` - Get current user

### Tickets
- `GET /api/tickets` - List tickets with filtering
- `POST /api/tickets` - Create new ticket
- `GET /api/tickets/{id}` - Get ticket details
- `PUT /api/tickets/{id}/status` - Update ticket status
- `POST /api/tickets/{id}/comments` - Add comment
- `POST /api/tickets/{id}/vote` - Vote on ticket

### Admin
- `GET /api/users` - List users (admin only)
- `GET /api/categories` - List categories
- `POST /api/categories` - Create category (admin only)

### Dashboard
- `GET /api/dashboard` - Get dashboard statistics

## Environment Variables

- `DATABASE_URL` - Database connection string (default: sqlite:///quickdesk.db)
- `SECRET_KEY` - JWT secret key
- `DEBUG` - Debug mode (default: False)
- `EMAIL_ENABLED` - Enable email notifications (default: False)
- `UPLOAD_FOLDER` - File upload directory (default: uploads)
- `MAX_FILE_SIZE` - Maximum file upload size (default: 10MB)

## Demo Credentials

- **Admin**: admin / admin123
- **Agent**: agent / agent123  
- **User**: user / user123

## Usage

The API is ready to use! You can test the endpoints using the demo credentials above.

## Frontend Integration

This backend is designed to work with the QuickDesk React frontend. Set your frontend's API URL to:

\`\`\`env
NEXT_PUBLIC_API_URL=https://YOUR_USERNAME-quickdesk-backend.hf.space/api
\`\`\`

## Local Development

\`\`\`bash
# Clone the repository
git clone <your-repo-url>
cd quickdesk-backend

# Install dependencies
pip install -r requirements.txt

# Initialize database
python database.py

# Run the application
python api.py
\`\`\`

## Docker

\`\`\`bash
# Build and run with Docker
docker build -t quickdesk-backend .
docker run -p 7860:7860 quickdesk-backend
