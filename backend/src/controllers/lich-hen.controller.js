import prisma from '../config/prisma.js'
import { guiEmailXacNhanLichHen } from '../utils/guiMailLichHen.js'

const getCurrentEmployee = async (req) => {
  const maNv = req.auth?.ma_nv || req.authSession?.ma_nv || null
  if (!maNv) return null

  const rows = await prisma.$queryRaw`
    SELECT ma_nv, ma_cn, ten_nv, sdt 
    FROM nhanvien 
    WHERE ma_nv = ${maNv} 
    LIMIT 1
  `
  return rows[0] || null
}

// B4 trong luồng chính: "Hệ thống kiểm tra thời gian hẹn" -> A4 nếu không hợp lệ
const kiemTraThoiGianHen = (tgHen) => {
  const date = new Date(tgHen)
  if (Number.isNaN(date.getTime())) return false
  // Không cho đặt lịch ở thời điểm đã qua
  return date.getTime() > Date.now()
}

// =========================================================
// 1.1/2.1 LoadDanhSachLichHen(maNV, ngay) -> LayTheoNV(maNV, ngay)
// - Không truyền ngay/thang/nam: lấy toàn bộ lịch hẹn của NV (đổ badge lên lịch tháng)
// - Truyền thang & nam: lọc theo tháng đang xem trên calendar
// - Truyền ngay: lọc đúng 1 ngày (bảng "Chi tiết ngày ..." bên phải)
// =========================================================
export const getDanhSachLichHen = async (req, res) => {
  try {
    const employee = await getCurrentEmployee(req)
    if (!employee) {
      return res.status(401).json({ message: 'Không tìm thấy thông tin nhân viên' })
    }
    const { ma_nv: maNV } = employee
    const { ngay, thang, nam } = req.query

    let rows
    if (ngay) {
      // Lấy theo ngày cụ thể (Bảng chi tiết bên phải)
      rows = await prisma.$queryRaw`
        SELECT lh.ma_lich, lh.ma_dk, lh.tg_hen,
               kh.ten_kh, kh.sdt, hsdk.trang_thai
        FROM lich_hen_xem_phong lh
        JOIN ho_so_dang_ky hsdk ON lh.ma_dk = hsdk.ma_dk
        JOIN khach_hang kh ON hsdk.khach_hang = kh.ma_kh
        WHERE lh.nv_sale = ${employee.ma_nv}
          -- Ép về múi giờ VN trước khi so sánh ngày
          AND (lh.tg_hen AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Ho_Chi_Minh')::date = ${ngay}::date
        ORDER BY lh.tg_hen ASC
      `
    } else if (thang && nam) {
      // Lấy theo tháng/năm (Đổ badge lên Calendar)
      rows = await prisma.$queryRaw`
        SELECT lh.ma_lich, lh.ma_dk, lh.tg_hen
        FROM lich_hen_xem_phong lh
        WHERE lh.nv_sale = ${employee.ma_nv}
          -- Ép về múi giờ VN trước khi rút trích Tháng/Năm
          AND EXTRACT(MONTH FROM (lh.tg_hen AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Ho_Chi_Minh')) = ${Number(thang)}
          AND EXTRACT(YEAR FROM (lh.tg_hen AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Ho_Chi_Minh')) = ${Number(nam)}
      `
    } else {
      rows = await prisma.$queryRaw`
        SELECT lh.ma_lich, lh.tg_hen, lh.ma_dk, hsdk.trang_thai AS trang_thai_ho_so,
               kh.ma_kh, kh.ten_kh, kh.email, kh.sdt
        FROM lich_hen_xem_phong lh
        JOIN ho_so_dang_ky hsdk ON lh.ma_dk = hsdk.ma_dk
        JOIN khach_hang kh ON hsdk.khach_hang = kh.ma_kh
        WHERE lh.nv_sale = ${maNV}
        ORDER BY lh.tg_hen ASC
      `
    }

    res.json({ data: rows })
  } catch (error) {
    console.error('Lỗi getDanhSachLichHen:', error)
    res.status(500).json({ message: 'Lỗi server khi lấy danh sách lịch hẹn' })
  }
}

// =========================================================
// 10.2 LoadDanhSachHoSo(maCNHienTai) -> LayDanhSach(maCN)
// Danh sách hồ sơ đăng ký "Mới tiếp nhận" trong chi nhánh để đổ vào
// dropdown "Chọn mã hồ sơ..." khi đặt lịch hẹn mới
// =========================================================
export const getDanhSachHoSoChoDatLich = async (req, res) => {
  try {
    const employee = await getCurrentEmployee(req)
    if (!employee) {
      return res.status(401).json({ message: 'Không tìm thấy thông tin nhân viên' })
    }
    const { ma_cn: maCN } = employee

    const rows = await prisma.$queryRaw`
      SELECT hsdk.ma_dk, hsdk.ngay_lap, hsdk.trang_thai, hsdk.thoi_gian_vao,
             kh.ma_kh, kh.ten_kh, kh.email, kh.sdt
      FROM ho_so_dang_ky hsdk
      JOIN khach_hang kh ON hsdk.khach_hang = kh.ma_kh
      WHERE hsdk.chi_nhanh = ${maCN}
        AND hsdk.trang_thai = 'Mới tiếp nhận'
      ORDER BY hsdk.ngay_lap DESC
    `

    res.json({ data: rows })
  } catch (error) {
    console.error('Lỗi getDanhSachHoSoChoDatLich:', error)
    res.status(500).json({ message: 'Lỗi server khi lấy danh sách hồ sơ đăng ký' })
  }
}

