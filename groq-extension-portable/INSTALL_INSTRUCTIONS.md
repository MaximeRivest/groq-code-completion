# Groq Code Completion Extension - Installation Guide

## Installing the Extension

### Method 1: Command Line (Recommended)
1. Open terminal/command prompt
2. Navigate to this folder
3. Run: `code --install-extension groq-code-completion-0.1.0.vsix`

### Method 2: From VSCode UI
1. Open VSCode
2. Go to Extensions view (Ctrl+Shift+X)
3. Click the "..." menu at the top of Extensions panel
4. Select "Install from VSIX..."
5. Browse to this folder and select `groq-code-completion-0.1.0.vsix`

### Method 3: Drag and Drop
1. Open VSCode
2. Open Extensions view (Ctrl+Shift+X)
3. Drag the `groq-code-completion-0.1.0.vsix` file into the Extensions panel

## Configuration

### Required: Set up your Groq API Key

1. Get an API key from https://console.groq.com/keys
2. In VSCode, open Settings (Ctrl+,)
3. Search for "Groq"
4. Enter your API key in the "Groq Code Completion: Api Key" field

### Optional Settings
- **Model**: Choose from available Groq models
- **Max Tokens**: Adjust generation length (default: 2048)
- **Temperature**: Control creativity (0.0-1.0, default: 0.3)
- **Streaming**: Enable/disable live streaming
- **Context File Limit**: Number of open files to include as context

## Usage

1. Open any code file
2. Place cursor where you want code completion:
   - After TODO comments
   - In empty functions
   - In empty code blocks
   - Anywhere in your code
3. Press **Ctrl+Shift+G** (Windows/Linux) or **Cmd+Shift+G** (Mac)

## Troubleshooting

### Extension not working?
- Ensure API key is set in settings
- Check Output panel (View > Output) and select "Groq Code Completion"

### No completions generated?
- Try a different model in settings
- Increase maxTokens
- Add more context with comments

## Uninstalling

1. Open Extensions view (Ctrl+Shift+X)
2. Find "Groq Code Completion"
3. Click the gear icon and select "Uninstall"