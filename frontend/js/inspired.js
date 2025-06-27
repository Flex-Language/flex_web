// Inspired Design JavaScript - Clean & Professional

class FlexCompiler {
    constructor() {
        this.ws = null;
        this.editor = null;
        this.currentExecutionId = null;
        this.isWaitingForInput = false;

        this.init();
    }

    init() {
        this.initCodeMirror();
        this.initWebSocket();
        this.initEventListeners();
        this.updateConnectionStatus('connecting');
    }

    initCodeMirror() {
        const textarea = document.getElementById('code-editor');
        this.editor = CodeMirror.fromTextArea(textarea, {
            mode: 'flex',
            theme: 'dracula',
            lineNumbers: true,
            matchBrackets: true,
            indentUnit: 4,
            tabSize: 4,
            lineWrapping: true,
            autofocus: true,
            extraKeys: {
                'Ctrl-Enter': () => this.runCode(),
                'Ctrl-S': (cm) => {
                    this.saveCode();
                    return false;
                },
                'Tab': (cm) => {
                    if (cm.getSelection()) {
                        cm.indentSelection('add');
                    } else {
                        cm.replaceSelection('    ');
                    }
                }
            }
        });

        // Focus the editor
        setTimeout(() => {
            this.editor.focus();
        }, 100);
    }

