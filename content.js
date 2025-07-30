// Content script for Summarize & Translate extension
// Most functionality is handled by background.js via executeScript
// This file is included for completeness and future extensibility

// Listen for messages from background script (if needed)
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  // Currently not used, but can be extended for future functionality
  return true;
}); 