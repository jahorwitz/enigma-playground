import { useMemo } from 'react'
import { CASE, ROTOR, TOP } from './layout'
import { crackleTexture, labelTexture, woodTexture } from './textures'

export function Case() {
  const wood = useMemo(() => woodTexture(), [])
  const crackle = useMemo(() => crackleTexture(), [])
  const nameplate = labelTexture('ENIGMA', { fg: '#2b2010', bg: '#c3a25a', w: 256, h: 64, size: 46 })

  return (
    <group>
      {/* Wooden box */}
      <mesh position={[0, CASE.h / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[CASE.w, CASE.h, CASE.d]} />
        <meshStandardMaterial map={wood} roughness={0.62} color="#b08560" />
      </mesh>
      {/* Black crackle-finish top plate */}
      <mesh position={[0, TOP + 0.005, 0]} receiveShadow>
        <boxGeometry args={[CASE.w - 0.12, 0.012, CASE.d - 0.12]} />
        <meshStandardMaterial color="#1e1c19" roughness={0.92} roughnessMap={crackle} bumpMap={crackle} bumpScale={0.6} />
      </mesh>
      {/* Rotor housing */}
      <mesh position={[0, TOP + 0.08, ROTOR.z]} castShadow receiveShadow>
        <boxGeometry args={[CASE.w - 0.24, 0.16, 0.6]} />
        <meshStandardMaterial color="#272420" roughness={0.8} roughnessMap={crackle} bumpMap={crackle} bumpScale={0.4} />
      </mesh>
      {/* Nameplate between the lamps and keys */}
      <mesh position={[0, TOP + 0.013, 0.2]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.6, 0.15]} />
        <meshStandardMaterial map={nameplate} metalness={0.6} roughness={0.35} />
      </mesh>
      {/* Brass corner fittings */}
      {[-1, 1].flatMap((sx) =>
        [-1, 1].map((sz) => (
          <mesh key={`${sx}${sz}`} position={[(sx * CASE.w) / 2, CASE.h - 0.06, (sz * CASE.d) / 2]}>
            <boxGeometry args={[0.09, 0.12, 0.09]} />
            <meshStandardMaterial color="#a5843f" metalness={0.85} roughness={0.3} />
          </mesh>
        )),
      )}
    </group>
  )
}
