const express = require('express');
const { exec } = require('child_process');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');
const winston = require('winston');

// Load environment variables from project root
dotenv.config({ path: path.join(__dirname, '..', '..', '.env') });

// Create Express router
const router = express.Router();

// GitHub webhook secret (you'll set this in GitHub and in your .env file)
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || 'your-webhook-secret';
const REPO_PATH = process.env.REPO_PATH || '/var/wwww/Flex';

// Configure logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({
      filename: path.join(__dirname, '../logs/webhook-error.log'),
      level: 'error'
    }),
    new winston.transports.File({
      filename: path.join(__dirname, '../logs/webhook.log')
    })
  ]
});

// If we're not in production, also log to the console
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}

// Verify GitHub signature
function verifySignature(req) {
  const signature = req.headers['x-hub-signature-256'];
  if (!signature) return false;

  const hmac = crypto.createHmac('sha256', WEBHOOK_SECRET);
  const body = JSON.stringify(req.body);
  const expectedSignature = `sha256=${hmac.update(body).digest('hex')}`;

  try {
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  } catch (error) {
    logger.error(`Signature verification error: ${error.message}`);
    return false;
  }
}

// Webhook route for GitHub
router.post('/github', express.json(), (req, res) => {
  try {
    logger.info('Received GitHub webhook');

    // Verify request is from GitHub
    if (!verifySignature(req)) {
      logger.warn('Invalid signature on webhook request');
      return res.status(401).send('Invalid signature');
    }

    // Check if it's a push event
    if (req.headers['x-github-event'] !== 'push') {
      logger.info(`Ignoring non-push event: ${req.headers['x-github-event']}`);
      return res.status(200).send('Ignored event');
    }

    // Get repository and branch information
    const payload = req.body;
    const repository = payload.repository ? payload.repository.name : 'unknown';
    const branch = payload.ref ? payload.ref.replace('refs/heads/', '') : 'unknown';

    logger.info(`Processing webhook for ${repository}/${branch}`);

    // Create a deploy log file and directory if it doesn't exist
    const logsDir = path.join(__dirname, '../logs');
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }

    const deployLogPath = path.join(logsDir, 'deploy.log');
    const timestamp = new Date().toISOString();

    // Append to deployment log
    fs.appendFileSync(deployLogPath, `\n[${timestamp}] Received push event for ${repository}/${branch}\n`);

    // Execute deployment script
    logger.info('Executing deployment script');
    exec(`cd ${REPO_PATH} && bash ./src/flex_web/deploy-webhook.sh >> ${deployLogPath} 2>&1`,
      (error, stdout, stderr) => {
        if (error) {
          logger.error(`Deployment error: ${error.message}`);
          fs.appendFileSync(deployLogPath,
            `\n[${timestamp}] Deployment failed: ${error.message}\n${stderr}\n`);
          return;
        }

        logger.info('Deployment completed successfully');
        fs.appendFileSync(deployLogPath,
          `\n[${timestamp}] Deployment completed successfully\n${stdout}\n`);
      }
    );

    // Respond immediately to GitHub
    res.status(200).send('Deploying...');
  } catch (error) {
    logger.error(`Webhook error: ${error.message}`);
    res.status(500).send('Server error');
  }
});

module.exports = router; 