import React, { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
//import './index.css'; // ==> ../index.html
import App from './App';

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Missing the root element');
const root = createRoot(rootElement);
root.render(
  <StrictMode>
    <App />
  </StrictMode>
);