// =========================================================
// 3.2/6.2 LoadChiTietLich(maLich) -> LayTheoMa(maLich)
// Chi tiết 1 lịch hẹn - dùng cho modal "Chi tiết lịch xem phòng" và modal "Sửa lịch hẹn"
// =========================================================
export const getChiTietLichHen = async (req, res) => {
  try {
    const employee = await getCurrentEmployee(req)
    if (!employee) {
      return res.status(401).json({ message: 'Không tìm thấy thông tin nhân viên' })
    }
    const { maLich } = req.params

    const rows = await prisma.$queryRaw`
      SELECT lh.ma_lich, lh.tg_hen, lh.ma_dk, hsdk.trang_thai AS trang_thai_ho_so,
             kh.ma_kh, kh.ten_kh, kh.email, kh.sdt
      FROM lich_hen_xem_phong lh
      JOIN ho_so_dang_ky hsdk ON lh.ma_dk = hsdk.ma_dk
      JOIN khach_hang kh ON hsdk.khach_hang = kh.ma_kh
      WHERE lh.ma_lich = ${Number(maLich)} AND lh.nv_sale = ${employee.ma_nv}
      LIMIT 1
    `

    const info = rows[0]
    if (!info) {
      return res.status(404).json({ message: 'Không tìm thấy lịch hẹn' })
    }

    res.json({ data: info })
  } catch (error) {
    console.error('Lỗi getChiTietLichHen:', error)
    res.status(500).json({ message: 'Lỗi server khi lấy chi tiết lịch hẹn' })
  }
}

// =========================================================
// 11.1 TaoLichHen(lichHen): boolean
// B2-B7 luồng sự kiện chính: nhập giờ hẹn -> B4 kiểm tra thời gian (A4) ->
// B5 tạo bản ghi + cập nhật hồ sơ "Đã hẹn" -> B6 gửi email (A6) -> B7 thông báo
// =========================================================
export const taoLichHen = async (req, res) => {
  try {
    const employee = await getCurrentEmployee(req)
    if (!employee) {
      return res.status(401).json({ message: 'Không tìm thấy thông tin nhân viên' })
    }
    const { ma_dk: maDK, tg_hen: tgHen } = req.body || {}

    if (!maDK || !tgHen) {
      return res.status(400).json({ message: 'Vui lòng chọn hồ sơ đăng ký và nhập thời gian hẹn' })
    }

    // ---- B4 / A4: kiểm tra thời gian hẹn ----
    if (!kiemTraThoiGianHen(tgHen)) {
      return res.status(400).json({
        message: 'Thời gian hẹn không hợp lệ. Vui lòng chọn một thời điểm trong tương lai.'
      })
    }

    // ---- Kiểm tra hồ sơ đăng ký hợp lệ để đặt lịch ----
    const hsRows = await prisma.$queryRaw`
      SELECT hsdk.ma_dk, hsdk.trang_thai, kh.ma_kh, kh.ten_kh, kh.email
      FROM ho_so_dang_ky hsdk
      JOIN khach_hang kh ON hsdk.khach_hang = kh.ma_kh
      WHERE hsdk.ma_dk = ${maDK}
      LIMIT 1
    `
    const hoSo = hsRows[0]
    if (!hoSo) {
      return res.status(404).json({ message: 'Không tìm thấy hồ sơ đăng ký' })
    }
    if (hoSo.trang_thai !== 'Mới tiếp nhận') {
      return res.status(409).json({
        message: `Hồ sơ này đang ở trạng thái "${hoSo.trang_thai}", không thể đặt lịch hẹn mới`
      })
    }

    // ---- B5: tạo bản ghi lịch hẹn + cập nhật trạng thái hồ sơ "Đã hẹn" ----
    const maLich = await prisma.$transaction(async (tx) => {
      const [newLich] = await tx.$queryRaw`
        INSERT INTO lich_hen_xem_phong (tg_hen, ma_dk, nv_sale)
        VALUES (${new Date(tgHen)}, ${maDK}, ${employee.ma_nv})
        RETURNING ma_lich
      `
      await tx.$executeRaw`
        UPDATE ho_so_dang_ky SET trang_thai = 'Đã hẹn' WHERE ma_dk = ${maDK}
      `
      return newLich.ma_lich
    })

    // ---- B6 / A6: gửi email xác nhận ----
    const guiThanhCong = await guiEmailXacNhanLichHen({
      email: hoSo.email,
      tenKH: hoSo.ten_kh,
      maDK,
      tgHen,
      tenNVSale: employee.ten_nv,
      sdtNVSale: employee.sdt
    })

    // ---- B7: thông báo thành công (kèm cảnh báo nếu gửi mail thất bại - A6) ----
    res.status(201).json({
      message: guiThanhCong
        ? 'Đặt lịch hẹn thành công. Email xác nhận đã được gửi đến khách hàng.'
        : 'Lưu lịch hẹn thành công nhưng gửi email xác nhận thất bại. Vui lòng liên hệ thủ công cho khách hàng.',
      data: { ma_lich: maLich, gui_email_thanh_cong: guiThanhCong }
    })
  } catch (error) {
    console.error('Lỗi taoLichHen:', error)
    res.status(500).json({ message: 'Lỗi server khi tạo lịch hẹn' })
  }
}

