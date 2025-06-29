/**
 * Ultra-Modern Enhanced Flex Online Compiler
 * Advanced Features with Glassmorphism UI
 */

class UltraModernFlexCompiler {
    constructor() {
        this.ws = null;
        this.isConnected = false;
        this.isWaitingForInput = false;
        this.isExecuting = false;
        this.editor = null;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectDelay = 1000;
        
        this.init();
    }

    /**
     * Initialize the ultra-modern compiler interface
     */
    async init() {
        console.log('🚀 Initializing Ultra-Modern Flex Compiler...');
        
        // Initialize editor with enhanced features
        this.initEditor();
        
        // Setup event listeners with advanced interactions
        this.setupEventListeners();
        
        // Connect to WebSocket with connection enhancements
        this.connectWebSocket();
        
        // Setup navigation with smooth transitions
        this.setupNavigation();
        
        // Initialize enhanced notification system
        this.initNotificationSystem();
        
        // Show welcome notification
        setTimeout(() => {
            this.showNotification('✨ Ultra-Modern Flex Compiler Initialized!', 'success');
        }, 1000);
    }

    /**
     * Initialize CodeMirror editor with enhanced features
     */
    initEditor() {
        const textarea = document.getElementById('code-editor');
        
        this.editor = CodeMirror.fromTextArea(textarea, {
            mode: 'flex',
            theme: 'dracula',
            lineNumbers: true,
            matchBrackets: true,
            indentUnit: 4,
            tabSize: 4,
            indentWithTabs: false,
            lineWrapping: true,
            foldGutter: true,
            gutters: ['CodeMirror-linenumbers', 'CodeMirror-foldgutter'],
            autoCloseBrackets: true,
            styleActiveLine: true,
            highlightSelectionMatches: { showToken: /\w/, annotateScrollbar: true },
            extraKeys: {
                'Ctrl-Enter': () => this.runCode(),
                'Ctrl-S': (cm) => {
                    this.saveCode();
                    return false;
                },
                'Tab': (cm) => {
                    if (cm.somethingSelected()) {
                        cm.indentSelection('add');
                    } else {
                        cm.replaceSelection('    ');
                    }
                },
                'Ctrl-/': (cm) => {
                    this.toggleComment(cm);
                }
            }
        });

        // Add enhanced editor features
        this.addEditorEnhancements();
    }

    /**
     * Add enhanced features to the editor
     */
    addEditorEnhancements() {
        // Add enhanced cursor with animation
        this.editor.on('cursorActivity', () => {
            const cursor = document.querySelector('.CodeMirror-cursor');
            if (cursor) {
                cursor.style.borderLeftColor = 'var(--neon-blue)';
                cursor.style.animation = 'cursor-pulse 1.5s ease-in-out infinite';
            }
        });

        // Add line highlighting effect
        this.editor.on('change', () => {
            setTimeout(() => {
                const activeLine = document.querySelector('.CodeMirror-activeline-background');
                if (activeLine) {
                    activeLine.style.background = 'rgba(0, 212, 255, 0.05)';
                    activeLine.style.borderRadius = '4px';
                }
            }, 10);
        });

        // Enhanced bracket matching
        this.editor.on('viewportChange', () => {
            const brackets = document.querySelectorAll('.cm-bracket');
            brackets.forEach(bracket => {
                bracket.style.color = 'var(--neon-pink)';
                bracket.style.fontWeight = '700';
            });
        });
    }

