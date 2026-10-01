import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { ALPHABET, toNum } from '../enigma/engine'
import { useEnigma } from '../store'
import { lampPos, TOP } from './layout'
import { lampTexture } from './textures'

export function Lampboard() {
  return (
    <group>
      <mesh position={[0, TOP + 0.015, -0.34]} receiveShadow>
        <boxGeometry args={[2.95, 0.03, 0.92]} />
        <meshStandardMaterial color="#25231f" roughness={0.85} />
      </mesh>
      {[...ALPHABET].map((l) => (
        <Lamp key={l} letter={l} />
      ))}
      <LampGlow />
    </group>
  )
}

function Lamp({ letter }: { letter: string }) {
  const lit = useEnigma((s) => s.lit === toNum(letter))
  const mat = useRef<THREE.MeshStandardMaterial>(null)
  const { x, z } = lampPos(letter)
  const tex = lampTexture(letter)

  useFrame((_, dt) => {
    if (!mat.current) return
    const target = lit ? 2.6 : 0
    const k = lit ? 40 : 9 // snap on, fade off like a cooling filament
    mat.current.emissiveIntensity += (target - mat.current.emissiveIntensity) * (1 - Math.exp(-dt * k))
  })

  return (
    <group position={[x, TOP + 0.03, z]}>
      <mesh>
        <cylinderGeometry args={[0.13, 0.13, 0.025, 36]} />
        <meshStandardMaterial color="#77716a" metalness={0.8} roughness={0.35} />
      </mesh>
      <mesh position={[0, 0.0135, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.108, 36]} />
        <meshStandardMaterial
          ref={mat}
          map={tex}
          color="#c9c0ac"
          emissiveMap={tex}
          emissive="#ffae3d"
          emissiveIntensity={0}
          roughness={0.3}
          toneMapped={false}
        />
      </mesh>
      <mesh position={[0, 0.012, 0]} scale={[1, 0.22, 1]}>
        <sphereGeometry args={[0.106, 28, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshPhysicalMaterial transparent opacity={0.18} roughness={0.05} clearcoat={1} color="#fff6df" depthWrite={false} />
      </mesh>
    </group>
  )
}

/** One warm point light that jumps to whichever lamp is lit. */
function LampGlow() {
  const lit = useEnigma((s) => s.lit)
  const light = useRef<THREE.PointLight>(null)
  useFrame((_, dt) => {
    const l = light.current
    if (!l) return
    if (lit !== null) {
      const { x, z } = lampPos(ALPHABET[lit])
      l.position.set(x, TOP + 0.25, z)
    }
    const target = lit !== null ? 1.6 : 0
    l.intensity += (target - l.intensity) * (1 - Math.exp(-dt * (lit !== null ? 40 : 9)))
  })
  return <pointLight ref={light} color="#ffb34d" intensity={0} distance={1.2} decay={2} />
}
