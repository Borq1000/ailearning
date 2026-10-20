'use client'

import { Html, Line } from '@react-three/drei'
import { BOUND } from '@/lib/viz/vector-helpers'

const AXES = [
  { name: 'X', dir: [1, 0, 0] },
  { name: 'Y', dir: [0, 1, 0] },
  { name: 'Z', dir: [0, 0, 1] },
] as const

export function Axes3D({ bound = BOUND }: { bound?: number }) {
  return (
    <group>
      <gridHelper args={[bound * 2, bound * 2, '#2a3768', '#161d45']} />
      {AXES.map(({ name, dir }) => {
        const end = dir.map((d) => d * bound) as [number, number, number]
        const start = dir.map((d) => -d * bound) as [number, number, number]
        return (
          <group key={name}>
            <Line points={[start, end]} color="#5b6b9a" lineWidth={1} />
            <Html position={end} center className="axis-label">
              {name}
            </Html>
          </group>
        )
      })}
    </group>
  )
}
