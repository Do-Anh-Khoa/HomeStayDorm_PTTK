import prisma from '../config/prisma.js'

class PTHopDongDB {
  static async LayDanhSachCanCapNhat(tuKhoa = '', maCN) {
    const keyword = String(tuKhoa || '').trim()
    const like = `%${keyword}%`

    return prisma.$queryRaw`
      SELECT pthd.ma_pthd         AS "maPT",
             'hop-dong'           AS "loaiPT",
             'Hợp đồng'           AS "tenLoaiPT",
             pthd.ma_pthd         AS "maPTHD",
             pthd.ngay            AS "ngay",
             pthd.ngay_thanh_toan AS "ngayThanhToan",
             pthd.ghi_chu         AS "ghiChu",
             pthd.trang_thai      AS "trangThai",
             pthd.tong_tien       AS "tongTien",
             pthd.nv_ke_toan      AS "maNVKeToan",
             nvkt.ten_nv          AS "tenNVKeToan",
             pthd.nv_cap_nhat     AS "maNVCapNhat",
             nvcn.ten_nv          AS "tenNVCapNhat",
             pthd.ma_hdt          AS "maLienKet",
             pthd.ma_hdt          AS "maHDT",
             hdt.tg_tao_hd        AS "tgTaoHD",
             hdt.tg_vao           AS "tgVao",
             hdt.thoi_han_thue    AS "thoiHanThue",
             hdt.ky_tt            AS "kyTT",
             hdt.ma_pdc           AS "maPDC",
             kh.ma_kh             AS "maKH",
             kh.ten_kh            AS "tenKH",
             kh.cccd              AS "cccd",
             kh.sdt               AS "sdt",
             kh.email             AS "emailKH",
             COALESCE((
               SELECT string_agg(DISTINCT dcg.ma_phong, ', ' ORDER BY dcg.ma_phong)
               FROM dat_coc_giuong dcg
               WHERE dcg.ma_pdc = hdt.ma_pdc
             ), '') AS "maPhong",
             COALESCE((
               SELECT string_agg(DISTINCT dcg.ma_giuong, ', ' ORDER BY dcg.ma_giuong)
               FROM dat_coc_giuong dcg
               WHERE dcg.ma_pdc = hdt.ma_pdc
             ), '') AS "maGiuong"
      FROM pt_hop_dong pthd
      JOIN nhanvien nvkt ON nvkt.ma_nv = pthd.nv_ke_toan
      LEFT JOIN nhanvien nvcn ON nvcn.ma_nv = pthd.nv_cap_nhat
      JOIN hop_dong_thue hdt ON hdt.ma_hdt = pthd.ma_hdt
      JOIN phieu_dat_coc pdc ON pdc.ma_pdc = hdt.ma_pdc
      JOIN khach_hang kh ON kh.ma_kh = pdc.khach_dat
      WHERE pthd.trang_thai IN ('Chưa thanh toán', 'Không hợp lệ')
        AND nvkt.ma_cn = ${maCN}
        AND (
          ${keyword} = ''
          OR pthd.ma_pthd ILIKE ${like}
        )
      ORDER BY pthd.ngay DESC
    `
  }

  static async LayLichSuCapNhat(maNV) {
    return prisma.$queryRaw`
      SELECT pthd.ma_pthd         AS "maPT",
             'hop-dong'           AS "loaiPT",
             'Hợp đồng'           AS "tenLoaiPT",
             pthd.ma_pthd         AS "maPTHD",
             pthd.ngay            AS "ngay",
             pthd.ngay_thanh_toan AS "ngayThanhToan",
             pthd.ghi_chu         AS "ghiChu",
             pthd.trang_thai      AS "trangThai",
             pthd.tong_tien       AS "tongTien",
             pthd.nv_ke_toan      AS "maNVKeToan",
             nvkt.ten_nv          AS "tenNVKeToan",
             pthd.nv_cap_nhat     AS "maNVCapNhat",
             nvcn.ten_nv          AS "tenNVCapNhat",
             pthd.ma_hdt          AS "maLienKet",
             pthd.ma_hdt          AS "maHDT",
             hdt.tg_tao_hd        AS "tgTaoHD",
             hdt.tg_vao           AS "tgVao",
             hdt.thoi_han_thue    AS "thoiHanThue",
             hdt.ky_tt            AS "kyTT",
             hdt.ma_pdc           AS "maPDC",
             kh.ma_kh             AS "maKH",
             kh.ten_kh            AS "tenKH",
             kh.cccd              AS "cccd",
             kh.sdt               AS "sdt",
             kh.email             AS "emailKH"
      FROM pt_hop_dong pthd
      JOIN nhanvien nvkt ON nvkt.ma_nv = pthd.nv_ke_toan
      JOIN nhanvien nvcn ON nvcn.ma_nv = pthd.nv_cap_nhat
      JOIN hop_dong_thue hdt ON hdt.ma_hdt = pthd.ma_hdt
      JOIN phieu_dat_coc pdc ON pdc.ma_pdc = hdt.ma_pdc
      JOIN khach_hang kh ON kh.ma_kh = pdc.khach_dat
      WHERE pthd.trang_thai = 'Đã thanh toán'
        AND pthd.nv_cap_nhat = ${maNV}
      ORDER BY pthd.ngay_thanh_toan DESC, pthd.ngay DESC
    `
  }

