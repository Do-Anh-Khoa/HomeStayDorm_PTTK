import { Router } from 'express'
import { authMiddleware } from '../middlewares/authMiddleware.js'
import {
  getDichVuList,
  createDichVu,
  updateDichVu,
  deleteDichVu,
} from '../controllers/dich-vu.controller.js'
import {
  getDichVuPhongList,
  ghiNhanDichVu,
  getChoThanhToan,
  xacNhanThanhToan,
} from '../controllers/dich-vu-phong.controller.js'

const router = Router()

router.use(authMiddleware)

router.get('/',        getDichVuList)
router.get('/phong',   getDichVuPhongList)
router.post('/',       createDichVu)
router.post('/ghi-nhan', ghiNhanDichVu)
router.put('/:ma',     updateDichVu)
router.delete('/:ma',  deleteDichVu)
router.get('/cho-thanh-toan', getChoThanhToan)
router.post('/xac-nhan-thanh-toan', xacNhanThanhToan)

export default router