import { Router } from 'express'
import { getSaleDashboard } from '../controllers/sale-dashboard.controller.js'

const router = Router()

router.get('/', getSaleDashboard)

export default router
