import { Router } from 'express'
import { getAllLoaiPhong, createLoaiPhong, updateLoaiPhong, deleteLoaiPhong } from '../controllers/loai-phong.controller.js'

const router = Router()

router.get('/', getAllLoaiPhong)
router.post('/', createLoaiPhong)
router.put('/:ma', updateLoaiPhong)
router.delete('/:ma', deleteLoaiPhong)

export default router