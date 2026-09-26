// Sección numerada del flujo de reserva. Las secciones bloqueadas se muestran atenuadas.
export default function Step({ number, title, summary, locked = false, children }) {
  return (
    <section
      aria-labelledby={`paso-${number}`}
      aria-disabled={locked}
      className={`space-y-4 border-l-2 pl-5 sm:pl-7 ${locked ? 'border-border opacity-40' : 'border-brand'}`}
    >
      <header className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id={`paso-${number}`} className="text-lg font-semibold">
          <span className="mr-2 text-brand">{number}.</span>
          {title}
        </h2>
        {summary && <span className="text-sm text-muted">{summary}</span>}
      </header>
      {!locked && children}
    </section>
  )
}
