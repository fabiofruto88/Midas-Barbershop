import { useId, useState } from 'react'
import { formatPrice } from '../../lib/format'
import { paymentMethods } from '../../lib/payments'
import Alert from '../ui/Alert'
import Button from '../ui/Button'
import Field from '../ui/Field'

const toAmount = (value) => (value === '' ? NaN : Number(value))
const isValidAmount = (value) => Number.isFinite(value) && value >= 0

// Registro de lo cobrado: importe (precargado con el precio del servicio), propina, método y motivo.
// Se usa al cerrar una cita y para corregir el cobro de una ya completada.
export default function ChargeForm({ listPrice, initial = {}, title, submitLabel, loading, error, onSubmit, onCancel }) {
  const noteId = useId()
  const [amount, setAmount] = useState(String(Number(initial.chargedAmount ?? listPrice)))
  const [tip, setTip] = useState(initial.tipAmount ? String(Number(initial.tipAmount)) : '')
  const [method, setMethod] = useState(initial.paymentMethod ?? null)
  const [note, setNote] = useState(initial.priceNote ?? '')
  const [touched, setTouched] = useState(false)

  const charged = toAmount(amount)
  const tipValue = tip === '' ? 0 : toAmount(tip)
  const difference = isValidAmount(charged) ? charged - Number(listPrice) : 0
  const needsNote = difference !== 0

  const errors = {
    amount: isValidAmount(charged) ? null : 'Indica un importe válido (0 o más).',
    tip: isValidAmount(tipValue) ? null : 'La propina no puede ser negativa.',
    note: needsNote && !note.trim() ? 'Explica por qué cobraste distinto al precio del servicio.' : null,
  }
  const hasErrors = Object.values(errors).some(Boolean)

  const submit = (event) => {
    event.preventDefault()
    setTouched(true)
    if (hasErrors) return
    onSubmit({
      chargedAmount: charged,
      tipAmount: tipValue,
      paymentMethod: method,
      priceNote: note.trim() || null,
    })
  }

  return (
    <form onSubmit={submit} noValidate className="space-y-4 rounded-control border border-border bg-surface-2 p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="font-semibold">{title}</p>
        <p className="text-sm text-muted">Precio del servicio: {formatPrice(listPrice)}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="Importe cobrado"
          type="number"
          inputMode="numeric"
          min="0"
          step="any"
          value={amount}
          onChange={(event) => setAmount(event.target.value)}
          error={touched ? errors.amount : null}
          hint={
            difference > 0
              ? `${formatPrice(difference)} más que el precio fijo`
              : difference < 0
                ? `${formatPrice(-difference)} menos que el precio fijo`
                : 'Igual al precio fijo'
          }
        />
        <Field
          label="Propina (opcional)"
          type="number"
          inputMode="numeric"
          min="0"
          step="any"
          placeholder="0"
          value={tip}
          onChange={(event) => setTip(event.target.value)}
          error={touched ? errors.tip : null}
        />
      </div>

      <fieldset className="space-y-1.5">
        <legend className="text-sm font-medium">Método de pago</legend>
        <div className="flex flex-wrap gap-2">
          {paymentMethods.map(({ value, label }) => (
            <Button
              key={value}
              size="sm"
              variant={method === value ? 'primary' : 'secondary'}
              aria-pressed={method === value}
              onClick={() => setMethod(method === value ? null : value)}
            >
              {label}
            </Button>
          ))}
        </div>
      </fieldset>

      <div className="space-y-1.5">
        <label htmlFor={noteId} className="block text-sm font-medium">
          Motivo del ajuste {needsNote ? '' : '(opcional)'}
        </label>
        <textarea
          id={noteId}
          value={note}
          onChange={(event) => setNote(event.target.value)}
          maxLength={200}
          rows={2}
          placeholder="Ej. barba extra, descuento a cliente frecuente…"
          aria-invalid={Boolean(touched && errors.note)}
          className="w-full rounded-control border border-border bg-surface px-3 py-2 text-sm placeholder:text-muted/60 focus:border-brand focus:outline-none aria-invalid:border-danger"
        />
        {touched && errors.note && <p className="text-xs text-danger">{errors.note}</p>}
      </div>

      <Alert tone="error">{error?.message}</Alert>

      <div className="flex flex-wrap gap-2">
        <Button type="submit" loading={loading}>
          {submitLabel}
        </Button>
        <Button variant="ghost" onClick={onCancel}>
          Cancelar
        </Button>
      </div>
    </form>
  )
}
