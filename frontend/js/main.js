// Wait for the DOM to load
document.addEventListener('DOMContentLoaded', function () {
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
            'Tab': function (cm) {
                cm.replaceSelection('    ', 'end');
            },
            'Ctrl-S': function (cm) {
                saveToLocalStorage('flex_code', cm.getValue());
                showToast('Code saved to browser storage');
            },
            'Ctrl-Enter': function (cm) {
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
    let websocketOutputReceived = false; // Track if we received output via WebSocket

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

    // Global keyboard shortcut handler to prevent unwanted browser behavior
    document.addEventListener('keydown', function (e) {
        // Handle Ctrl+S to prevent browser save dialog
        if (e.ctrlKey && e.key === 's') {
            // Only prevent default if the editor has focus or if no specific input is focused
            const activeElement = document.activeElement;
            const isInputFocused = activeElement && (
                activeElement.tagName === 'INPUT' ||
                activeElement.tagName === 'TEXTAREA' ||
                activeElement.contentEditable === 'true'
            );

            // If it's our code editor area or no input is focused, let CodeMirror handle it
            if (!isInputFocused || activeElement.closest('.CodeMirror')) {
                e.preventDefault();
                console.log('Prevented Ctrl+S browser save dialog');
                return false;
            }
        }

        // Handle other potentially problematic shortcuts
        if (e.ctrlKey) {
            switch (e.key) {
                case 'Enter':
                    // Let CodeMirror handle Ctrl+Enter for run
                    if (document.activeElement && document.activeElement.closest('.CodeMirror')) {
                        e.preventDefault();
                        return false;
                    }
                    break;
            }
        }
    });

    // Add a share button to the toolbar
    const toolbar = document.querySelector('.editor-card .card-header .btn-group');
    const shareButton = document.createElement('button');
    shareButton.id = 'share-button';
    shareButton.className = 'btn btn-info';
    shareButton.innerHTML = '<i class="bi bi-share"></i> Share';
    shareButton.addEventListener('click', function () {
        const code = editor.getValue();
        const url = `${window.location.origin}${window.location.pathname}#${encodeURIComponent(code)}`;

        // Copy to clipboard
        navigator.clipboard.writeText(url).then(function () {
            showToast('Share link copied to clipboard!');
        }, function (err) {
            console.error('Could not copy URL: ', err);
            showToast('Error creating share link.', 'error');
        });
    });
    toolbar.appendChild(shareButton);

    // Set up navigation between pages
    const navLinks = document.querySelectorAll('.nav-link[data-page]'); // Only select nav links with data-page attribute
    const pages = document.querySelectorAll('.page');

    // Function to navigate to a specific page
    function navigateToPage(pageToShow, clickedElement = null) {
        // Remove active class from all nav links
        navLinks.forEach(link => link.classList.remove('active'));

        // Add active class to the appropriate nav link (not the clicked element if it's the brand)
        if (clickedElement && clickedElement.getAttribute('data-page')) {
            clickedElement.classList.add('active');
        } else {
            // If navigating via brand or programmatically, find and activate the appropriate nav link
            const targetNavLink = document.querySelector(`[data-page="${pageToShow}"]`);
            if (targetNavLink) {
                targetNavLink.classList.add('active');
            }
        }

        // Hide all pages and show the selected page
        pages.forEach(page => page.classList.remove('active'));
        document.getElementById(`${pageToShow}-page`).classList.add('active');

        // If we're switching to examples page, load examples if not already loaded
        if (pageToShow === 'examples' && !document.querySelector('.example-card')) {
            loadExamples();
        }

        // If we're switching to documentation page, load documentation list from GitHub if not already loaded
        if (pageToShow === 'documentation' && !document.querySelector('#documentation-links .doc-link')) {
            loadDocumentationList();
        }
    }

    navLinks.forEach(link => {
        link.addEventListener('click', function (e) {
            e.preventDefault();

            // Get the page to show from data attribute
            const pageToShow = this.getAttribute('data-page');
            navigateToPage(pageToShow, this);
        });
    });

    // Make the navbar brand clickable to go to compiler page
    const navbarBrand = document.querySelector('.navbar-brand');
    if (navbarBrand) {
        navbarBrand.addEventListener('click', function (e) {
            e.preventDefault();
            console.log('Navbar brand clicked - navigating to compiler page');
            navigateToPage('compiler');
        });

        // Add a subtle visual hint that it's clickable
        navbarBrand.style.cursor = 'pointer';
    }

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

        socket.onopen = function () {
            console.log('WebSocket connection established');

            // Connection successful - no need to show status messages to avoid output clutter
            // WebSocket is working in the background

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
            else if (window.pendingExecutionId) {
                console.log(`Registering pending execution ${window.pendingExecutionId} with new WebSocket connection`);
                executionId = window.pendingExecutionId;
                socket.send(JSON.stringify({
                    type: 'register_execution',
                    executionId: window.pendingExecutionId
                }));

                // Clear the pending ID
                window.pendingExecutionId = null;
                programRunning = true;
                executionState = 'running';
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

        socket.onmessage = function (event) {
            console.log('WebSocket message received:', event.data);

            try {
                const data = JSON.parse(event.data);

                if (data.type === 'input_request') {
                    console.log('Input request received', data);

                    // Prevent duplicate input requests for the same execution
                    if (awaitingInput && executionId === data.executionId) {
                        console.log('Already waiting for input for this execution, ignoring duplicate request');
                        return;
                    }

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
                            type: 'register_execution',
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

                    // Input processed - continue silently without cluttering output

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

                    // Execution completed - no need to show completion message to avoid clutter
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

                            // Execution completed silently - no status message needed
                        }
                    }
                } else if (data.type === 'registration_confirmed') {
                    console.log('Registration confirmed for execution:', data.executionId);
                    // Don't show connection status messages to avoid spam
                    // The registration is working in the background
                } else if (data.type === 'output') {
                    // Check for both data and content fields
                    const outputContent = data.data || data.content;
                    if (outputContent) {
                        console.log('Appending output:', outputContent, 'from execution:', data.executionId);
                        appendToOutput(outputContent);
                        // Mark that we received output via WebSocket
                        websocketOutputReceived = true;
                    } else {
                        console.warn('Received output message with no content:', data);
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

        socket.onclose = function () {
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

        socket.onerror = function (error) {
            console.error('WebSocket error:', error);
        };
    }

    // Try to setup WebSocket initially
    setupWebSocket();

    // Run button functionality - Updated for input handling
    document.getElementById('run-button').addEventListener('click', function () {
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
        websocketOutputReceived = false; // Reset WebSocket output tracking

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
                    // Clear the spinner but preserve any existing output from WebSocket
                    const spinner = outputArea.querySelector('.spinner-border');
                    if (spinner) {
                        spinner.remove();
                    }

                    // Only show HTTP output if this was a synchronous execution (no WebSocket involved)
                    // or if the output area is still empty
                    const hasExistingOutput = outputArea.children.length > 0 &&
                        !outputArea.querySelector('.spinner-border');

                    if (data.output && !hasExistingOutput && !websocketOutputReceived) {
                        // This is likely a synchronous execution, show the output
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
                            appendToOutput(`<div class="output-error">Error processing output: ${error.message}</div>`);
                            if (data.output) {
                                appendToOutput(`<div class="mt-2">Raw output: ${JSON.stringify(data.output)}</div>`);
                            }
                        }
                    } else if (data.output && (hasExistingOutput || websocketOutputReceived)) {
                        // WebSocket already handled the output, don't duplicate it
                        console.log('Skipping final HTTP output - already displayed via WebSocket');
                    } else if (!data.output && !hasExistingOutput) {
                        // No output from either source
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

                            // Execution completed silently
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

                            // If WebSocket is available, register this execution immediately
                            if (socket && socket.readyState === WebSocket.OPEN) {
                                console.log(`Registering execution ${executionId} with WebSocket`);

                                // Register execution with WebSocket
                                socket.send(JSON.stringify({
                                    type: 'register_execution',
                                    executionId: data.executionId
                                }));
                                console.log(`Registered execution ${data.executionId} with WebSocket`);

                                // Send one retry after short delay to ensure delivery
                                setTimeout(() => {
                                    if (socket && socket.readyState === WebSocket.OPEN) {
                                        socket.send(JSON.stringify({
                                            type: 'register_execution',
                                            executionId: data.executionId,
                                            retry: true
                                        }));
                                    }
                                }, 100);
                            } else {
                                console.error('WebSocket not connected, cannot register execution');
                                appendToOutput('<div class="output-error">WebSocket not connected. Input handling may not work properly.</div>');
                                // Try to reconnect and register when connected
                                setupWebSocket();
                                window.pendingExecutionId = data.executionId;
                            }
                        }
                    } else {
                        // If no executionId is returned, the execution was handled synchronously and is now complete
                        programRunning = false;
                        executionState = 'completed';

                        // Ensure the run button stays as "Run"
                        document.getElementById('run-button').innerHTML = '<i class="bi bi-play-fill"></i> Run';

                        // Execution completed silently
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
    document.getElementById('send-input-button').addEventListener('click', function () {
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
    document.getElementById('input-field').addEventListener('keypress', function (e) {
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
        const inputProcessedListener = function (event) {
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
                    // Input sent successfully - no need to show system message

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
            button.addEventListener('click', function () {
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
    document.getElementById('clear-button').addEventListener('click', function () {
        editor.setValue('');
    });

    // Clear output button functionality
    document.getElementById('clear-output-button').addEventListener('click', function () {
        document.getElementById('output-area').innerHTML = '';

        // Reset WebSocket connection counters when clearing output
        window.wsReconnectCount = 0;
        window.silentReconnect = false;
    });

    // Save button functionality
    document.getElementById('save-button').addEventListener('click', function () {
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

    if (shortcutsLink && shortcutsPanel) {
        // Add multiple event listeners to ensure we catch all possible triggers
        ['click', 'touchstart'].forEach(eventType => {
            shortcutsLink.addEventListener(eventType, function (e) {
                e.preventDefault();
                e.stopPropagation();
                e.stopImmediatePropagation();

                console.log('Shortcuts panel toggled - prevented default navigation');
                shortcutsPanel.classList.toggle('show');
                return false;
            }, { passive: false });
        });
    } else {
        console.error('Shortcuts elements not found:', { shortcutsLink, shortcutsPanel });
    }

    if (shortcutsClose) {
        shortcutsClose.addEventListener('click', function (e) {
            e.preventDefault();
            e.stopPropagation();
            shortcutsPanel.classList.remove('show');
        });
    }

    // Close shortcuts panel when clicking outside of it
    document.addEventListener('click', function (event) {
        if (!shortcutsPanel.contains(event.target) &&
            !shortcutsLink.contains(event.target) &&
            shortcutsPanel.classList.contains('show')) {
            shortcutsPanel.classList.remove('show');
        }
    });

    // Function to load examples
    window.loadExamples = function loadExamples() {
        const examplesContainer = document.getElementById('examples-container');

        // Show loading indicator with GitHub indicator
        examplesContainer.innerHTML = `
            <div class="d-flex flex-column align-items-center">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Loading...</span>
                </div>
                <small class="text-muted mt-2">
                    <i class="bi bi-github"></i> Streaming live from GitHub repository...
                </small>
            </div>
        `;

        // Use preloaded examples if available
        if (window.preloadedExamples) {
            console.log('Using preloaded examples from GitHub streaming');
            displayExamples(window.preloadedExamples);
            return;
        }

        // Fetch examples from the server (GitHub streaming)
        console.log('Fetching examples from GitHub via real-time streaming');
        fetch('/api/examples')
            .then(response => {
                if (!response.ok) {
                    throw new Error(`GitHub streaming failed: ${response.status} ${response.statusText}`);
                }
                return response.json();
            })
            .then(examples => {
                console.log(`Successfully loaded ${examples.length} examples from GitHub`);
                displayExamples(examples);
                // Show success indicator briefly
                showToast('GitHub Content Loaded', `${examples.length} examples streamed from GitHub repository`, 'success');
            })
            .catch(error => {
                console.error('GitHub streaming error:', error);
                examplesContainer.innerHTML = `
                    <div class="alert alert-danger">
                        <i class="bi bi-exclamation-triangle"></i>
                        <strong>GitHub Streaming Error:</strong> ${error.message}
                        <br><small>Unable to fetch examples from GitHub repository in real-time.</small>
                        <button class="btn btn-sm btn-outline-danger mt-2 retry-examples-btn">
                            <i class="bi bi-arrow-clockwise"></i> Retry GitHub Connection
                        </button>
                    </div>
                `;

                // Add event listener for retry button
                const retryBtn = examplesContainer.querySelector('.retry-examples-btn');
                if (retryBtn) {
                    retryBtn.addEventListener('click', function (e) {
                        e.preventDefault();
                        console.log('Retrying examples load from GitHub');
                        loadExamples();
                    });
                }
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
            button.addEventListener('click', function () {
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

    // Function to load documentation list from GitHub
    window.loadDocumentationList = function loadDocumentationList() {
        const docLinksContainer = document.getElementById('documentation-links');

        console.log('Fetching documentation list from GitHub via real-time streaming');

        fetch('/api/docs')
            .then(response => {
                if (!response.ok) {
                    throw new Error(`GitHub streaming failed: ${response.status} ${response.statusText}`);
                }
                return response.json();
            })
            .then(docs => {
                console.log(`Successfully loaded ${docs.length} documentation files from GitHub`);
                displayDocumentationList(docs);

                // Load the first document by default if available
                if (docs.length > 0) {
                    loadDocumentation(docs[0].id);
                }

                // Show success indicator
                showToast('Documentation List Loaded', `${docs.length} documentation files streamed from GitHub`, 'success');
            })
            .catch(error => {
                console.error('GitHub documentation list streaming error:', error);
                docLinksContainer.innerHTML = `
                    <div class="alert alert-danger m-2">
                        <i class="bi bi-exclamation-triangle"></i>
                        <strong>GitHub Streaming Error:</strong> ${error.message}
                        <br><small>Unable to fetch documentation list from GitHub repository.</small>
                        <button class="btn btn-sm btn-outline-danger mt-2 retry-doclist-btn">
                            <i class="bi bi-arrow-clockwise"></i> Retry GitHub Connection
                        </button>
                    </div>
                `;

                // Add event listener for retry button
                const retryBtn = docLinksContainer.querySelector('.retry-doclist-btn');
                if (retryBtn) {
                    retryBtn.addEventListener('click', function (e) {
                        e.preventDefault();
                        console.log('Retrying documentation list load from GitHub');
                        loadDocumentationList();
                    });
                }
            });
    }

    // Function to display documentation navigation list
    function displayDocumentationList(docs) {
        const docLinksContainer = document.getElementById('documentation-links');
        docLinksContainer.innerHTML = '';

        if (docs.length === 0) {
            docLinksContainer.innerHTML = `
                <div class="alert alert-info m-2">
                    <i class="bi bi-info-circle"></i>
                    No documentation files found in GitHub repository.
                </div>
            `;
            return;
        }

        // Create navigation links for each documentation file
        docs.forEach((doc, index) => {
            const linkElement = document.createElement('a');
            linkElement.href = '#';
            linkElement.className = 'list-group-item list-group-item-action doc-link';
            linkElement.setAttribute('data-doc', doc.id);

            // Use the title from GitHub or fallback to filename
            const displayTitle = doc.title || doc.id.replace(/[-_]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

            linkElement.innerHTML = `
                <span>${displayTitle}</span>
            `;

            // Add click event listener
            linkElement.addEventListener('click', function (e) {
                e.preventDefault();

                // Remove active class from all links and add to clicked link
                document.querySelectorAll('.doc-link').forEach(link => link.classList.remove('active'));
                this.classList.add('active');

                // Load the documentation
                loadDocumentation(doc.id);
            });

            // Make first item active by default
            if (index === 0) {
                linkElement.classList.add('active');
            }

            docLinksContainer.appendChild(linkElement);
        });

        console.log(`Created ${docs.length} dynamic documentation navigation links`);
    }

    // Function to load documentation
    window.loadDocumentation = function loadDocumentation(docFile) {
        const docContent = document.getElementById('doc-content');
        const docTitle = document.getElementById('doc-title');

        // Set active doc link
        document.querySelectorAll('.doc-link').forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('data-doc') === docFile) {
                link.classList.add('active');
            }
        });

        // Use the filename as title, with proper formatting
        const titleText = docFile.replace(/[-_]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        docTitle.innerHTML = `${titleText} <small class="text-muted"><i class="bi bi-github"></i> Live from GitHub</small>`;

        // Show loading indicator with GitHub streaming info
        docContent.innerHTML = `
            <div class="d-flex flex-column align-items-center text-center p-4">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Loading...</span>
                </div>
                <p class="text-muted mt-3 mb-0">
                    <i class="bi bi-github"></i> Streaming ${docFile} from GitHub repository...
                </p>
                <small class="text-muted">Real-time content from Flex-Language/Flex_docs_examples</small>
            </div>
        `;

        // Use preloaded documentation if available
        if (window.preloadedDocs && window.preloadedDocs[docFile]) {
            console.log('Using preloaded documentation from GitHub streaming:', docFile);
            const parsedContent = marked.parse(window.preloadedDocs[docFile]);
            docContent.innerHTML = `
                <div class="alert alert-info alert-dismissible fade show">
                    <i class="bi bi-info-circle"></i>
                    Content loaded from GitHub cache. 
                    <button class="btn btn-sm btn-outline-primary ms-2 refresh-doc-btn" data-doc-file="${docFile}">
                        <i class="bi bi-arrow-clockwise"></i> Refresh from GitHub
                    </button>
                    <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
                </div>
                ${parsedContent}
            `;

            // Add event listener for the refresh button
            const refreshBtn = docContent.querySelector('.refresh-doc-btn');
            if (refreshBtn) {
                refreshBtn.addEventListener('click', function (e) {
                    e.preventDefault();
                    // Clear the cached version to force fresh load
                    if (window.preloadedDocs && window.preloadedDocs[docFile]) {
                        delete window.preloadedDocs[docFile];
                    }
                    console.log('Refreshing documentation from GitHub:', docFile);
                    loadDocumentation(docFile);
                });
            }
            return;
        }

        // Fetch documentation from the server (GitHub streaming)
        console.log('Fetching documentation from GitHub via real-time streaming:', docFile);
        fetch(`/api/docs/${docFile}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`GitHub streaming failed: ${response.status} ${response.statusText}`);
                }
                return response.json();
            })
            .then(data => {
                console.log(`Successfully loaded ${docFile} documentation from GitHub`);

                // Store for future quick access
                window.preloadedDocs = window.preloadedDocs || {};
                window.preloadedDocs[docFile] = data.content;

                // Parse and display the markdown content with GitHub metadata
                const parsedContent = marked.parse(data.content);
                const lastModified = data.lastModified ? new Date(data.lastModified).toLocaleString() : 'Unknown';

                docContent.innerHTML = `
                    <div class="alert alert-success alert-dismissible fade show">
                        <i class="bi bi-check-circle"></i>
                        Successfully streamed from GitHub repository
                        ${data.lastModified ? `<br><small>Last modified: ${lastModified}</small>` : ''}
                        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
                    </div>
                    ${parsedContent}
                `;

                // Show success notification
                showToast('Documentation Loaded', `${titleText} streamed live from GitHub`, 'success');
            })
            .catch(error => {
                console.error('GitHub documentation streaming error:', error);
                docContent.innerHTML = `
                    <div class="alert alert-danger">
                        <i class="bi bi-exclamation-triangle"></i>
                        <h5>GitHub Streaming Error</h5>
                        <p><strong>Failed to load ${titleText} from GitHub:</strong> ${error.message}</p>
                        <p class="mb-0">
                            <small>Unable to fetch documentation from GitHub repository in real-time.</small>
                        </p>
                        <div class="mt-3">
                            <button class="btn btn-outline-danger retry-doc-btn" data-doc-file="${docFile}">
                                <i class="bi bi-arrow-clockwise"></i> Retry GitHub Connection
                            </button>
                            <button class="btn btn-outline-secondary ms-2 github-link-btn">
                                <i class="bi bi-github"></i> View on GitHub
                            </button>
                        </div>
                    </div>
                `;

                // Add event listeners for the buttons
                const retryBtn = docContent.querySelector('.retry-doc-btn');
                const githubBtn = docContent.querySelector('.github-link-btn');

                if (retryBtn) {
                    retryBtn.addEventListener('click', function (e) {
                        e.preventDefault();
                        console.log('Retrying documentation load from GitHub:', docFile);
                        loadDocumentation(docFile);
                    });
                }

                if (githubBtn) {
                    githubBtn.addEventListener('click', function (e) {
                        e.preventDefault();
                        window.open('https://github.com/Flex-Language/Flex_docs_examples', '_blank');
                    });
                }
            });
    }

    // Documentation links are now set up dynamically in displayDocumentationList()

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
        // For input notifications, remove any existing ones first
        if (title === 'Input Required') {
            const existingInputToasts = document.querySelectorAll('.toast .toast-body:contains("Input Required")');
            existingInputToasts.forEach(toast => {
                const toastElement = toast.closest('.toast');
                if (toastElement) {
                    toastElement.remove();
                }
            });
        }

        const toastId = `toast-${Date.now()}`;
        const toastHtml = `
            <div class="toast align-items-center text-white bg-${type === 'success' ? 'success' : type === 'info' ? 'primary' : 'danger'}" role="alert" aria-live="assertive" aria-atomic="true" id="${toastId}">
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
        toastElement.addEventListener('hidden.bs.toast', function () {
            toastElement.remove();
        });
    }

    // Load examples in the background when the page loads
    // Documentation will be loaded automatically when the documentation page is accessed
    setTimeout(() => {
        // Preload examples
        if (!document.querySelector('.example-card')) {
            loadExamples();
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