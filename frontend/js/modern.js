/* Modern Flex Compiler JavaScript */

class ModernFlexCompiler {
    constructor() {
        this.editor = null;
        this.socket = null;
        this.currentExecutionId = null;
        this.isWaitingForInput = false;
        
        this.init();
    }

    init() {
        this.initializeEditor();
        this.initializeWebSocket();
        this.bindEvents();
        this.loadSavedCode();
        this.updateConnectionStatus('connecting');
        this.showWelcomeMessage();
    }

    initializeEditor() {
        const textarea = document.getElementById('code-editor');
        this.editor = CodeMirror.fromTextArea(textarea, {
            mode: 'flex',
            theme: 'dracula',
            lineNumbers: true,
            autoCloseBrackets: true,
            matchBrackets: true,
            indentUnit: 4,
            indentWithTabs: false,
            lineWrapping: true,
            foldGutter: true,
            gutters: ["CodeMirror-linenumber", "CodeMirror-foldgutter"],
            extraKeys: {
                "Ctrl-Enter": () => this.runCode(),
                "Ctrl-S": (e) => {
                    e.preventDefault();
                    this.saveCode();
                },
                "Tab": (cm) => {
                    if (cm.somethingSelected()) {
                        cm.indentSelection("add");
                    } else {
                        cm.replaceSelection("    ");
                    }
                }
            }
        });

        if (!this.editor.getValue().trim()) {
            this.editor.setValue(textarea.value);
        }
        this.editor.focus();
    }

    initializeWebSocket() {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = protocol + '//' + window.location.host;
        
        try {
            this.socket = new WebSocket(wsUrl);
            this.setupWebSocketHandlers();
        } catch (error) {
            console.error('Failed to create WebSocket connection:', error);
            this.updateConnectionStatus('disconnected');
        }
    }

