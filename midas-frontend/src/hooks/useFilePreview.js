import { useEffect, useMemo } from 'react'

// URL temporal para previsualizar un archivo elegido (se libera al cambiarlo o desmontar).
export function useFilePreview(file) {
  const preview = useMemo(() => (file ? URL.createObjectURL(file) : null), [file])
  useEffect(() => () => preview && URL.revokeObjectURL(preview), [preview])
  return preview
}
