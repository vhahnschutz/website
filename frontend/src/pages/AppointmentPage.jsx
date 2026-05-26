import { useEffect, useMemo, useState } from 'react'
import {
  cancelAppointment,
  clearAuth,
  createAppointmentSlot,
  deleteAppointmentSlot,
  fetchAdminAppointments,
  fetchAppointmentAvailability,
  getCurrentAdmin,
  getStoredAuth,
  requestAppointment,
  updateAppointment,
  validateAppointment,
} from '../lib/api'

const openingHours = Array.from({ length: 11 }, (_, index) => index + 8)
const weekDays = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche']

const initialAppointmentForm = {
  title: 'Demande de rendez-vous',
  customer_name: '',
  customer_email: '',
  customer_phone: '',
  scheduled_at: '',
  duration_minutes: 60,
  notes: '',
  privacyAccepted: false,
  humanConfirmed: false,
  website: '',
}

function toDateTimeLocalValue(date) {
  const offsetDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
  return offsetDate.toISOString().slice(0, 16)
}

function getMonday(date) {
  const start = new Date(date)
  const day = start.getDay() || 7
  start.setDate(start.getDate() - day + 1)
  start.setHours(0, 0, 0, 0)
  return start
}

function formatDate(value) {
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'short',
  }).format(new Date(value))
}

