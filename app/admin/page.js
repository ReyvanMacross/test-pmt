import { redirect } from 'next/navigation'

// /admin → langsung redirect ke /admin/network (Kelola Website)
export default function AdminRootPage() {
  redirect('/admin/network')
}
