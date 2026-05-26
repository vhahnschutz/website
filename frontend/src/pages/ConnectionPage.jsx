import { useEffect, useState } from 'react'
import {
  clearAuth,
  getCurrentAdmin,
  getStoredAuth,
  loginAdmin,
  storeAuth,
} from '../lib/api'

const initialFormData = {
  username: '',
  password: '',
}

function ConnectionPage({ onLoginSuccess }) {
  const storedAuth = getStoredAuth()
  const [formData, setFormData] = useState(initialFormData)
  const [isCheckingSession, setIsCheckingSession] = useState(
    () => Boolean(storedAuth?.token),
  )
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!storedAuth?.token) {
      return
    }

    getCurrentAdmin(storedAuth.token)
      .then(() => onLoginSuccess())
      .catch(() => clearAuth())
      .finally(() => setIsCheckingSession(false))
  }, [onLoginSuccess, storedAuth?.token])

  const updateField = (event) => {
    const { name, value } = event.target
    setFormData((currentData) => ({
      ...currentData,
      [name]: value,
    }))
  }

  const submitLogin = async (event) => {
    event.preventDefault()
    setError('')
    setIsSubmitting(true)

    try {
      const authData = await loginAdmin(formData)
      storeAuth(authData)
      setFormData(initialFormData)
      onLoginSuccess()
    } catch (loginError) {
      setError(loginError.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isCheckingSession) {
    return (
      <main className="admin-page">
        <section className="admin-login-panel" aria-live="polite">
          <p className="eyebrow">Connexion</p>
          <h1>Vérification de la session.</h1>
        </section>
      </main>
    )
  }

  return (
    <main className="admin-page">
      <section className="admin-login-panel">
        <p className="eyebrow">Connexion</p>
        <h1>Connexion</h1>
        <p className="admin-login-copy">
          Connectez-vous avec vos identifiants pour accéder à votre espace.
        </p>

        <form className="admin-login-form" onSubmit={submitLogin}>
          <label>
            <span>Identifiant</span>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={updateField}
              autoComplete="username"
              required
            />
          </label>

          <label>
            <span>Mot de passe</span>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={updateField}
              autoComplete="current-password"
              required
            />
          </label>

          {error && (
            <p className="admin-login-error" role="alert">
              {error}
            </p>
          )}

          <button type="submit" className="cta-button" disabled={isSubmitting}>
            {isSubmitting ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>
      </section>
    </main>
  )
}

export default ConnectionPage
