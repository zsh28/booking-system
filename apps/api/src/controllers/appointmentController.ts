import { Request, Response } from 'express'
import { AppointmentStatus, Prisma, Role } from '@prisma/client'
import { prisma } from '../utils/db'
import { bookAppointmentSchema } from '../types/validators'
import { validateSlotAvailability } from '../utils/slots'
import { addMinutes, isPastDateTime, isValidDate, isValidSlotMinute, isValidTime } from '../utils/time'

type AppointmentWithService = Prisma.AppointmentGetPayload<{
  include: {
    service: {
      select: {
        name: true
        type: true
      }
    }
  }
}>

type AppointmentWithServiceAndProvider = Prisma.AppointmentGetPayload<{
  include: {
    service: {
      select: {
        providerId: true
      }
    }
  }
}>

export const bookAppointment = async (req: Request, res: Response) => {
  try {
    const data = bookAppointmentSchema.parse(req.body)
    const userId = req.user!.userId

    const [serviceId, date, startTime] = data.slotId.split('_')

    if (!serviceId || !date || !startTime) {
      return res.status(400).json({ error: 'Invalid slotId format' })
    }

    if (!isValidDate(date) || !isValidTime(startTime) || !isValidSlotMinute(startTime)) {
      return res.status(400).json({ error: 'Invalid slotId time or date' })
    }

    const service = await prisma.service.findUnique({
      where: { id: serviceId }
    })

    if (!service) {
      return res.status(404).json({ error: 'Service not found' })
    }

    if (service.providerId === userId) {
      return res.status(403).json({ error: 'Service Provider cannot book their own service' })
    }

    const durationMinutes = service.durationMinutes
    if (durationMinutes < 30 || durationMinutes > 120 || durationMinutes % 30 !== 0) {
      return res.status(400).json({ error: 'Invalid service duration' })
    }
    const endTime = addMinutes(startTime, durationMinutes)

    const bookedDate = new Date(date)
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    if (bookedDate < today || isPastDateTime(date, startTime)) {
      return res.status(400).json({ error: 'Cannot book past dates' })
    }

    const availabilities = await prisma.availability.findMany({
      where: { serviceId }
    })

    const appointment = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const appointments = await tx.appointment.findMany({
        where: {
          serviceId,
          date,
          status: AppointmentStatus.BOOKED
        }
      })

      const isAvailable = validateSlotAvailability(
        service,
        date,
        startTime,
        endTime,
        availabilities,
        appointments
      )

      if (!isAvailable) {
        const error = new Error('Slot not available')
        error.name = 'SlotUnavailable'
        throw error
      }

      return tx.appointment.create({
        data: {
          userId,
          serviceId,
          date,
          startTime,
          endTime,
          slotId: data.slotId,
          status: AppointmentStatus.BOOKED
        }
      })
    })

    return res.status(201).json({
      id: appointment.id,
      slotId: appointment.slotId,
      status: appointment.status
    })
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: error.errors })
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return res.status(409).json({ error: 'Slot already booked or not available' })
    }
    if (error && error.name === 'SlotUnavailable') {
      return res.status(409).json({ error: 'Slot already booked or not available' })
    }
    return res.status(500).json({ error: 'Internal server error' })
  }
}

export const getMyAppointments = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId

    const appointments = (await prisma.appointment.findMany({
      where: { userId },
      include: {
        service: {
          select: {
            name: true,
            type: true
          }
        }
      },
      orderBy: { date: 'asc' }
    })) as AppointmentWithService[]

    return res.json(
      appointments.map((appt: AppointmentWithService) => ({
        id: appt.id,
        serviceId: appt.serviceId,
        serviceName: appt.service.name,
        type: appt.service.type,
        date: appt.date,
        startTime: appt.startTime,
        endTime: appt.endTime,
        status: appt.status
      }))
    )
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error' })
  }
}

export const cancelAppointment = async (req: Request, res: Response) => {
  try {
    const appointmentId = Array.isArray(req.params.appointmentId)
      ? req.params.appointmentId[0]
      : req.params.appointmentId
    const userId = req.user!.userId
    const role = req.user!.role

    const appointment = (await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: { service: { select: { providerId: true } } }
    })) as AppointmentWithServiceAndProvider | null

    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' })
    }

    const isUserOwner = appointment.userId === userId
    const isProviderOwner = appointment.service.providerId === userId

    if (role === Role.USER && !isUserOwner) {
      return res.status(403).json({ error: 'Forbidden' })
    }

    if (role === Role.SERVICE_PROVIDER && !isProviderOwner) {
      return res.status(403).json({ error: 'Forbidden' })
    }

    if (appointment.status === AppointmentStatus.CANCELLED) {
      return res.status(409).json({ error: 'Appointment already cancelled' })
    }

    const updated = await prisma.appointment.update({
      where: { id: appointmentId },
      data: { status: AppointmentStatus.CANCELLED }
    })

    return res.json({ id: updated.id, status: updated.status })
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error' })
  }
}
