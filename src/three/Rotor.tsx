import { useMemo, useRef, useState } from 'react'
import { useFrame, type ThreeEvent } from '@react-three/fiber'
import * as THREE from 'three'
import { useEnigma } from '../store'
import { ROTOR } from './layout'
import { labelTexture, rotorRingTexture, windowFrameTexture } from './textures'

const STEP = (2 * Math.PI) / 26

// The ring geometry is a cylinder whose local y-axis is turned to run along world x.
// Local angle θ = 0 faces the operator (+z) and increases toward world −y (down), so
// "up-and-toward-the-operator" — the reading window — is θ = −π/4.
const windowTheta = -ROTOR.readAngle
const angleFor = (pos: number) => windowTheta - STEP * (pos + 0.5)

const wrap = (a: number) => Math.atan2(Math.sin(a), Math.cos(a))

export function Rotor({ slot }: { slot: number }) {
  const name = useEnigma((s) => s.settings.rotors[slot])
  const pos = useEnigma((s) => s.positions[slot])
  const nudge = useEnigma((s) => s.nudgePosition)
  const spin = useRef<THREE.Group>(null)
  const [hover, setHover] = useState(false)
  const ringTex = useMemo(() => rotorRingTexture(), [])
  const x = ROTOR.slotX[slot]

  useFrame((_, dt) => {
    const g = spin.current
    if (!g) return
    const delta = wrap(angleFor(pos) - g.rotation.y)
    g.rotation.y += delta * (1 - Math.exp(-dt * 16))
  })

  const turn = (e: ThreeEvent<MouseEvent>, dir: number) => {
    e.stopPropagation()
    nudge(slot, dir)
  }

  return (
    <group position={[x, ROTOR.axisY, ROTOR.z]}>
      <group rotation={[0, 0, -Math.PI / 2]}>
        <group ref={spin} rotation={[0, angleFor(pos), 0]}>
          <mesh
            castShadow
            onClick={(e) => turn(e, 1)}
            onContextMenu={(e) => {
              e.nativeEvent.preventDefault()
              turn(e, -1)
            }}
            onPointerOver={(e) => {
              e.stopPropagation()
              setHover(true)
              document.body.style.cursor = 'pointer'
            }}
            onPointerOut={() => {
              setHover(false)
              document.body.style.cursor = ''
            }}
          >
            <cylinderGeometry args={[ROTOR.radius, ROTOR.radius, ROTOR.width, 78, 1]} />
            <meshStandardMaterial attach="material-0" map={ringTex} roughness={0.55} emissive="#f3c770" emissiveIntensity={hover ? 0.12 : 0} />
            <meshStandardMaterial attach="material-1" color="#3a3632" metalness={0.6} roughness={0.4} />
            <meshStandardMaterial attach="material-2" color="#3a3632" metalness={0.6} roughness={0.4} />
          </mesh>
          {/* Serrated thumbwheel on the right-hand side of each rotor. */}
          <Thumbwheel />
        </group>
      </group>
      {/* Brass frame around the letter in the reading window */}
      <mesh
        position={[0, Math.cos(ROTOR.readAngle) * (ROTOR.radius + 0.004), Math.sin(ROTOR.readAngle) * (ROTOR.radius + 0.004)]}
        rotation={[-ROTOR.readAngle, 0, 0]}
      >
        <planeGeometry args={[ROTOR.width + 0.02, ((2 * Math.PI * ROTOR.radius) / 26) * 1.15]} />
        <meshStandardMaterial map={windowFrameTexture()} transparent metalness={0.35} roughness={0.45} depthWrite={false} />
      </mesh>
      {/* Reading pointer */}
      <mesh
        position={[0, Math.cos(ROTOR.readAngle) * (ROTOR.radius + 0.05), Math.sin(ROTOR.readAngle) * (ROTOR.radius + 0.05)]}
        rotation={[ROTOR.readAngle + Math.PI, 0, 0]}
        visible={false}
      >
        <coneGeometry args={[0.03, 0.06, 3]} />
        <meshStandardMaterial color="#b0342a" roughness={0.5} />
      </mesh>
      <RotorPlate name={name} />
    </group>
  )
}

function Thumbwheel() {
  const teeth = useMemo(() => Array.from({ length: 26 }, (_, i) => (i / 26) * Math.PI * 2), [])
  const y = ROTOR.width / 2 + 0.035
  return (
    <group position={[0, -y, 0]}>
      <mesh castShadow>
        <cylinderGeometry args={[ROTOR.radius + 0.03, ROTOR.radius + 0.03, 0.06, 52]} />
        <meshStandardMaterial color="#2b2825" metalness={0.5} roughness={0.5} />
      </mesh>
      {teeth.map((a) => (
        <mesh key={a} position={[Math.sin(a) * (ROTOR.radius + 0.035), 0, Math.cos(a) * (ROTOR.radius + 0.035)]} rotation={[0, a, 0]}>
          <boxGeometry args={[0.03, 0.06, 0.03]} />
          <meshStandardMaterial color="#45403a" metalness={0.6} roughness={0.4} />
        </mesh>
      ))}
    </group>
  )
}

function RotorPlate({ name }: { name: string }) {
  const tex = labelTexture(name, { fg: '#3a2a12', bg: '#c9a85c', w: 128, h: 64, size: 46 })
  return (
    <mesh position={[0, -0.14, 0.305]}>
      <planeGeometry args={[0.2, 0.1]} />
      <meshStandardMaterial map={tex} metalness={0.5} roughness={0.35} />
    </mesh>
  )
}

/** Fixed wheels at either end: the reflector (left) and the entry wheel (right). */
export function FixedWheel({ kind }: { kind: 'reflector' | 'entry' }) {
  const reflector = useEnigma((s) => s.settings.reflector)
  const x = kind === 'reflector' ? ROTOR.reflectorX : ROTOR.entryX
  const label = kind === 'reflector' ? reflector.replace('UKW-', '') : 'ETW'
  const tex = labelTexture(label, { fg: '#e7dcc0', bg: '#2a2622', w: 128, h: 64, size: 40 })
  return (
    <group position={[x, ROTOR.axisY, ROTOR.z]}>
      <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[ROTOR.radius - 0.02, ROTOR.radius - 0.02, kind === 'reflector' ? 0.22 : 0.16, 48]} />
        <meshStandardMaterial color={kind === 'reflector' ? '#4a443d' : '#5d564d'} metalness={0.7} roughness={0.35} />
      </mesh>
      <mesh position={[0, 0.0, ROTOR.radius - 0.015]} rotation={[0, 0, 0]}>
        <planeGeometry args={[0.18, 0.09]} />
        <meshStandardMaterial map={tex} roughness={0.6} />
      </mesh>
    </group>
  )
}
