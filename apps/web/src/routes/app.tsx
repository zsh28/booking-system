import { createFileRoute, Link } from '@tanstack/react-router'
import { CalendarCheck, ClipboardList, Settings } from 'lucide-react'
import { decodeJwtPayload, useAuthToken } from '../lib/auth'

export const Route = createFileRoute('/app')({
  component: AppHome
})

function AppHome() {
  const { token, clearToken } = useAuthToken()
  const payload = token ? decodeJwtPayload(token) : null

  return (
    <div className="min-h-[calc(100vh-72px)] bg-slate-950 px-6 py-12">
      <div className="mx-auto max-w-5xl space-y-8">
        <section className="rounded-3xl border border-slate-800 bg-slate-900/70 p-10">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl font-semibold">Booking Console</h1>
              <p className="mt-2 text-sm text-slate-400">
                Manage services, slots, and appointments from one place.
              </p>
            </div>
            {token ? (
              <div className="text-xs text-slate-300">
                Signed in as <span className="text-white">{payload?.email || 'User'}</span>
                {payload?.role && <span> · {payload.role}</span>}
                <button
                  type="button"
                  onClick={clearToken}
                  className="ml-3 rounded-full border border-slate-700 px-3 py-1"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="text-xs text-slate-300">
                Not signed in.{' '}
                <Link to="/login" className="underline underline-offset-4">
                  Login
                </Link>
              </div>
            )}
          </div>
        </section>

        <section className="grid gap-6 md:grid-cols-3">
          <Link
            to="/services"
            className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6 transition hover:border-cyan-500/50"
          >
            <CalendarCheck className="h-8 w-8 text-cyan-200" />
            <h3 className="mt-4 text-lg font-semibold">Find services</h3>
            <p className="mt-2 text-sm text-slate-400">
              Browse services by type and see available slots.
            </p>
          </Link>
          <Link
            to="/appointments"
            className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6 transition hover:border-cyan-500/50"
          >
            <ClipboardList className="h-8 w-8 text-cyan-200" />
            <h3 className="mt-4 text-lg font-semibold">My appointments</h3>
            <p className="mt-2 text-sm text-slate-400">
              Track upcoming bookings and statuses.
            </p>
          </Link>
          <Link
            to="/provider"
            className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6 transition hover:border-cyan-500/50"
          >
            <Settings className="h-8 w-8 text-cyan-200" />
            <h3 className="mt-4 text-lg font-semibold">Provider tools</h3>
            <p className="mt-2 text-sm text-slate-400">
              Create services, set availability, and view schedules.
            </p>
          </Link>
        </section>
      </div>
    </div>
  )
}
