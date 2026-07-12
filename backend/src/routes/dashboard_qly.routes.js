import { Router } from 'express'
import { getManagerDashboard } from '../controllers/dashboard-qly.controller.js'

const router = Router()

router.get('/manager', getManagerDashboard)

export default router
