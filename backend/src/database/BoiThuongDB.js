import prisma from '../config/prisma.js'

class BoiThuongDB {
  // LoadBT(maBT): kèm tên KH, CCCD, SĐT, và số lần vi phạm 
  static async LoadBT(maBT) {
  const rows = await prisma.$queryRaw`
    SELECT bt.ma_bt AS "maBT", bt.ngay_bt AS "ngayBT", bt.ma_kh AS "maKH", bt.nv_quan_ly AS "nvQuanLy",
           kh.ten_kh AS "tenKH", kh.cccd AS "cccd", kh.sdt AS "sdt",
           (
             SELECT COUNT(*) FROM boi_thuong bt2
             WHERE bt2.ma_kh = bt.ma_kh AND bt2.ngay_bt <= bt.ngay_bt
           )::int AS "soLanViPham"
  FROM boi_thuong bt
  JOIN khach_hang kh ON kh.ma_kh = bt.ma_kh
  WHERE bt.ma_bt = ${maBT}
  `
  return rows[0] || null
}

 
  static async LoadDSBTChoXuLy(maCN, tuKhoa = '') {
  const rows = await prisma.$queryRaw`
    SELECT bt.ma_bt AS "maBT", bt.ngay_bt AS "ngayBT", bt.ma_kh AS "maKH", bt.nv_quan_ly AS "nvQuanLy",
           kh.ten_kh AS "tenKH",
           (
             SELECT COUNT(*) FROM boi_thuong bt2
             WHERE bt2.ma_kh = bt.ma_kh AND bt2.ngay_bt <= bt.ngay_bt
           )::int AS "soLanViPham"
    FROM boi_thuong bt
    JOIN khach_hang kh ON kh.ma_kh = bt.ma_kh
    JOIN nhanvien nv ON nv.ma_nv = bt.nv_quan_ly
    WHERE nv.ma_cn = ${maCN}
      AND NOT EXISTS (
        SELECT 1 FROM pt_boi_thuong ptdb WHERE ptdb.ma_bt = bt.ma_bt
      )
      AND (
        ${tuKhoa} = '' OR
        bt.ma_bt ILIKE '%' || ${tuKhoa} || '%' OR
        kh.ten_kh ILIKE '%' || ${tuKhoa} || '%'
      )
    ORDER BY bt.ngay_bt ASC
  `
  return rows
}
  static async TimKiemBBBT(tuKhoa, maCN) {
    return this.LoadDSBTChoXuLy(maCN, tuKhoa)
  }

  // Dùng cho màn chi tiết PT đã lập 
 static async TinhSoLanViPhamTheoBT(maBT) {
  const rows = await prisma.$queryRaw`
    SELECT (
      SELECT COUNT(*) FROM boi_thuong bt2
      WHERE bt2.ma_kh = bt.ma_kh AND bt2.ngay_bt <= bt.ngay_bt
    )::int AS "soLan"
    FROM boi_thuong bt WHERE bt.ma_bt = ${maBT}
  `
  return rows[0]?.soLan || 0
}
}

export default BoiThuongDB