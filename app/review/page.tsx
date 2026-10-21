import type { Metadata } from 'next'
import { ReviewDeck } from '@/components/review/ReviewDeck'
import { loadLessonModule } from '@/lib/course/lesson-module'
import { listCourses, readyLessons } from '@/lib/course/registry'
import { scopeId } from '@/lib/progress/scope'

export const metadata: Metadata = {
  title: 'Повторение',
  description: 'Интервальное повторение карточек из пройденных уроков.',
}

export default async function ReviewPage() {
  const cards = (
    await Promise.all(
      listCourses().flatMap((course) =>
        readyLessons(course).map(async (lesson) => {
          const mod = await loadLessonModule(course.id, lesson.slug)
          // в колоде карточки живут под курсом — так же, как в прогрессе
          return mod.cards.map((card) => ({ ...card, id: scopeId(course.id, card.id) }))
        }),
      ),
    )
  ).flat()
  return (
    <main className="mx-auto max-w-[680px] px-4 py-12">
      <p className="gate-label">Интервальное повторение</p>
      <h1 className="mt-2 font-serif text-4xl">Повторение</h1>
      <p className="mt-3 text-ink-soft">
        Карточки возвращаются через 1, 3, 7, 16 и 35 дней. Отвечай по памяти — именно это укрепляет знания.
      </p>
      <div className="mt-8">
        <ReviewDeck cards={cards} />
      </div>
    </main>
  )
}
