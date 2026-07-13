import prisma from '../config/prisma.js'

class PTDatCocDB {
  static async LayDanhSachCanCapNhat(tuKhoa = '', maCN) {
    const keyword = String(tuKhoa || '').trim()
    const like = `%${keyword}%`

    return prisma.$queryRaw`
      SELECT ptdc.ma_ptdc         AS "maPT",
             'dat-coc'            AS "loaiPT",
             'Đặt cọc'            AS "tenLoaiPT",
             ptdc.ma_ptdc         AS "maPTDC",
             ptdc.ngay            AS "ngay",
             ptdc.ngay_thanh_toan AS "ngayThanhToan",
             ptdc.ghi_chu         AS "ghiChu",
             ptdc.trang_thai      AS "trangThai",
             ptdc.tong_tien       AS "tongTien",
             ptdc.nv_ke_toan      AS "maNVKeToan",
             nvkt.ten_nv          AS "tenNVKeToan",
             ptdc.nv_cap_nhat     AS "maNVCapNhat",
             nvcn.ten_nv          AS "tenNVCapNhat",
             ptdc.ma_pdc          AS "maLienKet",
             ptdc.ma_pdc          AS "maPDC",
             pdc.ngay_dc          AS "ngayDC",
             pdc.trang_thai       AS "trangThaiPhieuDatCoc",
             kh.ma_kh             AS "maKH",
             kh.ten_kh            AS "tenKH",
             kh.cccd              AS "cccd",
             kh.sdt               AS "sdt",
             kh.email             AS "emailKH",
             COALESCE((
               SELECT string_agg(DISTINCT dcg.ma_phong, ', ' ORDER BY dcg.ma_phong)
               FROM dat_coc_giuong dcg
               WHERE dcg.ma_pdc = pdc.ma_pdc
             ), '') AS "maPhong",
             COALESCE((
               SELECT string_agg(DISTINCT dcg.ma_giuong, ', ' ORDER BY dcg.ma_giuong)
               FROM dat_coc_giuong dcg
               WHERE dcg.ma_pdc = pdc.ma_pdc
             ), '') AS "maGiuong"
      FROM pt_dat_coc ptdc
      JOIN nhanvien nvkt ON nvkt.ma_nv = ptdc.nv_ke_toan
      LEFT JOIN nhanvien nvcn ON nvcn.ma_nv = ptdc.nv_cap_nhat
      JOIN phieu_dat_coc pdc ON pdc.ma_pdc = ptdc.ma_pdc
      JOIN khach_hang kh ON kh.ma_kh = pdc.khach_dat
      WHERE ptdc.trang_thai IN ('Chưa thanh toán', 'Không hợp lệ')
        AND pdc.trang_thai IN ('Chờ thanh toán', 'Chờ Duyệt')
        AND nvkt.ma_cn = ${maCN}
        AND (
          ${keyword} = ''
          OR ptdc.ma_ptdc ILIKE ${like}
        )
      ORDER BY ptdc.ngay DESC
    `
  }

  static async LayLichSuCapNhat(maNV) {
    return prisma.$queryRaw`
      SELECT ptdc.ma_ptdc         AS "maPT",
             'dat-coc'            AS "loaiPT",
             'Đặt cọc'            AS "tenLoaiPT",
             ptdc.ma_ptdc         AS "maPTDC",
             ptdc.ngay            AS "ngay",
             ptdc.ngay_thanh_toan AS "ngayThanhToan",
             ptdc.ghi_chu         AS "ghiChu",
             ptdc.trang_thai      AS "trangThai",
             ptdc.tong_tien       AS "tongTien",
             ptdc.nv_ke_toan      AS "maNVKeToan",
             nvkt.ten_nv          AS "tenNVKeToan",
             ptdc.nv_cap_nhat     AS "maNVCapNhat",
             nvcn.ten_nv          AS "tenNVCapNhat",
             ptdc.ma_pdc          AS "maLienKet",
             ptdc.ma_pdc          AS "maPDC",
             pdc.ngay_dc          AS "ngayDC",
             pdc.trang_thai       AS "trangThaiPhieuDatCoc",
             kh.ma_kh             AS "maKH",
             kh.ten_kh            AS "tenKH",
             kh.cccd              AS "cccd",
             kh.sdt               AS "sdt",
             kh.email             AS "emailKH"
      FROM pt_dat_coc ptdc
      JOIN nhanvien nvkt ON nvkt.ma_nv = ptdc.nv_ke_toan
      JOIN nhanvien nvcn ON nvcn.ma_nv = ptdc.nv_cap_nhat
      JOIN phieu_dat_coc pdc ON pdc.ma_pdc = ptdc.ma_pdc
      JOIN khach_hang kh ON kh.ma_kh = pdc.khach_dat
      WHERE ptdc.trang_thai = 'Đã thanh toán'
        AND ptdc.nv_cap_nhat = ${maNV}
      ORDER BY ptdc.ngay_thanh_toan DESC, ptdc.ngay DESC
    `
  }

