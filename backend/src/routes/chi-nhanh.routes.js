import { Router } from 'express'
import { getAllChiNhanh, createChiNhanh, updateChiNhanh, deleteChiNhanh } from '../controllers/chi-nhanh.controller.js'

const router = Router()

router.get('/', getAllChiNhanh)
router.post('/', createChiNhanh)
router.put('/:ma', updateChiNhanh)
router.delete('/:ma', deleteChiNhanh)

export default router