// Configuration for Google Gemini API
// Replace 'YOUR_GEMINI_API_KEY' with your actual Gemini API key
// Get your API key from: https://aistudio.google.com/app/apikey

const CONFIG = {
  GEMINI_API_KEY: 'YOUR_GEMINI_API_KEY_HERE',
  GEMINI_API_URL: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent',
  PROMPT_TEMPLATE: 'Summarize the following text in your own words in Hebrew. Format your response using clean semantic HTML tags like <h2>, <h3>, <p>, <ul>, <li>, <strong>, <em> etc. Do NOT include any CSS code, inline styles, or <style> tags. Only return the HTML content with Hebrew text - no CSS whatsoever.'
};

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CONFIG;
} 