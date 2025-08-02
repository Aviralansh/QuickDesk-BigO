"""
QuickDesk Help Desk System - Business Logic Services
Contains all business logic for user management, tickets, notifications, etc.
"""

import os
import uuid
import smtplib
from datetime import datetime
from typing import List, Optional, Dict, Any
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from sqlalchemy import and_, or_, desc, asc, func
from sqlalchemy.orm import Session, joinedload
from werkzeug.utils import secure_filename

from models import (
    User, Ticket, Category, TicketComment, TicketAttachment, 
    TicketVote, Notification, UserRole, TicketStatus, TicketPriority
)

class UserService:
    def __init__(self, db_session: Session):
        self.db = db_session
    
    def create_user(self, username: str, email: str, password: str, 
                   full_name: str, role: UserRole = UserRole.END_USER) -> User:
        """Create a new user"""
        # Check if user already exists
        if self.db.query(User).filter_by(username=username).first():
            raise ValueError(f"Username '{username}' already exists")
        
        if self.db.query(User).filter_by(email=email).first():
            raise ValueError(f"Email '{email}' already exists")
        
        user = User(
            username=username,
            email=email,
            full_name=full_name,
            role=role
        )
        user.set_password(password)
        
        self.db.add(user)
        self.db.commit()
        return user
    
    def authenticate_user(self, username: str, password: str) -> Optional[User]:
        """Authenticate user with username/password"""
        user = self.db.query(User).filter_by(username=username, is_active=True).first()
        if user and user.check_password(password):
            return user
        return None
    
    def get_user_by_id(self, user_id: int) -> Optional[User]:
        """Get user by ID"""
        return self.db.query(User).filter_by(id=user_id, is_active=True).first()
    
    def get_users(self, role: Optional[UserRole] = None, 
                 search: Optional[str] = None, limit: int = 50, offset: int = 0) -> List[User]:
        """Get users with optional filtering"""
        query = self.db.query(User).filter_by(is_active=True)
        
        if role:
            query = query.filter(User.role == role)
        
        if search:
            query = query.filter(
                or_(
                    User.username.ilike(f"%{search}%"),
                    User.email.ilike(f"%{search}%"),
                    User.full_name.ilike(f"%{search}%")
                )
            )
        
        return query.offset(offset).limit(limit).all()
    
    def update_user(self, user_id: int, **kwargs) -> Optional[User]:
        """Update user information"""
        user = self.get_user_by_id(user_id)
        if not user:
            return None
        
        for key, value in kwargs.items():
            if hasattr(user, key) and key != 'id':
                setattr(user, key, value)
        
        user.updated_at = datetime.utcnow()
        self.db.commit()
        return user

class CategoryService:
    def __init__(self, db_session: Session):
        self.db = db_session
    
    def create_category(self, name: str, description: str = None, color: str = "#007bff") -> Category:
        """Create a new category"""
        if self.db.query(Category).filter_by(name=name).first():
            raise ValueError(f"Category '{name}' already exists")
        
        category = Category(
            name=name,
            description=description,
            color=color
        )
        
        self.db.add(category)
        self.db.commit()
        return category
    
    def get_categories(self, active_only: bool = True) -> List[Category]:
        """Get all categories"""
        query = self.db.query(Category)
        if active_only:
            query = query.filter_by(is_active=True)
        return query.all()
    
    def get_category_by_id(self, category_id: int) -> Optional[Category]:
        """Get category by ID"""
        return self.db.query(Category).filter_by(id=category_id, is_active=True).first()
    
    def update_category(self, category_id: int, **kwargs) -> Optional[Category]:
        """Update category"""
        category = self.get_category_by_id(category_id)
        if not category:
            return None
        
        for key, value in kwargs.items():
            if hasattr(category, key) and key != 'id':
                setattr(category, key, value)
        
        self.db.commit()
        return category

