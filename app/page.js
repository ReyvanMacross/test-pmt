import { redirect } from 'next/navigation'

// Root "/" → redirect ke /login (sesuai Laravel: Route::get('/', fn() => redirect()->route('login')))
export default function RootPage() {
  redirect('/login')
}
