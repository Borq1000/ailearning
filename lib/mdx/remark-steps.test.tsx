// @vitest-environment node
import { evaluate } from '@mdx-js/mdx'
import { createElement, type ReactNode } from 'react'
import * as runtime from 'react/jsx-runtime'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import remarkSteps from './remark-steps.mjs'

function Step({ index, total, children }: { index: string; total: string; children?: ReactNode }) {
  return createElement('section', { 'data-step': index, 'data-total': total }, children)
}

function Badge({ children }: { children?: ReactNode }) {
  return createElement('mark', null, children)
}

async function render(source: string) {
  const mod = await evaluate(source, { ...runtime, remarkPlugins: [remarkSteps] })
  const html = renderToStaticMarkup(createElement(mod.default, { components: { LessonStep: Step, Badge } }))
  return { html, mod }
}

function stepBody(html: string, index: number): string {
  const match = html.match(new RegExp(`<section data-step="${index}"[^>]*>([\\s\\S]*?)</section>`))
  return match?.[1] ?? ''
}

describe('remarkSteps', () => {
  it('wraps content between --- into numbered steps', async () => {
    const { html } = await render('# Один\n\nтекст\n\n---\n\n## Два\n\nещё')
    expect(html.match(/<section/g)).toHaveLength(2)
    expect(html).toContain('data-total="2"')
    expect(stepBody(html, 0)).toContain('Один')
    expect(stepBody(html, 0)).not.toContain('Два')
    expect(stepBody(html, 1)).toContain('Два')
  })

  it('makes a single step when there is no ---', async () => {
    const { html } = await render('Просто текст.')
    expect(html.match(/<section/g)).toHaveLength(1)
    expect(html).toContain('data-total="1"')
  })

  it('never creates empty steps from leading, trailing or repeated ---', async () => {
    const { html } = await render('---\n\nА\n\n---\n\n---\n\nБ\n\n---\n')
    expect(html.match(/<section/g)).toHaveLength(2)
  })

  it('keeps exports at module level and JSX components inside steps', async () => {
    const { html, mod } = await render('export const cards = [1, 2]\n\n<Badge>важно</Badge>\n\n---\n\nдальше')
    expect(mod.cards).toEqual([1, 2])
    expect(stepBody(html, 0)).toContain('<mark>важно</mark>')
  })
})
