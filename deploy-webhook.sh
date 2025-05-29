#!/bin/bash

# GitHub webhook deployment script - Optimized for HP Z620 Workstation
echo "================================"
echo "Starting webhook deployment at $(date)"
echo "================================"

# Navigate to the main repository directory
cd /var/wwww/Flex

# Pull the latest changes for the web project
echo "Pulling latest changes for flex_web..."
git pull

# Navigate to the external compiler directory if it exists
if [ -d "flex_compiler_external" ]; then
    cd flex_compiler_external
    
    # Pull the latest changes for the compiler
    echo "Pulling latest changes for Flex compiler..."
    git pull
    
    # Navigate back to the web project backend
    cd ../flex_web/backend
else
    # Navigate directly to the web project backend
    cd flex_web/backend
fi

# Ensure Bun is in PATH
export PATH="$HOME/.bun/bin:$PATH"

# Install any new dependencies for the web backend using Bun
echo "Installing backend dependencies with Bun..."
bun install --production

# Navigate back to the web project root
cd ..

# Check if the logs directory exists, create if not
if [ ! -d "logs" ]; then
  echo "Creating logs directory..."
  mkdir -p logs
fi

# Make sure the temp directory exists
if [ ! -d "backend/temp" ]; then
  echo "Creating temp directory..."
  mkdir -p backend/temp
fi

# Set proper permissions
chmod -R 755 logs
chmod -R 755 backend/temp

# Make sure PM2 is in PATH
export PATH="$HOME/.bun/bin:$PATH"

# Restart the application with PM2
echo "Restarting application with optimized settings..."
pm2 restart ecosystem.config.js --update-env

# Show current status
echo "Current PM2 status:"
pm2 list

echo "================================"
echo "Deployment completed at $(date)"
echo "================================" 