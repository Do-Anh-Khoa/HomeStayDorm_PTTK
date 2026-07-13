import { Router } from 'express'
import { 
  getBanGiaoPageData,
  getBanGiaoDetail, 
  createBienBanBanGiao,
  getBienBanHistoryDetail 
} from '../controllers/ban-giao.controller.js'

const router = Router()

router.get('/', getBanGiaoPageData)
router.get('/history/:ma_hdt', getBienBanHistoryDetail) 
router.get('/:ma_hdt', getBanGiaoDetail) 
router.post('/:ma_hdt', createBienBanBanGiao) 

export default router