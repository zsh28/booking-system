import { useEffect, useMemo, useState } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { apiFetch, ApiError } from '../lib/api'
import Stepper from '../components/Stepper'
import Spinner from '../components/Spinner'
import { formatEnumLabel } from '../lib/format'
import { toast } from 'react-toastify'

export const Route = createFileRoute('/services/')({
  component: ServicesPage
})

const serviceTypes = [
  'MEDICAL',
  'HOUSE_HELP',
  'BEAUTY',
  'FITNESS',
  'EDUCATION',
  'OTHER'
] as const

type Service = {
  id: string
  name: string
  type: string
  durationMinutes: number
  providerName: string
}

function ServicesPage() {
  const [typeFilter, setTypeFilter] = useState('')
  const [search, setSearch] = useState('')
  const [services, setServices] = useState<Service[]>([])
  const [status, setStatus] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const fetchServices = async () => {
    setStatus('Loading services...')
    setIsLoading(true)
    try {
      const query = typeFilter ? `?type=${typeFilter}` : ''
      const data = await apiFetch<Service[]>(`/services${query}`)
      setServices(data)
      setStatus(`${data.length} services found`)
    } catch (err) {
      const message = (err as ApiError)?.message || 'Failed to load services'
      setStatus(message)
      toast.error(message)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchServices()
  }, [])

  useEffect(() => {
    fetchServices()
  }, [typeFilter])

  const filteredServices = useMemo(() => {
    if (!search.trim()) return services
    const term = search.toLowerCase()
    return services.filter((service) =>
      `${service.name} ${service.providerName}`.toLowerCase().includes(term)
    )
  }, [search, services])

  return (
    <div className="min-h-[calc(100vh-72px)] bg-slate-950 px-6 py-12">
      <div className="mx-auto max-w-6xl space-y-8">
        <section className="rounded-3xl border border-slate-800 bg-slate-900/70 p-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <Stepper active={1} />
              <h1 className="mt-4 text-2xl font-semibold">Choose a service</h1>
              <p className="mt-2 text-sm text-slate-400">
                Filter by type, search providers, then continue to pick a date.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="rounded-xl border border-slate-800 bg-slate-950 px-4 py-2 text-sm text-slate-100"
                placeholder="Search provider or service"
              />
              <select
                value={typeFilter}
                onChange={(event) => setTypeFilter(event.target.value)}
                className="rounded-xl border border-slate-800 bg-slate-950 px-4 py-2 text-sm text-slate-100"
              >
                <option value="">All types</option>
                {serviceTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={fetchServices}
                className="rounded-full border border-slate-700 px-4 py-2 text-sm text-slate-200"
              >
                Refresh
              </button>
              {isLoading ? <Spinner label="Loading services" /> : status && (
                <span className="text-xs text-slate-400">{status}</span>
              )}
            </div>
          </div>
        </section>

        <section className="grid gap-6 md:grid-cols-2">
          {filteredServices.map((service) => (
            <div
              key={service.id}
              className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-lg font-semibold text-white">{service.name}</p>
                  <p className="text-sm text-slate-400">{service.providerName}</p>
                </div>
                <span className="rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-300">
                  {formatEnumLabel(service.type)}
                </span>
              </div>
              <p className="mt-4 text-sm text-slate-300">
                Duration: {service.durationMinutes} minutes
              </p>
              <div className="mt-6 flex items-center justify-between">
                <div className="text-xs text-slate-400">Step 1 of 3</div>
                <Link
                  to="/services/$serviceId/date"
                  params={{ serviceId: service.id }}
                  search={{
                    name: service.name,
                    type: service.type,
                    duration: service.durationMinutes,
                    provider: service.providerName
                  }}
                  className="rounded-full bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950"
                >
                  Select service
                </Link>
              </div>
            </div>
          ))}
          {filteredServices.length === 0 && !isLoading && (
            <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-8 text-sm text-slate-400">
              No services match your filters. Try another type or search term.
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
