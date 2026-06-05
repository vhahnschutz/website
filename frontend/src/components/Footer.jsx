function Footer({ onNavigate, onOpenCookieSettings }) {
  const goToPage = (event, href) => {
    event.preventDefault()
    onNavigate(href)
  }

  const openCookieSettings = (event) => {
    goToPage(event, '/gestion-cookies')
    onOpenCookieSettings()
  }

  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <div>
          <a className="footer-brand" href="/">
            RC services
          </a>
          <p>
            Mécanicien espaces verts, distributeur de pièces détachées et
            accessoires en motoculture.
          </p>
          <div className="footer-social">
            <a
              href="https://www.instagram.com/rcservice68/"
              target="_blank"
              rel="noreferrer"
              aria-label="Instagram"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
                <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
              </svg>
            </a>
            <a
              href="https://www.tiktok.com/@rcservice68"
              target="_blank"
              rel="noreferrer"
              aria-label="TikTok"
            >
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.88-2.88 2.89 2.89 0 0 1 2.88-2.88c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 0 0-.79-.05A6.34 6.34 0 0 0 3.15 15.2a6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.34-6.34V8.75a8.27 8.27 0 0 0 4.76 1.5V6.8a4.83 4.83 0 0 1-1-.11z"/>
              </svg>
            </a>
          </div>
        </div>

        <address className="footer-contact">
          <span>3 rue du 1er RCP, 68320 Widensolen</span>
          <a href="tel:+33630007808">06 30 00 78 08</a>
        </address>

        <div>
          <p className="eyebrow" style={{ color: 'var(--green-bright)', marginBottom: '10px' }}>Horaires</p>
          <p style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.88rem' }}>
            Nous vous accueillons sur rendez-vous du lundi au samedi durant les créneaux disponibles.
          </p>
        </div>

        <nav className="footer-links" aria-label="Liens obligatoires">
          <a
            href="/mentions-legales"
            onClick={(event) => goToPage(event, '/mentions-legales')}
          >
            Mentions légales
          </a>
          <a
            href="/politique-confidentialite"
            onClick={(event) => goToPage(event, '/politique-confidentialite')}
          >
            Politique de confidentialité
          </a>
          <a href="/gestion-cookies" onClick={openCookieSettings}>
            Gestion des cookies
          </a>
        </nav>
      </div>

      <p className="footer-bottom">
        Copyright 2026 RC services. Tous droits réservés.
      </p>
    </footer>
  )
}

export default Footer
