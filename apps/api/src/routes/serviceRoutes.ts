import express from 'express'
import { Role } from '@prisma/client'
import { createService, updateService, setAvailability, getAvailability, replaceAvailability, getServices, getSlots } from '../controllers/serviceController'
import { authMiddleware, roleMiddleware } from '../middleware/auth'

const router = express.Router()

router.post('/', authMiddleware, roleMiddleware(Role.SERVICE_PROVIDER), createService)
router.patch('/:serviceId', authMiddleware, roleMiddleware(Role.SERVICE_PROVIDER), updateService)
router.get('/', getServices)
router.post('/:serviceId/availability', authMiddleware, roleMiddleware(Role.SERVICE_PROVIDER), setAvailability)
router.get('/:serviceId/availability', authMiddleware, roleMiddleware(Role.SERVICE_PROVIDER), getAvailability)
router.put('/:serviceId/availability', authMiddleware, roleMiddleware(Role.SERVICE_PROVIDER), replaceAvailability)
router.get('/:serviceId/slots', getSlots)

export default router
