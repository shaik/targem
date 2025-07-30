# Summarize & Translate Chrome Extension

A Chrome extension that extracts text from web pages, translates it to Hebrew, and provides a summary using Google Gemini API.

## Features

- 🔄 **Translate to Hebrew**: Automatically translates content from any language to Hebrew
- 📝 **Smart Summarization**: Uses AI to create concise summaries of webpage content
- 🎯 **Multiple Triggers**: Toolbar button, right-click menu, or keyboard shortcut
- 🎨 **Clean Interface**: Modern, responsive design for reading translated content
- ⚡ **Fast Processing**: Efficiently extracts and processes page text

## Installation

### Prerequisites

1. **Google Gemini API Key**: Get your free API key from [Google AI Studio](https://aistudio.google.com/app/apikey)

### Setup Steps

1. **Download/Clone** this repository to your local machine

2. **Configure API Key**:
   - Copy `config-example.js` to `config.js`:
     ```bash
     cp config-example.js config.js
     ```
   - Open `config.js` and replace `'YOUR_GEMINI_API_KEY_HERE'` with your actual Gemini API key:
   ```javascript
   const CONFIG = {
     GEMINI_API_KEY: 'your-actual-api-key-here',
     // ... rest of config
   };
   ```
   - **Important**: Never commit `config.js` to git - it's in `.gitignore` for security

3. **Convert Icons** (Optional):
   - The extension includes SVG icons named as PNG files
   - For better compatibility, convert `icons/icon.svg` to actual PNG files in sizes 16x16, 32x32, 48x48, and 128x128
   - You can use any image editor or online converter

4. **Load Extension in Chrome**:
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode" (top right toggle)
   - Click "Load unpacked"
   - Select the folder containing this extension
   - The extension should now appear in your toolbar

## Usage

### Three Ways to Use the Extension:

1. **Toolbar Button**: Click the extension icon in your Chrome toolbar
2. **Right-Click Menu**: Right-click on any webpage and select "Summarize & Translate"  
3. **Keyboard Shortcut**: 
   - Windows/Linux: `Ctrl+Shift+T`
   - Mac: `Cmd+Shift+T`

### How It Works:

1. Navigate to any webpage with text content
2. Trigger the extension using one of the methods above
3. The extension will:
   - Extract all visible text from the page
   - Send it to Google Gemini API for translation and summarization
   - Open a new tab with the Hebrew translation and summary
   - Include a link back to the original page

## File Structure

```
tar-gem/
├── manifest.json          # Extension configuration
├── background.js          # Main extension logic
├── content.js            # Content script (minimal)
├── config.js             # API configuration
├── result.html           # Results page template
├── result.js             # Results page logic
├── icons/                # Extension icons
│   ├── icon.svg          # Source icon
│   ├── icon16.png        # 16x16 icon
│   ├── icon32.png        # 32x32 icon
│   ├── icon48.png        # 48x48 icon
│   └── icon128.png       # 128x128 icon
└── README.md             # This file
```

## Configuration Options

### `config.js` Settings:

- **`GEMINI_API_KEY`**: Your Google Gemini API key (required)
- **`GEMINI_API_URL`**: Gemini API endpoint (default is correct)
- **`PROMPT_TEMPLATE`**: The instruction sent to AI (can be customized)

### Customizing the Translation Prompt:

You can modify the `PROMPT_TEMPLATE` in `config.js` to change how the AI processes text:

```javascript
// Example: Add more specific instructions
PROMPT_TEMPLATE: 'Translate the following text into Hebrew, summarize it in 2-3 paragraphs, and highlight the main points.'
```

## Troubleshooting

### Common Issues:

1. **"Please configure your Gemini API key"**:
   - Make sure you've replaced `YOUR_GEMINI_API_KEY` in `config.js` with your actual API key

2. **"No text found on the current page"**:
   - The page might not have readable text content
   - Try refreshing the page and trying again

3. **"Gemini API error"**:
   - Check that your API key is valid and has quota remaining
   - Verify your internet connection

4. **Extension not working**:
   - Make sure the extension is enabled in `chrome://extensions/`
   - Check the browser console for any error messages
   - Try reloading the extension

### API Limits:

- Google Gemini API has rate limits and quotas
- For high usage, consider upgrading your API plan
- The extension includes error handling for API failures

## Privacy & Security

- **No Data Storage**: The extension doesn't store any personal data
- **Secure Transmission**: All data is sent securely to Google's Gemini API
- **Local Configuration**: API keys are stored locally in your browser only
- **No Tracking**: The extension doesn't track user behavior

## Development

### Testing:

1. Load the extension in developer mode
2. Open any webpage with text content
3. Test all three trigger methods
4. Check the browser console for any errors
5. Verify the results page displays correctly

### Modifying:

- Edit the files as needed
- Reload the extension in `chrome://extensions/` after changes
- Test thoroughly before distribution

## License

This project is provided as-is for educational and personal use.

## Contributing

Feel free to submit issues, fork the repository, and create pull requests for any improvements.

---

**Note**: This extension requires a valid Google Gemini API key to function. Make sure to keep your API key secure and don't share it publicly. 