import { useEffect } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import { ContactShadows, Environment, Lightformer, OrbitControls } from '@react-three/drei'
import { Bloom, EffectComposer, Vignette } from '@react-three/postprocessing'
import { Case } from './Case'
import { Hotspots } from './Hotspots'
import { Keyboard } from './Keyboard'
import { Lampboard } from './Lampboard'
import { Plugboard } from './Plugboard'
import { FixedWheel, Rotor } from './Rotor'

const TARGET: [number, number, number] = [0, 0.55, 0.05]
const BASE_OFFSET: [number, number, number] = [0, 3.45, 4.35]

/** Pull the camera back on narrow viewports so the whole case stays in frame. */
function FitCamera() {
  const camera = useThree((s) => s.camera)
  const aspect = useThree((s) => s.size.width / s.size.height)
  const controls = useThree((s) => s.controls)
  if (import.meta.env.DEV) (window as unknown as { controls: unknown }).controls = controls
  useEffect(() => {
    const k = Math.min(2.4, Math.max(1, 1.45 / aspect))
    camera.position.set(TARGET[0] + BASE_OFFSET[0] * k, TARGET[1] + BASE_OFFSET[1] * k, TARGET[2] + BASE_OFFSET[2] * k)
    camera.lookAt(...TARGET)
    if (import.meta.env.DEV) (window as unknown as { camera: unknown }).camera = camera
  }, [aspect, camera])
  return null
}

export default function MachineScene() {
  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      camera={{ position: [0, 3.6, 4.9], fov: 36 }}
      onContextMenu={(e) => e.preventDefault()}
    >
      <color attach="background" args={['#3a3d33']} />
      <fog attach="fog" args={['#3a3d33', 9, 16]} />

      <ambientLight intensity={0.25} />
      <directionalLight
        position={[3, 6, 3]}
        intensity={1.8}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-3}
        shadow-camera-right={3}
        shadow-camera-top={3}
        shadow-camera-bottom={-3}
        shadow-bias={-0.0005}
      />
      <Environment resolution={256}>
        <Lightformer intensity={1.6} position={[0, 5, 2]} rotation-x={Math.PI / 2} scale={[8, 4, 1]} />
        <Lightformer intensity={0.8} position={[-5, 2, 1]} rotation-y={Math.PI / 2} scale={[6, 2, 1]} color="#ffe2b8" />
        <Lightformer intensity={0.5} position={[5, 2, -1]} rotation-y={-Math.PI / 2} scale={[6, 2, 1]} />
      </Environment>

      <group position={[0, 0, 0]}>
        <Case />
        <Keyboard />
        <Lampboard />
        <Plugboard />
        <FixedWheel kind="reflector" />
        {[0, 1, 2].map((slot) => (
          <Rotor key={slot} slot={slot} />
        ))}
        <FixedWheel kind="entry" />
        <Hotspots />
      </group>

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.001, 0]} receiveShadow>
        <planeGeometry args={[40, 40]} />
        <meshStandardMaterial color="#4a4c3f" roughness={1} />
      </mesh>
      <ContactShadows position={[0, 0.001, 0]} opacity={0.55} scale={9} blur={2.4} far={2} />

      <FitCamera />
      <OrbitControls
        makeDefault
        target={TARGET}
        enablePan={false}
        minDistance={1.8}
        maxDistance={13}
        minPolarAngle={0.15}
        maxPolarAngle={1.45}
        minAzimuthAngle={-1.2}
        maxAzimuthAngle={1.2}
      />

      <EffectComposer multisampling={4}>
        <Bloom mipmapBlur luminanceThreshold={1} intensity={0.8} radius={0.5} />
        <Vignette offset={0.3} darkness={0.55} />
      </EffectComposer>
    </Canvas>
  )
}
