import { useCallback, useEffect, useState } from 'react'
import {
  createGalleryImage,
  deleteGalleryImage,
  fetchGalleryImages,
  getCurrentAdmin,
  clearAuth,
} from '../lib/api'

const initialFormData = {
  title: '',
  photo: null,
}

const visibleGalleryCount = 6

function GalleryPage({ isAuthenticated = false, onReady }) {
  const [galleryImages, setGalleryImages] = useState([])
  const [activeIndex, setActiveIndex] = useState(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [formData, setFormData] = useState(initialFormData)
  const [isEditorOpen, setIsEditorOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')

  const activeImage = activeIndex === null ? null : galleryImages[activeIndex]
  const visibleGalleryImages = galleryImages.slice(0, visibleGalleryCount)

  const loadGallery = useCallback(async () => {
    setIsLoading(true)
    try {
      setGalleryImages(await fetchGalleryImages())
      setError('')
    } catch (loadError) {
      setError(loadError.message)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadGallery()
  }, [loadGallery])

  useEffect(() => {
    if (!isLoading && onReady) {
      onReady()
    }
  }, [isLoading, onReady])

  useEffect(() => {
    let isMounted = true

    if (!isAuthenticated) {
      setIsAdmin(false)
      setIsEditorOpen(false)
      return undefined
    }

    getCurrentAdmin()
      .then((user) => {
        if (isMounted) {
          setIsAdmin(user?.user_metadata?.is_admin === true)
        }
      })
      .catch(() => {
        if (isMounted) {
          clearAuth()
          setIsAdmin(false)
        }
      })

    return () => {
      isMounted = false
    }
  }, [isAuthenticated])

  const showPreviousImage = useCallback(() => {
    setActiveIndex((currentIndex) =>
      currentIndex === 0 ? galleryImages.length - 1 : currentIndex - 1,
    )
  }, [galleryImages.length])

  const showNextImage = useCallback(() => {
    setActiveIndex((currentIndex) =>
      currentIndex === galleryImages.length - 1 ? 0 : currentIndex + 1,
    )
  }, [galleryImages.length])

  useEffect(() => {
    if (activeIndex === null) {
      return undefined
    }

    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        setActiveIndex(null)
      }

      if (galleryImages.length < 2) {
        return
      }

      if (event.key === 'ArrowLeft') {
        showPreviousImage()
      }

      if (event.key === 'ArrowRight') {
        showNextImage()
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [activeIndex, galleryImages.length, showNextImage, showPreviousImage])

  const updateField = (event) => {
    const { name, value, files } = event.target
    setError('')
    setFormData((currentData) => ({
      ...currentData,
      [name]: files ? files[0] ?? null : value,
    }))
  }

  const submitImage = async (event) => {
    event.preventDefault()
    const form = event.currentTarget
    setIsSaving(true)
    setError('')

    try {
      await createGalleryImage(formData)
      setFormData(initialFormData)
      form.reset()
      setIsEditorOpen(false)
      await loadGallery()
    } catch (submitError) {
      setError(submitError.message)
    } finally {
      setIsSaving(false)
    }
  }

  const removeImage = async (image) => {
    setIsSaving(true)
    try {
      await deleteGalleryImage(image.id)
      setActiveIndex(null)
      await loadGallery()
    } catch (deleteError) {
      setError(deleteError.message)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <section id="images" className="page-section reveal">
      <div className="gallery-heading">
        <div>
          <p className="eyebrow">En images</p>
          <h2>Les interventions et le materiel en galerie.</h2>
        </div>

        {isAdmin && (
          <button
            type="button"
            className="cta-button gallery-add-button"
            onClick={() => setIsEditorOpen((isOpen) => !isOpen)}
          >
            {isEditorOpen ? 'Fermer' : 'Ajouter une photo'}
          </button>
        )}
      </div>

      {isAdmin && isEditorOpen && (
        <form className="gallery-admin-form" onSubmit={submitImage}>
          <label>
            Titre
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={updateField}
              maxLength="160"
              required
            />
            <span className="field-hint">
              {formData.title.length}/160 caracteres
            </span>
          </label>

          <label>
            Photo
            <input
              type="file"
              name="photo"
              accept="image/jpeg,image/png,image/webp"
              onChange={updateField}
              required
            />
            <span className="field-hint" aria-hidden="true"></span>
          </label>

          <button type="submit" className="cta-button" disabled={isSaving}>
            {isSaving ? 'Ajout...' : 'Publier'}
          </button>
        </form>
      )}

      {error && (
        <p className="admin-login-error gallery-status" role="alert">
          {error}
        </p>
      )}

      {isLoading && <p className="empty-results">Chargement de la galerie...</p>}

      {!isLoading && galleryImages.length === 0 && (
        <p className="empty-results">Aucune photo n'est publiee pour le moment.</p>
      )}

      {visibleGalleryImages.length > 0 && (
        <>
          <div className="gallery-grid" aria-label="Galerie photo">
            {visibleGalleryImages.map((image, index) => (
              <article className="gallery-item" key={image.id}>
                <button
                  type="button"
                  className="gallery-card"
                  onClick={() => setActiveIndex(index)}
                >
                  <img
                    src={image.photo_url}
                    alt={image.title}
                    loading="lazy"
                    decoding="async"
                  />
                  <span>{image.title}</span>
                </button>

                {isAdmin && (
                  <button
                    type="button"
                    className="secondary-button gallery-delete-button"
                    onClick={() => removeImage(image)}
                    disabled={isSaving}
                  >
                    Supprimer
                  </button>
                )}
              </article>
            ))}
          </div>

          {galleryImages.length > visibleGalleryCount && (
            <div className="gallery-cta-row">
              <button
                type="button"
                className="secondary-button"
                onClick={() => setActiveIndex(visibleGalleryCount)}
              >
                Voir toutes les photos ({galleryImages.length})
              </button>
            </div>
          )}
        </>
      )}

      {activeImage && (
        <div
          className="image-modal-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setActiveIndex(null)
            }
          }}
        >
          <section
            className="image-modal"
            role="dialog"
            aria-modal="true"
            aria-label={activeImage.title}
          >
            <button
              type="button"
              className="modal-close image-modal-close"
              aria-label="Fermer la galerie"
              onClick={() => setActiveIndex(null)}
            >
              x
            </button>

            {galleryImages.length > 1 && (
              <button
                type="button"
                className="gallery-arrow gallery-arrow-left"
                aria-label="Image precedente"
                onClick={showPreviousImage}
              >
                {'<'}
              </button>
            )}

            <figure>
              <img
                src={activeImage.photo_url}
                alt={activeImage.title}
                decoding="async"
              />
              <figcaption>
                {activeImage.title}
                <span>
                  {activeIndex + 1} / {galleryImages.length}
                </span>
              </figcaption>
            </figure>

            {isAdmin && (
              <button
                type="button"
                className="secondary-button gallery-modal-delete"
                onClick={() => removeImage(activeImage)}
                disabled={isSaving}
              >
                Supprimer
              </button>
            )}

            {galleryImages.length > 1 && (
              <button
                type="button"
                className="gallery-arrow gallery-arrow-right"
                aria-label="Image suivante"
                onClick={showNextImage}
              >
                {'>'}
              </button>
            )}
          </section>
        </div>
      )}
    </section>
  )
}

export default GalleryPage
