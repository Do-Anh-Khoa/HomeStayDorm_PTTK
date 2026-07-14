import PTBoiThuongDB from '../database/PTBoiThuongDB.js'

class PTBoiThuong {
  constructor(data = {}) {
    this.maPT = data.maPT
    this.loaiPT = data.loaiPT || 'boi-thuong'
    this.tenLoaiPT = data.tenLoaiPT || 'Bồi thường'
    this.maPTBT = data.maPTBT || data.maPT
    this.ngay = data.ngay
    this.ngayThanhToan = data.ngayThanhToan
    this.ghiChu = data.ghiChu
    this.trangThai = data.trangThai
    this.tongTien = data.tongTien
    this.maNVKeToan = data.maNVKeToan
    this.tenNVKeToan = data.tenNVKeToan
    this.maNVCapNhat = data.maNVCapNhat
    this.tenNVCapNhat = data.tenNVCapNhat
    this.maLienKet = data.maLienKet || data.maBT
    this.maBT = data.maBT
    this.ngayBT = data.ngayBT
    this.maKH = data.maKH
    this.tenKH = data.tenKH
    this.cccd = data.cccd
    this.sdt = data.sdt
    this.emailKH = data.emailKH
  }

  static async LayDanhSachCanCapNhat(tuKhoa, maCN) {
    const rows = await PTBoiThuongDB.LayDanhSachCanCapNhat(tuKhoa, maCN)
    return rows.map((row) => new PTBoiThuong(row))
  }

  static async LayLichSuCapNhat(maNV) {
    const rows = await PTBoiThuongDB.LayLichSuCapNhat(maNV)
    return rows.map((row) => new PTBoiThuong(row))
  }

  static async LayChiTiet(maPTBT, maCN) {
    const row = await PTBoiThuongDB.LayChiTiet(maPTBT, maCN)
    return row ? new PTBoiThuong(row) : null
  }

  static async KiemTraTrangThai(maPTBT, loaiPT, trangThai, maCN) {
    return PTBoiThuongDB.KiemTraTrangThai(maPTBT, loaiPT, trangThai, maCN)
  }

  static async CapNhatDaThanhToan(maPTBT, ngayTT, nvCapNhat, maCN) {
    return PTBoiThuongDB.CapNhatDaThanhToan(maPTBT, ngayTT, nvCapNhat, maCN)
  }
}

export default PTBoiThuong
