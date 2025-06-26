#!/bin/bash

# Flex Web Compiler Startup Script
# This script properly loads NVM environment and starts the server

# Set up environment variables
export NODE_ENV=production
export PORT=3000
export PYTHON_PATH=python3
export USE_FLEX_AI=false

# Set up the path to Node.js (system-wide link)
NODE_PATH="/usr/local/bin/node"

# Verify Node.js exists and is executable
if [ ! -x "$NODE_PATH" ]; then
    echo "Error: Node.js not found or not executable at $NODE_PATH"
    exit 1
fi

# Change to the backend directory
cd /var/wwww/Flex/flex_web/backend

# Use Node.js to start the server
exec "$NODE_PATH" server.js 