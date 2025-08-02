#!/bin/bash

# Make sure the script is executable
chmod +x start.sh

# Initialize database if it doesn't exist
if [ ! -f "quickdesk.db" ]; then
    echo "Initializing database..."
    python database.py
fi

# Start the application
echo "Starting QuickDesk Backend..."
exec gunicorn --config gunicorn.conf.py api:app