function formatLongDate(value) {
  return new Intl.DateTimeFormat('fr-FR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

function getStatusLabel(status) {
  if (status === 'confirmed') {
    return 'Confirmé'
  }

  if (status === 'cancelled') {
    return 'Annulé'
  }

  return 'En attente'
}

function getEndTime(date, durationMinutes = 60) {
  return new Date(new Date(date).getTime() + durationMinutes * 60000)
}

function formatDuration(minutes = 60) {
  if (minutes === 60) {
    return '1 heure'
  }

  const hours = minutes / 60
  return `${Number.isInteger(hours) ? hours : hours.toFixed(1)} heures`
}

function buildWeekSlots(weekStart) {
  return weekDays.map((dayLabel, dayIndex) => {
    const day = new Date(weekStart)
    day.setDate(weekStart.getDate() + dayIndex)

    return {
      dayLabel,
      date: day,
      slots: openingHours.map((hour) => {
        const slotDate = new Date(day)
        slotDate.setHours(hour, 0, 0, 0)
        return slotDate
      }),
    }
  })
}

function AppointmentPage() {
  const [weekStart, setWeekStart] = useState(() => getMonday(new Date()))
  const [availability, setAvailability] = useState([])
  const [appointmentSlots, setAppointmentSlots] = useState([])
  const [adminAppointments, setAdminAppointments] = useState([])
  const [adminToken, setAdminToken] = useState('')
  const [selectedSlot, setSelectedSlot] = useState(null)
  const [selectedAppointment, setSelectedAppointment] = useState(null)
  const [formData, setFormData] = useState(initialAppointmentForm)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [isCancelConfirmOpen, setIsCancelConfirmOpen] = useState(false)
  const [status, setStatus] = useState('')
  const [error, setError] = useState('')

  const weekSlots = useMemo(() => buildWeekSlots(weekStart), [weekStart])

  const appointmentsByTime = useMemo(() => {
    const source = adminToken ? adminAppointments : availability
    return source.reduce((appointmentsMap, appointment) => {
      appointmentsMap.set(new Date(appointment.scheduled_at).getTime(), appointment)
      return appointmentsMap
    }, new Map())
  }, [adminAppointments, adminToken, availability])

  const appointmentSlotsByTime = useMemo(() => appointmentSlots.reduce((slotsMap, slot) => {
    slotsMap.set(new Date(slot.starts_at).getTime(), slot)
    return slotsMap
  }, new Map()), [appointmentSlots])

  const findAppointmentForSlot = (slotDate) => {
    const source = adminToken ? adminAppointments : availability
    return source.find((appointment) => {
      const startsAt = new Date(appointment.scheduled_at)
      const endsAt = getEndTime(startsAt, appointment.duration_minutes)
      return slotDate >= startsAt && slotDate < endsAt
    })
  }

  const loadAppointments = async () => {
    setIsLoading(true)
    setError('')

    try {
      const storedAuth = getStoredAuth()
      const availabilityData = await fetchAppointmentAvailability()
      setAvailability(availabilityData.appointments ?? availabilityData)
      setAppointmentSlots(availabilityData.slots ?? [])

      if (storedAuth?.token) {
        try {
          await getCurrentAdmin(storedAuth.token)
          setAdminToken(storedAuth.token)
          setAdminAppointments(await fetchAdminAppointments(storedAuth.token))
        } catch {
          clearAuth()
          setAdminToken('')
          setAdminAppointments([])
        }
      }
    } catch (loadError) {
      setError(loadError.message)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    let isMounted = true

    queueMicrotask(() => {
      if (isMounted) {
        loadAppointments()
      }
    })

    return () => {
      isMounted = false
    }
  }, [])

  const updateField = (event) => {
    const { checked, name, type, value } = event.target
    setFormData((currentData) => ({
      ...currentData,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  const openSlot = (slotDate) => {
    setStatus('')
    setError('')
    const appointment = findAppointmentForSlot(slotDate)
    const slot = appointmentSlotsByTime.get(slotDate.getTime())

    if (appointment) {
      if (!adminToken) {
        return
      }

      setSelectedAppointment(appointment)
      setSelectedSlot(null)
      setFormData({
        title: appointment.title,
        customer_name: appointment.customer_name,
        customer_email: appointment.customer_email,
        customer_phone: appointment.customer_phone,
        scheduled_at: toDateTimeLocalValue(new Date(appointment.scheduled_at)),
        duration_minutes: appointment.duration_minutes ?? 60,
        notes: appointment.notes ?? '',
        privacyAccepted: true,
        humanConfirmed: true,
        website: '',
      })
      return
    }

    if (adminToken) {
      toggleAvailabilitySlot(slotDate, slot)
      return
    }

    if (!slot) {
      return
    }

    setSelectedSlot(slotDate)
    setSelectedAppointment(null)
    setFormData({
      ...initialAppointmentForm,
      scheduled_at: toDateTimeLocalValue(slotDate),
      duration_minutes: slot.duration_minutes ?? 60,
    })
  }

  const toggleAvailabilitySlot = async (slotDate, slot) => {
    if (slotDate.getTime() < Date.now()) {
      return
    }

    setError('')
    setIsUpdating(true)

    try {
      if (slot) {
        await deleteAppointmentSlot(adminToken, slot.id)
      } else {
        await createAppointmentSlot(adminToken, {
          starts_at: toDateTimeLocalValue(slotDate),
          duration_minutes: 60,
        })
      }

      await loadAppointments()
    } catch (slotError) {
      setError(slotError.message)
    } finally {
      setIsUpdating(false)
    }
  }

  const closeModal = () => {
    if (isSubmitting || isUpdating) {
      return
    }

    setSelectedSlot(null)
    setSelectedAppointment(null)
    setIsCancelConfirmOpen(false)
    setFormData(initialAppointmentForm)
    setStatus('')
    setError('')
  }

  const submitAppointment = async (event) => {
    event.preventDefault()
    setStatus('')
    setError('')
    setIsSubmitting(true)

    try {
      await requestAppointment(formData)
      setStatus('Votre demande a bien été envoyée. Elle sera confirmée après validation.')
      await loadAppointments()
      setTimeout(closeModal, 900)
    } catch (submitError) {
      setError(submitError.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const saveAdminAppointment = async (event) => {
    event.preventDefault()
    setError('')
    setIsUpdating(true)

    try {
      await updateAppointment(adminToken, selectedAppointment.id, {
        title: formData.title,
        customer_name: formData.customer_name,
        customer_email: formData.customer_email,
        customer_phone: formData.customer_phone,
        scheduled_at: formData.scheduled_at,
        duration_minutes: Number(formData.duration_minutes),
        notes: formData.notes,
      })
      await loadAppointments()
      closeModal()
    } catch (updateError) {
      setError(updateError.message)
    } finally {
      setIsUpdating(false)
    }
  }

  const changeAppointmentStatus = async (action) => {
    setError('')
    setIsUpdating(true)

    try {
      if (action === 'validate') {
        await validateAppointment(adminToken, selectedAppointment.id, {
          title: formData.title,
          customer_name: formData.customer_name,
          customer_email: formData.customer_email,
          customer_phone: formData.customer_phone,
          scheduled_at: formData.scheduled_at,
          duration_minutes: Number(formData.duration_minutes),
          notes: formData.notes,
        })
      } else {
        await cancelAppointment(adminToken, selectedAppointment.id)
      }

      await loadAppointments()
      closeModal()
    } catch (updateError) {
      setError(updateError.message)
    } finally {
      setIsUpdating(false)
    }
  }

  const askCancelConfirmation = () => {
    setError('')
    setIsCancelConfirmOpen(true)
  }

  const closeCancelConfirmation = () => {
    if (!isUpdating) {
      setIsCancelConfirmOpen(false)
    }
  }

  const confirmCancelAppointment = async () => {
    setIsCancelConfirmOpen(false)
    await changeAppointmentStatus('cancel')
  }

  const goToPreviousWeek = () => {
    setWeekStart((currentWeek) => {
      const previousWeek = new Date(currentWeek)
      previousWeek.setDate(previousWeek.getDate() - 7)
      return previousWeek
    })
  }

  const goToNextWeek = () => {
    setWeekStart((currentWeek) => {
      const nextWeek = new Date(currentWeek)
      nextWeek.setDate(nextWeek.getDate() + 7)
      return nextWeek
    })
  }

  const modalTitle = selectedAppointment
    ? 'Modifier le rendez-vous'
    : 'Demander un rendez-vous'

  const renderSlotButton = (slot, dayLabel, hour, variant = 'desktop') => {
    const appointment = findAppointmentForSlot(slot)
    const availabilitySlot = appointmentSlotsByTime.get(slot.getTime())
    const isBusy = Boolean(appointment)
    const isOpen = Boolean(availabilitySlot)
    const isPast = slot.getTime() < Date.now()
    const slotLabel = isBusy
      ? getStatusLabel(appointment.status)
      : isOpen
        ? adminToken
          ? 'Fermer'
          : 'Disponible'
        : adminToken
          ? 'Ouvrir'
          : 'Indisponible'

    return (
      <button
        type="button"
        className={
          isBusy
            ? `planner-slot is-${appointment.status}`
            : isOpen
              ? 'planner-slot is-open'
              : 'planner-slot is-closed'
        }
        disabled={isUpdating || isPast || (!adminToken && (!isOpen || isBusy))}
        key={`${variant}-${dayLabel}-${hour}`}
        onClick={() => openSlot(slot)}
      >
        <span>{hour}h - {hour + 1}h</span>
        <strong>{slotLabel}</strong>
      </button>
    )
  }

  return (
    <main className="appointment-page">
      <section className="page-intro appointment-page-intro">
        <p className="eyebrow">Rendez-vous</p>
        <h1>Choisir un créneau d’intervention.</h1>
        <p>
          Les rendez-vous sont possibles uniquement sur les créneaux ouverts
          par l'atelier.
        </p>
      </section>

      <section className="page-section appointment-planner-section">
        <div className="planner-toolbar">
          <button type="button" className="secondary-button" onClick={goToPreviousWeek}>
            Semaine précédente
          </button>
          <strong>
            Semaine du {formatDate(weekStart)} au{' '}
            {formatDate(weekSlots[6].date)}
          </strong>
          <button type="button" className="secondary-button" onClick={goToNextWeek}>
            Semaine suivante
          </button>
        </div>

        {error && !selectedSlot && !selectedAppointment && (
          <p className="admin-login-error appointment-alert" role="alert">
            {error}
          </p>
        )}

        {isLoading && <p className="empty-results">Chargement du planning...</p>}

        <div className="planner-grid" aria-label="Planning des rendez-vous">
          <div className="planner-corner" />
          {weekSlots.map((day) => (
            <div className="planner-day-heading" key={day.dayLabel}>
              <strong>{day.dayLabel}</strong>
              <span>{formatDate(day.date)}</span>
            </div>
          ))}

          {openingHours.map((hour) => (
            <div className="planner-row" key={hour}>
              <div className="planner-hour">{hour}h</div>
              {weekSlots.map((day) => {
                const slot = day.slots.find((slotDate) => slotDate.getHours() === hour)
                return renderSlotButton(slot, day.dayLabel, hour)
              })}
            </div>
          ))}
        </div>

        <div className="planner-mobile-list" aria-label="Planning des rendez-vous mobile">
          {weekSlots.map((day) => (
            <section className="planner-mobile-day" key={`mobile-${day.dayLabel}`}>
              <header>
                <strong>{day.dayLabel}</strong>
                <span>{formatDate(day.date)}</span>
              </header>
              <div className="planner-mobile-slots">
                {day.slots.map((slot) => renderSlotButton(
                  slot,
                  day.dayLabel,
                  slot.getHours(),
                  'mobile',
                ))}
              </div>
            </section>
          ))}
        </div>
      </section>

      {(selectedSlot || selectedAppointment) && (
        <div
          className="modal-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeModal()
            }
          }}
        >
          <section
            className="appointment-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="appointment-modal-title"
          >
            <button
              type="button"
              className="modal-close"
              aria-label="Fermer"
              onClick={closeModal}
            >
              x
            </button>

            <p className="eyebrow">
              {selectedAppointment ? getStatusLabel(selectedAppointment.status) : 'Créneau libre'}
            </p>
            <h2 id="appointment-modal-title">{modalTitle}</h2>
            <p className="appointment-modal-date">
              {formatLongDate(formData.scheduled_at)}
              {' '}({formatDuration(formData.duration_minutes)})
            </p>

            <form
              className="appointment-form"
              onSubmit={selectedAppointment ? saveAdminAppointment : submitAppointment}
            >
              <label>
                <span>Nom</span>
                <input
                  type="text"
                  name="customer_name"
                  value={formData.customer_name}
                  onChange={updateField}
                  autoComplete="name"
                  required
                />
              </label>

              <label>
                <span>Téléphone</span>
                <input
                  type="tel"
                  name="customer_phone"
                  value={formData.customer_phone}
                  onChange={updateField}
                  autoComplete="tel"
                  required
                />
              </label>

              <label>
                <span>Email</span>
                <input
                  type="email"
                  name="customer_email"
                  value={formData.customer_email}
                  onChange={updateField}
                  autoComplete="email"
                  required
                />
              </label>

              <label>
                <span>Créneau</span>
                <input
                  type="datetime-local"
                  name="scheduled_at"
                  value={formData.scheduled_at}
                  onChange={updateField}
                  disabled={!selectedAppointment}
                  required
                />
              </label>

              {selectedAppointment && (
                <label>
                  <span>Durée (minutes)</span>
                  <input
                    type="number"
                    name="duration_minutes"
                    value={formData.duration_minutes}
                    onChange={updateField}
                    min="60"
                    step="60"
                    required
                  />
                </label>
              )}

              <label className="appointment-wide">
                <span>Objet</span>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={updateField}
                  required
                />
              </label>

              <label className="appointment-wide">
                <span>Message</span>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={updateField}
                  rows="5"
                />
              </label>

              {!selectedAppointment && (
                <>
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

                  <div className="appointment-wide contact-consents">
                    <label className="checkbox-field">
                      <input
                        type="checkbox"
                        name="privacyAccepted"
                        checked={formData.privacyAccepted}
                        onChange={updateField}
                        required
                      />
                      <span>J'accepte la politique de confidentialité.</span>
                    </label>

                    <label className="checkbox-field human-check">
                      <input
                        type="checkbox"
                        name="humanConfirmed"
                        checked={formData.humanConfirmed}
                        onChange={updateField}
                        required
                      />
                      <span>Je confirme que je ne suis pas un robot.</span>
                    </label>
                  </div>
                </>
              )}

              {status && (
                <p className="contact-status appointment-wide" role="status">
                  {status}
                </p>
              )}

              {error && (
                <p className="admin-login-error appointment-wide" role="alert">
                  {error}
                </p>
              )}

              <button
                type="submit"
                className="cta-button appointment-wide"
                disabled={isSubmitting || isUpdating}
              >
                {selectedAppointment ? 'Enregistrer' : 'Envoyer la demande'}
              </button>
            </form>

            {selectedAppointment && (
              <div className="appointment-modal-actions">
                {selectedAppointment.status !== 'confirmed' && (
                  <button
                    type="button"
                    className="secondary-button"
                    disabled={isUpdating}
                    onClick={() => changeAppointmentStatus('validate')}
                  >
                    Valider
                  </button>
                )}
                <button
                  type="button"
                  className="secondary-button danger-button"
                  disabled={isUpdating || selectedAppointment.status === 'cancelled'}
                  onClick={askCancelConfirmation}
                >
                  Annuler
                </button>
              </div>
            )}
          </section>
        </div>
      )}

      {isCancelConfirmOpen && selectedAppointment && (
        <div
          className="modal-backdrop confirmation-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeCancelConfirmation()
            }
          }}
        >
          <section
            className="confirmation-modal"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="cancel-confirmation-title"
            aria-describedby="cancel-confirmation-description"
          >
            <p className="eyebrow">Confirmation</p>
            <h2 id="cancel-confirmation-title">
              Annuler ce rendez-vous ?
            </h2>
            <p id="cancel-confirmation-description">
              Cette action supprimera le rendez-vous du planning et libérera
              définitivement le créneau du {formatLongDate(formData.scheduled_at)}.
            </p>

            <div className="confirmation-actions">
              <button
                type="button"
                className="secondary-button"
                disabled={isUpdating}
                onClick={closeCancelConfirmation}
              >
                Garder le rendez-vous
              </button>
              <button
                type="button"
                className="secondary-button danger-button danger-button-solid"
                disabled={isUpdating}
                onClick={confirmCancelAppointment}
              >
                Annuler le rendez-vous
              </button>
            </div>
          </section>
        </div>
      )}
    </main>
  )
}

export default AppointmentPage
