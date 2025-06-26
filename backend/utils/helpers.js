const fs = require('fs');
const path = require('path');
const logger = require('../config/logger');
const constants = require('../config/constants');

/**
 * Helper function to clean up temporary files
 */
function cleanupFile(filepath) {
  try {
    if (fs.existsSync(filepath)) {
      fs.unlinkSync(filepath);
      logger.info(`Cleaned up temporary file: ${filepath}`);
    }
  } catch (e) {
    logger.error(`Error deleting temp file: ${e.message}`);
  }
}

/**
 * Function to validate code for security concerns
 */
function isValidCode(code) {
  // Check for potentially dangerous imports or system calls
  const dangerousPatterns = [
    /import\s+os/i,
    /import\s+sys/i,
    /import\s+subprocess/i,
    /import\s+shutil/i,
    /exec\(/i,
    /system\(/i,
    /popen\(/i,
    /eval\(/i,
    /os\.\w+\(/i,
    /subprocess\.\w+\(/i
  ];

  // Check for unsupported modules to provide better error messages
  const unsupportedModules = [
    { pattern: /import\s+requests/i, message: "The 'requests' module is not supported in this environment." }
  ];

  // Check for unsupported modules and provide specific warnings
  for (const module of unsupportedModules) {
    if (module.pattern.test(code)) {
      logger.warn(`Unsupported module in code: ${module.pattern}`);
      throw new Error(module.message);
    }
  }

  // Check if code contains any dangerous patterns
  for (const pattern of dangerousPatterns) {
    if (pattern.test(code)) {
      logger.warn(`Potentially dangerous code detected: ${pattern}`);
      return false;
    }
  }

  // Check for maximum code length to prevent DoS
  if (code.length > constants.MAX_CODE_LENGTH) {
    logger.warn(`Code exceeds maximum length: ${code.length} > ${constants.MAX_CODE_LENGTH}`);
    return false;
  }

  return true;
}

/**
 * Clean up old temporary files
 */
function cleanupOldTempFiles() {
  try {
    if (!fs.existsSync(constants.TEMP_DIR)) {
      return;
    }

    const files = fs.readdirSync(constants.TEMP_DIR);
    const currentTime = Date.now();
    
    files.forEach(file => {
      if (file.startsWith('code_') && file.endsWith('.lx')) {
        const filePath = path.join(constants.TEMP_DIR, file);
        const stats = fs.statSync(filePath);
        // Remove files older than 1 hour
        if (currentTime - stats.mtimeMs > 3600000) {
          try {
            fs.unlinkSync(filePath);
            logger.info(`Cleaned up old temporary file: ${file}`);
          } catch (err) {
            logger.error(`Error cleaning up temporary file ${file}: ${err.message}`);
          }
        }
      }
    });
  } catch (err) {
    logger.error(`Error cleaning up temporary files: ${err.message}`);
  }
}

/**
 * Ensure required directories exist
 */
function ensureDirectoriesExist() {
  const directories = [
    constants.TEMP_DIR,
    constants.LOGS_DIR
  ];

  directories.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      logger.info(`Created directory: ${dir}`);
    }
  });
}

module.exports = {
  cleanupFile,
  isValidCode,
  cleanupOldTempFiles,
  ensureDirectoriesExist
}; 