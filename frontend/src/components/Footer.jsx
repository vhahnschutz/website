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
        </div>

        <address className="footer-contact">
          <span>3 rue du 1er RCP, 68320 Widensolen</span>
          <a href="tel:+33630007808">06 30 00 78 08</a>
        </address>

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
