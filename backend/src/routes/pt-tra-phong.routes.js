import { Router } from 'express'
import {
  cancelPtTraPhongPreview,
  createPtTraPhong,
  getPtTraPhongPageData,
  getPtTraPhongPreview,
  getPtTraPhongReceiptDetail,
  exportPtTraPhongPdf,
} from '../controllers/pt-tra-phong.controller.js'

const router = Router()

router.get('/', getPtTraPhongPageData)
router.get('/preview/:ma_tp', getPtTraPhongPreview)
router.get('/receipt/:ma_pttp', getPtTraPhongReceiptDetail)
router.post('/cancel/:ma_tp', cancelPtTraPhongPreview)
router.post('/:ma_tp', createPtTraPhong)
router.get('/receipt/:ma_pttp/pdf', exportPtTraPhongPdf)
export default router