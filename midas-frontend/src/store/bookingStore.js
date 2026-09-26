import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

const emptyDraft = { serviceId: null, barberId: null, date: null, timeSlot: null }

// Borrador del flujo de reserva. Se guarda en sessionStorage para sobrevivir al
// paso por login/registro. No contiene datos sensibles.
export const useBookingStore = create(
  persist(
    (set) => ({
      ...emptyDraft,
      // Cada elección invalida las posteriores (cambiar barbero borra la hora elegida, etc.).
      selectService: (serviceId) => set({ serviceId }),
      selectBarber: (barberId) => set({ barberId, timeSlot: null }),
      selectDate: (date) => set({ date, timeSlot: null }),
      selectTimeSlot: (timeSlot) => set({ timeSlot }),
      reset: () => set(emptyDraft),
    }),
    {
      name: 'midas-booking-draft',
      storage: createJSONStorage(() => sessionStorage),
    }
  )
)
