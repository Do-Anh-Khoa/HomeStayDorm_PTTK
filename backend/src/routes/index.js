import { Router } from 'express'
import authRoutes from './auth.routes.js'
import userRoutes from './user.routes.js'
import roomRoutes from './room.routes.js'
import { authMiddleware } from '../middlewares/authMiddleware.js'
import dichVuRoutes from './dich-vu.routes.js'
import quyDinhHoanCocRoutes from './quy-dinh-hoan-coc.routes.js'
const router = Router()

router.use('/auth', authRoutes)
router.use('/users', authMiddleware, userRoutes)
router.use('/rooms', authMiddleware, roomRoutes)
router.use('/dich-vu', dichVuRoutes)
router.use('/quy-dinh-hoan-coc', quyDinhHoanCocRoutes)
export default router
