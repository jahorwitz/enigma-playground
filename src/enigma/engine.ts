// A faithful model of the Wehrmacht Enigma I / Kriegsmarine M3.
// Letters are represented as numbers 0–25 (A–Z) throughout.

export const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'

export const toNum = (ch: string) => ch.toUpperCase().charCodeAt(0) - 65
export const toChar = (n: number) => ALPHABET[mod(n, 26)]
export const mod = (n: number, m: number) => ((n % m) + m) % m

export interface RotorSpec {
  name: string
  wiring: string
  notches: string
  introduced: string
}

export const ROTORS: Record<string, RotorSpec> = {
  I: { name: 'I', wiring: 'EKMFLGDQVZNTOWYHXUSPAIBRCJ', notches: 'Q', introduced: '1930 · Enigma I' },
  II: { name: 'II', wiring: 'AJDKSIRUXBLHWTMCQGZNPYFVOE', notches: 'E', introduced: '1930 · Enigma I' },
  III: { name: 'III', wiring: 'BDFHJLCPRTXVZNYEIWGAKMUSQO', notches: 'V', introduced: '1930 · Enigma I' },
  IV: { name: 'IV', wiring: 'ESOVPZJAYQUIRHXLNFTGKDCMWB', notches: 'J', introduced: '1938 · M3 Army' },
  V: { name: 'V', wiring: 'VZBRGITYUPSDNHLXAWMJQOFECK', notches: 'Z', introduced: '1938 · M3 Army' },
  VI: { name: 'VI', wiring: 'JPGVOUMFYQBENHZRDKASXLICTW', notches: 'ZM', introduced: '1939 · M3 Navy' },
  VII: { name: 'VII', wiring: 'NZJHGRCXMYSWBOUFAIVLPEKQDT', notches: 'ZM', introduced: '1939 · M3 Navy' },
  VIII: { name: 'VIII', wiring: 'FKQHTLXOCBJSPDZRAMEWNIUYGV', notches: 'ZM', introduced: '1939 · M3 Navy' },
}

export const REFLECTORS: Record<string, string> = {
  'UKW-A': 'EJMZALYXVBWFCRQUONTSPIKHGD',
  'UKW-B': 'YRUHQSLDPXNGOKMIEBFZCWVJAT',
  'UKW-C': 'FVPJIAOYEDRZXWGCTKUQSBNMHL',
}

export const ROTOR_NAMES = Object.keys(ROTORS)
export const REFLECTOR_NAMES = Object.keys(REFLECTORS)

/** Rotor slots are ordered left, middle, right — the way an operator reads them. */
export interface MachineSettings {
  rotors: [string, string, string]
  rings: [number, number, number]
  reflector: string
  /** Plugboard pairs, e.g. ['AB', 'CD']. */
  plugs: string[]
}

export type Positions = [number, number, number]

export type StageKind = 'keyboard' | 'plugboard' | 'rotor' | 'reflector' | 'lamp'

export interface TraceStage {
  kind: StageKind
  label: string
  /** For rotors: which slot (0 = left, 1 = middle, 2 = right). */
  slot?: number
  direction: 'in' | 'out' | 'turn'
  input: number
  output: number
}

export interface KeyResult {
  input: number
  output: number
  before: Positions
  after: Positions
  /** Which rotor slots stepped on this key press. */
  stepped: [boolean, boolean, boolean]
  doubleStep: boolean
  trace: TraceStage[]
}

export const DEFAULT_SETTINGS: MachineSettings = {
  rotors: ['I', 'II', 'III'],
  rings: [0, 0, 0],
  reflector: 'UKW-B',
  plugs: [],
}

export function plugMap(plugs: string[]): number[] {
  const map = Array.from({ length: 26 }, (_, i) => i)
  for (const pair of plugs) {
    const a = toNum(pair[0])
    const b = toNum(pair[1])
    map[a] = b
    map[b] = a
  }
  return map
}

const atNotch = (rotor: string, pos: number) => ROTORS[rotor].notches.includes(toChar(pos))

/**
 * Advance the rotors exactly as the pawl-and-ratchet mechanism does, including the
 * famous "double step" of the middle rotor.
 */
