const WebSocket = require('ws');
const { v4: uuidv4 } = require('uuid');
const logger = require('../config/logger');
const constants = require('../config/constants');
const executionManager = require('./executionManager');

/**
 * WebSocket Manager Service
 * Manages WebSocket connections and messaging
 */
class WebSocketManager {
    constructor() {
        this.clients = new Map();
        this.wss = null;
    }

    /**
     * Initialize WebSocket server
     */
    initialize(server) {
        this.wss = new WebSocket.Server({ server });

        this.wss.on('connection', (ws, req) => {
            this.handleConnection(ws, req);
        });

        logger.info('WebSocket server initialized');
    }

    /**
     * Handle new WebSocket connection
     */
    handleConnection(ws, req) {
        // Generate a client ID
        const clientId = uuidv4();
        this.clients.set(clientId, ws);
        logger.info(`Client connected: ${clientId}`);

        // Set up ping-pong heartbeat to keep connection alive
        ws.isAlive = true;
        ws.on('pong', () => {
            ws.isAlive = true;
        });

        // Setup heartbeat interval for this connection
        const heartbeatInterval = setInterval(() => {
            if (ws.isAlive === false) {
                logger.warn(`Terminating stale WebSocket connection for client ${clientId}`);
                clearInterval(heartbeatInterval);
                this.clients.delete(clientId);
                return ws.terminate();
            }

            // Mark as not alive until we get a pong back
            ws.isAlive = false;
            try {
                ws.ping();
            } catch (err) {
                logger.error(`Error pinging client ${clientId}: ${err.message}`);
            }
        }, constants.HEARTBEAT_INTERVAL);

        // Send the client ID to the client
        this.safelySendMessage(ws, { type: 'connected', clientId });

        // Handle WebSocket messages
        ws.on('message', (message) => {
            this.handleMessage(ws, clientId, message);
        });

        // Handle WebSocket close
        ws.on('close', () => {
            logger.info(`Client disconnected: ${clientId}`);
            this.clients.delete(clientId);
            clearInterval(heartbeatInterval);
        });
    }

    /**
     * Handle WebSocket messages
     */
    handleMessage(ws, clientId, message) {
        try {
            const data = JSON.parse(message.toString());

            // Reset heartbeat on any message 
            ws.isAlive = true;

            switch (data.type) {
                case 'register_execution':
                    this.handleRegisterExecution(ws, clientId, data);
                    break;
                case 'input':
                    this.handleInput(ws, clientId, data);
                    break;
                case 'stop_execution':
                    this.handleStopExecution(ws, clientId, data);
                    break;
                case 'check_execution_status':
                    this.handleCheckExecutionStatus(ws, clientId, data);
                    break;
                case 'ping':
                    this.safelySendMessage(ws, { type: 'pong', timestamp: Date.now() });
                    break;
                default:
                    logger.warn(`Unknown message type: ${data.type}`);
            }
        } catch (err) {
            logger.error(`Error processing WebSocket message: ${err.message}`);
        }
    }

    /**
     * Handle execution registration
     */
    handleRegisterExecution(ws, clientId, data) {
        const executionId = data.executionId;

        if (executionId && executionManager.hasExecution(executionId)) {
            const execution = executionManager.getExecution(executionId);
            execution.clientId = clientId;
            logger.info(`Registered client ${clientId} for execution ${executionId}`);

            // If the execution is already waiting for input, notify the client immediately
            if (execution.waitingForInput) {
                this.sendInputRequestToClient(ws, executionId, 0);
                logger.info(`Sent input_request to client ${clientId} (immediate notification)`);
            }
        } else {
            logger.warn(`Client ${clientId} tried to register for unknown execution ${executionId}`);
        }
    }

    /**
     * Handle input from client
     */
    handleInput(ws, clientId, data) {
        const executionId = data.executionId;
        const input = data.content;

        if (executionId && executionManager.hasExecution(executionId)) {
            const execution = executionManager.getExecution(executionId);

            if (execution.waitingForInput && execution.pyProcess) {
                logger.info(`Received input for execution ${executionId}: "${input}"`);
                executionManager.setWaitingForInput(executionId, false);

                // Send the input to the Python process
                try {
                    execution.pyProcess.stdin.write(input + '\n');
                    logger.info(`Sent input to Python process for execution ${executionId}`);

                    // Update execution state - back to running after input
                    executionManager.updateExecutionState(executionId, 'running');

                    // Send immediate acknowledgment to client that input was processed
                    this.safelySendMessage(ws, {
                        type: 'input_processed',
                        executionId: executionId,
                        timestamp: Date.now(),
                        status: 'running'
                    });

                    // Resume the timeout
                    if (typeof execution.startTimeout === 'function') {
                        execution.startTimeout();
                        logger.info(`Resumed timeout for execution ${executionId}`);
                    }
                } catch (error) {
                    logger.error(`Error sending input to Python process: ${error.message}`);
                    this.safelySendMessage(ws, {
                        type: 'error',
                        content: `Failed to process input: ${error.message}`
                    });
                }
            } else {
                logger.warn(`Received input for execution ${executionId} but it's not waiting for input`);
                this.safelySendMessage(ws, {
                    type: 'error',
                    content: 'Execution is not waiting for input'
                });
            }
        } else {
            logger.warn(`Received input for unknown execution ${executionId}`);
        }
    }

