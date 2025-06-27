module.exports = {
    apps: [
        {
            name: 'flex-web-3000',
            script: './server.js',
            cwd: './backend',
            instances: 1,
            exec_mode: 'fork',
            autorestart: true,
            watch: false,
            max_memory_restart: '200M',
            env: {
                NODE_ENV: 'production',
                PORT: 3000,
                FLEX_WEB_ENV: 'production',
                PM2_SERVE_PATH: '../frontend',
                PM2_SERVE_PORT: 3000,
                PM2_SERVE_SPA: 'true',
                PM2_SERVE_HOMEPAGE: '/index.html'
            },
            error_file: './logs/error-3000.log',
            out_file: './logs/out-3000.log',
            log_file: './logs/combined-3000.log',
            time: true,
            max_restarts: 10,
            min_uptime: '10s',
            restart_delay: 1000,
            kill_timeout: 5000
        },
        {
            name: 'flex-web-3001',
            script: './server.js',
            cwd: './backend',
            instances: 1,
            exec_mode: 'fork',
            autorestart: true,
            watch: false,
            max_memory_restart: '200M',
            env: {
                NODE_ENV: 'production',
                PORT: 3001,
                FLEX_WEB_ENV: 'production',
                PM2_SERVE_PATH: '../frontend',
                PM2_SERVE_PORT: 3001,
                PM2_SERVE_SPA: 'true',
                PM2_SERVE_HOMEPAGE: '/index.html'
            },
            error_file: './logs/error-3001.log',
            out_file: './logs/out-3001.log',
            log_file: './logs/combined-3001.log',
            time: true,
            max_restarts: 10,
            min_uptime: '10s',
            restart_delay: 1000,
            kill_timeout: 5000
        },
        {
            name: 'flex-web-3002',
            script: './server.js',
            cwd: './backend',
            instances: 1,
            exec_mode: 'fork',
            autorestart: true,
            watch: false,
            max_memory_restart: '200M',
            env: {
                NODE_ENV: 'production',
                PORT: 3002,
                FLEX_WEB_ENV: 'production',
                PM2_SERVE_PATH: '../frontend',
                PM2_SERVE_PORT: 3002,
                PM2_SERVE_SPA: 'true',
                PM2_SERVE_HOMEPAGE: '/index.html'
            },
            error_file: './logs/error-3002.log',
            out_file: './logs/out-3002.log',
            log_file: './logs/combined-3002.log',
            time: true,
            max_restarts: 10,
            min_uptime: '10s',
            restart_delay: 1000,
            kill_timeout: 5000
        },
        {
            name: 'flex-web-3003',
            script: './server.js',
            cwd: './backend',
            instances: 1,
            exec_mode: 'fork',
            autorestart: true,
            watch: false,
            max_memory_restart: '200M',
            env: {
                NODE_ENV: 'production',
                PORT: 3003,
                FLEX_WEB_ENV: 'production',
                PM2_SERVE_PATH: '../frontend',
                PM2_SERVE_PORT: 3003,
                PM2_SERVE_SPA: 'true',
                PM2_SERVE_HOMEPAGE: '/index.html'
            },
            error_file: './logs/error-3003.log',
            out_file: './logs/out-3003.log',
            log_file: './logs/combined-3003.log',
            time: true,
            max_restarts: 10,
            min_uptime: '10s',
            restart_delay: 1000,
            kill_timeout: 5000
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