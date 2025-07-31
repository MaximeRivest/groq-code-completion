# Changelog

All notable changes to the "Groq Code Completion" extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2024-07-31

### Added
- Initial release of Groq Code Completion
- AI-powered code completion using Groq's fast inference API
- Support for multiple completion triggers:
  - TODO/COMPLETE/AI/IMPLEMENT/FIXME markers
  - Empty function bodies
  - Empty code blocks
  - Current cursor position
- Multi-file context awareness (analyzes open tabs)
- Real-time streaming responses
- Configurable settings:
  - API key management
  - Model selection (Kimi-k2, Qwen3-32B, Llama 3.1)
  - Max tokens, temperature, and streaming options
  - Context file limit
- Keyboard shortcut: Ctrl+Shift+G (Cmd+Shift+G on Mac)
- Support for multiple programming languages