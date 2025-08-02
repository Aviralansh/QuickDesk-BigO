"""
QuickDesk Help Desk System - REST API Endpoints
Flask-based REST API with authentication and all required endpoints
"""

import os
import jwt
from datetime import datetime, timedelta
from functools import wraps
from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
from werkzeug.exceptions import RequestEntityTooLarge

from database import db_config, init_database
from services import (
    UserService, CategoryService, TicketService, 
    AttachmentService, NotificationService, DashboardService
)
from models import UserRole, TicketStatus, TicketPriority

app = Flask(__name__)
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'your-secret-key-change-in-production')
app.config['MAX_CONTENT_LENGTH'] = 10 * 1024 * 1024  # 10MB max file upload

# Enable CORS for frontend integration
CORS(app, origins=['http://localhost:3000', 'http://127.0.0.1:3000'])

# JWT Configuration
JWT_SECRET = app.config['SECRET_KEY']
JWT_EXPIRATION_HOURS = 24

def generate_token(user_id: int, role: str) -> str:
    """Generate JWT token for user"""
    payload = {
        'user_id': user_id,
        'role': role,
        'exp': datetime.utcnow() + timedelta(hours=JWT_EXPIRATION_HOURS)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm='HS256')

def verify_token(token: str) -> dict:
    """Verify JWT token and return payload"""
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=['HS256'])
        return payload
    except jwt.ExpiredSignatureError:
        raise ValueError("Token has expired")
    except jwt.InvalidTokenError:
        raise ValueError("Invalid token")

def require_auth(allowed_roles=None):
    """Decorator to require authentication and optionally check roles"""
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            token = request.headers.get('Authorization')
            if not token:
                return jsonify({'error': 'No token provided'}), 401
            
            if token.startswith('Bearer '):
                token = token[7:]
            
            try:
                payload = verify_token(token)
                request.current_user = {
                    'id': payload['user_id'],
                    'role': payload['role']
                }
                
                # Check role permissions
                if allowed_roles and payload['role'] not in allowed_roles:
                    return jsonify({'error': 'Insufficient permissions'}), 403
                
            except ValueError as e:
                return jsonify({'error': str(e)}), 401
            
            return f(*args, **kwargs)
        return decorated_function
    return decorator

def get_db_services():
    """Get database services with current session"""
    session = db_config.get_session_direct()
    return {
        'session': session,
        'user_service': UserService(session),
        'category_service': CategoryService(session),
        'ticket_service': TicketService(session),
        'attachment_service': AttachmentService(session),
        'notification_service': NotificationService(session),
        'dashboard_service': DashboardService(session)
    }

# Error Handlers
@app.errorhandler(RequestEntityTooLarge)
def handle_file_too_large(e):
    return jsonify({'error': 'File too large. Maximum size is 10MB.'}), 413

@app.errorhandler(500)
def handle_internal_error(e):
    return jsonify({'error': 'Internal server error'}), 500

# Authentication Endpoints
@app.route('/api/auth/register', methods=['POST'])
def register():
    """Register a new user"""
    data = request.json
    required_fields = ['username', 'email', 'password', 'full_name']
    
    if not all(field in data for field in required_fields):
        return jsonify({'error': 'Missing required fields'}), 400
    
    services = get_db_services()
    try:
        user = services['user_service'].create_user(
            username=data['username'],
            email=data['email'],
            password=data['password'],
            full_name=data['full_name'],
            role=UserRole.END_USER  # Default role for registration
        )
        
        token = generate_token(user.id, user.role.value)
        
        return jsonify({
            'message': 'User registered successfully',
            'user': user.to_dict(),
            'token': token
        }), 201
        
    except ValueError as e:
        return jsonify({'error': str(e)}), 400
    finally:
        services['session'].close()

@app.route('/api/auth/login', methods=['POST'])
def login():
    """Authenticate user and return JWT token"""
    data = request.json
    
    if not data.get('username') or not data.get('password'):
        return jsonify({'error': 'Username and password required'}), 400
    
    services = get_db_services()
    try:
        user = services['user_service'].authenticate_user(
            data['username'], 
            data['password']
        )
        
        if not user:
            return jsonify({'error': 'Invalid credentials'}), 401
        
        token = generate_token(user.id, user.role.value)
        
        return jsonify({
            'message': 'Login successful',
            'user': user.to_dict(),
            'token': token
        })
        
    finally:
        services['session'].close()

