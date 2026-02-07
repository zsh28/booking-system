import { useMemo, useState } from 'react'

const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

const formatDate = (date: Date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const isSameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate()

type CalendarPickerProps = {
  selected?: string
  onSelect: (value: string) => void
  counts?: Record<string, number>
  onMonthChange?: (value: Date) => void
  disabled?: boolean
}

export default function CalendarPicker({
  selected,
  onSelect,
  counts = {},
  onMonthChange,
  disabled
}: CalendarPickerProps) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const [currentMonth, setCurrentMonth] = useState(() => {
    const date = selected ? new Date(selected) : new Date()
    return new Date(date.getFullYear(), date.getMonth(), 1)
  })

  const monthLabel = currentMonth.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric'
  })

  const days = useMemo(() => {
    const startDay = new Date(currentMonth)
    const dayIndex = startDay.getDay() === 0 ? 6 : startDay.getDay() - 1
    startDay.setDate(startDay.getDate() - dayIndex)
    return Array.from({ length: 42 }, (_, index) => {
      const date = new Date(startDay)
      date.setDate(startDay.getDate() + index)
      return date
    })
  }, [currentMonth])

  const selectedDate = selected ? new Date(selected) : null

  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-950 p-4">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => {
            const next = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1)
            setCurrentMonth(next)
            onMonthChange?.(next)
          }}
          disabled={disabled}
          className="rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-300"
        >
          Prev
        </button>
        <p className="text-sm font-semibold text-white">{monthLabel}</p>
        <button
          type="button"
          onClick={() => {
            const next = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1)
            setCurrentMonth(next)
            onMonthChange?.(next)
          }}
          disabled={disabled}
          className="rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-300"
        >
          Next
        </button>
      </div>

      <div className="mt-4 grid grid-cols-7 gap-2 text-xs text-slate-400">
        {weekDays.map((day) => (
          <div key={day} className="text-center">
            {day}
          </div>
        ))}
      </div>

      <div className="mt-2 grid grid-cols-7 gap-2">
        {days.map((date) => {
          const isCurrentMonth = date.getMonth() === currentMonth.getMonth()
          const dateKey = formatDate(date)
          const count = counts[dateKey]
          const isDisabled = disabled || date < today || (count !== undefined && count === 0)
          const isSelected = selectedDate ? isSameDay(date, selectedDate) : false
          return (
            <button
              key={date.toISOString()}
              type="button"
              disabled={isDisabled}
              onClick={() => onSelect(formatDate(date))}
              className={`h-12 rounded-xl text-xs transition ${
                isSelected
                  ? 'bg-cyan-400 text-slate-950'
                  : isCurrentMonth
                    ? 'border border-slate-800 text-slate-200 hover:border-slate-500'
                    : 'border border-slate-900 text-slate-600'
              } ${isDisabled ? 'opacity-40' : ''}`}
            >
              <div className="flex flex-col items-center">
                <span>{date.getDate()}</span>
                {count !== undefined && count > 0 && (
                  <span className="mt-1 rounded-full bg-cyan-500/20 px-2 text-[10px] text-cyan-100">
                    {count} slots
                  </span>
                )}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
