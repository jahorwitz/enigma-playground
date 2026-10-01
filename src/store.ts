import { create } from 'zustand'
import {
  DEFAULT_SETTINGS,
  mod,
  pressKey,
  toChar,
  type KeyResult,
  type MachineSettings,
  type Positions,
} from './enigma/engine'
import { decodeKey } from './enigma/share'
import type { TopicId } from './content/topics'

export const MAX_PLUGS = 13

export interface TapeEntry {
  input: number
  output: number
  before: Positions
}

interface State {
  settings: MachineSettings
  positions: Positions
  /** Rotor positions when the current message began; used to rewind for decryption. */
  messageStart: Positions | null
  tape: TapeEntry[]
  last: KeyResult | null
  pressed: number | null
  lit: number | null
  pendingPlug: number | null
  topic: TopicId | null
  hotspots: boolean
  autoTyping: boolean

  press: (letter: number) => void
  release: () => void
  undo: () => void
  clearTape: () => void
  rewind: () => void
  setRotor: (slot: number, name: string) => void
  setRing: (slot: number, ring: number) => void
  setPosition: (slot: number, pos: number) => void
  nudgePosition: (slot: number, delta: number) => void
  setReflector: (name: string) => void
  clickSocket: (letter: number) => void
  clearPlugs: () => void
  loadKey: (settings: MachineSettings, start: Positions) => void
  openTopic: (topic: TopicId | null) => void
  toggleHotspots: () => void
  setAutoTyping: (on: boolean) => void
}

const fromHash = typeof window !== 'undefined' ? decodeKey(window.location.hash) : null

export const useEnigma = create<State>((set, get) => ({
  settings: fromHash?.settings ?? DEFAULT_SETTINGS,
  positions: fromHash?.start ?? [0, 0, 0],
  messageStart: null,
  tape: [],
  last: null,
  pressed: null,
  lit: null,
  pendingPlug: null,
  topic: null,
  hotspots: true,
  autoTyping: false,

  press: (letter) => {
    const { settings, positions, pressed, tape, messageStart } = get()
    if (pressed !== null) return // one key at a time, like the real interlock
    const r = pressKey(settings, positions, letter)
    set({
      positions: r.after,
      last: r,
      pressed: letter,
      lit: r.output,
      messageStart: tape.length === 0 ? positions : messageStart,
      tape: [...tape, { input: letter, output: r.output, before: positions }],
    })
  },
  release: () => set({ pressed: null, lit: null }),
  undo: () => {
    const { tape } = get()
    const prev = tape[tape.length - 1]
    if (!prev) return
    set({ tape: tape.slice(0, -1), positions: prev.before, last: null, lit: null, pressed: null })
  },
  clearTape: () => set({ tape: [], messageStart: null, last: null }),
  rewind: () => {
    const { messageStart } = get()
    if (messageStart) set({ positions: messageStart })
    set({ tape: [], messageStart: null, last: null })
  },
  setRotor: (slot, name) => {
    const rotors = [...get().settings.rotors] as MachineSettings['rotors']
    const other = rotors.indexOf(name)
    // Each wheel exists once in the box: choosing one already in use swaps them.
    if (other !== -1) rotors[other] = rotors[slot]
    rotors[slot] = name
    set({ settings: { ...get().settings, rotors }, last: null })
  },
  setRing: (slot, ring) => {
    const rings = [...get().settings.rings] as Positions
    rings[slot] = mod(ring, 26)
    set({ settings: { ...get().settings, rings }, last: null })
  },
  setPosition: (slot, pos) => {
    const positions = [...get().positions] as Positions
    positions[slot] = mod(pos, 26)
    set({ positions, last: null })
  },
  nudgePosition: (slot, delta) => get().setPosition(slot, get().positions[slot] + delta),
  setReflector: (reflector) => set({ settings: { ...get().settings, reflector }, last: null }),
  clickSocket: (letter) => {
    const { pendingPlug, settings } = get()
    const ch = toChar(letter)
    const existing = settings.plugs.find((p) => p.includes(ch))
    if (existing) {
      set({ settings: { ...settings, plugs: settings.plugs.filter((p) => p !== existing) }, pendingPlug: null, last: null })
      return
    }
    if (pendingPlug === null) {
      if (settings.plugs.length >= MAX_PLUGS) return
      set({ pendingPlug: letter })
      return
    }
    if (pendingPlug === letter) {
      set({ pendingPlug: null })
      return
    }
    const pair = [toChar(pendingPlug), ch].sort().join('')
    set({ settings: { ...settings, plugs: [...settings.plugs, pair] }, pendingPlug: null, last: null })
  },
  clearPlugs: () => set({ settings: { ...get().settings, plugs: [] }, pendingPlug: null, last: null }),
  loadKey: (settings, start) => set({ settings, positions: start, tape: [], messageStart: null, last: null }),
  openTopic: (topic) => set({ topic }),
  toggleHotspots: () => set({ hotspots: !get().hotspots }),
  setAutoTyping: (autoTyping) => set({ autoTyping }),
}))

if (import.meta.env.DEV) (window as unknown as { enigma: typeof useEnigma }).enigma = useEnigma
