import serviceEntretienImage from '../assets/service-entretien.png'

const strengths = [
  {
    title: 'Satisfaction client',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
      </svg>
    ),
  },
  {
    title: 'Disponibilité',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <polyline points="12 6 12 12 16 14"/>
      </svg>
    ),
  },
  {
    title: 'Proximité',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
        <circle cx="12" cy="10" r="3"/>
      </svg>
    ),
  },
]

const revisionTasks = [
  'Vidange et contrôle des niveaux',
  'Changement des filtres et bougies',
  'Vérification des câbles et sécurités',
  'Affutage des lames',
  'Nettoyage complet avant hivernage',
]

const repairedMachines = [
  'Tondeuse et tracteur tondeuse',
  'Tronçonneuse et élagueuse',
  'Scarificateur',
  'Taille-haies et débroussailleuse',
  'Souffleur et aspiro-broyeur',
  'Motoculteur et petit matériel thermique',
]

function RepairPage({ onNavigate }) {
  const goToContact = (event) => {
    event.preventDefault()
    onNavigate('/#contact')
  }

  return (
    <section id="entretien-reparation" className="repair-page">
      <div className="repair-hero">
        <div>
          <p className="eyebrow">Entretien et réparation</p>
          <h2>Un atelier pour prolonger la vie de votre matériel.</h2>
          <p>
            Révision, diagnostic et réparation de matériels d'espaces verts
            pour les particuliers comme les professionnels. L'objectif est
            simple : remettre vos machines en service rapidement, proprement et
            avec des conseils clairs.
          </p>
        </div>

        <img
          src={serviceEntretienImage}
          alt="Entretien et réparation en motoculture par RC Services"
        />
      </div>

      <div className="strength-grid reveal" aria-label="Points forts">
        {strengths.map((strength) => (
          <article key={strength.title}>
            <span className="strength-icon">{strength.icon}</span>
            <h3>{strength.title}</h3>
          </article>
        ))}
      </div>

      <div className="repair-content-grid reveal">
        <article className="repair-panel">
          <h3>Révision</h3>
          <p>
            Une révision régulière aide à éviter les pannes, garder une coupe
            propre et préparer le matériel avant les périodes de forte
            utilisation ou d'hivernage.
          </p>
          <ul>
            {revisionTasks.map((task) => (
              <li key={task}>{task}</li>
            ))}
          </ul>
        </article>

        <article className="repair-panel">
          <h3>Réparation</h3>
          <p>
            En cas de panne ou de dysfonctionnement, le matériel est contrôlé
            pour identifier l'origine du problème et remplacer les pièces quand
            cela est possible.
          </p>
          <ul>
            {repairedMachines.map((machine) => (
              <li key={machine}>{machine}</li>
            ))}
          </ul>
        </article>
      </div>

      <div className="repair-cta">
        <div>
          <h3>Une machine ne démarre plus ?</h3>
          <p>
            Batterie faible, bougie usée, filtre encrassé, lame abîmée ou
            problème moteur : une vérification rapide permet souvent de savoir
            quoi faire avant de remplacer le matériel.
          </p>
        </div>
        <a href="/#contact" className="cta-button" onClick={goToContact}>
          Demander un devis
        </a>
      </div>
    </section>
  )
}

export default RepairPage
