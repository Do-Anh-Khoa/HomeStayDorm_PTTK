import { Router } from 'express'
import {
  getDanhSachLichHen,
  getDanhSachHoSoChoDatLich,
  getChiTietLichHen,
  taoLichHen,
  suaLichHen,
  huyLichHen
} from '../controllers/lich-hen.controller.js'

const router = Router()

// Danh sách lịch hẹn của NV Sale hiện tại (?ngay=, hoặc ?thang=&nam=, hoặc không truyền gì)
router.get('/', getDanhSachLichHen)

// Danh sách hồ sơ đăng ký "Mới tiếp nhận" để đổ vào dropdown khi đặt lịch mới
router.get('/ho-so-dang-ky', getDanhSachHoSoChoDatLich)

// Chi tiết 1 lịch hẹn
router.get('/:maLich', getChiTietLichHen)

// Đặt lịch hẹn mới
router.post('/', taoLichHen)

// Sửa giờ hẹn của 1 lịch đã có
router.put('/:maLich', suaLichHen)

// Hủy lịch hẹn
router.delete('/:maLich', huyLichHen)

export default router