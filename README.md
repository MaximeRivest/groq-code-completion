# Groq Code Completion for VSCode

AI-powered code completion using Groq's lightning-fast inference API. Get intelligent code suggestions with low latency using models like Kimi-K2, Llama 4, and more.

## Features

- **Smart Context Detection**: Automatically detects where to complete code
  - Completion markers (`// TODO:`, `// COMPLETE:`, etc.)
  - Empty function bodies
  - Empty code blocks
  - Current cursor position
  
- **Multi-file Context**: Analyzes all open tabs to understand your project structure

- **Fast Streaming**: See code being generated in real-time

- **Multiple Models**: Choose from various Groq models optimized for different use cases

## Quick Start

### Prerequisites

1. **Groq API Key**: Get one from [console.groq.com](https://console.groq.com/keys)
2. **Node.js**: Version 16.x or higher
3. **VSCode**: Version 1.85.0 or higher

### Installation

1. Clone this repository:
   ```bash
   git clone <repository-url>
   cd groq-code-completion
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Compile the extension:
   ```bash
   npm run compile
   ```

4. Open in VSCode:
   ```bash
   code .
   ```

5. Press `F5` to launch a new Extension Development Host window

6. Configure your API key in VSCode settings:
   - Open Settings (Ctrl/Cmd + ,)
   - Search for "Groq"
   - Enter your API key

## Usage

### Method 1: Using Markers
Add a marker where you want AI to complete code:

```javascript
function calculateTotal(items) {
    // TODO: implement calculation logic
}
```

Then press **Ctrl+Shift+G** (Cmd+Shift+G on Mac)

### Method 2: Empty Functions
```python
def process_data(data):
    # Place cursor here and press Ctrl+Shift+G
```

### Method 3: Empty Blocks
```typescript
if (user.isAuthenticated) {
    // Cursor here + Ctrl+Shift+G
}
```

### Method 4: Anywhere
Just place your cursor and press the hotkey!

## Configuration

Access settings through VSCode Settings (search for "Groq"):

| Setting | Description | Default |
|---------|-------------|---------|
| `apiKey` | Your Groq API key | - |
| `model` | AI model to use | `mixtral-8x7b-32768` |
| `maxTokens` | Maximum tokens to generate | `2048` |
| `temperature` | Creativity (0=deterministic, 1=creative) | `0.3` |
| `streaming` | Enable live streaming | `true` |
| `contextFileLimit` | Max open files to include as context | `5` |

### Available Models

- **mixtral-8x7b-32768**: Best for code (32k context) - Recommended
- **llama3-70b-8192**: Large, powerful model (8k context)
- **llama3-8b-8192**: Fast, efficient model (8k context)
- **gemma-7b-it**: Lightweight model
- **gemma2-9b-it**: Improved lightweight model

## Tips for Best Results

1. **Use descriptive markers**: 
   ```javascript
   // TODO: implement binary search with error handling
   ```

2. **Keep related files open**: The AI uses all open tabs for context

3. **Define function signatures first**:
   ```python
   def merge_sort(arr: List[int]) -> List[int]:
       # AI will implement based on signature
   ```

4. **Adjust temperature**:
   - Low (0.1-0.3): Predictable, conventional code
   - High (0.5-0.7): More creative solutions

## Development

### Building from Source

```bash
# Install dependencies
npm install

# Compile TypeScript
npm run compile

# Watch mode (auto-compile)
npm run watch

# Run linter
npm run lint
```

### Packaging

To create a .vsix file for distribution:

```bash
npm install -g vsce
vsce package
```

### Publishing

```bash
vsce publish
```

## Troubleshooting

### "No completion generated"
- Try a different model (mixtral-8x7b-32768 is most reliable)
- Increase maxTokens in settings
- Provide more context with comments

### "API key not set"
- Check VSCode settings (Groq Code Completion section)
- Or set environment variable: `export GROQ_API_KEY=your_key`

### Slow responses
- Try llama3-8b-8192 for faster inference
- Reduce contextFileLimit in settings
- Disable streaming for single-shot completion

### Incorrect completions
- Add comments explaining what you need
- Open related files for better context
- Use more specific markers

## Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License - see LICENSE file for details

## Acknowledgments

- Built with the [Groq SDK](https://github.com/groq/groq-typescript)
- Inspired by GitHub Copilot and similar tools
- Thanks to the VSCode extension API documentation