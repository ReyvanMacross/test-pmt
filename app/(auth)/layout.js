export const metadata = {
  title: 'Portal Multi-Tenant Perangkat Daerah - Pemerintah Kota Bandung',
  description: 'Sistem integrasi akses terpusat pengelolaan aplikasi, tata kelola data, dan pelayanan publik bagi seluruh perangkat daerah Kota Bandung.',
}

export default function AuthLayout({ children }) {
  return (
    <div className="font-sans">
      {children}
    </div>
  )
}
