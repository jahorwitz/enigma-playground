import { useMemo, useState, type ReactNode } from 'react'
import { SiteNav } from '../components/SiteNav'
import { buildMenu, type Stop } from './bombe'
import { BombeStep } from './BombeStep'
import { CheckStep } from './CheckStep'
import { CribStep } from './CribStep'
import { CRIBS, newIntercept } from './intercepts'
import { InterceptStep } from './InterceptStep'
import { MenuStep } from './MenuStep'

export interface Selection {
  stop: Stop
  hypothesis: number
}

export function Step({
  n,
  title,
  locked,
  lockedText,
  aside,
  children,
}: {
  n: number
  title: string
  locked?: boolean
  lockedText?: string
  aside: ReactNode
  children: ReactNode
}) {
  return (
    <section className={`cb-step${locked ? ' is-locked' : ''}`} aria-labelledby={`step-${n}`}>
      <div className="cb-aside">
        <div className="cb-num">{String(n).padStart(2, '0')}</div>
        <h2 id={`step-${n}`}>{title}</h2>
        <div className="prose">{aside}</div>
      </div>
      <div className="cb-work">{locked ? <p className="cb-locked">{lockedText}</p> : children}</div>
    </section>
  )
}

export default function CodebreakingApp() {
  const [intercept, setIntercept] = useState(() => newIntercept())
  const [crib, setCrib] = useState(CRIBS[0].text)
  const [placed, setPlaced] = useState<number | null>(null)
  const [cribLen, setCribLen] = useState<number | null>(null)
  const [diagonalBoard, setDiagonalBoard] = useState(true)
  const [selection, setSelection] = useState<Selection | null>(null)
  // Bumped whenever upstream choices change, so the Bombe resets.
  const [runKey, setRunKey] = useState(0)

  const usedCrib = crib.slice(0, cribLen ?? crib.length)
  const menu = useMemo(
    () => (placed === null ? null : buildMenu(intercept.ciphertext, usedCrib, placed)),
    [intercept, usedCrib, placed],
  )

  const resetDownstream = () => {
    setSelection(null)
    setRunKey((k) => k + 1)
  }

  return (
    <div className="app cb">
      <header className="masthead">
        <div className="brand">
          <h1>Enigma</h1>
          <SiteNav current="codebreaking" />
        </div>
      </header>

      <div className="cb-intro">
        <h2 className="cb-title">Breaking it</h2>
        <p>
          Bletchley Park, 1941. A German radio signal has just come in from one of the intercept stations. The Allies
          know how Enigma is wired. What they don't know is today's key: which three rotors are in the machine and in
          what order, where they started, and how the ten plugboard cables are connected. That is 158 million million
          million possibilities, and the key changes at midnight.
        </p>
        <p>Work through the five steps below to break the signal the way Hut 6 did.</p>
      </div>

      <main className="cb-steps">
        <Step
          n={1}
          title="The intercept"
          aside={
            <>
              <p>
                Listening posts called <em>Y-stations</em> took down German Morse traffic around the clock, letter by
                letter, and sent it to Bletchley by teleprinter and motorcycle courier.
              </p>
              <p>
                Codebreakers started with everything <em>except</em> the ciphertext: who sent the signal, when, on
                which frequency, and how long it was. This <strong>traffic analysis</strong> often hinted at what the
                message said.
              </p>
            </>
          }
        >
          <InterceptStep
            intercept={intercept}
            onNew={() => {
              setIntercept((prev) => newIntercept(prev))
              setPlaced(null)
              setCribLen(null)
              resetDownstream()
            }}
          />
        </Step>

        <Step
          n={2}
          title="Place the crib"
          aside={
            <>
              <p>
                A <strong>crib</strong> is a guess at a stretch of plaintext. Weather ships really did send{' '}
                <kbd>WETTERVORHERSAGE</kbd> every morning, and quiet units really did report{' '}
                <kbd>KEINEBESONDERENEREIGNISSE</kbd>.
              </p>
              <p>
                The hard part is knowing <em>where</em> the crib sits. Enigma's reflector means a letter can never
                encrypt to itself, so any position where a crib letter lands on the same cipher letter is impossible.
                Slide the crib along and watch positions get ruled out.
              </p>
            </>
          }
        >
          <CribStep
            key={intercept.ciphertext}
            cipher={intercept.ciphertext}
            crib={crib}
            placed={placed}
            onCrib={(c) => {
              setCrib(c)
              setPlaced(null)
              setCribLen(null)
              resetDownstream()
            }}
            onPlace={(p) => {
              setPlaced(p)
              resetDownstream()
            }}
          />
        </Step>

        <Step
          n={3}
          title="Build the menu"
          locked={!menu}
          lockedText="Place the crib to draw its menu."
          aside={
            <>
              <p>
                Line up the crib with the ciphertext and every pair of letters is a clue: at position 7, say, the
                machine turned <kbd>R</kbd> into <kbd>K</kbd>. Draw each pair as a link and you get Turing's{' '}
                <strong>menu</strong>.
              </p>
              <p>
                <strong>Loops</strong> are what make a menu powerful. Going round a loop, the plugboard partner of a
                letter has to come back to where it started, so a wrong guess about the plugboard quickly
                contradicts itself. Bletchley wanted at least three loops.
              </p>
              <p>
                Longer cribs make better menus but are harder to guess correctly. Try shortening the crib and see what
                it does to the Bombe in step 4.
              </p>
            </>
          }
        >
          {menu && (
            <MenuStep
              menu={menu}
              crib={usedCrib}
              fullLength={crib.length}
              cipher={intercept.ciphertext}
              offset={placed!}
              onLength={(n) => {
                setCribLen(n)
                resetDownstream()
              }}
            />
          )}
        </Step>

        <Step
          n={4}
          title="Run the Bombe"
          locked={!menu}
          lockedText="The Bombe needs a menu to work from."
          aside={
            <>
              <p>
                The <strong>Bombe</strong>, designed by Alan Turing and improved by Gordon Welchman, was wired up to
                copy the menu. Each column of drums stands in for one Enigma at one position in the crib.
              </p>
              <p>
                For every wheel order and start position, it guesses the plugboard partner of the most connected
                letter, follows the consequences around every loop, and moves on if they contradict each other.
                When a guess survives, the Bombe <em>stops</em> and the setting is written down.
              </p>
              <p>
                Welchman's <strong>diagonal board</strong> (1940) added one more rule: if A is cabled to B, then B is
                cabled to A. Switch it off to see how many more false stops the Bombe makes without it.
              </p>
            </>
          }
        >
          {menu && (
            <BombeStep
              key={runKey}
              menu={menu}
              diagonalBoard={diagonalBoard}
              onDiagonalBoard={(on) => {
                setDiagonalBoard(on)
                resetDownstream()
              }}
              selected={selection}
              onSelect={setSelection}
            />
          )}
        </Step>

        <Step
          n={5}
          title="The checking machine"
          locked={!selection || !menu}
          lockedText="Pick a Bombe stop to test it."
          aside={
            <>
              <p>
                A stop is only a candidate. Hut 6 took each one to a replica Enigma and decrypted the message using the
                cables the menu had already pinned down.
              </p>
              <p>
                False stops produce gibberish. A true stop produces something close to German, with a few wrong letters
                where cables are still missing. The codebreakers spotted near-words, worked out the remaining cables,
                and the day's key was broken. Every other message sent on that key could then be read.
              </p>
            </>
          }
        >
          {selection && menu && (
            <CheckStep
              key={`${selection.stop.order.join('')}${selection.stop.start.join('')}${selection.hypothesis}`}
              intercept={intercept}
              menu={menu}
              selection={selection}
              diagonalBoard={diagonalBoard}
            />
          )}
        </Step>
      </main>

      <footer className="colophon">
        Simplified for teaching: the reflector is known (UKW-B), the rings are set to AAA, and only rotors I–V are used.
        The real Bombe had to assume the middle rotor didn't turn during the crib; ours knows exactly when it does.
      </footer>
    </div>
  )
}
