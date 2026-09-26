// Métodos de pago que acepta el backend (enum PaymentMethod).
export const paymentMethods = [
  { value: 'CASH', label: 'Efectivo' },
  { value: 'CARD', label: 'Tarjeta' },
  { value: 'TRANSFER', label: 'Transferencia' },
]

export const paymentLabel = (method) =>
  paymentMethods.find(({ value }) => value === method)?.label ?? 'Sin indicar'
