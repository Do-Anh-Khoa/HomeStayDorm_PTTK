import { Router } from 'express'
import { getPhuTrachDashboard } from '../controllers/phu-trach-dashboard.controller.js'

const router = Router()

router.get('/', getPhuTrachDashboard)

export default router