import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { apiFetch, ApiError } from '../lib/api'
import { formatEnumLabel } from '../lib/format'
import { toast } from 'react-toastify'
import AuthShell from '../components/AuthShell'

export const Route = createFileRoute('/signup')({
  component: SignupPage
})

type RegisterResponse = { message: string }

function SignupPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<'USER' | 'SERVICE_PROVIDER'>('USER')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success'>('idle')
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError(null)
    setMessage(null)
    setStatus('loading')

    try {
      const data = await apiFetch<RegisterResponse>('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ name, email, password, role })
      })
      setMessage(data.message)
      toast.success('Account created. You can sign in now.')
      setStatus('success')
    } catch (err) {
      const messageText = (err as ApiError)?.message || 'Registration failed'
      setError(messageText)
      toast.error(messageText)
      setStatus('idle')
    }
  }

  return (
    <AuthShell
      title="Start booking faster"
      subtitle="Join as a user or provider and manage appointments with confidence."
      activeTab="signup"
    >
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl font-semibold">Sign up</h2>
        <span className="text-xs text-slate-400">2-minute setup</span>
      </div>

      <form onSubmit={submit} className="space-y-5">
        <div>
          <label className="text-sm text-slate-300">Full name</label>
          <input
            required
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="mt-2 w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-slate-100"
            placeholder="Dr Smith"
          />
        </div>
        <div>
          <label className="text-sm text-slate-300">Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="mt-2 w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-slate-100"
            placeholder="dr@clinic.com"
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
            placeholder="At least 6 characters"
          />
        </div>
        <div>
          <label className="text-sm text-slate-300">Role</label>
          <div className="mt-2 grid gap-3 sm:grid-cols-2">
            {(['USER', 'SERVICE_PROVIDER'] as const).map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setRole(value)}
                className={`rounded-xl border px-4 py-3 text-left text-sm ${
                  role === value
                    ? 'border-cyan-400 bg-cyan-500/10 text-cyan-100'
                    : 'border-slate-800 bg-slate-950 text-slate-300'
                }`}
              >
                    <p className="font-semibold">{formatEnumLabel(value)}</p>
                <p className="text-xs text-slate-400">
                  {value === 'USER'
                    ? 'Book and manage appointments.'
                    : 'Create services and manage schedules.'}
                </p>
              </button>
            ))}
          </div>
        </div>

        {error && <p className="text-xs text-rose-300">{error}</p>}

        <button
          type="submit"
          disabled={status === 'loading'}
          className="w-full rounded-full bg-cyan-400 py-3 font-semibold text-slate-950 hover:bg-cyan-300 disabled:opacity-70"
        >
          {status === 'loading' ? 'Creating account...' : 'Create account'}
        </button>
      </form>

      {message && (
        <div className="mt-6 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
          {message}
        </div>
      )}
    </AuthShell>
  )
}
