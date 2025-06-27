const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const { v4: uuidv4 } = require('uuid');
const logger = require('../config/logger');
const constants = require('../config/constants');
const { cleanupOldTempFiles } = require('../utils/helpers');
const executionManager = require('./executionManager');
const websocketManager = require('./websocketManager');

/**
 * Flex Executor Service
 * Handles the execution of Flex code using Python subprocess
 */
class FlexExecutor {
    constructor() {
        // Ensure temp directory exists
        if (!fs.existsSync(constants.TEMP_DIR)) {
            fs.mkdirSync(constants.TEMP_DIR, { recursive: true });
        }
    }

    /**
     * Execute Flex code
     */
    async executeFlexCode(code) {
        // Generate a unique ID and filename for this execution
        const executionId = uuidv4();
        const filename = `code_${executionId}.lx`;
        const filepath = path.join(constants.TEMP_DIR, filename);

        // Clean up any old temporary files
        cleanupOldTempFiles();

        // Write the code to a temporary file
        fs.writeFileSync(filepath, code);

        logger.info(`Executing Flex code with executionId: ${executionId}`);

        return new Promise((resolve, reject) => {
            let output = [];
            let errors = [];
            let timedOut = false;

            // Create a child process to run the Python interpreter
            const scriptPath = path.join(constants.FLEX_COMPILER_PATH, 'src', 'main.py');

            logger.info(`Spawning Python process: ${constants.PYTHON_PATH} -u ${scriptPath} ${filepath}`);

            const pyProcess = spawn(constants.PYTHON_PATH, [
                '-u', // Force unbuffered output
                scriptPath,
                filepath,
                '--web' // Enable web mode for input/output handling
            ], {
                cwd: constants.FLEX_COMPILER_PATH, // Set the working directory to the compiler repo
                env: {
                    ...process.env,
                    // Make sure any environment variables needed by the compiler are set
                    USE_AI: process.env.USE_FLEX_AI || 'false',
                    PYTHONUNBUFFERED: '1' // Ensure Python output is completely unbuffered
                },
                stdio: ['pipe', 'pipe', 'pipe'] // Make stdin, stdout, stderr all pipes
            });

            // Create an execution record
            const execution = {
                executionId,
                pyProcess,
                filepath,
                waitingForInput: false,
                clientId: null,
                timeoutStartTime: Date.now(),
                pausedTimeRemaining: constants.EXECUTION_TIMEOUT,
                state: 'running' // Add execution state tracking
            };

            // Store in active executions
            executionManager.addExecution(executionId, execution);

            // Timeout handling
            let timeoutId = null;

            // Function to start/resume timeout
            const startTimeout = () => {
                // Clear any existing timeout first
                if (timeoutId) {
                    clearTimeout(timeoutId);
                }

                // Set new timeout
                timeoutId = setTimeout(() => {
                    timedOut = true;
                    if (pyProcess) {
                        pyProcess.kill();
                    }
                    logger.warn(`Code execution timed out after ${constants.EXECUTION_TIMEOUT}ms`);
                    executionManager.cleanupExecution(executionId);
                    reject({ error: 'Code execution timed out', stderr: ['Execution took too long and was terminated.'] });
                }, execution.pausedTimeRemaining);

                // Store the timeout start time for pause calculations
                execution.timeoutStartTime = Date.now();
            };

            // Function to pause timeout when waiting for input
            const pauseTimeout = () => {
                if (timeoutId) {
                    clearTimeout(timeoutId);

                    // Calculate remaining time
                    const elapsedTime = Date.now() - execution.timeoutStartTime;
                    execution.pausedTimeRemaining = Math.max(execution.pausedTimeRemaining - elapsedTime, 1000); // Ensure at least 1 second
                    logger.info(`Paused execution timeout with ${execution.pausedTimeRemaining}ms remaining`);
                }
            };

            // Store the timeout functions on the execution object
            execution.startTimeout = startTimeout;
            execution.pauseTimeout = pauseTimeout;

            // Initial timeout start
            startTimeout();

            // Handle stdout
            pyProcess.stdout.on('data', (data) => {
                this.handleStdout(data, execution, output);
            });

            // Handle stderr
            pyProcess.stderr.on('data', (data) => {
                this.handleStderr(data, execution, errors);
            });

            // Handle process completion
            pyProcess.on('close', (code) => {
                this.handleProcessClose(code, execution, output, errors, timedOut, timeoutId, resolve, reject);
            });

            // Handle process errors
            pyProcess.on('error', (err) => {
                clearTimeout(timeoutId);
                logger.error(`Failed to start Python process for execution ${executionId}: ${err.message}`);
                executionManager.cleanupExecution(executionId);
                reject({ error: 'Failed to start Python process', stderr: [err.message] });
            });
        });
    }

