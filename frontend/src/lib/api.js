const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:8000/api'

export const authStorageKey = 'rc_admin_auth'

export function getStoredAuth() {
  try {
    const storedAuth = window.localStorage.getItem(authStorageKey)
    return storedAuth ? JSON.parse(storedAuth) : null
  } catch {
    return null
  }
}

export function storeAuth(authData) {
  window.localStorage.setItem(authStorageKey, JSON.stringify(authData))
}

export function clearAuth() {
  window.localStorage.removeItem(authStorageKey)
}

export async function loginAdmin(credentials) {
  const response = await fetch(`${API_BASE_URL}/auth/login/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(credentials),
  })

  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(
      data.non_field_errors?.[0] ??
        data.detail ??
        'Connexion impossible. Vérifiez les identifiants.',
    )
  }

  return data
}

export async function getCurrentAdmin(token) {
  const response = await fetch(`${API_BASE_URL}/auth/me/`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  if (!response.ok) {
    throw new Error('Session expirée.')
  }

  return response.json()
}

export async function fetchSales() {
  const response = await fetch(`${API_BASE_URL}/sales/`)

  if (!response.ok) {
    throw new Error('Impossible de récupérer les pièces et accessoires.')
  }

  return response.json()
}

function buildSaleFormData(saleData) {
  const formData = new FormData()
  formData.append('title', saleData.title)
  formData.append('description', saleData.description)
  formData.append('price', saleData.price)
  formData.append('is_sold', saleData.is_sold ? 'true' : 'false')

  if (saleData.photo) {
    formData.append('photo', saleData.photo)
  }

  return formData
}

export async function createSale(token, saleData) {
  const response = await fetch(`${API_BASE_URL}/sales/`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: buildSaleFormData(saleData),
  })

  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(data.detail ?? 'Impossible d’ajouter cette donnée.')
  }

  return data
}

export async function updateSale(token, saleId, saleData) {
  const response = await fetch(`${API_BASE_URL}/sales/${saleId}/`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: buildSaleFormData(saleData),
  })

  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(data.detail ?? 'Impossible de modifier cette donnée.')
  }

  return data
}

export async function deleteSale(token, saleId) {
  const response = await fetch(`${API_BASE_URL}/sales/${saleId}/`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  if (!response.ok) {
    throw new Error('Impossible de supprimer cette donnée.')
  }
}

export async function fetchGalleryImages() {
  const response = await fetch(`${API_BASE_URL}/gallery-images/`)

  if (!response.ok) {
    throw new Error('Impossible de récupérer la galerie.')
  }

  return response.json()
}

function getApiErrorMessage(data, fallback) {
  if (data.detail) {
    return data.detail
  }

  if (data.non_field_errors?.[0]) {
    return data.non_field_errors[0]
  }

  const fieldLabels = {
    title: 'Titre',
    photo: 'Photo',
  }
  const fieldError = Object.entries(data).find(([, value]) =>
    Array.isArray(value) ? value.length > 0 : Boolean(value),
  )

  if (fieldError) {
    const [fieldName, messages] = fieldError
    const message = Array.isArray(messages) ? messages[0] : messages
    return `${fieldLabels[fieldName] ?? fieldName} : ${message}`
  }

  return fallback
}

function buildGalleryImageFormData(imageData) {
  const formData = new FormData()
  formData.append('title', imageData.title)

  if (imageData.photo) {
    formData.append('photo', imageData.photo)
  }

  return formData
}

export async function createGalleryImage(token, imageData) {
  const response = await fetch(`${API_BASE_URL}/gallery-images/`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: buildGalleryImageFormData(imageData),
  })

  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(getApiErrorMessage(data, 'Impossible d’ajouter cette photo.'))
  }

  return data
}

export async function deleteGalleryImage(token, imageId) {
  const response = await fetch(`${API_BASE_URL}/gallery-images/${imageId}/`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  if (!response.ok) {
    throw new Error('Impossible de supprimer cette photo.')
  }
}

export async function sendContactMessage(contactData) {
  const response = await fetch(`${API_BASE_URL}/contact/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(contactData),
  })

  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(
      data.non_field_errors?.[0] ??
        data.detail ??
        'Impossible d’envoyer la demande pour le moment.',
    )
  }

  return data
}

export async function fetchAppointmentAvailability() {
  const response = await fetch(`${API_BASE_URL}/appointments/availability/`)

  if (!response.ok) {
    throw new Error('Impossible de récupérer les rendez-vous.')
  }

  return response.json()
}

export async function createAppointmentSlot(token, slotData) {
  const response = await fetch(`${API_BASE_URL}/appointment-slots/`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(slotData),
  })

  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(
      data.non_field_errors?.[0] ??
        data.detail ??
        'Impossible d’ouvrir ce créneau.',
    )
  }

  return data
}

export async function deleteAppointmentSlot(token, slotId) {
  const response = await fetch(`${API_BASE_URL}/appointment-slots/${slotId}/`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  if (!response.ok) {
    const data = await response.json().catch(() => ({}))
    throw new Error(data.detail ?? 'Impossible de fermer ce créneau.')
  }
}

export async function requestAppointment(appointmentData) {
  const response = await fetch(`${API_BASE_URL}/appointments/request/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(appointmentData),
  })

  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(
      data.non_field_errors?.[0] ??
        data.detail ??
        'Impossible d’envoyer la demande de rendez-vous.',
    )
  }

  return data
}

export async function fetchAdminAppointments(token) {
  const response = await fetch(`${API_BASE_URL}/appointments/`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  if (!response.ok) {
    throw new Error('Impossible de récupérer les rendez-vous.')
  }

  return response.json()
}

export async function validateAppointment(token, appointmentId, appointmentData = {}) {
  const response = await fetch(
    `${API_BASE_URL}/appointments/${appointmentId}/validate/`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(appointmentData),
    },
  )

  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(data.detail ?? 'Impossible d’accepter ce rendez-vous.')
  }

  return data
}

export async function cancelAppointment(token, appointmentId) {
  const response = await fetch(
    `${API_BASE_URL}/appointments/${appointmentId}/cancel/`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  )

  if (!response.ok) {
    const data = await response.json().catch(() => ({}))
    throw new Error(data.detail ?? 'Impossible de refuser ce rendez-vous.')
  }

  return null
}

export async function updateAppointment(token, appointmentId, appointmentData) {
  const response = await fetch(`${API_BASE_URL}/appointments/${appointmentId}/`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(appointmentData),
  })

  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(
      data.non_field_errors?.[0] ??
        data.detail ??
        'Impossible de modifier ce rendez-vous.',
    )
  }

  return data
}
