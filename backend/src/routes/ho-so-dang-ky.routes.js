import { Router } from 'express'
import {
  createHoSoDangKy,
  getHoSoDangKyDetail,
  getHoSoDangKyFormOptions,
  getHoSoDangKyList,
  updateHoSoDangKy, 
  cancelHoSoDangKy  
} from '../controllers/ho-so-dang-ky.controller.js'

const router = Router()

router.get('/form-options', getHoSoDangKyFormOptions)
router.get('/', getHoSoDangKyList)
router.get('/:maDk', getHoSoDangKyDetail)
router.post('/', createHoSoDangKy)
router.put('/:maDk', updateHoSoDangKy) 
router.patch('/:maDk/cancel', cancelHoSoDangKy)
export default router
