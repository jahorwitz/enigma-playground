import { describe, expect, it } from 'vitest'
import { DEFAULT_SETTINGS, encryptText, pressKey, toNum, type MachineSettings, type Positions } from './engine'

const P = (s: string) => [...s].map(toNum) as Positions

describe('enigma engine', () => {
  it('matches the canonical AAAAA → BDZGO test vector', () => {
    expect(encryptText(DEFAULT_SETTINGS, P('AAA'), 'AAAAA').text).toBe('BDZGO')
  })

  it('is reciprocal: same settings decrypt the ciphertext', () => {
    const s: MachineSettings = { rotors: ['IV', 'II', 'V'], rings: [3, 11, 20], reflector: 'UKW-C', plugs: ['AQ', 'BJ', 'EZ', 'HX'] }
    const plain = 'WETTERVORHERSAGEBISKAYA'
    const cipher = encryptText(s, P('KDO'), plain).text
    expect(cipher).not.toBe(plain)
    expect(encryptText(s, P('KDO'), cipher).text).toBe(plain)
  })

  it('never encrypts a letter to itself', () => {
    let pos = P('AAA')
    for (let i = 0; i < 2000; i++) {
      const r = pressKey(DEFAULT_SETTINGS, pos, i % 26)
      expect(r.output).not.toBe(r.input)
      pos = r.after
    }
  })

  it('double-steps the middle rotor (ADU → ADV → AEW → BFX)', () => {
    let pos = P('ADU')
    const seen: string[] = []
    for (let i = 0; i < 3; i++) {
      const r = pressKey(DEFAULT_SETTINGS, pos, 0)
      pos = r.after
      seen.push(pos.map((n) => String.fromCharCode(65 + n)).join(''))
    }
    expect(seen).toEqual(['ADV', 'AEW', 'BFX'])
  })

  it('handles ring settings and plugboard (known vector)', () => {
    // Enigma I, rotors I-II-III, rings BBB, start AAA, no plugs: AAAAA -> EWTYX
    const s: MachineSettings = { ...DEFAULT_SETTINGS, rings: [1, 1, 1] }
    expect(encryptText(s, P('AAA'), 'AAAAA').text).toBe('EWTYX')
  })
})
