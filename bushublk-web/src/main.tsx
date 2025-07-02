import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import AppContextProvider from './context/AppContext.tsx'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <BrowserRouter>
  <AppContextProvider>
    <App />
  </AppContextProvider>
  </BrowserRouter>,
)
