'use client'

import { Html, Line } from '@react-three/drei'
import { matVec, type Mat, type Vec } from '@/lib/math'
import { CONCEPTS } from '@/lib/theme/concepts'
import { CUBE_EDGES, MATRIX_GRID_BOUND, column, cubeCorners, transformPoints } from '@/lib/viz/matrix-helpers'
import { formatVec, vecEquals } from '@/lib/viz/vector-helpers'
import { useStageInfo } from '@/components/viz/stage/stage-context'
import { Arrow3D, pad3 } from '@/components/viz/vectors/three/Arrow3D'
import { Axes3D } from '@/components/viz/vectors/three/Axes3D'
import { DragHandle } from '@/components/viz/vectors/three/DragHandle'

const AXIS_NAMES = ['X', 'Y', 'Z']
/** Образы осей X′, Y′, Z′. Не цвета понятий: голубой, оранжевый и фиолетовый в этом уроке — запрос, ключ и значение. */
export const COLUMN_COLORS = ['#f87171', '#fde047', '#f472b6']
const INPUT_COLOR = '#dbe6ff'
const RESULT_COLOR = CONCEPTS.result.glow
const CUBE_COLOR = '#3b4a85'
/** Сцена меньше, чем у векторов (сетка ±3): шарик для перетаскивания тоже меньше. */
const HANDLE_RADIUS = 0.08

export interface TipLabel {
  text: string
  at: Vec
  color: string
  /** Сдвиг подписи от кончика стрелки (CSS transform). */
  offset: string
}

/** Подписи кончиков v и M·v. Если M·v = v (например, у единичной матрицы), стрелки совпали — подпись одна, а не две друг на друге. */
export function tipLabels(vector: Vec, image: Vec): TipLabel[] {
  const result = { at: image, color: RESULT_COLOR, offset: 'translate(10px, 8px)' }
  if (vecEquals(image, vector, 1e-9)) return [{ text: 'v = M·v', ...result }]
  return [
    { text: 'v', at: vector, color: INPUT_COLOR, offset: 'translate(10px, -20px)' },
    { text: 'M·v', ...result },
  ]
}

/**
 * Единичный куб до и после матрицы, три столбца как образы осей, входной вектор v и его образ M·v.
 * Все числа считает lib/math; сцена только рисует.
 */
export function MatrixScene({
  matrix,
  vector,
  onVectorChange,
}: {
  matrix: Mat
  vector: Vec
  onVectorChange?: (v: Vec) => void
}) {
  const info = useStageInfo()
  const corners = cubeCorners(1)
  const moved = transformPoints(matrix, corners)
  const image = matVec(matrix, vector)

  return (
    <>
      <Axes3D bound={MATRIX_GRID_BOUND} />
      {CUBE_EDGES.map(([a, b], i) => (
        <Line key={`cube-${i}`} points={[pad3(corners[a]), pad3(corners[b])]} color={CUBE_COLOR} lineWidth={1} />
      ))}
      {CUBE_EDGES.map(([a, b], i) => (
        <Line key={`moved-${i}`} points={[pad3(moved[a]), pad3(moved[b])]} color={RESULT_COLOR} lineWidth={1.5} />
      ))}
      {[0, 1, 2].map((j) => {
        const col = column(matrix, j)
        const unit = AXIS_NAMES.map((_, k) => (k === j ? 1 : 0)).join(', ')
        return (
          <group key={j}>
            <Arrow3D
              to={col}
              color={COLUMN_COLORS[j]}
              radius={0.03}
              onClick={(e) => {
                e.stopPropagation()
                info?.show({
                  title: `${j + 1}-й столбец`,
                  body: `Ось ${AXIS_NAMES[j]} переехала в ${formatVec(col)}. Это ${j + 1}-й столбец матрицы: M·[${unit}].`,
                })
              }}
            />
            <Html position={pad3(col)} className="vector-label" style={{ color: COLUMN_COLORS[j], transform: 'translate(8px, -16px)' }}>
              {AXIS_NAMES[j]}′
            </Html>
          </group>
        )
      })}
      <group>
        <Arrow3D
          to={vector}
          color={INPUT_COLOR}
          onClick={(e) => {
            e.stopPropagation()
            info?.show({ title: 'Вектор v', body: `v = ${formatVec(vector)} — то, что подаём на вход. Потяни за шарик.` })
          }}
        />
        {onVectorChange && (
          <DragHandle position={vector} color={INPUT_COLOR} onDrag={onVectorChange} radius={HANDLE_RADIUS} />
        )}
      </group>
      <group>
        <Arrow3D
          to={image}
          color={RESULT_COLOR}
          onClick={(e) => {
            e.stopPropagation()
            info?.show({
              title: 'M·v',
              body: `M·v = ${formatVec(image)}: каждая координата — скалярное произведение строки M на v.`,
            })
          }}
        />
      </group>
      {tipLabels(vector, image).map((label) => (
        <Html
          key={label.text}
          position={pad3(label.at)}
          className="vector-label"
          style={{ color: label.color, transform: label.offset }}
        >
          {label.text}
        </Html>
      ))}
    </>
  )
}