@app.route('/api/auth/me', methods=['GET'])
@require_auth()
def get_current_user():
    """Get current user information"""
    services = get_db_services()
    try:
        user = services['user_service'].get_user_by_id(request.current_user['id'])
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        return jsonify({'user': user.to_dict()})
    
    finally:
        services['session'].close()

# User Management Endpoints
@app.route('/api/users', methods=['GET'])
@require_auth(['admin'])
def get_users():
    """Get all users (admin only)"""
    services = get_db_services()
    try:
        search = request.args.get('search', '')
        role = request.args.get('role')
        limit = int(request.args.get('limit', 50))
        offset = int(request.args.get('offset', 0))
        
        role_enum = None
        if role:
            try:
                role_enum = UserRole(role)
            except ValueError:
                return jsonify({'error': 'Invalid role'}), 400
        
        users = services['user_service'].get_users(
            role=role_enum,
            search=search,
            limit=limit,
            offset=offset
        )
        
        return jsonify({
            'users': [user.to_dict() for user in users],
            'limit': limit,
            'offset': offset
        })
    
    finally:
        services['session'].close()

# Category Management Endpoints
@app.route('/api/categories', methods=['GET'])
@require_auth()
def get_categories():
    """Get all categories"""
    services = get_db_services()
    try:
        categories = services['category_service'].get_categories()
        return jsonify({
            'categories': [cat.to_dict() for cat in categories]
        })
    
    finally:
        services['session'].close()

@app.route('/api/categories', methods=['POST'])
@require_auth(['admin'])
def create_category():
    """Create new category (admin only)"""
    data = request.json
    
    if not data.get('name'):
        return jsonify({'error': 'Category name is required'}), 400
    
    services = get_db_services()
    try:
        category = services['category_service'].create_category(
            name=data['name'],
            description=data.get('description', ''),
            color=data.get('color', '#007bff')
        )
        
        return jsonify({
            'message': 'Category created successfully',
            'category': category.to_dict()
        }), 201
        
    except ValueError as e:
        return jsonify({'error': str(e)}), 400
    finally:
        services['session'].close()

# Ticket Management Endpoints
@app.route('/api/tickets', methods=['GET'])
@require_auth()
def get_tickets():
    """Get tickets with filtering and pagination"""
    services = get_db_services()
    try:
        # Parse query parameters
        status = request.args.get('status')
        category_id = request.args.get('category_id', type=int)
        search = request.args.get('search', '')
        sort_by = request.args.get('sort_by', 'updated_at')
        sort_order = request.args.get('sort_order', 'desc')
        limit = int(request.args.get('limit', 20))
        offset = int(request.args.get('offset', 0))
        
        # Convert status string to enum
        status_enum = None
        if status:
            try:
                status_enum = TicketStatus(status)
            except ValueError:
                return jsonify({'error': 'Invalid status'}), 400
        
        result = services['ticket_service'].get_tickets(
            user_id=request.current_user['id'],
            user_role=UserRole(request.current_user['role']),
            status=status_enum,
            category_id=category_id,
            search=search,
            sort_by=sort_by,
            sort_order=sort_order,
            limit=limit,
            offset=offset
        )
        
        return jsonify(result)
    
    finally:
        services['session'].close()

@app.route('/api/tickets', methods=['POST'])
@require_auth()
def create_ticket():
    """Create a new ticket"""
    data = request.json
    required_fields = ['subject', 'description', 'category_id']
    
    if not all(field in data for field in required_fields):
        return jsonify({'error': 'Missing required fields'}), 400
    
    services = get_db_services()
    try:
        # Parse priority
        priority = TicketPriority.MEDIUM
        if data.get('priority'):
            try:
                priority = TicketPriority(data['priority'])
            except ValueError:
                return jsonify({'error': 'Invalid priority'}), 400
        
        ticket = services['ticket_service'].create_ticket(
            subject=data['subject'],
            description=data['description'],
            category_id=data['category_id'],
            created_by_id=request.current_user['id'],
            priority=priority
        )
        
        return jsonify({
            'message': 'Ticket created successfully',
            'ticket': ticket.to_dict(include_relations=True)
        }), 201
        
    except ValueError as e:
        return jsonify({'error': str(e)}), 400
    finally:
        services['session'].close()

