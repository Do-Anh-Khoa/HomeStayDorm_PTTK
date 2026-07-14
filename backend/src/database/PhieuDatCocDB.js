import prisma from '../config/prisma.js'

// Hệ số đặt cọc: 2 tháng tiền phòng
export const HE_SO_DAT_COC = 2

class PhieuDatCocDB {
  // LoadDSPDCChuaLap(maCN, tuKhoa?): PhieuDatCoc[]
  // - Chỉ lấy PDC có nv_sale CÙNG CHI NHÁNH (maCN) với kế toán đang đăng nhập.
  // - Chỉ lấy PDC đang "Chờ thanh toán" (đủ điều kiện lập PTDC).
  // - Loại các PDC đã có phiếu thu đặt cọc tương ứng rồi.
  static async LoadDSPDCChuaLap(maCN, tuKhoa = '') {
    const rows = await prisma.$queryRaw`
      SELECT pdc.ma_pdc AS "maPDC", pdc.ngay_dc AS "ngayDC", pdc.trang_thai AS "trangThai",
             pdc.khach_dat AS "khachDat", pdc.nv_sale AS "nvSale",
             kh.ten_kh AS "tenKH"
      FROM phieu_dat_coc pdc
      JOIN khach_hang kh ON kh.ma_kh = pdc.khach_dat
      JOIN nhanvien nv ON nv.ma_nv = pdc.nv_sale
      WHERE nv.ma_cn = ${maCN}
        AND pdc.trang_thai = 'Chờ thanh toán'
        AND NOT EXISTS (
          SELECT 1 FROM pt_dat_coc ptdc WHERE ptdc.ma_pdc = pdc.ma_pdc
        )
        AND (
          ${tuKhoa} = '' OR
          pdc.ma_pdc ILIKE '%' || ${tuKhoa} || '%' OR
          kh.ten_kh ILIKE '%' || ${tuKhoa} || '%'
        )
      ORDER BY pdc.ngay_dc ASC
    `
    return rows
  }

  static async TimKiemPDC(tuKhoa, maCN) {
    return this.LoadDSPDCChuaLap(maCN, tuKhoa)
  }

  static async LoadPDC(maPDC) {
    const rows = await prisma.$queryRaw`
      SELECT pdc.ma_pdc AS "maPDC", pdc.ngay_dc AS "ngayDC", pdc.trang_thai AS "trangThai",
             pdc.khach_dat AS "maKH", pdc.nv_sale AS "maNVSale",
             kh.ten_kh AS "tenKH", kh.cccd AS "cccd", kh.sdt AS "sdt",
             nv.ten_nv AS "tenNVSale"
      FROM phieu_dat_coc pdc
      JOIN khach_hang kh ON kh.ma_kh = pdc.khach_dat
      JOIN nhanvien nv ON nv.ma_nv = pdc.nv_sale
      WHERE pdc.ma_pdc = ${maPDC}
    `
    return rows[0] || null
  }

  static async LoadPDCTheoKhach(maKH) {
    const rows = await prisma.$queryRaw`
      SELECT pdc.ma_pdc AS "maPDC", pdc.ngay_dc AS "ngayDC", pdc.trang_thai AS "trangThai",
             pdc.khach_dat AS "maKH", pdc.nv_sale AS "maNVSale"
      FROM phieu_dat_coc pdc
      WHERE pdc.khach_dat = ${maKH}
      ORDER BY pdc.ngay_dc DESC
      LIMIT 1
    `
    return rows[0] || null
  }

  static async KiemTraDuDieuKienLapPTDC(maPDC) {
    const rows = await prisma.$queryRaw`
      SELECT 1 FROM phieu_dat_coc
      WHERE ma_pdc = ${maPDC} AND trang_thai = 'Chờ thanh toán'
      LIMIT 1
    `
    return rows.length > 0
  }

  static async CapNhatQuaHan() {
    await prisma.$queryRaw`SELECT sp_cap_nhat_phieu_dat_coc_qua_han()`
  }

  // Cập nhật trạng thái phiếu thu - Sale
  static async CapNhatCacPhieuQuaHan() {
    const rows = await prisma.$queryRaw`
      SELECT sp_cap_nhat_phieu_dat_coc_qua_han() AS "soDong"
    `

    return Number(rows[0]?.soDong || 0)
  }

  static async LayTheoMaDatCoc(maPDC) {
    const rows = await prisma.$queryRaw`
      SELECT pdc.ma_pdc     AS "maPDC",
             pdc.ngay_dc    AS "ngayDC",
             pdc.trang_thai AS "trangThai",
             pdc.khach_dat  AS "maKH",
             kh.ten_kh      AS "tenKH",
             kh.cccd        AS "cccd",
             kh.sdt         AS "sdt",
             kh.email       AS "emailKH",
             pdc.nv_sale    AS "maNVSale"
      FROM phieu_dat_coc pdc
      JOIN khach_hang kh ON kh.ma_kh = pdc.khach_dat
      WHERE pdc.ma_pdc = ${maPDC}
      LIMIT 1
    `

    return rows[0] || null
  }

  static async CapNhatTrangThaiChoDoiDuyet(maPDC) {
    const rows = await prisma.$queryRaw`
      UPDATE phieu_dat_coc
      SET trang_thai = 'Chờ Duyệt'
      WHERE ma_pdc = ${maPDC}
        AND trang_thai = 'Chờ thanh toán'
      RETURNING ma_pdc AS "maPDC"
    `

    return rows.length > 0
  }
}

export default PhieuDatCocDB