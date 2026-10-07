'use server'


import { canManageWebsite } from '@/lib/website-access'
import { isIP } from 'node:net'
import { resolve4, resolve6 } from 'node:dns/promises'
import { revalidatePath } from 'next/cache'
import { getSession } from '@/lib/auth'
import { getCurrentAdminAccess, hasAdminPermission } from '@/lib/admin-access'
import { query } from '@/lib/db'

function isPrivateAddress(address) {
  if (isIP(address) === 4) {
    const parts = address.split('.').map(Number)
    return parts[0] === 10 || parts[0] === 127 || parts[0] === 0 ||
      (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) ||
      (parts[0] === 192 && parts[1] === 168) ||
      (parts[0] === 169 && parts[1] === 254) || parts[0] >= 224
  }
  const normalized = address.toLowerCase()
  return normalized === '::1' || normalized === '::' || normalized.startsWith('fc') ||
    normalized.startsWith('fd') || normalized.startsWith('fe80:') || normalized.startsWith('::ffff:127.')
}

async function validatePublicUrl(value) {
  if (typeof value !== 'string' || value.length > 1000) {
    throw new Error('URL berita maksimal 1.000 karakter.')
  }
  let url
  try {
    url = new URL(value)
  } catch {
    throw new Error('URL berita tidak valid.')
  }
  if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password) {
    throw new Error('URL berita harus menggunakan HTTP atau HTTPS yang valid.')
  }
  if (url.port && !((url.protocol === 'https:' && url.port === '443') || (url.protocol === 'http:' && url.port === '80'))) {
    throw new Error('URL berita hanya dapat menggunakan port HTTP atau HTTPS standar.')
  }
  if (url.hostname === 'localhost' || url.hostname.endsWith('.localhost') || url.hostname.endsWith('.local')) {
    throw new Error('URL berita harus menggunakan domain publik.')
  }

  let addresses = []
  if (isIP(url.hostname)) addresses = [url.hostname]
  else {
    try {
      const records = await Promise.allSettled([resolve4(url.hostname), resolve6(url.hostname)])
      addresses = records.filter((record) => record.status === 'fulfilled').flatMap((record) => record.value)
    } catch {
      throw new Error('Domain berita tidak dapat ditemukan.')
    }
  }
  if (!addresses.length || addresses.some(isPrivateAddress)) {
    throw new Error('URL berita harus mengarah ke server publik.')
  }
  return url
}

function decodeHtml(value = '') {
  return value
    .replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .trim()
}

function extractMeta(html, keys) {
  for (const key of keys) {
    const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const patterns = [
      new RegExp(`<meta[^>]+(?:property|name)=["']${escaped}["'][^>]+content=["']([^"']*)["'][^>]*>`, 'i'),
      new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]+(?:property|name)=["']${escaped}["'][^>]*>`, 'i'),
    ]
    for (const pattern of patterns) {
      const match = html.match(pattern)
      if (match?.[1]) return decodeHtml(match[1])
    }
  }
  return ''
}

async function fetchNewsMetadata(rawUrl) {
  let url = await validatePublicUrl(rawUrl)
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const response = await fetch(url, {
      redirect: 'manual',
      signal: AbortSignal.timeout(6000),
      headers: { 'User-Agent': 'DiskominfoPortalNewsPreview/1.0', Accept: 'text/html' },
    })
    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get('location')
      if (!location || attempt === 3) throw new Error('Tautan berita terlalu banyak mengalihkan halaman.')
      url = await validatePublicUrl(new URL(location, url).toString())
      continue
    }
    if (!response.ok) throw new Error('Halaman berita tidak dapat dibaca otomatis.')
    const type = response.headers.get('content-type') || ''
    if (!type.includes('text/html')) throw new Error('URL tersebut bukan halaman berita HTML.')
    const html = (await response.text()).slice(0, 1_000_000)
    const title = extractMeta(html, ['og:title', 'twitter:title']) || decodeHtml(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] || '')
    const image = extractMeta(html, ['og:image', 'twitter:image'])
    const excerpt = extractMeta(html, ['og:description', 'description', 'twitter:description'])
    const author = extractMeta(html, ['author', 'article:author'])
    let imageUrl = ''
    if (image) {
      const candidate = new URL(image, url)
      if (['http:', 'https:'].includes(candidate.protocol)) {
        await validatePublicUrl(candidate.toString())
        imageUrl = candidate.toString().slice(0, 1000)
      }
    }
    return {
      title: title.slice(0, 500),
      image: imageUrl,
      excerpt: excerpt.slice(0, 5000),
      author: author.slice(0, 255),
      sourceDomain: url.hostname,
    }
  }
  throw new Error('Metadata berita tidak dapat diambil.')
}

async function authorizeWebsite(websiteId) {
  const session = await getSession()
  const access = await getCurrentAdminAccess()
  if (!session || !access) throw new Error('Sesi Anda berakhir. Silakan masuk kembali.')

  const website = await query(
    'SELECT id, user_id, name, subdomain FROM websites WHERE id = $1 AND deleted_at IS NULL LIMIT 1',
    [websiteId]
  )
  const row = website.rows[0]
  const canManageAll = hasAdminPermission(access, 'manage-all-websites')
  const canManageAssigned = hasAdminPermission(access, 'manage-assigned-website')
  if (!row || !(await canManageWebsite(session, websiteId, row.user_id))) {
    throw new Error('Anda tidak memiliki izin mengelola berita website ini.')
  }
  return { session, website: row }
}