class TicketService:
    def __init__(self, db_session: Session):
        self.db = db_session
        self.notification_service = NotificationService(db_session)
    
    def create_ticket(self, subject: str, description: str, category_id: int, 
                     created_by_id: int, priority: TicketPriority = TicketPriority.MEDIUM) -> Ticket:
        """Create a new ticket"""
        ticket = Ticket(
            subject=subject,
            description=description,
            category_id=category_id,
            created_by_id=created_by_id,
            priority=priority,
            status=TicketStatus.OPEN
        )
        
        self.db.add(ticket)
        self.db.commit()
        
        # Send notification
        self.notification_service.create_ticket_notification(ticket)
        
        return ticket
    
    def get_tickets(self, user_id: Optional[int] = None, user_role: Optional[UserRole] = None,
                   status: Optional[TicketStatus] = None, category_id: Optional[int] = None,
                   search: Optional[str] = None, sort_by: str = "updated_at",
                   sort_order: str = "desc", limit: int = 50, offset: int = 0) -> Dict[str, Any]:
        """Get tickets with filtering, searching, and pagination"""
        
        query = self.db.query(Ticket).options(
            joinedload(Ticket.creator),
            joinedload(Ticket.assignee),
            joinedload(Ticket.category)
        )
        
        # Filter based on user role
        if user_role == UserRole.END_USER and user_id:
            # End users can only see their own tickets
            query = query.filter(Ticket.created_by_id == user_id)
        elif user_role == UserRole.SUPPORT_AGENT and user_id:
            # Support agents can see all tickets or their assigned tickets
            pass  # No additional filtering needed
        
        # Apply filters
        if status:
            query = query.filter(Ticket.status == status)
        
        if category_id:
            query = query.filter(Ticket.category_id == category_id)
        
        if search:
            query = query.filter(
                or_(
                    Ticket.subject.ilike(f"%{search}%"),
                    Ticket.description.ilike(f"%{search}%")
                )
            )
        
        # Count total records before pagination
        total_count = query.count()
        
        # Apply sorting
        if sort_by == "votes":
            if sort_order == "desc":
                query = query.order_by(desc(Ticket.upvotes - Ticket.downvotes))
            else:
                query = query.order_by(asc(Ticket.upvotes - Ticket.downvotes))
        elif sort_by == "replies":
            # Sort by comment count (requires subquery)
            subquery = self.db.query(
                TicketComment.ticket_id,
                func.count(TicketComment.id).label('comment_count')
            ).group_by(TicketComment.ticket_id).subquery()
            
            query = query.outerjoin(subquery, Ticket.id == subquery.c.ticket_id)
            if sort_order == "desc":
                query = query.order_by(desc(subquery.c.comment_count))
            else:
                query = query.order_by(asc(subquery.c.comment_count))
        else:
            # Default sorting by created_at, updated_at, etc.
            if hasattr(Ticket, sort_by):
                if sort_order == "desc":
                    query = query.order_by(desc(getattr(Ticket, sort_by)))
                else:
                    query = query.order_by(asc(getattr(Ticket, sort_by)))
        
        # Apply pagination
        tickets = query.offset(offset).limit(limit).all()
        
        return {
            'tickets': [ticket.to_dict() for ticket in tickets],
            'total_count': total_count,
            'limit': limit,
            'offset': offset,
            'has_more': (offset + limit) < total_count
        }
    
    def get_ticket_by_id(self, ticket_id: int, user_id: Optional[int] = None, 
                        user_role: Optional[UserRole] = None) -> Optional[Ticket]:
        """Get ticket by ID with permission checking"""
        query = self.db.query(Ticket).options(
            joinedload(Ticket.creator),
            joinedload(Ticket.assignee),
            joinedload(Ticket.category),
            joinedload(Ticket.comments).joinedload(TicketComment.author),
            joinedload(Ticket.attachments)
        )
        
        ticket = query.filter_by(id=ticket_id).first()
        
        if not ticket:
            return None
        
        # Check permissions
        if user_role == UserRole.END_USER:
            if ticket.created_by_id != user_id:
                return None  # End users can only view their own tickets
        
        return ticket
    
    def update_ticket_status(self, ticket_id: int, status: TicketStatus, 
                           updated_by_id: int) -> Optional[Ticket]:
        """Update ticket status"""
        ticket = self.db.query(Ticket).filter_by(id=ticket_id).first()
        if not ticket:
            return None
        
        old_status = ticket.status
        ticket.status = status
        ticket.updated_at = datetime.utcnow()
        
        # Set timestamps for specific status changes
        if status == TicketStatus.RESOLVED:
            ticket.resolved_at = datetime.utcnow()
        elif status == TicketStatus.CLOSED:
            ticket.closed_at = datetime.utcnow()
        
        self.db.commit()
        
        # Send notification for status change
        if old_status != status:
            self.notification_service.create_status_change_notification(ticket, old_status, status)
        
        return ticket
    
    def assign_ticket(self, ticket_id: int, assigned_to_id: Optional[int]) -> Optional[Ticket]:
        """Assign ticket to a support agent"""
        ticket = self.db.query(Ticket).filter_by(id=ticket_id).first()
        if not ticket:
            return None
        
        ticket.assigned_to_id = assigned_to_id
        ticket.updated_at = datetime.utcnow()
        
        # Update status to IN_PROGRESS if it was OPEN
        if ticket.status == TicketStatus.OPEN and assigned_to_id:
            ticket.status = TicketStatus.IN_PROGRESS
        
        self.db.commit()
        return ticket
    
    def add_comment(self, ticket_id: int, content: str, author_id: int, 
                   is_internal: bool = False) -> Optional[TicketComment]:
        """Add comment to ticket"""
        ticket = self.db.query(Ticket).filter_by(id=ticket_id).first()
        if not ticket:
            return None
        
        comment = TicketComment(
            ticket_id=ticket_id,
            content=content,
            author_id=author_id,
            is_internal=is_internal
        )
        
        self.db.add(comment)
        ticket.updated_at = datetime.utcnow()
        self.db.commit()
        
        # Send notification for new comment
        self.notification_service.create_comment_notification(ticket, comment)
        
        return comment
    
    def vote_ticket(self, ticket_id: int, user_id: int, is_upvote: bool) -> Optional[Dict[str, Any]]:
        """Vote on a ticket (upvote/downvote)"""
        ticket = self.db.query(Ticket).filter_by(id=ticket_id).first()
        if not ticket:
            return None
        
        # Check if user already voted
        existing_vote = self.db.query(TicketVote).filter_by(
            ticket_id=ticket_id, 
            user_id=user_id
        ).first()
        
        if existing_vote:
            if existing_vote.is_upvote == is_upvote:
                # Same vote - remove it
                self.db.delete(existing_vote)
                if is_upvote:
                    ticket.upvotes = max(0, ticket.upvotes - 1)
                else:
                    ticket.downvotes = max(0, ticket.downvotes - 1)
                action = "removed"
            else:
                # Different vote - change it
                existing_vote.is_upvote = is_upvote
                existing_vote.updated_at = datetime.utcnow()
                if is_upvote:
                    ticket.upvotes += 1
                    ticket.downvotes = max(0, ticket.downvotes - 1)
                else:
                    ticket.downvotes += 1
                    ticket.upvotes = max(0, ticket.upvotes - 1)
                action = "changed"
        else:
            # New vote
            vote = TicketVote(
                ticket_id=ticket_id,
                user_id=user_id,
                is_upvote=is_upvote
            )
            self.db.add(vote)
            if is_upvote:
                ticket.upvotes += 1
            else:
                ticket.downvotes += 1
            action = "added"
        
        self.db.commit()
        
        return {
            'action': action,
            'vote_type': 'upvote' if is_upvote else 'downvote',
            'upvotes': ticket.upvotes,
            'downvotes': ticket.downvotes,
            'vote_score': ticket.vote_score
        }

