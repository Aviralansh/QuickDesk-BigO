# QuickDesk - Complete Help Desk System

A modern, full-stack help desk solution built with **Next.js** (frontend) and **Flask** (backend). QuickDesk provides role-based ticket management, real-time notifications, and a comprehensive admin panel.

![QuickDesk Dashboard](https://img.shields.io/badge/Status-Production%20Ready-brightgreen)
![Next.js](https://img.shields.io/badge/Frontend-Next.js%2014-black)
![Flask](https://img.shields.io/badge/Backend-Flask-blue)
![TypeScript](https://img.shields.io/badge/Language-TypeScript-blue)
![Python](https://img.shields.io/badge/Language-Python-yellow)

## 🚀 Features

### 🎫 **Ticket Management**
- Create, update, and track support tickets
- Priority levels (Low, Medium, High, Urgent)
- Status tracking (Open, In Progress, Resolved, Closed)
- File attachments support
- Comment system with internal notes
- Voting system for ticket prioritization

### 👥 **Role-Based Access Control**
- **End Users**: Create tickets, track progress, comment
- **Support Agents**: Manage assigned tickets, update status
- **Administrators**: Full system access, user management, analytics

### 📊 **Dashboard & Analytics**
- Real-time statistics and metrics
- Ticket distribution by category
- User activity tracking
- Performance analytics

### 🔔 **Notifications**
- Real-time notification system
- Email notifications (configurable)
- In-app notification center

### 🎨 **Modern UI/UX**
- Responsive design for all devices
- Dark/Light mode support
- Intuitive navigation
- Professional design with shadcn/ui

## 📁 Repository Structure

\`\`\`
QuickDesk/
├── Server/                     # Backend (Flask API)
│   ├── api.py                 # Main Flask application
│   ├── models.py              # Database models
│   ├── services.py            # Business logic
│   ├── database.py            # Database configuration
│   ├── requirements.txt       # Python dependencies
│   ├── Dockerfile            # Docker configuration
│   └── README.md             # Backend documentation
│
└── QuickDesk @BigO/          # Frontend (Next.js)
    ├── app/                  # Next.js app directory
    ├── components/           # React components
    ├── lib/                  # Utilities and services
    ├── package.json          # Node.js dependencies
    ├── next.config.js        # Next.js configuration
    └── README.md             # Frontend documentation
\`\`\`

## 🛠️ Technology Stack

### **Frontend**
- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS + shadcn/ui
- **State Management**: React Context API
- **Authentication**: JWT tokens
- **HTTP Client**: Fetch API

### **Backend**
- **Framework**: Flask (Python)
- **Database**: SQLite (default) / PostgreSQL / MySQL
- **Authentication**: JWT tokens
- **File Storage**: Local filesystem
- **API**: RESTful API with CORS support

## 🚀 Quick Start

### **Prerequisites**
- Node.js 18+ and npm/yarn
- Python 3.8+
- Git

### **1. Clone the Repository**
\`\`\`bash
git clone https://github.com/Aviralansh/QuickDesk-BigO.git
cd QuickDesk-BigO
\`\`\`

### **2. Backend Setup**
\`\`\`bash
cd Server

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Initialize database
python database.py

# Start the server
python api.py
\`\`\`

The backend will be available at `http://localhost:5000`

### **3. Frontend Setup**
\`\`\`bash
cd "QuickDesk @BigO"

# Install dependencies
npm install

# Create environment file
echo "NEXT_PUBLIC_API_URL=http://localhost:5000/api" > .env.local

# Start development server
npm run dev
\`\`\`

The frontend will be available at `http://localhost:3000`

### **4. Default Login Credentials**
- **Admin**: `admin` / `admin123`
- **Agent**: `agent` / `agent123`
- **User**: `user` / `user123`

## 🌐 Deployment

### **Option 1: Hugging Face Spaces (Recommended for Backend)**

#### **Backend Deployment**
1. Create a new Space on [Hugging Face](https://huggingface.co/spaces)
2. Choose "Docker" as the SDK
3. Upload all files from the `Server/` folder
4. Your API will be available at: `https://aviralansh-quickdesk.hf.space/api`

#### **Frontend Configuration**
Update your frontend environment:
\`\`\`bash
# In QuickDesk @BigO/.env.local
NEXT_PUBLIC_API_URL=https://aviralansh-quickdesk.hf.space/api
\`\`\`

### **Option 2: Vercel (Recommended for Frontend)**

#### **Frontend Deployment**
\`\`\`bash
cd "QuickDesk @BigO"

# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set environment variable
vercel env add NEXT_PUBLIC_API_URL
\`\`\`

### **Option 3: Docker Deployment**

#### **Backend with Docker**
\`\`\`bash
cd Server

# Build image
docker build -t quickdesk-backend .

# Run container
docker run -p 5000:7860 -e DATABASE_URL=sqlite:///quickdesk.db quickdesk-backend
\`\`\`

#### **Frontend with Docker**
\`\`\`bash
cd "QuickDesk @BigO"

# Create Dockerfile
cat > Dockerfile << EOF
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
EOF

# Build and run
docker build -t quickdesk-frontend .
docker run -p 3000:3000 -e NEXT_PUBLIC_API_URL=http://your-backend-url/api 
QuickDesk-frontend
\`\`\`

### **Option 4: Traditional VPS/Server**

#### **Backend Setup**
\`\`\`bash
# Install Python and dependencies
sudo apt update
sudo apt install python3 python3-pip python3-venv nginx

# Clone and setup
git clone https://github.com/Aviralansh/QuickDesk-BigO.git
cd QuickDesk-BigO/Server
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
pip install gunicorn

# Run with Gunicorn
gunicorn --bind 0.0.0.0:5000 api:app
\`\`\`

#### **Frontend Setup**
\`\`\`bash
# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Setup frontend
cd "QuickDesk-BigO"
npm install
npm run build

# Serve with PM2
npm install -g pm2
pm2 start npm --name "quickdesk-frontend" -- start
\`\`\`

## ⚙️ Configuration

### **Environment Variables**

#### **Backend (Server/.env)**
\`\`\`env
DATABASE_URL=sqlite:///quickdesk.db
SECRET_KEY=your-super-secret-key-change-in-production
DEBUG=False
EMAIL_ENABLED=False
UPLOAD_FOLDER=uploads
MAX_FILE_SIZE=10485760
\`\`\`

#### **Frontend (QuickDesk @BigO/.env.local)**
\`\`\`env
NEXT_PUBLIC_API_URL=https://aviralansh-quickdesk.hf.space/api
NEXT_PUBLIC_APP_NAME=QuickDesk
NEXT_PUBLIC_VERSION=1.0.0
\`\`\`

### **Database Configuration**

#### **SQLite (Default)**
No additional setup required. Database file will be created automatically.

#### **PostgreSQL**
\`\`\`env
DATABASE_URL=postgresql://username:password@localhost:5432/quickdesk
\`\`\`

#### **MySQL**
\`\`\`env
DATABASE_URL=mysql://username:password@localhost:3306/quickdesk
\`\`\`

## 🔧 Development

### **Backend Development**
\`\`\`bash
cd Server

# Install development dependencies
pip install -r requirements.txt

# Run in debug mode
export DEBUG=True
python api.py

# Run tests (if available)
python -m pytest
\`\`\`

### **Frontend Development**
\`\`\`bash
cd "QuickDesk @BigO"

# Install dependencies
npm install

# Start development server
npm run dev

# Run linting
npm run lint

# Build for production
npm run build
\`\`\`

## 📚 API Documentation

### **Authentication Endpoints**
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/auth/me` - Get current user

### **Ticket Endpoints**
- `GET /api/tickets` - List tickets (with filtering)
- `POST /api/tickets` - Create ticket
- `GET /api/tickets/{id}` - Get ticket details
- `PUT /api/tickets/{id}/status` - Update status
- `POST /api/tickets/{id}/comments` - Add comment

### **Admin Endpoints**
- `GET /api/users` - List users (admin only)
- `GET /api/categories` - List categories
- `POST /api/categories` - Create category (admin only)

### **Utility Endpoints**
- `GET /api/health` - Health check
- `GET /api/dashboard` - Dashboard statistics

## 🐛 Troubleshooting

### **Common Issues**

#### **"API Not Found" Error**
1. Check if backend server is running
2. Verify API URL in frontend environment
3. Check CORS configuration
4. Ensure all backend files are deployed

#### **Database Connection Issues**
1. Check DATABASE_URL format
2. Ensure database server is running
3. Verify credentials and permissions
4. Check firewall settings

#### **File Upload Issues**
1. Check UPLOAD_FOLDER permissions
2. Verify MAX_FILE_SIZE setting
3. Ensure disk space is available

### **Debug Mode**
Visit `/debug` in the frontend to check API connectivity and troubleshoot issues.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the Apache-2.0 license - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [Next.js](https://nextjs.org/) - React framework
- [Flask](https://flask.palletsprojects.com/) - Python web framework
- [shadcn/ui](https://ui.shadcn.com/) - UI components
- [Tailwind CSS](https://tailwindcss.com/) - CSS framework
- [Lucide React](https://lucide.dev/) - Icons

## Support

If you encounter any issues or have questions:

1. Check the [Issues](https://github.com/Aviralansh/QuickDesk-BigO/issues) page
2. Create a new issue with detailed information
3. Join our community discussions

---

**Made with ❤️ by BigO Team**


⭐ **Star this repository if you find it helpful!**
\`\`\`

