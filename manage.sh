#!/bin/bash

# Flex Web Compiler Management Script
# Optimized for HP Z620 Workstation

APP_NAME="flex-web-compiler"
PROJECT_DIR="/var/wwww/Flex/flex_web"

# Ensure we're in the right directory
cd "$PROJECT_DIR" || { echo "Error: Cannot access project directory"; exit 1; }

# Ensure PM2 is in PATH
export PATH="/root/.bun/bin:$PATH"

print_header() {
    echo "=============================================="
    echo "Flex Web Compiler Management"
    echo "Optimized for HP Z620 Workstation"
    echo "=============================================="
}

print_usage() {
    echo "Usage: $0 [COMMAND]"
    echo ""
    echo "Commands:"
    echo "  start     - Start the application"
    echo "  stop      - Stop the application"
    echo "  restart   - Restart the application"
    echo "  reload    - Graceful reload (zero-downtime)"
    echo "  status    - Show application status"
    echo "  monitor   - Show system and app monitoring"
    echo "  logs      - Show application logs"
    echo "  health    - Quick health check"
    echo "  deploy    - Full deployment with dependency install"
    echo "  save      - Save current PM2 configuration"
    echo "  cleanup   - Clean logs and temporary files"
    echo ""
    echo "Examples:"
    echo "  $0 start"
    echo "  $0 monitor"
    echo "  $0 logs"
}

start_app() {
    echo "Starting Flex Web Compiler..."
    pm2 start ecosystem.config.js --env production
    echo "Application started. Use '$0 status' to check."
}

stop_app() {
    echo "Stopping Flex Web Compiler..."
    pm2 stop $APP_NAME
    echo "Application stopped."
}

restart_app() {
    echo "Restarting Flex Web Compiler..."
    pm2 restart $APP_NAME
    echo "Application restarted."
}

reload_app() {
    echo "Gracefully reloading Flex Web Compiler..."
    pm2 reload $APP_NAME
    echo "Application reloaded with zero downtime."
}

show_status() {
    echo "PM2 Process List:"
    pm2 list
    echo ""
    echo "Detailed Status:"
    pm2 show $APP_NAME
}

show_logs() {
    echo "Recent application logs (last 20 lines):"
    pm2 logs $APP_NAME --lines 20
}

health_check() {
    print_header
    echo ""
    
    # Quick PM2 status
    if pm2 list | grep -q "$APP_NAME"; then
        echo "✅ PM2 Process: Running"
    else
        echo "❌ PM2 Process: Not running"
        return 1
    fi
    
    # Quick HTTP health check
    if curl -s http://localhost:3000/api/status > /dev/null 2>&1; then
        echo "✅ HTTP Server: Responding"
    else
        echo "❌ HTTP Server: Not responding"
        return 1
    fi
    
    # Memory check
    mem_used=$(free | grep Mem | awk '{print int($3/$2 * 100)}')
    if [ $mem_used -lt 80 ]; then
        echo "✅ Memory Usage: Healthy ($mem_used%)"
    else
        echo "⚠️  Memory Usage: High ($mem_used%)"
    fi
    
    echo ""
    echo "All systems operational!"
}

deploy_app() {
    print_header
    echo ""
    echo "Deploying Flex Web Compiler with optimized configuration..."
    
    # Install dependencies
    echo "Installing dependencies..."
    cd backend && npm install --production && cd ..
    
    # Stop existing processes
    echo "Stopping existing processes..."
    pm2 stop $APP_NAME 2>/dev/null || echo "No existing process to stop"
    pm2 delete $APP_NAME 2>/dev/null || echo "No existing process to delete"
    
    # Start with optimized config
    echo "Starting with optimized configuration..."
    pm2 start ecosystem.config.js --env production
    
    # Save configuration
    echo "Saving PM2 configuration..."
    pm2 save
    
    echo ""
    echo "Deployment completed successfully!"
    echo "Use '$0 monitor' to check system status."
}

save_config() {
    echo "Saving PM2 configuration..."
    pm2 save
    echo "Configuration saved. Application will auto-start on boot."
}

cleanup_files() {
    echo "Cleaning up logs and temporary files..."
    
    # Clean PM2 logs
    pm2 flush
    
    # Clean application logs if they're large
    if [ -f "./logs/error.log" ] && [ $(stat -c%s "./logs/error.log") -gt 52428800 ]; then
        echo "Rotating large error log..."
        mv ./logs/error.log ./logs/error.log.old
        touch ./logs/error.log
    fi
    
    if [ -f "./logs/out.log" ] && [ $(stat -c%s "./logs/out.log") -gt 104857600 ]; then
        echo "Rotating large output log..."
        mv ./logs/out.log ./logs/out.log.old
        touch ./logs/out.log
    fi
    
    # Clean backend temp files
    if [ -d "./backend/temp" ]; then
        find ./backend/temp -name "code_*.lx" -mtime +1 -delete 2>/dev/null || true
        echo "Cleaned temporary code files."
    fi
    
    echo "Cleanup completed."
}

# Main script logic
case "${1:-}" in
    "start")
        start_app
        ;;
    "stop")
        stop_app
        ;;
    "restart")
        restart_app
        ;;
    "reload")
        reload_app
        ;;
    "status")
        show_status
        ;;
    "monitor")
        ./monitor.sh
        ;;
    "logs")
        show_logs
        ;;
    "health")
        health_check
        ;;
    "deploy")
        deploy_app
        ;;
    "save")
        save_config
        ;;
    "cleanup")
        cleanup_files
        ;;
    "")
        print_header
        echo ""
        print_usage
        ;;
    *)
        print_header
        echo ""
        echo "Error: Unknown command '$1'"
        echo ""
        print_usage
        exit 1
        ;;
esac 