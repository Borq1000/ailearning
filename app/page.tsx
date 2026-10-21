import Link from 'next/link'
import { ContinueButton } from '@/components/course/ContinueButton'
import { CourseCard } from '@/components/course/CourseCard'
import { WordCloud3D } from '@/components/viz/words/WordCloud3D'
import { listCourses } from '@/lib/course/registry'

export default function Home() {
  const courses = listCourses()
  const course = courses[0]
  return (
    <main>
      <section className="mx-auto grid max-w-7xl gap-10 px-4 py-14 lg:grid-cols-[1.05fr_1fr] lg:px-8 lg:py-20">
        <div className="self-center">
          <p className="gate-label">Интерактивный учебник</p>
          <h1 className="mt-3 font-serif text-5xl leading-[1.05] lg:text-6xl">
            Как машина научилась <em className="text-ink-cyan">обращать внимание</em>
          </h1>
          <p className="mt-5 max-w-xl text-lg text-ink-soft">
            От «что такое стрелка» до статьи «Attention Is All You Need» — с 3D-сценами, задачами и кодом, который ты
            напишешь сам.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <ContinueButton course={course} />
            <Link href="/courses/attention" className="btn-ghost px-5 py-3 text-base">
              Программа курса
            </Link>
          </div>
        </div>
        <WordCloud3D />
      </section>
      <section className="mx-auto max-w-7xl px-4 pb-20 lg:px-8">
        <h2 className="font-serif text-3xl">Курсы</h2>
        <div className="mt-6 grid gap-5 md:grid-cols-2">
          {courses.map((c, i) => (
            <CourseCard key={c.id} course={c} index={i + 1} />
          ))}
          <div className="rounded-2xl border border-dashed border-line p-6">
            <p className="gate-label">Скоро</p>
            <h3 className="mt-2 font-serif text-2xl text-muted">Как модели учатся</h3>
            <p className="mt-2 text-muted">Градиентный спуск, обратное распространение ошибки и обучение маленькой модели в браузере.</p>
          </div>
        </div>
      </section>
    </main>
  )
}
