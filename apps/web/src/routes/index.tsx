import { Link, createFileRoute } from '@tanstack/react-router'
import { CalendarCheck, Clock, ShieldCheck, Sparkles } from 'lucide-react'
import { useAuthToken } from '../lib/auth'

export const Route = createFileRoute('/')({ component: Landing })

function Landing() {
  const { token } = useAuthToken()
  const highlights = [
    {
      icon: <CalendarCheck className="h-8 w-8 text-cyan-200" />,
      title: 'Role-based scheduling',
      body: 'Service providers publish services and weekly availability. Users book by slot ID.'
    },
    {
      icon: <Clock className="h-8 w-8 text-cyan-200" />,
      title: 'Slot precision',
      body: 'Slots are derived on the fly, aligned to service duration, and blocked by booked appointments.'
    },
    {
      icon: <ShieldCheck className="h-8 w-8 text-cyan-200" />,
      title: 'JWT-secured',
      body: 'Simple token auth for both user and provider flows.'
    }
  ]

  return (
    <div className="bg-slate-950">
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.18),transparent_55%)]" />
        <div className="mx-auto max-w-6xl px-6 pt-16 pb-20">
          <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-500/10 px-4 py-2 text-sm text-cyan-200">
                <Sparkles className="h-4 w-4" />
                Slot-based appointment platform
              </div>
              <h1 className="mt-6 text-4xl font-semibold tracking-tight text-white sm:text-5xl">
                Book the right time, every time.
              </h1>
              <p className="mt-4 text-lg text-slate-300">
                Slotbook connects service providers and users with a fast, rule-driven booking flow. Providers define weekly availability, users book exact time blocks with a single slot ID.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-4">
                <Link
                  to="/signup"
                  className="rounded-full bg-cyan-400 px-6 py-3 font-semibold text-slate-950 hover:bg-cyan-300"
                >
                  Create account
                </Link>
                <Link
                  to="/login"
                  className="rounded-full border border-slate-700 px-6 py-3 font-semibold text-slate-100 hover:border-slate-500"
                >
                  Sign in
                </Link>
                {token && (
                  <Link
                    to="/app"
                    className="text-sm text-slate-300 underline underline-offset-4 hover:text-white"
                  >
                    Open API console
                  </Link>
                )}
              </div>
            </div>
            <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-8 shadow-xl">
              <h2 className="text-xl font-semibold">What you can do</h2>
              <ul className="mt-4 space-y-4 text-slate-300">
                <li>Register as USER or SERVICE PROVIDER</li>
                <li>Create services with 30-120 minute durations</li>
                <li>Set weekly availability windows</li>
                <li>Derive slots for any date and book instantly</li>
                <li>View personal appointments or provider schedule</li>
              </ul>
              <div className="mt-6 rounded-2xl bg-slate-950 p-4 text-sm text-cyan-200">
                Base URL: http://localhost:3000
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-20">
        <div className="grid gap-6 md:grid-cols-3">
          {highlights.map((item) => (
            <div
              key={item.title}
              className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6"
            >
              <div className="mb-4 rounded-xl bg-cyan-500/10 p-3 w-fit">
                {item.icon}
              </div>
              <h3 className="text-lg font-semibold text-white">{item.title}</h3>
              <p className="mt-2 text-sm text-slate-400">{item.body}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
