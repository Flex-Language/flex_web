// Custom startup script for the Flex web compiler

// Load the server module
const server = require('./server');

// Prevent the server from using interactive test input
process.env.TEST_FILE = '/var/wwww/Flex/flex_web/backend/server_init.lx';
process.env.NO_INTERACTIVE = 'true';

console.log('Starting Flex web compiler with non-interactive mode');
