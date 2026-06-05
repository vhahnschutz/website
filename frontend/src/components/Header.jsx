import { useState } from 'react'

const services = [
  ['Entretien et réparation', '/entretien-reparation'],
  ['Pièces et accessoires', '/pieces-accessoires'],
]

function Header({ isAuthenticated, onLogout, onNavigate, currentRoute }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isSocialOpen, setIsSocialOpen] = useState(false)

  const closeMenu = () => {
    setIsMenuOpen(false)
    setIsSocialOpen(false)
  }

  const goToPage = (event, href) => {
    event.preventDefault()
    closeMenu()
    onNavigate(href)
  }

  return (
    <header className="site-header">
      <div className="top-bar" aria-label="Informations pratiques">
        <div className="top-bar-center">
          <a
            className="top-link"
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
          <a
            href="/"
            className={currentRoute === 'home' ? 'is-active' : ''}
            onClick={(event) => goToPage(event, '/')}
          >
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
                  className={
                    (currentRoute === 'repair' && href === '/entretien-reparation') ||
                    (currentRoute === 'rental' && href === '/pieces-accessoires')
                      ? 'is-active'
                      : ''
                  }
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
            className={currentRoute === 'appointments' ? 'is-active' : ''}
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
  )
}

export default Header
