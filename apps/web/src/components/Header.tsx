import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { CalendarClock, LogOut, Menu, UserCircle2, X } from 'lucide-react'
import { toast } from 'react-toastify'
import { decodeJwtPayload, useAuthToken } from '../lib/auth'
import { formatEnumLabel } from '../lib/format'

export default function Header() {
  const { token, clearToken } = useAuthToken()
  const payload = token ? decodeJwtPayload(token) : null
  const role = payload?.role
  const displayName = payload?.email ? payload.email.split('@')[0] : 'Account'
  const [mobileOpen, setMobileOpen] = useState(false)
  const [mobileClosing, setMobileClosing] = useState(false)

  const closeMobile = () => {
    setMobileClosing(true)
    setTimeout(() => {
      setMobileOpen(false)
      setMobileClosing(false)
    }, 200)
  }
  const isAuthed = Boolean(token)

  return (
    <header className="sticky top-0 z-40 bg-slate-950 text-white border-b border-slate-800">
      <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between gap-4">
        <Link to="/" className="flex items-center gap-3">
          <span className="p-2 rounded-lg bg-cyan-500/20 text-cyan-200">
            <CalendarClock size={20} />
          </span>
          <div>
            <p className="text-lg font-semibold tracking-tight">Slotbook</p>
            <p className="text-xs text-slate-400">Appointment Booking</p>
          </div>
        </Link>
        <nav className="hidden items-center gap-3 text-sm lg:flex">
          <Link
            to="/"
            className="text-slate-200 hover:text-white"
            activeProps={{ className: 'text-white' }}
          >
            Home
          </Link>
          <Link
            to="/services"
            className="text-slate-200 hover:text-white"
            activeProps={{ className: 'text-white' }}
          >
            Services
          </Link>
          {isAuthed && (
            <Link
              to="/appointments"
              className="text-slate-200 hover:text-white"
              activeProps={{ className: 'text-white' }}
            >
              My Appointments
            </Link>
          )}
          {role === 'SERVICE_PROVIDER' && (
            <Link
              to="/provider"
              className="text-slate-200 hover:text-white"
              activeProps={{ className: 'text-white' }}
            >
              Provider
            </Link>
          )}
          {!isAuthed && (
            <>
              <Link
                to="/login"
                className="text-slate-200 hover:text-white"
                activeProps={{ className: 'text-white' }}
              >
                Login
              </Link>
              <Link
                to="/signup"
                className="text-slate-200 hover:text-white"
                activeProps={{ className: 'text-white' }}
              >
                Sign up
              </Link>
            </>
          )}
          <Link
            to="/app"
            className="rounded-full bg-cyan-500 text-slate-950 px-4 py-2 font-semibold hover:bg-cyan-400"
          >
            Dashboard
          </Link>
          {isAuthed && (
            <div className="hidden items-center gap-3 lg:flex">
              <div className="flex items-center gap-2 rounded-full border border-slate-800 bg-slate-900/70 px-3 py-2 text-xs text-slate-200">
                <UserCircle2 className="h-4 w-4 text-cyan-200" />
                <span>
                  {displayName}
                  {role ? ` · ${formatEnumLabel(role)}` : ''}
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  clearToken()
                  toast.info('Logged out')
                }}
                className="flex items-center gap-1 text-xs text-slate-300 hover:text-white"
              >
                <LogOut className="h-3.5 w-3.5" />
                Logout
              </button>
            </div>
          )}
        </nav>
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          className="lg:hidden rounded-full border border-slate-800 p-2 text-slate-200"
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className={`absolute inset-0 bg-slate-950/85 transition-opacity duration-200 ${
              mobileClosing ? 'opacity-0' : 'opacity-100'
            }`}
            onClick={closeMobile}
          />
          <div
            className={`relative h-full w-full max-w-sm bg-slate-950 border-r border-slate-800 p-5 ${
              mobileClosing ? 'animate-[slideOut_200ms_ease-in]' : 'animate-[slideIn_200ms_ease-out]'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CalendarClock className="h-5 w-5 text-cyan-200" />
                <span className="text-sm font-semibold">Slotbook</span>
              </div>
              <button
                type="button"
                onClick={closeMobile}
                className="rounded-full border border-slate-800 p-2 text-slate-200"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-6 flex flex-col gap-4 text-sm">
              <Link to="/" onClick={() => setMobileOpen(false)} className="text-slate-200">
                Home
              </Link>
              <Link to="/services" onClick={() => setMobileOpen(false)} className="text-slate-200">
                Services
              </Link>
              {isAuthed && (
                <Link to="/appointments" onClick={() => setMobileOpen(false)} className="text-slate-200">
                  My Appointments
                </Link>
              )}
              {role === 'SERVICE_PROVIDER' && (
                <Link to="/provider" onClick={() => setMobileOpen(false)} className="text-slate-200">
                  Provider
                </Link>
              )}
              {!isAuthed && (
                <>
                  <Link to="/login" onClick={() => setMobileOpen(false)} className="text-slate-200">
                    Login
                  </Link>
                  <Link to="/signup" onClick={() => setMobileOpen(false)} className="text-slate-200">
                    Sign up
                  </Link>
                </>
              )}
              <Link
                to="/app"
                onClick={closeMobile}
                className="rounded-full bg-cyan-400 px-4 py-2 text-center font-semibold text-slate-950"
              >
                Dashboard
              </Link>
            </div>
            {isAuthed && (
              <div className="mt-8 rounded-2xl border border-slate-800 bg-slate-900/70 p-4 text-xs text-slate-200">
                <div className="flex items-center gap-2">
                  <UserCircle2 className="h-4 w-4 text-cyan-200" />
                  <span>
                    {displayName}
                    {role ? ` · ${formatEnumLabel(role)}` : ''}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    clearToken()
                    toast.info('Logged out')
                    closeMobile()
                  }}
                  className="mt-3 flex items-center gap-2 text-slate-300"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  )
}
