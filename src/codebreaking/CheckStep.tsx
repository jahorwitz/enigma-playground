import { useMemo, useState, type CSSProperties } from 'react'
import { ALPHABET, groupFive, toChar } from '../enigma/engine'
import { encodeKey } from '../enigma/share'
import { BombeCore, scramblerTable, steckersToPlugs, type Menu } from './bombe'
import type { Selection } from './CodebreakingApp'
import { decrypt, finishPlugboard, germanScore } from './german'
import { settingsFor, type Intercept } from './intercepts'

const QWERTZ = ['QWERTZUIO', 'ASDFGHJK', 'PYXCVBNML']
const RANDOM_SCORE = -7.2
const GERMAN_SCORE = -5.55

export function CheckStep({
  intercept,
  menu,
  selection,
  diagonalBoard,
}: {
  intercept: Intercept
  menu: Menu
  selection: Selection
  diagonalBoard: boolean
}) {
  const { order, start } = selection.stop
  const deduced = useMemo(() => {
    const table = scramblerTable(order)
    const { steckers } = new BombeCore(menu, diagonalBoard).deduce(table, order, start, selection.hypothesis)
    return steckersToPlugs(steckers)
  }, [order, start, menu, selection.hypothesis, diagonalBoard])

  const [plugs, setPlugs] = useState<string[]>(deduced.plugs)
  const [added, setAdded] = useState<string[]>([])
  const [pending, setPending] = useState<number | null>(null)
  const [reveal, setReveal] = useState(false)

  const text = useMemo(() => decrypt(intercept.ciphertext, order, start, plugs), [intercept.ciphertext, order, start, plugs])
  const score = germanScore(text)
  const readability = Math.max(0, Math.min(1, (score - RANDOM_SCORE) / (GERMAN_SCORE - RANDOM_SCORE)))
  const broken = text === intercept.plaintext
  const unknown = [...ALPHABET].filter((_, i) => !deduced.known.has(i))

  const clickLetter = (n: number) => {
    const ch = toChar(n)
    const existing = plugs.find((p) => p.includes(ch))
    if (existing) {
      setPlugs(plugs.filter((p) => p !== existing))
      setPending(null)
    } else if (pending === null) setPending(n)
    else if (pending === n) setPending(null)
    else {
      setPlugs([...plugs, [toChar(pending), ch].sort().join('')])
      setPending(null)
    }
  }

  const finish = () => {
    const r = finishPlugboard(intercept.ciphertext, order, start, plugs, new Set([...deduced.known, ...plugs.join('').split('').map((c) => c.charCodeAt(0) - 65)]))
    setPlugs(r.plugs)
    setAdded(r.added)
  }

  const machineLink = `./#${encodeKey(settingsFor(order, plugs), start)}`

  return (
    <div className="check">
      <div className="check-key">
        <div>
          <span className="k">Wheel order</span>
          <span className="v">{order.join(' ')}</span>
        </div>
        <div>
          <span className="k">Start</span>
          <span className="v">{start.map(toChar).join(' ')}</span>
        </div>
        <div>
          <span className="k">Rings</span>
          <span className="v">A A A</span>
        </div>
        <div>
          <span className="k">Reflector</span>
          <span className="v">B</span>
        </div>
      </div>

      {deduced.conflicts.length > 0 && (
        <p className="warn">
          The deduced cables contradict each other ({deduced.conflicts[0]}). A real plugboard can't do that, so this
          is a false stop.
        </p>
      )}

      <div className="check-plugs">
        <div className="field-label">
          Plugboard
          <span className="count">
            {plugs.length} cable{plugs.length === 1 ? '' : 's'}
          </span>
        </div>
        <div className="plugboard-2d">
          {QWERTZ.map((row) => (
            <div className="plug-row" key={row}>
              {[...row].map((ch) => {
                const n = ch.charCodeAt(0) - 65
                const isPlugged = plugs.some((p) => p.includes(ch))
                const isDeduced = deduced.plugs.some((p) => p.includes(ch))
                const isAdded = added.some((p) => p.includes(ch)) && isPlugged
                return (
                  <button
                    key={ch}
                    className={`plug${isPlugged ? ' paired' : ''}${pending === n ? ' pending' : ''}${!deduced.known.has(n) ? ' unknown' : ''}`}
                    style={isPlugged ? ({ '--h': isDeduced ? 28 : isAdded ? 140 : 230 } as CSSProperties) : undefined}
                    onClick={() => clickLetter(n)}
                    title={isPlugged ? 'Click to unplug' : 'Click two letters to add a cable'}
                  >
                    {ch}
                  </button>
                )
              })}
            </div>
          ))}
        </div>
        <p className="fine">
          <span className="swatch s-deduced" /> deduced by the Bombe · <span className="swatch s-added" /> found by trial ·{' '}
          <span className="swatch s-yours" /> yours · dashed letters weren't pinned down by the menu
          {unknown.length ? ` (${unknown.join(' ')})` : ''}.
        </p>
        <div className="check-actions">
          <button className="primary" onClick={finish} disabled={broken}>
            Finish the plugboard by trial
          </button>
          <button className="ghost" onClick={() => { setPlugs(deduced.plugs); setAdded([]) }}>
            Reset to deduced cables
          </button>
        </div>
      </div>

      <div className="check-output">
        <div className="tape-label">
          <span>Decrypt</span>
          <span className="readability">
            Looks like German
            <span className="meter">
              <span style={{ transform: `scaleX(${readability})` }} />
            </span>
          </span>
        </div>
        <p className="tape-text decrypt">{groupFive(text)}</p>
        <p className="read-as">
          <span className="note-label">Read with X as a space</span>
          {text.split('X').join(' ')}
        </p>
      </div>

      {broken ? (
        <div className="broken">
          <span className="stamp big">Broken</span>
          <p className="translation">“{intercept.template.english}”</p>
          <p className="fine">
            {added.length === 0 && plugs.length === deduced.plugs.length
              ? `The menu alone pinned down all ${plugs.length} cables. `
              : `The menu gave ${deduced.plugs.length} cables; the rest were found by trial. `}
            This is the day's key. Every other signal on this network today can now be read, at least until midnight.
          </p>
          <a className="link" href={machineLink}>
            Open this key on the machine →
          </a>
        </div>
      ) : (
        <p className="hint">
          {readability < 0.35
            ? 'This looks like gibberish: probably a false stop. Try another one.'
            : 'Fragments of German are showing through. Fill in the missing cables, by trial or by hand, until it reads cleanly.'}
        </p>
      )}

      <div className="reveal">
        <button className="link" onClick={() => setReveal((r) => !r)}>
          {reveal ? 'Hide' : 'Show'} the true key
        </button>
        {reveal && (
          <pre className="keysheet">
            {`Rotors     ${intercept.key.order.join(' ')}\nStart      ${intercept.key.start.map(toChar).join(' ')}\nPlugboard  ${[...intercept.key.plugs].sort().join(' ')}\nCrib at    position ${intercept.cribOffset + 1}`}
          </pre>
        )}
      </div>
    </div>
  )
}
