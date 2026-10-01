import type { CSSProperties } from 'react'
import { ALPHABET, REFLECTOR_NAMES, ROTOR_NAMES, ROTORS, toChar, type MachineSettings, type Positions } from '../enigma/engine'
import { MAX_PLUGS, useEnigma } from '../store'
import { HelpButton } from './HelpButton'

const SLOT_NAMES = ['Left', 'Middle', 'Right']
const QWERTZ = ['QWERTZUIO', 'ASDFGHJK', 'PYXCVBNML']
const PAIR_HUES = [28, 200, 95, 320, 55, 160, 260, 5, 130, 230, 80, 290, 180]

function randomKey(): { settings: MachineSettings; start: Positions } {
  const pick = <T,>(arr: T[]) => arr.splice(Math.floor(Math.random() * arr.length), 1)[0]
  const wheels = ROTOR_NAMES.slice(0, 5)
  const rotors = [pick(wheels), pick(wheels), pick(wheels)] as MachineSettings['rotors']
  const letters = [...ALPHABET]
  const plugs = Array.from({ length: 10 }, () => [pick(letters), pick(letters)].sort().join(''))
  const r = () => Math.floor(Math.random() * 26)
  return { settings: { rotors, rings: [r(), r(), r()], reflector: 'UKW-B', plugs }, start: [r(), r(), r()] }
}

function Stepper({ value, onChange, label, format }: { value: number; onChange: (v: number) => void; label: string; format: (v: number) => string }) {
  return (
    <div className="stepper" aria-label={label}>
      <button onClick={() => onChange(value - 1)} aria-label={`${label} back`}>
        −
      </button>
      <output>{format(value)}</output>
      <button onClick={() => onChange(value + 1)} aria-label={`${label} forward`}>
        +
      </button>
    </div>
  )
}

export function SettingsPanel() {
  const s = useEnigma()
  const { settings, positions } = s
  const pairOf = (ch: string) => settings.plugs.findIndex((p) => p.includes(ch))

  return (
    <section className="panel settings" aria-labelledby="settings-h">
      <header className="panel-head">
        <h2 id="settings-h">Daily key</h2>
        <button
          className="ghost"
          onClick={() => {
            const k = randomKey()
            s.loadKey(k.settings, k.start)
          }}
        >
          Random key
        </button>
      </header>

      <div className="field">
        <div className="field-label">
          Reflector <HelpButton topic="reflector" />
        </div>
        <div className="segmented" role="radiogroup" aria-label="Reflector">
          {REFLECTOR_NAMES.map((r) => (
            <button key={r} role="radio" aria-checked={settings.reflector === r} className={settings.reflector === r ? 'on' : ''} onClick={() => s.setReflector(r)}>
              {r.replace('UKW-', '')}
            </button>
          ))}
        </div>
      </div>

      <div className="field">
        <div className="field-label">
          Rotors <HelpButton topic="rotors" />
        </div>
        <div className="slots">
          {[0, 1, 2].map((slot) => (
            <div className="slot" key={slot}>
              <div className="slot-name">{SLOT_NAMES[slot]}</div>
              <select
                value={settings.rotors[slot]}
                onChange={(e) => s.setRotor(slot, e.target.value)}
                aria-label={`${SLOT_NAMES[slot]} rotor`}
                title={ROTORS[settings.rotors[slot]].introduced}
              >
                {ROTOR_NAMES.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
              <div className="mini-label">Window</div>
              <Stepper label={`${SLOT_NAMES[slot]} window`} value={positions[slot]} onChange={(v) => s.setPosition(slot, v)} format={toChar} />
              <div className="mini-label">
                Ring
              </div>
              <Stepper
                label={`${SLOT_NAMES[slot]} ring`}
                value={settings.rings[slot]}
                onChange={(v) => s.setRing(slot, v)}
                format={(v) => String(((v % 26) + 26) % 26 + 1).padStart(2, '0')}
              />
              <div className="notch">turns next at {ROTORS[settings.rotors[slot]].notches.split('').join(' & ')}</div>
            </div>
          ))}
        </div>
        <p className="hint">
          Ring settings explained <HelpButton topic="rings" label="Ring settings" /> · stepping <HelpButton topic="stepping" label="Stepping" />
        </p>
      </div>

      <div className="field">
        <div className="field-label">
          Plugboard <HelpButton topic="plugboard" />
          <span className="count">
            {settings.plugs.length}/{MAX_PLUGS} cables
          </span>
        </div>
        <div className="plugboard-2d">
          {QWERTZ.map((row) => (
            <div className="plug-row" key={row}>
              {[...row].map((ch) => {
                const i = pairOf(ch)
                const pending = s.pendingPlug === ch.charCodeAt(0) - 65
                return (
                  <button
                    key={ch}
                    className={`plug${i >= 0 ? ' paired' : ''}${pending ? ' pending' : ''}`}
                    style={i >= 0 ? ({ '--h': PAIR_HUES[i % PAIR_HUES.length] } as CSSProperties) : undefined}
                    onClick={() => s.clickSocket(ch.charCodeAt(0) - 65)}
                    aria-pressed={i >= 0}
                    title={i >= 0 ? `${settings.plugs[i]}: click to unplug` : pending ? 'Click another letter to connect' : 'Click to start a cable'}
                  >
                    {ch}
                  </button>
                )
              })}
            </div>
          ))}
        </div>
        <div className="pairs">
          {settings.plugs.length === 0 ? (
            <span className="empty">No cables. Every letter passes straight through. Click two letters to swap them.</span>
          ) : (
            settings.plugs.map((p, i) => (
              <span className="pair" key={p} style={{ '--h': PAIR_HUES[i % PAIR_HUES.length] } as CSSProperties}>
                {p[0]}↔{p[1]}
              </span>
            ))
          )}
          {settings.plugs.length > 0 && (
            <button className="link" onClick={s.clearPlugs}>
              Pull all
            </button>
          )}
        </div>
      </div>
    </section>
  )
}
