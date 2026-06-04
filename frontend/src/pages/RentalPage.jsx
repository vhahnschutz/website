import { useEffect, useMemo, useState } from 'react'
import {
  clearAuth,
  createSale,
  deleteSale,
  fetchSales,
  getCurrentAdmin,
  updateSale,
} from '../lib/api'

const initialSaleForm = {
  title: '',
  description: '',
  price: '',
  photo: null,
  is_sold: false,
}

function formatPrice(price) {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  }).format(Number(price))
}

function RentalPage({ isAuthenticated = false }) {
  const [search, setSearch] = useState('')
  const [sales, setSales] = useState([])
  const [isAdmin, setIsAdmin] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const [formError, setFormError] = useState('')
  const [isEditorOpen, setIsEditorOpen] = useState(false)
  const [editingSale, setEditingSale] = useState(null)
  const [saleForm, setSaleForm] = useState(initialSaleForm)

  const checkAdminSession = async () => {
    if (!isAuthenticated) {
      setIsAdmin(false)
      return
    }

    try {
      const user = await getCurrentAdmin()
      setIsAdmin(user?.user_metadata?.is_admin === true)
    } catch {
      clearAuth()
      setIsAdmin(false)
    }
  }

  useEffect(() => {
    const loadPageData = async () => {
      setIsLoading(true)
      setError('')

      try {
        const [salesData] = await Promise.all([
          fetchSales(),
          checkAdminSession(),
        ])
        setSales(salesData)
      } catch (loadError) {
        setError(loadError.message)
      } finally {
        setIsLoading(false)
      }
    }

    loadPageData()
  }, [isAuthenticated])

  const filteredItems = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase()

    if (!normalizedSearch) {
      return sales
    }

    return sales.filter((item) =>
      [item.title, item.description, item.price]
        .join(' ')
        .toLowerCase()
        .includes(normalizedSearch),
    )
  }, [sales, search])

  const openCreateEditor = () => {
    setEditingSale(null)
    setSaleForm(initialSaleForm)
    setFormError('')
    setIsEditorOpen(true)
  }

  const openEditEditor = (sale) => {
    setEditingSale(sale)
    setSaleForm({
      title: sale.title,
      description: sale.description,
      price: sale.price,
      photo: null,
      is_sold: sale.is_sold,
    })
    setFormError('')
    setIsEditorOpen(true)
  }

  const closeEditor = () => {
    if (isSaving) {
      return
    }

    setIsEditorOpen(false)
    setEditingSale(null)
    setSaleForm(initialSaleForm)
    setFormError('')
  }

  const updateField = (event) => {
    const { checked, files, name, type, value } = event.target
    setSaleForm((currentForm) => ({
      ...currentForm,
      [name]:
        type === 'checkbox'
          ? checked
          : type === 'file'
            ? files?.[0] ?? null
            : value,
    }))
  }

  const saveSale = async (event) => {
    event.preventDefault()
    setFormError('')
    setIsSaving(true)

    try {
      const savedSale = editingSale
        ? await updateSale(editingSale.id, saleForm)
        : await createSale(saleForm)

      setSales((currentSales) =>
        editingSale
          ? currentSales.map((sale) =>
              sale.id === savedSale.id ? savedSale : sale,
            )
          : [savedSale, ...currentSales],
      )
      setIsEditorOpen(false)
      setEditingSale(null)
      setSaleForm(initialSaleForm)
    } catch (saveError) {
      setFormError(saveError.message)
    } finally {
      setIsSaving(false)
    }
  }

  const removeSale = async (sale) => {
    const confirmed = window.confirm(`Supprimer "${sale.title}" ?`)

    if (!confirmed) {
      return
    }

    try {
      await deleteSale(sale.id)
      setSales((currentSales) =>
        currentSales.filter((currentSale) => currentSale.id !== sale.id),
      )
    } catch (deleteError) {
      setError(deleteError.message)
    }
  }

  return (
    <section id="pieces-accessoires" className="page-section rental-page">
      <div className="section-heading-row">
        <div>
          <p className="eyebrow">Pieces detachees et accessoires</p>
          <h2>Distributeur de pieces detachees et accessoires en motoculture.</h2>
        </div>

        <div className="rental-actions">
          {isAdmin && (
            <button
              type="button"
              className="cta-button"
              onClick={openCreateEditor}
            >
              Ajouter
            </button>
          )}

          <label className="rental-search">
            <span>Rechercher</span>
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Lame, bougie, chaine..."
            />
          </label>
        </div>
      </div>

      {error && (
        <p className="empty-results" role="alert">
          {error}
        </p>
      )}

      {isLoading && <p className="empty-results">Chargement des pieces...</p>}

      {!isLoading && (
        <div className="rental-grid">
          {filteredItems.map((item) => (
            <article className="rental-card" key={item.id}>
              <img src={item.photo_url} alt={item.title} loading="lazy" />
              <div>
                <span>{item.is_sold ? 'Vendu' : 'Disponible'}</span>
                <h3>{item.title}</h3>
                <p>{item.description}</p>
                <strong>{formatPrice(item.price)}</strong>

                {isAdmin && (
                  <div className="rental-admin-actions">
                    <button
                      type="button"
                      className="secondary-button"
                      onClick={() => openEditEditor(item)}
                    >
                      Modifier
                    </button>
                    <button
                      type="button"
                      className="secondary-button danger-button"
                      onClick={() => removeSale(item)}
                    >
                      Supprimer
                    </button>
                  </div>
                )}
              </div>
            </article>
          ))}
        </div>
      )}

      {!isLoading && filteredItems.length === 0 && (
        <p className="empty-results">
          Aucune piece ne correspond a cette recherche.
        </p>
      )}

      {isEditorOpen && (
        <div
          className="modal-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeEditor()
            }
          }}
        >
          <section
            className="sale-editor"
            role="dialog"
            aria-modal="true"
            aria-labelledby="sale-editor-title"
          >
            <button
              type="button"
              className="modal-close"
              aria-label="Fermer"
              onClick={closeEditor}
            >
              x
            </button>

            <p className="eyebrow">Gestion</p>
            <h2 id="sale-editor-title">
              {editingSale ? 'Modifier une piece' : 'Ajouter une piece'}
            </h2>

            <form className="sale-editor-form" onSubmit={saveSale}>
              <label>
                <span>Titre</span>
                <input
                  type="text"
                  name="title"
                  value={saleForm.title}
                  onChange={updateField}
                  required
                />
              </label>

              <label>
                <span>Prix</span>
                <input
                  type="number"
                  name="price"
                  value={saleForm.price}
                  onChange={updateField}
                  min="0"
                  step="0.01"
                  required
                />
              </label>

              <label className="sale-editor-wide">
                <span>Description</span>
                <textarea
                  name="description"
                  value={saleForm.description}
                  onChange={updateField}
                  rows="5"
                  required
                />
              </label>

              <label className="sale-editor-wide">
                <span>Photo</span>
                <input
                  type="file"
                  name="photo"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={updateField}
                  required={!editingSale}
                />
              </label>

              <label className="checkbox-field sale-editor-wide">
                <input
                  type="checkbox"
                  name="is_sold"
                  checked={saleForm.is_sold}
                  onChange={updateField}
                />
                <span>Marquer comme vendu</span>
              </label>

              {formError && (
                <p className="admin-login-error sale-editor-wide" role="alert">
                  {formError}
                </p>
              )}

              <button
                type="submit"
                className="cta-button sale-editor-wide"
                disabled={isSaving}
              >
                {isSaving ? 'Enregistrement...' : 'Enregistrer'}
              </button>
            </form>
          </section>
        </div>
      )}
    </section>
  )
}

export default RentalPage
