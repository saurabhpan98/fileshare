import React, { useEffect } from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

function hideSplash() {
  const el = document.getElementById('splash');
  if (!el) return;
  el.classList.add('fade-out');
  setTimeout(() => { el.classList.add('hidden'); }, 600);
}

function AppWrapper() {
  useEffect(() => {
    // Use requestAnimationFrame to ensure the DOM is ready
    requestAnimationFrame(() => {
      hideSplash();
    });
  }, []);
  return <App />;
}

// Double fallback: also call hideSplash on window load
window.addEventListener('load', () => {
  requestAnimationFrame(() => {
    hideSplash();
  });
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AppWrapper />
  </React.StrictMode>,
)
