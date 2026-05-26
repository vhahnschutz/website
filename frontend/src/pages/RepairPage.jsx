import serviceEntretienImage from '../assets/service-entretien.png'

const strengths = ['Satisfaction client', 'Disponibilité', 'Proximité']

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

      <div className="strength-grid" aria-label="Points forts">
        {strengths.map((strength) => (
          <article key={strength}>
            <span></span>
            <h3>{strength}</h3>
          </article>
        ))}
      </div>

      <div className="repair-content-grid">
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
