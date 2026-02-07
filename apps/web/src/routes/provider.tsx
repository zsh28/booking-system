import { useEffect, useMemo, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { apiFetch, ApiError } from '../lib/api'
import { decodeJwtPayload, useAuthToken } from '../lib/auth'
import { toast } from 'react-toastify'
import Modal from '../components/Modal'
import { formatEnumLabel } from '../lib/format'

export const Route = createFileRoute('/provider')({
  component: ProviderPage
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
}

type ProviderSchedule = {
  date: string
  services: Array<{
    serviceId: string
    serviceName: string
    appointments: Array<{
      appointmentId: string
      userName: string
      startTime: string
      endTime: string
      status: string
    }>
  }>
}

function ProviderPage() {
  const { token } = useAuthToken()
  const payload = token ? decodeJwtPayload(token) : null
  const [activeTab, setActiveTab] = useState<'services' | 'availability' | 'schedule'>('services')
  const [serviceName, setServiceName] = useState('')
  const [serviceType, setServiceType] = useState<(typeof serviceTypes)[number]>('MEDICAL')
  const [serviceDuration, setServiceDuration] = useState(30)
  const [serviceMessage, setServiceMessage] = useState<string | null>(null)
  const [createdService, setCreatedService] = useState<Service | null>(null)
  const [myServices, setMyServices] = useState<Service[]>([])
  const [servicesStatus, setServicesStatus] = useState<string | null>(null)
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editType, setEditType] = useState<(typeof serviceTypes)[number]>('MEDICAL')
  const [editDuration, setEditDuration] = useState(30)
  const [isUpdatingService, setIsUpdatingService] = useState(false)

  const [availabilityServiceId, setAvailabilityServiceId] = useState('')
  const [availabilityRows, setAvailabilityRows] = useState([
    { id: 'row-1', dayOfWeek: 1, startTime: '09:00', endTime: '12:00' }
  ])
  const [availabilityStatus, setAvailabilityStatus] = useState<string | null>(null)
  const [isSavingAvailability, setIsSavingAvailability] = useState(false)

  const [scheduleDate, setScheduleDate] = useState('')
  const [schedule, setSchedule] = useState<ProviderSchedule | null>(null)
  const [scheduleStatus, setScheduleStatus] = useState<string | null>(null)
  const [scheduleMode, setScheduleMode] = useState<'day' | 'week' | 'month'>('day')
  const [scheduleRange, setScheduleRange] = useState<Record<string, ProviderSchedule>>({})
  const [confirmCancelId, setConfirmCancelId] = useState<string | null>(null)
  const [isCancelling, setIsCancelling] = useState(false)

  const createService = async () => {
    if (!token) {
      setServiceMessage('Login required')
      return
    }
    setServiceMessage('Creating service...')
    try {
      const data = await apiFetch<Service>(
        '/services',
        {
          method: 'POST',
          body: JSON.stringify({
            name: serviceName,
            type: serviceType,
            durationMinutes: Number(serviceDuration)
          })
        },
        token
      )
      setCreatedService(data)
      setMyServices((prev) => [...prev, data])
      setServiceMessage('Service created successfully.')
      toast.success(`Service created: ${data.name}`)
    } catch (err) {
      const message = (err as ApiError)?.message || 'Failed to create service'
      setServiceMessage(message)
      toast.error(message)
    }
  }

  const loadServices = async () => {
    if (!token) return
    setServicesStatus('Loading services...')
    try {
      const data = await apiFetch<Service[]>('/providers/me/services', undefined, token)
      setMyServices(data)
      setServicesStatus(`${data.length} services loaded`)
    } catch (err) {
      const message = (err as ApiError)?.message || 'Failed to load services'
      setServicesStatus(message)
      toast.error(message)
    }
  }

  const startEdit = (service: Service) => {
    setEditingServiceId(service.id)
    setEditName(service.name)
    setEditType(service.type as (typeof serviceTypes)[number])
    setEditDuration(service.durationMinutes)
  }

  const cancelEdit = () => {
    setEditingServiceId(null)
  }

  const updateService = async () => {
    if (!token || !editingServiceId) return
    setServiceMessage('Updating service...')
    try {
      setIsUpdatingService(true)
      const data = await apiFetch<Service>(
        `/services/${editingServiceId}`,
        {
          method: 'PATCH',
          body: JSON.stringify({
            name: editName,
            type: editType,
            durationMinutes: editDuration
          })
        },
        token
      )
      setMyServices((prev) => prev.map((service) => (service.id === data.id ? data : service)))
      setEditingServiceId(null)
      setServiceMessage('Service updated')
      toast.success(`Service updated: ${data.name}`)
    } catch (err) {
      const message = (err as ApiError)?.message || 'Failed to update service'
      setServiceMessage(message)
      toast.error(message)
    } finally {
      setIsUpdatingService(false)
    }
  }

  const saveAvailability = async () => {
    if (!token) {
      setServiceMessage('Login required')
      return
    }
    if (!availabilityServiceId) {
      setServiceMessage('Select a service first')
      return
    }
    setAvailabilityStatus('Saving availability...')
    try {
      setIsSavingAvailability(true)
      await apiFetch(
        `/services/${availabilityServiceId}/availability`,
        {
          method: 'PUT',
          body: JSON.stringify(
            availabilityRows.map((row) => ({
              dayOfWeek: Number(row.dayOfWeek),
              startTime: row.startTime,
              endTime: row.endTime
            }))
          )
        },
        token
      )
      setAvailabilityStatus('Availability saved')
      toast.success('Availability saved')
    } catch (err) {
      const message = (err as ApiError)?.message || 'Failed to set availability'
      setAvailabilityStatus(message)
      toast.error(message)
    } finally {
      setIsSavingAvailability(false)
    }
  }

  const loadAvailability = async (serviceId: string) => {
    if (!token) return
    if (!serviceId) return
    setAvailabilityStatus('Loading availability...')
    try {
      const data = await apiFetch<Array<{ dayOfWeek: number; startTime: string; endTime: string }>>(
        `/services/${serviceId}/availability`,
        undefined,
        token
      )
      const rows = data.length
        ? data.map((row, index) => ({ id: `row-${index}-${Date.now()}`, ...row }))
        : [{ id: `row-${Date.now()}`, dayOfWeek: 1, startTime: '09:00', endTime: '12:00' }]
      setAvailabilityRows(rows)
      setAvailabilityStatus(data.length ? 'Availability loaded' : 'No availability yet')
    } catch (err) {
      const message = (err as ApiError)?.message || 'Failed to load availability'
      setAvailabilityStatus(message)
      toast.error(message)
    }
  }

  const formatDate = (date: Date) => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  const getWeekDates = (date: Date) => {
    const start = new Date(date)
    const day = start.getDay()
    const diff = day === 0 ? -6 : 1 - day
    start.setDate(start.getDate() + diff)
    return Array.from({ length: 7 }, (_, index) => {
      const d = new Date(start)
      d.setDate(start.getDate() + index)
      return d
    })
  }

  const getMonthDates = (date: Date) => {
    const start = new Date(date.getFullYear(), date.getMonth(), 1)
    const end = new Date(date.getFullYear(), date.getMonth() + 1, 0)
    const dates: Date[] = []
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      dates.push(new Date(d))
    }
    return dates
  }

  const loadSchedule = async () => {
    if (!token) {
      setScheduleStatus('Login required')
      return
    }
    setScheduleStatus('Loading schedule...')
    try {
      const baseDate = scheduleDate ? new Date(scheduleDate) : new Date()
      if (scheduleMode === 'day') {
        const data = await apiFetch<ProviderSchedule>(
          `/providers/me/schedule?date=${formatDate(baseDate)}`,
          undefined,
          token
        )
        setSchedule(data)
        setScheduleRange({ [formatDate(baseDate)]: data })
      } else {
        const dates = scheduleMode === 'week' ? getWeekDates(baseDate) : getMonthDates(baseDate)
        const requests = dates.map((date) =>
          apiFetch<ProviderSchedule>(
            `/providers/me/schedule?date=${formatDate(date)}`,
            undefined,
            token
          ).then((data) => [formatDate(date), data] as const)
        )
        const results = await Promise.all(requests)
        const map: Record<string, ProviderSchedule> = {}
        results.forEach(([key, value]) => {
          map[key] = value
        })
        setScheduleRange(map)
      }
      setScheduleStatus('Schedule loaded')
      toast.success('Schedule loaded')
    } catch (err) {
      const message = (err as ApiError)?.message || 'Failed to load schedule'
      setScheduleStatus(message)
      toast.error(message)
    }
  }

  const cancelBooking = async (appointmentId: string) => {
    if (!token) return
    try {
      setIsCancelling(true)
      await apiFetch(`/appointments/${appointmentId}/cancel`, { method: 'PATCH' }, token)
      toast.success('Appointment cancelled')
      loadSchedule()
    } catch (err) {
      const message = (err as ApiError)?.message || 'Failed to cancel appointment'
      toast.error(message)
    } finally {
      setIsCancelling(false)
    }
  }

  const selectedService = useMemo(
    () => myServices.find((service) => service.id === availabilityServiceId),
    [availabilityServiceId, myServices]
  )

  useEffect(() => {
    if (payload?.role === 'SERVICE_PROVIDER' && myServices.length === 0) {
      loadServices()
    }
  }, [payload?.role])

  useEffect(() => {
    if (availabilityServiceId) {
      loadAvailability(availabilityServiceId)
    }
  }, [availabilityServiceId])

  useEffect(() => {
    if (availabilityServiceId) {
      loadAvailability(availabilityServiceId)
    }
  }, [availabilityServiceId])

  return (
    <>
      <div className="min-h-[calc(100vh-72px)] bg-slate-950 px-6 py-12">
        <div className="mx-auto max-w-5xl space-y-8">
        <section className="rounded-3xl border border-slate-800 bg-slate-900/70 p-8">
          <h1 className="text-2xl font-semibold">Provider tools</h1>
          <p className="mt-2 text-sm text-slate-400">
            Create services, define availability, and view daily schedules.
          </p>
          {payload?.role !== 'SERVICE_PROVIDER' && (
            <div className="mt-4 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-xs text-amber-200">
              Log in as SERVICE_PROVIDER to use these tools.
            </div>
          )}
        </section>
        {payload?.role === 'SERVICE_PROVIDER' && (
          <section className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6">
            <div className="flex flex-wrap gap-3 text-sm">
              {(['services', 'availability', 'schedule'] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={`rounded-full border px-4 py-2 ${
                    activeTab === tab
                      ? 'border-cyan-400 bg-cyan-500/10 text-cyan-100'
                      : 'border-slate-700 text-slate-300'
                  }`}
                >
                  {tab === 'services' && 'Services'}
                  {tab === 'availability' && 'Availability'}
                  {tab === 'schedule' && 'Schedule'}
                </button>
              ))}
            </div>

            {activeTab === 'services' && (
              <div className="mt-6 grid gap-6 lg:grid-cols-2">
                <div className="rounded-3xl border border-slate-800 bg-slate-950/60 p-6">
                  <h2 className="text-lg font-semibold">Create a service</h2>
                  <div className="mt-4 space-y-3">
                    <input
                      value={serviceName}
                      onChange={(event) => setServiceName(event.target.value)}
                      className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-2 text-sm"
                      placeholder="Service name"
                    />
                    <div className="grid gap-3 sm:grid-cols-2">
                      <select
                        value={serviceType}
                        onChange={(event) =>
                          setServiceType(event.target.value as (typeof serviceTypes)[number])
                        }
                        className="rounded-xl border border-slate-800 bg-slate-950 px-4 py-2 text-sm"
                      >
                        {serviceTypes.map((type) => (
                          <option key={type} value={type}>
                            {type}
                          </option>
                        ))}
                      </select>
                      <input
                        type="number"
                        value={serviceDuration}
                        onChange={(event) => setServiceDuration(Number(event.target.value))}
                        className="rounded-xl border border-slate-800 bg-slate-950 px-4 py-2 text-sm"
                        min={30}
                        max={120}
                        step={30}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={createService}
                      className="rounded-full bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950"
                    >
                      Create service
                    </button>
                    {createdService && (
                      <p className="text-xs text-slate-400">Service created successfully.</p>
                    )}
                    {serviceMessage && (
                      <p className="text-xs text-slate-400">{serviceMessage}</p>
                    )}
                  </div>
                </div>

                <div className="rounded-3xl border border-slate-800 bg-slate-950/60 p-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold">My services</h2>
                    <button
                      type="button"
                      onClick={loadServices}
                      className="rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-300"
                    >
                      Refresh
                    </button>
                  </div>
                  {servicesStatus && (
                    <p className="mt-2 text-xs text-slate-400">{servicesStatus}</p>
                  )}
                  <div className="mt-4 space-y-3">
                    {myServices.map((service) => (
                      <div key={service.id} className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
                        {editingServiceId === service.id ? (
                          <div className="space-y-3">
                            <input
                              value={editName}
                              onChange={(event) => setEditName(event.target.value)}
                              className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm"
                            />
                            <div className="grid gap-3 sm:grid-cols-2">
                              <select
                                value={editType}
                                onChange={(event) =>
                                  setEditType(event.target.value as (typeof serviceTypes)[number])
                                }
                                className="rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm"
                              >
                                {serviceTypes.map((type) => (
                                  <option key={type} value={type}>
                                    {type}
                                  </option>
                                ))}
                              </select>
                              <input
                                type="number"
                                value={editDuration}
                                onChange={(event) => setEditDuration(Number(event.target.value))}
                                className="rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm"
                                min={30}
                                max={120}
                                step={30}
                              />
                            </div>
                            <div className="flex flex-wrap gap-2">
                              <button
                                type="button"
                                onClick={updateService}
                                disabled={isUpdatingService}
                                className="rounded-full bg-cyan-400 px-4 py-2 text-xs font-semibold text-slate-950"
                              >
                                {isUpdatingService ? 'Saving...' : 'Save changes'}
                              </button>
                              <button
                                type="button"
                                onClick={cancelEdit}
                                className="rounded-full border border-slate-700 px-4 py-2 text-xs text-slate-200"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-semibold text-white">{service.name}</p>
                              <p className="text-xs text-slate-400">
                                {formatEnumLabel(service.type)} · {service.durationMinutes} min
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => startEdit(service)}
                              className="rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-300"
                            >
                              Edit
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                    {myServices.length === 0 && (
                      <p className="text-xs text-slate-400">No services created yet.</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'availability' && (
              <div className="mt-6 rounded-3xl border border-slate-800 bg-slate-950/60 p-6">
                <h2 className="text-lg font-semibold">Set availability</h2>
                <div className="mt-4 space-y-4">
                  <div className="flex items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={loadServices}
                      className="rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-300"
                    >
                      Load services
                    </button>
                    {servicesStatus && (
                      <span className="text-xs text-slate-400">{servicesStatus}</span>
                    )}
                  </div>

                  {myServices.length > 0 ? (
                    <select
                      value={availabilityServiceId}
                      onChange={(event) => setAvailabilityServiceId(event.target.value)}
                      className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-2 text-sm"
                    >
                      <option value="">Select a service</option>
                      {myServices.map((service) => (
                          <option key={service.id} value={service.id}>
                            {service.name} · {formatEnumLabel(service.type)}
                          </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      value={availabilityServiceId}
                      onChange={(event) => setAvailabilityServiceId(event.target.value)}
                      className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-2 text-sm"
                      placeholder="Service ID"
                    />
                  )}

                  {selectedService && (
                    <p className="text-xs text-slate-400">
                      Selected: {selectedService.name} · {formatEnumLabel(selectedService.type)}
                    </p>
                  )}

                  <div className="space-y-3">
                    {availabilityRows.map((row) => (
                      <div key={row.id} className="grid gap-3 sm:grid-cols-4">
                        <select
                          value={row.dayOfWeek}
                          onChange={(event) =>
                            setAvailabilityRows((prev) =>
                              prev.map((item) =>
                                item.id === row.id
                                  ? { ...item, dayOfWeek: Number(event.target.value) }
                                  : item
                              )
                            )
                          }
                          className="rounded-xl border border-slate-800 bg-slate-950 px-4 py-2 text-sm"
                        >
                          <option value={0}>Sunday</option>
                          <option value={1}>Monday</option>
                          <option value={2}>Tuesday</option>
                          <option value={3}>Wednesday</option>
                          <option value={4}>Thursday</option>
                          <option value={5}>Friday</option>
                          <option value={6}>Saturday</option>
                        </select>
                        <input
                          type="time"
                          value={row.startTime}
                          onChange={(event) =>
                            setAvailabilityRows((prev) =>
                              prev.map((item) =>
                                item.id === row.id
                                  ? { ...item, startTime: event.target.value }
                                  : item
                              )
                            )
                          }
                          className="rounded-xl border border-slate-800 bg-slate-950 px-4 py-2 text-sm"
                        />
                        <input
                          type="time"
                          value={row.endTime}
                          onChange={(event) =>
                            setAvailabilityRows((prev) =>
                              prev.map((item) =>
                                item.id === row.id
                                  ? { ...item, endTime: event.target.value }
                                  : item
                              )
                            )
                          }
                          className="rounded-xl border border-slate-800 bg-slate-950 px-4 py-2 text-sm"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setAvailabilityRows((prev) => prev.filter((item) => item.id !== row.id))
                          }
                          className="rounded-xl border border-slate-700 px-3 py-2 text-xs text-slate-300"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={() =>
                        setAvailabilityRows((prev) => [
                          ...prev,
                          {
                            id: `row-${Date.now()}`,
                            dayOfWeek: 1,
                            startTime: '09:00',
                            endTime: '12:00'
                          }
                        ])
                      }
                      className="rounded-full border border-slate-700 px-4 py-2 text-sm text-slate-200"
                    >
                      Add row
                    </button>
                    <button
                      type="button"
                      onClick={saveAvailability}
                      disabled={isSavingAvailability}
                      className="rounded-full bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950"
                    >
                      {isSavingAvailability ? 'Saving...' : 'Save all'}
                    </button>
                    {availabilityStatus && (
                      <span className="text-xs text-slate-400">{availabilityStatus}</span>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'schedule' && (
              <div className="mt-6 rounded-3xl border border-slate-800 bg-slate-950/60 p-6">
                <h2 className="text-lg font-semibold">Daily schedule</h2>
                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <div className="flex gap-2">
                    {(['day', 'week', 'month'] as const).map((mode) => (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => setScheduleMode(mode)}
                        className={`rounded-full border px-3 py-1 text-xs ${
                          scheduleMode === mode
                            ? 'border-cyan-400 bg-cyan-500/10 text-cyan-100'
                            : 'border-slate-700 text-slate-300'
                        }`}
                      >
                        {mode.toUpperCase()}
                      </button>
                    ))}
                  </div>
                  <input
                    type="date"
                    value={scheduleDate}
                    onChange={(event) => setScheduleDate(event.target.value)}
                    className="rounded-xl border border-slate-800 bg-slate-950 px-4 py-2 text-sm"
                  />
                  <button
                    type="button"
                    onClick={loadSchedule}
                    className="rounded-full border border-slate-700 px-4 py-2 text-sm text-slate-200"
                  >
                    Load schedule
                  </button>
                  {scheduleStatus && <span className="text-xs text-slate-400">{scheduleStatus}</span>}
                </div>
                {scheduleMode === 'day' && schedule && (
                  <div className="mt-6 space-y-4">
                    {schedule.services.map((service) => (
                      <div key={service.serviceId} className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
                        <h3 className="text-sm font-semibold">{service.serviceName}</h3>
                        <div className="mt-3 space-y-2 text-xs text-slate-400">
                          {service.appointments.map((appt) => (
                            <div key={appt.appointmentId} className="flex items-center justify-between">
                              <span>
                                {appt.startTime} - {appt.endTime} · {appt.userName} · {appt.status}
                              </span>
                              {appt.status === 'BOOKED' && (
                                <button
                                  type="button"
                                  onClick={() => setConfirmCancelId(appt.appointmentId)}
                                  className="rounded-full border border-slate-700 px-2 py-1 text-[11px] text-slate-300"
                                >
                                  Cancel
                                </button>
                              )}
                            </div>
                          ))}
                          {service.appointments.length === 0 && (
                            <span>No bookings yet.</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {scheduleMode !== 'day' && Object.keys(scheduleRange).length > 0 && (
                  <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                    {Object.entries(scheduleRange).map(([dateKey, daySchedule]) => (
                      <div key={dateKey} className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
                        <p className="text-xs text-slate-400">{dateKey}</p>
                        {daySchedule.services.map((service) => (
                          <div key={service.serviceId} className="mt-3">
                            <p className="text-sm font-semibold text-white">{service.serviceName}</p>
                            <div className="mt-2 space-y-1 text-xs text-slate-400">
                              {service.appointments.map((appt) => (
                                <div key={appt.appointmentId} className="flex items-center justify-between">
                                  <span>
                                    {appt.startTime} - {appt.endTime} · {appt.userName}
                                  </span>
                                  {appt.status === 'BOOKED' && (
                                    <button
                                      type="button"
                                      onClick={() => setConfirmCancelId(appt.appointmentId)}
                                      className="rounded-full border border-slate-700 px-2 py-1 text-[11px] text-slate-300"
                                    >
                                      Cancel
                                    </button>
                                  )}
                                </div>
                              ))}
                              {service.appointments.length === 0 && (
                                <span>No bookings.</span>
                              )}
                            </div>
                          </div>
                        ))}
                        {daySchedule.services.length === 0 && (
                          <p className="mt-3 text-xs text-slate-500">No services scheduled.</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </section>
        )}
        </div>
      </div>
      {confirmCancelId && (
        <Modal
          title="Cancel appointment"
          description="Are you sure you want to cancel this appointment?"
          confirmText="Yes, cancel"
          onCancel={() => setConfirmCancelId(null)}
          onConfirm={() => {
            const id = confirmCancelId
            setConfirmCancelId(null)
            if (id) cancelBooking(id)
          }}
          loading={isCancelling}
        />
      )}
    </>
  )
}
