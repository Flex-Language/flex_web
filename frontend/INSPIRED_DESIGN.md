# Inspired Design - Flex Online Compiler

## Overview
This is a clean, professional redesign of the Flex Online Compiler inspired by modern development environments. The design focuses on simplicity, functionality, and a professional appearance.

## Design Features

### 🎨 Visual Design
- **Clean Dark Theme**: Professional dark color scheme with excellent contrast
- **Split Layout**: Code editor on the left, output console on the right
- **Modern Typography**: Inter font for UI, JetBrains Mono for code
- **Subtle Animations**: Smooth transitions and hover effects
- **Professional Color Palette**: Carefully chosen colors for different states

### 🔧 User Interface
- **Navigation Bar**: Clean header with brand, navigation links, and shortcuts button
- **Code Editor Panel**: Full-featured editor with syntax highlighting
- **Output Console**: Real-time output display with connection status
- **Program Input**: Interactive input section for scan() functions
- **Action Buttons**: Run, Clear, Save with clear visual hierarchy

### 📱 Responsive Design
- **Desktop First**: Optimized for development workstations
- **Tablet Friendly**: Responsive layout for smaller screens
- **Mobile Adaptive**: Stacked layout for mobile devices

## File Structure

```
frontend/
├── index-inspired.html     # New clean design HTML
├── css/
│   └── inspired.css        # Professional styling
├── js/
│   └── inspired.js         # Clean functionality
└── INSPIRED_DESIGN.md      # This documentation
```

## Key Components

### 1. Navigation Header
- Brand identity with lightning bolt icon
- Navigation menu (Compiler, Examples, Documentation)
- Shortcuts button for keyboard shortcuts

### 2. Code Editor Panel
- CodeMirror integration with Flex syntax highlighting
- Action buttons: Run (green), Clear (gray), Save (blue)
- Full-screen code editing area

### 3. Output Console
- Connection status indicator with colored dot
- Execution status badge (Idle, Running, Error)
- Real-time output display with syntax highlighting
- Auto-scrolling to latest output

### 4. Program Input Section
- Input status indicator
- Text input field for scan() functions
- Send button with orange accent color
- Dynamic enabling/disabling based on program state

## Color Scheme

### Background Colors
- Primary: `#1a1d26` (Main background)
- Secondary: `#242836` (Panel backgrounds)
- Header: `#1e2230` (Navigation and panel headers)

### Accent Colors
- Green: `#00c851` (Success, Run button)
- Blue: `#4285f4` (Info, Save button)
- Orange: `#ff9500` (Warning, Send button)
- Red: `#ff4444` (Error states)

### Text Colors
- Primary: `#ffffff` (Main text)
- Secondary: `#b8c5d6` (Secondary text)
- Muted: `#8892a8` (Placeholder, disabled text)

## Functionality

### WebSocket Integration
- Real-time connection status
- Live output streaming
- Interactive input handling
- Automatic reconnection

### Code Editor Features
- Syntax highlighting for Flex language
- Line numbers and bracket matching
- Keyboard shortcuts (Ctrl+Enter to run, Ctrl+S to save)
- Auto-indentation and tab handling

### Execution Flow
1. User writes Flex code in the editor
2. Clicks Run button or uses Ctrl+Enter
3. Code is sent via WebSocket to backend
4. Real-time output appears in console
5. Interactive input requests are handled dynamically

## Browser Support
- Chrome/Chromium 80+
- Firefox 75+
- Safari 13+
- Edge 80+

## Usage

### To Use This Design
1. Navigate to `frontend/index-inspired.html`
2. Ensure backend is running on the same host
3. WebSocket will connect automatically
4. Start coding in Flex!

### To Make This the Default Design
Replace the contents of `frontend/index.html` with `frontend/index-inspired.html` or update the server to serve the inspired design by default.

## Future Enhancements
- [ ] Examples page with live GitHub integration
- [ ] Documentation viewer
- [ ] Code sharing functionality
- [ ] Multiple theme support
- [ ] Advanced editor settings
- [ ] Split-screen layout options

## Inspiration
This design was inspired by modern development environments like:
- VS Code's clean interface
- JetBrains IDEs' professional layout
- GitHub's modern web design
- CodePen's split-view editor

The goal was to create a professional, distraction-free environment for Flex development that feels familiar to developers while showcasing the unique features of the Flex language. 