class AttachmentService:
    def __init__(self, db_session: Session):
        self.db = db_session
        self.upload_folder = os.environ.get('UPLOAD_FOLDER', 'uploads')
        self.max_file_size = int(os.environ.get('MAX_FILE_SIZE', 10 * 1024 * 1024))  # 10MB
        
        # Create upload directory if it doesn't exist
        os.makedirs(self.upload_folder, exist_ok=True)
    
    def save_attachment(self, file, ticket_id: int, uploaded_by_id: int) -> TicketAttachment:
        """Save file attachment for a ticket"""
        if not file or not file.filename:
            raise ValueError("No file provided")
        
        # Check file size
        file.seek(0, os.SEEK_END)
        file_size = file.tell()
        file.seek(0)
        
        if file_size > self.max_file_size:
            raise ValueError(f"File size exceeds maximum allowed size of {self.max_file_size} bytes")
        
        # Generate unique filename
        original_filename = secure_filename(file.filename)
        file_extension = os.path.splitext(original_filename)[1]
        unique_filename = f"{uuid.uuid4()}{file_extension}"
        
        # Save file
        file_path = os.path.join(self.upload_folder, unique_filename)
        file.save(file_path)
        
        # Create database record
        attachment = TicketAttachment(
            filename=unique_filename,
            original_filename=original_filename,
            file_size=file_size,
            mime_type=file.content_type or 'application/octet-stream',
            file_path=file_path,
            ticket_id=ticket_id,
            uploaded_by_id=uploaded_by_id
        )
        
        self.db.add(attachment)
        self.db.commit()
        
        return attachment
    
    def get_attachment(self, attachment_id: int) -> Optional[TicketAttachment]:
        """Get attachment by ID"""
        return self.db.query(TicketAttachment).filter_by(id=attachment_id).first()

