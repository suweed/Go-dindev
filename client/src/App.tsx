import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'

function Cubo() {
  return (
    <mesh>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="#4f8cff" />
    </mesh>
  )
}

function Piso() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]}>
      <planeGeometry args={[10, 10]} />
      <meshStandardMaterial color="#e8e8e8" />
    </mesh>
  )
}

function App() {
  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <Canvas camera={{ position: [4, 6, 4], fov: 45 }}>
        <ambientLight intensity={0.6} />
        <directionalLight position={[5, 8, 5]} intensity={1} />
        <Piso />
        <Cubo />
        <OrbitControls />
      </Canvas>
    </div>
  )
}

export default App
