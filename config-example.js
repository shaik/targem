// Configuration for Google Gemini API
// INSTRUCTIONS: 
// 1. Copy this file to config.js
// 2. Replace 'YOUR_GEMINI_API_KEY_HERE' with your actual Gemini API key
// 3. Get your API key from: https://aistudio.google.com/app/apikey

const CONFIG = {
  GEMINI_API_KEY: 'YOUR_GEMINI_API_KEY_HERE',
  GEMINI_API_URL: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent',
  PROMPT_TEMPLATE: 'Summarize the following text in your own words in Hebrew. Identify and clearly state — in Hebrew — the single most important piece of information, even if it is only hinted at or mentioned briefly and Present this key point in 1-2 short sentences at the top. Format your response using clean semantic HTML tags like <h2>, <h3>, <p>, <ul>, <li>, <strong>, <em> etc. Do NOT include any CSS code, inline styles, or <style> tags. Only return the HTML content with Hebrew text - no CSS whatsoever.'
};

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CONFIG;
}