// Direct Express server for Flex Web Compiler
// This version doesn't run any interactive test files on startup

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Disable trust proxy since we're running direct
app.set('trust proxy', false);

// Create HTTP server
const http = require('http');
const server = http.createServer(app);

// Initialize WebSocket server
const WebSocket = require('./node_modules/ws');
const wss = new WebSocket.Server({ server });

// Allow CORS from any origin
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parser middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Create temp directory if it doesn't exist
const tempDir = path.join(__dirname, 'temp');
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir);
}

// Serve static files from the frontend directory
app.use(express.static(path.join(__dirname, '../frontend')));

// Basic logger function
function log(message) {
  console.log(`[${new Date().toISOString()}] ${message}`);
}

// Handle WebSocket connection
wss.on('connection', (ws) => {
  log('WebSocket client connected');
  
  ws.on('message', (message) => {
    log(`Received message: ${message}`);
  });
  
  ws.on('close', () => {
    log('WebSocket client disconnected');
  });
});

// API endpoint to check server status
app.get('/api/status', (req, res) => {
  res.json({ status: 'online', message: 'Flex Web Compiler server is running' });
});

// API endpoint to execute Flex code
app.post('/api/execute', async (req, res) => {
  try {
    const { code } = req.body;
    
    if (!code) {
      return res.status(400).json({ error: 'No code provided' });
    }
    
    // Generate a unique ID and filename for this execution
    const executionId = uuidv4();
    const filename = `code_${executionId}.lx`;
    const filepath = path.join(tempDir, filename);
    
    // Write the code to a temporary file
    fs.writeFileSync(filepath, code);
    
    log(`Executing Flex code with ID: ${executionId}`);
    
    // Set the path to the compiler
    const pythonPath = process.env.PYTHON_PATH || 'python3';
    const flexCompilerPath = path.join(__dirname, '..', '..', 'compiler');
    const scriptPath = path.join(flexCompilerPath, 'src', 'main.py');
    
    // Spawn the Python process
    const pyProcess = spawn(pythonPath, [
      '-u', // Force unbuffered output
      scriptPath,
      filepath,
      '--web' // Always use web mode
    ], {
      cwd: flexCompilerPath
    });
    
    let output = [];
    let error = false;
    
    // Set a timeout
    const timeout = setTimeout(() => {
      pyProcess.kill();
      res.status(504).json({ error: 'Execution timed out' });
    }, 15000); // 15 seconds timeout
    
    // Handle stdout
    pyProcess.stdout.on('data', (data) => {
      const message = data.toString();
      if (!message.includes('__FLEX_INPUT_REQUEST__')) {
        output.push(message);
      }
    });
    
    // Handle stderr
    pyProcess.stderr.on('data', (data) => {
      error = true;
      output.push(`Error: ${data.toString()}`);
    });
    
    // Handle process completion
    pyProcess.on('close', (code) => {
      clearTimeout(timeout);
      
      // Clean up the temporary file
      try {
        fs.unlinkSync(filepath);
      } catch (err) {
        log(`Error cleaning up file ${filepath}: ${err.message}`);
      }
      
      if (error) {
        return res.status(500).json({ 
          error: 'Execution failed', 
          output: output.join('\n') 
        });
      }
      
      res.json({ 
        success: true, 
        output: output.join('\n'),
        executionId 
      });
    });
    
  } catch (error) {
    log(`Error executing code: ${error.message}`);
    res.status(500).json({ error: 'Server error', message: error.message });
  }
});

// Start the server on all interfaces
server.listen(PORT, '0.0.0.0', () => {
  log(`Server running on http://0.0.0.0:${PORT}`);
  log(`Access the web interface at http://localhost:${PORT}`);
});
