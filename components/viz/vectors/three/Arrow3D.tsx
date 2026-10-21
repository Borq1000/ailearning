'use client'

import { useCursor } from '@react-three/drei'
import type { ThreeEvent } from '@react-three/fiber'
import { useMemo, useState } from 'react'
import { Quaternion, Vector3, type Object3D } from 'three'
import type { Vec } from '@/lib/math'

export function pad3(v: Vec): [number, number, number] {
  return [v[0] ?? 0, v[1] ?? 0, v[2] ?? 0]
}

/** Стрелка — ближайший к камере объект под курсором (а не, например, шарик перетаскивания на её кончике). */
function isFrontHit(e: ThreeEvent<PointerEvent>): boolean {
  let object: Object3D | null = e.intersections[0]?.object ?? null
  while (object && object !== e.eventObject) object = object.parent
  return object !== null
}

export function Arrow3D({
  from = [0, 0, 0],
  to,
  color,
  radius = 0.045,
  onClick,
}: {
  from?: Vec
  to: Vec
  color: string
  radius?: number
  onClick?: (e: ThreeEvent<MouseEvent>) => void
}) {
  const { length, start, quaternion } = useMemo(() => {
    const s = new Vector3(...pad3(from))
    const dir = new Vector3(...pad3(to)).sub(s)
    const q = new Quaternion().setFromUnitVectors(
      new Vector3(0, 1, 0),
      dir.length() > 0 ? dir.clone().normalize() : new Vector3(0, 1, 0),
    )
    return { length: dir.length(), start: s, quaternion: q }
  }, [from, to])

  // Рука над стрелкой, которую можно нажать. Не перебиваем курсор шарика перетаскивания: руки нет,
  // если спереди шарик или зажата кнопка мыши (шарик тянут).
  const [hovered, setHovered] = useState(false)
  useCursor(hovered)
  const hover = onClick
    ? {
        onPointerOver: (e: ThreeEvent<PointerEvent>) => setHovered(e.nativeEvent.buttons === 0 && isFrontHit(e)),
        onPointerMove: (e: ThreeEvent<PointerEvent>) => setHovered(e.nativeEvent.buttons === 0 && isFrontHit(e)),
        onPointerOut: () => setHovered(false),
      }
    : {}

  if (length < 1e-6) {
    return (
      <mesh position={pad3(from)} onClick={onClick} {...hover}>
        <sphereGeometry args={[radius * 2, 16, 16]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.4} />
      </mesh>
    )
  }

  const head = Math.min(0.3, length * 0.35)
  const shaft = length - head
  return (
    <group position={start} quaternion={quaternion} onClick={onClick} {...hover}>
      <mesh position={[0, shaft / 2, 0]}>
        <cylinderGeometry args={[radius, radius, shaft, 12]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.35} />
      </mesh>
      <mesh position={[0, shaft + head / 2, 0]}>
        <coneGeometry args={[radius * 2.6, head, 20]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.35} />
      </mesh>
    </group>
  )
}
