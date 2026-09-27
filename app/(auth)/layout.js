import { Plus_Jakarta_Sans } from 'next/font/google'

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
})

export const metadata = {
  title: 'Portal Multi-Tenant Perangkat Daerah - Pemerintah Kota Bandung',
  description: 'Sistem integrasi akses terpusat pengelolaan aplikasi, tata kelola data, dan pelayanan publik bagi seluruh perangkat daerah Kota Bandung.',
}

export default function AuthLayout({ children }) {
  return (
    <div className={jakarta.className}>
      {children}
    </div>
  )
}