// =========================================================
// 7.1 SuaLichHen(lichHen): boolean
// Sửa giờ hẹn của 1 lịch đã có -> kiểm tra thời gian (A4) -> Sua() -> gửi lại email (A6)
// =========================================================
export const suaLichHen = async (req, res) => {
  try {
    const employee = await getCurrentEmployee(req)
    if (!employee) {
      return res.status(401).json({ message: 'Không tìm thấy thông tin nhân viên' })
    }
    const { maLich } = req.params
    const { tg_hen: tgHen } = req.body || {}

    if (!tgHen) {
      return res.status(400).json({ message: 'Vui lòng nhập thời gian hẹn mới' })
    }
    if (!kiemTraThoiGianHen(tgHen)) {
      return res.status(400).json({
        message: 'Thời gian hẹn không hợp lệ. Vui lòng chọn một thời điểm trong tương lai.'
      })
    }

    const rows = await prisma.$queryRaw`
      SELECT lh.ma_lich, lh.ma_dk, kh.ten_kh, kh.email
      FROM lich_hen_xem_phong lh
      JOIN ho_so_dang_ky hsdk ON lh.ma_dk = hsdk.ma_dk
      JOIN khach_hang kh ON hsdk.khach_hang = kh.ma_kh
      WHERE lh.ma_lich = ${Number(maLich)} AND lh.nv_sale = ${employee.ma_nv}
      LIMIT 1
    `
    const lich = rows[0]
    if (!lich) {
      return res.status(404).json({ message: 'Không tìm thấy lịch hẹn' })
    }

    await prisma.$executeRaw`
      UPDATE lich_hen_xem_phong SET tg_hen = ${new Date(tgHen)} WHERE ma_lich = ${Number(maLich)}
    `

    const guiThanhCong = await guiEmailXacNhanLichHen({
      email: lich.email,
      tenKH: lich.ten_kh,
      maDK: lich.ma_dk,
      tgHen,
      tenNVSale: employee.ten_nv,
      sdtNVSale: employee.sdt
    })

    res.json({
      message: guiThanhCong
        ? 'Cập nhật lịch hẹn thành công. Email xác nhận đã được gửi lại đến khách hàng.'
        : 'Lưu lịch hẹn thành công nhưng gửi email xác nhận thất bại. Vui lòng liên hệ thủ công cho khách hàng.',
      data: { ma_lich: Number(maLich), gui_email_thanh_cong: guiThanhCong }
    })
  } catch (error) {
    console.error('Lỗi suaLichHen:', error)
    res.status(500).json({ message: 'Lỗi server khi cập nhật lịch hẹn' })
  }
}

// =========================================================
// 9.1 HuyLichHen(maLich): boolean -> Huy(maLich)
// Hủy lịch hẹn: xóa bản ghi và trả hồ sơ đăng ký về "Mới tiếp nhận"
// (giả định nghiệp vụ hợp lý để hồ sơ có thể được đặt lịch lại)
// =========================================================
export const huyLichHen = async (req, res) => {
  try {
    const employee = await getCurrentEmployee(req)
    if (!employee) {
      return res.status(401).json({ message: 'Không tìm thấy thông tin nhân viên' })
    }
    const { maLich } = req.params

    const rows = await prisma.$queryRaw`
      SELECT lh.ma_lich, lh.ma_dk, hsdk.trang_thai
      FROM lich_hen_xem_phong lh
      JOIN ho_so_dang_ky hsdk ON lh.ma_dk = hsdk.ma_dk
      WHERE lh.ma_lich = ${Number(maLich)} AND lh.nv_sale = ${employee.ma_nv}
      LIMIT 1
    `
    const lich = rows[0]
    if (!lich) {
      return res.status(404).json({ message: 'Không tìm thấy lịch hẹn' })
    }

    await prisma.$transaction(async (tx) => {
      await tx.$executeRaw`
        DELETE FROM lich_hen_xem_phong WHERE ma_lich = ${Number(maLich)}
      `
      if (lich.trang_thai === 'Đã hẹn') {
        await tx.$executeRaw`
          UPDATE ho_so_dang_ky SET trang_thai = 'Mới tiếp nhận' WHERE ma_dk = ${lich.ma_dk}
        `
      }
    })

    res.json({ message: 'Hủy lịch hẹn thành công' })
  } catch (error) {
    console.error('Lỗi huyLichHen:', error)
    res.status(500).json({ message: 'Lỗi server khi hủy lịch hẹn' })
  }
}