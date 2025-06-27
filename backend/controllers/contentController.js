const fs = require('fs');
const path = require('path');
const https = require('https');
const logger = require('../config/logger');
const constants = require('../config/constants');

/**
 * Content Controller
 * Handles API endpoints related to examples and documentation
 * Features real-time GitHub streaming from Flex-Language/Flex_docs_examples
 */
class ContentController {
  /**
   * Get all available examples from GitHub repository
   */
  async getExamples(req, res) {
    try {
      logger.info('Fetching examples from GitHub repository in real-time');

      // Fetch examples directory contents from GitHub API
      const examplesPath = '/contents/examples';
      const apiUrl = `${constants.GITHUB_API_BASE}/repos/${constants.GITHUB_OWNER}/${constants.GITHUB_REPO}${examplesPath}?ref=${constants.GITHUB_BRANCH}`;

      logger.debug(`GitHub API URL: ${apiUrl}`);

      const directoryContents = await this.fetchFromGitHub(apiUrl);

      if (!Array.isArray(directoryContents)) {
        throw new Error('Invalid response from GitHub API: expected array of files');
      }

      const examples = [];

      // Process each .lx file
      for (const file of directoryContents) {
        if (file.name.endsWith('.lx') && file.type === 'file') {
          try {
            logger.debug(`Fetching example file: ${file.name}`);

            // Fetch raw content from GitHub
            const rawContent = await this.fetchRawContent(file.download_url);

            // Extract first line as title or use filename
            const lines = rawContent.split('\n');
            const title = lines[0].startsWith('//')
              ? lines[0].substring(2).trim()
              : file.name.replace('.lx', '');

            examples.push({
              id: file.name.replace('.lx', ''),
              title: title,
              filename: file.name,
              content: rawContent,
              githubUrl: file.html_url,
              size: file.size,
              lastModified: file.sha,
              downloadUrl: file.download_url
            });

            logger.debug(`Successfully processed example: ${file.name}`);
          } catch (fileError) {
            logger.error(`Error fetching example file ${file.name}: ${fileError.message}`);
            // Continue processing other files instead of failing completely
          }
        }
      }

      logger.info(`Successfully fetched ${examples.length} examples from GitHub`);
      res.json(examples);
    } catch (error) {
      logger.error(`Error fetching examples from GitHub: ${error.message}`);

      // Fallback to local examples if GitHub is unavailable
      try {
        logger.info('Attempting fallback to local examples');
        const localExamples = this.getLocalExamples();
        res.json(localExamples);
      } catch (fallbackError) {
        logger.error(`Fallback to local examples failed: ${fallbackError.message}`);
        res.status(500).json({
          error: 'Failed to fetch examples from GitHub and local fallback failed',
          details: error.message,
          githubError: true
        });
      }
    }
  }

  /**
   * Get specific documentation file from GitHub repository
   */
  async getDocumentation(req, res) {
    try {
      const docName = req.params.doc;

      // Validate doc name for security
      if (!/^[a-zA-Z0-9_\-]+$/.test(docName)) {
        return res.status(400).json({ error: 'Invalid documentation file name' });
      }

      logger.info(`Fetching documentation ${docName} from GitHub repository`);

      // Try fetching from GitHub first
      const docPath = `/contents/docs/${docName}.md`;
      const apiUrl = `${constants.GITHUB_API_BASE}/repos/${constants.GITHUB_OWNER}/${constants.GITHUB_REPO}${docPath}?ref=${constants.GITHUB_BRANCH}`;

      logger.debug(`GitHub API URL: ${apiUrl}`);

      try {
        const fileInfo = await this.fetchFromGitHub(apiUrl);

        if (fileInfo.type !== 'file') {
          throw new Error('Not a file');
        }

        // Fetch raw content
        const content = await this.fetchRawContent(fileInfo.download_url);

        logger.info(`Successfully fetched documentation ${docName} from GitHub`);
        res.json({
          content,
          githubUrl: fileInfo.html_url,
          size: fileInfo.size,
          lastModified: fileInfo.sha,
          downloadUrl: fileInfo.download_url,
          source: 'github'
        });
      } catch (githubError) {
        logger.warn(`GitHub fetch failed for ${docName}: ${githubError.message}, trying local fallback`);

        // Fallback to local documentation
        const localContent = this.getLocalDocumentation(docName);
        res.json({
          content: localContent,
          source: 'local_fallback'
        });
      }
    } catch (error) {
      logger.error(`Error fetching documentation: ${error.message}`);
      res.status(500).json({
        error: 'Failed to fetch documentation',
        details: error.message
      });
    }
  }

