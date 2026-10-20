'use client'

import { OrbitControls } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'
import type { ReactNode } from 'react'

export interface SceneCanvasProps {
  camera?: [number, number, number]
  frameloop?: 'demand' | 'always'
  onContextLost: () => void
  children?: ReactNode
}

export default function SceneCanvas({ camera = [5, 4, 6], frameloop = 'demand', onContextLost, children }: SceneCanvasProps) {
  return (
    <Canvas
      frameloop={frameloop}
      dpr={[1, 2]}
      camera={{ position: camera, fov: 45 }}
      gl={{ antialias: true, alpha: true }}
      onCreated={({ gl }) => {
        gl.domElement.addEventListener('webglcontextlost', (e) => {
          e.preventDefault()
          onContextLost()
        })
      }}
    >
      <ambientLight intensity={0.7} />
      <directionalLight position={[5, 8, 5]} intensity={1.1} />
      {children}
      <OrbitControls makeDefault enablePan={false} minDistance={3} maxDistance={18} />
    </Canvas>
  )
}
