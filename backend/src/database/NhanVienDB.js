import prisma from '../config/prisma.js'

class NhanVienDB {
  static async LayTheoMaNV(maNV) {
    const rows = await prisma.$queryRaw`
      SELECT ma_nv     AS "maNV",
             ten_nv    AS "tenNV",
             loai_nv   AS "loaiNV",
             ma_cn     AS "maCN",
             tinh_trang AS "tinhTrang"
      FROM nhanvien
      WHERE ma_nv = ${maNV}
      LIMIT 1
    `

    return rows[0] || null
  }
}

export default NhanVienDB
