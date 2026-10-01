import type { TopicId } from '../content/topics'
import { useEnigma } from '../store'

export function HelpButton({ topic, label }: { topic: TopicId; label?: string }) {
  const open = useEnigma((s) => s.openTopic)
  return (
    <button className="help-btn" onClick={() => open(topic)} aria-label={label ?? 'Explain'} title={label ?? 'Explain'}>
      ?
    </button>
  )
}
