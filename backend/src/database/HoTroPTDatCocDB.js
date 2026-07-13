// PhongDB, LoaiPhongDB — riêng cho module Lập PT Đặt Cọc.
// KhachHangDB, NhanVienDB đã có sẵn trong HoTroBoiThuongDB.js, tái sử dụng
// lại (import từ đó), KHÔNG tạo trùng ở đây.
import prisma from '../config/prisma.js'

export class PhongDB {
  static async LoadPhong(maPhong) {
    const rows = await prisma.$queryRaw`
      SELECT ma_phong AS "maPhong", suc_chua_toi_da AS "sucChuaToiDa",
             ma_loai AS "maLoai", chi_nhanh AS "chiNhanh"
      FROM phong WHERE ma_phong = ${maPhong}
    `
    return rows[0] || null
  }
}

export class LoaiPhongDB {
  static async LoadLoaiPhong(maLoai) {
    const rows = await prisma.$queryRaw`
      SELECT ma_loai AS "maLoai", ten_loai AS "tenLoai",
             gia_nguyen_phong AS "giaNguyenPhong", gia_giuong AS "giaGiuong",
             thoi_han_toi_da AS "thoiHanToiDa", thoi_han_toi_thieu AS "thoiHanToiThieu"
      FROM loai_phong WHERE ma_loai = ${maLoai}
    `
    return rows[0] || null
  }
}