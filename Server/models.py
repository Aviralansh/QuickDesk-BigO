"""
QuickDesk Help Desk System - Database Models
Handles user management, tickets, categories, and interactions
"""

from datetime import datetime
from enum import Enum
from typing import Optional, List
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Boolean, Enum as SQLEnum
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from werkzeug.security import generate_password_hash, check_password_hash

Base = declarative_base()

class UserRole(Enum):
    END_USER = "end_user"
    SUPPORT_AGENT = "support_agent"
    ADMIN = "admin"

class TicketStatus(Enum):
    OPEN = "open"
    IN_PROGRESS = "in_progress"
    RESOLVED = "resolved"
    CLOSED = "closed"

class TicketPriority(Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    URGENT = "urgent"

class User(Base):
    __tablename__ = 'users'
    
    id = Column(Integer, primary_key=True)
    username = Column(String(80), unique=True, nullable=False)
    email = Column(String(120), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    full_name = Column(String(100), nullable=False)
    role = Column(SQLEnum(UserRole), nullable=False, default=UserRole.END_USER)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    created_tickets = relationship("Ticket", foreign_keys="Ticket.created_by_id", back_populates="creator")
    assigned_tickets = relationship("Ticket", foreign_keys="Ticket.assigned_to_id", back_populates="assignee")
    comments = relationship("TicketComment", back_populates="author")
    votes = relationship("TicketVote", back_populates="user")
    
    def set_password(self, password: str):
        self.password_hash = generate_password_hash(password)
    
    def check_password(self, password: str) -> bool:
        return check_password_hash(self.password_hash, password)
    
    def to_dict(self):
        return {
            'id': self.id,
            'username': self.username,
            'email': self.email,
            'full_name': self.full_name,
            'role': self.role.value,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

class Category(Base):
    __tablename__ = 'categories'
    
    id = Column(Integer, primary_key=True)
    name = Column(String(100), unique=True, nullable=False)
    description = Column(Text)
    color = Column(String(7), default="#007bff")  # Hex color
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    tickets = relationship("Ticket", back_populates="category")
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'color': self.color,
            'is_active': self.is_active
        }

class Ticket(Base):
    __tablename__ = 'tickets'
    
    id = Column(Integer, primary_key=True)
    subject = Column(String(200), nullable=False)
    description = Column(Text, nullable=False)
    status = Column(SQLEnum(TicketStatus), nullable=False, default=TicketStatus.OPEN)
    priority = Column(SQLEnum(TicketPriority), nullable=False, default=TicketPriority.MEDIUM)
    
    # Foreign Keys
    created_by_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    assigned_to_id = Column(Integer, ForeignKey('users.id'), nullable=True)
    category_id = Column(Integer, ForeignKey('categories.id'), nullable=False)
    
    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    resolved_at = Column(DateTime, nullable=True)
    closed_at = Column(DateTime, nullable=True)
    
    # Voting system
    upvotes = Column(Integer, default=0)
    downvotes = Column(Integer, default=0)
    
    # Relationships
    creator = relationship("User", foreign_keys=[created_by_id], back_populates="created_tickets")
    assignee = relationship("User", foreign_keys=[assigned_to_id], back_populates="assigned_tickets")
    category = relationship("Category", back_populates="tickets")
    comments = relationship("TicketComment", back_populates="ticket", cascade="all, delete-orphan")
    attachments = relationship("TicketAttachment", back_populates="ticket", cascade="all, delete-orphan")
    votes = relationship("TicketVote", back_populates="ticket", cascade="all, delete-orphan")
    
    @property
    def vote_score(self):
        return self.upvotes - self.downvotes
    
    @property
    def comment_count(self):
        return len(self.comments)
    
    def to_dict(self, include_relations=False):
        data = {
            'id': self.id,
            'subject': self.subject,
            'description': self.description,
            'status': self.status.value,
            'priority': self.priority.value,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'resolved_at': self.resolved_at.isoformat() if self.resolved_at else None,
            'closed_at': self.closed_at.isoformat() if self.closed_at else None,
            'upvotes': self.upvotes,
            'downvotes': self.downvotes,
            'vote_score': self.vote_score,
            'comment_count': self.comment_count
        }
        
        if include_relations:
            data.update({
                'creator': self.creator.to_dict() if self.creator else None,
                'assignee': self.assignee.to_dict() if self.assignee else None,
                'category': self.category.to_dict() if self.category else None,
                'comments': [comment.to_dict() for comment in self.comments],
                'attachments': [att.to_dict() for att in self.attachments]
            })
        else:
            data.update({
                'created_by_id': self.created_by_id,
                'assigned_to_id': self.assigned_to_id,
                'category_id': self.category_id,
                'creator_name': self.creator.full_name if self.creator else None,
                'assignee_name': self.assignee.full_name if self.assignee else None,
                'category_name': self.category.name if self.category else None
            })
        
        return data

class TicketComment(Base):
    __tablename__ = 'ticket_comments'
    
    id = Column(Integer, primary_key=True)
    content = Column(Text, nullable=False)
    is_internal = Column(Boolean, default=False)  # Internal notes for agents
    
    # Foreign Keys
    ticket_id = Column(Integer, ForeignKey('tickets.id'), nullable=False)
    author_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    
    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    ticket = relationship("Ticket", back_populates="comments")
    author = relationship("User", back_populates="comments")
    
    def to_dict(self):
        return {
            'id': self.id,
            'content': self.content,
            'is_internal': self.is_internal,
            'ticket_id': self.ticket_id,
            'author_id': self.author_id,
            'author_name': self.author.full_name if self.author else None,
            'author_role': self.author.role.value if self.author else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

class TicketAttachment(Base):
    __tablename__ = 'ticket_attachments'
    
    id = Column(Integer, primary_key=True)
    filename = Column(String(255), nullable=False)
    original_filename = Column(String(255), nullable=False)
    file_size = Column(Integer, nullable=False)
    mime_type = Column(String(100), nullable=False)
    file_path = Column(String(500), nullable=False)
    
    # Foreign Keys
    ticket_id = Column(Integer, ForeignKey('tickets.id'), nullable=False)
    uploaded_by_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    
    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    ticket = relationship("Ticket", back_populates="attachments")
    uploader = relationship("User")
    
    def to_dict(self):
        return {
            'id': self.id,
            'filename': self.filename,
            'original_filename': self.original_filename,
            'file_size': self.file_size,
            'mime_type': self.mime_type,
            'ticket_id': self.ticket_id,
            'uploaded_by': self.uploader.full_name if self.uploader else None,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

class TicketVote(Base):
    __tablename__ = 'ticket_votes'
    
    id = Column(Integer, primary_key=True)
    is_upvote = Column(Boolean, nullable=False)  # True for upvote, False for downvote
    
    # Foreign Keys
    ticket_id = Column(Integer, ForeignKey('tickets.id'), nullable=False)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    
    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    ticket = relationship("Ticket", back_populates="votes")
    user = relationship("User", back_populates="votes")
    
    # Unique constraint to prevent multiple votes from same user on same ticket
    __table_args__ = (
        {'mysql_engine': 'InnoDB', 'mysql_charset': 'utf8mb4'},
    )
    
    def to_dict(self):
        return {
            'id': self.id,
            'is_upvote': self.is_upvote,
            'ticket_id': self.ticket_id,
            'user_id': self.user_id,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

class Notification(Base):
    __tablename__ = 'notifications'
    
    id = Column(Integer, primary_key=True)
    title = Column(String(200), nullable=False)
    message = Column(Text, nullable=False)
    notification_type = Column(String(50), nullable=False)  # ticket_created, status_changed, etc.
    is_read = Column(Boolean, default=False)
    is_email_sent = Column(Boolean, default=False)
    
    # Foreign Keys
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    ticket_id = Column(Integer, ForeignKey('tickets.id'), nullable=True)
    
    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    user = relationship("User")
    ticket = relationship("Ticket")
    
    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'message': self.message,
            'notification_type': self.notification_type,
            'is_read': self.is_read,
            'ticket_id': self.ticket_id,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }