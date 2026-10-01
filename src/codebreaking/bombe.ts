// A software model of the Turing–Welchman Bombe and the steps around it.
//
// Simplifications, all called out on the page:
// - The reflector (UKW-B) is known and the ring settings are AAA, so our Bombe can model the
//   middle rotor's turnover exactly. The real Bombe could not; it assumed no turnover inside the
//   crib, and Hut 6 re-ran menus to cover the turnover cases.
// - Only rotors I–V, as on the army and air force Enigma I.

import { mod, REFLECTORS, ROTORS, toNum } from '../enigma/engine'

export type WheelOrder = [string, string, string]
export type Start = [number, number, number]

const WHEELS = ['I', 'II', 'III', 'IV', 'V']

export const WHEEL_ORDERS: WheelOrder[] = WHEELS.flatMap((l) =>
  WHEELS.filter((m) => m !== l).flatMap((m) => WHEELS.filter((r) => r !== l && r !== m).map((r) => [l, m, r] as WheelOrder)),
)

const POSITIONS = 26 * 26 * 26

/* ---------- Crib placement ---------- */

/** Indexes (within the crib) where a crib letter would sit on top of the same cipher letter. */
export function cribClashes(cipher: string, crib: string, offset: number) {
  const out: number[] = []
  for (let j = 0; j < crib.length; j++) if (cipher[offset + j] === crib[j]) out.push(j)
  return out
}

/* ---------- Menus ---------- */

export interface MenuEdge {
  /** Plaintext (crib) letter. */
  a: number
  /** Ciphertext letter. */
  b: number
  /** Message index, 0-based. */
  index: number
  inLoop: boolean
}

export interface Menu {
  edges: MenuEdge[]
  letters: number[]
  adj: { to: number; index: number }[][]
  isMenuLetter: boolean[]
  /** Independent loops (cyclomatic number): E − V + components. */
  loops: number
  components: number
  testLetter: number
  maxIndex: number
}

export function buildMenu(cipher: string, crib: string, offset: number): Menu {
  const edges: MenuEdge[] = []
  for (let j = 0; j < crib.length; j++) {
    edges.push({ a: toNum(crib[j]), b: toNum(cipher[offset + j]), index: offset + j, inLoop: false })
  }
  const adj: { to: number; index: number; edge: number }[][] = Array.from({ length: 26 }, () => [])
  edges.forEach((e, i) => {
    adj[e.a].push({ to: e.b, index: e.index, edge: i })
    adj[e.b].push({ to: e.a, index: e.index, edge: i })
  })
  const isMenuLetter = adj.map((l) => l.length > 0)
  const letters = isMenuLetter.flatMap((on, i) => (on ? [i] : []))

  // Bridges (Tarjan) tell us which links sit on a loop.
  const disc = new Array(26).fill(-1)
  const low = new Array(26).fill(0)
  let time = 0
  let components = 0
  const dfs = (u: number, viaEdge: number) => {
    disc[u] = low[u] = time++
    for (const { to, edge } of adj[u]) {
      if (edge === viaEdge) continue
      if (disc[to] === -1) {
        dfs(to, edge)
        low[u] = Math.min(low[u], low[to])
        if (low[to] <= disc[u]) edges[edge].inLoop = true
      } else {
        low[u] = Math.min(low[u], disc[to])
        edges[edge].inLoop = true
      }
    }
  }
  for (const l of letters) {
    if (disc[l] === -1) {
      components++
      dfs(l, -1)
    }
  }
  const degree = (l: number) => adj[l].length
  const loopDegree = (l: number) => adj[l].filter((x) => edges[x.edge].inLoop).length
  const testLetter = [...letters].sort((x, y) => loopDegree(y) - loopDegree(x) || degree(y) - degree(x))[0]

  return {
    edges,
    letters,
    adj: adj.map((l) => l.map(({ to, index }) => ({ to, index }))),
    isMenuLetter,
    loops: edges.length - letters.length + components,
    components,
    testLetter,
    maxIndex: offset + crib.length - 1,
  }
}

/* ---------- Scrambler tables ---------- */

function rotorTables(name: string) {
  const w = ROTORS[name].wiring
  const fwd = new Uint8Array(26 * 26)
  const inv = new Uint8Array(26 * 26)
  for (let p = 0; p < 26; p++) {
    for (let c = 0; c < 26; c++) {
      const out = mod(toNum(w[mod(c + p, 26)]) - p, 26)
      fwd[p * 26 + c] = out
      inv[p * 26 + out] = c
    }
  }
  return { fwd, inv }
}

/**
 * The scrambler (rotors + reflector, no plugboard) for every rotor position of one wheel order:
 * table[((L * 26 + M) * 26 + R) * 26 + letter]. A Bombe drum stack is exactly this.
 */
