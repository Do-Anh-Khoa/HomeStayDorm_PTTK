import prisma from '../config/prisma.js'
import {
  cancelHoSoTraPhong,
  createHoSoTraPhong,
  getChiTietHoSoTraPhong,
  listHoSoTraPhong,
  searchKhachTraPhong,
} from '../database/ho-so-tra-phong.database.js'
import { guiEmailLichHenTraPhong } from '../utils/guiMailLichHenTraPhong.js'

async function getCurrentEmployee(req) {
  const maNV = req.auth?.ma_nv
  if (!maNV) {
    const error = new Error('Bạn chưa đăng nhập.')
    error.status = 401
    throw error
  }

  const employee = await prisma.nhanvien.findUnique({
    where: { ma_nv: maNV },
    select: { ma_nv: true, ma_cn: true },
  })

  if (!employee) {
    const error = new Error('Không tìm thấy thông tin nhân viên.')
    error.status = 401
    throw error
  }

  return employee
}

export async function timKiemKhachThueTraPhong(req, res, next) {
  try {
    const employee = await getCurrentEmployee(req)
    const keyword = String(req.query.keyword || req.query.q || '').trim()

    const results = await searchKhachTraPhong({
      keyword,
      maCn: employee.ma_cn,
    })

    res.json({ data: results })
  } catch (error) {
    next(error)
  }
}

export async function lapHoSoTraPhong(req, res, next) {
  try {
    const employee = await getCurrentEmployee(req)

    const payload = req.body || {}
    const maPdc = payload.maPdc || payload.ma_pdc || ''
    const maHopDong = payload.maHopDong || payload.ma_hdt || payload.maHdt || ''
    const maKhachThue = payload.maKhachThue || payload.ma_khach_thue || payload.maKhach || ''
    const ngayTraPhongDuKien = payload.ngayTraPhongDuKien || payload.ngay_tra_phong_du_kien || payload.ngayTraPhong || ''

    const created = await createHoSoTraPhong({
      maPdc,
      maHopDong,
      maKhachThue,
      ngayTraPhongDuKien,
      maNVSale: employee.ma_nv,
      maCn: employee.ma_cn,
    })

    let emailSent = false
    let message = 'Lập hồ sơ trả phòng thành công.'

    if (created.canSendEmail) {
      const mailInfo = created.mailInfo || {}
      emailSent = await guiEmailLichHenTraPhong({
        email: mailInfo.email,
        tenKhachHang: mailInfo.tenKhachHang,
        maTP: created.maTP,
        tgHen: created.tgHen,
        phongGiuong: mailInfo.phongGiuong,
      })

      message = emailSent
        ? 'Lập hồ sơ trả phòng thành công.'
        : 'Tạo lịch hẹn thành công nhưng gửi email thất bại.'
    }

    res.json({
      data: {
        maTP: created.maTP,
        emailSent,
        message,
      },
    })
  } catch (error) {
    next(error)
  }
}

export async function loadDanhSachHoSoTraPhong(req, res, next) {
  try {
    const employee = await getCurrentEmployee(req)
    const rows = await listHoSoTraPhong({ maCn: employee.ma_cn })
    res.json({ data: rows })
  } catch (error) {
    next(error)
  }
}

export async function xemChiTietHoSoTraPhong(req, res, next) {
  try {
    const employee = await getCurrentEmployee(req)
    const maTP = String(req.params.maTP || req.params.ma_tp || '').trim()

    const detail = await getChiTietHoSoTraPhong({ maTP, maCn: employee.ma_cn })

    res.json({ data: detail })
  } catch (error) {
    next(error)
  }
}

export async function huyHoSoTraPhong(req, res, next) {
  try {
    const employee = await getCurrentEmployee(req)
    const maTP = String(req.params.maTP || req.params.ma_tp || '').trim()

    await cancelHoSoTraPhong({ maTP, maCn: employee.ma_cn })

    res.json({
      data: true,
      message: 'Hủy hồ sơ trả phòng thành công.',
    })
  } catch (error) {
    next(error)
  }
}
