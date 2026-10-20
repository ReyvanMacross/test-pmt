export const PUBLIC_DOCUMENT_CATEGORIES = [
  { id: 'semua', label: 'Semua Dokumen' },
  { id: 'dip', label: 'Daftar Informasi Publik' },
  { id: 'berkala', label: 'Wajib Berkala' },
  { id: 'setiap-saat', label: 'Tersedia Setiap Saat' },
  { id: 'serta-merta', label: 'Serta Merta' },
  { id: 'dikecualikan', label: 'Dikecualikan' },
  { id: 'ppid', label: 'PPID' },
]

export const PUBLIC_DOCUMENT_MODULES = [
  { slug: 'ppid', category: 'ppid', label: 'PPID Pelaksana' },
  { slug: 'daftar-informasi-publik', category: 'dip', label: 'Daftar Informasi Publik' },
  { slug: 'informasi-wajib-berkala', category: 'berkala', label: 'Wajib Berkala' },
  { slug: 'informasi-tersedia-setiap-saat', category: 'setiap-saat', label: 'Tersedia Setiap Saat' },
  { slug: 'informasi-serta-merta', category: 'serta-merta', label: 'Serta Merta' },
  { slug: 'daftar-informasi-dikecualikan', category: 'dikecualikan', label: 'Dikecualikan' },
  { slug: 'ppid-utama', category: 'ppid', label: 'PPID Utama' },
]

export const PUBLIC_DOCUMENT_MODULE_SLUGS = [
  ...PUBLIC_DOCUMENT_MODULES.map((module) => module.slug),
]

export function getPublicDocumentsForAdmin(content = {}) {
  const metadata = content.metadata && typeof content.metadata === 'object' && !Array.isArray(content.metadata)
    ? content.metadata
    : {}
  if (Array.isArray(metadata.public_documents)) return metadata.public_documents

  const attachments = [
    ...(Array.isArray(content.files) ? content.files : []),
    ...(Array.isArray(content.images) ? content.images : []),
  ].filter((item) => item && (item.url || item.path))

  return attachments.map((attachment, index) => {
    const dateValue = attachment.uploaded_at || content.updated_at
    const date = dateValue ? new Date(dateValue) : null
    const revisionMonth = date && !Number.isNaN(date.getTime())
      ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      : ''
    return {
      id: `legacy-${index}`,
      title: attachment.name || content.title || `Dokumen ${index + 1}`,
      description: content.body || '',
      revision_month: revisionMonth,
      attachment,
      legacy: true,
    }
  })
}
