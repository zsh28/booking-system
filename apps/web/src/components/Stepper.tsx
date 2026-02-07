const steps = ['Service', 'Date', 'Slots']

export default function Stepper({ active }: { active: number }) {
  return (
    <div className="flex items-center gap-4">
      {steps.map((label, index) => {
        const step = index + 1
        const isActive = active === step
        const isDone = active > step
        return (
          <div key={label} className="flex items-center gap-3">
            <div
              className={`flex h-9 w-9 items-center justify-center rounded-full border text-sm font-semibold ${
                isActive
                  ? 'border-cyan-400 bg-cyan-500/20 text-cyan-100'
                  : isDone
                    ? 'border-emerald-400 bg-emerald-500/20 text-emerald-100'
                    : 'border-slate-700 text-slate-400'
              }`}
            >
              {step}
            </div>
            <span
              className={`text-sm ${
                isActive ? 'text-white' : isDone ? 'text-emerald-100' : 'text-slate-400'
              }`}
            >
              {label}
            </span>
            {step !== steps.length && (
              <span className="h-px w-10 bg-slate-800" />
            )}
          </div>
        )
      })}
    </div>
  )
}
