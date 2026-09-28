'use client'

import { useState, useEffect, useRef, useMemo } from 'react'

export default function SearchableCombobox({
  options = [],
  value = '',
  onChange,
  label = 'Pilih Instansi / OPD',
  placeholder = 'Ketik untuk mencari instansi / OPD...',
  required = false,
  error = null,
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState(value || '')
  const [highlightedIndex, setHighlightedIndex] = useState(0)
  const containerRef = useRef(null)
  const inputRef = useRef(null)

  // Sync internal search term when prop value changes
  useEffect(() => {
    setSearchTerm(value || '')
  }, [value])

  // Filter options based on user typing
  const filteredOptions = useMemo(() => {
    const q = (searchTerm || '').toLowerCase().trim()
    if (!q) return options
    return options.filter(
      (opt) =>
        opt.title.toLowerCase().includes(q) ||
        (opt.category && opt.category.toLowerCase().includes(q))
    )
  }, [options, searchTerm])

  // Reset highlight index when filtered options change
  useEffect(() => {
    setHighlightedIndex(0)
  }, [filteredOptions])

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false)
        // Auto-correct or revert if input doesn't match an option
        if (value) {
          setSearchTerm(value)
        }
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [value])

  function handleSelect(option) {
    if (!option) return
    onChange(option.value)
    setSearchTerm(option.title)
    setIsOpen(false)
  }

  function handleKeyDown(e) {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      if (!isOpen) {
        setIsOpen(true)
      } else {
        setHighlightedIndex((prev) =>
          prev < filteredOptions.length - 1 ? prev + 1 : 0
        )
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      if (!isOpen) {
        setIsOpen(true)
      } else {
        setHighlightedIndex((prev) =>
          prev > 0 ? prev - 1 : filteredOptions.length - 1
        )
      }
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (isOpen && filteredOptions.length > 0) {
        handleSelect(filteredOptions[highlightedIndex] || filteredOptions[0])
      } else if (!isOpen) {
        setIsOpen(true)
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false)
      if (value) setSearchTerm(value)
    }
  }

  return (
    <div className="relative" ref={containerRef}>
      {label && (
        <label className="text-xs font-semibold text-slate-700 block mb-1.5">
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
      )}

      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>

        <input
          ref={inputRef}
          type="text"
          autoComplete="off"
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value)
            setIsOpen(true)
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={`w-full pl-10 pr-10 py-2.5 text-xs bg-slate-50 border rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 transition placeholder-slate-400 ${
            error ? 'border-rose-300 focus:ring-rose-500' : 'border-slate-200'
          }`}
        />

        <button
          type="button"
          onClick={() => {
            setIsOpen(!isOpen)
            if (!isOpen) inputRef.current?.focus()
          }}
          className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
        >
          <svg
            className={`w-4 h-4 transition-transform duration-200 ${
              isOpen ? 'rotate-180' : ''
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {error && <p className="text-[11px] text-rose-500 mt-1">{error}</p>}

      {/* Dropdown Options */}
      {isOpen && (
        <div className="absolute left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-xl shadow-xl max-h-52 overflow-y-auto divide-y divide-slate-100 z-50">
          {filteredOptions.length === 0 ? (
            <div className="px-4 py-3 text-center text-xs text-slate-400">
              Instansi tidak ditemukan.
            </div>
          ) : (
            filteredOptions.map((opt, idx) => {
              const isSelected = opt.value === value
              const isHighlighted = idx === highlightedIndex

              return (
                <div
                  key={opt.value}
                  onClick={() => handleSelect(opt)}
                  onMouseEnter={() => setHighlightedIndex(idx)}
                  className={`px-3.5 py-2.5 cursor-pointer transition flex items-center justify-between text-xs ${
                    isSelected
                      ? 'bg-blue-50/70 text-blue-900'
                      : isHighlighted
                      ? 'bg-slate-50 text-slate-900'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <svg
                      className={`w-4 h-4 flex-shrink-0 ${
                        isSelected ? 'text-blue-600' : 'text-slate-400'
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                      />
                    </svg>
                    <div className="truncate">
                      <span
                        className={`block truncate ${
                          isSelected ? 'font-bold text-blue-700' : 'font-medium text-slate-800'
                        }`}
                      >
                        {opt.title}
                      </span>
                      {opt.category && (
                        <span className="text-[10px] text-slate-400 block">{opt.category}</span>
                      )}
                    </div>
                  </div>

                  {isSelected && (
                    <svg
                      className="w-4 h-4 text-blue-600 flex-shrink-0 ml-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  )}
                </div>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}
