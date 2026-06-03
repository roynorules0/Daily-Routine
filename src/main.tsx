import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Global HTTP response shield: prevents JSON parsing errors if endpoints return HTML/Text (such as Vercel errors)
const originalJson = Response.prototype.json;
Response.prototype.json = async function () {
  const contentType = this.headers.get('content-type') || '';
  // Check if content-type mismatch occurs
  if (contentType && !contentType.includes('application/json') && !contentType.includes('text/javascript')) {
    const text = await this.text();
    const titleMatch = text.match(/<title>(.*?)<\/title>/i);
    const extractedTitle = titleMatch ? titleMatch[1] : '';
    const textSnippet = text.length > 350 ? text.substring(0, 350) + '...' : text;
    
    // Extract route path/name from URL
    let routeName = 'Unknown route';
    try {
      const urlObj = new URL(this.url, window.location.origin);
      routeName = urlObj.pathname;
    } catch (_) {
      routeName = this.url;
    }

    throw new Error(
      `Response format deviation!\n` +
      `API Route Name: ${routeName}\n` +
      `Requested URL: ${this.url}\n` +
      `Response Status: ${this.status} (${this.statusText || 'OK'})\n` +
      `Response Content-Type: ${contentType}\n` +
      `Expected Type: application/json\n` +
      `${extractedTitle ? `Page Title: "${extractedTitle}"\n` : ''}` +
      `Raw Response Snippet:\n${textSnippet}`
    );
  }
  return originalJson.call(this);
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
