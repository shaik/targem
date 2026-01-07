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
    if (!CONFIG.GROQ_API_KEY || CONFIG.GROQ_API_KEY === 'YOUR_GROQ_API_KEY_HERE') {
      await createErrorTab('Please configure your Groq API key in config.js');
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
    // Send to Groq API
    const translatedSummary = await callGroqAPI(pageText);
    
    // Send result to the loading tab
    await chrome.tabs.sendMessage(targetTabId, {
      type: 'DISPLAY_RESULT',
      originalUrl,
      originalTitle,
      content: translatedSummary
    });
    
  } catch (error) {
    console.error('Error calling Groq API:', error);
    
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

// Call Groq API with retry logic
async function callGroqAPI(text) {
  const requestBody = {
    model: CONFIG.GROQ_MODEL,
    messages: [
      {
        role: 'system',
        content: CONFIG.PROMPT_TEMPLATE
      },
      {
        role: 'user',
        content: text
      }
    ],
    temperature: 0.7,
    max_tokens: 4096
  };

  const maxRetries = 3;
  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Groq API attempt ${attempt}/${maxRetries}`);
      
      const response = await fetch(CONFIG.GROQ_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${CONFIG.GROQ_API_KEY}`
        },
        body: JSON.stringify(requestBody)
      });

      if (response.ok) {
        const data = await response.json();
        
        if (!data.choices || !data.choices[0] || !data.choices[0].message) {
          throw new Error('Invalid response from Groq API');
        }

        return data.choices[0].message.content;
      }

      // Handle specific error codes
      if (response.status === 503) {
        lastError = new Error(`Service temporarily unavailable (attempt ${attempt}/${maxRetries}). The Groq API is experiencing high demand.`);
      } else if (response.status === 429) {
        lastError = new Error(`Rate limit exceeded (attempt ${attempt}/${maxRetries}). Please wait before trying again.`);
      } else if (response.status === 500) {
        lastError = new Error(`Internal server error (attempt ${attempt}/${maxRetries}). The service is temporarily down.`);
      } else if (response.status === 401) {
        lastError = new Error(`Authentication failed. Please check your Groq API key.`);
      } else if (response.status === 403) {
        lastError = new Error(`Access forbidden. Your API key may be invalid or expired.`);
      } else {
        const errorData = await response.json().catch(() => ({}));
        lastError = new Error(`API error: ${response.status} - ${errorData.error?.message || response.statusText}`);
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
  throw new Error(`Failed after ${maxRetries} attempts. ${lastError.message}\n\nTroubleshooting tips:\n• The Groq API may be experiencing high demand\n• Try again in a few minutes\n• Check your internet connection\n• Verify your API key is valid at https://console.groq.com/keys`);
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
