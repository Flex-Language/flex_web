const express = require('express');
const router = express.Router();

// Import controllers
const executionController = require('../controllers/executionController');
const contentController = require('../controllers/contentController');

// Execution routes
router.post('/execute', executionController.execute.bind(executionController));
router.post('/input', executionController.sendInput.bind(executionController));
router.get('/execution-status/:id', executionController.getExecutionStatus.bind(executionController));
router.get('/input-status', executionController.getInputStatus.bind(executionController));
router.get('/test-input', executionController.testInput.bind(executionController));

// Content routes
router.get('/status', contentController.getStatus.bind(contentController));
router.get('/examples', contentController.getExamples.bind(contentController));
router.get('/docs', contentController.getDocumentationList.bind(contentController));
router.get('/docs/:doc', contentController.getDocumentation.bind(contentController));

module.exports = router; 