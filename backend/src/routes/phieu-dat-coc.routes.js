import { Router } from 'express'
import { createPhieuDatCoc, getPhieuDatCocList, cancelPhieuDatCoc,  printPhieuDatCoc } from '../controllers/phieu-dat-coc.controller.js'

const router = Router()


router.get('/', getPhieuDatCocList)
router.post('/', createPhieuDatCoc)
router.patch('/:maPDC/cancel', cancelPhieuDatCoc); 
router.get('/:maPDC/print', printPhieuDatCoc);
export default router