@app.route('/api/tickets/<int:ticket_id>', methods=['GET'])
@require_auth()
def get_ticket(ticket_id):
    """Get ticket by ID"""
    services = get_db_services()
    try:
        ticket = services['ticket_service'].get_ticket_by_id(
            ticket_id=ticket_id,
            user_id=request.current_user['id'],
            user_role=UserRole(request.current_user['role'])
        )
        
        if not ticket:
            return jsonify({'error': 'Ticket not found or access denied'}), 404
        
        return jsonify({
            'ticket': ticket.to_dict(include_relations=True)
        })
    
    finally:
        services['session'].close()

@app.route('/api/tickets/<int:ticket_id>/status', methods=['PUT'])
@require_auth(['support_agent', 'admin'])
def update_ticket_status(ticket_id):
    """Update ticket status (agents and admins only)"""
    data = request.json
    
    if not data.get('status'):
        return jsonify({'error': 'Status is required'}), 400
    
    try:
        status = TicketStatus(data['status'])
    except ValueError:
        return jsonify({'error': 'Invalid status'}), 400
    
    services = get_db_services()
    try:
        ticket = services['ticket_service'].update_ticket_status(
            ticket_id=ticket_id,
            status=status,
            updated_by_id=request.current_user['id']
        )
        
        if not ticket:
            return jsonify({'error': 'Ticket not found'}), 404
        
        return jsonify({
            'message': 'Ticket status updated successfully',
            'ticket': ticket.to_dict()
        })
    
    finally:
        services['session'].close()

@app.route('/api/tickets/<int:ticket_id>/assign', methods=['PUT'])
@require_auth(['support_agent', 'admin'])
def assign_ticket(ticket_id):
    """Assign ticket to agent"""
    data = request.json
    assigned_to_id = data.get('assigned_to_id')
    
    services = get_db_services()
    try:
        ticket = services['ticket_service'].assign_ticket(
            ticket_id=ticket_id,
            assigned_to_id=assigned_to_id
        )
        
        if not ticket:
            return jsonify({'error': 'Ticket not found'}), 404
        
        return jsonify({
            'message': 'Ticket assigned successfully',
            'ticket': ticket.to_dict()
        })
    
    finally:
        services['session'].close()

@app.route('/api/tickets/<int:ticket_id>/comments', methods=['POST'])
@require_auth()
def add_comment(ticket_id):
    """Add comment to ticket"""
    data = request.json
    
    if not data.get('content'):
        return jsonify({'error': 'Comment content is required'}), 400
    
    services = get_db_services()
    try:
        # Check if user can access this ticket
        ticket = services['ticket_service'].get_ticket_by_id(
            ticket_id=ticket_id,
            user_id=request.current_user['id'],
            user_role=UserRole(request.current_user['role'])
        )
        
        if not ticket:
            return jsonify({'error': 'Ticket not found or access denied'}), 404
        
        is_internal = data.get('is_internal', False)
        # Only agents and admins can create internal comments
        if is_internal and request.current_user['role'] not in ['support_agent', 'admin']:
            is_internal = False
        
        comment = services['ticket_service'].add_comment(
            ticket_id=ticket_id,
            content=data['content'],
            author_id=request.current_user['id'],
            is_internal=is_internal
        )
        
        return jsonify({
            'message': 'Comment added successfully',
            'comment': comment.to_dict()
        }), 201
    
    finally:
        services['session'].close()

@app.route('/api/tickets/<int:ticket_id>/vote', methods=['POST'])
@require_auth()
def vote_ticket(ticket_id):
    """Vote on a ticket"""
    data = request.json
    
    if 'is_upvote' not in data:
        return jsonify({'error': 'Vote type (is_upvote) is required'}), 400
    
    services = get_db_services()
    try:
        result = services['ticket_service'].vote_ticket(
            ticket_id=ticket_id,
            user_id=request.current_user['id'],
            is_upvote=data['is_upvote']
        )
        
        if not result:
            return jsonify({'error': 'Ticket not found'}), 404
        
        return jsonify({
            'message': f"Vote {result['action']} successfully",
            'vote_result': result
        })
    
    finally:
        services['session'].close()

