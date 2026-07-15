import prisma from '../config/prisma.js'

function parseSnapshot(ghiChu) {
  if (!ghiChu) return null

  try {
    const parsed = JSON.parse(ghiChu)
    return parsed && parsed.__snapshot === 'PTHD' ? parsed : null
  } catch {
    return null
  }
}

// PhieuThuHopDongDB — raw SQL cho bảng pt_hop_dong, cùng phong cách với
// PhieuThuDatCocDB.js. Lưu ý: cột nv_cap_nhat trong pt_hop_dong là NOT NULL
// (khác với cách ThemPTDC cũ insert NULL) nên ở đây gán = nv_ke_toan (người
// tạo phiếu) để không vi phạm ràng buộc.
class PhieuThuHopDongDB {
  static async ThemPTHD({ maHDT, tongTien, nvKeToan }) {
    const rows = await prisma.$queryRaw`
      INSERT INTO pt_hop_dong
        (ngay, trang_thai, tong_tien, nv_ke_toan, nv_cap_nhat, ghi_chu, ma_hdt)
      VALUES
        (CURRENT_TIMESTAMP, 'Chưa thanh toán', ${tongTien}, ${nvKeToan}, ${nvKeToan}, NULL, ${maHDT})
      RETURNING ma_pthd         AS "maPTHD",
                ngay            AS "ngay",
                ngay_thanh_toan AS "ngayThanhToan",
                ghi_chu         AS "ghiChu",
                trang_thai      AS "trangThai",
                tong_tien       AS "tongTien",
                nv_ke_toan      AS "maNVKeToan",
                nv_cap_nhat     AS "maNVCapNhat",
                ma_hdt          AS "maHDT"
    `
    return rows[0]
  }
  // LoadPTHD(maPTHD): PhieuThuHopDong — kèm HĐT + KH + NV phụ trách + NV kế toán
  static async LoadPTHD(maPTHD) {
    const baseRows = await prisma.$queryRaw`
      SELECT
        pthd.ma_pthd         AS "maPTHD",
        pthd.ngay            AS "ngay",
        pthd.ngay_thanh_toan AS "ngayThanhToan",
        pthd.ghi_chu         AS "ghiChu",
        pthd.trang_thai      AS "trangThai",
        pthd.tong_tien       AS "tongTien",
        pthd.nv_ke_toan      AS "maNVKeToan",
        pthd.nv_cap_nhat     AS "maNVCapNhat",
        pthd.ma_hdt          AS "maHDT",
        nvk.ten_nv           AS "tenNVKeToan"
      FROM pt_hop_dong pthd
      JOIN nhanvien nvk ON nvk.ma_nv = pthd.nv_ke_toan
      WHERE pthd.ma_pthd = ${maPTHD}
      LIMIT 1
    `

    const baseRow = baseRows[0] || null
    if (!baseRow) return null

    const snapshot = parseSnapshot(baseRow.ghiChu)
    if (snapshot) {
      return {
        maPTHD: baseRow.maPTHD,
        ngay: baseRow.ngay,
        ngayThanhToan: baseRow.ngayThanhToan,
        ghiChu: baseRow.ghiChu,
        trangThai: baseRow.trangThai,
        tongTien: Number(snapshot.tongTien ?? baseRow.tongTien ?? 0),
        maNVKeToan: baseRow.maNVKeToan,
        maNVCapNhat: baseRow.maNVCapNhat,
        maHDT: snapshot.maHDT || baseRow.maHDT,
        tgVao: snapshot.tgVao || null,
        thoiHanThue: Number(snapshot.thoiHanThue || 0),
        kyTT: Number(snapshot.kyTT || 0),
        maPDC: snapshot.maPDC || null,
        tenKH: snapshot.tenKH || '',
        cccd: snapshot.cccd || '',
        sdt: snapshot.sdt || '',
        emailKH: snapshot.emailKH || '',
        tenNVPhuTrach: snapshot.tenNVPhuTrach || '',
        tenNVKeToan: baseRow.tenNVKeToan || '',
        kyHienTai: Number(snapshot.kyHienTai || 0),
        dsGiuong: Array.isArray(snapshot.dsGiuong) ? snapshot.dsGiuong : [],
      }
    }

    const rows = await prisma.$queryRaw`
      SELECT pthd.ma_pthd         AS "maPTHD",
             pthd.ngay            AS "ngay",
             pthd.ngay_thanh_toan AS "ngayThanhToan",
             pthd.ghi_chu         AS "ghiChu",
             pthd.trang_thai      AS "trangThai",
             pthd.tong_tien       AS "tongTien",
             pthd.nv_ke_toan      AS "maNVKeToan",
             pthd.nv_cap_nhat     AS "maNVCapNhat",
             pthd.ma_hdt          AS "maHDT",
             hdt.tg_vao           AS "tgVao",
             hdt.thoi_han_thue    AS "thoiHanThue",
             hdt.ky_tt            AS "kyTT",
             hdt.ma_pdc           AS "maPDC",
             kh.ten_kh            AS "tenKH",
             kh.cccd              AS "cccd",
             kh.sdt               AS "sdt",
             kh.email             AS "emailKH",
             nvpt.ten_nv          AS "tenNVPhuTrach",
             nvk.ten_nv           AS "tenNVKeToan"
      FROM pt_hop_dong pthd
      JOIN hop_dong_thue hdt ON hdt.ma_hdt = pthd.ma_hdt
      JOIN phieu_dat_coc pdc ON pdc.ma_pdc = hdt.ma_pdc
      JOIN khach_hang kh     ON kh.ma_kh = pdc.khach_dat
      JOIN nhanvien nvpt     ON nvpt.ma_nv = hdt.nv_phu_trach
      JOIN nhanvien nvk      ON nvk.ma_nv = pthd.nv_ke_toan
      WHERE pthd.ma_pthd = ${maPTHD}
    `
    return rows[0] || null
  }

  // LoadDSPTHDDaLapHomNay(maNV): PhieuThuHopDong[] — do CHÍNH kế toán đang
  // đăng nhập lập, trong ngày hôm nay.
  static async LoadDSPTHDDaLapHomNay(maNV) {
    const rows = await prisma.$queryRaw`
      SELECT pthd.ma_pthd AS "maPTHD", pthd.ngay AS "ngay", pthd.trang_thai AS "trangThai",
             pthd.tong_tien AS "tongTien", pthd.ma_hdt AS "maHDT"
      FROM pt_hop_dong pthd
      WHERE pthd.nv_ke_toan = ${maNV}
        AND (pthd.ngay + INTERVAL '7 hour')::date = (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Ho_Chi_Minh')::date
      ORDER BY pthd.ngay DESC
    `
    return rows
  }
}

export default PhieuThuHopDongDB