class NotificationService:
    def __init__(self, db_session: Session):
        self.db = db_session
        self.email_service = EmailService()
    
    def create_notification(self, user_id: int, title: str, message: str, 
                          notification_type: str, ticket_id: Optional[int] = None) -> Notification:
        """Create a new notification"""
        notification = Notification(
            user_id=user_id,
            title=title,
            message=message,
            notification_type=notification_type,
            ticket_id=ticket_id
        )
        
        self.db.add(notification)
        self.db.commit()
        
        # Send email notification
        user = self.db.query(User).filter_by(id=user_id).first()
        if user:
            self.email_service.send_notification_email(user.email, title, message)
            notification.is_email_sent = True
            self.db.commit()
        
        return notification
    
    def create_ticket_notification(self, ticket: Ticket):
        """Create notification when a new ticket is created"""
        # Notify admins and support agents
        users_to_notify = self.db.query(User).filter(
            User.role.in_([UserRole.ADMIN, UserRole.SUPPORT_AGENT]),
            User.is_active == True
        ).all()
        
        for user in users_to_notify:
            self.create_notification(
                user_id=user.id,
                title=f"New Ticket Created: {ticket.subject}",
                message=f"A new ticket has been created by {ticket.creator.full_name}. Category: {ticket.category.name}",
                notification_type="ticket_created",
                ticket_id=ticket.id
            )
    
    def create_status_change_notification(self, ticket: Ticket, old_status: TicketStatus, new_status: TicketStatus):
        """Create notification when ticket status changes"""
        # Notify ticket creator
        self.create_notification(
            user_id=ticket.created_by_id,
            title=f"Ticket Status Updated: {ticket.subject}",
            message=f"Your ticket status has been changed from {old_status.value} to {new_status.value}",
            notification_type="status_changed",
            ticket_id=ticket.id
        )
    
    def create_comment_notification(self, ticket: Ticket, comment: TicketComment):
        """Create notification when a comment is added"""
        if not comment.is_internal:
            # Notify ticket creator if comment is not from them
            if comment.author_id != ticket.created_by_id:
                self.create_notification(
                    user_id=ticket.created_by_id,
                    title=f"New Comment on Ticket: {ticket.subject}",
                    message=f"{comment.author.full_name} has added a comment to your ticket",
                    notification_type="comment_added",
                    ticket_id=ticket.id
                )
    
    def get_user_notifications(self, user_id: int, unread_only: bool = False, 
                             limit: int = 50, offset: int = 0) -> List[Notification]:
        """Get notifications for a user"""
        query = self.db.query(Notification).filter_by(user_id=user_id)
        
        if unread_only:
            query = query.filter_by(is_read=False)
        
        return query.order_by(desc(Notification.created_at)).offset(offset).limit(limit).all()
    
    def mark_notification_read(self, notification_id: int, user_id: int) -> Optional[Notification]:
        """Mark notification as read"""
        notification = self.db.query(Notification).filter_by(
            id=notification_id, 
            user_id=user_id
        ).first()
        
        if notification:
            notification.is_read = True
            self.db.commit()
        
        return notification

