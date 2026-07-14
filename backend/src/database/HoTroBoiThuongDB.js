// Gom 3 lớp DB nhỏ (VatDungDB, KhachHangDB, NhanVienDB) trong 1 file cho gọn.
import prisma from '../config/prisma.js'

export class VatDungDB {
  static async LayVatDung(tenVD) {
    const rows = await prisma.$queryRaw`
      SELECT ma_vd AS "maVD", ten_vd AS "tenVD", gia_boi_thuong AS "giaBoiThuong"
      FROM vat_dung WHERE ten_vd = ${tenVD}
    `
    return rows[0] || null
  }
}
export class KhachHangDB {
  // LoadKH(maKH): KhachHang
  static async LoadKH(maKH) {
    const rows = await prisma.$queryRaw`
      SELECT ma_kh, ten_kh, cccd, sdt, email, gioi_tinh, cong_viec, quoc_tich
      FROM khach_hang WHERE ma_kh = ${maKH}
    `
    return rows[0] || null
  }

  // LoadTimKiemKhach(tuKhoa): KhachHang[]
  static async LoadTimKiemKhach(tuKhoa) {
    const rows = await prisma.$queryRaw`
      SELECT ma_kh, ten_kh, cccd, sdt, email
      FROM khach_hang
      WHERE ten_kh ILIKE '%' || ${tuKhoa} || '%' OR ma_kh ILIKE '%' || ${tuKhoa} || '%'
    `
    return rows
  }
}

export class NhanVienDB {
  // LoadNV(maNV): NhanVien
  static async LoadNV(maNV) {
    const rows = await prisma.$queryRaw`
      SELECT ma_nv, ten_nv, cccd, sdt, gioi_tinh, ngay_sinh, loai_nv, email, tinh_trang, ma_cn
      FROM nhanvien WHERE ma_nv = ${maNV}
    `
    return rows[0] || null
  }
}