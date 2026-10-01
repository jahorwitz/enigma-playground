import { useRef, useState } from 'react'
import { cribClashes } from './bombe'
import { CRIBS } from './intercepts'

const CELL = 26
const MAX_OFFSET = 40

export function CribStep({
  cipher,
  crib,
  placed,
  onCrib,
  onPlace,
}: {
  cipher: string
  crib: string
  placed: number | null
  onCrib: (crib: string) => void
  onPlace: (offset: number) => void
}) {
  const [offset, setOffset] = useState(placed ?? 0)
  const drag = useRef<{ x: number; start: number } | null>(null)
  const maxOffset = Math.min(MAX_OFFSET, cipher.length - crib.length)
  const shown = cipher.slice(0, maxOffset + crib.length)
  const clashes = cribClashes(cipher, crib, offset)
  const possible = Array.from({ length: maxOffset + 1 }, (_, o) => cribClashes(cipher, crib, o).length === 0)
  const survivors = possible.filter(Boolean).length
  const clamp = (o: number) => Math.max(0, Math.min(maxOffset, o))

  return (
    <div className="crib">
      <div className="crib-picker" role="radiogroup" aria-label="Crib">
        {CRIBS.map((c) => (
          <button
            key={c.text}
            role="radio"
            aria-checked={crib === c.text}
            className={`crib-option${crib === c.text ? ' on' : ''}`}
            onClick={() => {
              onCrib(c.text)
              setOffset(0)
            }}
          >
            <span className="crib-word">{c.text}</span>
            <span className="crib-meaning">{c.meaning}</span>
          </button>
        ))}
      </div>

      <div className="crib-strip-scroll">
        <div className="crib-strip" style={{ width: shown.length * CELL }}>
          <div className="crib-row cipher">
            {[...shown].map((ch, i) => {
              const j = i - offset
              const clash = j >= 0 && j < crib.length && clashes.includes(j)
              return (
                <span key={i} className={`cell${clash ? ' clash' : ''}`}>
                  {ch}
                </span>
              )
            })}
          </div>
          <div
            className="crib-row crib-letters"
            style={{ transform: `translateX(${offset * CELL}px)` }}
            onPointerDown={(e) => {
              e.currentTarget.setPointerCapture(e.pointerId)
              drag.current = { x: e.clientX, start: offset }
            }}
            onPointerMove={(e) => {
              if (!drag.current) return
              setOffset(clamp(drag.current.start + Math.round((e.clientX - drag.current.x) / CELL)))
            }}
            onPointerUp={() => (drag.current = null)}
            onPointerCancel={() => (drag.current = null)}
            title="Drag to slide the crib"
          >
            {[...crib].map((ch, j) => (
              <span key={j} className={`cell${clashes.includes(j) ? ' clash' : ''}`}>
                {ch}
              </span>
            ))}
          </div>
          <div className="crib-row index">
            {[...shown].map((_, i) => (
              <span key={i} className="cell">
                {i % 5 === 0 ? i + 1 : ''}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="crib-controls">
        <button onClick={() => setOffset(clamp(offset - 1))} aria-label="Slide crib left">
          ←
        </button>
        <input
          type="range"
          min={0}
          max={maxOffset}
          value={offset}
          onChange={(e) => setOffset(Number(e.target.value))}
          aria-label="Crib position"
        />
        <button onClick={() => setOffset(clamp(offset + 1))} aria-label="Slide crib right">
          →
        </button>
        <span className={`crib-verdict${clashes.length ? ' bad' : ' good'}`}>
          Position {offset + 1}:{' '}
          {clashes.length ? `${clashes.length} clash${clashes.length > 1 ? 'es' : ''}, impossible` : 'no clashes, possible'}
        </span>
      </div>

      <div className="crib-positions">
        <div className="crib-positions-label">
          {survivors} of {maxOffset + 1} positions survive
        </div>
        <div className="crib-positions-row">
          {possible.map((ok, o) => (
            <button
              key={o}
              className={`pos${ok ? ' ok' : ' no'}${o === offset ? ' cur' : ''}${o === placed ? ' placed' : ''}`}
              onClick={() => setOffset(o)}
              title={`Position ${o + 1}: ${ok ? 'possible' : 'ruled out'}`}
            >
              {o + 1}
            </button>
          ))}
        </div>
      </div>

      <div className="crib-commit">
        <button className="primary" disabled={clashes.length > 0 || placed === offset} onClick={() => onPlace(offset)}>
          {placed === offset ? `Crib placed at ${offset + 1}` : `Place crib at position ${offset + 1}`}
        </button>
        {placed !== null && placed !== offset && <span className="fine">Currently placed at {placed + 1}.</span>}
      </div>
      <p className="hint">
        Several positions usually survive. The traffic analysis note is your best guide: does this sender start
        straight in, or with an address first? If the Bombe finds nothing useful later, come back and try another
        position or crib.
      </p>
    </div>
  )
}
