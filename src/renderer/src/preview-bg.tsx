import ReactDOM from 'react-dom/client'
import { BackgroundScene } from '@/components/three/BackgroundScene'

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <div style={{ position: 'fixed', inset: 0, background: '#0f0c08' }}>
    <BackgroundScene />
  </div>
)
