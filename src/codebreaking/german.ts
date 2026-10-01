import { encryptText } from '../enigma/engine'
import type { Start, WheelOrder } from './bombe'
import { settingsFor } from './intercepts'

// Bigram statistics from a sample of German military prose (X = word gap). It is deliberately
// separate from the intercept texts, so the scorer only knows "what German looks like".
const SAMPLE =
  'ANXDASXOBERKOMMANDOXDESXHEERESXDIEXLAGEXIMXOSTENXISTXUNVERAENDERTXDIEXTRUPPENXHALTENXDIEXSTELLUNGENXNACHXSCHWEREMXKAMPF' +
  'XDERXFEINDXGREIFTXMITXSTARKENXKRAEFTENXANXUNSEREXVERLUSTEXSINDXGERINGXDIEXVERSORGUNGXMITXMUNITIONXUNDXVERPFLEGUNGXIST' +
  'XGESICHERTXDASXWETTERXISTXKLARXUNDXKALTXDERXWINDXKOMMTXAUSXNORDOSTENXBEFEHLXFOLGTXMORGENXFRUEHXDIEXDIVISIONXMELDETXSTAND' +
  'XUMXSECHSXUHRXDIEXFLIEGERXHABENXDENXRAUMXNOERDLICHXDERXSTADTXAUFGEKLAERTXEINEXSTARKEXFEINDLICHEXKOLONNEXWURDEXGESICHTET' +
  'XSIEXBEWEGTXSICHXNACHXSUEDENXDIEXSCHIFFEXDESXGELEITZUGESXFAHRENXMITXZEHNXSEEMEILENXDIEXBOOTEXSINDXANGEWIESENXDENXFEIND' +
  'XZUXVERFOLGENXUNDXSOFORTXZUXMELDENXWEITERHINXWIRDXGEMELDETXDASSXDIEXBRUECKEXBEIXDERXORTSCHAFTXZERSTOERTXWURDEXPIONIERE' +
  'XARBEITENXANXDERXWIEDERHERSTELLUNGXDERXREGENXHATXDIEXWEGEXSCHWERXBEFAHRBARXGEMACHTXDIEXNAECHSTEXMELDUNGXERFOLGTXUMXZWOELF' +
  'XUHRXHEILXUNDXSIEGXDERXKOMMANDEURXERWARTETXWEITEREXBEFEHLEXVOMXGENERALKOMMANDOXDIEXLUFTWAFFEXUNTERSTUETZTXDENXANGRIFF'

const LOGP = (() => {
  const counts = new Float64Array(26 * 26).fill(0.5)
  for (let i = 0; i + 1 < SAMPLE.length; i++) counts[(SAMPLE.charCodeAt(i) - 65) * 26 + SAMPLE.charCodeAt(i + 1) - 65]++
  const total = counts.reduce((a, b) => a + b, 0)
  return counts.map((c) => Math.log(c / total))
})()

/** Higher is more German-looking. */
export function germanScore(text: string) {
  let s = 0
  for (let i = 0; i + 1 < text.length; i++) s += LOGP[(text.charCodeAt(i) - 65) * 26 + text.charCodeAt(i + 1) - 65]
  return s / Math.max(1, text.length - 1)
}

export const decrypt = (cipher: string, order: WheelOrder, start: Start, plugs: string[]) =>
  encryptText(settingsFor(order, plugs), start, cipher).text

/**
 * Hut 6 finished a Bombe stop by hand: decrypt, spot nearly-German fragments, and try cables
 * for the letters the menu didn't pin down. This does the same by greedy trial.
 */
export function finishPlugboard(cipher: string, order: WheelOrder, start: Start, plugs: string[], known: Set<number>) {
  const current = [...plugs]
  const free = new Set<number>()
  for (let i = 0; i < 26; i++) if (!known.has(i)) free.add(i)
  const tried: { pair: string; gain: number }[] = []
  let best = germanScore(decrypt(cipher, order, start, current))
  while (current.length < 13) {
    let bestPair: string | null = null
    let bestScore = best
    const f = [...free]
    for (let i = 0; i < f.length; i++)
      for (let j = i + 1; j < f.length; j++) {
        const pair = String.fromCharCode(65 + f[i], 65 + f[j])
        const s = germanScore(decrypt(cipher, order, start, [...current, pair]))
        if (s > bestScore + 0.0005) {
          bestScore = s
          bestPair = pair
        }
      }
    if (!bestPair) break
    tried.push({ pair: bestPair, gain: bestScore - best })
    current.push(bestPair)
    free.delete(bestPair.charCodeAt(0) - 65)
    free.delete(bestPair.charCodeAt(1) - 65)
    best = bestScore
  }
  return { plugs: current, added: tried.map((t) => t.pair) }
}
