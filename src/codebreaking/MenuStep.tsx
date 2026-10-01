import { useMemo } from 'react'
import { toChar } from '../enigma/engine'
import type { Menu } from './bombe'

const W = 560
const H = 380

/** A small deterministic force layout: springs along links, repulsion between letters. */
function layout(menu: Menu) {
  const nodes = menu.letters
  const n = nodes.length
  const pos = nodes.map((_, i) => {
    const a = (i / n) * Math.PI * 2
    return { x: W / 2 + Math.cos(a) * 140, y: H / 2 + Math.sin(a) * 120 }
  })
  const idx = new Map(nodes.map((l, i) => [l, i]))
  const links = menu.edges.map((e) => [idx.get(e.a)!, idx.get(e.b)!] as const).filter(([a, b]) => a !== b)
  for (let it = 0; it < 600; it++) {
    const cool = 1 - it / 600
    const fx = new Float64Array(n)
    const fy = new Float64Array(n)
    for (let i = 0; i < n; i++)
      for (let j = i + 1; j < n; j++) {
        const dx = pos[i].x - pos[j].x
        const dy = pos[i].y - pos[j].y
        const d2 = Math.max(dx * dx + dy * dy, 25)
        const f = 3200 / d2
        const d = Math.sqrt(d2)
        fx[i] += (dx / d) * f
        fy[i] += (dy / d) * f
        fx[j] -= (dx / d) * f
        fy[j] -= (dy / d) * f
      }
    for (const [a, b] of links) {
      const dx = pos[b].x - pos[a].x
      const dy = pos[b].y - pos[a].y
      const d = Math.max(Math.hypot(dx, dy), 0.01)
      const f = (d - 72) * 0.06
      fx[a] += (dx / d) * f
      fy[a] += (dy / d) * f
      fx[b] -= (dx / d) * f
      fy[b] -= (dy / d) * f
    }
    for (let i = 0; i < n; i++) {
      fx[i] += (W / 2 - pos[i].x) * 0.012
      fy[i] += (H / 2 - pos[i].y) * 0.012
      const m = Math.hypot(fx[i], fy[i])
      const cap = 12 * cool + 0.5
      const k = m > cap ? cap / m : 1
      pos[i].x += fx[i] * k
      pos[i].y += fy[i] * k
    }
  }
  // Fit to the viewBox.
  const xs = pos.map((p) => p.x)
  const ys = pos.map((p) => p.y)
  const [minX, maxX, minY, maxY] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)]
  const s = Math.min((W - 60) / Math.max(1, maxX - minX), (H - 60) / Math.max(1, maxY - minY), 1.6)
  const ox = (W - (maxX - minX) * s) / 2
  const oy = (H - (maxY - minY) * s) / 2
  return new Map(nodes.map((l, i) => [l, { x: ox + (pos[i].x - minX) * s, y: oy + (pos[i].y - minY) * s }]))
}

export function MenuStep({
  menu,
  crib,
  fullLength,
  cipher,
  offset,
  onLength,
}: {
  menu: Menu
  crib: string
  fullLength: number
  cipher: string
  offset: number
  onLength: (n: number) => void
}) {
  const at = useMemo(() => layout(menu), [menu])

  // Links between the same two letters are drawn as separate arcs.
  const bends = useMemo(() => {
    const seen = new Map<string, number>()
    return menu.edges.map((e) => {
      const k = [e.a, e.b].sort((x, y) => x - y).join('-')
      const i = seen.get(k) ?? 0
      seen.set(k, i + 1)
      return i === 0 ? 0 : (i % 2 ? 1 : -1) * Math.ceil(i / 2) * 26
    })
  }, [menu])

  const rating = menu.loops >= 3 ? 'Strong' : menu.loops >= 1 ? 'Weak' : 'Useless'

  return (
    <div className="menu">
      <label className="menu-length">
        <span>
          Crib letters used <output>{crib.length}</output> of {fullLength}
        </span>
        <input type="range" min={8} max={fullLength} value={crib.length} onChange={(e) => onLength(Number(e.target.value))} />
      </label>
      <div className="menu-pairs" aria-label="Crib aligned with ciphertext">
        {[...crib].map((p, j) => (
          <span key={j} className={`pair-col${menu.edges[j].inLoop ? ' loop' : ''}`}>
            <small>{offset + j + 1}</small>
            <b>{p}</b>
            <b className="c">{cipher[offset + j]}</b>
          </span>
        ))}
      </div>

      <svg className="menu-graph" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Menu graph of letter links">
        {menu.edges.map((e, i) => {
          const a = at.get(e.a)!
          const b = at.get(e.b)!
          const mx = (a.x + b.x) / 2
          const my = (a.y + b.y) / 2
          const dx = b.x - a.x
          const dy = b.y - a.y
          const d = Math.max(Math.hypot(dx, dy), 1)
          const cx = mx + (-dy / d) * bends[i] * 1.6
          const cy = my + (dx / d) * bends[i] * 1.6
          const lx = mx + (-dy / d) * bends[i] * 0.8
          const ly = my + (dx / d) * bends[i] * 0.8
          return (
            <g key={i} className={`menu-edge${e.inLoop ? ' loop' : ''}`}>
              <path d={`M ${a.x} ${a.y} Q ${cx} ${cy} ${b.x} ${b.y}`} />
              <circle cx={lx} cy={ly} r={9} />
              <text x={lx} y={ly} dy="3.5" textAnchor="middle">
                {e.index + 1}
              </text>
            </g>
          )
        })}
        {menu.letters.map((l) => {
          const p = at.get(l)!
          const test = l === menu.testLetter
          return (
            <g key={l} className={`menu-node${test ? ' test' : ''}`} transform={`translate(${p.x} ${p.y})`}>
              {test && <circle r={20} className="halo" />}
              <circle r={14} />
              <text dy="5" textAnchor="middle">
                {toChar(l)}
              </text>
            </g>
          )
        })}
      </svg>

      <div className="menu-stats">
        <div>
          <span className="k">Letters</span>
          <span className="v">{menu.letters.length}</span>
        </div>
        <div>
          <span className="k">Links</span>
          <span className="v">{menu.edges.length}</span>
        </div>
        <div>
          <span className="k">Loops</span>
          <span className="v">{menu.loops}</span>
        </div>
        <div>
          <span className="k">Test letter</span>
          <span className="v">{toChar(menu.testLetter)}</span>
        </div>
        <div className={`menu-rating ${rating.toLowerCase()}`}>{rating} menu</div>
      </div>
      <p className="hint">
        Red links lie on a loop. Each number is a position in the message: the Bombe sets one Enigma-equivalent that
        many steps ahead for that link. The ringed <b>{toChar(menu.testLetter)}</b> is the test letter whose plugboard
        partner the Bombe will guess.
      </p>
    </div>
  )
}
