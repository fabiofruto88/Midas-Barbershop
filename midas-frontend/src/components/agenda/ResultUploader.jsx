import { useEffect, useId, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { useMutation } from '@tanstack/react-query'
import { appointmentsApi } from '../../services/midas'
import Alert from '../ui/Alert'
import Button from '../ui/Button'
import { ACCEPTED_IMAGES, imageFileError } from '../../lib/imageFile'

// Selección, vista previa y subida de la foto del resultado.
export default function ResultUploader({ appointmentId, onUploaded, onCancel }) {
  const inputId = useId()
  const [file, setFile] = useState(null)
  const [notes, setNotes] = useState('')
  const [error, setError] = useState(null)
  // URL temporal de la vista previa; se libera al cambiar de archivo o desmontar.
  const preview = useMemo(() => (file ? URL.createObjectURL(file) : null), [file])
  useEffect(() => () => preview && URL.revokeObjectURL(preview), [preview])

  const upload = useMutation({
    mutationFn: () => appointmentsApi.uploadResult(appointmentId, { file, notes }),
    onSuccess: (result) => {
      toast.success('Foto del resultado subida', { description: 'El cliente ya puede verla en su historial.' })
      onUploaded(result)
    },
  })

  const choose = (event) => {
    const selected = event.target.files?.[0]
    setError(null)
    if (!selected) return setFile(null)
    const invalid = imageFileError(selected)
    if (invalid) return setError(invalid)
    setFile(selected)
  }

  return (
    <div className="space-y-3 rounded-control border border-border bg-surface-2 p-4">
      <label htmlFor={inputId} className="block text-sm font-medium">
        Foto del resultado
      </label>
      <input
        id={inputId}
        type="file"
        accept={ACCEPTED_IMAGES.join(',')}
        onChange={choose}
        className="block w-full text-sm text-muted file:mr-3 file:rounded-control file:border-0 file:bg-surface file:px-3 file:py-2 file:text-sm file:text-text"
      />
      {preview && <img src={preview} alt="Vista previa" className="aspect-square w-40 rounded-control object-cover" />}
      <textarea
        value={notes}
        onChange={(event) => setNotes(event.target.value)}
        maxLength={500}
        rows={2}
        placeholder="Notas técnicas (opcional)"
        aria-label="Notas técnicas"
        className="w-full rounded-control border border-border bg-surface px-3 py-2 text-sm placeholder:text-muted/60 focus:border-brand focus:outline-none"
      />
      <Alert tone="error">{error ?? upload.error?.message}</Alert>
      <div className="flex gap-2">
        <Button onClick={() => upload.mutate()} disabled={!file} loading={upload.isPending}>
          Subir foto
        </Button>
        <Button variant="ghost" onClick={onCancel}>
          Cancelar
        </Button>
      </div>
    </div>
  )
}
