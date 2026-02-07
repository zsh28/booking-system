import { Link } from '@tanstack/react-router'

type AuthShellProps = {
  title: string
  subtitle: string
  activeTab: 'login' | 'signup'
  children: React.ReactNode
}

export default function AuthShell({ title, subtitle, activeTab, children }: AuthShellProps) {
  return (
    <div className="min-h-[calc(100vh-72px)] bg-slate-950 px-6 py-16">
      <div className="mx-auto grid max-w-5xl gap-8 rounded-3xl border border-slate-800 bg-slate-900/70 p-6 shadow-2xl lg:grid-cols-[1.05fr_0.95fr]">
        <div className="flex h-full flex-col justify-between rounded-2xl bg-linear-to-br from-cyan-500/20 via-slate-900/40 to-slate-950 p-8">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-500/10 px-4 py-2 text-xs text-cyan-200">
              Appointment Booking
            </div>
            <h1 className="mt-6 text-3xl font-semibold">{title}</h1>
            <p className="mt-3 text-sm text-slate-300">{subtitle}</p>
            <div className="mt-8 space-y-3 text-sm text-slate-300">
              <p>• Browse services and book time slots instantly</p>
              <p>• Manage appointments and provider schedules</p>
              <p>• Secure JWT authentication for every action</p>
            </div>
          </div>
          <div className="mt-10 flex items-center gap-3 text-xs">
            <Link
              to="/login"
              className={`rounded-full border px-4 py-2 ${
                activeTab === 'login'
                  ? 'border-cyan-400/40 bg-cyan-500/20 text-cyan-100'
                  : 'border-slate-700 text-slate-200'
              }`}
            >
              Sign in
            </Link>
            <Link
              to="/signup"
              className={`rounded-full border px-4 py-2 ${
                activeTab === 'signup'
                  ? 'border-cyan-400/40 bg-cyan-500/20 text-cyan-100'
                  : 'border-slate-700 text-slate-200'
              }`}
            >
              Sign up
            </Link>
          </div>
        </div>

        <div className="rounded-2xl bg-slate-950/60 p-8">
          {children}
        </div>
      </div>
    </div>
  )
}
