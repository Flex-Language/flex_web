# Flex Online Compiler

A comprehensive web-based IDE and compiler for the Flex programming language. Flex is a modern, custom-designed programming language with unique syntax featuring keywords like `rakm`, `sndo2`, `rg3`, `geeb`, and `dorg`. The language combines simplicity with powerful features including AI-assisted error handling, real-time execution, and modular programming capabilities.

## Features

- **Code Editor**: Feature-rich editor with syntax highlighting for Flex language keywords
- **Code Execution**: Real-time Flex code execution with interactive input/output
- **Examples Gallery**: Collection of example Flex programs demonstrating language features
- **Enhanced Documentation**: Comprehensive language reference, quick reference guide, and step-by-step tutorials
- **AI-Assisted Debugging**: Optional AI-powered error analysis and suggestions
- **Code Sharing**: Share your code with others via URL
- **Local Storage**: Automatically saves your code in the browser
- **Keyboard Shortcuts**: Convenient keyboard shortcuts for common actions
- **Security**: Protected against malicious code execution
- **Responsive Design**: Works on desktop and mobile devices

## About the Flex Programming Language

Flex is a custom programming language with a unique syntax designed for clarity and ease of use:

### Key Features
- **Unique Keywords**: `rakm` (numbers), `dorg` (arrays), `sndo2` (functions), `rg3` (return), `geeb` (import)
- **String Interpolation**: Use `{variable}` syntax within strings
- **Type Annotations**: Optional explicit typing with `rakm` for numbers
- **AI-Assisted Error Handling**: Get intelligent suggestions when errors occur
- **Interactive Input/Output**: Support for `da5l()` and `input()` functions

### Simple Example
```flex
# Define a function to calculate factorial
sndo2 factorial(n) {
    if (n <= 1) {
        rg3 1
    }
    rg3 n * factorial(n - 1)
}

# Get input from user
print("Enter a number:")
num_str = da5l()
num = int(num_str)

# Calculate and display result
result = factorial(num)
print("Factorial of {num} is {result}")
```

### Documentation
- **[Complete Language Reference](docs/DOCUMENTATION.md)** - Comprehensive guide with advanced features
- **[Quick Reference](docs/QUICK_REFERENCE.md)** - Syntax tables and common patterns
- **[Tutorial](docs/TUTORIAL.md)** - Step-by-step learning guide

## Project Structure

```
flex-online/
├── backend/             # Node.js backend
│   ├── server.js        # Main server code
│   ├── temp/            # Temporary files for code execution
│   └── package.json     # Node.js dependencies
├── frontend/            # Web frontend
│   ├── index.html       # Main HTML file
│   ├── css/             # Stylesheets
│   │   └── styles.css   # Main CSS file
│   └── js/              # JavaScript files
│       ├── main.js      # Main application logic
│       └── flex-mode.js # CodeMirror syntax highlighting for Flex
├── logs/                # Application logs
├── deploy.sh            # Deployment script for production
└── ecosystem.config.js  # PM2 configuration
```

## Technical Requirements

### Backend
- Node.js 14.x or higher
- Python 3.6 or higher (for Flex language execution)

### Frontend
- Modern web browser supporting ES6

## Setup Instructions

### 1. Clone the Repository

```bash
git clone <repository-url>
cd flex-online
```

### 2. Install Backend Dependencies

```bash
cd backend
npm install
```

### 3. Configure Environment Variables

Create a `.env` file in the backend directory:

```
PORT=3000
NODE_ENV=development
PYTHON_PATH=python3
FLEX_SRC_PATH=../../src
TEMP_DIR=./temp
LOG_LEVEL=info
```

Adjust paths as needed for your environment.

### 4. Create Necessary Directories

```bash
mkdir -p backend/temp logs
```

### 5. Start the Server (Development)

```bash
cd ..  # Return to project root
node backend/server.js
```

### 6. Start the Server (Production)

For quick production deployment, use the provided script:

```bash
./deploy.sh
```

Or manually:

```bash
# Install PM2 globally if not already installed
npm install -g pm2

# Start the application with PM2
pm2 start ecosystem.config.js --env production
```

## Production Deployment

For production deployment:

1. Use the provided deployment script: `./deploy.sh`
2. The script will:
   - Install dependencies
   - Create necessary directories
   - Set environment to production
   - Start the application with PM2
   - Configure PM2 to start on system boot

### Manual Production Setup

1. Set the `NODE_ENV` to `production` in your environment variables
2. Configure a reverse proxy (Nginx or Apache) to forward requests to your Node.js application
3. Set up SSL certificates for secure HTTPS connections
4. Consider using a process manager like PM2 for high availability

### Security Considerations

The application includes several security features:
- Helmet for securing HTTP headers
- XSS protection
- Rate limiting to prevent abuse
- Code execution timeout
- Code validation to prevent dangerous operations

## User Features

### Keyboard Shortcuts

- `Ctrl + Enter`: Run code
- `Ctrl + S`: Save code to browser storage
- `Tab`: Insert 4 spaces
- `Ctrl + /`: Toggle comment
- `Ctrl + Z`: Undo
- `Ctrl + Y`: Redo

### Code Sharing

Share your code with others by clicking the "Share" button, which generates a URL containing your code that can be sent to others.

### Local Storage

Your code is automatically saved to the browser's local storage so you can continue where you left off when you return.

## API Documentation

### Execute Flex Code
- **URL:** `/api/execute`
- **Method:** POST
- **Body:** `{ "code": "your Flex code here" }`
- **Response:** `{ "output": "program output", "stderr": "error output if any" }`

### Get Examples
- **URL:** `/api/examples`
- **Method:** GET
- **Response:** Array of example objects with name and content

### Get Documentation
- **URL:** `/api/docs/:docFile`
- **Method:** GET
- **Params:** `docFile` - name of the documentation file (e.g., README, QUICK_REFERENCE)
- **Response:** `{ "content": "markdown content" }`

## Project Roadmap

### Phase 1: MVP (Complete)
- Basic code editor and execution
- Examples and documentation integration

### Phase 2: Enhanced Features (Current)
- Code sharing and local storage
- Security improvements
- Keyboard shortcuts
- Error handling improvements

### Phase 3: Advanced Features (Planned)
- User accounts and saved programs
- More advanced code editor features (autocomplete, etc.)
- Debugging tools
- Collaborative editing
- Version control integration
- IDE plugins and extensions

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## Troubleshooting

### Common Issues

- **"Error connecting to server"**: Make sure the backend server is running and accessible
- **"Code execution timed out"**: Your code might be in an infinite loop or taking too long to execute
- **"Invalid code detected"**: The code might contain potentially unsafe operations

For more detailed troubleshooting, check the logs in the `logs` directory.

## License

[MIT License](LICENSE)

## Acknowledgments

- Flex language developers
- CodeMirror for the code editor
- Bootstrap for the UI framework
- PM2 for process management 