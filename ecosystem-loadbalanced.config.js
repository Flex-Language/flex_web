module.exports = {
    apps: [
        {
            name: 'flex-web-3000',
            script: './backend/server.js',
            instances: 1,
            exec_mode: 'fork',
            autorestart: true,
            watch: false,
            max_memory_restart: '800M',
            env: {
                NODE_ENV: 'production',
                PORT: 3000,
                UV_THREADPOOL_SIZE: 8,
                INSTANCE_NAME: 'flex-web-3000'
            },
            log_date_format: 'YYYY-MM-DD HH:mm:ss',
            error_file: './logs/error-3000.log',
            out_file: './logs/out-3000.log',
            merge_logs: true,
            max_restarts: 5,
            restart_delay: 2000,
            node_args: '--max-old-space-size=768 --optimize-for-size',
            kill_timeout: 5000,
            listen_timeout: 30000,
            pmx: false,
            min_uptime: '10s',
            max_unstable_restarts: 3,
            combine_logs: true,
            health_check_grace_period: 30000,
            exp_backoff_restart_delay: 100
        },
        {
            name: 'flex-web-3001',
            script: './backend/server.js',
            instances: 1,
            exec_mode: 'fork',
            autorestart: true,
            watch: false,
            max_memory_restart: '800M',
            env: {
                NODE_ENV: 'production',
                PORT: 3001,
                UV_THREADPOOL_SIZE: 8,
                INSTANCE_NAME: 'flex-web-3001'
            },
            log_date_format: 'YYYY-MM-DD HH:mm:ss',
            error_file: './logs/error-3001.log',
            out_file: './logs/out-3001.log',
            merge_logs: true,
            max_restarts: 5,
            restart_delay: 2000,
            node_args: '--max-old-space-size=768 --optimize-for-size',
            kill_timeout: 5000,
            listen_timeout: 30000,
            pmx: false,
            min_uptime: '10s',
            max_unstable_restarts: 3,
            combine_logs: true,
            health_check_grace_period: 30000,
            exp_backoff_restart_delay: 100
        },
        {
            name: 'flex-web-3002',
            script: './backend/server.js',
            instances: 1,
            exec_mode: 'fork',
            autorestart: true,
            watch: false,
            max_memory_restart: '800M',
            env: {
                NODE_ENV: 'production',
                PORT: 3002,
                UV_THREADPOOL_SIZE: 8,
                INSTANCE_NAME: 'flex-web-3002'
            },
            log_date_format: 'YYYY-MM-DD HH:mm:ss',
            error_file: './logs/error-3002.log',
            out_file: './logs/out-3002.log',
            merge_logs: true,
            max_restarts: 5,
            restart_delay: 2000,
            node_args: '--max-old-space-size=768 --optimize-for-size',
            kill_timeout: 5000,
            listen_timeout: 30000,
            pmx: false,
            min_uptime: '10s',
            max_unstable_restarts: 3,
            combine_logs: true,
            health_check_grace_period: 30000,
            exp_backoff_restart_delay: 100
        },
        {
            name: 'flex-web-3003',
            script: './backend/server.js',
            instances: 1,
            exec_mode: 'fork',
            autorestart: true,
            watch: false,
            max_memory_restart: '800M',
            env: {
                NODE_ENV: 'production',
                PORT: 3003,
                UV_THREADPOOL_SIZE: 8,
                INSTANCE_NAME: 'flex-web-3003'
            },
            log_date_format: 'YYYY-MM-DD HH:mm:ss',
            error_file: './logs/error-3003.log',
            out_file: './logs/out-3003.log',
            merge_logs: true,
            max_restarts: 5,
            restart_delay: 2000,
            node_args: '--max-old-space-size=768 --optimize-for-size',
            kill_timeout: 5000,
            listen_timeout: 30000,
            pmx: false,
            min_uptime: '10s',
            max_unstable_restarts: 3,
            combine_logs: true,
            health_check_grace_period: 30000,
            exp_backoff_restart_delay: 100
        }
    ],

    deploy: {
        production: {
            user: 'root',
            host: 'localhost',
            ref: 'origin/main',
            repo: 'local',
            path: '/var/wwww/Flex/flex_web',
            'post-deploy': 'bun install --production && pm2 reload ecosystem-loadbalanced.config.js',
            env: {
                NODE_ENV: 'production'
            }
        }
    }
}; 