#!/bin/bash

# Flex Online Compiler Deployment Script - Optimized for HP Z620 Workstation
echo "Deploying Flex Online Compiler with Bun..."

# Navigate to the project directory
cd "$(dirname "$0")"

# Check for node and bun
if ! command -v node &> /dev/null; then
    echo "Error: Node.js is required but not installed."
    exit 1
fi

if ! command -v bun &> /dev/null; then
    echo "Bun not found. Installing Bun..."
    curl -fsSL https://bun.sh/install | bash
    export PATH="$HOME/.bun/bin:$PATH"
fi

# Check for PM2
if ! command -v pm2 &> /dev/null; then
    echo "PM2 not found. Installing PM2 globally with Bun..."
    bun add -g pm2
    export PATH="$HOME/.bun/bin:$PATH"
fi

# Install backend dependencies with Bun
echo "Installing backend dependencies with Bun..."
cd backend
bun install --production
cd ..

# Create necessary directories
echo "Creating necessary directories..."
mkdir -p backend/temp logs

# Set production environment
echo "Setting production environment..."
if [ ! -f .env ]; then
    echo "Creating .env file..."
    cat > .env << EOF
PORT=3000
NODE_ENV=production
PYTHON_PATH=python3
FLEX_SRC_PATH=../../compiler
TEMP_DIR=./temp
LOG_LEVEL=info
# Memory optimization for 4GB system
NODE_OPTIONS=--max-old-space-size=768
UV_THREADPOOL_SIZE=8
EOF
else
    # Update existing .env file
    sed -i 's/NODE_ENV=development/NODE_ENV=production/' .env
    sed -i 's/PORT=80/PORT=3000/' .env
fi

# Check permissions for log directories
echo "Setting permissions..."
chmod -R 755 logs
chmod -R 755 backend/temp

# Check if PM2 is in PATH
export PATH="$HOME/.bun/bin:$PATH"

# Stop any existing PM2 processes
echo "Stopping existing PM2 processes..."
pm2 stop flex-web-compiler 2>/dev/null || echo "No existing process to stop"
pm2 delete flex-web-compiler 2>/dev/null || echo "No existing process to delete"

# Start the application with PM2
echo "Starting application with optimized PM2 configuration..."
pm2 start ecosystem.config.js --env production

# Save PM2 process list
echo "Saving PM2 process list..."
pm2 save

# Setup PM2 to start on system boot
echo "Setting up PM2 startup script..."
pm2 startup | grep -E '^sudo' | bash || echo "PM2 startup already configured"

# Display status
echo "Deployment complete!"
echo "Application status:"
pm2 list
echo ""
echo "System Resources:"
echo "Memory usage:"
free -h
echo ""
echo "The Flex Online Compiler should now be running at http://localhost:3000"
echo "To monitor the application, use: pm2 monit"
echo "To view logs, use: pm2 logs flex-web-compiler" 