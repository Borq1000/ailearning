'use client'

import { useCursor } from '@react-three/drei'
import { useThree, type ThreeEvent } from '@react-three/fiber'
import { useMemo, useState } from 'react'
import { Plane, Vector3 } from 'three'
import type { Vec } from '@/lib/math'
import { snapVec } from '@/lib/viz/vector-helpers'
import { pad3 } from './Arrow3D'

/** Светящийся шарик на кончике стрелки: тянется в плоскости экрана, координаты прилипают к сетке 0.5. */
export function DragHandle({ position, color, onDrag }: { position: Vec; color: string; onDrag: (v: Vec) => void }) {
  const controls = useThree((s) => s.controls) as unknown as { enabled: boolean } | null
  const camera = useThree((s) => s.camera)
  const [dragging, setDragging] = useState(false)
  const [hover, setHover] = useState(false)
  const plane = useMemo(() => new Plane(), [])
  const hit = useMemo(() => new Vector3(), [])
  useCursor(hover || dragging, dragging ? 'grabbing' : 'grab')

  function onPointerDown(e: ThreeEvent<PointerEvent>) {
    e.stopPropagation()
    ;(e.target as Element).setPointerCapture(e.pointerId)
    const normal = new Vector3()
    camera.getWorldDirection(normal)
    plane.setFromNormalAndCoplanarPoint(normal, new Vector3(...pad3(position)))
    if (controls) controls.enabled = false
    setDragging(true)
  }

  function onPointerMove(e: ThreeEvent<PointerEvent>) {
    if (!dragging) return
    e.stopPropagation()
    if (e.ray.intersectPlane(plane, hit)) onDrag(snapVec([hit.x, hit.y, hit.z]))
  }

  function onPointerEnd(e: ThreeEvent<PointerEvent>) {
    if (!dragging) return
    ;(e.target as Element).releasePointerCapture(e.pointerId)
    if (controls) controls.enabled = true
    setDragging(false)
  }

  const active = hover || dragging
  return (
    <mesh
      position={pad3(position)}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerEnd}
      onPointerCancel={onPointerEnd}
      onPointerOver={() => setHover(true)}
      onPointerOut={() => setHover(false)}
    >
      <sphereGeometry args={[active ? 0.17 : 0.13, 20, 20]} />
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={active ? 0.9 : 0.5} />
    </mesh>
  )
}
