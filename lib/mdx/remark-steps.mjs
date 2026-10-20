/**
 * remark-плагин: делит верхний уровень MDX-урока по горизонтальным чертам (---)
 * и оборачивает каждую часть в <LessonStep index="i" total="n">.
 * ESM-узлы (import/export) остаются на верхнем уровне. Пустые части отбрасываются.
 */
export default function remarkSteps() {
  return (tree) => {
    const moduleLevel = []
    const groups = [[]]
    for (const node of tree.children) {
      if (node.type === 'mdxjsEsm' || node.type === 'yaml') {
        moduleLevel.push(node)
      } else if (node.type === 'thematicBreak') {
        groups.push([])
      } else {
        groups[groups.length - 1].push(node)
      }
    }
    const steps = groups.filter((group) => group.length > 0)
    tree.children = [
      ...moduleLevel,
      ...steps.map((children, index) => ({
        type: 'mdxJsxFlowElement',
        name: 'LessonStep',
        attributes: [
          { type: 'mdxJsxAttribute', name: 'index', value: String(index) },
          { type: 'mdxJsxAttribute', name: 'total', value: String(steps.length) },
        ],
        children,
      })),
    ]
  }
}
