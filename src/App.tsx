import { Stage } from './scene/Stage'
import { Panel } from './ui/Panel'

export default function App() {
  return (
    <main className="app">
      <div className="viewer">
        <Stage />
        <p className="viewer-hint">
          <span className="hint-mouse">Arraste para girar · scroll para aproximar</span>
          <span className="hint-touch">Arraste para girar · pinça para aproximar</span>
        </p>
      </div>
      <Panel />
    </main>
  )
}
