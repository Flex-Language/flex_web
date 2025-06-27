const express = require('express');
const bodyParser = require('body-parser');
const http = require('http');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables from project root
dotenv.config({ path: path.join(__dirname, '..', '.env') });

// Import configuration
const constants = require('./config/constants');
const logger = require('./config/logger');

// Import middleware
const corsMiddleware = require('./middleware/cors');
const { securityMiddleware, xssMiddleware } = require('./middleware/security');

// Import services
const websocketManager = require('./services/websocketManager');

// Import routes
const apiRoutes = require('./routes/api');
const webhookRoutes = require('./routes/webhook');

// Import utilities
const { ensureDirectoriesExist } = require('./utils/helpers');

/**
 * Initialize Express application
 */
function createApp() {
  const app = express();

  // Disable trust proxy since we're running as a direct server
  app.set('trust proxy', false);

  // Apply security middleware
  app.use(securityMiddleware);
  app.use(xssMiddleware);

  // Apply CORS middleware
  app.use(corsMiddleware);

  // Body parser middleware
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: true }));

  // Serve static files from the frontend directory
  app.use(express.static(constants.FRONTEND_DIR));

  // API routes
  app.use('/api', apiRoutes);

  // Webhook routes
  app.use('/webhook', webhookRoutes);

  return app;
}

/**
 * Start the server
 */
function startServer() {
  try {
    // Ensure required directories exist
    ensureDirectoriesExist();

    // Create Express app
    const app = createApp();

    // Create HTTP server
    const server = http.createServer(app);

    // Initialize WebSocket server
    websocketManager.initialize(server);

    // Start the server
    server.listen(constants.PORT, '0.0.0.0', () => {
      logger.info(`Flex Web Compiler server started successfully`);
      logger.info(`Server running on http://0.0.0.0:${constants.PORT}`);
      logger.info(`Environment: ${constants.NODE_ENV}`);
      logger.info(`Frontend directory: ${constants.FRONTEND_DIR}`);
      logger.info(`Flex compiler path: ${constants.FLEX_COMPILER_PATH}`);
    });

    // Handle graceful shutdown
    process.on('SIGTERM', () => {
      logger.info('SIGTERM received, shutting down gracefully');
      server.close(() => {
        logger.info('Server closed');
        process.exit(0);
      });
    });

    process.on('SIGINT', () => {
      logger.info('SIGINT received, shutting down gracefully');
      server.close(() => {
        logger.info('Server closed');
        process.exit(0);
      });
    });

    return server;
  } catch (error) {
    logger.error(`Failed to start server: ${error.message}`);
    process.exit(1);
  }
}

// Start the server if this file is run directly
if (require.main === module) {
  startServer();
}

module.exports = { createApp, startServer }; 