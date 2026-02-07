import express from 'express'
import { Role } from '@prisma/client'
import { createService, setAvailability, getServices, getSlots } from '../controllers/serviceController'
import { authMiddleware, roleMiddleware } from '../middleware/auth'

const router = express.Router()

router.post('/', authMiddleware, roleMiddleware(Role.SERVICE_PROVIDER), createService)
router.get('/', getServices)
router.post('/:serviceId/availability', authMiddleware, roleMiddleware(Role.SERVICE_PROVIDER), setAvailability)
router.get('/:serviceId/slots', getSlots)

export default router