  /**
   * Get available documentation files list from GitHub repository
   */
  async getDocumentationList(req, res) {
    try {
      logger.info('Fetching documentation list from GitHub repository');

      // Fetch docs directory contents from GitHub API
      const docsPath = '/contents/docs';
      const apiUrl = `${constants.GITHUB_API_BASE}/repos/${constants.GITHUB_OWNER}/${constants.GITHUB_REPO}${docsPath}?ref=${constants.GITHUB_BRANCH}`;

      logger.debug(`GitHub API URL: ${apiUrl}`);

      const directoryContents = await this.fetchFromGitHub(apiUrl);

      if (!Array.isArray(directoryContents)) {
        throw new Error('Invalid response from GitHub API: expected array of files');
      }

      const docs = [];

      // Process each markdown file
      for (const file of directoryContents) {
        if (file.name.endsWith('.md') && file.type === 'file') {
          try {
            // For the list, we don't need to fetch full content, just metadata
            let title = file.name.replace('.md', '');

            // Try to fetch first few lines to get the title if possible
            try {
              const rawContent = await this.fetchRawContent(file.download_url);
              const lines = rawContent.split('\n');

              // Extract title from first heading
              for (const line of lines) {
                if (line.startsWith('# ')) {
                  title = line.substring(2).trim();
                  break;
                }
              }
            } catch (titleError) {
              logger.debug(`Could not extract title from ${file.name}: ${titleError.message}`);
            }

            docs.push({
              id: file.name.replace('.md', ''),
              title: title,
              filename: file.name,
              githubUrl: file.html_url,
              size: file.size,
              lastModified: file.sha
            });

            logger.debug(`Successfully processed documentation: ${file.name}`);
          } catch (fileError) {
            logger.error(`Error processing documentation file ${file.name}: ${fileError.message}`);
          }
        }
      }

      logger.info(`Successfully fetched ${docs.length} documentation files from GitHub`);
      res.json(docs);
    } catch (error) {
      logger.error(`Error fetching documentation list from GitHub: ${error.message}`);

      // Fallback to local documentation list
      try {
        logger.info('Attempting fallback to local documentation list');
        const localDocs = this.getLocalDocumentationList();
        res.json(localDocs);
      } catch (fallbackError) {
        logger.error(`Fallback to local documentation list failed: ${fallbackError.message}`);
        res.status(500).json({
          error: 'Failed to fetch documentation list from GitHub and local fallback failed',
          details: error.message,
          githubError: true
        });
      }
    }
  }

  /**
 * Health check endpoint with GitHub connectivity status
 */
  async getStatus(req, res) {
    const status = {
      status: 'online',
      message: 'Flex Web Compiler server is running',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      github: {
        connected: false,
        repository: `${constants.GITHUB_OWNER}/${constants.GITHUB_REPO}`,
        branch: constants.GITHUB_BRANCH,
        authenticated: !!constants.GITHUB_TOKEN,
        rateLimit: constants.GITHUB_TOKEN ? '5,000 requests/hour' : '60 requests/hour',
        lastCheck: new Date().toISOString()
      }
    };

    // Test GitHub connectivity
    try {
      const testUrl = `${constants.GITHUB_API_BASE}/repos/${constants.GITHUB_OWNER}/${constants.GITHUB_REPO}`;
      const response = await this.fetchFromGitHub(testUrl);
      status.github.connected = true;
      status.github.message = constants.GITHUB_TOKEN
        ? 'GitHub API accessible (authenticated)'
        : 'GitHub API accessible (unauthenticated)';
      logger.debug('GitHub connectivity test passed');
    } catch (error) {
      status.github.connected = false;
      status.github.message = `GitHub API error: ${error.message}`;
      logger.warn(`GitHub connectivity test failed: ${error.message}`);
    }

    res.json(status);
  }

