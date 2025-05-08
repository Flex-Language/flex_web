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

// Helper function to broadcast WebSocket messages
function broadcastWebSocketMessage(type, data) {
  const message = JSON.stringify({
    type,
    ...data
  });
  
  log(`Broadcasting message: ${type}`);
  
  for (const client of clients.values()) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  }
}

// Store WebSocket clients and track active executions
const clients = new Map();
const activeExecutions = new Map();

wss.on('connection', (ws) => {
  const clientId = uuidv4();
  clients.set(clientId, ws);
  log(`WebSocket client connected: ${clientId}`);
  
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message.toString());
      log(`Received message: ${JSON.stringify(data)}`);
      
      // Handle stop execution request
      if (data.type === 'stop_execution' && data.executionId) {
        const execution = activeExecutions.get(data.executionId);
        if (execution && execution.process) {
          log(`Stopping execution ${data.executionId}`);
          
          // Kill the process
          execution.process.kill();
          
          // Broadcast execution completion - this will trigger button state change
          broadcastWebSocketMessage('execution_complete', {
            executionId: data.executionId,
            status: 'stopped'
          });
          
          // Send an additional UI-specific message to force button reset
          broadcastWebSocketMessage('reset_ui', {
            target: 'run-button',
            executionId: data.executionId
          });
          
          // Remove from active executions
          activeExecutions.delete(data.executionId);
        }
      }
    } catch (err) {
      log(`Error processing WebSocket message: ${err.message}`);
    }
  });
  
  ws.on('close', () => {
    log(`WebSocket client disconnected: ${clientId}`);
    clients.delete(clientId);
  });
});

// API endpoint to check server status
app.get('/api/status', (req, res) => {
  res.json({ status: 'online', message: 'Flex Web Compiler server is running' });
});

// API endpoint for examples
app.get('/api/examples', (req, res) => {
  try {
    const examplesDir = path.join(__dirname, '..', 'frontend', 'examples');
    const examples = [];
    
    if (fs.existsSync(examplesDir)) {
      const files = fs.readdirSync(examplesDir);
      files.forEach(file => {
        if (file.endsWith('.lx') || file.endsWith('.flex')) {
          const filePath = path.join(examplesDir, file);
          const content = fs.readFileSync(filePath, 'utf8');
          examples.push({
            name: file.replace(/\.(lx|flex)$/, ''),
            file: file,
            content: content
          });
        }
      });
    }
    
    res.json(examples);
  } catch (error) {
    log(`Error fetching examples: ${error.message}`);
    res.status(500).json({ error: 'Failed to fetch examples' });
  }
});

// API endpoint for documentation
app.get('/api/docs/:file', (req, res) => {
  try {
    const docFile = req.params.file;
    // Only allow safe file names
    if (!/^[a-zA-Z0-9_\-]+$/.test(docFile)) {
      return res.status(400).json({ error: 'Invalid documentation file name' });
    }
    
    const docPath = path.join(__dirname, '..', 'frontend', 'docs', `${docFile}.md`);
    
    if (fs.existsSync(docPath)) {
      const content = fs.readFileSync(docPath, 'utf8');
      res.json({ content });
    } else {
      // If file doesn't exist, return a basic message
      res.json({ content: '# Flex Compiler Documentation\n\nDocumentation is currently being updated.' });
    }
  } catch (error) {
    log(`Error fetching documentation: ${error.message}`);
    res.status(500).json({ error: 'Failed to fetch documentation' });
  }
});

// API endpoint for input status check with execution ID
app.get('/api/input-status/:executionId', (req, res) => {
  const executionId = req.params.executionId;
  const execution = activeExecutions.get(executionId);
  
  if (execution) {
    res.json({
      waitingForInput: execution.waitingForInput || false,
      executionId
    });
  } else {
    res.json({
      waitingForInput: false,
      executionId,
      exists: false
    });
  }
});

// API endpoint for general input status check without execution ID
app.get('/api/input-status', (req, res) => {
  // Check if any executions are waiting for input
  let waitingExecution = null;
  
  for (const [executionId, execution] of activeExecutions.entries()) {
    if (execution.waitingForInput) {
      waitingExecution = {
        executionId,
        waitingForInput: true
      };
      break;
    }
  }
  
  if (waitingExecution) {
    res.json(waitingExecution);
  } else {
    res.json({
      waitingForInput: false,
      activeExecutions: activeExecutions.size
    });
  }
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
    
    // Store execution in activeExecutions map for stop functionality
    activeExecutions.set(executionId, {
      process: pyProcess,
      startTime: Date.now(),
      filepath
    });
    
    // Broadcast execution start to all WebSocket clients
    const startMessage = JSON.stringify({
      type: 'execution_start',
      executionId: executionId
    });
    
    for (const client of clients.values()) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(startMessage);
      }
    }
    
    // Set a timeout
    const timeout = setTimeout(() => {
      pyProcess.kill();
      // Remove from active executions
      activeExecutions.delete(executionId);
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
      
      // Remove from active executions
      activeExecutions.delete(executionId);
      
      // Clean up the temporary file
      try {
        fs.unlinkSync(filepath);
      } catch (err) {
        log(`Error cleaning up file ${filepath}: ${err.message}`);
      }
      
      // Broadcast execution completion to all clients
      broadcastWebSocketMessage('execution_complete', {
        executionId: executionId,
        status: code === 0 ? 'completed' : 'error'
      });
      
      // Send an additional UI-specific message to ensure button resets
      broadcastWebSocketMessage('reset_ui', {
        target: 'run-button',
        executionId: executionId
      });
      
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