# File Upload/Download Endpoints
@app.route('/api/tickets/<int:ticket_id>/attachments', methods=['POST'])
@require_auth()
def upload_attachment(ticket_id):
    """Upload file attachment to ticket"""
    if 'file' not in request.files:
        return jsonify({'error': 'No file provided'}), 400
    
    file = request.files['file']
    
    services = get_db_services()
    try:
        # Check if user can access this ticket
        ticket = services['ticket_service'].get_ticket_by_id(
            ticket_id=ticket_id,
            user_id=request.current_user['id'],
            user_role=UserRole(request.current_user['role'])
        )
        
        if not ticket:
            return jsonify({'error': 'Ticket not found or access denied'}), 404
        
        attachment = services['attachment_service'].save_attachment(
            file=file,
            ticket_id=ticket_id,
            uploaded_by_id=request.current_user['id']
        )
        
        return jsonify({
            'message': 'File uploaded successfully',
            'attachment': attachment.to_dict()
        }), 201
        
    except ValueError as e:
        return jsonify({'error': str(e)}), 400
    finally:
        services['session'].close()

@app.route('/api/attachments/<int:attachment_id>/download', methods=['GET'])
@require_auth()
def download_attachment(attachment_id):
    """Download file attachment"""
    services = get_db_services()
    try:
        attachment = services['attachment_service'].get_attachment(attachment_id)
        
        if not attachment:
            return jsonify({'error': 'Attachment not found'}), 404
        
        # Check if user can access the ticket this attachment belongs to
        ticket = services['ticket_service'].get_ticket_by_id(
            ticket_id=attachment.ticket_id,
            user_id=request.current_user['id'],
            user_role=UserRole(request.current_user['role'])
        )
        
        if not ticket:
            return jsonify({'error': 'Access denied'}), 403
        
        return send_file(
            attachment.file_path,
            as_attachment=True,
            download_name=attachment.original_filename,
            mimetype=attachment.mime_type
        )
    
    finally:
        services['session'].close()

# Notification Endpoints
@app.route('/api/notifications', methods=['GET'])
@require_auth()
def get_notifications():
    """Get user notifications"""
    unread_only = request.args.get('unread_only', 'false').lower() == 'true'
    limit = int(request.args.get('limit', 20))
    offset = int(request.args.get('offset', 0))
    
    services = get_db_services()
    try:
        notifications = services['notification_service'].get_user_notifications(
            user_id=request.current_user['id'],
            unread_only=unread_only,
            limit=limit,
            offset=offset
        )
        
        return jsonify({
            'notifications': [notif.to_dict() for notif in notifications],
            'limit': limit,
            'offset': offset
        })
    
    finally:
        services['session'].close()

@app.route('/api/notifications/<int:notification_id>/read', methods=['PUT'])
@require_auth()
def mark_notification_read(notification_id):
    """Mark notification as read"""
    services = get_db_services()
    try:
        notification = services['notification_service'].mark_notification_read(
            notification_id=notification_id,
            user_id=request.current_user['id']
        )
        
        if not notification:
            return jsonify({'error': 'Notification not found'}), 404
        
        return jsonify({
            'message': 'Notification marked as read'
        })
    
    finally:
        services['session'].close()

# Dashboard Endpoint
@app.route('/api/dashboard', methods=['GET'])
@require_auth()
def get_dashboard():
    """Get dashboard statistics"""
    services = get_db_services()
    try:
        stats = services['dashboard_service'].get_dashboard_stats(
            user_id=request.current_user['id'],
            user_role=UserRole(request.current_user['role'])
        )
        
        return jsonify(stats)
    
    finally:
        services['session'].close()

# Health Check Endpoint
@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.utcnow().isoformat(),
        'version': '1.0.0'
    })

# Initialize database on startup


if __name__ == '__main__':
    # Initialize database if running directly
    init_database()
    
    # Run the development server
    debug_mode = os.environ.get('DEBUG', 'True').lower() == 'true'
    port = int(os.environ.get('PORT', 5000))
    
    app.run(
        host='0.0.0.0',
        port=port,
        debug=debug_mode
    )