const fs = require('fs');
const path = require('path');
const logger = require('../config/logger');
const constants = require('../config/constants');

/**
 * Content Controller
 * Handles API endpoints related to examples and documentation
 */
class ContentController {
  /**
   * Get all available examples
   */
  getExamples(req, res) {
    try {
      const examples = [];

      // Check if examples directory exists
      if (!fs.existsSync(constants.EXAMPLES_DIR)) {
        logger.warn(`Examples directory not found: ${constants.EXAMPLES_DIR}`);
        return res.json(examples);
      }

      // Read the examples directory
      const files = fs.readdirSync(constants.EXAMPLES_DIR);

      // Process each file
      files.forEach(file => {
        if (file.endsWith('.lx')) {
          const filePath = path.join(constants.EXAMPLES_DIR, file);
          
          try {
            const content = fs.readFileSync(filePath, 'utf8');

            // Extract first line as title or use filename
            const lines = content.split('\n');
            const title = lines[0].startsWith('//')
              ? lines[0].substring(2).trim()
              : file.replace('.lx', '');

            // Add to examples list
            examples.push({
              id: file.replace('.lx', ''),
              title: title,
              filename: file,
              content: content
            });
          } catch (fileError) {
            logger.error(`Error reading example file ${file}: ${fileError.message}`);
          }
        }
      });

      res.json(examples);
    } catch (error) {
      logger.error(`Error fetching examples: ${error.message}`);
      res.status(500).json({ error: 'Failed to fetch examples' });
    }
  }

  /**
   * Get specific documentation file
   */
  getDocumentation(req, res) {
    try {
      const docName = req.params.doc;
      
      // Validate doc name for security
      if (!/^[a-zA-Z0-9_\-]+$/.test(docName)) {
        return res.status(400).json({ error: 'Invalid documentation file name' });
      }

      const docPath = path.join(constants.DOCS_DIR, `${docName}.md`);

      // Check if file exists
      if (!fs.existsSync(docPath)) {
        logger.warn(`Documentation file not found: ${docPath}`);
        return res.status(404).json({ error: 'Documentation not found' });
      }

      // Read the documentation file
      const content = fs.readFileSync(docPath, 'utf8');
      res.json({ content });
    } catch (error) {
      logger.error(`Error fetching documentation: ${error.message}`);
      res.status(500).json({ error: 'Failed to fetch documentation' });
    }
  }

  /**
   * Get available documentation files list
   */
  getDocumentationList(req, res) {
    try {
      const docs = [];

      // Check if docs directory exists
      if (!fs.existsSync(constants.DOCS_DIR)) {
        logger.warn(`Documentation directory not found: ${constants.DOCS_DIR}`);
        return res.json(docs);
      }

      // Read the docs directory
      const files = fs.readdirSync(constants.DOCS_DIR);

      // Process each markdown file
      files.forEach(file => {
        if (file.endsWith('.md')) {
          const filePath = path.join(constants.DOCS_DIR, file);
          
          try {
            const content = fs.readFileSync(filePath, 'utf8');
            const lines = content.split('\n');
            
            // Extract title from first heading or use filename
            let title = file.replace('.md', '');
            for (const line of lines) {
              if (line.startsWith('# ')) {
                title = line.substring(2).trim();
                break;
              }
            }

            docs.push({
              id: file.replace('.md', ''),
              title: title,
              filename: file
            });
          } catch (fileError) {
            logger.error(`Error reading documentation file ${file}: ${fileError.message}`);
          }
        }
      });

      res.json(docs);
    } catch (error) {
      logger.error(`Error fetching documentation list: ${error.message}`);
      res.status(500).json({ error: 'Failed to fetch documentation list' });
    }
  }

  /**
   * Health check endpoint
   */
  getStatus(req, res) {
    res.json({ 
      status: 'online', 
      message: 'Flex Web Compiler server is running',
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    });
  }
}

module.exports = new ContentController(); 