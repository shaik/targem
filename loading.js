// JavaScript for loading.html page
// Handles loading animation and receives results from background script

let progressInterval;
let currentProgress = 0;

// Start the fake progress bar animation
function startProgressAnimation() {
  const progressBar = document.getElementById('progress-bar');
  const progressText = document.getElementById('progress-text');
  
  const stages = [
    { progress: 15, text: "Extracting text from page...", duration: 1000 },
    { progress: 35, text: "Sending to Gemini API...", duration: 2000 },
    { progress: 55, text: "Processing translation...", duration: 3000 },
    { progress: 70, text: "Generating summary...", duration: 4000 }
  ];
  
  let currentStage = 0;
  
  function updateProgress() {
    if (currentStage < stages.length) {
      const stage = stages[currentStage];
      
      // Animate to the target progress
      const targetProgress = stage.progress;
      const startProgress = currentProgress;
      const progressDiff = targetProgress - startProgress;
      const stepTime = 100; // Update every 100ms
      const steps = stage.duration / stepTime;
      const progressStep = progressDiff / steps;
      
      let step = 0;
      const animationInterval = setInterval(() => {
        step++;
        currentProgress = startProgress + (progressStep * step);
        progressBar.style.width = currentProgress + '%';
        
        if (step >= steps) {
          clearInterval(animationInterval);
          currentProgress = targetProgress;
          progressBar.style.width = currentProgress + '%';
          progressText.textContent = stage.text;
          
          currentStage++;
          if (currentStage < stages.length) {
            setTimeout(updateProgress, 500);
          }
        }
      }, stepTime);
    }
  }
  
  // Start the first stage
  setTimeout(updateProgress, 500);
}

// Complete the progress bar when results arrive
function completeProgress() {
  const progressBar = document.getElementById('progress-bar');
  const progressText = document.getElementById('progress-text');
  
  // Quickly animate to 100%
  const targetProgress = 100;
  const startProgress = currentProgress;
  const progressDiff = targetProgress - startProgress;
  const steps = 10;
  const progressStep = progressDiff / steps;
  
  let step = 0;
  const animationInterval = setInterval(() => {
    step++;
    currentProgress = startProgress + (progressStep * step);
    progressBar.style.width = currentProgress + '%';
    
    if (step >= steps) {
      clearInterval(animationInterval);
      progressBar.style.width = '100%';
      progressText.textContent = 'Translation complete!';
      
      // Hide loading and show results after a brief delay
      setTimeout(() => {
        showResults();
      }, 800);
    }
  }, 50);
}

// Show the results section
function showResults() {
  document.getElementById('loading').style.display = 'none';
  document.getElementById('result').style.display = 'block';
}

// Show error message
function showError(message) {
  document.getElementById('loading').style.display = 'none';
  document.getElementById('error-message').textContent = message;
  document.getElementById('error').style.display = 'block';
}

// Listen for messages from background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'DISPLAY_RESULT') {
    displayResult(request.originalUrl, request.originalTitle, request.content);
  } else if (request.type === 'DISPLAY_ERROR') {
    showError(request.message);
  }
});

// Display successful translation result
function displayResult(originalUrl, originalTitle, content) {
  // Set up original page link
  const originalUrlElement = document.getElementById('original-url');
  originalUrlElement.href = originalUrl;
  originalUrlElement.textContent = originalTitle || originalUrl;
  
  // Display translated content
  const contentElement = document.getElementById('translated-content');
  contentElement.innerHTML = formatContent(content);
  
  // Update page title
  document.title = `Translation: ${originalTitle || 'Page'}`;
  
  // Complete progress and show results
  completeProgress();
}

// Format content - handles both plain text and HTML
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

// Start progress animation when page loads
document.addEventListener('DOMContentLoaded', () => {
  startProgressAnimation();
});