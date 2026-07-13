import prisma from '../config/prisma.js'

class PhieuThuDatCocDB {
  static async KiemTraTonTaiTheoPDC(maPDC) {
    const rows = await prisma.$queryRaw`
      SELECT 1 FROM pt_dat_coc WHERE ma_pdc = ${maPDC} LIMIT 1
    `
    return rows.length > 0
  }

  // LoadPTTheoMaPDC(maPDC): PhieuThuDatCoc 
  static async LoadPTTheoMaPDC(maPDC) {
    const rows = await prisma.$queryRaw`
      SELECT ma_ptdc AS "maPTDC", ngay AS "ngay", ngay_thanh_toan AS "ngayThanhToan",
             ghi_chu AS "ghiChu", trang_thai AS "trangThai", tong_tien AS "tongTien",
             nv_ke_toan AS "maNVKeToan", nv_cap_nhat AS "maNVCapNhat", ma_pdc AS "maPDC"
      FROM pt_dat_coc WHERE ma_pdc = ${maPDC}
    `
    return rows[0] || null
  }

  // ThemPTDC({ maPDC, tongTien, nvKeToan }): PhieuThuDatCoc
  static async ThemPTDC({ maPDC, tongTien, nvKeToan }) {
  const rows = await prisma.$queryRaw`
    INSERT INTO pt_dat_coc
      (ngay, trang_thai, tong_tien, nv_ke_toan, nv_cap_nhat, ma_pdc)
    VALUES
      (CURRENT_TIMESTAMP, 'Chưa thanh toán', ${tongTien}, ${nvKeToan}, NULL, ${maPDC})
    RETURNING ma_ptdc         AS "maPTDC",
              ngay            AS "ngay",
              ngay_thanh_toan AS "ngayThanhToan",
              ghi_chu         AS "ghiChu",
              trang_thai      AS "trangThai",
              tong_tien       AS "tongTien",
              nv_ke_toan      AS "maNVKeToan",
              nv_cap_nhat     AS "maNVCapNhat",
              ma_pdc          AS "maPDC"
  `
  return rows[0]
}

  // LoadPTDC(maPTDC): PhieuThuDatCoc — kèm KH + NV Sale + NV Kế toán
  static async LoadPTDC(maPTDC) {
    const rows = await prisma.$queryRaw`
      SELECT ptdc.ma_ptdc         AS "maPTDC",
             ptdc.ngay            AS "ngay",
             ptdc.ngay_thanh_toan AS "ngayThanhToan",
             ptdc.ghi_chu         AS "ghiChu",
             ptdc.trang_thai      AS "trangThai",
             ptdc.tong_tien       AS "tongTien",
             ptdc.nv_ke_toan      AS "maNVKeToan",
             ptdc.nv_cap_nhat     AS "maNVCapNhat",
             ptdc.ma_pdc          AS "maPDC",
             pdc.ngay_dc          AS "ngayDC",
             pdc.khach_dat        AS "maKH",
             pdc.nv_sale          AS "maNVSale",
             kh.ten_kh            AS "tenKH",
             kh.cccd              AS "cccd",
             kh.sdt               AS "sdt",
             kh.email             AS "emailKH",
             nvs.ten_nv           AS "tenNVSale",
             nvk.ten_nv           AS "tenNVKeToan"
      FROM pt_dat_coc ptdc
      JOIN phieu_dat_coc pdc ON pdc.ma_pdc = ptdc.ma_pdc
      JOIN khach_hang kh     ON kh.ma_kh = pdc.khach_dat
      JOIN nhanvien nvs      ON nvs.ma_nv = pdc.nv_sale
      JOIN nhanvien nvk      ON nvk.ma_nv = ptdc.nv_ke_toan
      WHERE ptdc.ma_ptdc = ${maPTDC}
    `
    return rows[0] || null
  }

  // LoadDSPTDCDaLapHomNay(maNV): PhieuThuDatCoc[] — do CHÍNH kế toán đang
  // đăng nhập lập, trong ngày hôm nay.
  static async LoadDSPTDCDaLapHomNay(maNV) {
    const rows = await prisma.$queryRaw`
      SELECT ptdc.ma_ptdc AS "maPTDC", ptdc.ngay AS "ngay", ptdc.trang_thai AS "trangThai",
             ptdc.tong_tien AS "tongTien", ptdc.ma_pdc AS "maPDC"
      FROM pt_dat_coc ptdc
      WHERE ptdc.nv_ke_toan = ${maNV}
        AND ptdc.ngay::date = CURRENT_DATE
      ORDER BY ptdc.ngay DESC
    `
    return rows
  }
}

export default PhieuThuDatCocDB