// Import configuration
importScripts('config.js');

// Create context menu item when extension starts
chrome.runtime.onStartup.addListener(createContextMenu);
chrome.runtime.onInstalled.addListener(createContextMenu);

function createContextMenu() {
  chrome.contextMenus.create({
    id: "summarizeTranslate",
    title: "Summarize & Translate",
    contexts: ["page", "selection"]
  });
}

// Handle toolbar button click
chrome.action.onClicked.addListener((tab) => {
  handleSummarizeTranslate(tab);
});

// Handle context menu click
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "summarizeTranslate") {
    handleSummarizeTranslate(tab);
  }
});

// Handle keyboard shortcut
chrome.commands.onCommand.addListener((command, tab) => {
  if (command === "summarize-translate") {
    handleSummarizeTranslate(tab);
  }
});

// Main function to handle summarize and translate request
async function handleSummarizeTranslate(tab) {
  try {
    // Check if we have a valid API key
    if (!CONFIG.GEMINI_API_KEY || CONFIG.GEMINI_API_KEY === 'YOUR_GEMINI_API_KEY') {
      await createErrorTab('Please configure your Gemini API key in config.js');
      return;
    }

    // Inject content script to extract text
    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      function: extractPageText
    });

    const pageText = results[0].result;
    
    if (!pageText || pageText.trim().length === 0) {
      await createErrorTab('No text found on the current page');
      return;
    }

    // Immediately open loading tab
    const loadingTab = await createLoadingTab();
    
    // Process API call in parallel
    processTranslation(pageText, tab.url, tab.title, loadingTab.id);
    
  } catch (error) {
    console.error('Error processing page:', error);
    await createErrorTab(`Error: ${error.message}`);
  }
}

// Process translation in the background and send result to loading tab
async function processTranslation(pageText, originalUrl, originalTitle, targetTabId) {
  try {
    // Send to Gemini API
    const translatedSummary = await callGeminiAPI(pageText);
    
    // Send result to the loading tab
    await chrome.tabs.sendMessage(targetTabId, {
      type: 'DISPLAY_RESULT',
      originalUrl,
      originalTitle,
      content: translatedSummary
    });
    
  } catch (error) {
    console.error('Error calling Gemini API:', error);
    
    // Send error to the loading tab
    try {
      await chrome.tabs.sendMessage(targetTabId, {
        type: 'DISPLAY_ERROR',
        message: error.message
      });
    } catch (messageError) {
      console.error('Error sending error message to tab:', messageError);
      // Fallback: create a new error tab if we can't message the loading tab
      await createErrorTab(`Error: ${error.message}`);
    }
  }
}

// Function to extract text from page (will be injected)
function extractPageText() {
  return document.body.innerText || '';
}

// Call Gemini API with retry logic
async function callGeminiAPI(text) {
  const requestBody = {
    contents: [{
      parts: [{
        text: `${CONFIG.PROMPT_TEMPLATE}\n\n${text}`
      }]
    }]
  };

  const maxRetries = 3;
  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Gemini API attempt ${attempt}/${maxRetries}`);
      
      const response = await fetch(`${CONFIG.GEMINI_API_URL}?key=${CONFIG.GEMINI_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
        timeout: 30000 // 30 second timeout
      });

      if (response.ok) {
        const data = await response.json();
        
        if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
          throw new Error('Invalid response from Gemini API');
        }

        return data.candidates[0].content.parts[0].text;
      }

      // Handle specific error codes
      if (response.status === 503) {
        lastError = new Error(`Service temporarily unavailable (attempt ${attempt}/${maxRetries}). The Gemini API is experiencing high demand.`);
      } else if (response.status === 429) {
        lastError = new Error(`Rate limit exceeded (attempt ${attempt}/${maxRetries}). Please wait before trying again.`);
      } else if (response.status === 500) {
        lastError = new Error(`Internal server error (attempt ${attempt}/${maxRetries}). The service is temporarily down.`);
      } else {
        lastError = new Error(`API error: ${response.status} ${response.statusText}`);
      }

      // If this isn't the last attempt, wait before retrying
      if (attempt < maxRetries) {
        const waitTime = Math.pow(2, attempt) * 1000; // Exponential backoff: 2s, 4s, 8s
        console.log(`Waiting ${waitTime}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }

    } catch (error) {
      lastError = error;
      
      // If this isn't the last attempt and it's a network error, wait before retrying
      if (attempt < maxRetries && (error.name === 'TypeError' || error.message.includes('fetch'))) {
        const waitTime = Math.pow(2, attempt) * 1000;
        console.log(`Network error, waiting ${waitTime}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      } else if (attempt === maxRetries) {
        break;
      }
    }
  }

  // If we've exhausted all retries, throw the last error with helpful message
  throw new Error(`Failed after ${maxRetries} attempts. ${lastError.message}\n\nTroubleshooting tips:\n• The Gemini API may be experiencing high demand\n• Try again in a few minutes\n• Check your internet connection\n• Verify your API key is valid`);
}

// Create loading tab
async function createLoadingTab() {
  const loadingTab = await chrome.tabs.create({
    url: chrome.runtime.getURL('loading.html')
  });
  
  return loadingTab;
}

// Create error tab (fallback for immediate errors)
async function createErrorTab(errorMessage) {
  const errorTab = await chrome.tabs.create({
    url: chrome.runtime.getURL('loading.html')
  });
  
  // Wait for tab to load and send error
  chrome.tabs.onUpdated.addListener(function listener(tabId, info) {
    if (tabId === errorTab.id && info.status === 'complete') {
      chrome.tabs.onUpdated.removeListener(listener);
      chrome.tabs.sendMessage(tabId, {
        type: 'DISPLAY_ERROR',
        message: errorMessage
      });
    }
  });
} 