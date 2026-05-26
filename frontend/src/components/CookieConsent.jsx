import { useState } from 'react'

const storageKey = 'rt-cookie-notice-seen'

function CookiePanel({ onClose }) {
  return (
    <div
      className="modal-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose()
        }
      }}
    >
      <section
        className="cookie-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="cookie-panel-title"
      >
        <button
          type="button"
          className="modal-close"
          aria-label="Fermer la gestion des cookies"
          onClick={onClose}
        >
          x
        </button>
        <p className="eyebrow">Gestion des cookies</p>
        <h2 id="cookie-panel-title">Aucun cookie non essentiel n'est utilisé.</h2>
        <p>
          Le site ne dépose pas de cookie publicitaire, de cookie de mesure
          d'audience ni de traceur de réseau social. Seuls les éléments
          strictement nécessaires au fonctionnement du site peuvent être
          utilisés.
        </p>

        <div className="cookie-setting">
          <div>
            <h3>Cookies nécessaires</h3>
            <p>Indispensables au fonctionnement du site.</p>
          </div>
          <span>Actifs</span>
        </div>

        <button type="button" className="cta-button" onClick={onClose}>
          Enregistrer mes choix
        </button>
      </section>
    </div>
  )
}

function CookieConsent({ isPanelOpen, onClosePanel, onOpenPanel }) {
  const [isBannerVisible, setIsBannerVisible] = useState(
    () => localStorage.getItem(storageKey) !== 'true',
  )

  const acknowledge = () => {
    localStorage.setItem(storageKey, 'true')
    setIsBannerVisible(false)
  }

  return (
    <>
      {isBannerVisible && (
        <section className="cookie-banner" aria-label="Information cookies">
          <div>
            <h2>Cookies</h2>
            <p>
              Ce site n'utilise pas de cookies non essentiels. Vous pouvez
              consulter la gestion des cookies à tout moment depuis le footer.
            </p>
          </div>
          <div className="cookie-actions">
            <button type="button" className="cta-button" onClick={acknowledge}>
              J'ai compris
            </button>
            <button
              type="button"
              className="secondary-button"
              onClick={onOpenPanel}
            >
              Gérer
            </button>
          </div>
        </section>
      )}

      {isPanelOpen && <CookiePanel onClose={onClosePanel} />}
    </>
  )
}

export default CookieConsent