  /**
   * Fetch content from GitHub API
   */
  async fetchFromGitHub(url) {
    return new Promise((resolve, reject) => {
      const headers = {
        'User-Agent': 'Flex-Web-Compiler',
        'Accept': 'application/vnd.github.v3+json'
      };

      // Add authorization header if GitHub token is available
      if (constants.GITHUB_TOKEN) {
        headers['Authorization'] = `token ${constants.GITHUB_TOKEN}`;
        logger.debug('Using GitHub API token for authenticated request');
      } else {
        logger.debug('Using unauthenticated GitHub API request (60/hour limit)');
      }

      const request = https.get(url, { headers }, (response) => {
        let data = '';

        response.on('data', (chunk) => {
          data += chunk;
        });

        response.on('end', () => {
          try {
            if (response.statusCode === 200) {
              const jsonData = JSON.parse(data);
              resolve(jsonData);
            } else {
              reject(new Error(`GitHub API returned status ${response.statusCode}: ${data}`));
            }
          } catch (parseError) {
            reject(new Error(`Failed to parse GitHub API response: ${parseError.message}`));
          }
        });
      });

      request.on('error', (error) => {
        reject(new Error(`GitHub API request failed: ${error.message}`));
      });

      request.setTimeout(10000, () => {
        request.abort();
        reject(new Error('GitHub API request timeout'));
      });
    });
  }

  /**
   * Fetch raw content from GitHub
   */
  async fetchRawContent(url) {
    return new Promise((resolve, reject) => {
      const request = https.get(url, {
        headers: {
          'User-Agent': 'Flex-Web-Compiler'
        }
      }, (response) => {
        let data = '';

        response.on('data', (chunk) => {
          data += chunk;
        });

        response.on('end', () => {
          if (response.statusCode === 200) {
            resolve(data);
          } else {
            reject(new Error(`GitHub raw content returned status ${response.statusCode}`));
          }
        });
      });

      request.on('error', (error) => {
        reject(new Error(`GitHub raw content request failed: ${error.message}`));
      });

      request.setTimeout(10000, () => {
        request.abort();
        reject(new Error('GitHub raw content request timeout'));
      });
    });
  }

  /**
   * Fallback: Get local examples (if GitHub is unavailable)
   */
  getLocalExamples() {
    const examples = [];

    if (!fs.existsSync(constants.EXAMPLES_DIR)) {
      logger.warn(`Local examples directory not found: ${constants.EXAMPLES_DIR}`);
      return examples;
    }

    const files = fs.readdirSync(constants.EXAMPLES_DIR);

    files.forEach(file => {
      if (file.endsWith('.lx')) {
        const filePath = path.join(constants.EXAMPLES_DIR, file);

        try {
          const content = fs.readFileSync(filePath, 'utf8');
          const lines = content.split('\n');
          const title = lines[0].startsWith('//')
            ? lines[0].substring(2).trim()
            : file.replace('.lx', '');

          examples.push({
            id: file.replace('.lx', ''),
            title: title,
            filename: file,
            content: content,
            source: 'local_fallback'
          });
        } catch (fileError) {
          logger.error(`Error reading local example file ${file}: ${fileError.message}`);
        }
      }
    });

    return examples;
  }

  /**
   * Fallback: Get local documentation (if GitHub is unavailable)
   */
  getLocalDocumentation(docName) {
    const docPath = path.join(constants.DOCS_DIR, `${docName}.md`);

    if (!fs.existsSync(docPath)) {
      throw new Error('Documentation not found locally');
    }

    return fs.readFileSync(docPath, 'utf8');
  }

  /**
   * Fallback: Get local documentation list (if GitHub is unavailable)
   */
  getLocalDocumentationList() {
    const docs = [];

    if (!fs.existsSync(constants.DOCS_DIR)) {
      logger.warn(`Local documentation directory not found: ${constants.DOCS_DIR}`);
      return docs;
    }

    const files = fs.readdirSync(constants.DOCS_DIR);

    files.forEach(file => {
      if (file.endsWith('.md')) {
        const filePath = path.join(constants.DOCS_DIR, file);

        try {
          const content = fs.readFileSync(filePath, 'utf8');
          const lines = content.split('\n');

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
            filename: file,
            source: 'local_fallback'
          });
        } catch (fileError) {
          logger.error(`Error reading local documentation file ${file}: ${fileError.message}`);
        }
      }
    });

    return docs;
  }
}

module.exports = new ContentController(); 