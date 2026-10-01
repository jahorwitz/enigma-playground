import { ALPHABET, plugMap, REFLECTORS, rotorMap, toChar, toNum } from '../enigma/engine'
import { useEnigma } from '../store'
import { HelpButton } from './HelpButton'

const COL = 26
const LEFT = 92
const WIDTH = LEFT + 26 * COL + 8
const BAND = 46
const GAP = 16
const KEYS_Y = 18

const x = (i: number) => LEFT + i * COL + COL / 2

/**
 * A flattened view of the scrambler: each component is a horizontal band whose 26 contacts sit on
 * the band's top and bottom edges. Current flows down through the bands, turns in the reflector,
 * and comes back up by a different route.
 */
export function SignalPath() {
  const settings = useEnigma((s) => s.settings)
  const positions = useEnigma((s) => s.positions)
  const last = useEnigma((s) => s.last)
  const lit = useEnigma((s) => s.lit)

  const plug = plugMap(settings.plugs)
  const refl = [...REFLECTORS[settings.reflector]].map(toNum)

  type Band = { label: string; sub: string; map: number[]; kind: 'plug' | 'rotor' | 'reflector' }
  const bands: Band[] = [
    { label: 'Plugboard', sub: `${settings.plugs.length} cables`, map: plug, kind: 'plug' },
    ...[2, 1, 0].map<Band>((slot) => ({
      label: `${['Left', 'Middle', 'Right'][slot]} · ${settings.rotors[slot]}`,
      sub: `window ${toChar(positions[slot])} · ring ${String(settings.rings[slot] + 1).padStart(2, '0')}`,
      map: rotorMap(settings.rotors[slot], settings.rings[slot], positions[slot]),
      kind: 'rotor',
    })),
    { label: `Reflector ${settings.reflector.replace('UKW-', '')}`, sub: 'turns current back', map: refl, kind: 'reflector' },
  ]
  const top = (b: number) => KEYS_Y + 22 + b * (BAND + GAP)
  const bottom = (b: number) => top(b) + BAND
  const height = bottom(bands.length - 1) + 14

  // Build the highlighted forward and return paths from the last key press.
  let forward = ''
  let back = ''
  let chain: { label: string; from: string; to: string }[] = []
  if (last) {
    const t = last.trace
    const c = t.map((s) => s.output)
    // c: [key, plugIn, R, M, L, refl, L', M', R', plugOut, lamp]
    const fwd = [c[0], c[1], c[2], c[3], c[4]]
    forward = `M ${x(fwd[0])} ${KEYS_Y + 8}`
    for (let b = 0; b < 4; b++) {
      forward += ` L ${x(fwd[b])} ${top(b)} L ${x(fwd[b + 1])} ${bottom(b)}`
    }
    const rt = top(4)
    forward += ` L ${x(c[4])} ${rt} L ${x(c[4])} ${rt + BAND * 0.55}`
    const ret = [c[5], c[6], c[7], c[8], c[9]]
    back = `M ${x(c[4])} ${rt + BAND * 0.55} L ${x(c[5])} ${rt + BAND * 0.55} L ${x(c[5])} ${rt}`
    for (let b = 3; b >= 0; b--) {
      back += ` L ${x(ret[3 - b])} ${bottom(b)} L ${x(ret[4 - b])} ${top(b)}`
    }
    back += ` L ${x(c[9])} ${KEYS_Y + 8}`
    chain = t.slice(1, -1).map((s) => ({ label: s.label.replace('Rotor ', ''), from: toChar(s.input), to: toChar(s.output) }))
  }

  const note = last
    ? last.doubleStep
      ? 'Double step! The middle rotor sat on its notch, so it moved again and carried the left rotor with it.'
      : last.stepped[1]
        ? 'The right rotor passed its notch and carried the middle rotor one place.'
        : 'Only the right rotor stepped on this key press.'
    : null

  return (
    <section className="panel signal" aria-labelledby="signal-h">
      <header className="panel-head">
        <h2 id="signal-h">Signal path</h2>
        <span className="legend">
          <i className="fwd" /> inbound <i className="ret" /> return
        </span>
        <HelpButton topic="rotors" label="How the rotors scramble" />
      </header>

      <div className="signal-scroll">
        <svg viewBox={`0 0 ${WIDTH} ${height}`} role="img" aria-label="Wiring diagram of the current through the machine">
          {/* Letter row: keys in, lamps out */}
          {[...ALPHABET].map((ch, i) => {
            const isKey = last?.input === i
            const isLamp = last?.output === i
            return (
              <g key={ch} transform={`translate(${x(i)} ${KEYS_Y})`}>
                {isLamp && <circle r={10} className={lit === i ? 'lamp-dot on' : 'lamp-dot'} />}
                {isKey && <circle r={10} className="key-dot" />}
                <text className="letter" textAnchor="middle" dy="4">
                  {ch}
                </text>
              </g>
            )
          })}
          <text className="band-label" x={4} y={KEYS_Y + 4}>
            Keys / lamps
          </text>

          {bands.map((b, bi) => (
            <g key={bi}>
              <rect className={`band band-${b.kind}`} x={LEFT} y={top(bi)} width={26 * COL} height={BAND} rx={3} />
              <text className="band-label" x={4} y={top(bi) + 20}>
                {b.label}
              </text>
              <text className="band-sub" x={4} y={top(bi) + 34}>
                {b.sub}
              </text>
              {b.kind === 'reflector'
                ? b.map.map((j, i) =>
                    i < j ? (
                      <path
                        key={i}
                        className="wire"
                        d={`M ${x(i)} ${top(bi)} C ${x(i)} ${top(bi) + BAND * 0.9}, ${x(j)} ${top(bi) + BAND * 0.9}, ${x(j)} ${top(bi)}`}
                      />
                    ) : null,
                  )
                : b.map.map((j, i) =>
                    b.kind === 'plug' && i === j ? (
                      <line key={i} className="wire straight" x1={x(i)} y1={top(bi)} x2={x(i)} y2={bottom(bi)} />
                    ) : (
                      <line key={i} className="wire" x1={x(i)} y1={top(bi)} x2={x(j)} y2={bottom(bi)} />
                    ),
                  )}
              {[...ALPHABET].map((_, i) => (
                <g key={i}>
                  <circle className="contact" cx={x(i)} cy={top(bi)} r={1.8} />
                  {b.kind !== 'reflector' && <circle className="contact" cx={x(i)} cy={bottom(bi)} r={1.8} />}
                </g>
              ))}
            </g>
          ))}

          {last && (
            <>
              <path className="trace fwd" d={forward} />
              <path className="trace ret" d={back} />
            </>
          )}
        </svg>
      </div>

      {last ? (
        <div className="chain">
          <span className="chip key">{toChar(last.input)}</span>
          {chain.map((s, i) => (
            <span className={`chip${i === 4 ? ' turn' : i > 4 ? ' back' : ''}`} key={i} title={s.label}>
              <small>{s.label}</small>
              {s.from}→{s.to}
            </span>
          ))}
          <span className="chip lamp">{toChar(last.output)}</span>
        </div>
      ) : (
        <p className="hint">Press any key to trace its path. The faint lines are the wiring at the current rotor positions; watch them shift as you type.</p>
      )}
      {note && <p className={`step-note${last?.doubleStep ? ' double' : ''}`}>{note}</p>}
    </section>
  )
}
