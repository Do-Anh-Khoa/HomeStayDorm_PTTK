import { Router } from 'express'
import {
  login,
  forgotPassword,
  resetPassword,
  verifyResetToken,
} from '../controllers/auth.controller.js'

const router = Router()

router.post('/login', login)
router.post('/forgot-password', forgotPassword)
router.post('/reset-password', resetPassword)
router.get('/verify-reset-token', verifyResetToken) 

export default router