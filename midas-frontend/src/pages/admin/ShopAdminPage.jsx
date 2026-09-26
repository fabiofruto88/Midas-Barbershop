import { useId, useState } from 'react'
import { toast } from 'sonner'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { adminApi, shopApi } from '../../services/midas'
import { queryKeys } from '../../lib/queryClient'
import { formatPrice } from '../../lib/format'
import { serverFieldErrors } from '../../lib/validation'
import { ACCEPTED_IMAGES, imageFileError } from '../../lib/imageFile'
import { useFilePreview } from '../../hooks/useFilePreview'
import ProductImage from '../../components/shop/ProductImage'
import Alert from '../../components/ui/Alert'
import Button from '../../components/ui/Button'
import Card from '../../components/ui/Card'
import Field from '../../components/ui/Field'
import { PageSpinner } from '../../components/ui/Spinner'

const ALL = 'all'
const emptyProduct = { name: '', categoryId: '', description: '', price: '', isAvailable: true, isVisible: true, isFeatured: false }
const control =
  'w-full rounded-control border border-border bg-surface-2 px-3.5 py-2.5 text-sm focus:border-brand focus:outline-none aria-invalid:border-danger'

const validateProduct = ({ name, categoryId, price }) => {
  const errors = {}
  if (name.trim().length < 2) errors.name = 'El nombre debe tener al menos 2 caracteres.'
  if (!categoryId) errors.categoryId = 'Elige una categoría.'
  if (!(Number(price) > 0)) errors.price = 'El precio debe ser mayor que 0.'
  else if (!/^\d+(\.\d{1,2})?$/.test(String(price).trim())) errors.price = 'Máximo 2 decimales.'
  return errors
}

const toPayload = ({ name, categoryId, description, price, isAvailable, isVisible, isFeatured }) => ({
  name: name.trim(),
  categoryId,
  description: description.trim() || null,
  price: Number(price),
  isAvailable,
  isVisible,
  isFeatured,
})

// Tras cualquier cambio se refrescan la vista del admin y la tienda pública.
function useInvalidateShop() {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: ['shop'] })
}

export default function ShopAdminPage() {
  const products = useQuery({ queryKey: queryKeys.adminProducts, queryFn: adminApi.products })
  const categories = useQuery({ queryKey: queryKeys.shopCategories, queryFn: shopApi.categories })
  const [filter, setFilter] = useState(ALL)
  const [editingId, setEditingId] = useState(null)

  if (products.isPending || categories.isPending) return <PageSpinner />
  const error = products.error ?? categories.error
  if (error) return <Alert tone="error">{error.message}</Alert>

  const list = filter === ALL ? products.data : products.data.filter((product) => product.category.id === filter)

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_22rem]">
      <section className="space-y-3" aria-labelledby="lista-productos">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="lista-productos" className="text-lg font-semibold">
            Productos ({list.length})
          </h2>
          <select
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
            aria-label="Filtrar por categoría"
            className="rounded-control border border-border bg-surface-2 px-3 py-2 text-sm"
          >
            <option value={ALL}>Todas las categorías</option>
            {categories.data.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>
        {list.length === 0 && (
          <Alert>{products.data.length === 0 ? 'Aún no hay productos. Crea el primero.' : 'No hay productos en esta categoría.'}</Alert>
        )}
        <ul className="space-y-3">
          {list.map((product) => (
            <li key={product.id}>
              {editingId === product.id ? (
                <ProductForm product={product} categories={categories.data} onDone={() => setEditingId(null)} />
              ) : (
                <ProductRow product={product} onEdit={() => setEditingId(product.id)} />
              )}
            </li>
          ))}
        </ul>
      </section>

      <div className="space-y-8">
        <section className="space-y-3" aria-labelledby="nuevo-producto">
          <h2 id="nuevo-producto" className="text-lg font-semibold">
            Nuevo producto
          </h2>
          {categories.data.length === 0 ? (
            <Alert>Crea primero una categoría para poder agregar productos.</Alert>
          ) : (
            <ProductForm categories={categories.data} />
          )}
        </section>
        <CategoriesPanel categories={categories.data} />
      </div>
    </div>
  )
}

// ---------- Productos ----------
const badge = 'px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide'

