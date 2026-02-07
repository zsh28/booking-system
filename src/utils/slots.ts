interface Availability {
  dayOfWeek: number
  startTime: string
  endTime: string
}

interface Appointment {
  startTime: string
  endTime: string
}

interface Service {
  id: string
  durationMinutes: number
}

export const generateSlots = (
  service: Service,
  date: string,
  availabilities: Availability[],
  appointments: Appointment[]
) => {
  const slots: { slotId: string; startTime: string; endTime: string }[] = []
  const targetDate = new Date(date)
  const dayOfWeek = targetDate.getDay()

  const relevantAvailabilities = availabilities.filter((a) => a.dayOfWeek === dayOfWeek)

  for (const avail of relevantAvailabilities) {
    const [startHour, startMin] = avail.startTime.split(':').map(Number)
    const [endHour, endMin] = avail.endTime.split(':').map(Number)

    let currentMinutes = startHour * 60 + startMin
    const endMinutes = endHour * 60 + endMin
    const durationMinutes = service.durationMinutes

    while (currentMinutes + durationMinutes <= endMinutes) {
      const startTime = `${String(Math.floor(currentMinutes / 60)).padStart(2, '0')}:${String(currentMinutes % 60).padStart(2, '0')}`
      const endTimeMinutes = currentMinutes + durationMinutes
      const endTime = `${String(Math.floor(endTimeMinutes / 60)).padStart(2, '0')}:${String(endTimeMinutes % 60).padStart(2, '0')}`

      const isBooked = appointments.some((appt) => {
        return startTime < appt.endTime && endTime > appt.startTime
      })

      if (!isBooked) {
        slots.push({
          slotId: `${service.id}_${date}_${startTime}`,
          startTime,
          endTime
        })
      }

      currentMinutes += durationMinutes
    }
  }

  return slots
}

export const validateSlotAvailability = (
  service: Service,
  date: string,
  startTime: string,
  endTime: string,
  availabilities: Availability[],
  appointments: Appointment[]
): boolean => {
  const targetDate = new Date(date)
  const dayOfWeek = targetDate.getDay()

  const relevantAvailability = availabilities.find((a) => a.dayOfWeek === dayOfWeek)

  if (!relevantAvailability) {
    return false
  }

  const [startHour, startMin] = relevantAvailability.startTime.split(':').map(Number)
  const [endHour, endMin] = relevantAvailability.endTime.split(':').map(Number)
  const availStartMinutes = startHour * 60 + startMin
  const availEndMinutes = endHour * 60 + endMin

  const [slotStartHour, slotStartMin] = startTime.split(':').map(Number)
  const [slotEndHour, slotEndMin] = endTime.split(':').map(Number)
  const slotStartMinutes = slotStartHour * 60 + slotStartMin
  const slotEndMinutes = slotEndHour * 60 + slotEndMin

  if (slotStartMinutes < availStartMinutes || slotEndMinutes > availEndMinutes) {
    return false
  }

  const hasOverlap = appointments.some((appt) => {
    return startTime < appt.endTime && endTime > appt.startTime
  })

  return !hasOverlap
}
