const path = require('path');

module.exports = {
  // Server configuration
  PORT: process.env.PORT || 3000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  
  // Paths
  TEMP_DIR: path.join(__dirname, '..', 'temp'),
  FRONTEND_DIR: path.join(__dirname, '..', '..', 'frontend'),
  FLEX_COMPILER_PATH: path.join(__dirname, '..', '..', '..', 'compiler'),
  DOCS_DIR: path.join(__dirname, '..', '..', 'docs'),
  EXAMPLES_DIR: path.join(__dirname, '..', '..', 'frontend', 'examples'),
  LOGS_DIR: path.join(__dirname, '..', 'logs'),
  
  // Execution settings
  EXECUTION_TIMEOUT: 30000, // 30 seconds
  MAX_CODE_LENGTH: 50000, // 50KB
  HEARTBEAT_INTERVAL: 30000, // 30 seconds
  
  // Python settings
  PYTHON_PATH: process.env.PYTHON_PATH || 'python3',
  
  // Webhook settings
  WEBHOOK_SECRET: process.env.WEBHOOK_SECRET || 'your-webhook-secret',
  REPO_PATH: process.env.REPO_PATH || '/var/wwww/Flex',
  
  // Security settings
  RATE_LIMIT_WINDOW: 15 * 60 * 1000, // 15 minutes
  RATE_LIMIT_MAX: 100, // max requests per window
  
  // Input/Output tokens
  INPUT_REQUEST_TOKEN: '__FLEX_INPUT_REQUEST__',
  INPUT_RECEIVED_TOKEN: '__FLEX_INPUT_RECEIVED__'
}; 