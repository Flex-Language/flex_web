const helmet = require('helmet');
const xss = require('xss-clean');
const rateLimit = require('express-rate-limit');
const constants = require('../config/constants');

// Security middleware configuration
const securityMiddleware = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "https://cdnjs.cloudflare.com", "https://cdn.jsdelivr.net", "'unsafe-inline'"],
      styleSrc: ["'self'", "https:", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "localhost:*", "127.0.0.1:*", "192.168.1.62:*", "*.mikawi.org", "ws:", "wss:", "*"],
      fontSrc: ["'self'", "https:", "data:"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
    reportOnly: false
  }
});

// XSS protection middleware
const xssMiddleware = xss();

// Rate limiting middleware (disabled for now due to configuration issues)
const rateLimitMiddleware = rateLimit({
  windowMs: constants.RATE_LIMIT_WINDOW,
  max: constants.RATE_LIMIT_MAX,
  message: 'Too many requests from this IP, please try again later',
  legacyHeaders: false,
  standardHeaders: 'draft-7',
  trustProxy: false,
  skip: () => true // Disabled for now
});

module.exports = {
  securityMiddleware,
  xssMiddleware,
  rateLimitMiddleware
}; 