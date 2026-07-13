import prisma from '../config/prisma.js'

/**
 * PhieuThuBoiThuongDB — tương ứng lớp PhieuThuBoiThuongDB trong class diagram.
 */
class PhieuThuBoiThuongDB {
  // KiemTraTonTaiTheoBT(maBT): boolean — biên bản này đã có phiếu thu chưa
  static async KiemTraTonTaiTheoBT(maBT) {
    const rows = await prisma.$queryRaw`
      SELECT 1 FROM pt_boi_thuong WHERE ma_bt = ${maBT} LIMIT 1
    `
    return rows.length > 0
  }

  // ThemPTBT({ maBT, tongTien, nvKeToan }): PhieuThuBoiThuong — tạo mới
  // trạng thái mặc định "Chưa thanh toán"
  static async ThemPTBT({ maBT, tongTien, nvKeToan }) {
    const rows = await prisma.$queryRaw`
      INSERT INTO pt_boi_thuong
        (ngay, trang_thai, tong_tien, nv_ke_toan, nv_cap_nhat, ma_bt)
      VALUES
        (CURRENT_TIMESTAMP, 'Chưa thanh toán', ${tongTien}, ${nvKeToan}, NULL, ${maBT})
      RETURNING ma_ptdb         AS "maPTDB",
                ngay            AS "ngay",
                ngay_thanh_toan AS "ngayThanhToan",
                ghi_chu         AS "ghiChu",
                trang_thai      AS "trangThai",
                tong_tien       AS "tongTien",
                nv_ke_toan      AS "maNVKeToan",
                nv_cap_nhat     AS "maNVCapNhat",
                ma_bt           AS "maBT"
    `
    return rows[0]
  }

// LoadPTBT(maPTDB): PhieuThuBoiThuong — kèm thông tin khách hàng để gửi mail/in PDF
static async LoadPTBT(maPTDB) {
  const rows = await prisma.$queryRaw`
    SELECT ptdb.ma_ptdb         AS "maPTDB",
           ptdb.ngay            AS "ngay",
           ptdb.ngay_thanh_toan AS "ngayThanhToan",
           ptdb.ghi_chu         AS "ghiChu",
           ptdb.trang_thai      AS "trangThai",
           ptdb.tong_tien       AS "tongTien",
           ptdb.nv_ke_toan      AS "maNVKeToan",
           ptdb.nv_cap_nhat     AS "maNVCapNhat",
           ptdb.ma_bt           AS "maBT",
           bt.ngay_bt           AS "ngayBT",
           bt.ma_kh             AS "maKH",
           kh.ten_kh            AS "tenKH",
           kh.cccd              AS "cccd",
           kh.sdt               AS "sdt",
           kh.email             AS "emailKH",
           nv.ten_nv            AS "tenNVKeToan"
    FROM pt_boi_thuong ptdb
    JOIN boi_thuong bt ON bt.ma_bt = ptdb.ma_bt
    JOIN khach_hang kh ON kh.ma_kh = bt.ma_kh
    JOIN nhanvien nv   ON nv.ma_nv = ptdb.nv_ke_toan
    WHERE ptdb.ma_ptdb = ${maPTDB}
  `
  return rows[0] || null
}



  // LoadDSPTBTDaLapHomNay(nvKeToan): PhieuThuBoiThuong[] — do CHÍNH kế toán
  // đang đăng nhập lập, trong ngày hôm nay.
  static async LoadDSPTBTDaLapHomNay(nvKeToan) {
  const rows = await prisma.$queryRaw`
    SELECT ptdb.ma_ptdb   AS "maPTDB",
           ptdb.ngay      AS "ngay",
           ptdb.trang_thai AS "trangThai",
           ptdb.tong_tien AS "tongTien",
           ptdb.ma_bt     AS "maBT",
           bt.ma_kh       AS "maKH",
           kh.ten_kh      AS "tenKH"
    FROM pt_boi_thuong ptdb
    JOIN boi_thuong bt ON bt.ma_bt = ptdb.ma_bt
    JOIN khach_hang kh ON kh.ma_kh = bt.ma_kh
    WHERE ptdb.nv_ke_toan = ${nvKeToan}
      AND ptdb.ngay::date = CURRENT_DATE
    ORDER BY ptdb.ngay DESC
  `
  return rows
}
}

export default PhieuThuBoiThuongDB