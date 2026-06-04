import { supabase } from './supabase'

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

// ─── Auth ───────────────────────────────────────────────────

export async function loginAdmin(credentials) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: credentials.email ?? credentials.username,
    password: credentials.password,
  })

  if (error) {
    throw new Error(
      error.message === 'Invalid login credentials'
        ? 'Identifiants invalides.'
        : error.message ?? 'Connexion impossible. Verifiez les identifiants.',
    )
  }

  storeAuth(data)
  return data
}

export async function getCurrentAdmin() {
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) {
    throw new Error('Session expiree.')
  }
  return user
}

// ─── Sales ──────────────────────────────────────────────────

export async function fetchSales() {
  const { data, error } = await supabase
    .from('sales')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error('Impossible de recuperer les pieces et accessoires.')
  }

  return data
}

export async function createSale(saleData) {
  let photoUrl = null

  if (saleData.photo) {
    const fileName = `${crypto.randomUUID()}.jpg`
    const { error: uploadError } = await supabase.storage
      .from('sales')
      .upload(fileName, saleData.photo)

    if (uploadError) {
      throw new Error("Impossible d'ajouter cette photo.")
    }

    const { data: urlData } = supabase.storage
      .from('sales')
      .getPublicUrl(fileName)
    photoUrl = urlData.publicUrl
  }

  const { data, error } = await supabase
    .from('sales')
    .insert({
      title: saleData.title,
      description: saleData.description,
      price: saleData.price,
      is_sold: saleData.is_sold,
      photo_url: photoUrl,
    })
    .select()
    .single()

  if (error) {
    throw new Error(error.message ?? "Impossible d'ajouter cette donnee.")
  }

  return data
}

export async function updateSale(saleId, saleData) {
  const updateData = {
    title: saleData.title,
    description: saleData.description,
    price: saleData.price,
    is_sold: saleData.is_sold,
  }

  if (saleData.photo) {
    const fileName = `${crypto.randomUUID()}.jpg`
    const { error: uploadError } = await supabase.storage
      .from('sales')
      .upload(fileName, saleData.photo)

    if (uploadError) {
      throw new Error('Impossible de modifier cette donnee.')
    }

    const { data: urlData } = supabase.storage
      .from('sales')
      .getPublicUrl(fileName)
    updateData.photo_url = urlData.publicUrl
  }

  const { data, error } = await supabase
    .from('sales')
    .update(updateData)
    .eq('id', saleId)
    .select()
    .single()

  if (error) {
    throw new Error('Impossible de modifier cette donnee.')
  }

  return data
}

export async function deleteSale(saleId) {
  const { data: sale } = await supabase
    .from('sales')
    .select('photo_url')
    .eq('id', saleId)
    .single()

  if (sale?.photo_url) {
    const path = sale.photo_url.split('/storage/v1/object/public/')[1]
    if (path) {
      await supabase.storage.from('sales').remove([path])
    }
  }

  const { error } = await supabase
    .from('sales')
    .delete()
    .eq('id', saleId)

  if (error) {
    throw new Error('Impossible de supprimer cette donnee.')
  }
}

// ─── Gallery ────────────────────────────────────────────────

export async function fetchGalleryImages() {
  const { data, error } = await supabase
    .from('gallery_images')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error('Impossible de recuperer la galerie.')
  }

  return data
}

export async function createGalleryImage(imageData) {
  let photoUrl = null

  if (imageData.photo) {
    const fileName = `${crypto.randomUUID()}.jpg`
    const { error: uploadError } = await supabase.storage
      .from('gallery')
      .upload(fileName, imageData.photo)

    if (uploadError) {
      throw new Error("Impossible d'ajouter cette photo.")
    }

    const { data: urlData } = supabase.storage
      .from('gallery')
      .getPublicUrl(fileName)
    photoUrl = urlData.publicUrl
  }

  const { data, error } = await supabase
    .from('gallery_images')
    .insert({
      title: imageData.title,
      photo_url: photoUrl,
    })
    .select()
    .single()

  if (error) {
    if (error.message?.includes('blank')) {
      throw new Error('Le titre est obligatoire.')
    }
    throw new Error(error.message ?? "Impossible d'ajouter cette photo.")
  }

  return data
}

export async function deleteGalleryImage(imageId) {
  const { data: image } = await supabase
    .from('gallery_images')
    .select('photo_url')
    .eq('id', imageId)
    .single()

  if (image?.photo_url) {
    const path = image.photo_url.split('/storage/v1/object/public/')[1]
    if (path) {
      await supabase.storage.from('gallery').remove([path])
    }
  }

  const { error } = await supabase
    .from('gallery_images')
    .delete()
    .eq('id', imageId)

  if (error) {
    throw new Error('Impossible de supprimer cette photo.')
  }
}

// ─── Contact ────────────────────────────────────────────────

export async function sendContactMessage(contactData) {
  const { data, error } = await supabase.functions.invoke('contact', {
    body: contactData,
  })

  if (error) {
    throw new Error(
      error.message ?? "Impossible d'envoyer la demande pour le moment.",
    )
  }

  return data
}

// ─── Appointments ───────────────────────────────────────────

export async function fetchAppointmentAvailability() {
  const { data, error } = await supabase.functions.invoke('appointment-availability')

  if (error) {
    throw new Error('Impossible de recuperer les rendez-vous.')
  }

  return data
}

export async function createAppointmentSlot(slotData) {
  const { data, error } = await supabase
    .from('appointment_slots')
    .insert(slotData)
    .select()
    .single()

  if (error) {
    if (error.code === '23505') {
      throw new Error('Ce creneau est deja ouvert.')
    }
    throw new Error("Impossible d'ouvrir ce creneau.")
  }

  return data
}

export async function deleteAppointmentSlot(slotId) {
  const { error } = await supabase
    .from('appointment_slots')
    .delete()
    .eq('id', slotId)

  if (error) {
    throw new Error('Impossible de fermer ce creneau.')
  }
}

export async function requestAppointment(appointmentData) {
  const { data, error } = await supabase.functions.invoke('appointment-request', {
    body: appointmentData,
  })

  if (error) {
    throw new Error(
      error.message ?? "Impossible d'envoyer la demande de rendez-vous.",
    )
  }

  return data
}

export async function fetchAdminAppointments() {
  const { data, error } = await supabase
    .from('appointments')
    .select('*')
    .order('scheduled_at')

  if (error) {
    throw new Error('Impossible de recuperer les rendez-vous.')
  }

  return data
}

export async function validateAppointment(appointmentId, appointmentData = {}) {
  const { data, error } = await supabase.functions.invoke('appointment-validate', {
    body: { id: appointmentId, ...appointmentData },
  })

  if (error) {
    throw new Error(error.message ?? "Impossible d'accepter ce rendez-vous.")
  }

  return data
}

export async function cancelAppointment(appointmentId) {
  const { data, error } = await supabase.functions.invoke('appointment-cancel', {
    body: { id: appointmentId },
  })

  if (error) {
    throw new Error(error.message ?? 'Impossible de refuser ce rendez-vous.')
  }

  return data
}

export async function updateAppointment(appointmentId, appointmentData) {
  const { data, error } = await supabase.functions.invoke('appointment-update', {
    body: { id: appointmentId, ...appointmentData },
  })

  if (error) {
    throw new Error(
      error.message ?? 'Impossible de modifier ce rendez-vous.',
    )
  }

  return data
}
