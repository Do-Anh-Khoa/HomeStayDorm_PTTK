import prisma from '../config/prisma.js'

const TRANG_THAI_CAN_CAP_NHAT = ['Chưa thanh toán', 'Không hợp lệ']

class PTTraPhongDB {
  static async LayDanhSachCanCapNhat(tuKhoa = '', maCN) {
  const keyword = String(tuKhoa || '').trim()
  const like = `%${keyword}%`

  return prisma.$queryRaw`
    SELECT pttp.ma_pttp         AS "maPT",
           'tra-phong'          AS "loaiPT",
           'Trả phòng'          AS "tenLoaiPT",
           pttp.ma_pttp         AS "maPTTP",
           pttp.ngay            AS "ngay",
           pttp.ngay_thanh_toan AS "ngayThanhToan",
           pttp.ghi_chu         AS "ghiChu",
           pttp.trang_thai      AS "trangThai",
           pttp.tong_tien       AS "tongTien",
           pttp.tien_hoan_coc   AS "tienHoanCoc",
           pttp.tien_khau_tru   AS "tienKhauTru",
           pttp.nv_ke_toan      AS "maNVKeToan",
           nvkt.ten_nv          AS "tenNVKeToan",
           pttp.nv_cap_nhat     AS "maNVCapNhat",
           nvcn.ten_nv          AS "tenNVCapNhat",
           hstp.ma_tp           AS "maLienKet",
           hstp.ma_tp           AS "maTP",
           hstp.ngay_tp         AS "ngayTP",
           hstp.ma_hdt          AS "maHDT",
           hstp.ma_pdc          AS "maPDC",
           kh.ma_kh             AS "maKH",
           kh.ten_kh            AS "tenKH",
           kh.cccd              AS "cccd",
           kh.sdt               AS "sdt",
           kh.email             AS "emailKH",
           COALESCE((
             SELECT string_agg(DISTINCT dcg.ma_phong, ', ' ORDER BY dcg.ma_phong)
             FROM dat_coc_giuong dcg
             WHERE dcg.ma_pdc = hstp.ma_pdc
           ), '') AS "maPhong",
           COALESCE((
             SELECT string_agg(DISTINCT dcg.ma_giuong, ', ' ORDER BY dcg.ma_giuong)
             FROM dat_coc_giuong dcg
             WHERE dcg.ma_pdc = hstp.ma_pdc
           ), '') AS "maGiuong"
    FROM pt_tra_phong pttp
    JOIN nhanvien nvkt ON nvkt.ma_nv = pttp.nv_ke_toan
    LEFT JOIN nhanvien nvcn ON nvcn.ma_nv = pttp.nv_cap_nhat
    JOIN ho_so_tra_phong hstp ON hstp.ma_tp = pttp.ma_tp
    JOIN khach_hang kh ON kh.ma_kh = hstp.ma_khach_thue
    WHERE pttp.trang_thai IN ('Chưa thanh toán', 'Không hợp lệ')
      AND nvkt.ma_cn = ${maCN}
      AND (
        ${keyword} = ''
        OR pttp.ma_pttp ILIKE ${like}
      )
    ORDER BY pttp.ngay DESC
  `
}

  static async LayLichSuCapNhat(maNV) {
    return prisma.$queryRaw`
      SELECT pttp.ma_pttp         AS "maPT",
             'tra-phong'          AS "loaiPT",
             'Trả phòng'          AS "tenLoaiPT",
             pttp.ma_pttp         AS "maPTTP",
             pttp.ngay            AS "ngay",
             pttp.ngay_thanh_toan AS "ngayThanhToan",
             pttp.ghi_chu         AS "ghiChu",
             pttp.trang_thai      AS "trangThai",
             pttp.tong_tien       AS "tongTien",
             pttp.tien_hoan_coc   AS "tienHoanCoc",
             pttp.tien_khau_tru   AS "tienKhauTru",
             pttp.nv_ke_toan      AS "maNVKeToan",
             nvkt.ten_nv          AS "tenNVKeToan",
             pttp.nv_cap_nhat     AS "maNVCapNhat",
             nvcn.ten_nv          AS "tenNVCapNhat",
             hstp.ma_tp           AS "maLienKet",
             hstp.ma_tp           AS "maTP",
             hstp.ngay_tp         AS "ngayTP",
             hstp.ma_hdt          AS "maHDT",
             hstp.ma_pdc          AS "maPDC",
             kh.ma_kh             AS "maKH",
             kh.ten_kh            AS "tenKH",
             kh.cccd              AS "cccd",
             kh.sdt               AS "sdt",
             kh.email             AS "emailKH"
      FROM pt_tra_phong pttp
      JOIN nhanvien nvkt ON nvkt.ma_nv = pttp.nv_ke_toan
      JOIN nhanvien nvcn ON nvcn.ma_nv = pttp.nv_cap_nhat
      JOIN ho_so_tra_phong hstp ON hstp.ma_tp = pttp.ma_tp
      JOIN khach_hang kh ON kh.ma_kh = hstp.ma_khach_thue
      WHERE pttp.trang_thai = 'Đã thanh toán'
        AND pttp.nv_cap_nhat = ${maNV}
      ORDER BY pttp.ngay_thanh_toan DESC, pttp.ngay DESC
    `
  }

