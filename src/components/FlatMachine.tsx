import { toChar, toNum } from '../enigma/engine'
import { useEnigma } from '../store'

const QWERTZ = ['QWERTZUIO', 'ASDFGHJK', 'PYXCVBNML']

/** A 2D stand-in for the 3D machine, used when WebGL isn't available or the user prefers it. */
export function FlatMachine() {
  const rotors = useEnigma((s) => s.settings.rotors)
  const reflector = useEnigma((s) => s.settings.reflector)
  const positions = useEnigma((s) => s.positions)
  const lit = useEnigma((s) => s.lit)
  const pressed = useEnigma((s) => s.pressed)
  const { press, release, nudgePosition, openTopic } = useEnigma.getState()

  return (
    <div className="flat">
      <div className="flat-rotors">
        <button className="flat-fixed" onClick={() => openTopic('reflector')} title="Reflector">
          <small>UKW</small>
          {reflector.replace('UKW-', '')}
        </button>
        {[0, 1, 2].map((slot) => (
          <div className="flat-rotor" key={slot}>
            <button onClick={() => nudgePosition(slot, 1)} aria-label={`Turn rotor ${rotors[slot]} forward`}>
              ▲
            </button>
            <div className="flat-window">
              <span className="dim">{toChar(positions[slot] - 1)}</span>
              <span className="cur">{toChar(positions[slot])}</span>
              <span className="dim">{toChar(positions[slot] + 1)}</span>
            </div>
            <button onClick={() => nudgePosition(slot, -1)} aria-label={`Turn rotor ${rotors[slot]} back`}>
              ▼
            </button>
            <small>{rotors[slot]}</small>
          </div>
        ))}
        <button className="flat-fixed" onClick={() => openTopic('rotors')} title="Entry wheel">
          <small>ETW</small>·
        </button>
      </div>

      <div className="flat-board lamps" aria-label="Lampboard">
        {QWERTZ.map((row) => (
          <div className="flat-row" key={row}>
            {[...row].map((ch) => (
              <span key={ch} className={`flat-lamp${lit === toNum(ch) ? ' on' : ''}`}>
                {ch}
              </span>
            ))}
          </div>
        ))}
      </div>

      <div className="flat-board keys" aria-label="Keyboard">
        {QWERTZ.map((row) => (
          <div className="flat-row" key={row}>
            {[...row].map((ch) => (
              <button
                key={ch}
                className={`flat-key${pressed === toNum(ch) ? ' down' : ''}`}
                onPointerDown={(e) => {
                  e.preventDefault()
                  press(toNum(ch))
                }}
                onClick={(e) => {
                  // Keyboard activation (Enter/Space on a focused key) has no pointer events.
                  if (e.detail === 0) {
                    press(toNum(ch))
                    setTimeout(release, 220)
                  }
                }}
                aria-label={`Key ${ch}`}
              >
                {ch}
              </button>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
