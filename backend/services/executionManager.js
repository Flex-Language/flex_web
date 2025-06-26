const logger = require('../config/logger');
const { cleanupFile } = require('../utils/helpers');

/**
 * Execution Manager Service
 * Manages active code executions and their lifecycle
 */
class ExecutionManager {
  constructor() {
    this.activeExecutions = new Map();
  }

  /**
   * Add a new execution to the active executions map
   */
  addExecution(executionId, execution) {
    this.activeExecutions.set(executionId, execution);
    logger.info(`Added execution ${executionId} to active executions`);
  }

  /**
   * Get an execution by ID
   */
  getExecution(executionId) {
    return this.activeExecutions.get(executionId);
  }

  /**
   * Check if an execution exists
   */
  hasExecution(executionId) {
    return this.activeExecutions.has(executionId);
  }

  /**
   * Remove an execution from active executions
   */
  removeExecution(executionId) {
    if (this.activeExecutions.has(executionId)) {
      this.activeExecutions.delete(executionId);
      logger.info(`Removed execution ${executionId} from active executions`);
    }
  }

  /**
   * Get all active executions
   */
  getAllExecutions() {
    return this.activeExecutions;
  }

  /**
   * Get count of active executions
   */
  getActiveCount() {
    return this.activeExecutions.size;
  }

  /**
   * Clean up an execution completely
   */
  cleanupExecution(executionId) {
    if (this.activeExecutions.has(executionId)) {
      const execution = this.activeExecutions.get(executionId);

      // Kill the Python process if it's still running
      if (execution.pyProcess && !execution.pyProcess.killed) {
        try {
          execution.pyProcess.kill();
          logger.info(`Killed Python process for execution ${executionId}`);
        } catch (err) {
          logger.error(`Error killing process for execution ${executionId}: ${err.message}`);
        }
      }

      // Clean up the file
      if (execution.filepath) {
        cleanupFile(execution.filepath);
      }

      // Remove from active executions
      this.removeExecution(executionId);
      logger.info(`Cleaned up execution ${executionId}`);
    }
  }

  /**
   * Check if execution has completed
   */
  isExecutionCompleted(executionId) {
    // If execution is not in the active executions map, consider it completed
    if (!this.hasExecution(executionId)) {
      return true;
    }

    // Check if the execution is in a completed state
    const execution = this.getExecution(executionId);
    if (execution.state === 'completed' || execution.state === 'error' || execution.state === 'stopped') {
      return true;
    }

    // Check if the process has exited
    if (execution.pyProcess && execution.pyProcess.exitCode !== null) {
      return true;
    }

    // Execution is still running
    return false;
  }

  /**
   * Get executions waiting for input
   */
  getWaitingExecutions() {
    const waitingExecutions = [];
    
    this.activeExecutions.forEach((execution, id) => {
      if (execution.waitingForInput) {
        waitingExecutions.push({
          id,
          waitingSince: execution.inputRequestTime || Date.now(),
          hasClient: !!execution.clientId,
          clientId: execution.clientId || null,
          state: execution.state || 'waiting_input'
        });
      }
    });

    return waitingExecutions;
  }

  /**
   * Update execution state
   */
  updateExecutionState(executionId, state) {
    if (this.hasExecution(executionId)) {
      const execution = this.getExecution(executionId);
      execution.state = state;
      logger.info(`Updated execution ${executionId} state to: ${state}`);
    }
  }

  /**
   * Set execution waiting for input
   */
  setWaitingForInput(executionId, waiting = true) {
    if (this.hasExecution(executionId)) {
      const execution = this.getExecution(executionId);
      execution.waitingForInput = waiting;
      execution.inputRequestTime = waiting ? Date.now() : null;
      logger.info(`Set execution ${executionId} waiting for input: ${waiting}`);
    }
  }
}

// Export singleton instance
module.exports = new ExecutionManager(); 