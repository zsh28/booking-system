import { useState } from 'react'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { apiFetch, ApiError } from '../lib/api'
import { decodeJwtPayload, useAuthToken } from '../lib/auth'
import { toast } from 'react-toastify'
import AuthShell from '../components/AuthShell'

export const Route = createFileRoute('/login')({
  component: LoginPage
})

type LoginResponse = { token: string }

function LoginPage() {
  const { saveToken } = useAuthToken()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success'>('idle')
  const [error, setError] = useState<string | null>(null)
  const [role, setRole] = useState<string | null>(null)

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError(null)
    setStatus('loading')

    try {
      const data = await apiFetch<LoginResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      })
      saveToken(data.token)
      const payload = decodeJwtPayload(data.token)
      setRole(payload?.role || null)
      toast.success(payload?.role ? `Signed in as ${payload.role}` : 'Signed in')
      setStatus('success')
      setTimeout(() => {
        navigate({ to: '/app' })
      }, 300)
    } catch (err) {
      const message = (err as ApiError)?.message || 'Login failed'
      setError(message)
      toast.error(message)
      setStatus('idle')
    }
  }

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to manage bookings, services, and availability in one unified console."
      activeTab="login"
    >
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl font-semibold">Sign in</h2>
        <span className="text-xs text-slate-400">Access your dashboard</span>
      </div>

      <form onSubmit={submit} className="space-y-5">
        <div>
          <label className="text-sm text-slate-300">Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="mt-2 w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-slate-100"
            placeholder="you@example.com"
          />
        </div>
        <div>
          <label className="text-sm text-slate-300">Password</label>
          <input
            type="password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="mt-2 w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-slate-100"
            placeholder="••••••••"
          />
        </div>

        {error && <p className="text-xs text-rose-300">{error}</p>}

        <button
          type="submit"
          disabled={status === 'loading'}
          className="w-full rounded-full bg-cyan-400 py-3 font-semibold text-slate-950 hover:bg-cyan-300 disabled:opacity-70"
        >
          {status === 'loading' ? 'Signing in...' : 'Sign in'}
        </button>
      </form>

      {status === 'success' && (
        <div className="mt-6 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
          Logged in successfully.
          {role && (
            <span className="block text-xs text-emerald-100/90">{role}</span>
          )}{' '}
          <Link to="/app" className="underline underline-offset-4">
            Go to dashboard
          </Link>
        </div>
      )}
    </AuthShell>
  )
}
