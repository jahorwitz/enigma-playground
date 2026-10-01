import { ALPHABET, encryptText, type MachineSettings } from '../enigma/engine'
import { buildMenu, WHEEL_ORDERS, type Start, type WheelOrder } from './bombe'

export interface Crib {
  text: string
  meaning: string
}

export const CRIBS: Crib[] = [
  { text: 'WETTERVORHERSAGEXBISKAYA', meaning: 'Weather forecast, Biscay' },
  { text: 'KEINEBESONDERENEREIGNISSE', meaning: 'Nothing special to report' },
  { text: 'OBERKOMMANDODERWEHRMACHT', meaning: 'High Command of the Armed Forces' },
  { text: 'BEFEHLSHABERXDERXUBOOTE', meaning: 'Commander U-boats' },
]

interface Template {
  crib: string
  plain: string
  english: string
  /** What traffic analysis would tell a codebreaker about this signal. */
  context: string
  from: string
  time: string
  freq: string
}

// X stands for a space, as German operators wrote it.
const TEMPLATES: Template[] = [
  {
    crib: 'WETTERVORHERSAGEXBISKAYA',
    plain: 'WETTERVORHERSAGEXBISKAYAXWINDXSUEDWESTXSTAERKEXFUENFXSEEGANGXVIERXREGENSCHAUERXSICHTXZWEIXSEEMEILENXLUFTDRUCKXFALLENDX',
    english: 'Weather forecast Biscay: wind south-west force five, sea state four, rain showers, visibility two nautical miles, air pressure falling.',
    context: 'A weather ship in the Bay of Biscay. It transmits at this time every morning, and its signals are always about the same length.',
    from: 'Weather ship, Biscay',
    time: '0605',
    freq: '4.2 MHz',
  },
  {
    crib: 'WETTERVORHERSAGEXBISKAYA',
    plain: 'VONXSTATIONXSIEBENXWETTERVORHERSAGEXBISKAYAXNEBELXAMXMORGENXSPAETERXAUFKLARENDXWINDXNORDWESTXDREIXTEMPERATURXELFXGRADX',
    english: 'From station seven: weather forecast Biscay. Fog in the morning, clearing later. Wind north-west three, temperature eleven degrees.',
    context: 'Coastal weather station 7 near Brest. Its dawn reports usually open with the sender, then the forecast.',
    from: 'Coastal station 7, Brest',
    time: '0540',
    freq: '5.8 MHz',
  },
  {
    crib: 'KEINEBESONDERENEREIGNISSE',
    plain: 'VONXHEERESGRUPPEXNORDXKEINEBESONDERENEREIGNISSEXLAGEXUNVERAENDERTXNACHSCHUBXEINGETROFFENXMUNITIONXAUSREICHENDX',
    english: 'From Army Group North: nothing special to report. Situation unchanged. Supplies have arrived, ammunition is sufficient.',
    context: 'Routine evening report from an army group headquarters. The front has been quiet for a week.',
    from: 'Army Group North HQ',
    time: '1900',
    freq: '3.1 MHz',
  },
  {
    crib: 'KEINEBESONDERENEREIGNISSE',
    plain: 'MELDUNGXNULLXACHTXKEINEBESONDERENEREIGNISSEXIMXABSCHNITTXFEINDXRUHIGXSPAEHTRUPPXOHNEXFEINDBERUEHRUNGXZURUECKGEKEHRTX',
    english: 'Report 08: nothing special to report in the sector. Enemy quiet. Patrol returned without contact with the enemy.',
    context: 'A divisional outpost that reports on the hour. Most of its numbered reports say very little.',
    from: 'Divisional outpost',
    time: '0800',
    freq: '6.4 MHz',
  },
  {
    crib: 'OBERKOMMANDODERWEHRMACHT',
    plain: 'OBERKOMMANDODERWEHRMACHTXANXALLEXDIENSTSTELLENXFUNKVERKEHRXAUFXNEUEXSCHLUESSELXUMSTELLENXAUSFUEHRUNGXMELDENX',
    english: 'High Command of the Armed Forces to all posts: switch radio traffic to the new keys. Report when done.',
    context: 'A broadcast from Berlin to many stations at once. Orders from the top usually name the sender first.',
    from: 'Berlin, broadcast',
    time: '1200',
    freq: '7.0 MHz',
  },
  {
    crib: 'BEFEHLSHABERXDERXUBOOTE',
    plain: 'DRINGENDXANXBEFEHLSHABERXDERXUBOOTEXGELEITZUGXGESICHTETXQUADRATXBEXDREIVIERXKURSXOSTXFAHRTXACHTXSEEMEILENX',
    english: 'Urgent, to Commander U-boats: convoy sighted in grid square BE 34, course east, speed eight knots.',
    context: 'A U-boat surfaced in the North Atlantic sending a short urgent signal to headquarters in Lorient.',
    from: 'U-boat, North Atlantic',
    time: '2314',
    freq: '8.6 MHz',
  },
]

export interface Intercept {
  template: Template
  key: { order: WheelOrder; start: Start; plugs: string[] }
  plaintext: string
  ciphertext: string
  cribOffset: number
  callsign: string
}

const pick = <T,>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)]

export const settingsFor = (order: WheelOrder, plugs: string[]): MachineSettings => ({
  rotors: order,
  rings: [0, 0, 0],
  reflector: 'UKW-B',
  plugs,
})

function randomPlugs(n: number) {
  const letters = [...ALPHABET]
  const out: string[] = []
  for (let i = 0; i < n; i++) {
    const a = letters.splice(Math.floor(Math.random() * letters.length), 1)[0]
    const b = letters.splice(Math.floor(Math.random() * letters.length), 1)[0]
    out.push([a, b].sort().join(''))
  }
  return out
}

/** A fresh signal under a random daily key, re-rolled until the true crib gives a usable menu. */
export function newIntercept(previous?: Intercept): Intercept {
  const choices = TEMPLATES.filter((t) => t !== previous?.template)
  const template = pick(choices)
  const cribOffset = template.plain.indexOf(template.crib)
  for (;;) {
    const order = pick(WHEEL_ORDERS)
    const start: Start = [0, 0, 0].map(() => Math.floor(Math.random() * 26)) as Start
    const plugs = randomPlugs(10)
    const ciphertext = encryptText(settingsFor(order, plugs), start, template.plain).text
    const menu = buildMenu(ciphertext, template.crib, cribOffset)
    if (menu.loops >= 3) {
      const callsign = [0, 1, 2].map(() => pick([...ALPHABET])).join('')
      return { template, key: { order, start, plugs }, plaintext: template.plain, ciphertext, cribOffset, callsign }
    }
  }
}
