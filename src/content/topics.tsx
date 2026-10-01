import type { ReactNode } from 'react'
import { KeyspaceCalculator } from '../components/KeyspaceCalculator'

export type TopicId =
  | 'overview'
  | 'keyboard'
  | 'plugboard'
  | 'rotors'
  | 'stepping'
  | 'rings'
  | 'reflector'
  | 'lampboard'
  | 'procedure'
  | 'keyspace'
  | 'breaking'

export interface Topic {
  id: TopicId
  title: string
  german?: string
  /** One line shown on the hotspot tooltip and lesson list. */
  hook: string
  body: ReactNode
}

export const TOPICS: Topic[] = [
  {
    id: 'overview',
    title: 'What was Enigma?',
    hook: 'An electro-mechanical cipher machine the size of a typewriter.',
    body: (
      <>
        <p>
          Enigma was patented by the German engineer Arthur Scherbius in 1918 and sold commercially in the 1920s.
          The German army adopted a hardened version, the <em>Enigma I</em>, in 1930, and by the Second World War
          tens of thousands of machines carried the orders of the army, air force, navy and intelligence services.
        </p>
        <p>
          At heart it is a battery, 26 keys, 26 light bulbs and a tangle of wires between them. Pressing a key closes
          a circuit; the current takes a winding route through the machine and lights a <em>different</em> letter. The
          trick is that the route changes after every single key press, so the same letter is enciphered differently
          each time it appears.
        </p>
        <p>
          Two operators usually worked together: one typed the message, the other wrote down the letters as they lit
          up. Follow the lessons in order, or open the <strong>?</strong> markers on the machine to jump to a part.
        </p>
        <p className="aside">
          Try it now: type <kbd>HELLO</kbd>, press <em>Rewind</em> on the message tape, then type the five letters you
          got back. Out comes HELLO again.
        </p>
      </>
    ),
  },
  {
    id: 'keyboard',
    title: 'The keyboard',
    german: 'Tastatur',
    hook: 'Pressing a key steps the rotors, then sends current into the machine.',
    body: (
      <>
        <p>
          The 26 keys follow the German QWERTZ layout, minus anything that is not a letter. There are no digits, no
          spaces and no punctuation: operators spelled numbers out, wrote <kbd>X</kbd> for a full stop and often
          doubled letters for proper names.
        </p>
        <p>
          Each key does two jobs. Its mechanical travel pushes a set of pawls that turn the rotors forward
          <em> first</em>; only when the key bottoms out does it close the electrical circuit. That ordering matters:
          the very first letter of a message is enciphered with the rotors already one step past their start position.
        </p>
        <p>
          The keys are interlocked, so only one can be held at a time. Here you can click the keys or type on your
          own keyboard. <kbd>Backspace</kbd> undoes the last letter, which a real operator could only do by cranking
          the rotors back by hand.
        </p>
      </>
    ),
  },
  {
    id: 'plugboard',
    title: 'The plugboard',
    german: 'Steckerbrett',
    hook: 'Cables swap pairs of letters on the way in and again on the way out.',
    body: (
      <>
        <p>
          The plugboard on the front panel was the military's big addition to the commercial machine. Each cable joins
          two sockets and swaps those letters: with <kbd>A</kbd>–<kbd>Q</kbd> plugged, pressing A sends current into
          the rotors as if Q had been pressed, and a Q coming back out lights the A lamp.
        </p>
        <p>
          The current passes through the plugboard twice, once on the way in and once on the way out, so the swap is
          symmetric and the machine stays reciprocal. Letters without a cable pass straight through.
        </p>
        <p>
          Wartime key sheets usually specified ten cables. That single choice multiplies the number of possible
          settings by about 150 trillion. It does nothing to the rotor stepping, which is why codebreakers attacked
          the rotors first and peeled the plugboard off afterwards.
        </p>
        <p className="aside">
          Click two sockets on the front of the machine (or in the settings panel) to plug a cable. Click a plugged
          socket to pull the cable out.
        </p>
      </>
    ),
  },
  {
    id: 'rotors',
    title: 'The rotors',
    german: 'Walzen',
    hook: 'Three scrambling wheels, each a fixed tangle of 26 wires.',
    body: (
      <>
        <p>
          Each rotor is a disc with 26 spring-loaded pins on one face and 26 flat contacts on the other. Inside, the
          pins and contacts are cross-wired in a fixed, irregular pattern. Rotor I, for example, connects A→E, B→K,
          C→M and so on. On its own, one rotor is just a simple substitution cipher.
        </p>
        <p>
          The power comes from stacking three of them and turning them. When a rotor moves one place, every wire shifts
          by one contact relative to its neighbours, giving a completely different substitution. The signal path diagram
          below the machine shows this live: watch the faint wiring lines slide as you type.
        </p>
        <p>
          Current enters from the fixed <em>entry wheel</em> (Eintrittswalze) on the right, passes right → middle → left,
          bounces off the reflector, then comes back through all three rotors in reverse.
        </p>
        <p>
          The Enigma I came with five rotors (I–V) and used three at a time, in any order: 60 possible{' '}
          <em>wheel orders</em>. The navy's M3 had three more (VI–VIII). Choosing which wheels went where was part of
          the daily key.
        </p>
        <p className="aside">Click a rotor on the machine to turn it forward; right-click to turn it back.</p>
      </>
    ),
  },
  {
    id: 'stepping',
    title: 'Stepping & the double step',
    hook: 'The rotors advance like an odometer, mostly.',
    body: (
      <>
        <p>
          With every key press the right-hand rotor moves one place. Each rotor carries a notch on its alphabet ring;
          when the right rotor passes its notch it carries the middle rotor along one place, and when the middle rotor
          passes its own notch it carries the left rotor.
        </p>
        <table className="mini">
          <thead>
            <tr>
              <th>Rotor</th>
              <th>I</th>
              <th>II</th>
              <th>III</th>
              <th>IV</th>
              <th>V</th>
              <th>VI–VIII</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Turns the next rotor when leaving</td>
              <td>Q</td>
              <td>E</td>
              <td>V</td>
              <td>J</td>
              <td>Z</td>
              <td>Z &amp; M</td>
            </tr>
          </tbody>
        </table>
        <p>
          British codebreakers remembered the turnover letters for rotors I–V with the mnemonic{' '}
          <em>Royal Flags Wave Kings Above</em>: the letters <em>after</em> the notch.
        </p>
        <p>
          The mechanism has a quirk. The pawl that pushes the left rotor rests in the middle rotor's notch, so when it
          fires it shoves the middle rotor too. The middle rotor therefore steps on two consecutive key presses: the{' '}
          <strong>double step</strong>. With rotors I-II-III, set the window to <kbd>A D U</kbd> and type three letters.
          You'll see ADV, AEW, then BFX: the middle rotor moves twice in a row.
        </p>
        <p>
          Because of the double step, the machine cycles every 26 × 25 × 26 = 16,900 key presses rather than 17,576.
        </p>
      </>
    ),
  },
  {
    id: 'rings',
    title: 'Ring settings',
    german: 'Ringstellung',
    hook: 'Slides the alphabet ring around the wiring core.',
    body: (
      <>
        <p>
          Each rotor's lettered ring is a separate part that can be rotated around the wired core and clipped in place.
          The ring setting decides which letter in the window lines up with which internal wiring position.
        </p>
        <p>
          The notch is fixed to the <em>ring</em>, not the core, so the turnover always happens at the same letter in the
          window. Changing a ring setting shifts the wiring while leaving the stepping visibly unchanged. Two operators
          with the same window letters but different rings get completely different ciphertext.
        </p>
        <p>
          Ring settings were part of the daily key sheet and were set once in the morning with the rotors out of the
          machine. Setting ring <kbd>02</kbd> on every rotor with the window at <kbd>AAA</kbd> turns AAAAA into EWTYX
          instead of BDZGO.
        </p>
      </>
    ),
  },
  {
    id: 'reflector',
    title: 'The reflector',
    german: 'Umkehrwalze',
    hook: 'Sends the current back, making the machine its own inverse.',
    body: (
      <>
        <p>
          At the far left end sits the reflector: a half-rotor with 13 wires that join the 26 contacts in pairs. It
          turns the current around and sends it back out through the rotors by a different route.
        </p>
        <p>
          This design has two big consequences:
        </p>
        <ul>
          <li>
            <strong>Reciprocity.</strong> If A encrypts to G at some position, G encrypts to A at that same position.
            The same machine, set the same way, both encrypts and decrypts. No separate decrypt mode was needed.
          </li>
          <li>
            <strong>No letter ever encrypts to itself.</strong> The current cannot come back down the same wire it went
            in on. This was Enigma's fatal flaw: a codebreaker sliding a guessed word along the ciphertext could rule
            out every position where any letter matched itself.
          </li>
        </ul>
        <p>
          UKW-B was the standard reflector for most of the war. UKW-A was used before 1937 and UKW-C appeared briefly
          in 1940.
        </p>
      </>
    ),
  },
  {
    id: 'lampboard',
    title: 'The lampboard',
    german: 'Lampenfeld',
    hook: 'One bulb per letter. It stays lit only while the key is held.',
    body: (
      <>
        <p>
          The lampboard has 26 small bulbs behind lettered windows, in the same layout as the keys. A 4.5-volt
          battery inside the box powered them. Whichever lamp glows is the enciphered letter, and it stays lit only
          while the key is held down.
        </p>
        <p>
          Because pressing a key also breaks the circuit to that key's own lamp, a key can never light itself. That
          is the electrical side of the reflector's "no letter maps to itself" rule.
        </p>
        <p>
          A second operator watched the lamps and copied each letter onto a message pad in groups of five, ready for
          the radio operator to send in Morse code. The <em>Message tape</em> panel plays that role here.
        </p>
      </>
    ),
  },
  {
    id: 'procedure',
    title: 'Operating procedure',
    hook: 'Daily key sheets, message keys, and groups of five.',
    body: (
      <>
        <p>Enigma's security depended as much on procedure as on the machine. A typical army procedure from 1940:</p>
        <ol>
          <li>
            Each unit held a monthly <strong>key sheet</strong> listing, for every day, the wheel order, ring settings
            and plugboard cables. Sheets were printed in soluble ink so they could be destroyed quickly.
          </li>
          <li>
            For each message the operator chose a random start position, the <em>Grundstellung</em>, e.g.{' '}
            <kbd>WZA</kbd>, and a random three-letter <em>message key</em>, e.g. <kbd>SXT</kbd>.
          </li>
          <li>
            With the rotors at WZA, they enciphered SXT, giving something like <kbd>UHL</kbd>. WZA and UHL went at the
            head of the message in the clear.
          </li>
          <li>
            They turned the rotors to SXT and enciphered the message itself, five letters to a group.
          </li>
        </ol>
        <p>
          The receiver, holding the same key sheet, set WZA, typed UHL to recover SXT, set SXT and typed the ciphertext
          to read the message.
        </p>
        <p>
          Before May 1940 the message key was typed <em>twice</em> at the start of every message to catch typos. Marian
          Rejewski in Poland used those repeated keys to work out the daily settings, and even the internal wiring of
          the rotors.
        </p>
        <p className="aside">
          The <em>Share</em> button on the tape panel copies your settings as a key sheet, plus a link that loads them.
          Send the ciphertext separately, and your friend can decrypt it.
        </p>
      </>
    ),
  },
  {
    id: 'keyspace',
    title: 'How many settings?',
    hook: 'About 159 quintillion daily keys, and why that wasn’t enough.',
    body: (
      <>
        <p>
          An eavesdropper who knew how the machine was built (the Allies did) but not the day's key faced a huge
          search space. For the standard army machine with five rotors and ten cables:
        </p>
        <KeyspaceCalculator />
        <p>
          That is roughly 2<sup>67</sup>, far too many to try by hand or with any machine of the 1940s. But brute force
          was never the plan. The plugboard, the biggest factor, doesn't affect the stepping, and the reflector
          guarantees no letter maps to itself. Both facts let codebreakers split the problem into pieces small enough to
          attack separately.
        </p>
      </>
    ),
  },
  {
    id: 'breaking',
    title: 'How Enigma was broken',
    hook: 'Polish mathematicians, Bletchley Park, cribs and the Bombe.',
    body: (
      <>
        <p>
          <strong>Poland, 1932.</strong> Marian Rejewski, Jerzy Różycki and Henryk Zygalski of the Polish Cipher Bureau
          used group theory, together with documents supplied by French intelligence, to reconstruct the rotor wiring.
          For years they read German traffic with replicas, card catalogues and electro-mechanical <em>bomby</em>.
        </p>
        <p>
          <strong>July 1939.</strong> Five weeks before the invasion of Poland, the Poles handed their methods and
          replica machines to British and French intelligence.
        </p>
        <p>
          <strong>Bletchley Park.</strong> Alan Turing and Gordon Welchman designed the British <em>Bombe</em>, which
          tested rotor settings against a <em>crib</em>: a guessed piece of plaintext such as <kbd>WETTERVORHERSAGE</kbd>{' '}
          ("weather forecast") or <kbd>KEINEBESONDERENEREIGNISSE</kbd> ("nothing special to report"). Because no letter
          encrypts to itself, analysts could slide a crib along the ciphertext and discard every alignment with a
          clash. The Bombe then ran through the 17,576 rotor positions for each wheel order, rejecting settings that led
          to contradictions.
        </p>
        <p>
          <strong>Human error</strong> did the rest: lazy operators picked message keys like <kbd>AAA</kbd> or their
          girlfriend's initials, sent the same message on different networks, and repeated stereotyped phrases.
          Captured key sheets, such as those from U-110 in 1941, filled the gaps.
        </p>
        <p>
          Intelligence from Enigma decrypts, code-named <em>Ultra</em>, influenced the Battle of the Atlantic, the North
          African campaign and D-Day. Historians often estimate it shortened the war by two or more years.
        </p>
        <p className="aside">
          Try it yourself: <a href="./codebreaking.html">break an intercepted signal</a> with a crib, a menu and a
          working Bombe.
        </p>
      </>
    ),
  },
]

export const topicById = (id: TopicId) => TOPICS.find((t) => t.id === id)!
