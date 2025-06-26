const logger = require('../config/logger');
const constants = require('../config/constants');
const { isValidCode } = require('../utils/helpers');
const flexExecutor = require('../services/flexExecutor');
const executionManager = require('../services/executionManager');

/**
 * Execution Controller
 * Handles API endpoints related to code execution
 */
class ExecutionController {
    /**
     * Execute Flex code
     */
    async execute(req, res) {
        try {
            const code = req.body.code;

            if (!code) {
                return res.status(400).json({ error: 'No code provided' });
            }

            // Prevent extremely large code submissions
            if (code.length > constants.MAX_CODE_LENGTH) {
                return res.status(400).json({ error: `Code size exceeds maximum limit (${constants.MAX_CODE_LENGTH / 1000}KB)` });
            }

            // Validate code for security (optional - can be enabled later)
            // if (!isValidCode(code)) {
            //   return res.status(400).json({ error: 'Code contains potentially dangerous operations' });
            // }

            // Execute the code
            logger.info('Executing Flex code');
            const result = await flexExecutor.executeFlexCode(code);

            // Check if result contains a timed out flag
            if (result.timeout) {
                logger.warn('Code execution timed out');
                return res.status(504).json({ error: 'Code execution timed out' });
            }

            // Add execution state to the response if available
            if (result.executionId && executionManager.hasExecution(result.executionId)) {
                const execution = executionManager.getExecution(result.executionId);
                result.status = execution.state;
            } else if (result.executionId) {
                // If execution ID exists but not in active executions, it completed quickly
                result.status = 'completed';
            }

            res.json(result);
        } catch (error) {
            logger.error(`Error executing code: ${error.message}`);
            res.status(500).json({
                error: 'Failed to execute code',
                stderr: error.stderr || [error.message]
            });
        }
    }

    /**
     * Send input to an execution via HTTP
     */
    async sendInput(req, res) {
        try {
            const { executionId, input } = req.body;

            // Validate request
            if (!executionId) {
                logger.warn('Received input request without executionId');
                return res.status(400).json({
                    status: 'error',
                    error: 'Execution ID is required'
                });
            }

            if (input === undefined || input === null) {
                logger.warn(`Received input request for execution ${executionId} without input`);
                return res.status(400).json({
                    status: 'error',
                    error: 'Input is required'
                });
            }

            // Check if execution exists
            if (!executionManager.hasExecution(executionId)) {
                logger.warn(`Received input for unknown execution ${executionId}`);
                return res.status(404).json({
                    status: 'error',
                    error: 'Execution not found'
                });
            }

            const execution = executionManager.getExecution(executionId);

            // Check if execution is waiting for input
            if (!execution.waitingForInput) {
                logger.warn(`Received input for execution ${executionId} but it's not waiting for input`);
                return res.status(400).json({
                    status: 'error',
                    error: 'Execution is not waiting for input'
                });
            }

            // Send the input to the Python process
            try {
                execution.pyProcess.stdin.write(input + '\n');
                executionManager.setWaitingForInput(executionId, false);

                // Update execution state - back to running after input
                executionManager.updateExecutionState(executionId, 'running');

                // Resume the timeout
                if (typeof execution.startTimeout === 'function') {
                    execution.startTimeout();
                    logger.info(`Resumed timeout for execution ${executionId}`);
                }

                logger.info(`Input sent to execution ${executionId} via HTTP API`);

                return res.json({
                    status: 'success',
                    state: 'running',
                    message: 'Input processed successfully'
                });
            } catch (processError) {
                logger.error(`Error sending input to process: ${processError.message}`);
                return res.status(500).json({
                    status: 'error',
                    error: `Failed to send input to execution: ${processError.message}`
                });
            }
        } catch (error) {
            logger.error(`Error processing input request: ${error.message}`);
            return res.status(500).json({
                status: 'error',
                error: 'Server error processing input request'
            });
        }
    }

    /**
     * Get execution status
     */
    getExecutionStatus(req, res) {
        const executionId = req.params.id;

        if (!executionId) {
            return res.status(400).json({
                status: 'error',
                error: 'Execution ID is required'
            });
        }

        if (executionManager.hasExecution(executionId)) {
            const execution = executionManager.getExecution(executionId);
            return res.json({
                status: 'success',
                executionId: executionId,
                state: execution.state,
                waitingForInput: execution.waitingForInput
            });
        } else {
            // Execution not found - assume it completed or was never started
            return res.json({
                status: 'success',
                executionId: executionId,
                state: 'completed'
            });
        }
    }

    /**
     * Get input status for all executions
     */
    getInputStatus(req, res) {
        try {
            const waitingExecutions = executionManager.getWaitingExecutions();

            // Return status info
            res.json({
                status: 'ok',
                waitingExecutions,
                activeExecutionCount: executionManager.getActiveCount(),
                clientCount: require('../services/websocketManager').getClientCount()
            });
        } catch (error) {
            logger.error(`Error checking input status: ${error.message}`);
            res.status(500).json({ error: 'Failed to check input status' });
        }
    }

    /**
     * Test input handling (diagnostic endpoint)
     */
    testInput(req, res) {
        try {
            // Count active WebSocket connections
            const websocketManager = require('../services/websocketManager');
            let activeConnections = websocketManager.getClientCount();

            // Count active executions
            const activeExecutionCount = executionManager.getActiveCount();

            // Prepare list of active executions
            const executionList = [];
            executionManager.getAllExecutions().forEach((execution, id) => {
                executionList.push({
                    id,
                    waitingForInput: execution.waitingForInput,
                    hasClient: !!execution.clientId,
                    clientId: execution.clientId || null
                });
            });

            // Return diagnostic info
            res.json({
                status: 'ok',
                websocket: {
                    active: true,
                    connections: activeConnections
                },
                executions: {
                    count: activeExecutionCount,
                    list: executionList
                },
                message: 'WebSocket diagnostics complete'
            });
        } catch (error) {
            logger.error(`Error in diagnostic route: ${error.message}`);
            res.status(500).json({ error: 'Diagnostic check failed', message: error.message });
        }
    }
}

module.exports = new ExecutionController(); 