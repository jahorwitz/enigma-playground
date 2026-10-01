import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { ALPHABET, toNum } from '../enigma/engine'
import { useEnigma } from '../store'
import { keyPos, TOP } from './layout'
import { keyCapTexture } from './textures'

export function Keyboard() {
  return (
    <group>
      {[...ALPHABET].map((l) => (
        <Key key={l} letter={l} />
      ))}
    </group>
  )
}

function Key({ letter }: { letter: string }) {
  const n = toNum(letter)
  const pressed = useEnigma((s) => s.pressed === n)
  const press = useEnigma((s) => s.press)
  const cap = useRef<THREE.Group>(null)
  const { x, z } = keyPos(letter)

  useFrame((_, dt) => {
    if (!cap.current) return
    const target = pressed ? -0.07 : 0
    cap.current.position.y += (target - cap.current.position.y) * (1 - Math.exp(-dt * 30))
  })

  return (
    <group position={[x, TOP, z]}>
      <mesh position={[0, 0.07, 0]}>
        <cylinderGeometry args={[0.025, 0.025, 0.14, 10]} />
        <meshStandardMaterial color="#8d877c" metalness={0.8} roughness={0.35} />
      </mesh>
      <group ref={cap}>
        <group
          position={[0, 0.16, 0]}
          onPointerDown={(e) => {
            e.stopPropagation()
            press(n)
          }}
          onPointerOver={() => (document.body.style.cursor = 'pointer')}
          onPointerOut={() => (document.body.style.cursor = '')}
        >
          <mesh castShadow>
            <cylinderGeometry args={[0.135, 0.13, 0.05, 40]} />
            <meshStandardMaterial color="#c9c3b6" metalness={0.85} roughness={0.28} />
          </mesh>
          <mesh position={[0, 0.0262, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[0.112, 40]} />
            <meshStandardMaterial map={keyCapTexture(letter)} roughness={0.45} />
          </mesh>
        </group>
      </group>
    </group>
  )
}