function ProductRow({ product, onEdit }) {
  const invalidate = useInvalidateShop()
  const [confirmDelete, setConfirmDelete] = useState(false)

  const toggle = useMutation({
    mutationFn: (changes) => adminApi.updateProduct(product.id, changes),
    onSuccess: (saved) => {
      toast.success('Producto actualizado', { description: saved.name })
      invalidate()
    },
  })
  const remove = useMutation({
    mutationFn: () => adminApi.deleteProduct(product.id),
    onSuccess: () => {
      toast.success('Producto eliminado', { description: product.name })
      invalidate()
    },
  })
  const busy = toggle.isPending || remove.isPending

  return (
    <Card className={`space-y-3 ${product.isVisible ? '' : 'opacity-60'}`}>
      <div className="flex gap-4">
        <ProductImage product={product} size={160} className="size-20 shrink-0" />
        <div className="min-w-0 flex-1 space-y-1">
          <p className="font-semibold">{product.name}</p>
          <p className="text-xs text-muted">{product.category.name}</p>
          <p className="text-sm font-semibold text-brand">{formatPrice(product.price)}</p>
          <div className="flex flex-wrap gap-1.5">
            {product.isFeatured && <span className={`${badge} bg-brand/15 text-brand`}>Destacado</span>}
            {!product.isAvailable && <span className={`${badge} bg-danger/15 text-danger`}>Agotado</span>}
            {!product.isVisible && <span className={`${badge} bg-surface-2 text-muted`}>Oculto</span>}
          </div>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button variant="secondary" onClick={onEdit}>
          Editar
        </Button>
        <Button variant="ghost" disabled={busy} onClick={() => toggle.mutate({ isAvailable: !product.isAvailable })}>
          {product.isAvailable ? 'Marcar agotado' : 'Marcar disponible'}
        </Button>
        <Button variant="ghost" disabled={busy} onClick={() => toggle.mutate({ isVisible: !product.isVisible })}>
          {product.isVisible ? 'Ocultar' : 'Mostrar'}
        </Button>
        <Button variant="ghost" disabled={busy} onClick={() => toggle.mutate({ isFeatured: !product.isFeatured })}>
          {product.isFeatured ? 'Quitar destacado' : 'Destacar'}
        </Button>
        {confirmDelete ? (
          <>
            <Button variant="danger" loading={remove.isPending} onClick={() => remove.mutate()}>
              Confirmar
            </Button>
            <Button variant="ghost" onClick={() => setConfirmDelete(false)}>
              No
            </Button>
          </>
        ) : (
          <Button variant="ghost" onClick={() => setConfirmDelete(true)}>
            Eliminar
          </Button>
        )}
      </div>
      <Alert tone="error">{(toggle.error ?? remove.error)?.message}</Alert>
    </Card>
  )
}

