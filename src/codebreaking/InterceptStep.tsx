import { groupFive } from '../enigma/engine'
import type { Intercept } from './intercepts'

export function InterceptStep({ intercept, onNew }: { intercept: Intercept; onNew: () => void }) {
  const t = intercept.template
  const groups = Math.ceil(intercept.ciphertext.length / 5)
  return (
    <div className="intercept">
      <div className="intercept-form">
        <div className="intercept-head">
          <span className="form-title">Y-Station intercept log</span>
          <span className="stamp">Most secret</span>
        </div>
        <dl className="intercept-meta">
          <div>
            <dt>Time</dt>
            <dd>{t.time}</dd>
          </div>
          <div>
            <dt>Freq.</dt>
            <dd>{t.freq}</dd>
          </div>
          <div>
            <dt>Call sign</dt>
            <dd>{intercept.callsign}</dd>
          </div>
          <div>
            <dt>Groups</dt>
            <dd>{groups}</dd>
          </div>
        </dl>
        <p className="intercept-text">{groupFive(intercept.ciphertext)}</p>
        <div className="intercept-note">
          <span className="note-label">Traffic analysis</span>
          <p>
            <strong>{t.from}.</strong> {t.context}
          </p>
        </div>
      </div>
      <button className="ghost" onClick={onNew}>
        Intercept a different signal
      </button>
    </div>
  )
}
