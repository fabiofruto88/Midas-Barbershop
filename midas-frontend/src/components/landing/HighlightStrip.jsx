import { highlights } from '../../content/landing'

export default function HighlightStrip() {
  return (
    <section aria-label="Midas en cifras" className="border-y border-line/30 bg-surface py-4">
      <dl className="mx-auto grid max-w-[1440px] grid-cols-2 gap-6 px-4 text-center sm:px-8 md:flex md:justify-center xl:px-16">
        {highlights.map((item) => (
          <div key={item.label} className="flex flex-col-reverse items-center gap-1 md:flex-1">
            <dt className="text-[9px] leading-3 font-bold tracking-[0.2em] text-muted uppercase">{item.label}</dt>
            <dd className="font-display text-2xl leading-8 font-medium tracking-[0.1em] text-brand uppercase">
              {item.value}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  )
}
