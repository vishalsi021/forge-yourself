import React from 'react';
import ReactDOM from 'react-dom/client';

import App from './App';
import './index.css';

const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

if (import.meta.env.VITE_SENTRY_DSN) {
  const initSentry = () => {
    import('@sentry/react').then((Sentry) => {
      Sentry.init({
        dsn: import.meta.env.VITE_SENTRY_DSN,
        tracesSampleRate: 0.2,
        environment: import.meta.env.MODE,
      });
    }).catch(() => null);
  };

  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(initSentry, { timeout: 1500 });
  } else {
    window.setTimeout(initSentry, 0);
  }
}
