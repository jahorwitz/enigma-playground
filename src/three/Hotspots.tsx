import { Html } from '@react-three/drei'
import { topicById, type TopicId } from '../content/topics'
import { useEnigma } from '../store'
import { FRONT, ROTOR, TOP } from './layout'

const SPOTS: { topic: TopicId; at: [number, number, number] }[] = [
  { topic: 'keyboard', at: [-1.5, TOP + 0.1, 1.2] },
  { topic: 'lampboard', at: [1.52, TOP + 0.1, -0.32] },
  { topic: 'rotors', at: [-0.48, ROTOR.axisY + 0.48, ROTOR.z] },
  { topic: 'stepping', at: [0.48, ROTOR.axisY + 0.48, ROTOR.z] },
  { topic: 'reflector', at: [ROTOR.reflectorX, ROTOR.axisY + 0.42, ROTOR.z] },
  { topic: 'plugboard', at: [-1.5, 0.9, FRONT + 0.05] },
]

export function Hotspots() {
  const show = useEnigma((s) => s.hotspots)
  const open = useEnigma((s) => s.openTopic)
  const active = useEnigma((s) => s.topic)
  if (!show) return null
  return (
    <>
      {SPOTS.map(({ topic, at }) => {
        const t = topicById(topic)
        return (
          <Html key={topic} position={at} center zIndexRange={[20, 10]}>
            <button
              className={`hotspot${active === topic ? ' is-active' : ''}`}
              onClick={() => open(topic)}
              aria-label={`Learn about ${t.title}`}
            >
              <span className="hotspot-dot">?</span>
              <span className="hotspot-label">{t.title}</span>
            </button>
          </Html>
        )
      })}
    </>
  )
}
