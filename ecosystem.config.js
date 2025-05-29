module.exports = {
  apps: [{
    name: 'flex-web-compiler',
    script: './backend/server.js',
    instances: 2,
    exec_mode: 'cluster',
    autorestart: true,
    watch: false,
    max_memory_restart: '800M',
    env: {
      NODE_ENV: 'development',
      PORT: 3000,
      UV_THREADPOOL_SIZE: 8
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000,
      UV_THREADPOOL_SIZE: 8
    },
    log_date_format: 'YYYY-MM-DD HH:mm:ss',
    error_file: './logs/error.log',
    out_file: './logs/out.log',
    merge_logs: true,
    max_restarts: 5,
    restart_delay: 2000,
    node_args: '--max-old-space-size=768 --optimize-for-size',
    kill_timeout: 5000,
    wait_ready: true,
    listen_timeout: 30000,
    pmx: false,
    min_uptime: '10s',
    max_unstable_restarts: 3,
    instance_var: 'INSTANCE_ID',
    combine_logs: true,
    health_check_grace_period: 30000,
    exp_backoff_restart_delay: 100,
    ignore_watch: [
      'node_modules',
      'logs',
      'temp',
      '.git'
    ]
  }],
  
  deploy: {
    production: {
      user: 'root',
      host: 'localhost',
      ref: 'origin/main',
      repo: 'local',
      path: '/var/wwww/Flex/flex_web',
      'post-deploy': 'bun install --production && pm2 reload ecosystem.config.js --env production',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      }
    }
  }
}; 