    initWebSocket() {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}`;

        this.ws = new WebSocket(wsUrl);

        this.ws.onopen = () => {
            console.log('WebSocket connected');
            this.updateConnectionStatus('connected');
            this.addOutputMessage('🔗 WebSocket connected', 'info');
        };

        this.ws.onmessage = (event) => {
            this.handleWebSocketMessage(event);
        };

        this.ws.onclose = () => {
            console.log('WebSocket disconnected');
            this.updateConnectionStatus('disconnected');
            this.addOutputMessage('❌ WebSocket disconnected', 'error');

            // Try to reconnect after 3 seconds
            setTimeout(() => {
                this.initWebSocket();
            }, 3000);
        };

        this.ws.onerror = (error) => {
            console.error('WebSocket error:', error);
            this.updateConnectionStatus('error');
            this.addOutputMessage('⚠️ WebSocket error', 'error');
        };
    }

    initEventListeners() {
        // Run button
        document.getElementById('run-btn').addEventListener('click', () => {
            this.runCode();
        });

        // Clear button
        document.getElementById('clear-btn').addEventListener('click', () => {
            this.clearCode();
        });

        // Save button
        document.getElementById('save-btn').addEventListener('click', () => {
            this.saveCode();
        });

        // Clear output button
        document.getElementById('clear-output-btn').addEventListener('click', () => {
            this.clearOutput();
        });

        // Send input button
        document.getElementById('send-input-btn').addEventListener('click', () => {
            this.sendInput();
        });

        // Input field enter key
        document.getElementById('input-field').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.sendInput();
            }
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === 'Enter') {
                e.preventDefault();
                this.runCode();
            } else if (e.ctrlKey && e.key === 's') {
                e.preventDefault();
                this.saveCode();
            }
        });
    }

    runCode() {
        const code = this.editor.getValue().trim();

        if (!code) {
            this.addOutputMessage('⚠️ No code to execute', 'error');
            return;
        }

        if (this.ws.readyState !== WebSocket.OPEN) {
            this.addOutputMessage('❌ WebSocket not connected', 'error');
            return;
        }

        // Update UI
        this.updateExecutionStatus('running');
        this.clearOutput();
        this.addOutputMessage('🚀 Executing code...', 'info');

        // Send code to server
        this.ws.send(JSON.stringify({
            type: 'execute',
            code: code
        }));
    }

    clearCode() {
        this.editor.setValue('// Welcome to Flex Online Compiler\n// Write your Flex code here\n\n');
        this.editor.focus();
    }

    saveCode() {
        const code = this.editor.getValue();
        const blob = new Blob([code], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = 'flex_code.lx';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        this.addOutputMessage('💾 Code saved to flex_code.lx', 'success');
    }

    clearOutput() {
        const outputArea = document.getElementById('output-area');
        outputArea.innerHTML = '<div class="welcome-message"><span class="welcome-icon">🔗</span><span class="welcome-text">WebSocket connected</span></div>';
    }

    sendInput() {
        const inputField = document.getElementById('input-field');
        const input = inputField.value.trim();

        if (!input || !this.isWaitingForInput) {
            return;
        }

        // Send input to server
        this.ws.send(JSON.stringify({
            type: 'input',
            content: input,
            executionId: this.currentExecutionId
        }));

        // Update UI
        this.addOutputMessage(`> ${input}`, 'input');
        inputField.value = '';
        this.setInputWaiting(false);
    }

    handleWebSocketMessage(event) {
        try {
            const data = JSON.parse(event.data);

            switch (data.type) {
                case 'connected':
                    this.updateConnectionStatus('connected');
                    break;

                case 'output':
                    this.addOutputMessage(data.data || data.content, 'output');
                    break;

                case 'error':
                    this.addOutputMessage(data.content || data.error, 'error');
                    break;

                case 'execution_complete':
                    this.updateExecutionStatus('idle');
                    this.addOutputMessage('✅ Execution completed', 'success');
                    break;

                case 'input_request':
                    this.currentExecutionId = data.executionId;
                    this.setInputWaiting(true);
                    this.addOutputMessage('⏳ Waiting for input...', 'info');
                    break;

                case 'execution_started':
                    this.currentExecutionId = data.executionId;
                    this.updateExecutionStatus('running');
                    break;

                case 'execution_error':
                    this.updateExecutionStatus('error');
                    this.addOutputMessage(`❌ ${data.error || 'Execution failed'}`, 'error');
                    break;

                default:
                    console.log('Unknown message type:', data.type);
            }
        } catch (error) {
            console.error('Error parsing WebSocket message:', error);
        }
    }

    addOutputMessage(message, type = 'output') {
        const outputArea = document.getElementById('output-area');
        const messageElement = document.createElement('div');
        messageElement.className = `output-line ${type}`;

        // Handle different message types
        if (type === 'error') {
            messageElement.style.color = 'var(--red)';
        } else if (type === 'success') {
            messageElement.style.color = 'var(--green)';
        } else if (type === 'info') {
            messageElement.style.color = 'var(--text-accent)';
        } else if (type === 'input') {
            messageElement.style.color = 'var(--orange)';
            messageElement.style.fontWeight = 'bold';
        }

        messageElement.textContent = message;
        outputArea.appendChild(messageElement);

        // Auto-scroll to bottom
        outputArea.scrollTop = outputArea.scrollHeight;
    }

    updateConnectionStatus(status) {
        const statusDot = document.getElementById('status-dot');
        const statusText = document.getElementById('status-text');

        switch (status) {
            case 'connected':
                statusDot.style.backgroundColor = 'var(--green)';
                statusDot.style.boxShadow = '0 0 6px var(--green)';
                statusText.textContent = 'Connected';
                break;

            case 'connecting':
                statusDot.style.backgroundColor = 'var(--orange)';
                statusDot.style.boxShadow = '0 0 6px var(--orange)';
                statusText.textContent = 'Connecting...';
                break;

            case 'disconnected':
            case 'error':
                statusDot.style.backgroundColor = 'var(--red)';
                statusDot.style.boxShadow = '0 0 6px var(--red)';
                statusText.textContent = 'Disconnected';
                break;
        }
    }

    updateExecutionStatus(status) {
        const executionStatus = document.getElementById('execution-status');

        switch (status) {
            case 'running':
                executionStatus.textContent = 'Running';
                executionStatus.style.backgroundColor = 'var(--orange)';
                executionStatus.style.color = 'white';
                break;

            case 'idle':
                executionStatus.textContent = 'Idle';
                executionStatus.style.backgroundColor = 'var(--bg-tertiary)';
                executionStatus.style.color = 'var(--text-secondary)';
                break;

            case 'error':
                executionStatus.textContent = 'Error';
                executionStatus.style.backgroundColor = 'var(--red)';
                executionStatus.style.color = 'white';
                break;
        }
    }

    setInputWaiting(waiting) {
        this.isWaitingForInput = waiting;
        const inputField = document.getElementById('input-field');
        const sendButton = document.getElementById('send-input-btn');
        const inputStatus = document.getElementById('input-status');

        if (waiting) {
            inputField.disabled = false;
            sendButton.disabled = false;
            inputStatus.textContent = 'Waiting for input';
            inputStatus.style.color = 'var(--orange)';
            inputField.placeholder = 'Enter input for scan()';
            inputField.focus();
        } else {
            inputField.disabled = true;
            sendButton.disabled = true;
            inputStatus.textContent = 'Not waiting for input';
            inputStatus.style.color = 'var(--text-muted)';
            inputField.placeholder = 'Enter input...';
        }
    }
}

// Initialize the application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.flexCompiler = new FlexCompiler();
});

// Add some utility functions for potential future use
window.FlexUtils = {
    formatTime: (timestamp) => {
        return new Date(timestamp).toLocaleTimeString();
    },

    escapeHtml: (text) => {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },

    copyToClipboard: (text) => {
        navigator.clipboard.writeText(text).then(() => {
            console.log('Copied to clipboard');
        }).catch(err => {
            console.error('Failed to copy to clipboard:', err);
        });
    }
}; 