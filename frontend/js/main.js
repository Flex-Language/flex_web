// Wait for the DOM to load
document.addEventListener('DOMContentLoaded', function() {
    // Initialize CodeMirror editor
    const editor = CodeMirror.fromTextArea(document.getElementById('code-editor'), {
        mode: 'flex',
        theme: 'dracula',
        lineNumbers: true,
        indentUnit: 4,
        matchBrackets: true,
        autoCloseBrackets: true,
        tabSize: 4,
        indentWithTabs: false,
        extraKeys: {
            'Tab': function(cm) {
                cm.replaceSelection('    ', 'end');
            },
            'Ctrl-S': function(cm) {
                saveToLocalStorage('flex_code', cm.getValue());
                showToast('Code saved to browser storage');
            },
            'Ctrl-Enter': function(cm) {
                document.getElementById('run-button').click();
            }
        }
    });

    // Input handling variables - New Addition
    let inputQueue = [];
    let awaitingInput = false;
    let programRunning = false;
    let executionId = null;
    let executionState = 'idle'; // Possible states: 'idle', 'running', 'completed', 'error', 'stopped'

    // Preload examples and documentation
    console.log('Preloading examples and documentation...');
    // Preload examples in background
    fetch('/api/examples')
        .then(response => response.json())
        .then(examples => {
            console.log('Successfully preloaded examples:', examples.length);
            window.preloadedExamples = examples;
        })
        .catch(error => {
            console.error('Error preloading examples:', error);
        });
    
    // Preload README documentation
    fetch('/api/docs/README')
        .then(response => response.json())
        .then(data => {
            console.log('Successfully preloaded README');
            window.preloadedDocs = window.preloadedDocs || {};
            window.preloadedDocs['README'] = data.content;
        })
        .catch(error => {
            console.error('Error preloading README:', error);
        });

    // Check for code in URL hash (shared code)
    if (window.location.hash) {
        try {
            const decodedCode = decodeURIComponent(window.location.hash.substring(1));
            if (decodedCode) {
                editor.setValue(decodedCode);
                showToast('Code loaded from shared URL');
            }
        } catch (e) {
            console.error('Error loading shared code:', e);
        }
    } else {
        // Load from local storage or use default
        const savedCode = localStorage.getItem('flex_code');
        if (savedCode) {
            editor.setValue(savedCode);
        } else {
            // Default code example
            const defaultCode = `// Welcome to Flex Online Compiler
// Try running this sample code:

rakm x = 10
y = 20
z = x + y

print("Sum of {x} and {y} is {z}")

for (i = 0; i < 5; i++) {
    print("Loop iteration: {i}")
}`;
            editor.setValue(defaultCode);
        }
    }

    // Add a toast container to the body
    const toastContainer = document.createElement('div');
    toastContainer.className = 'toast-container position-fixed bottom-0 end-0 p-3';
    toastContainer.id = 'toast-container';
    document.body.appendChild(toastContainer);

    // Add a share button to the toolbar
    const toolbar = document.querySelector('.editor-card .card-header .btn-group');
    const shareButton = document.createElement('button');
    shareButton.id = 'share-button';
    shareButton.className = 'btn btn-info';
    shareButton.innerHTML = '<i class="bi bi-share"></i> Share';
    shareButton.addEventListener('click', function() {
        const code = editor.getValue();
        const url = `${window.location.origin}${window.location.pathname}#${encodeURIComponent(code)}`;
        
        // Copy to clipboard
        navigator.clipboard.writeText(url).then(function() {
            showToast('Share link copied to clipboard!');
        }, function(err) {
            console.error('Could not copy URL: ', err);
            showToast('Error creating share link.', 'error');
        });
    });
    toolbar.appendChild(shareButton);

    // Set up navigation between pages
    const navLinks = document.querySelectorAll('.nav-link');
    const pages = document.querySelectorAll('.page');

    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Get the page to show from data attribute
            const pageToShow = this.getAttribute('data-page');
            
            // Remove active class from all links and add to clicked link
            navLinks.forEach(link => link.classList.remove('active'));
            this.classList.add('active');
            
            // Hide all pages and show the selected page
            pages.forEach(page => page.classList.remove('active'));
            document.getElementById(`${pageToShow}-page`).classList.add('active');
            
            // If we're switching to examples page, load examples if not already loaded
            if (pageToShow === 'examples' && !document.querySelector('.example-card')) {
                loadExamples();
            }
            
            // If we're switching to documentation page, load README by default if not already loaded
            if (pageToShow === 'documentation' && !document.querySelector('#doc-content').innerHTML) {
                loadDocumentation('README');
            }
        });
    });

    // Initialize WebSocket for real-time communication - New Addition
    let socket = null;
    
    // Function to setup WebSocket connection
    function setupWebSocket() {
        // Use secure WebSocket if the page is served over HTTPS
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}/ws`;
        
        console.log(`Setting up WebSocket connection to ${wsUrl}`);
        
        // Close existing socket if it exists
        if (socket) {
            try {
                socket.close();
            } catch (e) {
                console.error('Error closing existing socket:', e);
            }
        }
        
        // Clear any existing ping interval
        if (window.pingInterval) {
            clearInterval(window.pingInterval);
        }
        
        // Clear any input polling interval
        if (window.inputPollInterval) {
            clearInterval(window.inputPollInterval);
        }
        
        // Track connection attempts to prevent flooding the output with reconnection messages
        if (!window.wsReconnectCount) {
            window.wsReconnectCount = 0;
        }
        
        socket = new WebSocket(wsUrl);
        
        socket.onopen = function() {
            console.log('WebSocket connection established');
            
            // Only show connection message on first connect or after multiple failed attempts
            if (window.wsReconnectCount === 0 || window.wsReconnectCount > 2) {
                // Add connection message to output only if it's not a background reconnect
                if (!window.silentReconnect) {
                    appendToOutput('<div class="system-message websocket-status">WebSocket connected</div>');
                }
            }
            
            // Reset reconnect count on successful connection
            window.wsReconnectCount = 0;
            window.silentReconnect = false;
            
            // Set up heartbeat ping
            window.pingInterval = setInterval(() => {
                if (socket && socket.readyState === WebSocket.OPEN) {
                    try {
                        socket.send(JSON.stringify({ 
                            type: 'ping', 
                            timestamp: Date.now() 
                        }));
                        console.log('Ping sent to server');
                    } catch (e) {
                        console.error('Error sending ping:', e);
                    }
                }
            }, 25000); // Ping every 25 seconds (server checks every 30s)
            
            // If there's an active execution or we need to check status, handle it
            if (window.checkExecutionOnReconnect && window.lastExecutionId) {
                console.log(`Checking status of execution ${window.lastExecutionId} after reconnect`);
                socket.send(JSON.stringify({ 
                    type: 'check_execution_status', 
                    executionId: window.lastExecutionId 
                }));
                
                // Reset the check flag
                window.checkExecutionOnReconnect = false;
            }
            else if (executionId && programRunning) {
                console.log(`Re-registering execution ${executionId} with new WebSocket connection`);
                socket.send(JSON.stringify({ 
                    type: 'register_execution', 
                    executionId: executionId 
                }));
                
                // If we were waiting for input, re-check status
                if (awaitingInput) {
                    updateInputStatus(true);
                }
            }
        };
        
        socket.onmessage = function(event) {
            console.log('WebSocket message received:', event.data);
            
            try {
                const data = JSON.parse(event.data);
                
                if (data.type === 'input_request') {
                    console.log('Input request received', data);
                    
                    // Clear any error messages about connection issues when input is requested
                    const errorMessages = document.querySelectorAll('.alert-danger');
                    errorMessages.forEach(msg => {
                        if (msg.textContent.includes('connecting to server') || 
                            msg.textContent.includes('timed out')) {
                            msg.remove();
                        }
                    });
                    
                    // Set the current execution ID
                    executionId = data.executionId;
                    
                    // Register as client for this execution
                    if (socket && socket.readyState === WebSocket.OPEN) {
                        socket.send(JSON.stringify({
                            type: 'register',
                            executionId: executionId
                        }));
                        console.log(`Registered as client for execution ${executionId}`);
                    }
                    
                    // Update the input status
                    awaitingInput = true;
                    updateInputStatus(true, data.prompt || 'Input required for scan() function');
                    
                    // Add toast notification for input request
                    showToast('Input Required', 'The program is waiting for input from scan() function', 'info');
                    
                    // Focus the input field after a small delay to ensure it's visible
                    setTimeout(() => {
                        const inputField = document.getElementById('input-field');
                        if (inputField) {
                            inputField.focus();
                        }
                    }, 10);
                } else if (data.type === 'input_processed') {
                    console.log('Input processed acknowledgment received', data);
                    
                    // Clear input waiting state
                    awaitingInput = false;
                    updateInputStatus(false);
                    
                    // Show processing notification
                    appendToOutput('<div class="system-message">Input processed, continuing execution...</div>');
                    
                    // Clear input field
                    document.getElementById('input-field').value = '';
                } else if (data.type === 'execution_complete') {
                    console.log('Execution complete notification received');
                    programRunning = false;
                    awaitingInput = false;
                    updateInputStatus(false);
                    
                    // Update execution state
                    executionState = 'completed';
                    
                    // Reset the run button text back to "Run"
                    document.getElementById('run-button').innerHTML = '<i class="bi bi-play-fill"></i> Run';
                    
                    // Remove highlight from input area
                    document.querySelector('.input-container').classList.remove('highlight');
                    
                    // Clear any safety timeout
                    if (window.executionSafetyTimeout) {
                        clearTimeout(window.executionSafetyTimeout);
                    }
                    
                    // Clean up WebSocket status messages after successful execution
                    cleanupWebSocketMessages();
                    
                    // Clean up any error messages
                    const outputArea = document.getElementById('output-area');
                    const errorMsgs = outputArea.querySelectorAll('.alert-danger, #execution-error-message');
                    if (errorMsgs.length > 0) {
                        // Remove any error messages about connection issues or timeouts
                        errorMsgs.forEach(msg => {
                            if (msg.textContent.includes('connecting to server') || 
                                msg.textContent.includes('timed out')) {
                                msg.remove();
                            }
                        });
                    }
                    
                    // Add completion message
                    appendToOutput('<div class="execution-complete">Execution completed</div>');
                } else if (data.type === 'execution_error') {
                    console.log('Execution error notification received:', data.content);
                    programRunning = false;
                    awaitingInput = false;
                    updateInputStatus(false);
                    
                    // Update execution state
                    executionState = 'error';
                    
                    // Reset the run button text back to "Run"
                    document.getElementById('run-button').innerHTML = '<i class="bi bi-play-fill"></i> Run';
                    
                    // Remove highlight from input area
                    document.querySelector('.input-container').classList.remove('highlight');
                    
                    // Clear any safety timeout
                    if (window.executionSafetyTimeout) {
                        clearTimeout(window.executionSafetyTimeout);
                    }
                    
                    // Add error message
                    appendToOutput(`<div class="output-error">Execution error: ${data.content || 'Unknown error'}</div>`);
                } else if (data.type === 'execution_status') {
                    // Handle execution status updates
                    console.log('Execution status update received:', data);
                    
                    // Clear any error message if execution is still running or completed successfully
                    const errorMsg = document.getElementById('execution-error-message');
                    if (errorMsg && (data.status === 'running' || data.status === 'completed')) {
                        console.log('Clearing error message due to execution status update');
                        errorMsg.remove();
                    }
                    
                    if (data.status === 'running') {
                        programRunning = true;
                        executionState = 'running';
                        document.getElementById('run-button').innerHTML = '<i class="bi bi-stop-fill"></i> Stop';
                    } else if (data.status === 'completed' || data.status === 'error' || data.status === 'stopped') {
                        programRunning = false;
                        executionState = data.status;
                        document.getElementById('run-button').innerHTML = '<i class="bi bi-play-fill"></i> Run';
                        
                        // Clean up any error messages if execution completed successfully
                        if (data.status === 'completed') {
                            // Replace any error messages about execution status with completion message
                            const outputArea = document.getElementById('output-area');
                            const errorMsgs = outputArea.querySelectorAll('.alert-danger');
                            if (errorMsgs.length > 0) {
                                // If there are error messages, replace the last one with a success message
                                errorMsgs.forEach(msg => {
                                    if (msg.textContent.includes('connecting to server') || 
                                        msg.textContent.includes('timed out')) {
                                        msg.remove();
                                    }
                                });
                            }
                            
                            // Add status message if not already shown
                            if (!document.querySelector('.execution-complete:last-child')) {
                                appendToOutput('<div class="execution-complete">Execution completed</div>');
                            }
                        }
                    }
                } else if (data.type === 'output') {
                    // Check for both data and content fields
                    const outputContent = data.data || data.content;
                    if (outputContent) {
                        appendToOutput(outputContent);
                    }
                } else if (data.type === 'error') {
                    appendToOutput(`<span class="output-error">${data.content}</span>`);
                    
                    // If this is an execution-related error, reset the execution state
                    if (data.content && (
                        data.content.includes('execution') || 
                        data.content.includes('program') || 
                        data.content.includes('process'))
                    ) {
                        console.log('Execution error detected, resetting UI state');
                        programRunning = false;
                        awaitingInput = false;
                        updateInputStatus(false);
                        
                        // Update execution state
                        executionState = 'error';
                        
                        // Reset the run button text back to "Run"
                        document.getElementById('run-button').innerHTML = '<i class="bi bi-play-fill"></i> Run';
                        
                        // Clear any safety timeout
                        if (window.executionSafetyTimeout) {
                            clearTimeout(window.executionSafetyTimeout);
                        }
                    }
                }
            } catch (e) {
                console.error('Error parsing WebSocket message:', e);
            }
        };
        
        socket.onclose = function() {
            console.log('WebSocket connection closed');
            
            // Clear ping interval
            if (window.pingInterval) {
                clearInterval(window.pingInterval);
                window.pingInterval = null;
            }
            
            // Increment reconnect counter
            window.wsReconnectCount = (window.wsReconnectCount || 0) + 1;
            
            // Store execution state before reconnect
            if (programRunning && executionState === 'running') {
                // Save the current execution ID to check on reconnect
                window.lastExecutionId = executionId;
                window.checkExecutionOnReconnect = true;
                
                // Add a message to the output area - only show once
                if (window.wsReconnectCount <= 1) {
                    appendToOutput('<div class="output-error websocket-error">WebSocket connection lost. Will check execution status on reconnect...</div>');
                }
            } else if (programRunning) {
                // If we were in any other state, reset completely
                programRunning = false;
                awaitingInput = false;
                updateInputStatus(false);
                executionState = 'stopped';
                
                // Reset the run button back to "Run"
                document.getElementById('run-button').innerHTML = '<i class="bi bi-play-fill"></i> Run';
                
                // Add a message to the output area - only show once
                if (window.wsReconnectCount <= 1) {
                    appendToOutput('<div class="output-error websocket-error">WebSocket connection lost. Execution may have been interrupted.</div>');
                }
            }
            
            // For frequent reconnects, don't spam the console or output
            const reconnectDelay = Math.min(3000 * Math.pow(1.5, Math.min(window.wsReconnectCount - 1, 5)), 30000);
            
            // Switch to HTTP polling mechanism for input if WebSocket is unreliable
            if (window.wsReconnectCount >= 2) {
                console.log('WebSocket connection unreliable, switching to HTTP polling for input');
                appendToOutput('<div class="info-message">Switched to HTTP polling: Using alternative connection method.</div>');
                
                // Set up polling for input status via HTTP
                if (!window.inputPollInterval) {
                    window.inputPollInterval = setInterval(() => {
                        if (programRunning && executionId) {
                            // Poll server for input status
                            console.log('Polling for input status via HTTP');
                            fetch('/api/input-status')
                                .then(response => response.json())
                                .then(data => {
                                    if (data.waitingExecutions && data.waitingExecutions.length > 0) {
                                        // Check if our execution is waiting for input
                                        const ourExecution = data.waitingExecutions.find(
                                            exec => exec.id === executionId
                                        );
                                        
                                        if (ourExecution && !awaitingInput) {
                                            console.log('Detected execution waiting for input via HTTP poll');
                                            // Update UI to show input is needed
                                            awaitingInput = true;
                                            updateInputStatus(true, 'Input required (HTTP polling)');
                                            appendToOutput('<div class="input-notification"><strong>⚠️ Input required for scan() function</strong> - please enter a value below</div>');
                                        }
                                    }
                                })
                                .catch(error => {
                                    console.error('Error polling input status:', error);
                                });
                        }
                    }, 2000); // Poll every 2 seconds
                }
            }
            
            // If we've tried to reconnect multiple times, show a more subtle message
            if (window.wsReconnectCount > 3 && window.wsReconnectCount % 3 === 0) {
                console.log(`Multiple reconnection attempts (${window.wsReconnectCount}). Will continue trying in background.`);
                
                // Remove any existing connection status messages to avoid clutter
                document.querySelectorAll('.websocket-status, .websocket-error').forEach(el => {
                    // Keep only the most recent message
                    if (el !== document.querySelector('.websocket-error:last-child') && 
                        el !== document.querySelector('.websocket-status:last-child')) {
                        el.remove();
                    }
                });
                
                // Add a subtle message about reconnection attempts
                appendToOutput(`<div class="system-message websocket-status">Attempting to reconnect... (try ${window.wsReconnectCount})</div>`);
            }
            
            // For subsequent reconnects, don't show messages in the output
            if (window.wsReconnectCount > 1) {
                window.silentReconnect = true;
            }
            
            // Add connection issues message
            appendToOutput('<div class="warning-message">Connection issues detected. Switched to fallback connection mode.</div>');
            
            // Try to reconnect after a delay
            setTimeout(setupWebSocket, reconnectDelay);
        };
        
        socket.onerror = function(error) {
            console.error('WebSocket error:', error);
        };
    }
    
    // Try to setup WebSocket initially
    setupWebSocket();

    // Run button functionality - Updated for input handling
    document.getElementById('run-button').addEventListener('click', function() {
        const code = editor.getValue();
        const outputArea = document.getElementById('output-area');
        
        // Stop execution if a program is already running
        if (programRunning) {
            if (socket && socket.readyState === WebSocket.OPEN) {
                socket.send(JSON.stringify({ type: 'stop_execution', executionId }));
            }
            
            programRunning = false;
            awaitingInput = false;
            updateInputStatus(false);
            
            // Update execution state
            executionState = 'stopped';
            
            // Clear any safety timeout
            if (window.executionSafetyTimeout) {
                clearTimeout(window.executionSafetyTimeout);
            }
            
            outputArea.innerHTML += '<div class="output-error">Execution stopped</div>';
            
            // Reset the run button text back to "Run"
            document.getElementById('run-button').innerHTML = '<i class="bi bi-play-fill"></i> Run';
            
            return;
        }
        
        // Save code to local storage
        saveToLocalStorage('flex_code', code);
        
        // Reset execution state
        executionState = 'idle';
        executionId = null;
        
        // Clear previous output and reset state
        outputArea.innerHTML = '<div class="spinner-border text-primary" role="status"><span class="visually-hidden">Loading...</span></div>';
        inputQueue = [];
        updateInputQueue();
        
        // Send code to the backend for execution
        fetch('/api/execute', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ code }),
        })
        .then(response => {
            if (!response.ok) {
                return response.json().then(err => {
                    throw new Error(err.error || `Server responded with status ${response.status}`);
                });
            }
            return response.json();
        })
        .then(data => {
            if (data.error) {
                outputArea.innerHTML = `<span class="output-error">${data.error}</span>`;
                if (data.stderr) {
                    outputArea.innerHTML += `<br><pre class="output-error">${data.stderr}</pre>`;
                }
            } else {
                // Always clear the spinner
                outputArea.innerHTML = '';
                
                if (data.output) {
                    // Format the output nicely
                    try {
                        // Ensure we have a string we can split
                        const outputStr = typeof data.output === 'string' ? 
                            data.output : 
                            (Array.isArray(data.output) ? data.output.join('\n') : String(data.output));
                            
                        const lines = outputStr.split('\n');
                        for (const line of lines) {
                            const lineElement = document.createElement('div');
                            lineElement.textContent = line;
                            outputArea.appendChild(lineElement);
                        }
                    } catch (error) {
                        console.error('Error processing output:', error);
                        outputArea.innerHTML = `<div class="output-error">Error processing output: ${error.message}</div>`;
                        if (data.output) {
                            outputArea.innerHTML += `<div class="mt-2">Raw output: ${JSON.stringify(data.output)}</div>`;
                        }
                    }
                } else {
                    outputArea.innerHTML = '<span class="text-muted">No output</span>';
                }
                
                if (data.stderr && data.stderr.trim()) {
                    const errorElement = document.createElement('div');
                    errorElement.className = 'output-error mt-3';
                    errorElement.innerHTML = `<strong>Errors:</strong><pre>${data.stderr}</pre>`;
                    outputArea.appendChild(errorElement);
                }
                
                // Start long-polling or use WebSocket for input handling if needed
                if (data.executionId) {
                    executionId = data.executionId;
                    
                    // Check if the execution is already completed
                    if (data.status === 'completed') {
                        programRunning = false;
                        executionState = 'completed';
                        
                        // Reset the run button text back to "Run"
                        document.getElementById('run-button').innerHTML = '<i class="bi bi-play-fill"></i> Run';
                        
                        // Add completion message
                        appendToOutput('<div class="execution-complete">Execution completed</div>');
                    } else {
                        programRunning = true;
                        executionState = 'running';
                        console.log(`Execution started with ID: ${executionId}`);
                        
                        // Ensure the run button text changes to "Stop"
                        document.getElementById('run-button').innerHTML = '<i class="bi bi-stop-fill"></i> Stop';
                        
                        // Set a safety timeout in case execution hangs without notification
                        if (window.executionSafetyTimeout) {
                            clearTimeout(window.executionSafetyTimeout);
                        }
                        
                        window.executionSafetyTimeout = setTimeout(() => {
                            // Only reset if we're still showing running for this execution
                            if (programRunning && executionId) {
                                console.log(`Safety timeout triggered for execution ${executionId}. Resetting UI state.`);
                                
                                programRunning = false;
                                awaitingInput = false;
                                updateInputStatus(false);
                                
                                // Reset the run button text back to "Run"
                                document.getElementById('run-button').innerHTML = '<i class="bi bi-play-fill"></i> Run';
                                
                                // Add timeout message
                                appendToOutput('<div class="output-error">Execution may have timed out. No response received for 5 minutes.</div>');
                            }
                        }, 300000); // 5 minute timeout
                        
                        // If WebSocket is available, register this execution
                        if (socket && socket.readyState === WebSocket.OPEN) {
                            console.log(`Registering execution ${executionId} with WebSocket`);
                            socket.send(JSON.stringify({ 
                                type: 'register_execution', 
                                executionId: data.executionId 
                            }));
                        } else {
                            console.error('WebSocket not connected, cannot register execution');
                            appendToOutput('<div class="output-error">WebSocket not connected. Input handling may not work properly.</div>');
                            // Try to reconnect
                            setupWebSocket();
                        }
                    }
                } else {
                    // If no executionId is returned, the execution was handled synchronously and is now complete
                    programRunning = false;
                    executionState = 'completed';
                    
                    // Ensure the run button stays as "Run"
                    document.getElementById('run-button').innerHTML = '<i class="bi bi-play-fill"></i> Run';
                    
                    // Add completion message
                    appendToOutput('<div class="execution-complete">Execution completed</div>');
                }
            }
        })
        .catch(error => {
            console.error('Error connecting to server:', error);
            
            // Remove the spinner
            document.getElementById('output-area').innerHTML = '';
            
            // Check if there's a timeout error but execution might still be running
            if (error.message && error.message.includes('timed out')) {
                // Create a wrapper div with a special ID so we can update it later
                const errorMessage = `<div id="execution-error-message" class="alert alert-danger">
                    <strong>Error connecting to server:</strong> ${error.message || 'Unknown error'}
                    <hr>
                    <small>Checking execution status... The program might still be running.</small>
                </div>`;
                
                document.getElementById('output-area').innerHTML = errorMessage;
                
                // Try to check execution status via WebSocket if available
                if (socket && socket.readyState === WebSocket.OPEN && executionId) {
                    console.log(`Checking execution status for ${executionId} after error`);
                    socket.send(JSON.stringify({ 
                        type: 'check_execution_status', 
                        executionId: executionId 
                    }));
                }
            } else {
                // Show regular error message
                const errorMessage = `<div class="alert alert-danger">
                    <strong>Error connecting to server:</strong> ${error.message || 'Unknown error'}
                    <hr>
                    <small>If this issue persists, please refresh the page or contact support.</small>
                </div>`;
                
                document.getElementById('output-area').innerHTML = errorMessage;
            }
            
            // Re-enable run button
            document.getElementById('run-button').innerHTML = '<i class="bi bi-play-fill"></i> Run';
            programRunning = false;
            awaitingInput = false;
            updateInputStatus(false);
        });
        
        // If we're starting a new execution, reset input status checks
        if (!programRunning) {
            setupInputStatusCheck();
        }
    });

    // Input handling functions - New Addition
    document.getElementById('send-input-button').addEventListener('click', function() {
        const inputField = document.getElementById('input-field');
        const inputValue = inputField.value.trim();
        
        if (inputValue) {
            if (awaitingInput) {
                sendInputToServer(inputValue);
                awaitingInput = false;
                updateInputStatus(false);
            } else {
                // Add to queue
                inputQueue.push(inputValue);
                updateInputQueue();
            }
            
            // Clear the input field
            inputField.value = '';
        }
    });
    
    // Also handle Enter key in input field
    document.getElementById('input-field').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            document.getElementById('send-input-button').click();
        }
    });
    
    // Function to send input to the server
    function sendInputToServer(input) {
        // Make sure we have an execution ID
        if (!executionId) {
            console.error('Cannot send input: No active execution ID');
            appendToOutput('<div class="output-error">Error: Cannot send input - no active execution</div>');
            return;
        }

        // Add the input to the output area so user can see what was entered
        appendToOutput(`<strong>></strong> ${input}`);
        
        // Show a temporary processing message
        const processingMsg = appendToOutput('<div class="system-message processing-message">Processing input...</div>');
        
        // Track if the input was acknowledged
        let inputAcknowledged = false;
        
        // Set a timeout to detect if the input isn't acknowledged
        const inputTimeout = setTimeout(() => {
            if (!inputAcknowledged) {
                console.error('Input acknowledgment timeout');
                document.querySelectorAll('.processing-message').forEach(el => el.remove());
                appendToOutput('<div class="output-error">Input processing timeout. The server may be busy or unresponsive.</div>');
                
                // Reset waiting status
                awaitingInput = false;
                updateInputStatus(false);
                
                // Reset execution state and button if this is a severe timeout
                programRunning = false;
                document.getElementById('run-button').innerHTML = '<i class="bi bi-play-fill"></i> Run';
                
                // Attempt to reconnect WebSocket
                if (socket) {
                    try {
                        socket.close();
                    } catch (e) {
                        console.error('Error closing socket:', e);
                    }
                }
                setupWebSocket();
            }
        }, 10000); // 10 second timeout
        
        // Prepare listener for input_processed message
        const inputProcessedListener = function(event) {
            try {
                const data = JSON.parse(event.data);
                if (data.type === 'input_processed') {
                    inputAcknowledged = true;
                    clearTimeout(inputTimeout);
                    document.querySelectorAll('.processing-message').forEach(el => el.remove());
                    
                    // Remove this listener after processing
                    if (socket) {
                        socket.removeEventListener('message', inputProcessedListener);
                    }
                }
            } catch (e) {
                console.error('Error in input processed listener:', e);
            }
        };
        
        // Add temp listener for input_processed event
        if (socket) {
            socket.addEventListener('message', inputProcessedListener);
        }
        
        // Send via WebSocket if available
        if (socket && socket.readyState === WebSocket.OPEN) {
            try {
                socket.send(JSON.stringify({
                    type: 'input',
                    executionId,
                    content: input
                }));
                console.log(`Input sent via WebSocket for execution ${executionId}`);
            } catch (error) {
                console.error('Error sending input via WebSocket:', error);
                // Fall back to AJAX
                sendInputViaHttp(input);
            }
        } else {
            console.log('WebSocket not available, falling back to HTTP');
            // Fallback to AJAX if WebSocket is not available
            sendInputViaHttp(input);
        }
        
        // Reset input field
        document.getElementById('input-field').value = '';
    }
    
    // Function to send input via HTTP fallback
    function sendInputViaHttp(input) {
        console.log(`Sending input via HTTP for execution ${executionId}`);
        
        fetch('/api/input', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
                executionId,
                input 
            })
        })
        .then(response => {
            if (!response.ok) {
                return response.json().then(data => {
                    throw new Error(data.error || `Server responded with status ${response.status}`);
                });
            }
            return response.json();
        })
        .then(data => {
            if (data.status === 'success') {
                console.log('Input processed successfully via HTTP');
                appendToOutput('<div class="system-message">Input sent successfully via HTTP</div>');
                
                // Clear waiting status
                awaitingInput = false;
                updateInputStatus(false);
            } else {
                throw new Error(data.error || 'Unknown error');
            }
        })
        .catch(error => {
            console.error('Error sending input via HTTP:', error);
            appendToOutput(`<div class="output-error">Failed to send input: ${error.message}</div>`);
        });
    }
    
    // Function to update the input queue display
    function updateInputQueue() {
        const queueElement = document.getElementById('input-queue');
        queueElement.innerHTML = '';
        
        if (inputQueue.length === 0) {
            return;
        }
        
        // Add each queued input to the display
        inputQueue.forEach((input, index) => {
            const itemElement = document.createElement('div');
            itemElement.className = 'input-queue-item';
            itemElement.innerHTML = `
                <span>${index + 1}. ${input}</span>
                <button class="remove-input" data-index="${index}">×</button>
            `;
            queueElement.appendChild(itemElement);
        });
        
        // Add event listeners to remove buttons
        document.querySelectorAll('.remove-input').forEach(button => {
            button.addEventListener('click', function() {
                const index = parseInt(this.getAttribute('data-index'));
                inputQueue.splice(index, 1);
                updateInputQueue();
            });
        });
    }
    
    // Function to update the input status display
    function updateInputStatus(waiting, prompt = '') {
        const statusElement = document.getElementById('input-status');
        const inputContainer = document.querySelector('.input-container');
        const inputField = document.getElementById('input-field');
        
        if (waiting) {
            statusElement.textContent = prompt;
            statusElement.classList.add('waiting');
            
            // Make input field more noticeable
            inputContainer.classList.add('highlight');
            
            // Focus the input field
            inputField.focus();
            
            // Scroll to input area
            inputContainer.scrollIntoView({ behavior: 'smooth', block: 'center' });
            
            // Add a visual indicator to the page title
            document.title = '⚠️ Input Needed - Flex Online Compiler';
        } else {
            statusElement.textContent = 'Not waiting for input';
            statusElement.classList.remove('waiting');
            
            // Reset input field appearance
            inputContainer.classList.remove('highlight');
            
            // Reset title
            document.title = 'Flex Online Compiler';
        }
    }
    
    // Function to append text to the output area
    function appendToOutput(text) {
        const outputArea = document.getElementById('output-area');
        
        // Check if this is a WebSocket status message
        if (text.includes('class="websocket-status"')) {
            // Limit the number of WebSocket status messages
            const existingMessages = outputArea.querySelectorAll('.websocket-status');
            
            // If we already have multiple status messages, remove older ones
            if (existingMessages.length >= 2) {
                // Keep only the most recent message
                for (let i = 0; i < existingMessages.length - 1; i++) {
                    existingMessages[i].remove();
                }
            }
        }
        
        const lineElement = document.createElement('div');
        lineElement.innerHTML = text;
        outputArea.appendChild(lineElement);
        
        // Scroll to the bottom
        outputArea.scrollTop = outputArea.scrollHeight;
        
        return lineElement;
    }

    // Clear button functionality
    document.getElementById('clear-button').addEventListener('click', function() {
        editor.setValue('');
    });

    // Clear output button functionality
    document.getElementById('clear-output-button').addEventListener('click', function() {
        document.getElementById('output-area').innerHTML = '';
        
        // Reset WebSocket connection counters when clearing output
        window.wsReconnectCount = 0;
        window.silentReconnect = false;
    });

    // Save button functionality
    document.getElementById('save-button').addEventListener('click', function() {
        const code = editor.getValue();
        const blob = new Blob([code], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = 'flex_code.lx';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    });

    // Keyboard shortcuts panel functionality - New Implementation
    const shortcutsLink = document.getElementById('shortcuts-link');
    const shortcutsPanel = document.getElementById('shortcuts-panel');
    const shortcutsClose = document.getElementById('shortcuts-close');
    
    shortcutsLink.addEventListener('click', function(e) {
        e.preventDefault();
        shortcutsPanel.classList.toggle('show');
    });
    
    shortcutsClose.addEventListener('click', function() {
        shortcutsPanel.classList.remove('show');
    });
    
    // Close shortcuts panel when clicking outside of it
    document.addEventListener('click', function(event) {
        if (!shortcutsPanel.contains(event.target) && 
            !shortcutsLink.contains(event.target) && 
            shortcutsPanel.classList.contains('show')) {
            shortcutsPanel.classList.remove('show');
        }
    });

    // Function to load examples
    function loadExamples() {
        const examplesContainer = document.getElementById('examples-container');
        
        // Show loading indicator
        examplesContainer.innerHTML = '<div class="spinner-border text-primary" role="status"><span class="visually-hidden">Loading...</span></div>';
        
        // Use preloaded examples if available
        if (window.preloadedExamples) {
            console.log('Using preloaded examples');
            displayExamples(window.preloadedExamples);
            return;
        }
        
        // Fetch examples from the server if not preloaded
        console.log('Fetching examples from server');
        fetch('/api/examples')
            .then(response => response.json())
            .then(examples => {
                displayExamples(examples);
            })
            .catch(error => {
                examplesContainer.innerHTML = `<div class="alert alert-danger">Error loading examples: ${error.message}</div>`;
            });
    }
    
    // Function to display examples
    function displayExamples(examples) {
        const examplesContainer = document.getElementById('examples-container');
        examplesContainer.innerHTML = '';
        
        // Create a card for each example
        examples.forEach(example => {
            const col = document.createElement('div');
            col.className = 'col-md-4 mb-4';
            
            const card = document.createElement('div');
            card.className = 'card example-card';
            
            const cardBody = document.createElement('div');
            cardBody.className = 'card-body';
            
            const title = document.createElement('h5');
            title.className = 'card-title';
            title.textContent = example.title || example.id || 'Untitled';
            
            const preview = document.createElement('div');
            preview.className = 'example-preview mb-3';
            // Show first few lines of the content
            const previewLines = example.content.split('\n').slice(0, 10).join('\n');
            preview.textContent = previewLines + (example.content.split('\n').length > 10 ? '\n...' : '');
            
            const button = document.createElement('button');
            button.className = 'btn btn-primary';
            button.textContent = 'Load Example';
            button.addEventListener('click', function() {
                // Set the editor content to this example
                editor.setValue(example.content);
                
                // Show toast notification
                showToast('Example Loaded', `${example.title || example.id} has been loaded into the editor`, 'success');
                
                // Switch to the compiler page
                document.querySelector('[data-page="compiler"]').click();
            });
            
            cardBody.appendChild(title);
            cardBody.appendChild(preview);
            cardBody.appendChild(button);
            card.appendChild(cardBody);
            col.appendChild(card);
            examplesContainer.appendChild(col);
        });
        
        if (examples.length === 0) {
            examplesContainer.innerHTML = '<div class="alert alert-info">No examples available</div>';
        }
    }

    // Function to load documentation
    function loadDocumentation(docFile) {
        const docContent = document.getElementById('doc-content');
        const docTitle = document.getElementById('doc-title');
        
        // Set active doc link
        document.querySelectorAll('.doc-link').forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('data-doc') === docFile) {
                link.classList.add('active');
            }
        });
        
        // Update title based on documentation type
        switch (docFile) {
            case 'README':
                docTitle.textContent = 'Getting Started';
                break;
            case 'QUICK_REFERENCE':
                docTitle.textContent = 'Quick Reference';
                break;
            case 'TUTORIAL':
                docTitle.textContent = 'Tutorial';
                break;
            case 'DOCUMENTATION':
                docTitle.textContent = 'Full Documentation';
                break;
            default:
                docTitle.textContent = docFile;
        }
        
        // Show loading indicator
        docContent.innerHTML = '<div class="spinner-border text-primary" role="status"><span class="visually-hidden">Loading...</span></div>';
        
        // Use preloaded documentation if available
        if (window.preloadedDocs && window.preloadedDocs[docFile]) {
            console.log('Using preloaded documentation:', docFile);
            docContent.innerHTML = marked.parse(window.preloadedDocs[docFile]);
            return;
        }
        
        // Fetch documentation from the server if not preloaded
        console.log('Fetching documentation from server:', docFile);
        fetch(`/api/docs/${docFile}`)
            .then(response => response.json())
            .then(data => {
                // Store for future quick access
                window.preloadedDocs = window.preloadedDocs || {};
                window.preloadedDocs[docFile] = data.content;
                
                // Parse and display the markdown content
                docContent.innerHTML = marked.parse(data.content);
            })
            .catch(error => {
                docContent.innerHTML = `<div class="alert alert-danger">Error loading documentation: ${error.message}</div>`;
            });
    }

    // Set up documentation links
    const docLinks = document.querySelectorAll('.doc-link');
    docLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Get the doc file from data attribute
            const docFile = this.getAttribute('data-doc');
            
            // Remove active class from all links and add to clicked link
            docLinks.forEach(link => link.classList.remove('active'));
            this.classList.add('active');
            
            // Load the documentation
            loadDocumentation(docFile);
        });
    });

    // Function to save to local storage with error handling
    function saveToLocalStorage(key, value) {
        try {
            localStorage.setItem(key, value);
            return true;
        } catch (e) {
            console.error('Error saving to localStorage:', e);
            return false;
        }
    }

    // Function to show toast notifications
    function showToast(title, message, type = 'success') {
        const toastId = `toast-${Date.now()}`;
        const toastHtml = `
            <div class="toast align-items-center text-white bg-${type === 'success' ? 'success' : 'danger'}" role="alert" aria-live="assertive" aria-atomic="true" id="${toastId}">
                <div class="d-flex">
                    <div class="toast-body">
                        <strong>${title}</strong><br>${message}
                    </div>
                    <button type="button" class="btn-close me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
                </div>
            </div>
        `;
        
        const container = document.getElementById('toast-container');
        container.insertAdjacentHTML('beforeend', toastHtml);
        
        const toastElement = document.getElementById(toastId);
        const toast = new bootstrap.Toast(toastElement, { autohide: true, delay: 3000 });
        toast.show();
        
        // Remove toast from DOM after it's hidden
        toastElement.addEventListener('hidden.bs.toast', function() {
            toastElement.remove();
        });
    }

    // Load documentation and examples in the background when the page loads
    setTimeout(() => {
        // Preload examples
        if (!document.querySelector('.example-card')) {
            loadExamples();
        }
        
        // Preload documentation
        if (!document.querySelector('#doc-content').innerHTML) {
            loadDocumentation('README');
        }
    }, 1000);

    // Function to check for input status periodically
    function setupInputStatusCheck() {
        // Clear any existing interval
        if (window.inputStatusInterval) {
            clearInterval(window.inputStatusInterval);
        }
        
        // Set up interval to check if any execution is waiting for input
        window.inputStatusInterval = setInterval(() => {
            if (programRunning && executionId) {
                // Only check if we're not already waiting for input
                if (!awaitingInput) {
                    fetch('/api/input-status')
                        .then(response => response.json())
                        .then(data => {
                            if (data.waitingExecutions && data.waitingExecutions.length > 0) {
                                // Check if our execution is waiting for input
                                const ourExecution = data.waitingExecutions.find(
                                    exec => exec.id === executionId
                                );
                                
                                if (ourExecution) {
                                    console.log('Detected execution waiting for input via status check');
                                    
                                    // Update UI to show input is needed
                                    awaitingInput = true;
                                    updateInputStatus(true);
                                    
                                    // Force highlight
                                    document.querySelector('.input-container').classList.add('highlight');
                                    
                                    // Add notification
                                    appendToOutput('<div class="input-notification"><strong>⚠️ Input required (detected via status check)</strong> - please enter a value below</div>');
                                    
                                    // Register our client with this execution if needed
                                    if (socket && socket.readyState === WebSocket.OPEN) {
                                        socket.send(JSON.stringify({ 
                                            type: 'register_execution', 
                                            executionId: executionId 
                                        }));
                                    }
                                }
                            }
                        })
                        .catch(error => {
                            console.error('Error checking input status:', error);
                        });
                }
            }
        }, 5000); // Check every 5 seconds
    }

    // Function to clean up WebSocket status messages
    function cleanupWebSocketMessages() {
        // Remove all WebSocket status messages except the most recent one
        const statusMessages = document.querySelectorAll('.websocket-status');
        if (statusMessages.length > 1) {
            // Keep only the most recent message if needed
            for (let i = 0; i < statusMessages.length - 1; i++) {
                statusMessages[i].remove();
            }
            
            // If we have a successful connection, remove all status messages
            if (socket && socket.readyState === WebSocket.OPEN) {
                statusMessages[statusMessages.length - 1].remove();
            }
        }
        
        // Also clean up error messages if connection is restored
        if (socket && socket.readyState === WebSocket.OPEN) {
            document.querySelectorAll('.websocket-error').forEach(el => el.remove());
        }
    }
    
    // Call this function to start checking
    setupInputStatusCheck();
}); 