import Link from 'next/link'

export default function NotFound() {
  return (
    <main className="mx-auto max-w-[680px] px-4 py-24 text-center">
      <p className="gate-label">404</p>
      <h1 className="mt-2 font-serif text-4xl">Такой страницы нет</h1>
      <p className="mt-3 text-ink-soft">Возможно, этот урок ещё в работе.</p>
      <Link href="/courses/attention" className="btn-primary mt-6">
        К программе курса
      </Link>
    </main>
  )
}
