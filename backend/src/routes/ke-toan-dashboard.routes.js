import { Router } from 'express'
import {
  getDashboardSummary,
  getDichVuPhongCanGhiNhan
} from '../controllers/ke-toan-dashboard.controller.js'

const router = Router()


router.get('/dashboard', getDashboardSummary)


router.get('/dashboard/dich-vu-phong', getDichVuPhongCanGhiNhan)

export default router