    /**
     * Handle stdout data from Python process
     */
    handleStdout(data, execution, output) {
        const message = data.toString();
        logger.info(`Received stdout: "${message.trim()}"`);

        // Check for input request token - multiple detection methods for robustness
        const isInputRequest =
            message.trim() === constants.INPUT_REQUEST_TOKEN ||
            message.includes(constants.INPUT_REQUEST_TOKEN) ||
            message.includes('Waiting for input') ||
            message.includes('scan()') ||
            message.includes('da5l()'); // Additional checks for scan function

        // Check if this message should be filtered out (input/output tokens)
        const shouldFilter =
            message.trim() === constants.INPUT_REQUEST_TOKEN ||
            message.trim() === constants.INPUT_RECEIVED_TOKEN ||
            message.includes(constants.INPUT_REQUEST_TOKEN) ||
            message.includes(constants.INPUT_RECEIVED_TOKEN);

        if (isInputRequest) {
            this.handleInputRequest(execution, output);
        } else if (!shouldFilter) {
            // Only process non-filtered messages
            // For regular output, add to output buffer
            output.push(message);

            // Store pending output in case an input request follows or client registers late
            if (!execution.pendingOutput) {
                execution.pendingOutput = [];
            }
            execution.pendingOutput.push(message);

            // Send output to the registered client or broadcast if no client registered
            if (execution.clientId && websocketManager.getAllClients().has(execution.clientId)) {
                // Send to specific registered client
                this.sendOutputToClient(execution, message);
            } else {
                // Broadcast to all clients if no specific client is registered
                websocketManager.getAllClients().forEach((ws, clientId) => {
                    if (ws.readyState === 1) { // WebSocket.OPEN
                        websocketManager.safelySendMessage(ws, {
                            type: 'output',
                            executionId: execution.executionId,
                            data: message,
                            broadcast: true
                        });
                    }
                });
            }
        } else {
            // Filtered message - just log it but don't send to client
            logger.info(`Filtered out token from output: "${message.trim()}"`);
        }
    }

    /**
     * Handle stderr data from Python process
     */
    handleStderr(data, execution, errors) {
        const errorMsg = data.toString().trim();
        errors.push(errorMsg);

        // Send via WebSocket if connected
        if (execution.clientId && websocketManager.getAllClients().has(execution.clientId)) {
            const ws = websocketManager.getAllClients().get(execution.clientId);
            websocketManager.safelySendMessage(ws, { type: 'error', content: errorMsg });
        }

        logger.error(`Error in execution ${execution.executionId}: ${errorMsg}`);
    }

    /**
     * Handle input request from Python process
     */
    handleInputRequest(execution, output) {
        executionManager.setWaitingForInput(execution.executionId, true);
        executionManager.updateExecutionState(execution.executionId, 'waiting_input');

        // Add a prompt field to indicate this is a scan() call if detected
        if (execution.pendingOutput && execution.pendingOutput.some(msg =>
            msg.includes('scan()') || msg.includes('input()') || msg.includes('da5l()'))) {
            execution.inputPrompt = 'Input required for scan() function';
            logger.info(`Scan function input request detected for execution ${execution.executionId}`);
        }

        logger.info(`Input request detected for execution ${execution.executionId}, state changed to waiting_input`);

        // Add timestamp for debugging
        execution.inputRequestTime = Date.now();

        // Pause the timeout while waiting for input
        execution.pauseTimeout();

        // Make sure any pending output has been added to the output buffer
        const pendingOutput = execution.pendingOutput || [];
        if (pendingOutput.length > 0) {
            output.push(...pendingOutput);
            logger.info(`Added ${pendingOutput.length} pending output messages to output buffer for execution ${execution.executionId}`);

            // Clear pending output to prevent duplication - output was already sent in real-time
            execution.pendingOutput = [];
        } else {
            logger.info(`No pending output to process for execution ${execution.executionId}`);
        }

        // Add a small delay to ensure output is processed before input request
        setTimeout(() => {
            // Notify the client via WebSocket
            this.notifyClientForInput(execution);
        }, 100); // 100ms delay to ensure output is processed first
    }

