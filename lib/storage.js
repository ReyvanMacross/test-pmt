import 'server-only'
import { createClient } from '@supabase/supabase-js'

const DEFAULT_BUCKET = 'portal-assets'

function getStorageClient() {
  const configuredUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!configuredUrl || !serviceKey) {
    throw new Error('Konfigurasi Supabase Storage belum lengkap. Periksa URL project dan SUPABASE_SERVICE_ROLE_KEY di environment server.')
  }

  const projectUrl = new URL(configuredUrl)
  projectUrl.pathname = projectUrl.pathname.replace(/\/rest\/v1\/?$/, '') || '/'

  return createClient(projectUrl.toString().replace(/\/$/, ''), serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
  })
}

export function getPortalStorageBucket() {
  return process.env.SUPABASE_STORAGE_BUCKET?.trim() || DEFAULT_BUCKET
}

export async function uploadPortalFile({ file, objectPath }) {
  const bucket = getPortalStorageBucket()
  const client = getStorageClient()
  const buffer = Buffer.from(await file.arrayBuffer())
  const { data, error } = await client.storage.from(bucket).upload(objectPath, buffer, {
    contentType: file.type || 'application/octet-stream',
    cacheControl: '3600',
    upsert: false,
  })

  if (error) throw new Error(`Gagal mengunggah file ke Supabase Storage: ${error.message}`)

  const { data: publicData } = client.storage.from(bucket).getPublicUrl(data.path)
  return { path: data.path, publicUrl: publicData.publicUrl, bucket }
}

export async function removePortalFile(reference) {
  if (typeof reference !== 'string' || !reference) return false

  const bucket = getPortalStorageBucket()
  let objectPath = null

  try {
    const url = new URL(reference)
    const marker = `/storage/v1/object/public/${bucket}/`
    const markerIndex = url.pathname.indexOf(marker)
    if (markerIndex >= 0) objectPath = decodeURIComponent(url.pathname.slice(markerIndex + marker.length))
  } catch {
    if (reference.startsWith(`${bucket}/`)) objectPath = reference.slice(bucket.length + 1)
  }

  if (!objectPath) return false

  const { error } = await getStorageClient().storage.from(bucket).remove([objectPath])
  if (error) throw new Error(`Gagal menghapus file dari Supabase Storage: ${error.message}`)
  return true
}
