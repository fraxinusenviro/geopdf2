import React from 'react'
import ReactDOM from 'react-dom/client'
import * as pdfjs from 'pdfjs-dist'
import workerSrc from 'pdfjs-dist/build/pdf.worker.mjs?url'
import { App } from './App'
import { ErrorBoundary } from './components/ErrorBoundary'
import './index.css'

// Configure PDF.js worker once at app startup
pdfjs.GlobalWorkerOptions.workerSrc = workerSrc

// In dev mode, unregister any lingering service workers from previous production builds.
// A cached SW on the same origin will intercept dev server requests and serve stale files.
if (import.meta.env.DEV && 'serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((regs) =>
    regs.forEach((r) => r.unregister()),
  )
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
)