  static async LayChiTiet(maPTDC, maCN = '') {
    const rows = await prisma.$queryRaw`
      SELECT ptdc.ma_ptdc         AS "maPT",
             'dat-coc'            AS "loaiPT",
             'Đặt cọc'            AS "tenLoaiPT",
             ptdc.ma_ptdc         AS "maPTDC",
             ptdc.ngay            AS "ngay",
             ptdc.ngay_thanh_toan AS "ngayThanhToan",
             ptdc.ghi_chu         AS "ghiChu",
             ptdc.trang_thai      AS "trangThai",
             ptdc.tong_tien       AS "tongTien",
             ptdc.nv_ke_toan      AS "maNVKeToan",
             nvkt.ten_nv          AS "tenNVKeToan",
             ptdc.nv_cap_nhat     AS "maNVCapNhat",
             nvcn.ten_nv          AS "tenNVCapNhat",
             ptdc.ma_pdc          AS "maLienKet",
             ptdc.ma_pdc          AS "maPDC",
             pdc.ngay_dc          AS "ngayDC",
             pdc.trang_thai       AS "trangThaiPhieuDatCoc",
             kh.ma_kh             AS "maKH",
             kh.ten_kh            AS "tenKH",
             kh.cccd              AS "cccd",
             kh.sdt               AS "sdt",
             kh.email             AS "emailKH",
             COALESCE((
               SELECT string_agg(DISTINCT dcg.ma_phong, ', ' ORDER BY dcg.ma_phong)
               FROM dat_coc_giuong dcg
               WHERE dcg.ma_pdc = pdc.ma_pdc
             ), '') AS "maPhong",
             COALESCE((
               SELECT string_agg(DISTINCT dcg.ma_giuong, ', ' ORDER BY dcg.ma_giuong)
               FROM dat_coc_giuong dcg
               WHERE dcg.ma_pdc = pdc.ma_pdc
             ), '') AS "maGiuong"
      FROM pt_dat_coc ptdc
      JOIN nhanvien nvkt ON nvkt.ma_nv = ptdc.nv_ke_toan
      LEFT JOIN nhanvien nvcn ON nvcn.ma_nv = ptdc.nv_cap_nhat
      JOIN phieu_dat_coc pdc ON pdc.ma_pdc = ptdc.ma_pdc
      JOIN khach_hang kh ON kh.ma_kh = pdc.khach_dat
      WHERE ptdc.ma_ptdc = ${maPTDC}
        AND (${maCN} = '' OR nvkt.ma_cn = ${maCN})
      LIMIT 1
    `

    return rows[0] || null
  }

  static async KiemTraTrangThai(maPTDC, loaiPT, trangThai, maCN) {
    const rows = await prisma.$queryRaw`
      SELECT 1
      FROM pt_dat_coc ptdc
      JOIN nhanvien nvkt ON nvkt.ma_nv = ptdc.nv_ke_toan
      JOIN phieu_dat_coc pdc ON pdc.ma_pdc = ptdc.ma_pdc
      WHERE ptdc.ma_ptdc = ${maPTDC}
        AND ptdc.trang_thai = ${trangThai}
        AND pdc.trang_thai IN ('Chờ thanh toán', 'Chờ Duyệt')
        AND nvkt.ma_cn = ${maCN}
      LIMIT 1
    `

    return rows.length > 0
  }

  static async CapNhatDaThanhToan(maPTDC, ngayTT, nvCapNhat, maCN) {
    return prisma.$transaction(async (tx) => {
      const rows = await tx.$queryRaw`
        UPDATE pt_dat_coc ptdc
        SET trang_thai = 'Đã thanh toán',
            ngay_thanh_toan = ${ngayTT},
            nv_cap_nhat = ${nvCapNhat}
        FROM nhanvien nvkt, phieu_dat_coc pdc
        WHERE ptdc.ma_ptdc = ${maPTDC}
          AND nvkt.ma_nv = ptdc.nv_ke_toan
          AND pdc.ma_pdc = ptdc.ma_pdc
          AND nvkt.ma_cn = ${maCN}
          AND ptdc.trang_thai IN ('Chưa thanh toán', 'Không hợp lệ')
          AND pdc.trang_thai IN ('Chờ thanh toán', 'Chờ Duyệt')
        RETURNING ptdc.ma_ptdc AS "maPTDC",
                  ptdc.ma_pdc  AS "maPDC"
      `

      if (rows.length === 0) return false

      await tx.$executeRaw`
        UPDATE phieu_dat_coc
        SET trang_thai = 'Chờ Duyệt'
        WHERE ma_pdc = ${rows[0].maPDC}
          AND trang_thai = 'Chờ thanh toán'
      `

      return true
    })
  }
}

export default PTDatCocDB