class EmailService:
    def __init__(self):
        self.smtp_server = os.environ.get('SMTP_SERVER', 'localhost')
        self.smtp_port = int(os.environ.get('SMTP_PORT', 587))
        self.smtp_username = os.environ.get('SMTP_USERNAME', '')
        self.smtp_password = os.environ.get('SMTP_PASSWORD', '')
        self.from_email = os.environ.get('FROM_EMAIL', 'noreply@quickdesk.com')
        self.enabled = os.environ.get('EMAIL_ENABLED', 'False').lower() == 'true'
    
    def send_notification_email(self, to_email: str, subject: str, message: str):
        """Send email notification"""
        if not self.enabled:
            print(f"Email notification (disabled): {to_email} - {subject}")
            return
        
        try:
            # Create message
            msg = MIMEMultipart()
            msg['From'] = self.from_email
            msg['To'] = to_email
            msg['Subject'] = f"QuickDesk - {subject}"
            
            # Email body
            body = f"""
            Hello,
            
            {message}
            
            You can view and manage your tickets by logging into QuickDesk.
            
            Best regards,
            QuickDesk Support Team
            """
            
            msg.attach(MIMEText(body, 'plain'))
            
            # Send email
            with smtplib.SMTP(self.smtp_server, self.smtp_port) as server:
                if self.smtp_username and self.smtp_password:
                    server.starttls()
                    server.login(self.smtp_username, self.smtp_password)
                
                server.send_message(msg)
            
            print(f"Email sent successfully to {to_email}")
            
        except Exception as e:
            print(f"Failed to send email to {to_email}: {str(e)}")

class DashboardService:
    def __init__(self, db_session: Session):
        self.db = db_session
    
    def get_dashboard_stats(self, user_id: Optional[int] = None, 
                           user_role: Optional[UserRole] = None) -> Dict[str, Any]:
        """Get dashboard statistics"""
        stats = {}
        
        # Base query for tickets
        base_query = self.db.query(Ticket)
        
        # Filter for end users - only their tickets
        if user_role == UserRole.END_USER and user_id:
            base_query = base_query.filter(Ticket.created_by_id == user_id)
        
        # Ticket counts by status
        stats['ticket_counts'] = {
            'open': base_query.filter(Ticket.status == TicketStatus.OPEN).count(),
            'in_progress': base_query.filter(Ticket.status == TicketStatus.IN_PROGRESS).count(),
            'resolved': base_query.filter(Ticket.status == TicketStatus.RESOLVED).count(),
            'closed': base_query.filter(Ticket.status == TicketStatus.CLOSED).count(),
            'total': base_query.count()
        }
        
        # Recent tickets
        recent_tickets = base_query.options(
            joinedload(Ticket.creator),
            joinedload(Ticket.category)
        ).order_by(desc(Ticket.created_at)).limit(10).all()
        
        stats['recent_tickets'] = [ticket.to_dict() for ticket in recent_tickets]
        
        # Category distribution
        category_stats = self.db.query(
            Category.name,
            func.count(Ticket.id).label('count')
        ).join(Ticket).group_by(Category.name).all()
        
        stats['category_distribution'] = [
            {'category': name, 'count': count} for name, count in category_stats
        ]
        
        # For admins and agents, include additional stats
        if user_role in [UserRole.ADMIN, UserRole.SUPPORT_AGENT]:
            # Top voted tickets
            top_voted = self.db.query(Ticket).options(
                joinedload(Ticket.creator),
                joinedload(Ticket.category)
            ).order_by(desc(Ticket.upvotes - Ticket.downvotes)).limit(5).all()
            
            stats['top_voted_tickets'] = [ticket.to_dict() for ticket in top_voted]
            
            # Most active users
            active_users = self.db.query(
                User.full_name,
                func.count(Ticket.id).label('ticket_count')
            ).join(Ticket, User.id == Ticket.created_by_id).group_by(
                User.id, User.full_name
            ).order_by(desc('ticket_count')).limit(5).all()
            
            stats['most_active_users'] = [
                {'user': name, 'ticket_count': count} for name, count in active_users
            ]
        
        return stats