  static async LayChiTiet(maPTTP, maCN = '') {
    const rows = await prisma.$queryRaw`
      SELECT pttp.ma_pttp         AS "maPT",
             'tra-phong'          AS "loaiPT",
             'Trả phòng'          AS "tenLoaiPT",
             pttp.ma_pttp         AS "maPTTP",
             pttp.ngay            AS "ngay",
             pttp.ngay_thanh_toan AS "ngayThanhToan",
             pttp.ghi_chu         AS "ghiChu",
             pttp.trang_thai      AS "trangThai",
             pttp.tong_tien       AS "tongTien",
             pttp.tien_hoan_coc   AS "tienHoanCoc",
             pttp.tien_khau_tru   AS "tienKhauTru",
             pttp.nv_ke_toan      AS "maNVKeToan",
             nvkt.ten_nv          AS "tenNVKeToan",
             pttp.nv_cap_nhat     AS "maNVCapNhat",
             nvcn.ten_nv          AS "tenNVCapNhat",
             hstp.ma_tp           AS "maLienKet",
             hstp.ma_tp           AS "maTP",
             hstp.ngay_tp         AS "ngayTP",
             hstp.ma_hdt          AS "maHDT",
             hstp.ma_pdc          AS "maPDC",
             kh.ma_kh             AS "maKH",
             kh.ten_kh            AS "tenKH",
             kh.cccd              AS "cccd",
             kh.sdt               AS "sdt",
             kh.email             AS "emailKH",
             COALESCE((
               SELECT string_agg(DISTINCT dcg.ma_phong, ', ' ORDER BY dcg.ma_phong)
               FROM dat_coc_giuong dcg
               WHERE dcg.ma_pdc = hstp.ma_pdc
             ), '') AS "maPhong",
             COALESCE((
               SELECT string_agg(DISTINCT dcg.ma_giuong, ', ' ORDER BY dcg.ma_giuong)
               FROM dat_coc_giuong dcg
               WHERE dcg.ma_pdc = hstp.ma_pdc
             ), '') AS "maGiuong"
      FROM pt_tra_phong pttp
      JOIN nhanvien nvkt ON nvkt.ma_nv = pttp.nv_ke_toan
      LEFT JOIN nhanvien nvcn ON nvcn.ma_nv = pttp.nv_cap_nhat
      JOIN ho_so_tra_phong hstp ON hstp.ma_tp = pttp.ma_tp
      JOIN khach_hang kh ON kh.ma_kh = hstp.ma_khach_thue
      WHERE pttp.ma_pttp = ${maPTTP}
        AND (${maCN} = '' OR nvkt.ma_cn = ${maCN})
      LIMIT 1
    `

    return rows[0] || null
  }

  static async KiemTraTrangThai(maPTTP, loaiPT, trangThai, maCN) {
    const rows = await prisma.$queryRaw`
      SELECT 1
      FROM pt_tra_phong pttp
      JOIN nhanvien nvkt ON nvkt.ma_nv = pttp.nv_ke_toan
      WHERE pttp.ma_pttp = ${maPTTP}
        AND pttp.trang_thai = ${trangThai}
        AND nvkt.ma_cn = ${maCN}
      LIMIT 1
    `

    return rows.length > 0
  }

  static async CapNhatDaThanhToan(maPTTP, ngayTT, nvCapNhat, maCN) {
    const rows = await prisma.$queryRaw`
      UPDATE pt_tra_phong pttp
      SET trang_thai = 'Đã thanh toán',
          ngay_thanh_toan = ${ngayTT},
          nv_cap_nhat = ${nvCapNhat}
      FROM nhanvien nvkt
      WHERE pttp.ma_pttp = ${maPTTP}
        AND nvkt.ma_nv = pttp.nv_ke_toan
        AND nvkt.ma_cn = ${maCN}
        AND pttp.trang_thai IN ('Chưa thanh toán', 'Không hợp lệ')
      RETURNING pttp.ma_pttp AS "maPTTP"
    `

    return rows.length > 0
  }
}

export { TRANG_THAI_CAN_CAP_NHAT }
export default PTTraPhongDB
