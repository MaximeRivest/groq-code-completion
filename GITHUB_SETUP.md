# GitHub Repository Setup

Since GitHub CLI is not installed, please follow these steps to create the repository:

## Option 1: Using GitHub Web Interface

1. Go to https://github.com/new
2. Create a new repository with these settings:
   - Repository name: `groq-code-completion`
   - Description: `AI-powered code completion VSCode extension using Groq's fast inference API`
   - Public repository: ✓ (checked)
   - Initialize repository: ✗ (unchecked - important!)

3. After creating, copy the repository URL (it will be something like: `https://github.com/YOUR_USERNAME/groq-code-completion.git`)

4. In your terminal, run these commands:
   ```bash
   cd /home/maxime/Projects/groq-code-completion
   git remote add origin https://github.com/YOUR_USERNAME/groq-code-completion.git
   git push -u origin main
   ```

## Option 2: Install GitHub CLI and run automated command

1. Install GitHub CLI:
   ```bash
   # For Ubuntu/Debian
   sudo apt install gh
   
   # For other systems, see: https://cli.github.com/
   ```

2. Authenticate with GitHub:
   ```bash
   gh auth login
   ```

3. Create and push the repository:
   ```bash
   gh repo create groq-code-completion --public --description "AI-powered code completion VSCode extension using Groq's fast inference API" --source=. --remote=origin --push
   ```

## Repository is ready!

Your local repository has been initialized with all the code and is ready to be pushed to GitHub. Just follow one of the options above.