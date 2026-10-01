import { useEffect, useRef, useState } from 'react'
import { TOPICS } from '../content/topics'
import { useEnigma } from '../store'

export function ManualDrawer() {
  const topicId = useEnigma((s) => s.topic)
  const open = useEnigma((s) => s.openTopic)
  const [contents, setContents] = useState(false)
  const body = useRef<HTMLDivElement>(null)
  const index = TOPICS.findIndex((t) => t.id === topicId)
  const topic = TOPICS[index]

  useEffect(() => {
    body.current?.scrollTo({ top: 0 })
    setContents(false)
  }, [topicId])

  return (
    <aside className={`manual${topic ? ' is-open' : ''}`} aria-hidden={!topic} aria-label="Field manual">
      {topic && (
        <>
          <header className="manual-head">
            <button className="link" onClick={() => setContents((c) => !c)} aria-expanded={contents}>
              Lesson {index + 1} of {TOPICS.length} {contents ? '▴' : '▾'}
            </button>
            <button className="close" onClick={() => open(null)} aria-label="Close manual">
              ×
            </button>
          </header>
          {contents && (
            <ol className="manual-toc">
              {TOPICS.map((t, i) => (
                <li key={t.id}>
                  <button className={i === index ? 'on' : ''} onClick={() => open(t.id)}>
                    <span className="n">{String(i + 1).padStart(2, '0')}</span>
                    <span>
                      {t.title}
                      <small>{t.hook}</small>
                    </span>
                  </button>
                </li>
              ))}
            </ol>
          )}
          <div className="manual-body" ref={body}>
            <h2>{topic.title}</h2>
            {topic.german && <p className="german">{topic.german}</p>}
            <p className="hook">{topic.hook}</p>
            <div className="prose">{topic.body}</div>
          </div>
          <footer className="manual-foot">
            <button disabled={index <= 0} onClick={() => open(TOPICS[index - 1].id)}>
              ← {index > 0 ? TOPICS[index - 1].title : ''}
            </button>
            <button disabled={index >= TOPICS.length - 1} onClick={() => open(TOPICS[index + 1].id)}>
              {index < TOPICS.length - 1 ? TOPICS[index + 1].title : ''} →
            </button>
          </footer>
        </>
      )}
    </aside>
  )
}
