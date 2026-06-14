import { useEffect, useState } from 'react'

const openingHours = [
  ['Lundi', '8h à 19h'],
  ['Mardi', '8h à 19h'],
  ['Mercredi', '8h à 19h'],
  ['Jeudi', '8h à 19h'],
  ['Vendredi', '8h à 19h'],
  ['Samedi', 'Sur rendez-vous'],
  ['Dimanche', 'Fermé'],
]

const services = [
  ['Entretien et réparation', '/entretien-reparation'],
  ['Pièces et accessoires', '/pieces-accessoires'],
]

function Header({ isAuthenticated, onLogout, onNavigate }) {
  const [isHoursOpen, setIsHoursOpen] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isSocialOpen, setIsSocialOpen] = useState(false)

  useEffect(() => {
    if (!isHoursOpen) {
      return undefined
    }

    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        setIsHoursOpen(false)
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [isHoursOpen])

  const closeMenu = () => {
    setIsMenuOpen(false)
    setIsSocialOpen(false)
  }

  const goToPage = (event, href) => {
    event.preventDefault()
    closeMenu()
    onNavigate(href)
  }

  const logout = () => {
    closeMenu()
    onLogout()
  }

  return (
    <>
      <header className="site-header">
        <div className="top-bar" aria-label="Informations pratiques">
          <div className="top-bar-center">
            <button
              type="button"
              className="hours-button animated-button"
              onClick={() => setIsHoursOpen(true)}
            >
              Afficher les horaires
            </button>

            <a
              className="top-link top-address"
              href="https://maps.google.com/?q=3%20rue%20du%201er%20RCP%2C%2068320%20Widensolen"
              target="_blank"
              rel="noreferrer"
            >
              3 rue du 1er RCP, 68320 Widensolen
            </a>

            <a className="top-link top-phone" href="tel:+33630007808">
              06 30 00 78 08
            </a>
          </div>

          {isAuthenticated ? (
            <button
              type="button"
              className="top-link top-login-link"
              onClick={logout}
            >
              Se déconnecter
            </button>
          ) : (
            <a
              className="top-link top-login-link"
              href="/connexion"
              onClick={(event) => goToPage(event, '/connexion')}
            >
              Se connecter
            </a>
          )}
        </div>

        <div className="nav-shell">
          <a
            className="brand"
            href="/"
            aria-label="Retour à l'accueil"
            onClick={(event) => goToPage(event, '/')}
          >
            <img className="brand-logo" src="/logo.png" alt="RC services" />
          </a>

          <button
            type="button"
            className="menu-toggle animated-button"
            aria-expanded={isMenuOpen}
            aria-controls="main-navigation"
            onClick={() => setIsMenuOpen((open) => !open)}
          >
            Menu
          </button>

          <nav
            id="main-navigation"
            className={isMenuOpen ? 'main-nav is-open' : 'main-nav'}
            aria-label="Navigation principale"
          >
            <a href="/" onClick={(event) => goToPage(event, '/')}>
              Accueil
            </a>

            <div className="nav-dropdown">
              <button
                type="button"
                aria-haspopup="true"
                onClick={(event) => goToPage(event, '/#services')}
              >
                Nos services
              </button>
              <div className="submenu">
                {services.map(([service, href]) => (
                  <a
                    href={href}
                    key={service}
                    onClick={(event) => goToPage(event, href)}
                  >
                    {service}
                  </a>
                ))}
              </div>
            </div>

            <a
              href="/#images"
              onClick={(event) => goToPage(event, '/#images')}
            >
              Galerie
            </a>
            <a
              href="/#contact"
              onClick={(event) => goToPage(event, '/#contact')}
            >
              Contact
            </a>
            <a
              href="/rendez-vous"
              onClick={(event) => goToPage(event, '/rendez-vous')}
            >
              Rendez-vous
            </a>
            <div className="nav-dropdown social-dropdown">
              <button
                type="button"
                className="social-button"
                aria-haspopup="true"
                aria-expanded={isSocialOpen}
                onClick={() => setIsSocialOpen((open) => !open)}
              >
                Réseaux
              </button>
              <div
                className={
                  isSocialOpen
                    ? 'submenu social-submenu is-open'
                    : 'submenu social-submenu'
                }
              >
                <a
                  href="https://www.instagram.com/rcservice68/"
                  target="_blank"
                  rel="noreferrer"
                  onClick={closeMenu}
                >
                  Instagram
                </a>
                <a
                  href="https://www.tiktok.com/@rcservice68"
                  target="_blank"
                  rel="noreferrer"
                  onClick={closeMenu}
                >
                  TikTok
                </a>
              </div>
            </div>
          </nav>
        </div>
      </header>

      {isHoursOpen && (
        <div
          className="modal-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setIsHoursOpen(false)
            }
          }}
        >
          <section
            className="hours-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="hours-title"
          >
            <button
              type="button"
              className="modal-close"
              aria-label="Fermer la fenêtre des horaires"
              onClick={() => setIsHoursOpen(false)}
            >
              x
            </button>
            <p className="eyebrow">Horaires d'ouverture</p>
            <h2 id="hours-title">Nous vous accueillons sur rendez-vous.</h2>

            <dl className="hours-list">
              {openingHours.map(([day, hours]) => (
                <div key={day}>
                  <dt>{day}</dt>
                  <dd>{hours}</dd>
                </div>
              ))}
            </dl>
          </section>
        </div>
      )}
    </>
  )
}

export default Header
