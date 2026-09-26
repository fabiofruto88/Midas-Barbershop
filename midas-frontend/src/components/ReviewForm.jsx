import { useId, useState } from 'react'
import { toast } from 'sonner'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { appointmentsApi } from '../services/midas'
import { queryKeys } from '../lib/queryClient'
import { serverFieldErrors } from '../lib/validation'
import StarRating, { Stars } from './ui/StarRating'
import Alert from './ui/Alert'
import Button from './ui/Button'

const MIN_COMMENT = 10
const MAX_COMMENT = 500

const validate = ({ rating, comment }) => {
  const errors = {}
  if (!rating) errors.rating = 'Elige de 1 a 5 estrellas.'
  if (comment.trim().length < MIN_COMMENT) errors.comment = `Cuéntanos un poco más (mínimo ${MIN_COMMENT} caracteres).`
  return errors
}

// Reseña del cliente sobre una cita completada: la muestra si existe y permite crearla o editarla.
export default function ReviewForm({ appointment }) {
  const queryClient = useQueryClient()
  const commentId = useId()
  const { review } = appointment
  const [editing, setEditing] = useState(false)
  const [values, setValues] = useState({ rating: review?.rating ?? 0, comment: review?.comment ?? '' })
  const [errors, setErrors] = useState({})

  const save = useMutation({
    mutationFn: () => appointmentsApi.review(appointment.id, { rating: values.rating, comment: values.comment.trim() }),
    onSuccess: () => {
      toast.success(review ? 'Reseña actualizada' : '¡Gracias por tu reseña!')
      setEditing(false)
      queryClient.invalidateQueries({ queryKey: queryKeys.myAppointments })
      queryClient.invalidateQueries({ queryKey: ['reviews'] })
    },
    onError: (error) => setErrors(serverFieldErrors(error)),
  })

  if (review && !editing) {
    return (
      <div className="space-y-2 border-t border-border pt-4">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-medium">Tu reseña</p>
          <Stars value={review.rating} />
        </div>
        <p className="text-sm text-muted italic">"{review.comment}"</p>
        <Button size="sm" variant="ghost" className="px-0" onClick={() => setEditing(true)}>
          Editar reseña
        </Button>
      </div>
    )
  }

  if (!review && !editing) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
        <p className="text-sm text-muted">¿Qué tal tu experiencia?</p>
        <Button size="sm" variant="secondary" onClick={() => setEditing(true)}>
          Calificar servicio
        </Button>
      </div>
    )
  }

  const submit = (event) => {
    event.preventDefault()
    const found = validate(values)
    setErrors(found)
    if (!Object.keys(found).length) save.mutate()
  }

  return (
    <form onSubmit={submit} noValidate className="space-y-3 border-t border-border pt-4">
      <StarRating
        label="Tu calificación"
        value={values.rating}
        onChange={(rating) => setValues((current) => ({ ...current, rating }))}
        error={errors.rating}
      />
      <div className="space-y-1.5">
        <label htmlFor={commentId} className="block text-sm font-medium">
          Tu comentario
        </label>
        <textarea
          id={commentId}
          rows={3}
          maxLength={MAX_COMMENT}
          value={values.comment}
          onChange={(event) => setValues((current) => ({ ...current, comment: event.target.value }))}
          aria-invalid={Boolean(errors.comment)}
          placeholder="¿Cómo te fue con el corte, la atención, el ambiente…?"
          className="w-full rounded-control border border-border bg-surface-2 px-3.5 py-2.5 text-sm placeholder:text-muted/60 focus:border-brand focus:outline-none aria-invalid:border-danger"
        />
        <p className={`text-xs ${errors.comment ? 'text-danger' : 'text-muted'}`}>
          {errors.comment ?? `Se publicará en la web con tu nombre y la inicial de tu apellido. ${values.comment.length}/${MAX_COMMENT}`}
        </p>
      </div>
      {save.error && !save.error.details && <Alert tone="error">{save.error.message}</Alert>}
      <div className="flex gap-2">
        <Button type="submit" size="sm" loading={save.isPending}>
          {review ? 'Guardar cambios' : 'Publicar reseña'}
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>
          Cancelar
        </Button>
      </div>
    </form>
  )
}