    /**
     * Handle stop execution request
     */
    handleStopExecution(ws, clientId, data) {
        const executionId = data.executionId;

        if (executionId && executionManager.hasExecution(executionId)) {
            logger.info(`Client ${clientId} requested to stop execution ${executionId}`);

            // Update execution state before cleanup
            executionManager.updateExecutionState(executionId, 'stopped');

            // Notify client about the state change
            this.safelySendMessage(ws, {
                type: 'execution_status',
                executionId: executionId,
                status: 'stopped'
            });

            executionManager.cleanupExecution(executionId);
        }
    }

    /**
     * Handle execution status check
     */
    handleCheckExecutionStatus(ws, clientId, data) {
        const executionId = data.executionId;

        if (executionId) {
            if (executionManager.hasExecution(executionId)) {
                // Execution is still active
                const execution = executionManager.getExecution(executionId);
                logger.info(`Reporting execution status for ${executionId}: ${execution.state}`);

                // Send the current status
                this.safelySendMessage(ws, {
                    type: 'execution_status',
                    executionId: executionId,
                    status: execution.state,
                    waitingForInput: execution.waitingForInput
                });

                // Register this client with the execution
                execution.clientId = clientId;
            } else {
                // Execution not found - assume it completed or was never started
                logger.info(`Execution ${executionId} not found, reporting as completed`);
                this.safelySendMessage(ws, {
                    type: 'execution_status',
                    executionId: executionId,
                    status: 'completed'
                });
            }
        }
    }

    /**
     * Send input request to client with retries
     */
    sendInputRequestToClient(ws, executionId, attempt) {
        try {
            // Get execution state if available
            let state = 'waiting_input';
            let prompt = 'Input required';

            if (executionManager.hasExecution(executionId)) {
                const execution = executionManager.getExecution(executionId);
                state = execution.state || 'waiting_input';
                prompt = execution.inputPrompt || 'Input required';
            }

            // Skip if execution has completed
            if (executionManager.isExecutionCompleted(executionId)) {
                logger.warn(`Skipping input request: execution ${executionId} has completed`);
                return;
            }

            // Send with a priority flag to ensure it's processed correctly
            const success = this.safelySendMessage(ws, {
                type: 'input_request',
                priority: true,
                executionId: executionId,
                timestamp: Date.now(),
                attempt: attempt,
                status: state,
                prompt: prompt
            });

            if (success) {
                logger.info(`Sent input_request to client for execution ${executionId} (attempt ${attempt})`);
            }

            // Retry a few times with exponential backoff to ensure delivery
            if (attempt < 2 && !executionManager.isExecutionCompleted(executionId)) {
                setTimeout(() => {
                    this.sendInputRequestToClient(ws, executionId, attempt + 1);
                }, 1000 * Math.pow(2, attempt)); // 1s, 2s, 4s backoff
            }
        } catch (err) {
            logger.error(`Error sending input request: ${err.message}`);
        }
    }

    /**
     * Broadcast input request to all clients
     */
    broadcastInputRequest(executionId) {
        logger.warn(`No client connected for execution ${executionId}, broadcasting input request`);

        let state = 'waiting_input';
        if (executionManager.hasExecution(executionId)) {
            const execution = executionManager.getExecution(executionId);
            state = execution.state || 'waiting_input';
        }

        this.wss.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
                this.safelySendMessage(client, {
                    type: 'input_request',
                    executionId: executionId,
                    broadcast: true,
                    timestamp: Date.now(),
                    status: state
                });
            }
        });
    }

    /**
     * Safely send WebSocket message with error handling
     */
    safelySendMessage(ws, message) {
        try {
            if (ws && ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify(message));
                return true;
            } else {
                logger.warn(`Cannot send WebSocket message: socket not open`);
                return false;
            }
        } catch (wsError) {
            logger.error(`Failed to send WebSocket message: ${wsError.message}`);
            return false;
        }
    }

    /**
     * Send message to specific client
     */
    sendToClient(clientId, message) {
        const ws = this.clients.get(clientId);
        if (ws) {
            return this.safelySendMessage(ws, message);
        }
        return false;
    }

    /**
     * Get client count
     */
    getClientCount() {
        return this.clients.size;
    }

    /**
     * Get all clients
     */
    getAllClients() {
        return this.clients;
    }
}

// Export singleton instance
module.exports = new WebSocketManager(); 