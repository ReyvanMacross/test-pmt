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
  { slug: 'daftar-informasi-publik', category: 'dip', label: 'Daftar Informasi Publik' },
  { slug: 'informasi-wajib-berkala', category: 'berkala', label: 'Wajib Berkala' },
  { slug: 'informasi-tersedia-setiap-saat', category: 'setiap-saat', label: 'Tersedia Setiap Saat' },
  { slug: 'informasi-serta-merta', category: 'serta-merta', label: 'Serta Merta' },
  { slug: 'daftar-informasi-dikecualikan', category: 'dikecualikan', label: 'Dikecualikan' },
  { slug: 'ppid-utama', category: 'ppid', label: 'PPID Utama' },
  { slug: 'permohonan-informasi-online', category: 'ppid', label: 'Permohonan Informasi' },
  { slug: 'pengajuan-keberatan-online', category: 'ppid', label: 'Pengajuan Keberatan' },
]

export const PUBLIC_DOCUMENT_MODULE_SLUGS = [
  'ppid',
  ...PUBLIC_DOCUMENT_MODULES.map((module) => module.slug),
]
