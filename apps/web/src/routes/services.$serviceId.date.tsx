import { useEffect, useState } from 'react'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { z } from 'zod'
import Stepper from '../components/Stepper'
import CalendarPicker from '../components/CalendarPicker'
import { apiFetch } from '../lib/api'
import { formatEnumLabel } from '../lib/format'
import Spinner from '../components/Spinner'
import { useAuthToken } from '../lib/auth'

const searchSchema = z.object({
  name: z.string().optional(),
  type: z.string().optional(),
  duration: z.coerce.number().optional(),
  provider: z.string().optional(),
  rescheduleId: z.string().optional()
})

export const Route = createFileRoute('/services/$serviceId/date')({
  component: ServiceDatePage,
  validateSearch: searchSchema
})

function ServiceDatePage() {
  const { serviceId } = Route.useParams()
  const search = Route.useSearch()
  const [selectedDate, setSelectedDate] = useState('')
  const navigate = useNavigate()
  const { token } = useAuthToken()
  const [slotCounts, setSlotCounts] = useState<Record<string, number>>({})
  const [countsStatus, setCountsStatus] = useState<string | null>(null)
  const [isLoadingCounts, setIsLoadingCounts] = useState(false)
  const isLocked = !token

  const formatDate = (date: Date) => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  const loadCounts = async (monthDate: Date) => {
    const start = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1)
    const end = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0)
    const days: Date[] = []
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      days.push(new Date(d))
    }
    setCountsStatus('Loading availability...')
    setIsLoadingCounts(true)
    const entries = await Promise.all(
      days.map(async (date) => {
        const key = formatDate(date)
        try {
          const data = await apiFetch<{ slots: Array<{ slotId: string }> }>(
            `/services/${serviceId}/slots?date=${key}`
          )
          return [key, data.slots.length] as const
        } catch {
          return [key, 0] as const
        }
      })
    )
    const map: Record<string, number> = {}
    entries.forEach(([key, count]) => {
      map[key] = count
    })
    setSlotCounts(map)
    setCountsStatus(null)
    setIsLoadingCounts(false)
  }

  useEffect(() => {
    loadCounts(new Date())
  }, [serviceId])

  useEffect(() => {
    const onFocus = () => loadCounts(new Date())
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [serviceId])

  return (
    <div className="min-h-[calc(100vh-72px)] bg-slate-950 px-6 py-12">
      <div className="mx-auto max-w-5xl space-y-8">
        <section className="rounded-3xl border border-slate-800 bg-slate-900/70 p-8">
          <Stepper active={2} />
          <h1 className="mt-4 text-2xl font-semibold">Pick a date</h1>
          <p className="mt-2 text-sm text-slate-400">
            Choose a date to see available time slots.
          </p>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-8">
            <label className="text-sm text-slate-300">Select date</label>
            <div className="mt-3">
              <CalendarPicker
                selected={selectedDate}
                onSelect={setSelectedDate}
                counts={slotCounts}
                onMonthChange={loadCounts}
                disabled={isLoadingCounts || isLocked}
              />
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-400">
              {isLocked
                ? 'Sign in to choose a date and see available slots.'
                : countsStatus || 'Choose a date to see the available slots.'}
              {!isLocked && (
                <button
                  type="button"
                  onClick={() => loadCounts(new Date())}
                  className="rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-300"
                >
                  Refresh availability
                </button>
              )}
            </div>
            {isLoadingCounts && <Spinner label="Loading availability" />}
            <button
              type="button"
              onClick={() => {
                if (!selectedDate) return
                try {
                  navigate({
                    to: '/services/$serviceId/slots',
                    params: { serviceId },
                    search: {
                      date: selectedDate,
                      name: search.name,
                      type: search.type,
                      duration: search.duration,
                      provider: search.provider,
                      rescheduleId: search.rescheduleId
                    }
                  })
                } catch {
                  window.location.href = `/services/${serviceId}/slots?date=${encodeURIComponent(
                    selectedDate
                  )}&name=${encodeURIComponent(search.name || '')}&type=${encodeURIComponent(
                    search.type || ''
                  )}&duration=${search.duration || ''}&provider=${encodeURIComponent(search.provider || '')}`
                }
              }}
              disabled={!selectedDate}
              className="mt-5 inline-flex rounded-full bg-cyan-400 px-5 py-2 text-sm font-semibold text-slate-950 disabled:opacity-50"
            >
              Continue to slots
            </button>
          </div>

          <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-8">
            <h2 className="text-lg font-semibold">Selected service</h2>
            <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-950 p-5">
              <p className="text-base font-semibold text-white">
                {search.name || 'Service'}
              </p>
              <p className="text-sm text-slate-400">
                {search.provider || 'Provider'}
              </p>
              <p className="mt-2 text-xs text-slate-400">
                {formatEnumLabel(search.type) || 'Type'} · {search.duration || '--'} min
              </p>
            </div>
            <Link
              to="/services"
              className="mt-6 inline-flex text-sm text-cyan-300 underline underline-offset-4"
            >
              Choose a different service
            </Link>
          </div>
        </section>
      </div>
    </div>
  )
}
