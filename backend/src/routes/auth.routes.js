import { Router } from 'express'
import {
  login,
  logout,
  forgotPassword,
  resetPassword,
  verifyResetToken,
} from '../controllers/auth.controller.js'
import { authMiddleware } from '../middlewares/authMiddleware.js'

const router = Router()

router.post('/login', login)
router.post('/logout', authMiddleware, logout)
router.post('/forgot-password', forgotPassword)
router.post('/reset-password', resetPassword)
router.get('/verify-reset-token', verifyResetToken) 

export default router