    /**
     * Send output to connected client
     */
    sendOutputToClient(execution, message) {
        if (execution.clientId && websocketManager.getAllClients().has(execution.clientId)) {
            const ws = websocketManager.getAllClients().get(execution.clientId);
            if (ws.readyState === 1) { // WebSocket.OPEN
                // Send the output to the client
                websocketManager.safelySendMessage(ws, {
                    type: 'output',
                    executionId: execution.executionId,
                    data: message
                });
            }
        }
    }

    /**
     * Notify client that input is required
     */
    notifyClientForInput(execution) {
        if (execution.clientId && websocketManager.getAllClients().has(execution.clientId)) {
            const ws = websocketManager.getAllClients().get(execution.clientId);
            if (ws.readyState === 1) { // WebSocket.OPEN
                try {
                    // Send multiple times to ensure delivery with exponential backoff
                    websocketManager.sendInputRequestToClient(ws, execution.executionId, 0);
                } catch (error) {
                    logger.error(`Error sending input request to client: ${error.message}`);
                    // Try to broadcast as fallback
                    websocketManager.broadcastInputRequest(execution.executionId);
                }
            } else {
                logger.error(`Client ${execution.clientId} WebSocket not open`);
                // Try to broadcast as fallback
                websocketManager.broadcastInputRequest(execution.executionId);
            }
        } else {
            // Broadcast to all clients if specific client not found
            websocketManager.broadcastInputRequest(execution.executionId);
        }
    }

    /**
     * Handle process close event
     */
    handleProcessClose(code, execution, output, errors, timedOut, timeoutId, resolve, reject) {
        // Clear timeout to prevent it from firing after process ends
        if (timeoutId) {
            clearTimeout(timeoutId);
            timeoutId = null;
        }

        logger.info(`Python process exited with code ${code} for execution ${execution.executionId}`);

        // Update execution state
        executionManager.updateExecutionState(execution.executionId, code === 0 ? 'completed' : 'error');

        // Notify client that execution is complete
        if (execution.clientId && websocketManager.getAllClients().has(execution.clientId)) {
            const ws = websocketManager.getAllClients().get(execution.clientId);
            if (ws.readyState === 1) { // WebSocket.OPEN
                websocketManager.safelySendMessage(ws, {
                    type: 'execution_complete',
                    status: code === 0 ? 'completed' : 'error',
                    exitCode: code
                });
            }
        }

        // Don't resolve/reject if timed out as it's already been handled
        if (!timedOut) {
            executionManager.cleanupExecution(execution.executionId);

            if (code === 0) {
                // Success - Convert output array to string for frontend compatibility
                resolve({
                    executionId: execution.executionId,
                    output: this.filterOutput(output.join('\n')),
                    stderr: errors.length > 0 ? errors.join('\n') : null
                });
            } else {
                // Error
                reject({
                    error: 'Code execution failed',
                    stderr: errors.length > 0 ? errors : ['Execution failed with no specific error message']
                });
            }
        }
    }

    /**
     * Filter output to remove input request tokens
     */
    filterOutput(output) {
        if (output && typeof output === 'string') {
            // Filter out any input request/received tokens from the output
            return output
                .split('\n')
                .filter(line => {
                    const trimmed = line.trim();
                    return trimmed !== constants.INPUT_REQUEST_TOKEN &&
                        trimmed !== constants.INPUT_RECEIVED_TOKEN;
                })
                .join('\n');
        }
        return output;
    }
}

// Export singleton instance
module.exports = new FlexExecutor(); 