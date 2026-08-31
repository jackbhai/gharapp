import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import App from './App';
import './styles.css';

// VitePWA generates the service worker in production. These events let the UI
// explain when the app is offline-ready or a fresh version is available.
registerSW({
  immediate: true,
  onOfflineReady: () => window.dispatchEvent(new CustomEvent('gharapp:pwa-ready')),
  onNeedRefresh: () => window.dispatchEvent(new CustomEvent('gharapp:pwa-update')),
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
