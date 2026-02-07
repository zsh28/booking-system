import express from 'express'
import { Role } from '@prisma/client'
import { getProviderSchedule, getProviderServices } from '../controllers/providerController'
import { authMiddleware, roleMiddleware } from '../middleware/auth'

const router = express.Router()

router.get('/me/schedule', authMiddleware, roleMiddleware(Role.SERVICE_PROVIDER), getProviderSchedule)
router.get('/me/services', authMiddleware, roleMiddleware(Role.SERVICE_PROVIDER), getProviderServices)

export default router
