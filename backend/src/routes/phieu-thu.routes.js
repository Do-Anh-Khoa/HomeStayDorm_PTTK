import { Router } from 'express'
import { authMiddleware } from '../middlewares/authMiddleware.js'
import { getCanKiemTraReceipts, getCheckedReceipts, getReceiptDetail, verifyReceipt } from '../controllers/phieu-thu.controller.js'

const router = Router()

router.get('/can-kiem-tra', authMiddleware, getCanKiemTraReceipts)
router.get('/lich-su-kiem-tra', authMiddleware, getCheckedReceipts)
router.get('/:maPhieuThu', authMiddleware, getReceiptDetail)
router.put('/:maPhieuThu/kiem-tra', authMiddleware, verifyReceipt)

export default router
