#!/bin/bash

# Flex Web Compiler System Monitor
# Optimized for HP Z620 Workstation with 4GB RAM

echo "======================================================"
echo "Flex Web Compiler System Monitor"
echo "Optimized for HP Z620 Workstation (4GB RAM, 4 CPUs)"
echo "======================================================"
echo ""

# Function to display colored output
print_status() {
    local color=$1
    local message=$2
    case $color in
        "green") echo -e "\033[32m$message\033[0m" ;;
        "red") echo -e "\033[31m$message\033[0m" ;;
        "yellow") echo -e "\033[33m$message\033[0m" ;;
        "blue") echo -e "\033[34m$message\033[0m" ;;
        *) echo "$message" ;;
    esac
}

# Check if PM2 is installed and accessible
if ! command -v pm2 &> /dev/null; then
    print_status "red" "❌ PM2 is not installed or not in PATH"
    echo "   To install: bun add -g pm2"
    echo "   Add to PATH: export PATH=\"/root/.bun/bin:\$PATH\""
    exit 1
fi

print_status "green" "✅ PM2 is available"
echo ""

# System Information
print_status "blue" "📊 SYSTEM RESOURCES"
echo "======================================================"

# Memory Information
echo "🧠 Memory Usage:"
free -h | grep -E "(Mem|Swap)"
echo ""

# CPU Information
echo "🔥 CPU Usage:"
echo "Active CPUs: $(nproc) out of $(lscpu | grep "CPU(s):" | head -1 | awk '{print $2}') total"
echo "Load Average: $(uptime | awk -F'load average:' '{ print $2 }')"
echo ""

# Disk Usage
echo "💽 Disk Usage:"
df -h / | tail -1 | awk '{print "Root: " $3 " used of " $2 " (" $5 " used)"}'
df -h /var/wwww/Flex | tail -1 | awk '{print "Project: " $3 " used of " $2 " (" $5 " used)"}'
echo ""

# Application Status
print_status "blue" "🚀 APPLICATION STATUS"
echo "======================================================"

# Check if application is running
if pm2 list | grep -q "flex-web-compiler"; then
    print_status "green" "✅ Flex Web Compiler is running"
    echo ""
    
    # PM2 Status
    echo "📋 PM2 Process List:"
    pm2 list
    echo ""
    
    # Memory usage by PM2 processes
    echo "🧠 Memory Usage by Instance:"
    pm2 list | grep "flex-web-compiler" | awk '{print "Instance " $1 ": " $7}'
    echo ""
    
    # Log file status
    echo "📝 Log Files:"
    if [ -f "./logs/error.log" ]; then
        error_size=$(du -h ./logs/error.log | cut -f1)
        print_status "yellow" "   Error log: $error_size"
    else
        print_status "green" "   Error log: No errors"
    fi
    
    if [ -f "./logs/out.log" ]; then
        out_size=$(du -h ./logs/out.log | cut -f1)
        echo "   Output log: $out_size"
    else
        echo "   Output log: Empty"
    fi
    echo ""
    
    # Check application health
    echo "🏥 Application Health Check:"
    if curl -s http://localhost:3000/api/status > /dev/null 2>&1; then
        print_status "green" "   ✅ Application responding on port 3000"
    else
        print_status "red" "   ❌ Application not responding on port 3000"
    fi
    
    # WebSocket test
    if netstat -ln | grep -q ":3000"; then
        print_status "green" "   ✅ WebSocket server listening"
    else
        print_status "yellow" "   ⚠️  WebSocket status unknown"
    fi
    echo ""
    
else
    print_status "red" "❌ Flex Web Compiler is not running"
    echo ""
    echo "To start the application:"
    echo "   pm2 start ecosystem.config.js --env production"
    echo ""
fi

# Configuration Summary
print_status "blue" "⚙️  CONFIGURATION SUMMARY"
echo "======================================================"
echo "Instances: 2 (optimized for 4-core system)"
echo "Memory limit per instance: 800MB (total ~1.6GB for app)"
echo "Node heap size: 768MB per instance"
echo "PM2 mode: cluster"
echo "Environment: production"
echo "Auto restart: enabled"
echo "Startup script: enabled"
echo ""

# Quick Actions
print_status "blue" "🛠️  QUICK ACTIONS"
echo "======================================================"
echo "View logs:     pm2 logs flex-web-compiler"
echo "Monitor:       pm2 monit"
echo "Restart:       pm2 restart flex-web-compiler"
echo "Stop:          pm2 stop flex-web-compiler"
echo "Reload:        pm2 reload flex-web-compiler"
echo "Status:        pm2 show flex-web-compiler"
echo ""

# Performance recommendations
print_status "blue" "💡 PERFORMANCE RECOMMENDATIONS"
echo "======================================================"

# Check memory usage
mem_used=$(free | grep Mem | awk '{print int($3/$2 * 100)}')
if [ $mem_used -gt 80 ]; then
    print_status "red" "⚠️  High memory usage ($mem_used%). Consider restarting the application."
elif [ $mem_used -gt 60 ]; then
    print_status "yellow" "⚠️  Moderate memory usage ($mem_used%). Monitor closely."
else
    print_status "green" "✅ Memory usage is healthy ($mem_used%)."
fi

# Check log file sizes
if [ -f "./logs/error.log" ] && [ $(stat -c%s "./logs/error.log") -gt 52428800 ]; then
    print_status "yellow" "⚠️  Error log is large (>50MB). Consider rotation."
fi

if [ -f "./logs/out.log" ] && [ $(stat -c%s "./logs/out.log") -gt 104857600 ]; then
    print_status "yellow" "⚠️  Output log is large (>100MB). Consider rotation."
fi

echo ""
print_status "green" "Monitor completed at $(date)"
echo "======================================================" 