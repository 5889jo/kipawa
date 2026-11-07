import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

const pageLoader = document.getElementById('page-loader')
const hidePageLoader = () => pageLoader?.classList.add('page-loader--hidden')

if (document.readyState === 'complete') {
  window.requestAnimationFrame(hidePageLoader)
} else {
  window.addEventListener('load', hidePageLoader, { once: true })
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
