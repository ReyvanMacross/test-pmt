import { notFound } from 'next/navigation'
import PublicKecamatanHome from './PublicKecamatanHome'
import { getKecamatanPortal, getKecamatanWebsite } from '@/lib/public-kecamatan'

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }) {
  const { subdomain } = await params
  try {
    const website = await getKecamatanWebsite(subdomain)
    return website ? { title: `${website.name} — Portal Kecamatan`, description: `Portal resmi ${website.name}, Pemerintah Kota Bandung.` } : { title: 'Portal tidak ditemukan' }
  } catch {
    return { title: 'Portal Kecamatan — Pemerintah Kota Bandung' }
  }
}

export default async function KecamatanPortalPage({ params }) {
  const { subdomain } = await params
  const portal = await getKecamatanPortal(subdomain)
  if (!portal) notFound()
  return <PublicKecamatanHome portal={portal}/>
}
