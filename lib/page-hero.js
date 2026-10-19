import 'server-only'
import { query } from '@/lib/db'

export async function getPageHeroImage(websiteId, moduleSlug) {
  const result = await query(
    'SELECT c.metadata FROM contents c JOIN menu_items m ON m.id = c.menu_item_id WHERE c.website_id = $1 AND m.slug = $2 LIMIT 1',
    [websiteId, moduleSlug]
  )
  return result.rows[0]?.metadata?.page_hero_image || null
}
