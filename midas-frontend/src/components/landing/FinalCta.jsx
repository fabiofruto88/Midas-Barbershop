import iconBadge from '../../assets/landing/icon-verified-badge.svg'
import Button from '../ui/Button'
import Icon from './Icon'
import Reveal from './Reveal'

export default function FinalCta() {
  return (
    <section
      aria-labelledby="cta-title"
      className="border-t border-brand/20 bg-linear-to-b from-bg-alt via-bg to-bg px-4 pt-24 pb-24 sm:px-8"
    >
      <Reveal className="mx-auto flex max-w-[768px] flex-col items-center gap-4 px-5 text-center">
        <span aria-hidden className="grid size-12 place-items-center rounded-full border border-brand/40 bg-brand/10">
          <Icon src={iconBadge} className="h-[21px] w-[22px]" />
        </span>
        <h2
          id="cta-title"
          className="bg-[linear-gradient(to_right,#fff2b2,#f2ca50,#b88728)] bg-clip-text font-display text-[34px] leading-10 font-semibold tracking-[0.025em] text-transparent uppercase sm:text-[46px]"
        >
          Reclama tu lugar en el trono
        </h2>
        <p className="max-w-[576px] text-base leading-[26px] font-light tracking-[0.01em] text-text-soft">
          La excelencia en el corte no es un gasto, es la carta de presentación más elocuente de un hombre de poder.
          Reserve hoy su cita de oro.
        </p>
        <div className="pt-2">
          <Button
            to="/reservar"
            variant="gold"
            size="lgFlush"
            className="px-10 py-4 tracking-[0.25em] drop-shadow-[0px_8px_15px_rgba(212,175,55,0.4)]"
          >
            Agendar mi experiencia
          </Button>
        </div>
      </Reveal>
    </section>
  )
}