// Crea (sin `product`) o edita un producto. La foto es opcional y se sube después de guardar:
// si falla, el producto queda guardado igualmente.
function ProductForm({ product, categories, onDone }) {
  const invalidate = useInvalidateShop()
  const photoId = useId()
  const descriptionId = useId()
  const categoryFieldId = useId()
  const [values, setValues] = useState(
    product
      ? {
          ...emptyProduct,
          ...product,
          categoryId: product.category.id,
          description: product.description ?? '',
          price: String(Number(product.price)),
        }
      : { ...emptyProduct, categoryId: categories[0]?.id ?? '' }
  )
  const [photo, setPhoto] = useState(null)
  const [photoInputKey, setPhotoInputKey] = useState(0)
  const [removePhoto, setRemovePhoto] = useState(false)
  const [errors, setErrors] = useState({})
  const preview = useFilePreview(photo)

  const save = useMutation({
    mutationFn: async (payload) => {
      let saved = product ? await adminApi.updateProduct(product.id, payload) : await adminApi.createProduct(payload)
      try {
        if (photo) saved = await adminApi.uploadProductImage(saved.id, photo)
        else if (removePhoto) saved = await adminApi.removeProductImage(saved.id)
        return { saved }
      } catch (photoError) {
        return { saved, photoError }
      }
    },
    onSuccess: ({ saved, photoError }) => {
      toast.success(product ? 'Producto actualizado' : 'Producto creado', { description: saved.name })
      if (photoError) toast.warning('No se pudo guardar la foto', { description: photoError.message })
      invalidate()
      if (product) return onDone()
      setValues({ ...emptyProduct, categoryId: values.categoryId })
      setPhoto(null)
      setPhotoInputKey((key) => key + 1)
    },
    onError: (error) => setErrors(serverFieldErrors(error)),
  })

  const update = (field) => (event) => setValues((current) => ({ ...current, [field]: event.target.value }))
  const toggle = (field) => (event) => setValues((current) => ({ ...current, [field]: event.target.checked }))

  const choosePhoto = (event) => {
    const file = event.target.files?.[0]
    if (!file) return
    const invalid = imageFileError(file)
    setErrors((current) => ({ ...current, photo: invalid }))
    if (invalid) {
      event.target.value = ''
      return
    }
    setPhoto(file)
    setRemovePhoto(false)
  }

  const submit = (event) => {
    event.preventDefault()
    const found = validateProduct(values)
    setErrors(found)
    if (Object.keys(found).length) return
    const payload = toPayload(values)
    if (!product && payload.description === null) delete payload.description
    save.mutate(payload)
  }

  const currentImage = removePhoto ? null : (preview ?? product?.imageUrl)

  return (
    <Card as="form" onSubmit={submit} noValidate className="space-y-4">
      <Field label="Nombre" value={values.name} onChange={update('name')} error={errors.name} />

      <div className="space-y-1.5">
        <label htmlFor={categoryFieldId} className="block text-sm font-medium">
          Categoría
        </label>
        <select
          id={categoryFieldId}
          value={values.categoryId}
          onChange={update('categoryId')}
          aria-invalid={Boolean(errors.categoryId)}
          className={control}
        >
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
        {errors.categoryId && <p className="text-xs text-danger">{errors.categoryId}</p>}
      </div>

      <div className="space-y-1.5">
        <label htmlFor={descriptionId} className="block text-sm font-medium">
          Descripción (opcional)
        </label>
        <textarea
          id={descriptionId}
          rows={3}
          maxLength={500}
          value={values.description}
          onChange={update('description')}
          aria-invalid={Boolean(errors.description)}
          className={control}
        />
        {errors.description && <p className="text-xs text-danger">{errors.description}</p>}
      </div>

      <Field label="Precio (COP)" inputMode="decimal" value={values.price} onChange={update('price')} error={errors.price} />

      <div className="space-y-2">
        <p className="text-sm font-medium">Foto (opcional)</p>
        <div className="flex items-center gap-3">
          {currentImage ? (
            <img src={currentImage} alt="" className="size-16 shrink-0 object-cover" />
          ) : (
            <ProductImage product={{ name: values.name }} className="size-16 shrink-0" />
          )}
          <div className="flex flex-col items-start gap-1">
            <label htmlFor={photoId} className="cursor-pointer text-sm font-medium text-brand hover:underline has-focus-visible:outline-2">
              {currentImage ? 'Cambiar foto' : 'Elegir foto'}
              <input
                key={photoInputKey}
                id={photoId}
                type="file"
                accept={ACCEPTED_IMAGES.join(',')}
                onChange={choosePhoto}
                className="sr-only"
              />
            </label>
            {photo ? (
              <button
                type="button"
                onClick={() => {
                  setPhoto(null)
                  setPhotoInputKey((key) => key + 1)
                }}
                className="text-xs text-muted hover:text-text"
              >
                Descartar foto nueva
              </button>
            ) : (
              product?.imageUrl &&
              !removePhoto && (
                <button type="button" onClick={() => setRemovePhoto(true)} className="text-xs text-muted hover:text-text">
                  Quitar foto
                </button>
              )
            )}
            <span className="text-xs text-muted">JPEG, PNG o WebP de hasta 5MB. Mejor cuadrada.</span>
          </div>
        </div>
        {errors.photo && <p className="text-xs text-danger">{errors.photo}</p>}
      </div>

      <fieldset className="space-y-2">
        <legend className="sr-only">Estado</legend>
        {[
          ['isAvailable', 'Disponible', 'Si lo desmarcas se muestra como "Agotado".'],
          ['isVisible', 'Visible en la tienda', 'Oculto: solo lo ves tú.'],
          ['isFeatured', 'Destacado', 'Aparece primero en la tienda.'],
        ].map(([field, label, hint]) => (
          <label key={field} className="flex items-start gap-2.5 text-sm">
            <input type="checkbox" checked={values[field]} onChange={toggle(field)} className="mt-0.5 size-4 accent-brand" />
            <span>
              {label}
              <span className="block text-xs text-muted">{hint}</span>
            </span>
          </label>
        ))}
      </fieldset>

      {save.error && !save.error.details && <Alert tone="error">{save.error.message}</Alert>}
      <div className="flex gap-2">
        <Button type="submit" loading={save.isPending}>
          {product ? 'Guardar' : 'Crear producto'}
        </Button>
        {product && (
          <Button variant="ghost" onClick={onDone}>
            Cancelar
          </Button>
        )}
      </div>
    </Card>
  )
}

