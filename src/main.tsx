import React from 'react'
import ReactDOM from 'react-dom/client'
import * as pdfjs from 'pdfjs-dist'
import { App } from './App'
import { ErrorBoundary } from './components/ErrorBoundary'
import './index.css'

// Configure PDF.js worker once at app startup
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.mjs',
  import.meta.url,
).href

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
)
