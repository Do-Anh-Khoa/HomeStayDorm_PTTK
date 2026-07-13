import PTDatCocDB from '../database/PTDatCocDB.js'

class PTDatCoc {
  constructor(data = {}) {
    this.maPT = data.maPT
    this.loaiPT = data.loaiPT || 'dat-coc'
    this.tenLoaiPT = data.tenLoaiPT || 'Đặt cọc'
    this.maPTDC = data.maPTDC || data.maPT
    this.ngay = data.ngay
    this.ngayThanhToan = data.ngayThanhToan
    this.ghiChu = data.ghiChu
    this.trangThai = data.trangThai
    this.tongTien = data.tongTien
    this.maNVKeToan = data.maNVKeToan
    this.tenNVKeToan = data.tenNVKeToan
    this.maNVCapNhat = data.maNVCapNhat
    this.tenNVCapNhat = data.tenNVCapNhat
    this.maLienKet = data.maLienKet || data.maPDC
    this.maPDC = data.maPDC
    this.ngayDC = data.ngayDC
    this.trangThaiPhieuDatCoc = data.trangThaiPhieuDatCoc
    this.maKH = data.maKH
    this.tenKH = data.tenKH
    this.cccd = data.cccd
    this.sdt = data.sdt
    this.emailKH = data.emailKH
    this.maPhong = data.maPhong
    this.maGiuong = data.maGiuong
  }

  static async LayDanhSachCanCapNhat(tuKhoa, maCN) {
    const rows = await PTDatCocDB.LayDanhSachCanCapNhat(tuKhoa, maCN)
    return rows.map((row) => new PTDatCoc(row))
  }

  static async LayLichSuCapNhat(maNV) {
    const rows = await PTDatCocDB.LayLichSuCapNhat(maNV)
    return rows.map((row) => new PTDatCoc(row))
  }

  static async LayChiTiet(maPTDC, maCN) {
    const row = await PTDatCocDB.LayChiTiet(maPTDC, maCN)
    return row ? new PTDatCoc(row) : null
  }

  static async KiemTraTrangThai(maPTDC, loaiPT, trangThai, maCN) {
    return PTDatCocDB.KiemTraTrangThai(maPTDC, loaiPT, trangThai, maCN)
  }

  static async CapNhatDaThanhToan(maPTDC, ngayTT, nvCapNhat, maCN) {
    return PTDatCocDB.CapNhatDaThanhToan(maPTDC, ngayTT, nvCapNhat, maCN)
  }
}

export default PTDatCoc
