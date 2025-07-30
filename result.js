// JavaScript for result.html page
// Handles displaying translated content and errors

// Listen for messages from background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'DISPLAY_RESULT') {
    displayResult(request.originalUrl, request.originalTitle, request.content);
  } else if (request.type === 'DISPLAY_ERROR') {
    displayError(request.message);
  }
});

// Display successful translation result
function displayResult(originalUrl, originalTitle, content) {
  // Hide loading spinner
  document.getElementById('loading').style.display = 'none';
  
  // Set up original page link
  const originalUrlElement = document.getElementById('original-url');
  originalUrlElement.href = originalUrl;
  originalUrlElement.textContent = originalTitle || originalUrl;
  
  // Display translated content
  const contentElement = document.getElementById('translated-content');
  contentElement.innerHTML = formatContent(content);
  
  // Show result section
  document.getElementById('result').style.display = 'block';
  
  // Update page title
  document.title = `Translation: ${originalTitle || 'Page'}`;
}

// Display error message
function displayError(message) {
  // Hide loading spinner
  document.getElementById('loading').style.display = 'none';
  
  // Set error message
  document.getElementById('error-message').textContent = message;
  
  // Show error section
  document.getElementById('error').style.display = 'block';
  
  // Update page title
  document.title = 'Translation Error';
}

// Format content - now handles both plain text and HTML
function formatContent(content) {
  if (!content) return '';
  
  // Clean up markdown code block markers
  content = cleanMarkdownCodeBlocks(content);
  
  // Check if content contains HTML tags
  const hasHtmlTags = /<[^>]*>/g.test(content);
  
  if (hasHtmlTags) {
    // Content already contains HTML - sanitize and return it
    return sanitizeHtml(content);
  } else {
    // Plain text content - apply basic formatting
    let formattedContent = content
      .split('\n\n')
      .map(paragraph => {
        if (paragraph.trim()) {
          // Check if it's a heading (simple heuristic)
          if (paragraph.trim().length < 100 && !paragraph.includes('.')) {
            return `<h3>${escapeHtml(paragraph.trim())}</h3>`;
          } else {
            return `<p>${escapeHtml(paragraph.trim())}</p>`;
          }
        }
        return '';
      })
      .join('');
    
    return formattedContent || `<p>${escapeHtml(content)}</p>`;
  }
}

// Clean up markdown code block markers
function cleanMarkdownCodeBlocks(content) {
  // Remove markdown code block markers (```html, ```, ```text, etc.)
  content = content.replace(/^```[\w]*\s*/i, ''); // Remove opening ```html or ```
  content = content.replace(/\s*```\s*$/i, ''); // Remove closing ```
  
  // Also handle cases where there might be multiple code blocks
  content = content.replace(/```[\w]*\s*/gi, ''); // Remove any remaining opening markers
  content = content.replace(/\s*```/gi, ''); // Remove any remaining closing markers
  
  // Trim any extra whitespace
  content = content.trim();
  
  return content;
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Sanitize HTML to allow safe rendering while preventing XSS
function sanitizeHtml(html) {
  // Create a temporary div to parse the HTML
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = html;
  
  // Define allowed tags and attributes
  const allowedTags = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'div', 'span', 'strong', 'b', 'em', 'i', 'u', 'ul', 'ol', 'li', 'br', 'hr'];
  const allowedAttributes = ['class', 'style'];
  
  // Recursively sanitize the DOM tree
  function sanitizeNode(node) {
    if (node.nodeType === Node.TEXT_NODE) {
      return node.cloneNode(true);
    }
    
    if (node.nodeType === Node.ELEMENT_NODE) {
      const tagName = node.tagName.toLowerCase();
      
      // Remove disallowed tags
      if (!allowedTags.includes(tagName)) {
        return document.createTextNode(node.textContent);
      }
      
      // Create a new element with the same tag
      const newElement = document.createElement(tagName);
      
      // Copy allowed attributes
      for (let attr of node.attributes) {
        if (allowedAttributes.includes(attr.name.toLowerCase())) {
          newElement.setAttribute(attr.name, attr.value);
        }
      }
      
      // Recursively sanitize child nodes
      for (let child of node.childNodes) {
        const sanitizedChild = sanitizeNode(child);
        if (sanitizedChild) {
          newElement.appendChild(sanitizedChild);
        }
      }
      
      return newElement;
    }
    
    return null;
  }
  
  // Start sanitization from the root
  const sanitizedNode = sanitizeNode(tempDiv);
  return sanitizedNode ? sanitizedNode.innerHTML : escapeHtml(html);
}

// Handle page load
document.addEventListener('DOMContentLoaded', () => {
  // The loading state is shown by default
  // Content will be populated when background script sends a message
}); 