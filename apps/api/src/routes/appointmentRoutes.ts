import express from 'express'
import { Role } from '@prisma/client'
import { bookAppointment, cancelAppointment, getMyAppointments } from '../controllers/appointmentController'
import { authMiddleware, roleMiddleware } from '../middleware/auth'

const router = express.Router()

router.post('/', authMiddleware, roleMiddleware(Role.USER), bookAppointment)
router.get('/me', authMiddleware, getMyAppointments)
router.patch('/:appointmentId/cancel', authMiddleware, cancelAppointment)

export default router
