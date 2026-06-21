import { Router } from 'express'
import { getAllChiNhanh } from '../controllers/chi-nhanh.controller.js'

const router = Router()

// GET /api/chi-nhanh - Lấy danh sách chi nhánh
router.get('/', getAllChiNhanh)

export default router
