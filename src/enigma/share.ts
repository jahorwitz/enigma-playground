import { REFLECTORS, ROTORS, toChar, toNum, type MachineSettings, type Positions } from './engine'

// Settings travel in the URL hash, e.g. #w=I-II-III&r=01-01-01&u=B&p=AB.CD&s=AAA

export function encodeKey(settings: MachineSettings, start: Positions) {
  const params = new URLSearchParams({
    w: settings.rotors.join('-'),
    r: settings.rings.map((n) => String(n + 1).padStart(2, '0')).join('-'),
    u: settings.reflector.replace('UKW-', ''),
    p: settings.plugs.join('.'),
    s: start.map(toChar).join(''),
  })
  return params.toString()
}

export function decodeKey(hash: string): { settings: MachineSettings; start: Positions } | null {
  try {
    const q = new URLSearchParams(hash.replace(/^#/, ''))
    const rotors = q.get('w')?.split('-')
    const rings = q.get('r')?.split('-').map((n) => Number(n) - 1)
    const reflector = `UKW-${q.get('u') ?? 'B'}`
    const plugs = (q.get('p') ?? '').split('.').filter(Boolean).map((p) => p.toUpperCase())
    const start = [...(q.get('s') ?? 'AAA').toUpperCase()].map(toNum)
    if (!rotors || rotors.length !== 3 || !rotors.every((r) => r in ROTORS)) return null
    if (new Set(rotors).size !== 3) return null
    if (!rings || rings.length !== 3 || rings.some((n) => !(n >= 0 && n < 26))) return null
    if (!(reflector in REFLECTORS)) return null
    if (start.length !== 3 || start.some((n) => !(n >= 0 && n < 26))) return null
    const used = plugs.join('')
    if (!/^[A-Z]*$/.test(used) || new Set(used).size !== used.length || plugs.some((p) => p.length !== 2)) return null
    return {
      settings: { rotors: rotors as MachineSettings['rotors'], rings: rings as Positions, reflector, plugs },
      start: start as Positions,
    }
  } catch {
    return null
  }
}

/** A human-readable key sheet line, in the spirit of a daily Tagesschlüssel. */
export function keySheet(settings: MachineSettings, start: Positions) {
  const rings = settings.rings.map((n) => String(n + 1).padStart(2, '0')).join(' ')
  const plugs = settings.plugs.length ? settings.plugs.join(' ') : '—'
  return [
    `Reflector  ${settings.reflector}`,
    `Rotors     ${settings.rotors.join(' ')}`,
    `Rings      ${rings}`,
    `Plugboard  ${plugs}`,
    `Start      ${start.map(toChar).join(' ')}`,
  ].join('\n')
}
