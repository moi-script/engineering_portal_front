import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
// Ensure you update the import to .tsx or remove the extension entirely
import App from './App' 

// The '!' tells TypeScript that 'root' definitely exists in your index.html
const rootElement = document.getElementById('root')!;

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
)