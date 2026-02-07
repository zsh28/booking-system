import { useEffect, useState } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { apiFetch, ApiError } from '../lib/api'
import { toast } from 'react-toastify'
import Modal from '../components/Modal'
import { useAuthToken } from '../lib/auth'

export const Route = createFileRoute('/appointments')({
  component: AppointmentsPage
})

type Appointment = {
  id: string
  serviceId: string
  serviceName: string
  type: string
  date: string
  startTime: string
  endTime: string
  status: string
}

function AppointmentsPage() {
  const { token } = useAuthToken()
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [status, setStatus] = useState<string | null>(null)
  const [cancellingId, setCancellingId] = useState<string | null>(null)
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const fetchAppointments = async () => {
    if (!token) {
      setStatus('Login required to load appointments')
      return
    }
    setStatus('Loading appointments...')
    setIsLoading(true)
    try {
      const data = await apiFetch<Appointment[]>(
        '/appointments/me',
        undefined,
        token
      )
      setAppointments(data)
      setStatus(`${data.length} appointments found`)
    } catch (err) {
      setStatus((err as ApiError)?.message || 'Failed to load appointments')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (token) {
      fetchAppointments()
    }
  }, [token])

  const cancelAppointment = async (appointmentId: string) => {
    if (!token) {
      toast.info('Login required')
      return
    }
    try {
      setCancellingId(appointmentId)
      await apiFetch(`/appointments/${appointmentId}/cancel`, { method: 'PATCH' }, token)
      toast.success('Appointment cancelled')
      fetchAppointments()
    } catch (err) {
      const message = (err as ApiError)?.message || 'Failed to cancel appointment'
      toast.error(message)
    } finally {
      setCancellingId(null)
    }
  }

  return (
    <div className="min-h-[calc(100vh-72px)] bg-slate-950 px-6 py-12">
      <div className="mx-auto max-w-4xl space-y-6">
        <section className="rounded-3xl border border-slate-800 bg-slate-900/70 p-8">
          <h1 className="text-2xl font-semibold">My appointments</h1>
          <p className="mt-2 text-sm text-slate-400">
            Track your bookings and statuses.
          </p>
          <div className="mt-6 flex items-center gap-3">
            <button
              type="button"
              onClick={fetchAppointments}
              className="rounded-full bg-cyan-400 px-5 py-2 text-sm font-semibold text-slate-950"
            >
              Load appointments
            </button>
            {status && <span className="text-xs text-slate-400">{status}</span>}
          </div>
        </section>

        <section className="space-y-3">
          {isLoading && (
            <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5 text-sm text-slate-400">
              Loading appointments...
            </div>
          )}
          {appointments.map((appt) => (
            <div
              key={appt.id}
              className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-white">{appt.serviceName}</h3>
                  <p className="text-xs text-slate-400">{appt.type}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-slate-400">{appt.status}</span>
                  {appt.status === 'BOOKED' && (
                    <button
                      type="button"
                      onClick={() => setConfirmId(appt.id)}
                      disabled={cancellingId === appt.id}
                      className="rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-300"
                    >
                      {cancellingId === appt.id ? 'Cancelling...' : 'Cancel'}
                    </button>
                  )}
                </div>
              </div>
              {appt.status === 'BOOKED' && (
                <Link
                  to="/services/$serviceId/date"
                  params={{ serviceId: appt.serviceId }}
                  search={{
                    name: appt.serviceName,
                    type: appt.type,
                    duration: undefined,
                    provider: undefined,
                    rescheduleId: appt.id
                  }}
                  className="mt-3 inline-flex text-xs text-cyan-300 underline underline-offset-4"
                >
                  Reschedule
                </Link>
              )}
              <p className="mt-3 text-xs text-slate-300">
                {appt.date} · {appt.startTime} - {appt.endTime}
              </p>
            </div>
          ))}
          {appointments.length === 0 && (
            <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5 text-sm text-slate-400">
              No appointments yet.{' '}
              <Link to="/services" className="underline underline-offset-4">
                Browse services
              </Link>
            </div>
          )}
        </section>
      </div>
      {confirmId && (
        <Modal
          title="Cancel appointment"
          description="Are you sure you want to cancel this appointment?"
          confirmText="Yes, cancel"
          onCancel={() => setConfirmId(null)}
          onConfirm={() => {
            const id = confirmId
            setConfirmId(null)
            cancelAppointment(id)
          }}
          loading={cancellingId === confirmId}
        />
      )}
    </div>
  )
}
