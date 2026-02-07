const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/
const dateRegex = /^\d{4}-\d{2}-\d{2}$/

export const isValidTime = (value: string): boolean => timeRegex.test(value)

export const isValidDate = (value: string): boolean => dateRegex.test(value)

export const isValidSlotMinute = (value: string): boolean => {
  if (!isValidTime(value)) return false
  const minutes = Number(value.split(':')[1])
  return minutes === 0 || minutes === 30
}

export const addMinutes = (time: string, minutesToAdd: number): string => {
  const [hour, minute] = time.split(':').map(Number)
  const totalMinutes = hour * 60 + minute + minutesToAdd
  const resultHour = Math.floor(totalMinutes / 60) % 24
  const resultMinute = totalMinutes % 60
  return `${String(resultHour).padStart(2, '0')}:${String(resultMinute).padStart(2, '0')}`
}

export const isPastDateTime = (date: string, time: string): boolean => {
  const target = new Date(`${date}T${time}:00`)
  return target.getTime() < Date.now()
}