export function step(settings: MachineSettings, pos: Positions) {
  const M = settings.rotors[1]
  const next: Positions = [...pos]
  const stepped: [boolean, boolean, boolean] = [false, false, true]
  let doubleStep = false

  const middleAtNotch = atNotch(M, pos[1])
  const rightAtNotch = atNotch(settings.rotors[2], pos[2])

  if (middleAtNotch) {
    // The middle pawl drops into the middle rotor's own notch and pushes both it
    // and the left rotor forward.
    next[0] = mod(pos[0] + 1, 26)
    next[1] = mod(pos[1] + 1, 26)
    stepped[0] = true
    stepped[1] = true
    doubleStep = !rightAtNotch
  } else if (rightAtNotch) {
    next[1] = mod(pos[1] + 1, 26)
    stepped[1] = true
  }
  next[2] = mod(pos[2] + 1, 26)
  return { next, stepped, doubleStep }
}

function throughRotor(rotor: string, ring: number, pos: number, c: number, inverse: boolean) {
  const wiring = ROTORS[rotor].wiring
  const shift = pos - ring
  const enter = mod(c + shift, 26)
  const out = inverse ? wiring.indexOf(toChar(enter)) : toNum(wiring[enter])
  return mod(out - shift, 26)
}

/** The full 26-contact mapping of one rotor at a given position, for diagrams. */
export function rotorMap(rotor: string, ring: number, pos: number) {
  return Array.from({ length: 26 }, (_, c) => throughRotor(rotor, ring, pos, c, false))
}

/** Encrypt one letter. Rotors step first, then current flows through the machine. */
export function pressKey(settings: MachineSettings, pos: Positions, input: number): KeyResult {
  const { next, stepped, doubleStep } = step(settings, pos)
  const plug = plugMap(settings.plugs)
  const trace: TraceStage[] = []
  const push = (stage: Omit<TraceStage, 'output'>, output: number) => {
    trace.push({ ...stage, output })
    return output
  }

  let c = input
  push({ kind: 'keyboard', label: 'Key', direction: 'in', input: c }, c)
  c = push({ kind: 'plugboard', label: 'Plugboard', direction: 'in', input: c }, plug[c])
  for (const slot of [2, 1, 0]) {
    c = push(
      { kind: 'rotor', label: `Rotor ${settings.rotors[slot]}`, slot, direction: 'in', input: c },
      throughRotor(settings.rotors[slot], settings.rings[slot], next[slot], c, false),
    )
  }
  c = push(
    { kind: 'reflector', label: settings.reflector, direction: 'turn', input: c },
    toNum(REFLECTORS[settings.reflector][c]),
  )
  for (const slot of [0, 1, 2]) {
    c = push(
      { kind: 'rotor', label: `Rotor ${settings.rotors[slot]}`, slot, direction: 'out', input: c },
      throughRotor(settings.rotors[slot], settings.rings[slot], next[slot], c, true),
    )
  }
  c = push({ kind: 'plugboard', label: 'Plugboard', direction: 'out', input: c }, plug[c])
  push({ kind: 'lamp', label: 'Lamp', direction: 'out', input: c }, c)

  return { input, output: c, before: pos, after: next, stepped, doubleStep, trace }
}

/** Convenience: encrypt a whole string, ignoring anything that is not A–Z. */
export function encryptText(settings: MachineSettings, start: Positions, text: string) {
  let pos = start
  let out = ''
  for (const ch of text.toUpperCase()) {
    if (ch < 'A' || ch > 'Z') continue
    const r = pressKey(settings, pos, toNum(ch))
    out += toChar(r.output)
    pos = r.after
  }
  return { text: out, positions: pos }
}

/** Groups of five, as cipher clerks wrote them out for transmission. */
export const groupFive = (s: string) => s.replace(/(.{5})(?=.)/g, '$1 ')

/** Number of ways to wire n cables into a 26-socket plugboard: 26! / ((26-2n)! · n! · 2^n). */
export function plugboardCombos(n: number): bigint {
  const fact = (k: number) => {
    let r = 1n
    for (let i = 2n; i <= BigInt(k); i++) r *= i
    return r
  }
  return fact(26) / (fact(26 - 2 * n) * fact(n) * 2n ** BigInt(n))
}
