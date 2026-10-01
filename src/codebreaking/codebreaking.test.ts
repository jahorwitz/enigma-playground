import { describe, expect, it } from 'vitest'
import { plugMap } from '../enigma/engine'
import { BombeCore, buildMenu, cribClashes, scramblerTable, startFromIndex, steckersToPlugs, TOTAL_STARTS, WHEEL_ORDERS } from './bombe'
import { decrypt, finishPlugboard } from './german'
import { newIntercept } from './intercepts'

describe('codebreaking', () => {
  it('has 60 wheel orders', () => {
    expect(WHEEL_ORDERS).toHaveLength(60)
  })

  it('never shows a clash at the true crib position', () => {
    for (let i = 0; i < 20; i++) {
      const x = newIntercept()
      expect(cribClashes(x.ciphertext, x.template.crib, x.cribOffset)).toEqual([])
    }
  })

  it('counts loops', () => {
    // A-B, B-C, C-A is one loop; plus a dangling C-D.
    const m = buildMenu('BCAD', 'ABCC', 0)
    expect(m.loops).toBe(1)
    expect(m.edges.map((e) => e.inLoop)).toEqual([true, true, true, false])
  })

  it('finds the true key and reads the message', () => {
    let solved = 0
    const trials = 8
    for (let t = 0; t < trials; t++) {
      const x = newIntercept()
      const menu = buildMenu(x.ciphertext, x.template.crib, x.cribOffset)
      const table = scramblerTable(x.key.order)
      const bombe = new BombeCore(menu, true)
      const truth = plugMap(x.key.plugs)[menu.testLetter]
      const stops: { i: number; alive: number[] }[] = []
      for (let i = 0; i < TOTAL_STARTS; i++) {
        const alive = bombe.testStart(table, x.key.order, startFromIndex(i))
        if (alive.length) stops.push({ i, alive })
      }
      const trueIndex = x.key.start[0] * 676 + x.key.start[1] * 26 + x.key.start[2]
      const hit = stops.find((s) => s.i === trueIndex)
      expect(hit?.alive).toContain(truth)

      const { steckers } = bombe.deduce(table, x.key.order, x.key.start, truth)
      const { plugs, conflicts, known } = steckersToPlugs(steckers)
      expect(conflicts).toEqual([])
      for (const p of plugs) expect(x.key.plugs).toContain(p)
      const done = finishPlugboard(x.ciphertext, x.key.order, x.key.start, plugs, known)
      const text = decrypt(x.ciphertext, x.key.order, x.key.start, done.plugs)
      if (text === x.plaintext) solved++
    }
    expect(solved).toBeGreaterThanOrEqual(trials - 2)
  }, 60000)
})