// ---------- Categorías ----------
function CategoriesPanel({ categories }) {
  const invalidate = useInvalidateShop()
  const [name, setName] = useState('')
  const [error, setError] = useState(null)

  const create = useMutation({
    mutationFn: () => adminApi.createCategory({ name: name.trim(), sortOrder: categories.length }),
    onSuccess: (saved) => {
      toast.success('Categoría creada', { description: saved.name })
      setName('')
      invalidate()
    },
    onError: (err) => setError(err.message),
  })

  const submit = (event) => {
    event.preventDefault()
    if (name.trim().length < 2) return setError('El nombre debe tener al menos 2 caracteres.')
    setError(null)
    create.mutate()
  }

  return (
    <section className="space-y-3" aria-labelledby="categorias">
      <h2 id="categorias" className="text-lg font-semibold">
        Categorías ({categories.length})
      </h2>
      <Card className="space-y-4">
        {categories.length > 0 && (
          <ul className="divide-y divide-border">
            {categories.map((category, index) => (
              <CategoryRow key={category.id} category={category} categories={categories} index={index} />
            ))}
          </ul>
        )}
        <form onSubmit={submit} noValidate className="flex items-start gap-2">
          <Field
            label="Nueva categoría"
            value={name}
            maxLength={50}
            placeholder="Ej. Cuidado de barba"
            onChange={(event) => setName(event.target.value)}
            error={error}
            className="flex-1"
          />
          <Button type="submit" variant="secondary" loading={create.isPending} className="mt-7">
            Añadir
          </Button>
        </form>
      </Card>
    </section>
  )
}

function CategoryRow({ category, categories, index }) {
  const invalidate = useInvalidateShop()
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(category.name)
  const count = category._count?.products ?? 0

  const rename = useMutation({
    mutationFn: () => adminApi.updateCategory(category.id, { name: name.trim() }),
    onSuccess: () => {
      toast.success('Categoría renombrada')
      setEditing(false)
      invalidate()
    },
  })
  // Subir/bajar intercambia el orden con la vecina.
  const move = useMutation({
    mutationFn: async (direction) => {
      const neighbor = categories[index + direction]
      await adminApi.updateCategory(category.id, { sortOrder: index + direction })
      await adminApi.updateCategory(neighbor.id, { sortOrder: index })
    },
    onSettled: invalidate,
  })
  const remove = useMutation({
    mutationFn: () => adminApi.deleteCategory(category.id),
    onSuccess: () => {
      toast.success('Categoría eliminada', { description: category.name })
      invalidate()
    },
  })
  const error = rename.error ?? move.error ?? remove.error
  const arrow = 'grid size-7 place-items-center text-muted hover:text-brand disabled:opacity-30'
  const textAction = 'shrink-0 px-1.5 py-1 text-xs font-medium text-muted hover:text-brand disabled:opacity-50'

  return (
    <li className="space-y-2 py-2.5 first:pt-0">
      {editing ? (
        <form
          className="flex items-center gap-2"
          onSubmit={(event) => {
            event.preventDefault()
            if (name.trim().length >= 2) rename.mutate()
          }}
        >
          <input
            value={name}
            maxLength={50}
            onChange={(event) => setName(event.target.value)}
            aria-label={`Nuevo nombre de ${category.name}`}
            className={`${control} py-1.5`}
          />
          <Button type="submit" variant="secondary" loading={rename.isPending} className="px-3 py-1.5">
            Guardar
          </Button>
          <Button variant="ghost" className="px-2 py-1.5" onClick={() => setEditing(false)}>
            ✕<span className="sr-only">Cancelar</span>
          </Button>
        </form>
      ) : (
        <div className="flex items-center gap-2">
          <div className="flex flex-col">
            <button type="button" className={arrow} disabled={index === 0 || move.isPending} onClick={() => move.mutate(-1)} aria-label={`Subir ${category.name}`}>
              ▲
            </button>
            <button
              type="button"
              className={arrow}
              disabled={index === categories.length - 1 || move.isPending}
              onClick={() => move.mutate(1)}
              aria-label={`Bajar ${category.name}`}
            >
              ▼
            </button>
          </div>
          <p className="min-w-0 flex-1 text-sm">
            <span className="font-medium">{category.name}</span>{' '}
            <span className="text-xs text-muted">
              ({count} {count === 1 ? 'producto' : 'productos'})
            </span>
          </p>
          <button type="button" className={textAction} onClick={() => setEditing(true)}>
            Renombrar
          </button>
          <button
            type="button"
            className={`${textAction} hover:text-danger`}
            disabled={remove.isPending}
            onClick={() => remove.mutate()}
            title={count ? 'Primero mueve o elimina sus productos' : undefined}
          >
            Eliminar
          </button>
        </div>
      )}
      <Alert tone="error">{error?.message}</Alert>
    </li>
  )
}
