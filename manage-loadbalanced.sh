#!/bin/bash

# Flex Web Compiler - Load Balanced Management Script
# Manages 4 instances on ports 3000-3003 with nginx load balancer

APP_NAMES=("flex-web-3000" "flex-web-3001" "flex-web-3002" "flex-web-3003")
PORTS=(3000 3001 3002 3003)
PROJECT_DIR="/var/wwww/Flex/flex_web"
ECOSYSTEM_CONFIG="ecosystem-loadbalanced.config.js"

# Ensure we're in the right directory
cd "$PROJECT_DIR" || { echo "Error: Cannot access project directory"; exit 1; }

# Ensure PM2 is in PATH
export PATH="/root/.bun/bin:$PATH"

print_header() {
    echo "=============================================="
    echo "Flex Web Compiler - Load Balanced Management"
    echo "4 Instances + Nginx Load Balancer on Port 80"
    echo "=============================================="
}

print_usage() {
    echo "Usage: $0 [COMMAND]"
    echo ""
    echo "Commands:"
    echo "  start       - Start all 4 instances and nginx"
    echo "  stop        - Stop all instances and nginx"
    echo "  restart     - Restart all instances and nginx"
    echo "  reload      - Graceful reload all instances"
    echo "  status      - Show all instances and nginx status"
    echo "  health      - Quick health check"
    echo "  logs        - Show logs from all instances"
    echo "  logs-nginx  - Show nginx logs"
    echo "  test        - Test load balancer functionality"
    echo "  test-domain - Test flex.mikawi.org domain functionality"
    echo "  save        - Save PM2 configuration"
    echo "  cleanup     - Clean logs and temporary files"
    echo ""
    echo "Individual instance commands:"
    echo "  status-3000 - Show status of instance on port 3000"
    echo "  logs-3000   - Show logs of instance on port 3000"
    echo "  restart-3000 - Restart only port 3000 instance"
    echo "  (Similar for 3001, 3002, 3003)"
}

start_all() {
    echo "Starting Flex Web Compiler Load Balanced Setup..."
    echo "Starting 4 backend instances..."
    pm2 start $ECOSYSTEM_CONFIG
    
    echo "Starting nginx load balancer..."
    systemctl start nginx
    
    echo "All services started. Website available on port 80."
    echo "Use '$0 status' to check all services."
}

stop_all() {
    echo "Stopping all services..."
    pm2 stop "${APP_NAMES[@]}"
    systemctl stop nginx
    echo "All services stopped."
}

restart_all() {
    echo "Restarting all services..."
    pm2 restart "${APP_NAMES[@]}"
    systemctl restart nginx
    echo "All services restarted."
}

reload_all() {
    echo "Gracefully reloading all instances..."
    for app in "${APP_NAMES[@]}"; do
        echo "Reloading $app..."
        pm2 reload "$app"
    done
    echo "All instances reloaded with zero downtime."
}

show_status() {
    echo "PM2 Instances Status:"
    pm2 list
    echo ""
    echo "Nginx Status:"
    systemctl status nginx --no-pager -l
    echo ""
    echo "Load Balancer Test:"
    curl -s http://localhost:80/lb-status
}

health_check() {
    print_header
    echo ""
    
    # Check PM2 instances
    all_running=true
    for app in "${APP_NAMES[@]}"; do
        if pm2 list | grep -q "$app.*online"; then
            echo "✅ $app: Running"
        else
            echo "❌ $app: Not running"
            all_running=false
        fi
    done
    
    # Check nginx
    if systemctl is-active nginx > /dev/null 2>&1; then
        echo "✅ Nginx: Running"
    else
        echo "❌ Nginx: Not running"
        all_running=false
    fi
    
    # Test load balancer
    if curl -s http://localhost:80/health > /dev/null 2>&1; then
        echo "✅ Load Balancer: Responding on port 80"
    else
        echo "❌ Load Balancer: Not responding"
        all_running=false
    fi
    
    # Test individual instances
    echo ""
    echo "Individual Instance Health:"
    for i in "${!PORTS[@]}"; do
        port=${PORTS[$i]}
        if curl -s http://localhost:$port/api/status > /dev/null 2>&1; then
            echo "✅ Instance $port: Healthy"
        else
            echo "❌ Instance $port: Unhealthy"
            all_running=false
        fi
    done
    
    # Memory check
    mem_used=$(free | grep Mem | awk '{print int($3/$2 * 100)}')
    if [ $mem_used -lt 80 ]; then
        echo "✅ Memory Usage: Healthy ($mem_used%)"
    else
        echo "⚠️  Memory Usage: High ($mem_used%)"
    fi
    
    echo ""
    if [ "$all_running" = true ]; then
        echo "🚀 All systems operational!"
    else
        echo "⚠️  Some services need attention!"
    fi
}

