import prisma from '../config/prisma.js'

class PTBoiThuongDB {
  static async LayDanhSachCanCapNhat(tuKhoa = '', maCN) {
  const keyword = String(tuKhoa || '').trim()
  const like = `%${keyword}%`

  return prisma.$queryRaw`
    SELECT ptbt.ma_ptdb         AS "maPT",
           'boi-thuong'         AS "loaiPT",
           'Bồi thường'         AS "tenLoaiPT",
           ptbt.ma_ptdb         AS "maPTBT",
           ptbt.ngay            AS "ngay",
           ptbt.ngay_thanh_toan AS "ngayThanhToan",
           ptbt.ghi_chu         AS "ghiChu",
           ptbt.trang_thai      AS "trangThai",
           ptbt.tong_tien       AS "tongTien",
           ptbt.nv_ke_toan      AS "maNVKeToan",
           nvkt.ten_nv          AS "tenNVKeToan",
           ptbt.nv_cap_nhat     AS "maNVCapNhat",
           nvcn.ten_nv          AS "tenNVCapNhat",
           ptbt.ma_bt           AS "maLienKet",
           ptbt.ma_bt           AS "maBT",
           bt.ngay_bt           AS "ngayBT",
           kh.ma_kh             AS "maKH",
           kh.ten_kh            AS "tenKH",
           kh.cccd              AS "cccd",
           kh.sdt               AS "sdt",
           kh.email             AS "emailKH"
    FROM pt_boi_thuong ptbt
    JOIN nhanvien nvkt ON nvkt.ma_nv = ptbt.nv_ke_toan
    LEFT JOIN nhanvien nvcn ON nvcn.ma_nv = ptbt.nv_cap_nhat
    JOIN boi_thuong bt ON bt.ma_bt = ptbt.ma_bt
    JOIN khach_hang kh ON kh.ma_kh = bt.ma_kh
    WHERE ptbt.trang_thai IN ('Chưa thanh toán', 'Không hợp lệ')
      AND nvkt.ma_cn = ${maCN}
      AND (
        ${keyword} = ''
        OR ptbt.ma_ptdb ILIKE ${like}
      )
    ORDER BY ptbt.ngay DESC
  `
}

  static async LayLichSuCapNhat(maNV) {
    return prisma.$queryRaw`
      SELECT ptbt.ma_ptdb         AS "maPT",
             'boi-thuong'         AS "loaiPT",
             'Bồi thường'         AS "tenLoaiPT",
             ptbt.ma_ptdb         AS "maPTBT",
             ptbt.ngay            AS "ngay",
             ptbt.ngay_thanh_toan AS "ngayThanhToan",
             ptbt.ghi_chu         AS "ghiChu",
             ptbt.trang_thai      AS "trangThai",
             ptbt.tong_tien       AS "tongTien",
             ptbt.nv_ke_toan      AS "maNVKeToan",
             nvkt.ten_nv          AS "tenNVKeToan",
             ptbt.nv_cap_nhat     AS "maNVCapNhat",
             nvcn.ten_nv          AS "tenNVCapNhat",
             ptbt.ma_bt           AS "maLienKet",
             ptbt.ma_bt           AS "maBT",
             bt.ngay_bt           AS "ngayBT",
             kh.ma_kh             AS "maKH",
             kh.ten_kh            AS "tenKH",
             kh.cccd              AS "cccd",
             kh.sdt               AS "sdt",
             kh.email             AS "emailKH"
      FROM pt_boi_thuong ptbt
      JOIN nhanvien nvkt ON nvkt.ma_nv = ptbt.nv_ke_toan
      JOIN nhanvien nvcn ON nvcn.ma_nv = ptbt.nv_cap_nhat
      JOIN boi_thuong bt ON bt.ma_bt = ptbt.ma_bt
      JOIN khach_hang kh ON kh.ma_kh = bt.ma_kh
      WHERE ptbt.trang_thai = 'Đã thanh toán'
        AND ptbt.nv_cap_nhat = ${maNV}
      ORDER BY ptbt.ngay_thanh_toan DESC, ptbt.ngay DESC
    `
  }

  static async LayChiTiet(maPTBT, maCN = '') {
    const rows = await prisma.$queryRaw`
      SELECT ptbt.ma_ptdb         AS "maPT",
             'boi-thuong'         AS "loaiPT",
             'Bồi thường'         AS "tenLoaiPT",
             ptbt.ma_ptdb         AS "maPTBT",
             ptbt.ngay            AS "ngay",
             ptbt.ngay_thanh_toan AS "ngayThanhToan",
             ptbt.ghi_chu         AS "ghiChu",
             ptbt.trang_thai      AS "trangThai",
             ptbt.tong_tien       AS "tongTien",
             ptbt.nv_ke_toan      AS "maNVKeToan",
             nvkt.ten_nv          AS "tenNVKeToan",
             ptbt.nv_cap_nhat     AS "maNVCapNhat",
             nvcn.ten_nv          AS "tenNVCapNhat",
             ptbt.ma_bt           AS "maLienKet",
             ptbt.ma_bt           AS "maBT",
             bt.ngay_bt           AS "ngayBT",
             kh.ma_kh             AS "maKH",
             kh.ten_kh            AS "tenKH",
             kh.cccd              AS "cccd",
             kh.sdt               AS "sdt",
             kh.email             AS "emailKH"
      FROM pt_boi_thuong ptbt
      JOIN nhanvien nvkt ON nvkt.ma_nv = ptbt.nv_ke_toan
      LEFT JOIN nhanvien nvcn ON nvcn.ma_nv = ptbt.nv_cap_nhat
      JOIN boi_thuong bt ON bt.ma_bt = ptbt.ma_bt
      JOIN khach_hang kh ON kh.ma_kh = bt.ma_kh
      WHERE ptbt.ma_ptdb = ${maPTBT}
        AND (${maCN} = '' OR nvkt.ma_cn = ${maCN})
      LIMIT 1
    `

    return rows[0] || null
  }

  static async KiemTraTrangThai(maPTBT, loaiPT, trangThai, maCN) {
    const rows = await prisma.$queryRaw`
      SELECT 1
      FROM pt_boi_thuong ptbt
      JOIN nhanvien nvkt ON nvkt.ma_nv = ptbt.nv_ke_toan
      WHERE ptbt.ma_ptdb = ${maPTBT}
        AND ptbt.trang_thai = ${trangThai}
        AND nvkt.ma_cn = ${maCN}
      LIMIT 1
    `

    return rows.length > 0
  }

  static async CapNhatDaThanhToan(maPTBT, ngayTT, nvCapNhat, maCN) {
    const rows = await prisma.$queryRaw`
      UPDATE pt_boi_thuong ptbt
      SET trang_thai = 'Đã thanh toán',
          ngay_thanh_toan = ${ngayTT},
          nv_cap_nhat = ${nvCapNhat}
      FROM nhanvien nvkt
      WHERE ptbt.ma_ptdb = ${maPTBT}
        AND nvkt.ma_nv = ptbt.nv_ke_toan
        AND nvkt.ma_cn = ${maCN}
        AND ptbt.trang_thai IN ('Chưa thanh toán', 'Không hợp lệ')
      RETURNING ptbt.ma_ptdb AS "maPTBT"
    `

    return rows.length > 0
  }
}

export default PTBoiThuongDB
