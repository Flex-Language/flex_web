# Flex Web Compiler - Optimized for HP Z620 Workstation

This document describes the optimized configuration for running the Flex Web Compiler on an HP Z620 Workstation with 4GB RAM and Intel Xeon E5-2680 v2 processors.

## System Specifications

- **Machine**: HP Z620 Workstation
- **CPU**: Intel Xeon E5-2680 v2 @ 2.80GHz (4 active cores out of 40 total)
- **RAM**: 4GB Total
- **OS**: Ubuntu 22.04.5 LTS (Kernel 6.8.12-9-pve)
- **Node.js**: v22.16.0
- **Package Manager**: Bun v1.2.15 (with npm fallback)

## Optimized Configuration

### PM2 Ecosystem Settings

```javascript
{
  instances: 2,                    // Optimized for 4 active CPU cores
  max_memory_restart: '800M',      // Conservative for 4GB total system
  node_args: '--max-old-space-size=768 --optimize-for-size',
  max_restarts: 5,                 // Reduced to prevent thrashing
  restart_delay: 2000,             // Increased restart delay
  exec_mode: 'cluster',            // Load balancing across instances
  pmx: false,                      // Disabled to save memory
}
```

### Memory Allocation

- **Per Instance**: 800MB limit (768MB heap)
- **Total Application**: ~1.6GB
- **System Reserve**: ~2.4GB for OS and other processes
- **Optimal Usage**: 60-70% of total system memory

### Performance Features

- **Cluster Mode**: Load balancing across 2 instances
- **Memory Optimization**: Small heap size with garbage collection tuning
- **Process Management**: Automatic restart with exponential backoff
- **Health Monitoring**: Built-in health checks and status monitoring
- **Log Management**: Separate error and output logs with size monitoring

## Installation and Setup

### 1. Package Manager Setup

```bash
# Bun is preferred but npm is used as fallback
curl -fsSL https://bun.sh/install | bash
export PATH="$HOME/.bun/bin:$PATH"

# Install PM2 globally
bun add -g pm2
# OR if Bun has issues:
npm install -g pm2
```

### 2. Install Dependencies

```bash
cd /var/wwww/Flex/flex_web/backend
npm install --production  # Using npm due to Bun postinstall issues
```

### 3. Deploy with Optimized Configuration

```bash
cd /var/wwww/Flex/flex_web
chmod +x deploy.sh
./deploy.sh
```

### 4. Verify Setup

```bash
chmod +x monitor.sh
./monitor.sh
```

## Management Commands

### Start Application
```bash
pm2 start ecosystem.config.js --env production
```

### Monitor Performance
```bash
# Real-time monitoring
pm2 monit

# Custom monitoring script
./monitor.sh

# View logs
pm2 logs flex-web-compiler
```

### Restart/Reload
```bash
# Graceful reload (zero-downtime)
pm2 reload flex-web-compiler

# Hard restart
pm2 restart flex-web-compiler
```

### System Integration
```bash
# Save current processes
pm2 save

# Setup auto-start on boot
pm2 startup
```

## Performance Monitoring

### Key Metrics to Watch

1. **Memory Usage**: Should stay below 80% of total system memory
2. **Instance Memory**: Each instance should stay under 800MB
3. **CPU Load**: Should be distributed across both instances
4. **Restart Count**: Low restart frequency indicates stability
5. **Response Time**: Application should respond quickly on port 3000

### Monitoring Script Output

The `monitor.sh` script provides:
- System resource usage (CPU, Memory, Disk)
- Application status and health checks
- PM2 process information
- Log file sizes and locations
- Performance recommendations
- Quick action commands

### Warning Thresholds

- **Memory Usage > 80%**: Consider restarting application
- **Log Files > 50MB (error) / 100MB (output)**: Consider log rotation
- **High CPU Load > 3.0**: Monitor for performance issues
- **Frequent Restarts**: Check logs for errors

## Troubleshooting

### Common Issues

1. **Out of Memory Errors**
   ```bash
   # Check memory usage
   free -h
   # Restart application
   pm2 restart flex-web-compiler
   ```

2. **Application Not Responding**
   ```bash
   # Check status
   pm2 list
   # View logs
   pm2 logs flex-web-compiler --lines 50
   # Health check
   curl http://localhost:3000/api/status
   ```

3. **High Memory Usage**
   ```bash
   # Reload application (graceful restart)
   pm2 reload flex-web-compiler
   # Monitor with detailed stats
   pm2 show flex-web-compiler
   ```

4. **Startup Issues**
   ```bash
   # Check PM2 startup configuration
   pm2 startup
   # Manually save processes
   pm2 save
   ```

### Log Locations

- **Error Log**: `/var/wwww/Flex/flex_web/logs/error.log`
- **Output Log**: `/var/wwww/Flex/flex_web/logs/out.log`
- **PM2 Logs**: Use `pm2 logs flex-web-compiler`

### Environment Variables

```bash
# Production optimizations
NODE_ENV=production
NODE_OPTIONS=--max-old-space-size=768
UV_THREADPOOL_SIZE=8
PORT=3000
```

## Security Considerations

- Rate limiting is disabled by default (can be enabled if needed)
- Helmet middleware provides basic security headers
- XSS protection enabled
- Input validation for code execution
- Temporary file cleanup after execution

## Performance Optimizations Applied

1. **Memory Management**
   - Reduced heap size to 768MB per instance
   - Enabled `--optimize-for-size` flag
   - Limited to 2 instances for 4GB system

2. **Process Management**
   - Cluster mode for load distribution
   - Reduced restart attempts to prevent thrashing
   - Increased restart delay for stability

3. **I/O Optimization**
   - UV_THREADPOOL_SIZE=8 for better I/O handling
   - Disabled PMX monitoring to save memory
   - Combined logs for easier management

4. **System Integration**
   - Auto-startup on system boot
   - Health checks and monitoring
   - Graceful shutdown handling

## Maintenance Schedule

### Daily
- Run `./monitor.sh` to check system health
- Review log files for errors

### Weekly
- Check log file sizes and rotate if needed
- Monitor memory usage trends
- Verify auto-startup functionality

### Monthly
- Update dependencies if needed
- Review PM2 restart statistics
- Check for system updates

## Resource Usage Summary

| Component | Memory Usage | CPU Usage |
|-----------|--------------|-----------|
| Instance 0 | ~64MB | 0-10% |
| Instance 1 | ~64MB | 0-10% |
| System OS | ~800MB | 5-15% |
| Available | ~3GB | 75-85% |

This configuration provides optimal performance for the HP Z620 Workstation while maintaining system stability and leaving adequate resources for other processes. 