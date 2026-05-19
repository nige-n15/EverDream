import React from 'react';
import ReactDOM from 'react-dom/client';
import { ensureBrowserStorage } from './lib/storage';
import { SkinProvider } from './contexts/SkinContext';
import App from './App';
import './index.css';
import './skins/pearl-light.css';

ensureBrowserStorage();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <SkinProvider>
      <App />
    </SkinProvider>
  </React.StrictMode>
);
