import { useState } from 'react'
import { sendContactMessage } from '../lib/api'

const contactEmail = 'Rcservices68320@gmail.com'

const initialFormData = {
  name: '',
  phone: '',
  email: '',
  service: 'Entretien et réparation',
  message: '',
  privacyAccepted: false,
  humanConfirmed: false,
  website: '',
}

function ContactPage({ onNavigate }) {
  const [formData, setFormData] = useState(initialFormData)
  const [status, setStatus] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const updateField = (event) => {
    const { checked, name, type, value } = event.target
    setFormData((currentData) => ({
      ...currentData,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  const sendEmail = async (event) => {
    event.preventDefault()
    setStatus('')
    setError('')
    setIsSubmitting(true)

    try {
      await sendContactMessage(formData)
      setStatus('Votre demande a bien été envoyée.')
      setFormData(initialFormData)
    } catch (sendError) {
      setError(sendError.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const goToAppointments = (event) => {
    event.preventDefault()

    if (onNavigate) {
      onNavigate('/rendez-vous')
      return
    }

    window.location.href = '/rendez-vous'
  }

  return (
    <section id="contact" className="page-section page-section-muted">
      <p className="eyebrow">Contact</p>
      <h2>Demander un devis ou un renseignement.</h2>

      <div className="contact-layout">
        <form className="contact-form" onSubmit={sendEmail}>
          <label>
            <span>Nom</span>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={updateField}
              autoComplete="name"
              required
            />
          </label>

          <label>
            <span>Téléphone</span>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={updateField}
              autoComplete="tel"
              required
            />
          </label>

          <label>
            <span>Email</span>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={updateField}
              autoComplete="email"
              required
            />
          </label>

          <label>
            <span>Service</span>
            <select
              name="service"
              value={formData.service}
              onChange={updateField}
            >
              <option>Entretien et réparation</option>
              <option>Pièces détachées et accessoires</option>
              <option>Autre demande</option>
            </select>
          </label>

          <label className="contact-honeypot" aria-hidden="true">
            <span>Site web</span>
            <input
              type="text"
              name="website"
              value={formData.website}
              onChange={updateField}
              autoComplete="off"
              tabIndex="-1"
            />
          </label>

          <label className="contact-message">
            <span>Message</span>
            <textarea
              name="message"
              value={formData.message}
              onChange={updateField}
              rows="6"
              required
            />
          </label>

          <div className="contact-consents">
            <label className="checkbox-field">
              <input
                type="checkbox"
                name="privacyAccepted"
                checked={formData.privacyAccepted}
                onChange={updateField}
                required
              />
              <span>
                J'ai lu et j'accepte la{' '}
                <a href="/politique-confidentialite">
                  Politique de confidentialité
                </a>{' '}
                de ce site
              </span>
            </label>

            <label className="checkbox-field human-check">
              <input
                type="checkbox"
                name="humanConfirmed"
                checked={formData.humanConfirmed}
                onChange={updateField}
                required
              />
              <span>Je confirme que je ne suis pas un robot</span>
            </label>
          </div>

          {status && (
            <p className="contact-status" role="status">
              {status}
            </p>
          )}

          {error && (
            <p className="admin-login-error contact-status" role="alert">
              {error}
            </p>
          )}

          <button
            type="submit"
            className="cta-button contact-submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Envoi...' : 'Envoyer la demande'}
          </button>
        </form>

        <aside className="contact-card" aria-label="Coordonnées">
          <h3>Coordonnées</h3>
          <a href="tel:+33630007808">06 30 00 78 08</a>
          <a href={`mailto:${contactEmail}`}>{contactEmail}</a>
          <p>3 rue du 1er RCP, 68320 Widensolen</p>
          <a
            href="/rendez-vous"
            className="cta-button contact-appointment-link"
            onClick={goToAppointments}
          >
            Prendre rendez-vous
          </a>
        </aside>
      </div>
    </section>
  )
}

export default ContactPage
