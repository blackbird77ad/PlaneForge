import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import { AppErrorBoundary } from './components/AppErrorBoundary.jsx';
import App from './App.jsx';
import './styles/global.css';

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AppErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <App />
        </AuthProvider>
      </BrowserRouter>
    </AppErrorBoundary>
  </React.StrictMode>
);

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .getRegistrations?.()
      ?.then((registrations) => {
        registrations.forEach((registration) => registration.unregister());
      })
      .catch(() => {});

    window.caches
      ?.keys?.()
      ?.then((keys) => {
        keys.filter((key) => key.startsWith('planeforge')).forEach((key) => window.caches.delete(key));
      })
      .catch(() => {});
  });
}
