import { useMemo } from 'react'
import * as THREE from 'three'
import { ALPHABET, toNum } from '../enigma/engine'
import { useEnigma } from '../store'
import { CASE, FRONT, socketPos } from './layout'
import { labelTexture } from './textures'

const CABLE_COLORS = ['#2a2420', '#5b2a22', '#3b3226', '#1f2622', '#4a3a2a']

export function Plugboard() {
  const plugs = useEnigma((s) => s.settings.plugs)
  return (
    <group>
      <mesh position={[0, 0.47, FRONT + 0.006]}>
        <boxGeometry args={[CASE.w - 0.24, 0.8, 0.012]} />
        <meshStandardMaterial color="#23211d" roughness={0.9} />
      </mesh>
      {[...ALPHABET].map((l) => (
        <Socket key={l} letter={l} />
      ))}
      {plugs.map((p, i) => (
        <Cable key={p} pair={p} color={CABLE_COLORS[i % CABLE_COLORS.length]} />
      ))}
    </group>
  )
}

function Socket({ letter }: { letter: string }) {
  const n = toNum(letter)
  const pending = useEnigma((s) => s.pendingPlug === n)
  const plugged = useEnigma((s) => s.settings.plugs.some((p) => p.includes(letter)))
  const click = useEnigma((s) => s.clickSocket)
  const { x, y } = socketPos(letter)
  const label = labelTexture(letter, { fg: pending ? '#ffcf6a' : '#e4d9bd', w: 64, h: 64, size: 46 })

  return (
    <group position={[x, y, FRONT + 0.012]}>
      <mesh position={[0, 0.115, 0.001]}>
        <planeGeometry args={[0.11, 0.11]} />
        <meshBasicMaterial map={label} transparent toneMapped={false} />
      </mesh>
      <group
        onClick={(e) => {
          e.stopPropagation()
          click(n)
        }}
        onPointerOver={() => (document.body.style.cursor = 'pointer')}
        onPointerOut={() => (document.body.style.cursor = '')}
      >
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.078, 0.078, 0.014, 32]} />
          <meshStandardMaterial
            color={pending ? '#d99a2b' : '#8f887b'}
            emissive={pending ? '#ffb23b' : '#000000'}
            emissiveIntensity={pending ? 0.8 : 0}
            metalness={0.75}
            roughness={0.35}
          />
        </mesh>
        {[-0.03, 0.03].map((dx) => (
          <mesh key={dx} position={[dx, 0, 0.0075]}>
            <circleGeometry args={[0.017, 16]} />
            <meshBasicMaterial color="#0d0c0b" />
          </mesh>
        ))}
        {plugged && (
          <mesh position={[0, 0, 0.05]} rotation={[Math.PI / 2, 0, 0]} castShadow>
            <cylinderGeometry args={[0.055, 0.06, 0.09, 24]} />
            <meshStandardMaterial color="#1b1916" roughness={0.6} />
          </mesh>
        )}
      </group>
    </group>
  )
}

function Cable({ pair, color }: { pair: string; color: string }) {
  const geometry = useMemo(() => {
    const a = socketPos(pair[0])
    const b = socketPos(pair[1])
    const z = FRONT + 0.1
    const span = Math.hypot(a.x - b.x, a.y - b.y)
    const sag = Math.min(a.y, b.y) - 0.18 - span * 0.12
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(a.x, a.y, z),
      new THREE.Vector3(a.x, a.y - 0.08, z + 0.1),
      new THREE.Vector3((a.x + b.x) / 2, sag, z + 0.22 + span * 0.04),
      new THREE.Vector3(b.x, b.y - 0.08, z + 0.1),
      new THREE.Vector3(b.x, b.y, z),
    ])
    return new THREE.TubeGeometry(curve, 64, 0.022, 10, false)
  }, [pair])
  return (
    <mesh geometry={geometry} castShadow>
      <meshStandardMaterial color={color} roughness={0.75} />
    </mesh>
  )
}
