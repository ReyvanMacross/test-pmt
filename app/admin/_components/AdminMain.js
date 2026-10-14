'use client'

import { useLayoutEffect } from 'react'
import { usePathname } from 'next/navigation'

export default function AdminMain({ children }) {
  const pathname = usePathname()
  useLayoutEffect(() => {
    // Use the document as the single scroll container across admin route changes.
    document.documentElement.scrollTop = 0
    document.body.scrollTop = 0
    window.scrollTo(0, 0)
    document.querySelector('aside nav')?.scrollTo(0, 0)
  }, [pathname])

  return <main className="min-w-0 p-4 sm:p-6 lg:p-8">
    {children}
  </main>
}
