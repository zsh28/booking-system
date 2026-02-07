import { z } from 'zod'
import { Role, ServiceType } from '@prisma/client'

export const registerSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.nativeEnum(Role)
})

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string()
})

export const createServiceSchema = z.object({
  name: z.string().min(1),
  type: z.nativeEnum(ServiceType),
  durationMinutes: z.number().int().min(30).max(120).refine((val) => val % 30 === 0)
})

export const setAvailabilitySchema = z.object({
  dayOfWeek: z.number().int().min(0).max(6),
  startTime: z.string().regex(/^([01]\d|2[0-3]):([0-3]0)$/, 'Time must be in HH:MM format with minutes 00 or 30'),
  endTime: z.string().regex(/^([01]\d|2[0-3]):([0-3]0)$/, 'Time must be in HH:MM format with minutes 00 or 30')
}).refine((data) => data.startTime < data.endTime, 'Start time must be before end time')

export const dateQuerySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
})

export const bookAppointmentSchema = z.object({
  slotId: z.string()
})

export type RegisterInput = z.infer<typeof registerSchema>
export type LoginInput = z.infer<typeof loginSchema>
export type CreateServiceInput = z.infer<typeof createServiceSchema>
export type SetAvailabilityInput = z.infer<typeof setAvailabilitySchema>
export type BookAppointmentInput = z.infer<typeof bookAppointmentSchema>
