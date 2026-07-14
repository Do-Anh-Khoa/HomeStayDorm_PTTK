import PTTraPhongDB from '../database/PTTraPhongDB.js'

class PTTraPhong {
  constructor(data = {}) {
    this.maPT = data.maPT
    this.loaiPT = data.loaiPT || 'tra-phong'
    this.tenLoaiPT = data.tenLoaiPT || 'Trả phòng'
    this.maPTTP = data.maPTTP || data.maPT
    this.ngay = data.ngay
    this.ngayThanhToan = data.ngayThanhToan
    this.ghiChu = data.ghiChu
    this.trangThai = data.trangThai
    this.tongTien = data.tongTien
    this.tienHoanCoc = data.tienHoanCoc
    this.tienKhauTru = data.tienKhauTru
    this.maNVKeToan = data.maNVKeToan
    this.tenNVKeToan = data.tenNVKeToan
    this.maNVCapNhat = data.maNVCapNhat
    this.tenNVCapNhat = data.tenNVCapNhat
    this.maLienKet = data.maLienKet || data.maTP
    this.maTP = data.maTP
    this.ngayTP = data.ngayTP
    this.maHDT = data.maHDT
    this.maPDC = data.maPDC
    this.maKH = data.maKH
    this.tenKH = data.tenKH
    this.cccd = data.cccd
    this.sdt = data.sdt
    this.emailKH = data.emailKH
    this.maPhong = data.maPhong
    this.maGiuong = data.maGiuong
  }

  static async LayDanhSachCanCapNhat(tuKhoa, maCN) {
    const rows = await PTTraPhongDB.LayDanhSachCanCapNhat(tuKhoa, maCN)
    return rows.map((row) => new PTTraPhong(row))
  }

  static async LayLichSuCapNhat(maNV) {
    const rows = await PTTraPhongDB.LayLichSuCapNhat(maNV)
    return rows.map((row) => new PTTraPhong(row))
  }

  static async LayChiTiet(maPTTP, maCN) {
    const row = await PTTraPhongDB.LayChiTiet(maPTTP, maCN)
    return row ? new PTTraPhong(row) : null
  }

  static async KiemTraTrangThai(maPTTP, loaiPT, trangThai, maCN) {
    return PTTraPhongDB.KiemTraTrangThai(maPTTP, loaiPT, trangThai, maCN)
  }

  static async CapNhatDaThanhToan(maPTTP, ngayTT, nvCapNhat, maCN) {
    return PTTraPhongDB.CapNhatDaThanhToan(maPTTP, ngayTT, nvCapNhat, maCN)
  }
}

export default PTTraPhong
