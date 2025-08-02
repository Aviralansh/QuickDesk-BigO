"""
QuickDesk Help Desk System - Database Configuration
Handles database connection, session management, and initialization
"""

import os
from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker, scoped_session
from sqlalchemy.pool import StaticPool
from contextlib import contextmanager
from models import Base, User, Category, UserRole

class DatabaseConfig:
    def __init__(self, database_url=None):
        if database_url is None:
            # Default to SQLite for development
            database_url = os.environ.get('DATABASE_URL', 'sqlite:///quickdesk.db')
        
        # Handle SQLite specific configuration
        if database_url.startswith('sqlite'):
            self.engine = create_engine(
                database_url,
                poolclass=StaticPool,
                connect_args={
                    'check_same_thread': False,
                    'timeout': 20
                },
                echo=os.environ.get('DEBUG', 'False').lower() == 'true'
            )
        else:
            # For PostgreSQL, MySQL, etc.
            self.engine = create_engine(
                database_url,
                pool_size=10,
                max_overflow=20,
                pool_pre_ping=True,
                echo=os.environ.get('DEBUG', 'False').lower() == 'true'
            )
        
        # Create session factory
        self.SessionLocal = scoped_session(sessionmaker(
            autocommit=False,
            autoflush=False,
            bind=self.engine
        ))
    
    def create_tables(self):
        """Create all database tables"""
        Base.metadata.create_all(bind=self.engine)
    
    def drop_tables(self):
        """Drop all database tables (use with caution!)"""
        Base.metadata.drop_all(bind=self.engine)
    
    @contextmanager
    def get_session(self):
        """Context manager for database sessions"""
        session = self.SessionLocal()
        try:
            yield session
            session.commit()
        except Exception as e:
            session.rollback()
            raise e
        finally:
            session.close()
    
    def get_session_direct(self):
        """Get a session directly (remember to close it!)"""
        return self.SessionLocal()
    
    def initialize_data(self):
        """Initialize the database with default data"""
        with self.get_session() as session:
            # Create default admin user if doesn't exist
            admin_user = session.query(User).filter_by(username='admin').first()
            if not admin_user:
                admin_user = User(
                    username='admin',
                    email='admin@quickdesk.com',
                    full_name='System Administrator',
                    role=UserRole.ADMIN
                )
                admin_user.set_password('admin123')  # Change this in production!
                session.add(admin_user)
            
            # Create default support agent if doesn't exist
            agent_user = session.query(User).filter_by(username='agent').first()
            if not agent_user:
                agent_user = User(
                    username='agent',
                    email='agent@quickdesk.com',
                    full_name='Support Agent',
                    role=UserRole.SUPPORT_AGENT
                )
                agent_user.set_password('agent123')  # Change this in production!
                session.add(agent_user)
            
            # Create default end user if doesn't exist
            end_user = session.query(User).filter_by(username='user').first()
            if not end_user:
                end_user = User(
                    username='user',
                    email='user@quickdesk.com',
                    full_name='End User',
                    role=UserRole.END_USER
                )
                end_user.set_password('user123')  # Change this in production!
                session.add(end_user)
            
            # Create default categories if they don't exist
            default_categories = [
                {
                    'name': 'Technical Support',
                    'description': 'Technical issues and troubleshooting',
                    'color': '#dc3545'
                },
                {
                    'name': 'Account Issues',
                    'description': 'Account access and billing problems',
                    'color': '#ffc107'
                },
                {
                    'name': 'Feature Request',
                    'description': 'New feature suggestions and improvements',
                    'color': '#28a745'
                },
                {
                    'name': 'Bug Report',
                    'description': 'Software bugs and issues',
                    'color': '#fd7e14'
                },
                {
                    'name': 'General Inquiry',
                    'description': 'General questions and information requests',
                    'color': '#007bff'
                }
            ]
            
            for cat_data in default_categories:
                existing_cat = session.query(Category).filter_by(name=cat_data['name']).first()
                if not existing_cat:
                    category = Category(**cat_data)
                    session.add(category)
            
            session.commit()
            print("Database initialized with default data!")

# Global database instance
db_config = DatabaseConfig()

def get_db_session():
    """Dependency function for getting database session"""
    return db_config.get_session_direct()

def init_database():
    """Initialize database tables and default data"""
    print("Creating database tables...")
    db_config.create_tables()
    print("Initializing default data...")
    db_config.initialize_data()
    print("Database setup complete!")

if __name__ == "__main__":
    # Run this script to initialize the database
    init_database()
