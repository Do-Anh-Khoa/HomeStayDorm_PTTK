import PhieuThuDatCocDB from '../database/PhieuThuDatCocDB.js'

class PhieuThuDatCoc {
  constructor(data = {}) {
    this.maPTDC = data.maPTDC
    this.ngay = data.ngay
    this.ngayThanhToan = data.ngayThanhToan
    this.ghiChu = data.ghiChu
    this.trangThai = data.trangThai
    this.tongTien = data.tongTien
    this.nvKeToan = data.maNVKeToan
    this.nvCapNhat = data.maNVCapNhat
    this.maPDC = data.maPDC

    // Trường mở rộng khi load chi tiết (JOIN phieu_dat_coc + khach_hang + nhanvien)
    this.ngayDC = data.ngayDC
    this.maKH = data.maKH
    this.maNVSale = data.maNVSale
    this.tenKH = data.tenKH
    this.cccd = data.cccd
    this.sdt = data.sdt
    this.email = data.emailKH
    this.tenNVSale = data.tenNVSale
    this.tenNVKeToan = data.tenNVKeToan
  }

  static async KiemTraTonTaiTheoPDC(maPDC) {
    return PhieuThuDatCocDB.KiemTraTonTaiTheoPDC(maPDC)
  }

  static async LoadPTTheoMaPDC(maPDC) {
    const row = await PhieuThuDatCocDB.LoadPTTheoMaPDC(maPDC)
    return row ? new PhieuThuDatCoc(row) : null
  }

  static async ThemPTDC(ptdc) {
    const row = await PhieuThuDatCocDB.ThemPTDC(ptdc)
    return row ? new PhieuThuDatCoc(row) : null
  }

  static async LoadPTDC(maPTDC) {
    const row = await PhieuThuDatCocDB.LoadPTDC(maPTDC)
    return row ? new PhieuThuDatCoc(row) : null
  }

  static async LoadDSPTDCDaLapHomNay(maNV) {
    const rows = await PhieuThuDatCocDB.LoadDSPTDCDaLapHomNay(maNV)
    return rows.map((r) => new PhieuThuDatCoc(r))
  }
}

export default PhieuThuDatCoc