import PTHopDongDB from '../database/PTHopDongDB.js'

class PTHopDong {
  constructor(data = {}) {
    this.maPT = data.maPT
    this.loaiPT = data.loaiPT || 'hop-dong'
    this.tenLoaiPT = data.tenLoaiPT || 'Hợp đồng'
    this.maPTHD = data.maPTHD || data.maPT
    this.ngay = data.ngay
    this.ngayThanhToan = data.ngayThanhToan
    this.ghiChu = data.ghiChu
    this.trangThai = data.trangThai
    this.tongTien = data.tongTien
    this.maNVKeToan = data.maNVKeToan
    this.tenNVKeToan = data.tenNVKeToan
    this.maNVCapNhat = data.maNVCapNhat
    this.tenNVCapNhat = data.tenNVCapNhat
    this.maLienKet = data.maLienKet || data.maHDT
    this.maHDT = data.maHDT
    this.tgTaoHD = data.tgTaoHD
    this.tgVao = data.tgVao
    this.thoiHanThue = data.thoiHanThue
    this.kyTT = data.kyTT
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
    const rows = await PTHopDongDB.LayDanhSachCanCapNhat(tuKhoa, maCN)
    return rows.map((row) => new PTHopDong(row))
  }

  static async LayLichSuCapNhat(maNV) {
    const rows = await PTHopDongDB.LayLichSuCapNhat(maNV)
    return rows.map((row) => new PTHopDong(row))
  }

  static async LayChiTiet(maPTHD, maCN) {
    const row = await PTHopDongDB.LayChiTiet(maPTHD, maCN)
    return row ? new PTHopDong(row) : null
  }

  static async KiemTraTrangThai(maPTHD, loaiPT, trangThai, maCN) {
    return PTHopDongDB.KiemTraTrangThai(maPTHD, loaiPT, trangThai, maCN)
  }

  static async CapNhatDaThanhToan(maPTHD, ngayTT, nvCapNhat, maCN) {
    return PTHopDongDB.CapNhatDaThanhToan(maPTHD, ngayTT, nvCapNhat, maCN)
  }
}

export default PTHopDong
