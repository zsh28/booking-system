import express from 'express'
import { Role } from '@prisma/client'
import { getProviderSchedule } from '../controllers/providerController'
import { authMiddleware, roleMiddleware } from '../middleware/auth'

const router = express.Router()

router.get('/me/schedule', authMiddleware, roleMiddleware(Role.SERVICE_PROVIDER), getProviderSchedule)

export default router
