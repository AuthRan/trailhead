import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import { ApplicationsProvider } from './state/ApplicationsProvider.tsx'
import { ToastProvider } from './state/ToastProvider.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <ToastProvider>
        <ApplicationsProvider>
          <App />
        </ApplicationsProvider>
      </ToastProvider>
    </BrowserRouter>
  </StrictMode>,
)
