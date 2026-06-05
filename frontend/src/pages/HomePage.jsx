function HomePage({ onNavigate }) {
  const goToContact = (event) => {
    event.preventDefault()
    onNavigate('/#contact')
  }

  const goToAppointments = (event) => {
    event.preventDefault()
    onNavigate('/rendez-vous')
  }

  return (
    <main id="accueil" className="hero-section">
      <div className="hero-video-wrap" aria-hidden="true">
        <video
          className="hero-video"
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          poster="https://res.cloudinary.com/dfolhwbxf/video/upload/so_0,f_jpg,q_auto:good,w_1920/v1780661900/Herosection_qhlbb2.mov"
        >
          <source
            src="https://res.cloudinary.com/dfolhwbxf/video/upload/f_mp4,vc_h264,q_auto:good,w_1920,ac_none/v1780661900/Herosection_qhlbb2.mov"
            type="video/mp4"
          />
        </video>
        <div className="hero-video-overlay" />
      </div>
      <div className="hero-content">
        <div className="hero-eyebrow-wrap">
          <span className="hero-accent-line" aria-hidden="true" />
          <p className="eyebrow hero-eyebrow">Mécanicien espaces verts</p>
          <span className="hero-accent-line" aria-hidden="true" />
        </div>
        <h1 className="hero-title">
          <span className="hero-title-line">Réparation, entretien</span>{' '}
          <span className="hero-title-line">et pièces pour votre</span>
          <br className="hero-title-break" />
          <span className="hero-title-line hero-title-line--accent">matériel de motoculture.</span>
        </h1>
        <p className="hero-description hero-desc">
          <strong>RC services accompagne les particuliers et professionnels avec un
          atelier dédié aux espaces verts, ainsi qu'un service de distribution de
          pièces détachées et d'accessoires en motoculture.</strong>
        </p>
        <div className="hero-actions hero-actions-anim">
          <a href="/#contact" className="cta-button" onClick={goToContact}>
            Demander un devis
          </a>
          <a href="/rendez-vous" className="secondary-button" onClick={goToAppointments}>
            Prendre rendez-vous
          </a>
        </div>
      </div>
    </main>
  )
}

export default HomePage