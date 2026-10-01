import { useEffect, useMemo, useRef, useState } from 'react'
import { toChar } from '../enigma/engine'
import {
  BombeCore,
  scramblerTable,
  startFromIndex,
  stepSequence,
  TOTAL_STARTS,
  WHEEL_ORDERS,
  type Menu,
  type Start,
  type Stop,
  type WheelOrder,
} from './bombe'
import type { Selection } from './CodebreakingApp'

const MAX_KEPT = 300
type Pace = 'fast' | 'slow'

interface Progress {
  orderIdx: number
  start: Start
  tested: number
  stopCount: number
  /** Stops per wheel order index; -1 = not run yet. */
  perOrder: number[]
  done: boolean
  ms: number
}

const fresh = (): Progress => ({
  orderIdx: 0,
  start: [0, 0, 0],
  tested: 0,
  stopCount: 0,
  perOrder: new Array(WHEEL_ORDERS.length).fill(-1),
  done: false,
  ms: 0,
})

export function BombeStep({
  menu,
  diagonalBoard,
  onDiagonalBoard,
  selected,
  onSelect,
}: {
  menu: Menu
  diagonalBoard: boolean
  onDiagonalBoard: (on: boolean) => void
  selected: Selection | null
  onSelect: (s: Selection) => void
}) {
  const [running, setRunning] = useState(false)
  const [pace, setPace] = useState<Pace>('fast')
  const [scope, setScope] = useState<'all' | number>('all')
  const [progress, setProgress] = useState<Progress>(fresh)
  const [stops, setStops] = useState<Stop[]>([])
  const job = useRef<{ orders: number[]; k: number; pos: number; table: Uint8Array | null; core: BombeCore; t0: number } | null>(null)
  const raf = useRef(0)

  useEffect(() => () => cancelAnimationFrame(raf.current), [])

  const start = () => {
    const orders = scope === 'all' ? WHEEL_ORDERS.map((_, i) => i) : [scope]
    job.current = { orders, k: 0, pos: 0, table: null, core: new BombeCore(menu, diagonalBoard), t0: performance.now() }
    const p = fresh()
    const found: Stop[] = []
    let stopCount = 0
    setStops([])
    setRunning(true)

    const tick = () => {
      const j = job.current
      if (!j) return
      const budgetEnd = performance.now() + 12
      const perFrameCap = pace === 'slow' ? 90 : Infinity
      let n = 0
      let last: Start = [0, 0, 0]
      while (j.k < j.orders.length && performance.now() < budgetEnd && n < perFrameCap) {
        const oi = j.orders[j.k]
        const order = WHEEL_ORDERS[oi]
        if (!j.table) {
          j.table = scramblerTable(order)
          p.perOrder[oi] = 0
        }
        const end = Math.min(TOTAL_STARTS, j.pos + (pace === 'slow' ? perFrameCap - n : 512))
        for (; j.pos < end; j.pos++, n++) {
          const s = startFromIndex(j.pos)
          last = s
          const alive = j.core.testStart(j.table, order, s)
          if (alive.length) {
            stopCount++
            p.perOrder[oi]++
            if (found.length < MAX_KEPT) found.push({ order, start: s, hypotheses: alive })
          }
        }
        if (j.pos >= TOTAL_STARTS) {
          j.k++
          j.pos = 0
          j.table = null
        }
      }
      const finished = j.k >= j.orders.length
      setProgress({
        orderIdx: j.orders[Math.min(j.k, j.orders.length - 1)],
        start: last,
        tested: j.k * TOTAL_STARTS + j.pos,
        stopCount,
        perOrder: [...p.perOrder],
        done: finished,
        ms: performance.now() - j.t0,
      })
      setStops([...found])
      if (finished) {
        job.current = null
        setRunning(false)
      } else raf.current = requestAnimationFrame(tick)
    }
    raf.current = requestAnimationFrame(tick)
  }

  const stop = () => {
    cancelAnimationFrame(raf.current)
    job.current = null
    setRunning(false)
  }

  const shown = selected?.stop ?? stops[0]
  const totalToTest = (scope === 'all' ? WHEEL_ORDERS.length : 1) * TOTAL_STARTS
  const order = WHEEL_ORDERS[progress.orderIdx]
  const bombeHours = ((scope === 'all' ? 60 : 1) * 15) / 60

  return (
    <div className="bombe">
      <div className="bombe-controls">
        <label className="toggle">
          <input type="checkbox" checked={diagonalBoard} disabled={running} onChange={(e) => onDiagonalBoard(e.target.checked)} />
          <span>Diagonal board</span>
        </label>
        <label>
          Wheel orders
          <select value={String(scope)} disabled={running} onChange={(e) => setScope(e.target.value === 'all' ? 'all' : Number(e.target.value))}>
            <option value="all">All 60</option>
            {WHEEL_ORDERS.map((o, i) => (
              <option key={i} value={i}>
                {o.join(' ')}
              </option>
            ))}
          </select>
        </label>
        <label>
          Pace
          <select value={pace} disabled={running} onChange={(e) => setPace(e.target.value as Pace)}>
            <option value="fast">Full speed</option>
            <option value="slow">Slow, to watch the drums</option>
          </select>
        </label>
        {running ? (
          <button onClick={stop}>Stop</button>
        ) : (
          <button className="primary" onClick={start}>
            {progress.tested ? 'Run again' : 'Run the Bombe'}
          </button>
        )}
      </div>

      <BombeFace
        menu={menu}
        order={running || !shown ? order : shown.order}
        start={running || !shown ? progress.start : shown.start}
        running={running}
      />
      {!running && shown && (
        <p className="fine">
          Drums shown at the {selected ? 'stop being tested' : 'first stop'}: {shown.order.join(' ')} starting at{' '}
          {shown.start.map(toChar).join('')}.
        </p>
      )}

      <div className="bombe-status">
        <div className="bombe-meter">
          <div className="bar" style={{ transform: `scaleX(${progress.tested / totalToTest})` }} />
        </div>
        <div className="bombe-readout">
          <span>
            Wheel order <b>{order.join(' ')}</b>
          </span>
          <span>
            {progress.tested.toLocaleString('en-US')} / {totalToTest.toLocaleString('en-US')} settings
          </span>
          <span>
            <b className={progress.stopCount ? 'red' : ''}>{progress.stopCount}</b> stop{progress.stopCount === 1 ? '' : 's'}
          </span>
          {progress.done && <span>{(progress.ms / 1000).toFixed(1)} s</span>}
        </div>
        {progress.done && (
          <p className="fine">
            A real Bombe took about a quarter of an hour per wheel order, so this run would have kept one machine busy
            for roughly {bombeHours < 1 ? `${Math.round(bombeHours * 60)} minutes` : `${Math.round(bombeHours)} hours`}.
            By the end of the war Britain had built over 200 of them.
          </p>
        )}
      </div>

      {scope === 'all' && (
        <div className="battery" aria-label="Stops per wheel order">
          {WHEEL_ORDERS.map((o, i) => {
            const c = progress.perOrder[i]
            return (
              <span
                key={i}
                className={`battery-cell${c === -1 ? '' : c > 0 ? ' hit' : ' clear'}${running && i === progress.orderIdx ? ' cur' : ''}`}
                title={`${o.join(' ')}: ${c === -1 ? 'not run' : `${c} stop${c === 1 ? '' : 's'}`}`}
              >
                {o.join('·')}
                {c > 0 && <b>{c}</b>}
              </span>
            )
          })}
        </div>
      )}

      {stops.length > 0 && (
        <div className="stops">
          <div className="stops-head">
            <span>Stops</span>
            <span className="fine">Each is a candidate key. Test them on the checking machine.</span>
          </div>
          {progress.stopCount > 40 && (
            <p className="warn">
              {progress.stopCount.toLocaleString('en-US')} stops is far too many to check by hand. The menu is too weak
              {diagonalBoard ? '' : ' (try switching the diagonal board back on)'}. Bletchley would have looked for a
              better crib.
            </p>
          )}
          <ol className="stops-list">
            {stops.slice(0, 40).map((s, i) =>
              s.hypotheses.slice(0, 3).map((h) => {
                const isSel =
                  selected?.stop.order.join() === s.order.join() &&
                  selected?.stop.start.join() === s.start.join() &&
                  selected.hypothesis === h
                return (
                  <li key={`${i}-${h}`} className={isSel ? 'on' : ''}>
                    <span className="mono">{s.order.join(' ')}</span>
                    <span className="mono">{s.start.map(toChar).join('')}</span>
                    <span className="mono">
                      {toChar(menu.testLetter)}↔{toChar(h)}
                    </span>
                    <button className="link" onClick={() => onSelect({ stop: s, hypothesis: h })}>
                      {isSel ? 'Testing' : 'Test'}
                    </button>
                  </li>
                )
              }),
            )}
          </ol>
        </div>
      )}
      {progress.done && progress.stopCount === 0 && (
        <p className="warn">
          No stops at all. Either the crib is wrong or it's in the wrong place. Go back to step 2 and try another
          position or crib.
        </p>
      )}
    </div>
  )
}

/** One column of three drums per menu link, showing the rotor positions under test. */
function BombeFace({ menu, order, start, running }: { menu: Menu; order: WheelOrder; start: Start; running: boolean }) {
  const seq = useMemo(() => stepSequence(order, start, menu.maxIndex), [order, start, menu.maxIndex])
  return (
    <div className={`bombe-face${running ? ' running' : ''}`}>
      {menu.edges.map((e, i) => {
        const base = seq[e.index] / 26
        const letters = [Math.floor(base / 676), Math.floor(base / 26) % 26, base % 26]
        return (
          <div className="drum-col" key={i}>
            {letters.map((l, k) => (
              <span key={k} className={`drum d${k}`}>
                {toChar(l)}
              </span>
            ))}
            <span className="drum-label">
              {toChar(e.a)}
              {toChar(e.b)}
              <small>{e.index + 1}</small>
            </span>
          </div>
        )
      })}
    </div>
  )
}
