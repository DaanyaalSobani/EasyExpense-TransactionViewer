import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import PrintableTransactions from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <PrintableTransactions />
  </React.StrictMode>
);