import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Register service worker for PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      // Service worker registration failed, continue without offline support
    });
  });
}

const rootElement = document.getElementById("root");

console.log('[Main] Root element:', rootElement);

if (!rootElement) {
  console.error('[Main] Root element not found!');
  throw new Error("Root element not found");
}

console.log('[Main] Mounting React app...');

try {
  createRoot(rootElement).render(
    <StrictMode>
      <App />
    </StrictMode>
  );
  console.log('[Main] React app mounted successfully');
} catch (err) {
  console.error('[Main] Failed to mount React app:', err);
  throw err;
}
