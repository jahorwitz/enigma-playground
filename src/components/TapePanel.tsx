import { useRef, useState } from 'react'
import { groupFive, toChar, toNum } from '../enigma/engine'
import { encodeKey, keySheet } from '../enigma/share'
import { useEnigma } from '../store'
import { HelpButton } from './HelpButton'

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

function useCopy() {
  const [copied, setCopied] = useState<string | null>(null)
  const copy = async (id: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text)
    } catch {
      const ta = document.createElement('textarea')
      ta.value = text
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      ta.remove()
    }
    setCopied(id)
    setTimeout(() => setCopied((c) => (c === id ? null : c)), 1600)
  }
  return { copied, copy }
}

export function TapePanel() {
  const tape = useEnigma((s) => s.tape)
  const messageStart = useEnigma((s) => s.messageStart)
  const settings = useEnigma((s) => s.settings)
  const positions = useEnigma((s) => s.positions)
  const autoTyping = useEnigma((s) => s.autoTyping)
  const { undo, rewind, clearTape, setAutoTyping } = useEnigma.getState()
  const [draft, setDraft] = useState('')
  const cancel = useRef(false)
  const { copied, copy } = useCopy()

  const input = tape.map((t) => toChar(t.input)).join('')
  const output = tape.map((t) => toChar(t.output)).join('')
  const start = messageStart ?? positions
  const letters = draft.toUpperCase().replace(/[^A-Z]/g, '')

  const autoType = async () => {
    if (!letters) return
    cancel.current = false
    setAutoTyping(true)
    const { press, release } = useEnigma.getState()
    for (const ch of letters) {
      if (cancel.current) break
      press(toNum(ch))
      await sleep(letters.length > 60 ? 90 : 200)
      release()
      await sleep(letters.length > 60 ? 30 : 70)
    }
    setAutoTyping(false)
    setDraft('')
  }

  const shareLink = () => {
    const url = new URL(window.location.href)
    url.hash = encodeKey(settings, start)
    return url.toString()
  }

  return (
    <section className="panel tape" aria-labelledby="tape-h">
      <header className="panel-head">
        <h2 id="tape-h">Message tape</h2>
        <HelpButton topic="lampboard" label="About the lampboard" />
      </header>

      <div className="tape-block out">
        <div className="tape-label">
          <span>Lamps lit</span>
          <button className="link" disabled={!output} onClick={() => copy('out', groupFive(output))}>
            {copied === 'out' ? 'Copied' : 'Copy'}
          </button>
        </div>
        <div className="tape-text" aria-live="polite">
          {output ? groupFive(output) : <span className="placeholder">Press a key. The letter that lights up appears here.</span>}
          {output && <span className="caret" />}
        </div>
      </div>

      <div className="tape-block in">
        <div className="tape-label">
          <span>Keys pressed</span>
          <button className="link" disabled={!input} onClick={() => copy('in', groupFive(input))}>
            {copied === 'in' ? 'Copied' : 'Copy'}
          </button>
        </div>
        <div className="tape-text small">{input ? groupFive(input) : <span className="placeholder">—</span>}</div>
      </div>

      <div className="tape-meta">
        <span>
          {tape.length} letter{tape.length === 1 ? '' : 's'} · began at <b>{start.map(toChar).join(' ')}</b>
        </span>
      </div>

      <div className="tape-actions">
        <button onClick={undo} disabled={!tape.length || autoTyping} title="Backspace">
          Undo
        </button>
        <button className="primary" onClick={rewind} disabled={!tape.length || autoTyping} title="Turn the rotors back to where this message began and clear the tape">
          Rewind to {start.map(toChar).join('')}
        </button>
        <button onClick={clearTape} disabled={!tape.length || autoTyping} title="Clear the tape but leave the rotors where they are">
          Clear
        </button>
      </div>
      <p className="hint">
        To decrypt: <em>Rewind</em>, then type the ciphertext. The machine is its own inverse.
      </p>

      <div className="autotype">
        <label htmlFor="autotype">Type a whole message</label>
        <textarea
          id="autotype"
          rows={3}
          placeholder="Paste plaintext or a friend's ciphertext…"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          disabled={autoTyping}
        />
        <div className="autotype-row">
          <span className="fine">{letters.length ? `${letters.length} letters; spaces and punctuation are skipped` : 'Only A–Z can be typed on an Enigma.'}</span>
          {autoTyping ? (
            <button onClick={() => (cancel.current = true)}>Stop</button>
          ) : (
            <button className="primary" disabled={!letters} onClick={autoType}>
              Type it
            </button>
          )}
        </div>
      </div>

      <div className="share">
        <div className="tape-label">
          <span>Share with a friend</span>
          <HelpButton topic="procedure" label="Operating procedure" />
        </div>
        <pre className="keysheet">{keySheet(settings, start)}</pre>
        <div className="share-row">
          <button onClick={() => copy('link', shareLink())}>{copied === 'link' ? 'Link copied' : 'Copy key link'}</button>
          <button
            onClick={() =>
              copy('all', `${groupFive(output)}\n\nKey sheet:\n${keySheet(settings, start)}\n\nDecrypt at: ${shareLink()}`)
            }
            disabled={!output}
          >
            {copied === 'all' ? 'Copied' : 'Copy message + key'}
          </button>
        </div>
        <p className="fine">The link loads these exact settings. In wartime the key sheet travelled by courier, never with the message.</p>
      </div>
    </section>
  )
}
