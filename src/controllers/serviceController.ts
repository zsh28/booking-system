import { Request, Response } from 'express'
import { AppointmentStatus, Prisma, ServiceType } from '@prisma/client'
import { prisma } from '../utils/db'
import { createServiceSchema, setAvailabilitySchema, dateQuerySchema } from '../types/validators'
import { generateSlots } from '../utils/slots'

const serviceTypes = Object.values(ServiceType)

type ServiceWithAvailabilities = Prisma.ServiceGetPayload<{
  include: { availabilities: true }
}>

type ServiceWithProvider = Prisma.ServiceGetPayload<{
  include: { provider: { select: { name: true } } }
}>

export const createService = async (req: Request, res: Response) => {
  try {
    const data = createServiceSchema.parse(req.body)
    const providerId = req.user!.userId

    const service = await prisma.service.create({
      data: {
        ...data,
        providerId
      }
    })

    return res.status(201).json({
      id: service.id,
      name: service.name,
      type: service.type,
      durationMinutes: service.durationMinutes
    })
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: error.errors })
    }
    return res.status(500).json({ error: 'Internal server error' })
  }
}

export const setAvailability = async (req: Request, res: Response) => {
  try {
    const serviceId = Array.isArray(req.params.serviceId)
      ? req.params.serviceId[0]
      : req.params.serviceId
    const data = setAvailabilitySchema.parse(req.body)
    const providerId = req.user!.userId

    const service = (await prisma.service.findUnique({
      where: { id: serviceId },
      include: { availabilities: true }
    })) as ServiceWithAvailabilities | null

    if (!service) {
      return res.status(404).json({ error: 'Service not found' })
    }

    if (service.providerId !== providerId) {
      return res.status(403).json({ error: 'Service does not belong to provider' })
    }

    const hasOverlap = service.availabilities.some((avail) => {
      if (avail.dayOfWeek !== data.dayOfWeek) return false
      return data.startTime < avail.endTime && data.endTime > avail.startTime
    })

    if (hasOverlap) {
      return res.status(409).json({ error: 'Overlapping availability' })
    }

    await prisma.availability.create({
      data: {
        serviceId,
        ...data
      }
    })

    return res.status(201).json({ message: 'Availability set successfully' })
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: error.errors })
    }
    return res.status(500).json({ error: 'Internal server error' })
  }
}

export const getServices = async (req: Request, res: Response) => {
  try {
    const rawType = Array.isArray(req.query.type) ? req.query.type[0] : req.query.type
    const type = typeof rawType === 'string' ? rawType : undefined

    if (type && !serviceTypes.includes(type as ServiceType)) {
      return res.status(400).json({ error: 'Invalid service type' })
    }

    const services = (await prisma.service.findMany({
      where: type ? { type: type as ServiceType } : undefined,
      include: { provider: { select: { name: true } } }
    })) as ServiceWithProvider[]

    return res.json(
      services.map((service) => ({
        id: service.id,
        name: service.name,
        type: service.type,
        durationMinutes: service.durationMinutes,
        providerName: service.provider.name
      }))
    )
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error' })
  }
}

export const getSlots = async (req: Request, res: Response) => {
  try {
    const serviceId = Array.isArray(req.params.serviceId)
      ? req.params.serviceId[0]
      : req.params.serviceId
    const query = dateQuerySchema.parse(req.query)
    const date = query.date

    const service = (await prisma.service.findUnique({
      where: { id: serviceId },
      include: { availabilities: true }
    })) as ServiceWithAvailabilities | null

    if (!service) {
      return res.status(404).json({ error: 'Service not found' })
    }

    const bookedDate = new Date(date)
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    if (bookedDate < today) {
      return res.status(400).json({ error: 'Cannot book past dates' })
    }

    const appointments = await prisma.appointment.findMany({
      where: {
        serviceId,
        date,
        status: AppointmentStatus.BOOKED
      }
    })

    const slots = generateSlots(
      service,
      date,
      service.availabilities,
      appointments
    )

    return res.json({
      serviceId,
      date,
      slots
    })
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: error.errors })
    }
    return res.status(500).json({ error: 'Internal server error' })
  }
}
