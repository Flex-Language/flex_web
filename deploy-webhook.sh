#!/bin/bash

# GitHub webhook deployment script
echo "================================"
echo "Starting webhook deployment at $(date)"
echo "================================"

# Navigate to the main repository directory
cd /var/wwww/Flex

# Pull the latest changes for the web project
echo "Pulling latest changes for flex_web..."
git pull

# Navigate to the external compiler directory
cd flex_compiler_external

# Pull the latest changes for the compiler
echo "Pulling latest changes for Flex compiler..."
git pull

# Navigate back to the web project backend
cd ../src/flex_web/backend

# Install any new dependencies for the web backend
echo "Installing backend dependencies..."
npm install --production

# Check if the logs directory exists, create if not
if [ ! -d "../logs" ]; then
  echo "Creating logs directory..."
  mkdir -p ../logs
fi

# Make sure the temp directory exists
if [ ! -d "./temp" ]; then
  echo "Creating temp directory..."
  mkdir -p ./temp
fi

# Set proper permissions
chmod -R 755 ../logs
chmod -R 755 ./temp

# Restart the application with PM2
echo "Restarting application..."
cd ..
pm2 restart ecosystem.config.js --update-env

echo "================================"
echo "Deployment completed at $(date)"
echo "================================" 