export function scramblerTable(order: WheelOrder, reflector = 'UKW-B') {
  const [l, m, r] = order.map(rotorTables)
  const refl = [...REFLECTORS[reflector]].map(toNum)
  const table = new Uint8Array(POSITIONS * 26)
  for (let L = 0; L < 26; L++)
    for (let M = 0; M < 26; M++)
      for (let R = 0; R < 26; R++) {
        const base = ((L * 26 + M) * 26 + R) * 26
        for (let c = 0; c < 26; c++) {
          let x = r.fwd[R * 26 + c]
          x = m.fwd[M * 26 + x]
          x = l.fwd[L * 26 + x]
          x = refl[x]
          x = l.inv[L * 26 + x]
          x = m.inv[M * 26 + x]
          table[base + c] = r.inv[R * 26 + x]
        }
      }
  return table
}

const notchOf = (name: string) => toNum(ROTORS[name].notches[0])

/** Rotor positions (as table base offsets) for message indexes 0..maxIndex, starting from `start`. */
export function stepSequence(order: WheelOrder, start: Start, maxIndex: number, out: Int32Array = new Int32Array(maxIndex + 1)) {
  const nm = notchOf(order[1])
  const nr = notchOf(order[2])
  let [L, M, R] = start
  for (let i = 0; i <= maxIndex; i++) {
    if (M === nm) {
      L = (L + 1) % 26
      M = (M + 1) % 26
    } else if (R === nr) {
      M = (M + 1) % 26
    }
    R = (R + 1) % 26
    out[i] = ((L * 26 + M) * 26 + R) * 26
  }
  return out
}

/* ---------- The Bombe ---------- */

export interface Stop {
  order: WheelOrder
  start: Start
  /** Plugboard partners of the test letter that survived. */
  hypotheses: number[]
}

/**
 * Hypothesis testing in the Bombe's spirit: assume the test letter is plugged to `hyp`, follow every
 * implication around the menu, and see whether a contradiction appears.
 */
export class BombeCore {
  private st = new Int8Array(26)
  private queue = new Int8Array(64)
  private qlen = 0
  private seq: Int32Array

  constructor(
    private menu: Menu,
    public diagonalBoard: boolean,
  ) {
    this.seq = new Int32Array(menu.maxIndex + 1)
  }

  private assign(a: number, b: number) {
    const st = this.st
    const cur = st[a]
    if (cur !== -1) return cur === b
    st[a] = b
    if (this.menu.isMenuLetter[a]) this.queue[this.qlen++] = a
    if (this.diagonalBoard) {
      // Welchman's diagonal board: a plugboard cable joins both letters, so A↔B implies B↔A.
      const cb = st[b]
      if (cb === -1) {
        st[b] = a
        if (this.menu.isMenuLetter[b]) this.queue[this.qlen++] = b
      } else if (cb !== a) return false
    }
    return true
  }

  /** Returns true when no contradiction was found. Leaves the deduced steckers in `steckers`. */
  test(table: Uint8Array, hyp: number) {
    this.st.fill(-1)
    this.qlen = 0
    if (!this.assign(this.menu.testLetter, hyp)) return false
    let head = 0
    while (head < this.qlen) {
      const u = this.queue[head++]
      const s = this.st[u]
      for (const { to, index } of this.menu.adj[u]) {
        if (!this.assign(to, table[this.seq[index] + s])) return false
      }
    }
    return true
  }

  get steckers() {
    return Array.from(this.st)
  }

  /** Test all 26 hypotheses at one start position. */
  testStart(table: Uint8Array, order: WheelOrder, start: Start): number[] {
    stepSequence(order, start, this.menu.maxIndex, this.seq)
    const alive: number[] = []
    for (let h = 0; h < 26; h++) if (this.test(table, h)) alive.push(h)
    return alive
  }

  /** Deduce steckers for one stop/hypothesis, for the checking machine. */
  deduce(table: Uint8Array, order: WheelOrder, start: Start, hyp: number) {
    stepSequence(order, start, this.menu.maxIndex, this.seq)
    const ok = this.test(table, hyp)
    return { ok, steckers: this.steckers }
  }
}

export const startFromIndex = (i: number): Start => [Math.floor(i / 676), Math.floor(i / 26) % 26, i % 26]
export const TOTAL_STARTS = POSITIONS

/** Turn deduced steckers into plug pairs, plus any contradictions a checker would spot. */
export function steckersToPlugs(st: number[]) {
  const plugs = new Set<string>()
  const conflicts: string[] = []
  const partnerOf = new Map<number, number>()
  for (let a = 0; a < 26; a++) {
    const b = st[a]
    if (b < 0) continue
    const prev = partnerOf.get(b)
    if (prev !== undefined && prev !== a) conflicts.push(`${String.fromCharCode(65 + prev)} and ${String.fromCharCode(65 + a)} both plug into ${String.fromCharCode(65 + b)}`)
    partnerOf.set(b, a)
    if (st[b] >= 0 && st[b] !== a) conflicts.push(`${String.fromCharCode(65 + a)}↔${String.fromCharCode(65 + b)} but ${String.fromCharCode(65 + b)}↔${String.fromCharCode(65 + st[b])}`)
    if (a !== b) plugs.add([a, b].sort((x, y) => x - y).map((n) => String.fromCharCode(65 + n)).join(''))
  }
  const known = new Set<number>()
  st.forEach((b, a) => {
    if (b >= 0) {
      known.add(a)
      known.add(b)
    }
  })
  return { plugs: [...plugs], conflicts: [...new Set(conflicts)], known }
}