  static async LayChiTiet(maPTHD, maCN = '') {
    const rows = await prisma.$queryRaw`
      SELECT pthd.ma_pthd         AS "maPT",
             'hop-dong'           AS "loaiPT",
             'Hợp đồng'           AS "tenLoaiPT",
             pthd.ma_pthd         AS "maPTHD",
             pthd.ngay            AS "ngay",
             pthd.ngay_thanh_toan AS "ngayThanhToan",
             pthd.ghi_chu         AS "ghiChu",
             pthd.trang_thai      AS "trangThai",
             pthd.tong_tien       AS "tongTien",
             pthd.nv_ke_toan      AS "maNVKeToan",
             nvkt.ten_nv          AS "tenNVKeToan",
             pthd.nv_cap_nhat     AS "maNVCapNhat",
             nvcn.ten_nv          AS "tenNVCapNhat",
             pthd.ma_hdt          AS "maLienKet",
             pthd.ma_hdt          AS "maHDT",
             hdt.tg_tao_hd        AS "tgTaoHD",
             hdt.tg_vao           AS "tgVao",
             hdt.thoi_han_thue    AS "thoiHanThue",
             hdt.ky_tt            AS "kyTT",
             hdt.ma_pdc           AS "maPDC",
             kh.ma_kh             AS "maKH",
             kh.ten_kh            AS "tenKH",
             kh.cccd              AS "cccd",
             kh.sdt               AS "sdt",
             kh.email             AS "emailKH",
             COALESCE((
               SELECT string_agg(DISTINCT dcg.ma_phong, ', ' ORDER BY dcg.ma_phong)
               FROM dat_coc_giuong dcg
               WHERE dcg.ma_pdc = hdt.ma_pdc
             ), '') AS "maPhong",
             COALESCE((
               SELECT string_agg(DISTINCT dcg.ma_giuong, ', ' ORDER BY dcg.ma_giuong)
               FROM dat_coc_giuong dcg
               WHERE dcg.ma_pdc = hdt.ma_pdc
             ), '') AS "maGiuong"
      FROM pt_hop_dong pthd
      JOIN nhanvien nvkt ON nvkt.ma_nv = pthd.nv_ke_toan
      LEFT JOIN nhanvien nvcn ON nvcn.ma_nv = pthd.nv_cap_nhat
      JOIN hop_dong_thue hdt ON hdt.ma_hdt = pthd.ma_hdt
      JOIN phieu_dat_coc pdc ON pdc.ma_pdc = hdt.ma_pdc
      JOIN khach_hang kh ON kh.ma_kh = pdc.khach_dat
      WHERE pthd.ma_pthd = ${maPTHD}
        AND (${maCN} = '' OR nvkt.ma_cn = ${maCN})
      LIMIT 1
    `

    return rows[0] || null
  }

  static async KiemTraTrangThai(maPTHD, loaiPT, trangThai, maCN) {
    const rows = await prisma.$queryRaw`
      SELECT 1
      FROM pt_hop_dong pthd
      JOIN nhanvien nvkt ON nvkt.ma_nv = pthd.nv_ke_toan
      WHERE pthd.ma_pthd = ${maPTHD}
        AND pthd.trang_thai = ${trangThai}
        AND nvkt.ma_cn = ${maCN}
      LIMIT 1
    `

    return rows.length > 0
  }

  static async CapNhatDaThanhToan(maPTHD, ngayTT, nvCapNhat, maCN) {
    const rows = await prisma.$queryRaw`
      UPDATE pt_hop_dong pthd
      SET trang_thai = 'Đã thanh toán',
          ngay_thanh_toan = ${ngayTT},
          nv_cap_nhat = ${nvCapNhat}
      FROM nhanvien nvkt
      WHERE pthd.ma_pthd = ${maPTHD}
        AND nvkt.ma_nv = pthd.nv_ke_toan
        AND nvkt.ma_cn = ${maCN}
        AND pthd.trang_thai IN ('Chưa thanh toán', 'Không hợp lệ')
      RETURNING pthd.ma_pthd AS "maPTHD"
    `

    return rows.length > 0
  }
}

export default PTHopDongDB
