// Configuration for Groq API
// INSTRUCTIONS: 
// 1. Copy this file to config.js
// 2. Replace 'YOUR_GROQ_API_KEY_HERE' with your actual Groq API key
// 3. Get your API key from: https://console.groq.com/keys

const CONFIG = {
  GROQ_API_KEY: 'YOUR_GROQ_API_KEY_HERE',
  GROQ_API_URL: 'https://api.groq.com/openai/v1/chat/completions',
  GROQ_MODEL: 'llama-3.3-70b-versatile',
  PROMPT_TEMPLATE: 'Summarize the following text in your own words in Hebrew. Identify and clearly state — in Hebrew — the single most important piece of information, even if it is only hinted at or mentioned briefly and Present this key point in 1-2 short sentences at the top. Format your response using clean semantic HTML tags like <h2>, <h3>, <p>, <ul>, <li>, <strong>, <em> etc. Do NOT include any CSS code, inline styles, or <style> tags. Only return the HTML content with Hebrew text - no CSS whatsoever.'
};

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CONFIG;
}
