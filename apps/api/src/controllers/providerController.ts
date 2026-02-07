import { Request, Response } from 'express'
import { AppointmentStatus, Prisma } from '@prisma/client'
import { prisma } from '../utils/db'
import { dateQuerySchema } from '../types/validators'

type ProviderScheduleService = Prisma.ServiceGetPayload<{
  include: {
    appointments: {
      include: {
        user: {
          select: { name: true }
        }
      }
    }
  }
}>

export const getProviderSchedule = async (req: Request, res: Response) => {
  try {
    const query = dateQuerySchema.parse(req.query)
    const providerId = req.user!.userId
    const date = query.date

    const services = (await prisma.service.findMany({
      where: { providerId },
      include: {
        appointments: {
          where: { date, status: AppointmentStatus.BOOKED },
          include: {
            user: {
              select: { name: true }
            }
          },
          orderBy: { startTime: 'asc' }
        }
      }
    })) as ProviderScheduleService[]

    const schedule = {
      date,
      services: services.map((service: ProviderScheduleService) => ({
        serviceId: service.id,
        serviceName: service.name,
        appointments: service.appointments.map((appt) => ({
          appointmentId: appt.id,
          userName: appt.user.name,
          startTime: appt.startTime,
          endTime: appt.endTime,
          status: appt.status
        }))
      }))
    }

    return res.json(schedule)
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: error.errors })
    }
    return res.status(500).json({ error: 'Internal server error' })
  }
}
