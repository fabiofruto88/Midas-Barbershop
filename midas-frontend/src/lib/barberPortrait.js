import { optimizedImageUrl } from './images'
import barber1 from '../assets/landing/barber-1.jpg'
import barber2 from '../assets/landing/barber-2.jpg'
import barber3 from '../assets/landing/barber-3.jpg'

// Retratos por defecto del diseño: se usan cuando el admin no ha subido una foto del barbero.
const defaultPortraits = [barber1, barber2, barber3]

export const barberPortrait = (barber, index = 0, size = { width: 160, height: 200 }) =>
  barber.avatarUrl ? optimizedImageUrl(barber.avatarUrl, size) : defaultPortraits[index % defaultPortraits.length]
