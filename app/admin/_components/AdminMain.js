'use client'

import { useEffect, useLayoutEffect, useState } from 'react'
import { usePathname } from 'next/navigation'

export default function AdminMain({ children }) {
  const pathname = usePathname()
  const [isLoading, setIsLoading] = useState(false)

  useLayoutEffect(() => {
    // Use the document as the single scroll container across admin route changes.
    document.documentElement.scrollTop = 0
    document.body.scrollTop = 0
    window.scrollTo(0, 0)
    document.querySelector('aside nav')?.scrollTo(0, 0)
  }, [pathname])

  useEffect(() => {
    setIsLoading(false)
  }, [pathname])

  useEffect(() => {
    let submitTimer
    let safetyTimer
    let submitObserver
    const stopLoading = () => {
      window.clearTimeout(submitTimer)
      window.clearTimeout(safetyTimer)
      submitObserver?.disconnect()
      setIsLoading(false)
    }

    const onClick = (event) => {
      const link = event.target.closest?.('a[href]')
      if (!link || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
      if (link.target === '_blank' || link.hasAttribute('download')) return
      const target = new URL(link.href, window.location.href)
      if (target.origin === window.location.origin && target.pathname !== window.location.pathname) setIsLoading(true)
    }

    const onSubmit = (event) => {
      setIsLoading(true)
      const submitter = event.submitter
      let observedBusy = Boolean(submitter?.disabled)
      if (submitter) {
        submitObserver = new MutationObserver(() => {
          if (submitter.disabled) observedBusy = true
          else if (observedBusy) stopLoading()
        })
        submitObserver.observe(submitter, { attributes: true, attributeFilter: ['disabled'] })
      }
      submitTimer = window.setTimeout(() => {
        if (!observedBusy) stopLoading()
      }, 1800)
      // A safety timeout keeps the navigation chrome usable if a request never settles.
      safetyTimer = window.setTimeout(stopLoading, 30000)
    }

    document.addEventListener('click', onClick, true)
    document.addEventListener('submit', onSubmit, true)
    return () => {
      document.removeEventListener('click', onClick, true)
      document.removeEventListener('submit', onSubmit, true)
      stopLoading()
    }
  }, [])

  return <>
    {isLoading && <div aria-hidden="true" className="fixed inset-x-0 top-0 z-[100] h-1 overflow-hidden bg-blue-100"><div className="h-full w-1/3 animate-pulse rounded-full bg-blue-600"/></div>}
    <main aria-busy={isLoading} className="min-w-0 p-4 sm:p-6 lg:p-8">
      {children}
    </main>
  </>
}
