# Flex Web Compiler Backend

A modular Node.js backend for the Flex Web Compiler with real-time code execution, WebSocket support, and modern architecture.

## Architecture

The backend has been redesigned with a clean modular structure following Node.js best practices:

```
backend/
├── config/          # Configuration (constants, logger)
├── controllers/     # API route handlers
├── services/        # Business logic (execution, WebSocket)
├── routes/          # Route definitions
├── middleware/      # Security and CORS middleware
├── utils/          # Shared utilities
└── server.js       # Main entry point (114 lines vs 1090 lines)
```

For detailed architecture information, see [ARCHITECTURE.md](./ARCHITECTURE.md).

## Installation

Install dependencies using Bun (recommended) or npm:

```bash
# Using Bun (recommended)
bun install

# Using npm
npm install
```

## Running the Server

### Development Mode
```bash
# Using Bun
bun run dev

# Using Node.js
npm run dev
```

### Production Mode
```bash
# Using Bun
bun run prod

# Using Node.js
npm run prod
```

### Direct Execution
```bash
# Using Bun
bun run server.js

# Using Node.js
node server.js
```

## Features

### 🚀 Core Functionality
- **Real-time code execution** - Execute Flex code with live output
- **Interactive input handling** - Support for programs requiring user input
- **WebSocket communication** - Real-time updates and communication
- **Process management** - Proper cleanup and timeout handling

### 🔧 Architecture Benefits
- **Modular design** - Clean separation of concerns
- **Singleton services** - Consistent state management
- **Centralized configuration** - Easy configuration management
- **Comprehensive logging** - Winston-based logging system

### 🛡️ Security Features
- **Input validation** - Code length and pattern validation
- **Process isolation** - Sandboxed execution environment
- **Security headers** - Helmet.js protection
- **XSS protection** - Clean user input sanitization

### ⚡ Performance Optimizations
- **Efficient memory usage** - Automatic cleanup of temporary files
- **Connection pooling** - Optimized WebSocket management
- **Non-blocking I/O** - Concurrent execution support
- **Resource monitoring** - Process and memory monitoring

## API Endpoints

### Execution
- `POST /api/execute` - Execute Flex code
- `POST /api/input` - Send input to running execution
- `GET /api/execution-status/:id` - Get execution status
- `GET /api/input-status` - Monitor input status

### Content
- `GET /api/status` - Server health check
- `GET /api/examples` - Get code examples
- `GET /api/docs` - Get documentation

### WebSocket
- Real-time execution output
- Interactive input requests
- Connection management
- Status updates

## Configuration

### Environment Variables
```bash
PORT=3000                    # Server port
NODE_ENV=development         # Environment mode
PYTHON_PATH=python3          # Python executable path
WEBHOOK_SECRET=your-secret   # GitHub webhook secret
REPO_PATH=/path/to/repo     # Repository path
```

### Key Settings (config/constants.js)
- Execution timeout: 30 seconds
- Max code length: 50KB
- Heartbeat interval: 30 seconds
- Temp file cleanup: 1 hour

## Development

### Project Structure
- **Controllers** handle HTTP requests and responses
- **Services** implement business logic and state management
- **Routes** define API endpoints and middleware
- **Utilities** provide shared helper functions
- **Configuration** centralizes settings and logging

### Adding New Features
1. Define routes in `routes/api.js`
2. Create controller methods in appropriate controller
3. Implement business logic in services
4. Add configuration to `config/constants.js`
5. Update documentation

### Code Quality
- ESLint configuration in `jsconfig.json`
- Consistent error handling patterns
- Comprehensive logging and monitoring
- Resource cleanup and memory management

## Migration from Legacy

The backend has been successfully migrated from a monolithic structure (1090 lines) to a clean modular architecture (114 lines main server + organized modules):

- ✅ All functionality preserved
- ✅ No breaking changes for frontend
- ✅ Improved maintainability and testability
- ✅ Better separation of concerns
- ✅ Enhanced error handling and logging

## Runtime Requirements

- **Node.js**: v18+ (as specified in ecosystem.config.js)
- **Python**: 3.x for Flex compiler execution
- **Bun**: v1.2.15+ (recommended runtime)

## License

This project was created using `bun init` in bun v1.2.15. [Bun](https://bun.sh) is a fast all-in-one JavaScript runtime.
