#!/bin/bash

# Flex Web Compiler - Systemd Management Script
# Easy-to-use script for managing the Flex Web Compiler service

SERVICE_NAME="flex-web-compiler.service"

case "$1" in
    start)
        echo "🚀 Starting Flex Web Compiler service..."
        systemctl start $SERVICE_NAME
        echo "✅ Service started"
        ;;
    stop)
        echo "⏹️  Stopping Flex Web Compiler service..."
        systemctl stop $SERVICE_NAME
        echo "✅ Service stopped"
        ;;
    restart)
        echo "🔄 Restarting Flex Web Compiler service..."
        systemctl restart $SERVICE_NAME
        echo "✅ Service restarted"
        ;;
    status)
        echo "📊 Flex Web Compiler service status:"
        systemctl status $SERVICE_NAME --no-pager
        ;;
    logs)
        echo "📋 Recent logs for Flex Web Compiler:"
        journalctl -u $SERVICE_NAME -n 20 --no-pager
        ;;
    enable)
        echo "🔧 Enabling Flex Web Compiler service for automatic startup..."
        systemctl enable $SERVICE_NAME
        echo "✅ Service enabled for auto-start on boot"
        ;;
    disable)
        echo "🔧 Disabling Flex Web Compiler service auto-startup..."
        systemctl disable $SERVICE_NAME
        echo "✅ Service disabled from auto-start"
        ;;
    test)
        echo "🧪 Testing Flex Web Compiler API..."
        curl -X POST -H "Content-Type: application/json" \
             -d '{"code":"print(\"Hello from Flex!\")"}' \
             http://localhost:3000/api/execute
        echo ""
        echo "✅ API test completed"
        ;;
    *)
        echo "🔧 Flex Web Compiler - Systemd Management"
        echo "Usage: $0 {start|stop|restart|status|logs|enable|disable|test}"
        echo ""
        echo "Commands:"
        echo "  start    - Start the service"
        echo "  stop     - Stop the service"  
        echo "  restart  - Restart the service"
        echo "  status   - Show service status"
        echo "  logs     - Show recent logs"
        echo "  enable   - Enable auto-start on boot"
        echo "  disable  - Disable auto-start on boot"
        echo "  test     - Test the API endpoint"
        echo ""
        echo "Examples:"
        echo "  $0 start      # Start the service"
        echo "  $0 status     # Check if running"
        echo "  $0 restart    # Restart the service"
        echo "  $0 logs       # View recent logs"
        exit 1
        ;;
esac 