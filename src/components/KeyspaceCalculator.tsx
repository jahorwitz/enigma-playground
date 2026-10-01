import { useState } from 'react'
import { plugboardCombos } from '../enigma/engine'
import { useEnigma } from '../store'

const fmt = (n: bigint) => n.toLocaleString('en-US')

export function KeyspaceCalculator() {
  const currentPlugs = useEnigma((s) => s.settings.plugs.length)
  const [cables, setCables] = useState(10)
  const [wheels, setWheels] = useState(5)
  const orders = BigInt(wheels * (wheels - 1) * (wheels - 2))
  const positions = 26n ** 3n
  const plugs = plugboardCombos(cables)
  const total = orders * positions * plugs

  return (
    <div className="keyspace">
      <div className="keyspace-controls">
        <label>
          Rotors in the box
          <select value={wheels} onChange={(e) => setWheels(Number(e.target.value))}>
            <option value={5}>5 (Enigma I)</option>
            <option value={8}>8 (Navy M3)</option>
          </select>
        </label>
        <label>
          Plugboard cables <output>{cables}</output>
          <input type="range" min={0} max={13} value={cables} onChange={(e) => setCables(Number(e.target.value))} />
        </label>
      </div>
      <dl>
        <dt>Wheel orders</dt>
        <dd>{fmt(orders)}</dd>
        <dt>Start positions</dt>
        <dd>× {fmt(positions)}</dd>
        <dt>Plugboard wirings</dt>
        <dd>× {fmt(plugs)}</dd>
        <dt className="total">Total</dt>
        <dd className="total">{fmt(total)}</dd>
      </dl>
      <p className="fine">
        Ring settings add a further factor of up to 676 (only the middle and right rings change the stepping), but
        their effect overlaps with the start position, so they are usually left out. Your machine currently has{' '}
        {currentPlugs} cable{currentPlugs === 1 ? '' : 's'} plugged.
      </p>
    </div>
  )
}
