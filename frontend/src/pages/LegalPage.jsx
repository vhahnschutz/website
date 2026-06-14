const legalContent = {
  legal: {
    eyebrow: 'Mentions légales',
    title: 'Informations légales du site.',
    sections: [
      {
        title: 'Éditeur du site',
        text: [
          'RC services - Mécanicien espaces verts.',
          'Adresse : 3 rue du 1er RCP, 68320 Widensolen.',
          'Téléphone : 06 30 00 78 08.',
          'Email : Rcservices68320@gmail.com.',
          "SIRET, forme juridique, capital social et représentant légal : à compléter avec les informations officielles de l'entreprise.",
        ],
      },
      {
        title: 'Responsable de publication',
        text: [
          'Responsable de publication : RC services.',
        ],
      },
      {
        title: 'Hébergement',
        text: [
          "Hébergeur du site : supabase, vercel.",
        ],
      },
      {
        title: 'Propriété intellectuelle',
        text: [
          'Les textes, images, graphismes, logos et éléments du site sont protégés. Toute reproduction ou réutilisation sans autorisation préalable est interdite, sauf exception prévue par la loi.',
        ],
      },
      {
        title: 'Contact',
        text: [
          'Pour toute question concernant le site, vous pouvez utiliser le formulaire de contact ou écrire à Rcservices68320@gmail.com.',
        ],
      },
    ],
  },
  privacy: {
    eyebrow: 'Politique de confidentialité',
    title: 'Protection des données personnelles.',
    sections: [
      {
        title: 'Données collectées',
        text: [
          'Le site peut collecter les informations transmises volontairement via le formulaire de contact : nom, téléphone, adresse email, service demandé et message.',
        ],
      },
      {
        title: 'Finalité du traitement',
        text: [
          'Ces données servent uniquement à répondre à une demande de devis, une demande de renseignement ou une prise de contact.',
        ],
      },
      {
        title: 'Base légale',
        text: [
          "Le traitement repose sur la demande de l'utilisateur et sur l'intérêt légitime de l'entreprise à répondre aux messages reçus.",
        ],
      },
      {
        title: 'Durée de conservation',
        text: [
          "Les messages sont conservés le temps nécessaire au traitement de la demande, puis archivés ou supprimés selon les obligations applicables à l'entreprise.",
        ],
      },
      {
        title: 'Destinataires',
        text: [
          'Les données sont destinées à RC services. Elles ne sont pas vendues, louées ni transmises à des tiers à des fins commerciales.',
        ],
      },
      {
        title: 'Droits des personnes',
        text: [
          "Vous pouvez demander l'accès, la rectification, l'effacement ou la limitation du traitement de vos données en écrivant à Rcservices68320@gmail.com.",
          'Vous pouvez également introduire une réclamation auprès de la CNIL.',
        ],
      },
    ],
  },
  cookies: {
    eyebrow: 'Gestion des cookies',
    title: 'Cookies et traceurs.',
    sections: [
      {
        title: 'Cookies utilisés',
        text: [
          "Le site ne dépose pas de cookies publicitaires, de cookies de mesure d'audience ni de traceurs de réseaux sociaux.",
          "Un stockage local peut être utilisé uniquement pour mémoriser que l'information cookies a déjà été affichée.",
        ],
      },
      {
        title: 'Consentement',
        text: [
          "Aucun consentement n'est demandé pour des cookies non essentiels car le site n'en utilise pas actuellement.",
          "Si des traceurs de mesure d'audience, de publicité ou de réseaux sociaux sont ajoutés plus tard, un choix clair sera proposé avant leur dépôt.",
        ],
      },
      {
        title: 'Modifier vos choix',
        text: [
          'Vous pouvez rouvrir la gestion des cookies depuis le lien du footer.',
        ],
      },
    ],
  },
}

function LegalPage({ page, onOpenCookieSettings }) {
  const content = legalContent[page] ?? legalContent.legal

  return (
    <main className="legal-page">
      <p className="eyebrow">{content.eyebrow}</p>
      <h1>{content.title}</h1>

      <div className="legal-grid">
        {content.sections.map((section) => (
          <article className="legal-panel" key={section.title}>
            <h2>{section.title}</h2>
            {section.text.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </article>
        ))}
      </div>

      {page === 'cookies' && (
        <button
          type="button"
          className="cta-button legal-action"
          onClick={onOpenCookieSettings}
        >
          Ouvrir la gestion des cookies
        </button>
      )}
    </main>
  )
}

export default LegalPage
