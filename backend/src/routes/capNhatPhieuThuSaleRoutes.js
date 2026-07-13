import { Router } from 'express'
import {
  loadChiTietPhieuThu,
  loadDanhSachCanCapNhat,
  loadLichSuCapNhat,
  xacNhanThanhToan,
} from '../controllers/capNhatPhieuThuSaleController.js'

const router = Router()

router.use((req, res, next) => {
  if (req.auth?.loai_nv && req.auth.loai_nv !== 'SALE') {
    return res.status(403).json({ message: 'Chỉ Nhân viên Sale được truy cập chức năng này.' })
  }
  next()
})

router.get('/can-cap-nhat', loadDanhSachCanCapNhat)
router.get('/lich-su', loadLichSuCapNhat)
router.get('/:loaiPT/:maPT', loadChiTietPhieuThu)
router.patch('/:loaiPT/:maPT/xac-nhan-thanh-toan', xacNhanThanhToan)

export default router
