import { useRef } from 'react'
import { conditions, gsap, SplitText, useGSAP } from '../../lib/gsap'
import { distance, duration, scroll, stagger } from '../../lib/motion'

// Entrada al cruzar el viewport (una sola vez). Dentro, los [data-reveal] entran en cascada y los
// [data-reveal-split] (titulares) suben palabra a palabra desde una máscara.
// Con reduced-motion: solo un fundido del bloque.
export default function Reveal({ as: Tag = 'div', delay = 0, className = '', children, ...props }) {
  const ref = useRef(null)

  useGSAP(
    () => {
      const root = ref.current
      const items = gsap.utils.toArray('[data-reveal]', root)
      const titles = gsap.utils.toArray('[data-reveal-split]', root)
      // end: 'max': si la página abre más abajo (ancla), lo que quedó arriba también se revela.
      const scrollTrigger = { trigger: root, start: scroll.revealStart, end: 'max', once: true }
      const mm = gsap.matchMedia()

      mm.add(conditions, ({ conditions: { desktop, reduce } }) => {
        if (reduce) {
          gsap.from(root, { opacity: 0, duration: duration.fade, delay, scrollTrigger })
          return
        }
        const shift = desktop ? distance.md : distance.sm
        const splits = titles.map((title) => SplitText.create(title, { type: 'words', mask: 'words', wordsClass: 'split-word' }))
        const tl = gsap.timeline({ delay, scrollTrigger })
        tl.from(root, { opacity: 0, y: shift }, 0)
        if (items.length) tl.from(items, { opacity: 0, y: shift / 2, stagger: stagger.item }, 0)
        for (const split of splits) {
          tl.from(split.words, { yPercent: 100, duration: duration.heroWord, stagger: stagger.word }, stagger.item)
        }
      })
      return () => mm.revert()
    },
    { scope: ref },
  )

  return (
    <Tag ref={ref} className={className} {...props}>
      {children}
    </Tag>
  )
}
