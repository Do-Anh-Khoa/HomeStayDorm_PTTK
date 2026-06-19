import { Router } from 'express'
import authRoutes from './auth.routes.js'
import userRoutes from './user.routes.js'
import roomRoutes from './room.routes.js'
import { authMiddleware } from '../middlewares/authMiddleware.js'

const router = Router()

router.use('/auth', authRoutes)
router.use('/users', authMiddleware, userRoutes)
router.use('/rooms', authMiddleware, roomRoutes)

export default router