show_logs() {
    echo "Recent logs from all instances (last 10 lines each):"
    for app in "${APP_NAMES[@]}"; do
        echo ""
        echo "=== $app ==="
        pm2 logs "$app" --lines 10 --nostream
    done
}

show_nginx_logs() {
    echo "Nginx Access Logs (last 20 lines):"
    tail -20 /var/log/nginx/flex-lb-access.log 2>/dev/null || echo "No access logs found"
    echo ""
    echo "Nginx Error Logs (last 10 lines):"
    tail -10 /var/log/nginx/flex-lb-error.log 2>/dev/null || echo "No error logs found"
}

test_load_balancer() {
    echo "Testing Load Balancer Functionality..."
    echo ""
    echo "Load Balancer Status:"
    curl -s http://localhost:80/lb-status
    echo ""
    echo ""
    echo "Testing 8 requests to see distribution:"
    for i in {1..8}; do
        timestamp=$(curl -s http://localhost:80/api/status | jq -r .timestamp)
        echo "Request $i: $timestamp"
        sleep 0.1
    done
    echo ""
    echo "Load balancer test completed."
}

save_config() {
    echo "Saving PM2 configuration..."
    pm2 save
    echo "Configuration saved. All instances will auto-start on boot."
}

cleanup_files() {
    echo "Cleaning up logs and temporary files..."
    
    # Clean PM2 logs
    pm2 flush
    
    # Clean application logs
    for port in "${PORTS[@]}"; do
        if [ -f "./logs/error-$port.log" ] && [ $(stat -c%s "./logs/error-$port.log") -gt 52428800 ]; then
            echo "Rotating large error log for port $port..."
            mv "./logs/error-$port.log" "./logs/error-$port.log.old"
            touch "./logs/error-$port.log"
        fi
        
        if [ -f "./logs/out-$port.log" ] && [ $(stat -c%s "./logs/out-$port.log") -gt 104857600 ]; then
            echo "Rotating large output log for port $port..."
            mv "./logs/out-$port.log" "./logs/out-$port.log.old"
            touch "./logs/out-$port.log"
        fi
    done
    
    # Clean backend temp files
    if [ -d "./backend/temp" ]; then
        find ./backend/temp -name "code_*.lx" -mtime +1 -delete 2>/dev/null || true
        echo "Cleaned temporary code files."
    fi
    
    echo "Cleanup completed."
}

# Handle individual instance commands
handle_individual() {
    local command=$1
    local port=$2
    local app_name="flex-web-$port"
    
    if [[ ! " ${PORTS[*]} " =~ " $port " ]]; then
        echo "Error: Invalid port $port. Valid ports: ${PORTS[*]}"
        exit 1
    fi
    
    case "$command" in
        "status")
            echo "Status for $app_name:"
            pm2 show "$app_name"
            ;;
        "logs")
            echo "Logs for $app_name:"
            pm2 logs "$app_name" --lines 20
            ;;
        "restart")
            echo "Restarting $app_name..."
            pm2 restart "$app_name"
            echo "$app_name restarted."
            ;;
        *)
            echo "Error: Invalid individual command"
            exit 1
            ;;
    esac
}

# Main script logic
case "${1:-}" in
    "start")
        start_all
        ;;
    "stop")
        stop_all
        ;;
    "restart")
        restart_all
        ;;
    "reload")
        reload_all
        ;;
    "status")
        show_status
        ;;
    "health")
        health_check
        ;;
    "logs")
        show_logs
        ;;
    "logs-nginx")
        show_nginx_logs
        ;;
    "test")
        test_load_balancer
        ;;
    "test-domain")
        echo "Running comprehensive domain test..."
        ./test-domain.sh
        ;;
    "save")
        save_config
        ;;
    "cleanup")
        cleanup_files
        ;;
    "status-"*|"logs-"*|"restart-"*)
        if [[ $1 =~ ^(status|logs|restart)-([0-9]+)$ ]]; then
            handle_individual "${BASH_REMATCH[1]}" "${BASH_REMATCH[2]}"
        else
            echo "Error: Invalid command format"
            print_usage
            exit 1
        fi
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