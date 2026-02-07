import { useEffect, useMemo, useState } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { z } from 'zod'
import Stepper from '../components/Stepper'
import { apiFetch, ApiError } from '../lib/api'
import { decodeJwtPayload, useAuthToken } from '../lib/auth'
import { toast } from 'react-toastify'
import Modal from '../components/Modal'
import { formatEnumLabel } from '../lib/format'

const searchSchema = z.object({
  date: z.string(),
  name: z.string().optional(),
  type: z.string().optional(),
  duration: z.coerce.number().optional(),
  provider: z.string().optional(),
  rescheduleId: z.string().optional()
})

type Slot = {
  slotId: string
  startTime: string
  endTime: string
}

export const Route = createFileRoute('/services/$serviceId/slots')({
  component: ServiceSlotsPage,
  validateSearch: searchSchema
})

function ServiceSlotsPage() {
  const { token } = useAuthToken()
  const payload = token ? decodeJwtPayload(token) : null
  const { serviceId } = Route.useParams()
  const search = Route.useSearch()
  const [slots, setSlots] = useState<Slot[]>([])
  const [status, setStatus] = useState<string | null>(null)
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null)
  const [isBooking, setIsBooking] = useState(false)
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  const [isLoadingSlots, setIsLoadingSlots] = useState(false)

  const canBook = payload?.role === 'USER'

  const fetchSlots = async () => {
    setStatus('Loading slots...')
    setIsLoadingSlots(true)
    try {
      const data = await apiFetch<{ slots: Slot[] }>(
        `/services/${serviceId}/slots?date=${search.date}`
      )
      setSlots(data.slots)
      setStatus(`${data.slots.length} slots available`)
    } catch (err) {
      const message = (err as ApiError)?.message || 'Failed to load slots'
      setStatus(message)
      toast.error(message)
    } finally {
      setIsLoadingSlots(false)
    }
  }

  useEffect(() => {
    fetchSlots()
  }, [serviceId, search.date])

  useEffect(() => {
    const onFocus = () => fetchSlots()
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [serviceId, search.date])

  const book = async () => {
    if (!selectedSlot) return
    if (!token) {
      toast.info('Sign in to book a slot.')
      return
    }
    try {
      setIsBooking(true)
      await apiFetch('/appointments', {
        method: 'POST',
        body: JSON.stringify({ slotId: selectedSlot.slotId })
      }, token)
      if (search.rescheduleId) {
        await apiFetch(`/appointments/${search.rescheduleId}/cancel`, { method: 'PATCH' }, token)
      }
      toast.success('Appointment booked')
      setSelectedSlot(null)
      fetchSlots()
    } catch (err) {
      const message = (err as ApiError)?.message || 'Booking failed'
      toast.error(message)
    } finally {
      setIsBooking(false)
    }
  }

  const summary = useMemo(() => {
    return `${search.name || 'Service'} · ${formatEnumLabel(search.type) || 'Type'} · ${search.duration || '--'} min`
  }, [search])

  return (
    <div className="min-h-[calc(100vh-72px)] bg-slate-950 px-6 py-12">
      <div className="mx-auto max-w-6xl space-y-8">
        <section className="rounded-3xl border border-slate-800 bg-slate-900/70 p-8">
          <Stepper active={3} />
          <h1 className="mt-4 text-2xl font-semibold">Select a slot</h1>
          <p className="mt-2 text-sm text-slate-400">Date: {search.date}</p>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-8">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">{summary}</p>
                <p className="text-xs text-slate-500">{search.provider || 'Provider'}</p>
              </div>
              <span className="text-xs text-slate-400">{status}</span>
            </div>
            {isLoadingSlots && <p className="mt-4 text-xs text-slate-400">Loading slots...</p>}
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {slots.map((slot) => {
                const isSelected = selectedSlot?.slotId === slot.slotId
                return (
                  <button
                    key={slot.slotId}
                    type="button"
                    onClick={() => setSelectedSlot(slot)}
                    className={`rounded-2xl border px-4 py-3 text-left text-sm ${
                      isSelected
                        ? 'border-cyan-400 bg-cyan-500/10 text-cyan-100'
                        : 'border-slate-800 bg-slate-950 text-slate-300'
                    }`}
                  >
                    <p className="font-semibold">
                      {slot.startTime} - {slot.endTime}
                    </p>
                    <p className="text-xs text-slate-500">Tap to select</p>
                  </button>
                )
              })}
              {slots.length === 0 && (
                <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4 text-sm text-slate-400">
                  No slots available for this date.
                </div>
              )}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-8">
            <h2 className="text-lg font-semibold">Booking summary</h2>
            <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-950 p-4 text-sm">
              <p className="font-semibold text-white">{search.name || 'Service'}</p>
              <p className="text-xs text-slate-400">{search.provider || 'Provider'}</p>
              <p className="mt-2 text-xs text-slate-500">{summary}</p>
              <p className="mt-2 text-sm text-slate-200">Date: {search.date}</p>
              <p className="text-sm text-slate-200">
                Slot: {selectedSlot ? `${selectedSlot.startTime} - ${selectedSlot.endTime}` : 'None selected'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsConfirmOpen(true)}
              disabled={!selectedSlot || !canBook || isBooking}
              className="mt-6 w-full rounded-full bg-cyan-400 py-3 text-sm font-semibold text-slate-950 disabled:opacity-50"
            >
              {isBooking ? 'Booking...' : 'Book appointment'}
            </button>
            {!canBook && (
              <p className="mt-3 text-xs text-slate-400">Sign in as USER to book.</p>
            )}
            <Link
              to="/services"
              className="mt-6 inline-flex text-sm text-cyan-300 underline underline-offset-4"
            >
              Start over
            </Link>
          </div>
        </section>
      </div>
      {isConfirmOpen && selectedSlot && (
        <Modal
          title="Confirm booking"
          description={`Book ${search.name || 'service'} on ${search.date} at ${selectedSlot.startTime}?`}
          confirmText="Confirm booking"
          onCancel={() => setIsConfirmOpen(false)}
          onConfirm={() => {
            setIsConfirmOpen(false)
            book()
          }}
          loading={isBooking}
        />
      )}
    </div>
  )
}
