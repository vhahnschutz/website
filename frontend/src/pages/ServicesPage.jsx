import serviceEntretienImage from '../assets/service-entretien.png'
import servicePiecesImage from '../assets/service-pieces.jpeg'

const serviceCards = [
  {
    title: 'Entretien et réparation',
    href: '/entretien-reparation',
    image: serviceEntretienImage,
    imageAlt: 'Entretien et réparation en motoculture par RC Services',
    description:
      'Révision, nettoyage, diagnostic et remise en état du matériel.',
  },
  {
    title: 'Pièces détachées et accessoires',
    href: '/pieces-accessoires',
    image: servicePiecesImage,
    imageAlt: 'Pièces détachées et accessoires de motoculture RC Services',
    description:
      'Distribution de pièces détachées et d’accessoires pour la motoculture.',
  },
]

function ServicesPage({ onNavigate }) {
  const goToService = (event, href) => {
    event.preventDefault()
    onNavigate(href)
  }

  return (
    <section id="services" className="page-section">
      <p className="eyebrow">Nos services</p>
      <h2>Des prestations claires pour entretenir et équiper vos machines.</h2>
      <div className="service-grid">
        {serviceCards.map((service) => (
          <a
            className="service-card"
            href={service.href}
            key={service.title}
            onClick={(event) => goToService(event, service.href)}
          >
            <img src={service.image} alt={service.imageAlt} loading="lazy" />
            <div className="service-card-content">
              <h3>{service.title}</h3>
              <p>{service.description}</p>
            </div>
          </a>
        ))}
      </div>
    </section>
  )
}

export default ServicesPage
