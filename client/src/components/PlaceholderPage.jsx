export default function PlaceholderPage({ title, description }) {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-4xl flex-col justify-center px-6 py-16">
      <a className="mb-10 w-fit font-semibold text-emerald-700" href="/">
        god-code
      </a>
      <h1 className="text-4xl font-semibold tracking-tight text-slate-950">{title}</h1>
      <p className="mt-3 max-w-xl text-base leading-7 text-slate-600">{description}</p>
    </main>
  )
}