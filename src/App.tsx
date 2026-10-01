import { lazy, Suspense, useEffect, useState } from 'react'
import { ErrorBoundary } from './components/ErrorBoundary'
import { FlatMachine } from './components/FlatMachine'
import { ManualDrawer } from './components/ManualDrawer'
import { SiteNav } from './components/SiteNav'
import { SettingsPanel } from './components/SettingsPanel'
import { SignalPath } from './components/SignalPath'
import { TapePanel } from './components/TapePanel'
import { decodeKey } from './enigma/share'
import { useEnigma } from './store'
import { hasWebGL2 } from './three/webgl'

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

type FlatReason = 'unsupported' | 'crashed' | 'chosen'

const VIEW_KEY = 'enigma.view'

function initialView(): { flat: boolean; reason: FlatReason | null } {
  if (!hasWebGL2()) return { flat: true, reason: 'unsupported' }
  try {
    if (localStorage.getItem(VIEW_KEY) === 'flat') return { flat: true, reason: 'chosen' }
  } catch {
    /* storage blocked: default to 3D */
  }
  return { flat: false, reason: null }
}

const FLAT_NOTES: Record<FlatReason, string> = {
  unsupported: "This browser can't show the 3D machine (it needs WebGL 2), so here's the flat version. Everything else works the same.",
  crashed: 'The 3D view stopped working on this device, so we switched to the flat version.',
  chosen: 'Showing the flat version.',
}

function MachineStage({ fontsReady }: { fontsReady: boolean }) {
  const [view, setView] = useState(initialView)
  const goFlat = (reason: FlatReason) => setView({ flat: true, reason })
  const remember = (flat: boolean) => {
    try {
      if (flat) localStorage.setItem(VIEW_KEY, 'flat')
      else localStorage.removeItem(VIEW_KEY)
    } catch {
      /* ignore */
    }
  }

  if (view.flat) {
    return (
      <div className="stage flat-stage">
        <FlatMachine />
        <div className="stage-note">
          <span>{FLAT_NOTES[view.reason ?? 'chosen']}</span>
          {view.reason !== 'unsupported' && (
            <button
              className="link"
              onClick={() => {
                remember(false)
                setView({ flat: false, reason: null })
              }}
            >
              Try 3D
            </button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="stage">
      <ErrorBoundary fallback={() => null} onError={() => goFlat('crashed')}>
        {fontsReady ? (
          <Suspense fallback={<div className="stage-loading">Assembling the machine…</div>}>
            <MachineScene onContextLost={() => goFlat('crashed')} />
          </Suspense>
        ) : (
          <div className="stage-loading">Assembling the machine…</div>
        )}
      </ErrorBoundary>
      <p className="stage-hint">Click keys or type · drag to look around · click a rotor to turn it</p>
      <button
        className="stage-switch"
        onClick={() => {
          remember(true)
          goFlat('chosen')
        }}
      >
        Flat view
      </button>
    </div>
  )
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
          <SiteNav current="machine" />
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
          <MachineStage fontsReady={fontsReady} />
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
