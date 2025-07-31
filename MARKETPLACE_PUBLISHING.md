# Publishing to VSCode Marketplace

## Prerequisites

### 1. Create a Microsoft/Azure Account
1. Go to https://marketplace.visualstudio.com/manage
2. Sign in with Microsoft account (or create one)

### 2. Create a Publisher
1. Go to https://marketplace.visualstudio.com/manage/createpublisher
2. Choose a publisher ID (this will be your unique identifier)
3. Fill in publisher details:
   - Display name
   - Description
   - Logo (optional)

### 3. Get a Personal Access Token
1. Go to https://dev.azure.com/
2. Sign in and go to your organization
3. Click on User Settings (top right) → Personal Access Tokens
4. Click "New Token"
5. Set:
   - Name: "vsce-publish" (or any name)
   - Organization: Select "All accessible organizations"
   - Expiration: Set as needed
   - Scopes: Select "Custom defined" then check:
     - Marketplace → Manage
6. Copy the token immediately (you won't see it again!)

## Before Publishing

### 1. Update package.json
Replace placeholders with your actual values:
```json
{
  "publisher": "maximerivest",  // From step 2 above
  "repository": {
    "url": "https://github.com/maximerivest/groq-code-completion"
  }
}
```

### 2. Update LICENSE
Replace "YOUR NAME" with your actual name in the LICENSE file

### 3. Convert Icon to PNG
The icon.svg needs to be converted to icon.png (128x128 pixels)
- Use an online converter like https://cloudconvert.com/svg-to-png
- Or use ImageMagick: `convert icon.svg -resize 128x128 icon.png`

### 4. Test Locally
```bash
# Build the extension
npm run package

# Test the VSIX file
code --install-extension groq-code-completion-0.1.0.vsix
```

## Publishing Steps

### 1. Login to vsce
```bash
vsce login YOUR-PUBLISHER-ID
# Enter your Personal Access Token when prompted
```

### 2. Publish
```bash
# Publish to marketplace
vsce publish

# Or publish with version bump
vsce publish minor  # 0.1.0 → 0.2.0
vsce publish patch  # 0.1.0 → 0.1.1
vsce publish major  # 0.1.0 → 1.0.0
```

### 3. Alternative: Manual Upload
If vsce publish fails, you can:
1. Package the extension: `vsce package`
2. Go to https://marketplace.visualstudio.com/manage
3. Click on your publisher
4. Click "New Extension"
5. Upload the .vsix file

## Post-Publishing

### 1. Verify Publication
- Go to https://marketplace.visualstudio.com/publishers/YOUR-PUBLISHER-ID
- Your extension should appear (may take 5-10 minutes)

### 2. Update README
Add marketplace badges to your README:
```markdown
[![Version](https://vsmarketplacebadges.dev/version/YOUR-PUBLISHER-ID.groq-code-completion.svg)](https://marketplace.visualstudio.com/items?itemName=YOUR-PUBLISHER-ID.groq-code-completion)
[![Downloads](https://vsmarketplacebadges.dev/downloads/YOUR-PUBLISHER-ID.groq-code-completion.svg)](https://marketplace.visualstudio.com/items?itemName=YOUR-PUBLISHER-ID.groq-code-completion)
[![Rating](https://vsmarketplacebadges.dev/rating/YOUR-PUBLISHER-ID.groq-code-completion.svg)](https://marketplace.visualstudio.com/items?itemName=YOUR-PUBLISHER-ID.groq-code-completion)
```

### 3. Share Your Extension
Your extension URL will be:
```
https://marketplace.visualstudio.com/items?itemName=YOUR-PUBLISHER-ID.groq-code-completion
```

## Updating the Extension

1. Make your changes
2. Update version in package.json
3. Update CHANGELOG.md
4. Run: `vsce publish`

## Troubleshooting

### "Error: Missing publisher name"
- Make sure you've updated the publisher field in package.json

### "Error: Make sure to edit the README.md file before you package or publish your extension"
- Remove the default VSCode extension README content
- Make sure your README has actual content about your extension

### "Personal Access Token verification failed"
- Make sure your token has the correct scopes
- Token may have expired - create a new one

### Large file warnings
- The bundled extension is expected to be large (~400KB) due to dependencies
- This is normal and won't prevent publishing