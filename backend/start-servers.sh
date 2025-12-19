#!/bin/bash

echo "Starting CBMS Backend Services..."
echo ""

# Start Socket.IO server in background
echo "Starting Socket.IO server on port 3001..."
node socket-server.js &
SOCKET_PID=$!

# Wait a moment for socket server to start
sleep 2

# Start Laravel development server
echo "Starting Laravel server on port 8000..."
php artisan serve

# Cleanup on exit
trap "kill $SOCKET_PID" EXIT
