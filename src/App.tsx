import { lazy, Suspense, useEffect, useState } from 'react'
import { ManualDrawer } from './components/ManualDrawer'
import { SettingsPanel } from './components/SettingsPanel'
import { SignalPath } from './components/SignalPath'
import { TapePanel } from './components/TapePanel'
import { decodeKey } from './enigma/share'
import { useEnigma } from './store'

const MachineScene = lazy(() => import('./three/MachineScene'))

const isTyping = (el: EventTarget | null) =>
  el instanceof HTMLElement && (el.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName))

function useFontsReady() {
  const [ready, setReady] = useState(false)
  useEffect(() => {
    // Canvas textures are drawn once, so wait for the webfont before building the 3D scene.
    const fallback = setTimeout(() => setReady(true), 2500)
    document.fonts
      .load('600 40px "Barlow Condensed"')
      .catch(() => undefined)
      .finally(() => {
        clearTimeout(fallback)
        setReady(true)
      })
    return () => clearTimeout(fallback)
  }, [])
  return ready
}

function useMachineKeyboard() {
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      const s = useEnigma.getState()
      if (e.key === 'Escape') return s.openTopic(null)
      if (isTyping(e.target) || e.metaKey || e.ctrlKey || e.altKey || s.autoTyping) return
      if (e.key === 'Backspace') {
        e.preventDefault()
        return s.undo()
      }
      if (/^[a-z]$/i.test(e.key) && !e.repeat) {
        e.preventDefault()
        s.press(e.key.toUpperCase().charCodeAt(0) - 65)
      }
    }
    const up = (e: KeyboardEvent) => {
      const s = useEnigma.getState()
      if (/^[a-z]$/i.test(e.key) && s.pressed === e.key.toUpperCase().charCodeAt(0) - 65 && !s.autoTyping) s.release()
    }
    const pointerUp = () => {
      const s = useEnigma.getState()
      if (s.pressed !== null && !s.autoTyping) s.release()
    }
    const hash = () => {
      const k = decodeKey(window.location.hash)
      if (k) useEnigma.getState().loadKey(k.settings, k.start)
    }
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    window.addEventListener('pointerup', pointerUp)
    window.addEventListener('pointercancel', pointerUp)
    window.addEventListener('blur', pointerUp)
    window.addEventListener('hashchange', hash)
    return () => {
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup', up)
      window.removeEventListener('pointerup', pointerUp)
      window.removeEventListener('pointercancel', pointerUp)
      window.removeEventListener('blur', pointerUp)
      window.removeEventListener('hashchange', hash)
    }
  }, [])
}

export default function App() {
  const fontsReady = useFontsReady()
  const hotspots = useEnigma((s) => s.hotspots)
  const { openTopic, toggleHotspots } = useEnigma.getState()
  const topicOpen = useEnigma((s) => s.topic !== null)
  useMachineKeyboard()

  return (
    <div className={`app${topicOpen ? ' manual-open' : ''}`}>
      <header className="masthead">
        <div className="brand">
          <h1>Enigma</h1>
          <p>
            A working replica of the Enigma I cipher machine. Set the key, type a message, and watch every wire it
            takes.
          </p>
        </div>
        <nav className="masthead-actions">
          <button className="primary" onClick={() => openTopic('overview')}>
            Start the lessons
          </button>
          <button className="ghost" onClick={toggleHotspots} aria-pressed={hotspots}>
            {hotspots ? 'Hide' : 'Show'} markers
          </button>
        </nav>
      </header>

      <main className="workbench">
        <div className="col-settings">
          <SettingsPanel />
        </div>

        <div className="col-machine">
          <div className="stage">
            {fontsReady && (
              <Suspense fallback={<div className="stage-loading">Assembling the machine…</div>}>
                <MachineScene />
              </Suspense>
            )}
            <p className="stage-hint">Click keys or type · drag to look around · click a rotor to turn it</p>
          </div>
          <SignalPath />
        </div>

        <div className="col-tape">
          <TapePanel />
        </div>
      </main>

      <footer className="colophon">
        Models the Wehrmacht Enigma I with rotors I–V, the Kriegsmarine M3 rotors VI–VIII, and reflectors A, B and C.
        Built for teaching; output matches historical machines.
      </footer>

      <ManualDrawer />
    </div>
  )
}
