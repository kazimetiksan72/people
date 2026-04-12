import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { setupAxios401Interceptor } from './api/setupAxios401Interceptor';

setupAxios401Interceptor();

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
