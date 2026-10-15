'use client'

import { useState } from 'react'
import { CalendarDays, ChevronLeft, ChevronRight, Clock3, MapPin, UsersRound } from 'lucide-react'

const weekdayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']
const monthFormatter = new Intl.DateTimeFormat('id-ID', { month: 'long', year: 'numeric', timeZone: 'UTC' })
const fullDateFormatter = new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })

function dateKey(value) {
  if (!value) return ''
  if (value instanceof Date) return value.toISOString().slice(0, 10)
  return String(value).slice(0, 10)
}

function parseDateKey(value) {
  const [year, month, day] = value.split('-').map(Number)
  return new Date(Date.UTC(year, month - 1, day))
}

function formatDate(value) {
  const key = dateKey(value)
  return key ? fullDateFormatter.format(parseDateKey(key)) : 'Tanggal belum ditentukan'
}

function formatMonth(year, month) {
  return monthFormatter.format(new Date(Date.UTC(year, month, 1)))
}

export default function AgendaCalendar({ agendas = [] }) {
  const today = new Date()
  const [visibleMonth, setVisibleMonth] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1))
  const [selectedDate, setSelectedDate] = useState('')
  const year = visibleMonth.getFullYear()
  const month = visibleMonth.getMonth()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const leadingDays = new Date(year, month, 1).getDay()

  const agendaEvents = agendas.map((agenda) => ({
    ...agenda,
    startKey: dateKey(agenda.start_date),
    endKey: dateKey(agenda.end_date || agenda.start_date),
  })).filter((agenda) => agenda.startKey)

  const eventsByDate = new Map()
  for (let day = 1; day <= daysInMonth; day += 1) {
    const key = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    const events = agendaEvents.filter((agenda) => agenda.startKey <= key && agenda.endKey >= key)
    if (events.length) eventsByDate.set(key, events)
  }

  const selectedEvents = selectedDate ? eventsByDate.get(selectedDate) || [] : []
  const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

  function changeMonth(offset) {
    setVisibleMonth((current) => new Date(current.getFullYear(), current.getMonth() + offset, 1))
    setSelectedDate('')
  }

  return <>
    <main className="mx-auto w-full max-w-[1320px] space-y-8 px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
      <section aria-label="Kalender agenda kegiatan" className="rounded-3xl border border-slate-200/80 bg-white p-4 shadow-sm sm:p-6 lg:p-8">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-teal-50 text-teal-600"><CalendarDays className="h-5 w-5"/></span>
            <div><h2 className="text-lg font-extrabold capitalize text-slate-900 sm:text-xl">{formatMonth(year, month)}</h2><p className="mt-0.5 text-xs text-slate-500 sm:text-sm">Klik tanggal yang memiliki penanda untuk melihat rincian agenda</p></div>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => changeMonth(-1)} aria-label="Bulan sebelumnya" className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:border-teal-300 hover:bg-teal-50 hover:text-teal-700"><ChevronLeft className="h-4 w-4"/></button>
            <span className="min-w-28 rounded-lg bg-slate-100 px-3 py-2 text-center text-xs font-bold capitalize text-slate-700">{formatMonth(year, month)}</span>
            <button type="button" onClick={() => changeMonth(1)} aria-label="Bulan berikutnya" className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:border-teal-300 hover:bg-teal-50 hover:text-teal-700"><ChevronRight className="h-4 w-4"/></button>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-7 gap-1.5 sm:gap-2 md:gap-2.5">
          {weekdayNames.map((weekday, index) => <div key={weekday} className={`flex min-h-8 items-center justify-center text-[9px] font-extrabold uppercase tracking-wide sm:min-h-10 sm:text-xs ${index === 0 ? 'text-rose-500' : index === 6 ? 'text-indigo-500' : 'text-slate-500'}`}><span className="sm:hidden">{weekday.slice(0, 2)}</span><span className="hidden sm:inline">{weekday}</span></div>)}
          {Array.from({ length: leadingDays }, (_, index) => <div key={`blank-${index}`} aria-hidden="true" className="min-h-[76px] rounded-xl bg-slate-50/50 sm:min-h-[92px] md:min-h-[108px]"/>)}
          {Array.from({ length: daysInMonth }, (_, index) => {
            const day = index + 1
            const key = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
            const events = eventsByDate.get(key) || []
            const selected = selectedDate === key
            const weekday = (leadingDays + index) % 7
            return <button key={key} type="button" onClick={() => setSelectedDate(key)} aria-pressed={selected} aria-label={`${day} ${formatMonth(year, month)}${events.length ? `, ${events.length} agenda` : ''}`} className={`group min-h-[76px] overflow-hidden rounded-xl border p-1.5 text-left transition sm:min-h-[92px] sm:rounded-2xl sm:p-2.5 md:min-h-[108px] md:p-3 ${selected ? 'border-teal-500 bg-teal-50/70 ring-1 ring-teal-500' : events.length ? 'border-teal-300 bg-teal-50/30 hover:border-teal-500 hover:bg-teal-50' : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'} ${key === todayKey ? 'shadow-[inset_0_0_0_1px_rgba(13,148,136,.15)]' : ''}`}>
              <span className={`text-[10px] font-bold sm:text-sm ${weekday === 0 ? 'text-rose-500' : weekday === 6 ? 'text-indigo-500' : 'text-slate-600'} ${selected ? '!text-teal-700' : ''}`}>{day}</span>
              {events.slice(0, 2).map((event, eventIndex) => <span key={`${event.id}-${eventIndex}`} className={`mt-1 block h-1.5 w-1.5 rounded-full p-0 text-[0px] sm:mt-2 sm:h-auto sm:w-auto sm:truncate sm:rounded-md sm:px-1.5 sm:py-1.5 sm:text-[9px] sm:leading-tight sm:text-white ${eventIndex % 2 === 0 ? 'bg-teal-600' : 'bg-indigo-600'}`}>{event.title}</span>)}
              {events.length > 2 && <span className="mt-1 hidden text-[10px] font-bold text-teal-700 sm:block">+{events.length - 2} agenda</span>}
            </button>
          })}
        </div>
      </section>

      <section aria-live="polite" className="space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-200 pb-3"><span className="h-6 w-2 rounded-full bg-teal-600"/><h2 className="text-lg font-extrabold tracking-tight text-slate-900 sm:text-xl">Rincian &amp; Deskripsi Agenda Kegiatan</h2></div>
        {!selectedDate ? <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-8 text-center text-sm text-slate-500">Pilih tanggal pada kalender untuk melihat rincian kegiatan.</div> : selectedEvents.length ? <div className="space-y-4">{selectedEvents.map((agenda) => <article key={agenda.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:rounded-3xl sm:p-7 lg:p-8">
          <h3 className="border-b border-slate-100 pb-4 text-xl font-extrabold leading-snug text-slate-900 sm:text-2xl">{agenda.title}</h3>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4"><p className="text-[10px] font-extrabold uppercase tracking-wide text-slate-400">Tanggal Pelaksanaan</p><p className="mt-1.5 flex items-start gap-2 text-sm font-bold text-slate-700"><CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-teal-600"/><span>{formatDate(agenda.startKey)}{agenda.endKey !== agenda.startKey ? ` s.d. ${formatDate(agenda.endKey)}` : ''}</span></p></div>
            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4"><p className="text-[10px] font-extrabold uppercase tracking-wide text-slate-400">Jam / Waktu</p><p className="mt-1.5 flex items-start gap-2 text-sm font-bold text-slate-700"><Clock3 className="mt-0.5 h-4 w-4 shrink-0 text-teal-600"/><span>{agenda.time_range || 'Waktu belum ditentukan'}</span></p></div>
            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 sm:col-span-2 lg:col-span-1"><p className="text-[10px] font-extrabold uppercase tracking-wide text-slate-400">Lokasi / Tempat</p><p className="mt-1.5 flex items-start gap-2 text-sm font-bold text-slate-700"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-teal-600"/><span>{agenda.location || 'Lokasi belum ditentukan'}</span></p></div>
          </div>
          {agenda.organizer && <p className="mt-4 flex items-center gap-2 text-sm text-slate-600"><UsersRound className="h-4 w-4 text-teal-600"/><span><strong>Penyelenggara:</strong> {agenda.organizer}</span></p>}
          <div className="mt-6"><h4 className="mb-2 text-[10px] font-extrabold uppercase tracking-wide text-slate-400">Deskripsi &amp; Rincian Kegiatan</h4><div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 text-sm leading-7 text-slate-600 sm:p-5"><p className="whitespace-pre-line">{agenda.description}</p></div></div>
        </article>)}</div> : <div className="rounded-2xl border border-slate-200 bg-white px-5 py-8 text-center"><p className="font-bold text-slate-700">Tidak ada agenda pada {formatDate(selectedDate)}.</p><p className="mt-1 text-sm text-slate-500">Pilih tanggal lain yang memiliki penanda agenda.</p></div>}
      </section>
    </main>
  </>
}
