'use client'

import { Html } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useRef, useState } from 'react'
import type { Group } from 'three'
import { GROUPS, WORDS, type WordGroup } from '@/content/home/word-cloud'

export function WordCloudScene({ rotate }: { rotate: boolean }) {
  const cloud = useRef<Group>(null)
  const [hovered, setHovered] = useState<WordGroup | null>(null)

  useFrame((_, delta) => {
    if (rotate && cloud.current) cloud.current.rotation.y += delta * 0.08
  })

  return (
    <group ref={cloud}>
      {WORDS.map(({ word, group, pos }) => {
        const dim = hovered !== null && hovered !== group
        const color = GROUPS[group].color
        return (
          <group key={word} position={pos}>
            <mesh
              onPointerOver={(e) => {
                e.stopPropagation()
                setHovered(group)
              }}
              onPointerOut={() => setHovered(null)}
            >
              <sphereGeometry args={[0.09, 16, 16]} />
              <meshStandardMaterial
                color={color}
                emissive={color}
                emissiveIntensity={dim ? 0.1 : 0.8}
                transparent
                opacity={dim ? 0.3 : 1}
              />
            </mesh>
            <Html center className="vector-label" style={{ color, opacity: dim ? 0.25 : 1, transform: 'translateY(-16px)' }}>
              {word}
            </Html>
          </group>
        )
      })}
    </group>
  )
}
