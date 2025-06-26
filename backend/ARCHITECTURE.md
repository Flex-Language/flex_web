# Backend Architecture

## Overview

The Flex Web Compiler backend has been reorganized into a modular Node.js architecture following best practices for maintainability, testability, and separation of concerns.

## Directory Structure

```
backend/
├── config/                     # Configuration files
│   ├── constants.js            # Application constants and settings
│   └── logger.js               # Winston logger configuration
├── controllers/                # API route handlers
│   ├── executionController.js  # Code execution endpoints
│   └── contentController.js    # Examples and documentation endpoints
├── services/                   # Business logic layer
│   ├── flexExecutor.js         # Flex code execution service
│   ├── executionManager.js     # Active execution management
│   └── websocketManager.js     # WebSocket connection management
├── routes/                     # Route definitions
│   ├── api.js                  # Main API routes
│   └── webhook.js              # GitHub webhook routes
├── middleware/                 # Custom middleware
│   ├── security.js             # Security middleware (helmet, XSS, rate limiting)
│   └── cors.js                 # CORS configuration
├── utils/                      # Utility functions
│   └── helpers.js              # Shared helper functions
├── server.js                   # Main server entry point (114 lines)
└── server_old.js               # Original monolithic server (1090 lines)
```

## Architecture Layers

### 1. Configuration Layer (`config/`)
- **constants.js**: Centralized application configuration including paths, timeouts, and settings
- **logger.js**: Winston logger setup with file and console transports

### 2. Middleware Layer (`middleware/`)
- **security.js**: Helmet, XSS protection, and rate limiting middleware
- **cors.js**: CORS configuration for cross-origin requests

### 3. Route Layer (`routes/`)
- **api.js**: Main API routes for execution, content, and status
- **webhook.js**: GitHub webhook handling for automated deployment

### 4. Controller Layer (`controllers/`)
- **executionController.js**: Handles code execution, input/output, and execution status
- **contentController.js**: Manages examples, documentation, and health checks

### 5. Service Layer (`services/`)
- **flexExecutor.js**: Core Flex code execution using Python subprocess
- **executionManager.js**: Manages active executions lifecycle and state
- **websocketManager.js**: Handles WebSocket connections and real-time communication

### 6. Utility Layer (`utils/`)
- **helpers.js**: Shared utility functions for file cleanup, validation, and directory management

## Key Features

### Separation of Concerns
- **Routes**: Handle HTTP routing and parameter extraction
- **Controllers**: Process requests, validate input, and coordinate responses
- **Services**: Implement business logic and manage application state
- **Utilities**: Provide reusable helper functions

### Singleton Services
- All services are implemented as singletons to maintain consistent state across the application
- Shared execution manager and WebSocket manager ensure proper coordination

### Error Handling
- Centralized logging using Winston
- Consistent error responses across all endpoints
- Proper cleanup of resources and processes

### Real-time Communication
- WebSocket manager handles client connections with heartbeat monitoring
- Real-time code execution output and input request handling
- Fallback HTTP polling for unstable connections

## API Endpoints

### Execution Endpoints
- `POST /api/execute` - Execute Flex code
- `POST /api/input` - Send input to running execution
- `GET /api/execution-status/:id` - Get execution status
- `GET /api/input-status` - Get input status for all executions
- `GET /api/test-input` - Diagnostic endpoint for WebSocket testing

### Content Endpoints
- `GET /api/status` - Server health check
- `GET /api/examples` - Get available code examples
- `GET /api/docs` - Get documentation file list
- `GET /api/docs/:doc` - Get specific documentation file

### Webhook Endpoints
- `POST /webhook/github` - GitHub webhook for automated deployment

## WebSocket Events

### Client to Server
- `register_execution` - Register client for execution updates
- `input` - Send input to running execution
- `stop_execution` - Stop a running execution
- `check_execution_status` - Check execution status
- `ping` - Heartbeat ping

### Server to Client
- `connected` - Connection established with client ID
- `execution_start` - Execution has started
- `execution_complete` - Execution has finished
- `input_request` - Execution is waiting for input
- `input_processed` - Input has been processed
- `output` - Real-time execution output
- `error` - Error message
- `pong` - Heartbeat response

## Configuration

### Environment Variables
- `PORT` - Server port (default: 3000)
- `NODE_ENV` - Environment (development/production)
- `PYTHON_PATH` - Path to Python executable
- `WEBHOOK_SECRET` - GitHub webhook secret
- `REPO_PATH` - Repository path for deployments

### Constants
All configuration is centralized in `config/constants.js`:
- Execution timeout: 30 seconds
- Maximum code length: 50KB
- Heartbeat interval: 30 seconds
- File paths for compiler, frontend, and logs

## Security Features

### Input Validation
- Code length limits
- Dangerous pattern detection
- File name sanitization
- Parameter validation

### Process Isolation
- Sandboxed Python subprocess execution
- Temporary file isolation
- Process timeout and cleanup
- Resource monitoring

### Network Security
- Helmet.js security headers
- XSS protection
- CORS configuration
- Rate limiting (configurable)

## Performance Optimizations

### Memory Management
- Automatic cleanup of old temporary files
- Process termination with proper cleanup
- Memory limits for executions
- Efficient WebSocket connection management

### Concurrency
- Multiple simultaneous executions supported
- Non-blocking I/O operations
- Efficient process spawning
- WebSocket connection pooling

## Testing and Monitoring

### Health Checks
- Server status endpoint
- WebSocket diagnostic endpoint
- Execution status monitoring
- Resource usage tracking

### Logging
- Structured logging with Winston
- Separate error and combined logs
- Configurable log levels
- Request and execution tracking

## Migration Notes

### From Monolithic to Modular
- Original `server.js` (1090 lines) → New modular structure
- All functionality preserved and tested
- Improved maintainability and testability
- Better separation of concerns
- Easier to add new features and fix bugs

### Backward Compatibility
- All existing API endpoints maintained
- WebSocket protocol unchanged
- Configuration options preserved
- No breaking changes for frontend

## Development Guidelines

### Adding New Features
1. **Routes**: Add new routes in appropriate router file
2. **Controllers**: Create controller methods for request handling
3. **Services**: Implement business logic in service layer
4. **Configuration**: Add new constants to constants.js
5. **Testing**: Add corresponding tests for new functionality

### Code Organization
- Keep controllers thin (request/response handling only)
- Put business logic in services
- Use utilities for shared functionality
- Maintain singleton pattern for stateful services
- Follow consistent error handling patterns

### Best Practices
- Use async/await for asynchronous operations
- Implement proper error handling and logging
- Clean up resources (files, processes, connections)
- Validate all inputs and parameters
- Document new functionality and APIs 