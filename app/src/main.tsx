import { createRoot } from 'react-dom/client'
import './index.css'
import './site.css'
import App from './App'

/* No StrictMode: the hero hooks build a WebGL scene and attach window listeners, and a
   double-invoked effect would leave a second scene running behind the first. */
createRoot(document.getElementById('root')!).render(<App />)
