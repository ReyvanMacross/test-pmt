import 'server-only'
import { CONTENT_MODULES } from '@/lib/content-modules'
import { query } from '@/lib/db'

async function rowsOrEmpty(label, sql, params) {
  try {
    const result = await query(sql, params)
    return result.rows
  } catch (error) {
    console.error(`Public portal ${label} query failed:`, error.message)
    return []
  }
}

function normalizeContents(rows) {
  return Object.fromEntries(rows.map((row) => [row.slug, row]))
}

export async function getKecamatanWebsite(subdomain) {
  const result = await query(
    `SELECT w.*, t.name AS template_name, t.slug AS template_slug
     FROM websites w JOIN templates t ON t.id = w.template_id
     WHERE lower(w.subdomain) = lower($1) AND w.deleted_at IS NULL AND w.status = 'active'
     LIMIT 1`,
    [subdomain]
  )
  const website = result.rows[0]
  if (!website || website.template_slug !== 'kecamatan') return null
  return website
}

export async function getKecamatanPortal(subdomain) {
  const website = await getKecamatanWebsite(subdomain)
  if (!website) return null

  const [contentRows, profileRows, news, announcements, agendas, services, innovations, albums, heroSlides] = await Promise.all([
    rowsOrEmpty('contents', `SELECT m.slug, m.name AS module_name, c.title, c.body, c.images, c.files, c.updated_at
      FROM contents c JOIN menu_items m ON m.id = c.menu_item_id WHERE c.website_id = $1`, [website.id]),
    rowsOrEmpty('wilayah profile', 'SELECT * FROM wilayah_profiles WHERE website_id = $1 LIMIT 1', [website.id]),
    rowsOrEmpty('news', `SELECT id, url, title, author, image, excerpt, source_domain, created_at
      FROM news_items WHERE website_id = $1 ORDER BY created_at DESC`, [website.id]),
    rowsOrEmpty('announcements', `SELECT id, title, body, publish_date, expires_at, attachment_path, attachment_name, attachment_type, created_at
      FROM announcements WHERE website_id = $1 AND publish_date <= CURRENT_DATE
        AND (expires_at IS NULL OR expires_at >= CURRENT_DATE)
      ORDER BY publish_date DESC, created_at DESC`, [website.id]),
    rowsOrEmpty('agendas', `SELECT id, title, description, start_date, end_date, time_range, location, organizer
      FROM agendas WHERE website_id = $1 ORDER BY start_date ASC`, [website.id]),
    rowsOrEmpty('services', `SELECT id, name, category, description, requirements, procedure,
      completion_time, fee, application_url FROM services WHERE website_id = $1 ORDER BY category, name`, [website.id]),
    rowsOrEmpty('innovations', `SELECT id, title, description, launch_year, application_url, video_url, cover_path, cover_name
      FROM innovations WHERE website_id = $1 ORDER BY created_at DESC`, [website.id]),
    rowsOrEmpty('gallery albums', `SELECT ga.id, ga.type, ga.title, ga.album_date, ga.created_at,
      COUNT(gi.id)::int AS item_count, (array_agg(gi.path ORDER BY gi.created_at DESC) FILTER (WHERE gi.id IS NOT NULL))[1] AS cover_path
      FROM gallery_albums ga LEFT JOIN gallery_items gi ON gi.gallery_album_id = ga.id
      WHERE ga.website_id = $1 GROUP BY ga.id ORDER BY ga.album_date DESC, ga.created_at DESC`, [website.id]),
    rowsOrEmpty('hero slides', `SELECT position, badge_text, badge_color, headline, description, image_path
      FROM hero_slides WHERE website_id = $1 AND is_active = true
        AND headline IS NOT NULL AND btrim(headline) <> ''
      ORDER BY position ASC`, [website.id]),
  ])

  const contents = normalizeContents(contentRows)
  const profile = profileRows[0] || null
  const galleryItems = await rowsOrEmpty('gallery items', `SELECT gi.id, gi.gallery_album_id, gi.type, gi.path, gi.name, gi.description, gi.created_at
    FROM gallery_items gi JOIN gallery_albums ga ON ga.id = gi.gallery_album_id
    WHERE ga.website_id = $1 ORDER BY gi.created_at DESC`, [website.id])
  const itemsByAlbum = Object.groupBy
    ? Object.groupBy(galleryItems, (item) => String(item.gallery_album_id))
    : galleryItems.reduce((grouped, item) => {
        const key = String(item.gallery_album_id)
        grouped[key] ||= []
        grouped[key].push(item)
        return grouped
      }, {})

  return {
    website,
    profile,
    contents,
    news,
    announcements,
    agendas,
    services,
    innovations,
    albums: albums.map((album) => ({ ...album, items: itemsByAlbum[String(album.id)] || [] })),
    heroSlides,
    modules: CONTENT_MODULES.filter((module) => module.slug !== 'hero-slider'),
  }
}

export function contentIsFilled(content) {
  if (!content) return false
  const images = Array.isArray(content.images) && content.images.length > 0
  const files = Array.isArray(content.files) && content.files.length > 0
  return Boolean(content.title?.trim() || content.body?.trim() || images || files)
}

export function plainContent(value = '') {
  return String(value)
    .replace(/<\s*br\s*\/?>/gi, '\n')
    .replace(/<\s*\/(p|div|li|h[1-6])\s*>/gi, '\n')
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}