    /**
     * Setup enhanced event listeners
     */
    setupEventListeners() {
        // Enhanced button interactions
        document.getElementById('run-button').addEventListener('click', () => this.runCode());
        document.getElementById('clear-button').addEventListener('click', () => this.clearCode());
        document.getElementById('save-button').addEventListener('click', () => this.saveCode());
        document.getElementById('share-button').addEventListener('click', () => this.shareCode());
        document.getElementById('clear-output-button').addEventListener('click', () => this.clearOutput());
        
        // Enhanced input handling
        const inputField = document.getElementById('input-field');
        const sendButton = document.getElementById('send-input-button');
        
        inputField.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !sendButton.disabled) {
                this.sendInput();
            }
        });
        
        sendButton.addEventListener('click', () => this.sendInput());
        
        // Enhanced shortcuts
        document.getElementById('shortcuts-btn').addEventListener('click', () => this.toggleShortcuts());
        document.getElementById('shortcuts-close').addEventListener('click', () => this.toggleShortcuts());
        
        // Enhanced window events
        window.addEventListener('beforeunload', (e) => {
            if (this.editor && this.editor.getValue().trim()) {
                e.preventDefault();
                e.returnValue = '';
            }
        });

        // Enhanced keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                switch(e.key) {
                    case 'Enter':
                        e.preventDefault();
                        this.runCode();
                        break;
                    case 's':
                        e.preventDefault();
                        this.saveCode();
                        break;
                    case '`':
                        e.preventDefault();
                        this.focusInput();
                        break;
                }
            }
        });
    }

    /**
     * Enhanced WebSocket connection with retry mechanism
     */
    connectWebSocket() {
        try {
            const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
            const wsUrl = `${protocol}//${window.location.host}`;
            
            this.ws = new WebSocket(wsUrl);
            
            this.ws.onopen = () => {
                console.log('🔗 WebSocket connected with enhanced features');
                this.isConnected = true;
                this.reconnectAttempts = 0;
                this.updateConnectionStatus('connected');
                this.showNotification('🔗 Enhanced WebSocket connected!', 'success');
            };
            
            this.ws.onmessage = (event) => {
                this.handleWebSocketMessage(event);
            };
            
            this.ws.onclose = () => {
                console.log('🔌 WebSocket disconnected');
                this.isConnected = false;
                this.updateConnectionStatus('disconnected');
                this.attemptReconnect();
            };
            
            this.ws.onerror = (error) => {
                console.error('❌ WebSocket error:', error);
                this.showNotification('⚠️ Connection error occurred', 'error');
            };
            
        } catch (error) {
            console.error('❌ Failed to connect WebSocket:', error);
            this.showNotification('❌ Failed to establish connection', 'error');
        }
    }

    /**
     * Enhanced WebSocket message handling
     */
    handleWebSocketMessage(event) {
        try {
            const data = JSON.parse(event.data);
            
            switch (data.type) {
                case 'output':
                    this.appendToOutput(data.content, 'output');
                    break;
                    
                case 'error':
                    this.appendToOutput(data.content, 'error');
                    this.updateExecutionStatus('error');
                    break;
                    
                case 'input_request':
                    this.handleInputRequest();
                    break;
                    
                case 'execution_complete':
                    this.handleExecutionComplete();
                    break;
                    
                case 'execution_started':
                    this.updateExecutionStatus('running');
                    break;
                    
                default:
                    console.log('📨 Unknown message type:', data.type);
            }
        } catch (error) {
            console.error('❌ Error parsing WebSocket message:', error);
            this.appendToOutput(event.data, 'output');
        }
    }

    /**
     * Enhanced connection status updates
     */
    updateConnectionStatus(status) {
        const indicator = document.getElementById('status-indicator');
        const text = document.getElementById('status-text');
        
        if (status === 'connected') {
            indicator.className = 'enhanced-status-indicator';
            text.textContent = 'Connected';
            text.style.color = 'var(--neon-green)';
        } else {
            indicator.className = 'enhanced-status-indicator disconnected';
            text.textContent = 'Disconnected';
            text.style.color = '#ff5757';
        }
        
        // Add pulse animation
        indicator.style.animation = status === 'connected' ? 
            'pulse-status 2s ease-in-out infinite' : 
            'shake 0.5s ease-in-out 3';
    }

    /**
     * Enhanced execution status updates
     */
    updateExecutionStatus(status) {
        const statusBadge = document.getElementById('execution-status');
        
        switch (status) {
            case 'running':
                statusBadge.textContent = 'Running';
                statusBadge.className = 'enhanced-badge running';
                this.isExecuting = true;
                break;
                
            case 'error':
                statusBadge.textContent = 'Error';
                statusBadge.className = 'enhanced-badge error';
                this.isExecuting = false;
                break;
                
            case 'idle':
            default:
                statusBadge.textContent = 'Idle';
                statusBadge.className = 'enhanced-badge';
                this.isExecuting = false;
                break;
        }
    }

    /**
     * Enhanced code execution with visual feedback
     */
    async runCode() {
        if (!this.isConnected) {
            this.showNotification('⚠️ Not connected to server', 'warning');
            return;
        }
        
        if (this.isExecuting) {
            this.showNotification('⚠️ Code is already running', 'warning');
            return;
        }
        
        const code = this.editor.getValue().trim();
        if (!code) {
            this.showNotification('⚠️ Please enter some code first', 'warning');
            return;
        }
        
        // Visual feedback
        this.updateExecutionStatus('running');
        this.addExecutionFeedback();
        
        try {
            this.ws.send(JSON.stringify({
                type: 'execute',
                code: code
            }));
            
            this.showNotification('🚀 Code execution started!', 'info');
            
        } catch (error) {
            console.error('❌ Error sending code:', error);
            this.showNotification('❌ Failed to execute code', 'error');
            this.updateExecutionStatus('error');
        }
    }

    /**
     * Add visual feedback during execution
     */
    addExecutionFeedback() {
        const runButton = document.getElementById('run-button');
        const originalContent = runButton.innerHTML;
        
        runButton.innerHTML = '<span class="enhanced-loading"></span> Running';
        runButton.disabled = true;
        runButton.style.background = 'var(--gradient-warning)';
        
        // Reset after execution completes
        setTimeout(() => {
            if (!this.isExecuting) {
                runButton.innerHTML = originalContent;
                runButton.disabled = false;
                runButton.style.background = 'var(--gradient-success)';
            }
        }, 1000);
    }

    /**
     * Enhanced input request handling
     */
    handleInputRequest() {
        this.isWaitingForInput = true;
        
        const inputField = document.getElementById('input-field');
        const sendButton = document.getElementById('send-input-button');
        const inputStatus = document.getElementById('input-status');
        
        inputField.disabled = false;
        sendButton.disabled = false;
        inputStatus.textContent = 'Waiting for input';
        inputStatus.className = 'enhanced-input-status waiting';
        
        // Focus and animate input field
        inputField.focus();
        inputField.style.animation = 'glow 0.5s ease-in-out';
        
        this.showNotification('⌨️ Program is waiting for input', 'info');
        
        // Add pulsing effect to input section
        const inputSection = document.querySelector('.enhanced-input-section');
        inputSection.style.animation = 'pulse-waiting 1.5s ease-in-out infinite';
    }

    /**
     * Enhanced input sending
     */
    sendInput() {
        if (!this.isWaitingForInput || !this.isConnected) {
            return;
        }
        
        const inputField = document.getElementById('input-field');
        const input = inputField.value;
        
        try {
            this.ws.send(JSON.stringify({
                type: 'input',
                input: input
            }));
            
            // Visual feedback
            this.appendToOutput(`> ${input}`, 'input');
            inputField.value = '';
            
            // Reset input state
            this.resetInputState();
            
            this.showNotification('📤 Input sent successfully', 'success');
            
        } catch (error) {
            console.error('❌ Error sending input:', error);
            this.showNotification('❌ Failed to send input', 'error');
        }
    }

    /**
     * Reset input state with animations
     */
    resetInputState() {
        this.isWaitingForInput = false;
        
        const inputField = document.getElementById('input-field');
        const sendButton = document.getElementById('send-input-button');
        const inputStatus = document.getElementById('input-status');
        const inputSection = document.querySelector('.enhanced-input-section');
        
        inputField.disabled = true;
        sendButton.disabled = true;
        inputStatus.textContent = 'Not waiting for input';
        inputStatus.className = 'enhanced-input-status';
        
        // Remove animations
        inputField.style.animation = '';
        inputSection.style.animation = '';
    }

    /**
     * Enhanced execution completion handling
     */
    handleExecutionComplete() {
        this.updateExecutionStatus('idle');
        
        const runButton = document.getElementById('run-button');
        runButton.innerHTML = '<span>▶</span> Run';
        runButton.disabled = false;
        runButton.style.background = 'var(--gradient-success)';
        
        this.showNotification('✅ Code execution completed', 'success');
        
        // Add completion animation
        const outputArea = document.getElementById('output-area');
        outputArea.style.animation = 'glow 0.5s ease-in-out';
        setTimeout(() => {
            outputArea.style.animation = '';
        }, 500);
    }

    /**
     * Enhanced output handling with styling
     */
    appendToOutput(content, type = 'output') {
        const outputArea = document.getElementById('output-area');
        
        // Create styled output element
        const outputElement = document.createElement('div');
        outputElement.className = type;
        
        // Format content based on type
        switch (type) {
            case 'error':
                outputElement.innerHTML = `<strong>❌ Error:</strong> ${this.escapeHtml(content)}`;
                break;
            case 'input':
                outputElement.innerHTML = `<strong>📥 Input:</strong> ${this.escapeHtml(content)}`;
                break;
            case 'success':
                outputElement.innerHTML = `<strong>✅ Success:</strong> ${this.escapeHtml(content)}`;
                break;
            default:
                outputElement.textContent = content;
        }
        
        outputArea.appendChild(outputElement);
        
        // Scroll to bottom with smooth animation
        outputArea.scrollTo({
            top: outputArea.scrollHeight,
            behavior: 'smooth'
        });
        
        // Add entrance animation
        outputElement.style.animation = 'fadeInUp 0.3s ease-out';
    }

    /**
     * Enhanced navigation with smooth transitions
     */
    setupNavigation() {
        const navLinks = document.querySelectorAll('.enhanced-nav-link');
        const pages = document.querySelectorAll('.page');
        
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                
                const targetPage = link.getAttribute('data-page');
                this.switchPage(targetPage);
                
                // Update active nav link
                navLinks.forEach(l => l.classList.remove('active'));
                link.classList.add('active');
            });
        });
    }

    /**
     * Enhanced page switching with animations
     */
    switchPage(pageName) {
        const pages = document.querySelectorAll('.page');
        const targetPage = document.getElementById(`${pageName}-page`);
        
        // Fade out current page
        pages.forEach(page => {
            if (!page.classList.contains('hidden')) {
                page.style.animation = 'fadeOut 0.2s ease-out';
                setTimeout(() => {
                    page.classList.add('hidden');
                    page.style.animation = '';
                }, 200);
            }
        });
        
        // Fade in target page
        setTimeout(() => {
            targetPage.classList.remove('hidden');
            targetPage.style.animation = 'fadeInUp 0.3s ease-out';
            
            // Load page content if needed
            if (pageName === 'examples') {
                this.loadExamples();
            } else if (pageName === 'documentation') {
                this.loadDocumentation();
            }
        }, 200);
    }

    /**
     * Enhanced notification system
     */
    initNotificationSystem() {
        this.notificationContainer = document.getElementById('notification-container');
    }

    /**
     * Show enhanced notification
     */
    showNotification(message, type = 'info', duration = 4000) {
        const notification = document.createElement('div');
        notification.className = `enhanced-notification ${type}`;
        notification.style.pointerEvents = 'auto';
        
        const content = document.createElement('div');
        content.className = 'enhanced-notification-content';
        content.textContent = message;
        
        notification.appendChild(content);
        this.notificationContainer.appendChild(notification);
        
        // Remove notification after duration
        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease-out';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, duration);
        
        // Click to dismiss
        notification.addEventListener('click', () => {
            notification.style.animation = 'slideOutRight 0.3s ease-out';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        });
    }

    /**
     * Enhanced code saving
     */
    saveCode() {
        const code = this.editor.getValue();
        localStorage.setItem('flexCode', code);
        localStorage.setItem('flexCodeTimestamp', Date.now());
        
        this.showNotification('💾 Code saved locally!', 'success');
        
        // Visual feedback on save button
        const saveButton = document.getElementById('save-button');
        const originalBg = saveButton.style.background;
        saveButton.style.background = 'var(--gradient-success)';
        saveButton.style.animation = 'glow 0.3s ease-in-out';
        
        setTimeout(() => {
            saveButton.style.background = originalBg;
            saveButton.style.animation = '';
        }, 300);
    }

    /**
     * Enhanced code sharing
     */
    async shareCode() {
        const code = this.editor.getValue();
        if (!code.trim()) {
            this.showNotification('⚠️ No code to share', 'warning');
            return;
        }
        
        try {
            // Create shareable URL
            const encodedCode = btoa(encodeURIComponent(code));
            const shareUrl = `${window.location.origin}${window.location.pathname}?code=${encodedCode}`;
            
            // Copy to clipboard
            await navigator.clipboard.writeText(shareUrl);
            this.showNotification('🔗 Share URL copied to clipboard!', 'success');
            
        } catch (error) {
            console.error('❌ Error sharing code:', error);
            this.showNotification('❌ Failed to create share URL', 'error');
        }
    }

    /**
     * Enhanced code clearing
     */
    clearCode() {
        if (this.editor.getValue().trim()) {
            if (confirm('🗑️ Are you sure you want to clear all code?')) {
                this.editor.setValue('');
                this.showNotification('🗑️ Code cleared', 'info');
            }
        }
    }

    /**
     * Enhanced output clearing
     */
    clearOutput() {
        const outputArea = document.getElementById('output-area');
        outputArea.innerHTML = `
            <div style="color: var(--neon-blue); font-weight: 600; display: flex; align-items: center; gap: 0.5rem;">
                <span>⚡</span>
                Ultra-Modern Flex Online Compiler
            </div>
            <div style="color: var(--text-secondary); margin-top: 0.5rem; font-style: italic;">
                Output cleared • Enhanced UI ready • Future of coding is here
            </div>
        `;
        this.showNotification('🗑️ Output cleared', 'info');
    }

    /**
     * Enhanced shortcuts panel toggle
     */
    toggleShortcuts() {
        const panel = document.getElementById('shortcuts-panel');
        const isVisible = panel.style.display === 'block';
        
        if (isVisible) {
            panel.style.animation = 'slideOutRight 0.3s ease-out';
            setTimeout(() => {
                panel.style.display = 'none';
                panel.style.animation = '';
            }, 300);
        } else {
            panel.style.display = 'block';
            panel.style.animation = 'slideInRight 0.3s ease-out';
        }
    }

    /**
     * Load enhanced examples
     */
    async loadExamples() {
        console.log('📚 Loading enhanced examples...');
        // Implementation would fetch examples from API
        // For now, show loading state
    }

    /**
     * Load enhanced documentation
     */
    async loadDocumentation() {
        console.log('📖 Loading enhanced documentation...');
        // Implementation would fetch documentation from API
        // For now, show loading state
    }

    /**
     * Enhanced reconnection mechanism
     */
    attemptReconnect() {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            
            setTimeout(() => {
                console.log(`🔄 Attempting to reconnect... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
                this.showNotification(`🔄 Reconnecting... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`, 'info');
                this.connectWebSocket();
            }, this.reconnectDelay);
            
            this.reconnectDelay *= 2; // Exponential backoff
        } else {
            this.showNotification('❌ Connection failed. Please refresh the page.', 'error', 10000);
        }
    }

    /**
     * Utility functions
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    toggleComment(cm) {
        const selection = cm.getSelection();
        const doc = cm.getDoc();
        const from = doc.getCursor('start');
        const to = doc.getCursor('end');
        
        if (selection) {
            const lines = selection.split('\n');
            const commented = lines.every(line => line.trim().startsWith('//'));
            
            if (commented) {
                const uncommented = lines.map(line => line.replace(/^\s*\/\/\s?/, ''));
                cm.replaceSelection(uncommented.join('\n'));
            } else {
                const commentedLines = lines.map(line => `// ${line}`);
                cm.replaceSelection(commentedLines.join('\n'));
            }
        } else {
            const line = doc.getLine(from.line);
            if (line.trim().startsWith('//')) {
                const newLine = line.replace(/^\s*\/\/\s?/, '');
                doc.replaceRange(newLine, {line: from.line, ch: 0}, {line: from.line, ch: line.length});
            } else {
                doc.replaceRange(`// ${line}`, {line: from.line, ch: 0}, {line: from.line, ch: line.length});
            }
        }
    }

    focusInput() {
        const inputField = document.getElementById('input-field');
        if (!inputField.disabled) {
            inputField.focus();
        }
    }
}

