import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import ChangePasswordForm from './ChangePasswordForm'

export const metadata = {
  title: 'Ganti Password',
}

export default async function ChangePasswordPage() {
  const session = await getSession()
  if (!session) redirect('/login')

  return <ChangePasswordForm />
}
