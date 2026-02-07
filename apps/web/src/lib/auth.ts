import { useSyncExternalStore } from 'react'

const storageKey = 'appointment_token'

let currentToken: string | null = null

const loadToken = () => {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(storageKey)
}

currentToken = loadToken()

const listeners = new Set<() => void>()

const emit = () => {
  listeners.forEach((listener) => listener())
}

if (typeof window !== 'undefined') {
  window.addEventListener('storage', (event) => {
    if (event.key === storageKey) {
      currentToken = event.newValue
      emit()
    }
  })
}

export type AuthPayload = {
  userId?: string
  email?: string
  role?: string
}

export const decodeJwtPayload = (token: string): AuthPayload | null => {
  try {
    if (typeof window === 'undefined') return null
    const payload = token.split('.')[1]
    if (!payload) return null
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/')
    const json = window.atob(normalized)
    return JSON.parse(json) as AuthPayload
  } catch {
    return null
  }
}

export const useAuthToken = () => {
  const token = useSyncExternalStore(
    (listener) => {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    () => currentToken,
    () => null
  )

  const saveToken = (value: string) => {
    if (typeof window === 'undefined') return
    localStorage.setItem(storageKey, value)
    currentToken = value
    emit()
  }

  const clearToken = () => {
    if (typeof window === 'undefined') return
    localStorage.removeItem(storageKey)
    currentToken = null
    emit()
  }

  return { token, saveToken, clearToken }
}