// Enhanced styles for shortcuts panel
const shortcutsStyles = `
.shortcuts-panel {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    min-width: 500px;
    max-width: 600px;
    z-index: 10000;
    display: none;
}

.shortcuts-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

@keyframes fadeOut {
    from { opacity: 1; transform: translateY(0); }
    to { opacity: 0; transform: translateY(-20px); }
}

@keyframes cursor-pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
}
`;

// Add enhanced styles to document
const styleSheet = document.createElement('style');
styleSheet.textContent = shortcutsStyles;
document.head.appendChild(styleSheet);

// Initialize the Ultra-Modern Flex Compiler when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('🎉 Starting Ultra-Modern Flex Compiler...');
    window.flexCompiler = new UltraModernFlexCompiler();
});

// Load saved code on page load
window.addEventListener('load', () => {
    const savedCode = localStorage.getItem('flexCode');
    if (savedCode && window.flexCompiler && window.flexCompiler.editor) {
        window.flexCompiler.editor.setValue(savedCode);
        console.log('💾 Loaded saved code from localStorage');
    }
    
    // Check for shared code in URL
    const urlParams = new URLSearchParams(window.location.search);
    const sharedCode = urlParams.get('code');
    if (sharedCode && window.flexCompiler && window.flexCompiler.editor) {
        try {
            const decodedCode = decodeURIComponent(atob(sharedCode));
            window.flexCompiler.editor.setValue(decodedCode);
            window.flexCompiler.showNotification('🔗 Shared code loaded!', 'success');
        } catch (error) {
            console.error('❌ Error loading shared code:', error);
            window.flexCompiler.showNotification('❌ Invalid shared code URL', 'error');
        }
    }
});