function revalidateNewsPaths(websiteId) {
  revalidatePath(`/admin/network/${websiteId}/content`)
  revalidatePath(`/admin/network/${websiteId}/content/berita`)
  revalidatePath(`/admin/network/${websiteId}/content/berita/[newsId]/edit`, 'page')
  revalidatePath('/admin/dashboard')
}

export async function createNewsLinkAction(websiteId, formData) {
  try {
    const { session, website } = await authorizeWebsite(websiteId)
    const url = formData.get('url')?.trim()
    if (!url) return { error: 'URL berita wajib diisi.' }

    let metadata
    let metadataWarning = false
    try {
      metadata = await fetchNewsMetadata(url)
    } catch {
      const parsedUrl = await validatePublicUrl(url)
      metadata = { title: url.slice(0, 500), author: '', image: '', excerpt: '', sourceDomain: parsedUrl.hostname }
      metadataWarning = true
    }

    const result = await query(
      `INSERT INTO news_items (website_id, url, title, author, image, excerpt, source_domain, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
       RETURNING id, website_id, url, title, author, image, excerpt, source_domain, created_at, updated_at`,
      [website.id, url, metadata.title || url, metadata.author, metadata.image, metadata.excerpt, metadata.sourceDomain]
    )
    await query(
      'INSERT INTO activity_logs (user_id, website_id, action, description) VALUES ($1, $2, $3, $4)',
      [session.id, website.id, 'create_news_link', `${website.name}: menambahkan link berita "${result.rows[0].title}".`]
    )
    revalidateNewsPaths(website.id)
    return {
      success: true,
      newsItem: result.rows[0],
      message: metadataWarning
        ? 'Link berita tersimpan. Metadata otomatis belum tersedia; Anda bisa melengkapinya melalui tombol Edit.'
        : 'Link berita berhasil ditambahkan.',
    }
  } catch (error) {
    console.error('Create news link error:', error)
    return { error: error.message || 'Gagal menambahkan link berita.' }
  }
}

export async function updateNewsLinkAction(websiteId, newsId, formData) {
  try {
    const { session, website } = await authorizeWebsite(websiteId)
    const url = formData.get('url')?.trim()
    const title = formData.get('title')?.trim()
    const author = formData.get('author')?.trim() || null
    const image = formData.get('image')?.trim() || null
    const excerpt = formData.get('excerpt')?.trim() || null
    const autoFetch = formData.get('auto_fetch') === 'true'
    if (!url || !title) return { error: 'URL dan judul berita wajib diisi.' }

    const parsedUrl = await validatePublicUrl(url)
    if (image) await validatePublicUrl(image)
    let values = { title, author, image, excerpt, sourceDomain: parsedUrl.hostname }
    if (autoFetch) {
      try {
        const metadata = await fetchNewsMetadata(url)
        values = {
          title: metadata.title || title,
          author: metadata.author || author,
          image: metadata.image || image,
          excerpt: metadata.excerpt || excerpt,
          sourceDomain: metadata.sourceDomain,
        }
      } catch (error) {
        return { error: error.message || 'Metadata berita gagal diperbarui otomatis.' }
      }
    }

    const updated = await query(
      `UPDATE news_items SET url = $1, title = $2, author = $3, image = $4, excerpt = $5, source_domain = $6, updated_at = NOW()
       WHERE id = $7 AND website_id = $8 RETURNING id, title`,
      [url, values.title, values.author, values.image, values.excerpt, values.sourceDomain, newsId, website.id]
    )
    if (!updated.rows[0]) return { error: 'Link berita tidak ditemukan pada website ini.' }
    await query(
      'INSERT INTO activity_logs (user_id, website_id, action, description) VALUES ($1, $2, $3, $4)',
      [session.id, website.id, 'update_news_link', `${website.name}: memperbarui link berita "${updated.rows[0].title}".`]
    )
    revalidateNewsPaths(website.id)
    return { success: true, message: 'Perubahan link berita berhasil disimpan.' }
  } catch (error) {
    console.error('Update news link error:', error)
    return { error: error.message || 'Gagal memperbarui link berita.' }
  }
}

export async function deleteNewsLinkAction(websiteId, newsId) {
  try {
    const { session, website } = await authorizeWebsite(websiteId)
    const removed = await query(
      'DELETE FROM news_items WHERE id = $1 AND website_id = $2 RETURNING title',
      [newsId, website.id]
    )
    if (!removed.rows[0]) return { error: 'Link berita tidak ditemukan pada website ini.' }
    await query(
      'INSERT INTO activity_logs (user_id, website_id, action, description) VALUES ($1, $2, $3, $4)',
      [session.id, website.id, 'delete_news_link', `${website.name}: menghapus link berita "${removed.rows[0].title}".`]
    )
    revalidateNewsPaths(website.id)
    return { success: true, message: 'Link berita berhasil dihapus.' }
  } catch (error) {
    console.error('Delete news link error:', error)
    return { error: error.message || 'Gagal menghapus link berita.' }
  }
}
