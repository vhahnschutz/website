import { useEffect, useState } from 'react'
import { clearAuth } from './lib/api'
import { supabase } from './lib/supabase'
import CookieConsent from './components/CookieConsent'
import Footer from './components/Footer'
import ConnectionPage from './pages/ConnectionPage'
import Header from './components/Header'
import AppointmentPage from './pages/AppointmentPage'
import ContactPage from './pages/ContactPage'
import GalleryPage from './pages/GalleryPage'
import HomePage from './pages/HomePage'
import LegalPage from './pages/LegalPage'
import RentalPage from './pages/RentalPage'
import RepairPage from './pages/RepairPage'
import ServicesPage from './pages/ServicesPage'
import './App.css'

const routes = {
  '/': 'home',
  '/entretien-reparation': 'repair',
  '/pieces-accessoires': 'rental',
  '/location-materiel': 'rental',
  '/mentions-legales': 'legal',
  '/politique-confidentialite': 'privacy',
  '/gestion-cookies': 'cookies',
  '/connexion': 'connection',
  '/rendez-vous': 'appointments',
}

function getCurrentRoute() {
  return routes[window.location.pathname] ?? 'home'
}

function scrollToTarget(target) {
  const headerHeight =
    document.querySelector('.site-header')?.getBoundingClientRect().height ?? 0
  const extraSpacing = 16
  const targetTop =
    target.getBoundingClientRect().top + window.scrollY - headerHeight - extraSpacing

  window.scrollTo({
    top: Math.max(targetTop, 0),
    behavior: 'smooth',
  })
}

function App() {
  const [route, setRoute] = useState(getCurrentRoute)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isGalleryReady, setIsGalleryReady] = useState(false)
  const [isCookiePanelOpen, setIsCookiePanelOpen] = useState(false)
  const [pendingScrollHash, setPendingScrollHash] = useState(
    () => window.location.hash || null,
  )

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAuthenticated(Boolean(session))
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(Boolean(session))
    })

    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    const onPopState = () => {
      setRoute(getCurrentRoute())
      setPendingScrollHash(window.location.hash || null)
    }

    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [])

  const navigate = (path) => {
    window.history.pushState({}, '', path)
    const nextRoute = getCurrentRoute()
    const nextHash = window.location.hash || null
    setRoute(nextRoute)
    setPendingScrollHash(nextHash)

    if (nextRoute === 'home') {
      setIsGalleryReady(false)
    }

    if (!nextHash) {
      window.requestAnimationFrame(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' })
      })
    }
  }

  useEffect(() => {
    if (route !== 'home') {
      setIsGalleryReady(false)
    }
  }, [route])

  useEffect(() => {
    if (!pendingScrollHash) {
      return
    }

    if (route === 'home' && pendingScrollHash === '#contact' && !isGalleryReady) {
      return
    }

    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        const target = document.querySelector(pendingScrollHash)

        if (target) {
          scrollToTarget(target)
          setPendingScrollHash(null)
        }
      })
    })
  }, [isGalleryReady, pendingScrollHash, route])

  const handleLoginSuccess = () => {
    setIsAuthenticated(true)
    navigate('/')
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    clearAuth()
    setIsAuthenticated(false)
    navigate('/')
  }

  return (
    <>
      <Header
        isAuthenticated={isAuthenticated}
        onLogout={handleLogout}
        onNavigate={navigate}
      />
      {route === 'connection' && (
        <ConnectionPage onLoginSuccess={handleLoginSuccess} />
      )}
      {route === 'home' && (
        <>
          <HomePage />
          <ServicesPage onNavigate={navigate} />
          <GalleryPage
            isAuthenticated={isAuthenticated}
            onReady={() => setIsGalleryReady(true)}
          />
          <ContactPage onNavigate={navigate} />
        </>
      )}
      {route === 'appointments' && <AppointmentPage isAuthenticated={isAuthenticated} />}
      {route === 'repair' && <RepairPage onNavigate={navigate} />}
      {route === 'rental' && <RentalPage isAuthenticated={isAuthenticated} />}
      {route === 'legal' && <LegalPage page="legal" />}
      {route === 'privacy' && <LegalPage page="privacy" />}
      {route === 'cookies' && (
        <LegalPage
          page="cookies"
          onOpenCookieSettings={() => setIsCookiePanelOpen(true)}
        />
      )}
      <Footer
        onNavigate={navigate}
        onOpenCookieSettings={() => setIsCookiePanelOpen(true)}
      />
      <CookieConsent
        isPanelOpen={isCookiePanelOpen}
        onClosePanel={() => setIsCookiePanelOpen(false)}
        onOpenPanel={() => setIsCookiePanelOpen(true)}
      />
    </>
  )
}

export default App
