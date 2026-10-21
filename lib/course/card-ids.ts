import { readFileSync } from 'node:fs'
import path from 'node:path'
import { scopeId } from '@/lib/progress/scope'
import { listCourses, readyLessons } from './registry'

/**
 * id карточек из блока `export const cards = [...]` в исходнике урока.
 *
 * Исходник читается как текст, а не импортируется: импорт MDX тянет за собой mdx-components со всеми
 * клиентскими компонентами уроков, и в корневом layout они попали бы в JS каждой страницы сайта.
 * content/content.test.ts сверяет результат с настоящим экспортом `cards` каждого урока.
 */
export function cardIdsInSource(source: string): string[] {
  const block = /^export const cards = \[([\s\S]*?)^\]/m.exec(source)?.[1] ?? ''
  return [...block.matchAll(/\bid:\s*(['"])(.+?)\1/g)].map((match) => match[2])
}

/** id всех карточек готовых уроков всех курсов в ключах прогресса (под курсом) — колода повторения. Только для сервера (читает файлы при сборке). */
export function readyCardIds(): string[] {
  return listCourses().flatMap((course) =>
    readyLessons(course).flatMap((lesson) =>
      cardIdsInSource(
        readFileSync(path.join(process.cwd(), 'content', course.id, 'lessons', `${lesson.slug}.mdx`), 'utf8'),
      ).map((id) => scopeId(course.id, id)),
    ),
  )
}
