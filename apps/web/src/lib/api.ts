export type ApiError = {
  message: string
  status: number
}

const baseUrl =
  (import.meta as any).env.PUBLIC_API_URL ||
  (import.meta as any).env.VITE_API_URL ||
  ''

const withAuth = (token?: string): HeadersInit =>
  token ? { Authorization: `Bearer ${token}` } : {}

const parseError = async (response: Response): Promise<ApiError> => {
  const payload = await response.json().catch(() => ({}))
  const message =
    typeof payload?.error === 'string'
      ? payload.error
      : response.statusText || 'Request failed'

  return { message, status: response.status }
}

export const apiFetch = async <T>(
  path: string,
  options: RequestInit = {},
  token?: string
): Promise<T> => {
  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
      ...withAuth(token)
    }
  })

  if (!response.ok) {
    throw await parseError(response)
  }

  return response.json()
}