    setupWebSocketHandlers() {
        this.socket.onopen = () => {
            console.log('WebSocket connected');
            this.updateConnectionStatus('connected');
            this.showConnectionToast();
        };

        this.socket.onclose = () => {
            console.log('WebSocket disconnected');
            this.updateConnectionStatus('disconnected');
        };

        this.socket.onerror = (error) => {
            console.error('WebSocket error:', error);
            this.updateConnectionStatus('disconnected');
        };

        this.socket.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                this.handleWebSocketMessage(data);
            } catch (error) {
                console.error('Error parsing WebSocket message:', error);
            }
        };
    }

    handleWebSocketMessage(data) {
        switch (data.type) {
            case 'connected':
                this.clientId = data.clientId;
                break;
            case 'output':
                this.appendOutput(data.data);
                break;
            case 'error':
                this.appendOutput(data.content, 'error');
                break;
            case 'input_request':
                this.handleInputRequest();
                break;
            case 'execution_complete':
                this.handleExecutionComplete(data);
                break;
            case 'execution_status':
                this.updateExecutionStatus(data.status);
                break;
        }
    }

    handleInputRequest() {
        this.isWaitingForInput = true;
        this.updateInputStatus('waiting');
        this.enableInputField();
        this.appendOutput('\n💬 Program is waiting for input...', 'info');
        
        const inputField = document.getElementById('input-field');
        inputField.focus();
    }

    handleExecutionComplete(data) {
        this.isWaitingForInput = false;
        this.updateInputStatus('idle');
        this.disableInputField();
        this.updateExecutionStatus(data.status === 'completed' ? 'completed' : 'error');
        
        if (data.status === 'completed') {
            this.appendOutput('\n✅ Execution completed successfully', 'success');
        } else {
            this.appendOutput('\n❌ Execution failed', 'error');
        }
    }

    async runCode() {
        const code = this.editor.getValue().trim();
        
        if (!code) {
            this.showNotification('Please enter some code to run', 'warning');
            return;
        }

        if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
            this.showNotification('WebSocket not connected. Please refresh the page.', 'error');
            return;
        }

        this.clearOutput();
        this.updateExecutionStatus('running');
        this.appendOutput('🚀 Starting execution...\n', 'info');

        try {
            const response = await fetch('/api/execute', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ code })
            });

            const result = await response.json();
            
            if (result.executionId) {
                this.currentExecutionId = result.executionId;
                
                this.socket.send(JSON.stringify({
                    type: 'register_execution',
                    executionId: result.executionId
                }));
            }

            if (!response.ok) {
                throw new Error(result.error || 'Execution failed');
            }

        } catch (error) {
            console.error('Execution error:', error);
            this.appendOutput('❌ Error: ' + error.message, 'error');
            this.updateExecutionStatus('error');
        }
    }

    sendInput() {
        const inputField = document.getElementById('input-field');
        const input = inputField.value.trim();
        
        if (!input || !this.isWaitingForInput) {
            return;
        }

        if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
            this.showNotification('WebSocket not connected', 'error');
            return;
        }

        this.socket.send(JSON.stringify({
            type: 'input',
            executionId: this.currentExecutionId,
            content: input
        }));

        this.appendOutput('📝 Input sent: ' + input, 'input');
        inputField.value = '';
        this.isWaitingForInput = false;
        this.updateInputStatus('processing');
        this.disableInputField();
    }

    updateConnectionStatus(status) {
        const indicator = document.getElementById('status-indicator');
        const text = document.getElementById('status-text');
        
        indicator.className = 'modern-status-indicator';
        
        switch (status) {
            case 'connected':
                indicator.classList.remove('disconnected');
                text.textContent = 'Connected';
                break;
            case 'disconnected':
                indicator.classList.add('disconnected');
                text.textContent = 'Disconnected';
                break;
            case 'connecting':
                text.textContent = 'Connecting...';
                break;
        }
    }

    updateExecutionStatus(status) {
        const badge = document.getElementById('execution-status');
        badge.className = 'modern-status-badge';
        
        switch (status) {
            case 'running':
                badge.classList.add('running');
                badge.textContent = 'Running';
                break;
            case 'completed':
                badge.textContent = 'Completed';
                break;
            case 'error':
                badge.classList.add('error');
                badge.textContent = 'Error';
                break;
            default:
                badge.textContent = 'Idle';
        }
    }

    updateInputStatus(status) {
        const statusElement = document.getElementById('input-status');
        statusElement.className = 'modern-input-status';
        
        switch (status) {
            case 'waiting':
                statusElement.classList.add('waiting');
                statusElement.textContent = 'Waiting for input';
                break;
            case 'processing':
                statusElement.textContent = 'Processing input...';
                break;
            default:
                statusElement.textContent = 'Not waiting for input';
        }
    }

    enableInputField() {
        const inputField = document.getElementById('input-field');
        const sendButton = document.getElementById('send-input-button');
        
        inputField.disabled = false;
        sendButton.disabled = false;
        inputField.focus();
    }

    disableInputField() {
        const inputField = document.getElementById('input-field');
        const sendButton = document.getElementById('send-input-button');
        
        inputField.disabled = true;
        sendButton.disabled = true;
    }

    appendOutput(text, type) {
        const outputArea = document.getElementById('output-area');
        
        const line = document.createElement('div');
        line.className = type || '';
        line.textContent = text;
        
        outputArea.appendChild(line);
        outputArea.scrollTop = outputArea.scrollHeight;
    }

    clearOutput() {
        const outputArea = document.getElementById('output-area');
        outputArea.innerHTML = '';
    }

    showConnectionToast() {
        const toast = document.getElementById('connection-toast');
        if (toast) {
            toast.style.display = 'flex';
            setTimeout(() => {
                toast.style.display = 'none';
            }, 3000);
        }
    }

    showWelcomeMessage() {
        const outputArea = document.getElementById('output-area');
        outputArea.innerHTML = '<div style="color: var(--accent-blue); font-weight: 500;">⚡ Welcome to Flex Online Compiler</div><div style="color: var(--text-secondary); margin-top: 0.5rem;">WebSocket connected • Ready to execute your Flex code</div>';
    }

    showPage(pageId) {
        document.querySelectorAll('.page').forEach(page => {
            page.classList.add('hidden');
        });
        
        const targetPage = document.getElementById(pageId + '-page');
        if (targetPage) {
            targetPage.classList.remove('hidden');
        }
        
        document.querySelectorAll('.modern-nav-link').forEach(link => {
            link.classList.remove('active');
        });
        
        const activeLink = document.querySelector('[data-page="' + pageId + '"]');
        if (activeLink) {
            activeLink.classList.add('active');
        }

        if (pageId === 'examples') {
            this.loadExamples();
        } else if (pageId === 'documentation') {
            this.loadDocumentation();
        }
    }

    toggleShortcuts() {
        const panel = document.getElementById('shortcuts-panel');
        panel.classList.toggle('show');
    }

    clearCode() {
        if (confirm('Are you sure you want to clear the code?')) {
            this.editor.setValue('');
            this.editor.focus();
        }
    }

    saveCode() {
        const code = this.editor.getValue();
        localStorage.setItem('flexCode', code);
        this.showNotification('Code saved to browser storage', 'success');
    }

    loadSavedCode() {
        const savedCode = localStorage.getItem('flexCode');
        if (savedCode && !this.editor.getValue().trim()) {
            this.editor.setValue(savedCode);
        }
    }

    shareCode() {
        const code = this.editor.getValue();
        if (!code.trim()) {
            this.showNotification('No code to share', 'warning');
            return;
        }

        const encodedCode = encodeURIComponent(code);
        const shareUrl = window.location.origin + window.location.pathname + '?code=' + encodedCode;
        
        navigator.clipboard.writeText(shareUrl).then(() => {
            this.showNotification('Share URL copied to clipboard!', 'success');
        }).catch(() => {
            this.showNotification('Failed to copy URL', 'error');
        });
    }

    async loadExamples() {
        const container = document.getElementById('examples-container');
        
        try {
            const response = await fetch('/api/examples');
            const examples = await response.json();
            
            container.innerHTML = '';
            
            examples.forEach(example => {
                const card = this.createExampleCard(example);
                container.appendChild(card);
            });
            
        } catch (error) {
            console.error('Failed to load examples:', error);
            container.innerHTML = '<div style="text-align: center; color: var(--error-color); padding: 2rem;">❌ Failed to load examples</div>';
        }
    }

    createExampleCard(example) {
        const card = document.createElement('div');
        card.className = 'modern-example-card';
        card.innerHTML = '<div class="modern-example-title">' + example.name + '</div><div class="modern-example-description">' + (example.description || 'Example Flex code') + '</div><div class="modern-example-preview">' + example.content.substring(0, 150) + (example.content.length > 150 ? '...' : '') + '</div>';
        
        card.addEventListener('click', () => {
            this.editor.setValue(example.content);
            this.showPage('compiler');
            this.showNotification('Loaded example: ' + example.name, 'success');
        });
        
        return card;
    }

    async loadDocumentation() {
        const linksContainer = document.getElementById('documentation-links');
        
        try {
            const response = await fetch('/api/documentation');
            const docs = await response.json();
            
            linksContainer.innerHTML = '';
            
            docs.forEach(doc => {
                const li = document.createElement('li');
                const link = document.createElement('a');
                link.href = '#';
                link.textContent = doc.name;
                link.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.loadDocumentationContent(doc);
                });
                li.appendChild(link);
                linksContainer.appendChild(li);
            });
            
        } catch (error) {
            console.error('Failed to load documentation:', error);
        }
    }

    async loadDocumentationContent(doc) {
        const content = document.getElementById('doc-content');
        content.innerHTML = '<div style="text-align: center; padding: 2rem;">Loading...</div>';
        
        try {
            const response = await fetch('/api/documentation/' + encodeURIComponent(doc.name));
            const docContent = await response.text();
            
            const htmlContent = window.marked ? marked.parse(docContent) : docContent;
            content.innerHTML = htmlContent;
            
        } catch (error) {
            console.error('Failed to load documentation content:', error);
        }
    }

    showNotification(message, type) {
        const notification = document.createElement('div');
        notification.style.cssText = 'position: fixed; top: 1rem; right: 1rem; background: var(--secondary-bg); color: var(--text-primary); padding: 1rem; border-radius: 0.5rem; box-shadow: var(--shadow-lg); z-index: 1000; border-left: 4px solid var(--accent-blue); animation: slideInRight 0.3s ease-out;';
        
        if (type === 'error') {
            notification.style.borderLeftColor = 'var(--error-color)';
        } else if (type === 'success') {
            notification.style.borderLeftColor = 'var(--success-color)';
        } else if (type === 'warning') {
            notification.style.borderLeftColor = 'var(--warning-color)';
        }
        
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease-out';
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    }

    bindEvents() {
        document.querySelectorAll('.modern-nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const page = link.getAttribute('data-page');
                this.showPage(page);
            });
        });

        document.getElementById('shortcuts-btn').addEventListener('click', () => {
            this.toggleShortcuts();
        });
        
        document.getElementById('shortcuts-close').addEventListener('click', () => {
            this.toggleShortcuts();
        });

        document.getElementById('run-button').addEventListener('click', () => {
            this.runCode();
        });

        document.getElementById('clear-button').addEventListener('click', () => {
            this.clearCode();
        });

        document.getElementById('save-button').addEventListener('click', () => {
            this.saveCode();
        });

        document.getElementById('share-button').addEventListener('click', () => {
            this.shareCode();
        });

        document.getElementById('clear-output-button').addEventListener('click', () => {
            this.clearOutput();
        });

        document.getElementById('send-input-button').addEventListener('click', () => {
            this.sendInput();
        });

        document.getElementById('input-field').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.sendInput();
            }
        });

        const urlParams = new URLSearchParams(window.location.search);
        const sharedCode = urlParams.get('code');
        if (sharedCode) {
            this.editor.setValue(decodeURIComponent(sharedCode));
        }
    }
}

const style = document.createElement('style');
style.textContent = '@keyframes slideInRight { from { transform: translateX(100px); opacity: 0; } to { transform: translateX(0); opacity: 1; } } @keyframes slideOutRight { from { transform: translateX(0); opacity: 1; } to { transform: translateX(100px); opacity: 0; } } .modern-output-area .error { color: var(--error-color); } .modern-output-area .info { color: var(--accent-blue); } .modern-output-area .input { color: var(--accent-green); } .modern-output-area .success { color: var(--success-color); }';
document.head.appendChild(style);

document.addEventListener('DOMContentLoaded', () => {
    window.flexCompiler = new ModernFlexCompiler();
});

window.ModernFlexCompiler = ModernFlexCompiler;
