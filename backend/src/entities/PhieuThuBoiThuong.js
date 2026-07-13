import PhieuThuBoiThuongDB from '../database/PhieuThuBoiThuongDB.js'

class PhieuThuBoiThuong {
  constructor(data = {}) {
    this.maPTDB = data.maPTDB
    this.ngay = data.ngay
    this.ngayThanhToan = data.ngayThanhToan
    this.ghiChu = data.ghiChu
    this.trangThai = data.trangThai
    this.tongTien = data.tongTien
    this.nvKeToan = data.maNVKeToan
    this.nvCapNhat = data.maNVCapNhat
    this.maBT = data.maBT

    // Các trường mở rộng khi load chi tiết (JOIN boi_thuong + khach_hang + nhanvien)
    this.maKH = data.maKH
    this.tenKH = data.tenKH
    this.cccd = data.cccd
    this.sdt = data.sdt
    this.email = data.emailKH
    this.ngayBT = data.ngayBT
    this.tenNVKeToan = data.tenNVKeToan
  }

  static async KiemTraTonTaiTheoBT(maBT) {
    return PhieuThuBoiThuongDB.KiemTraTonTaiTheoBT(maBT)
  }

  static async LoadDSPTBTDaLapHomNay(maNV) {
    const rows = await PhieuThuBoiThuongDB.LoadDSPTBTDaLapHomNay(maNV)
    return rows.map((r) => new PhieuThuBoiThuong(r))
  }

  static async LoadPTTheoMaBT(maBT) {
    const row = await PhieuThuBoiThuongDB.LoadPTTheoMaBT(maBT)
    return row ? new PhieuThuBoiThuong(row) : null
  }

  static async LoadPTBT(maPTDB) {
    const row = await PhieuThuBoiThuongDB.LoadPTBT(maPTDB)
    return row ? new PhieuThuBoiThuong(row) : null
  }

  static async ThemPTBT(ptbt) {
    const row = await PhieuThuBoiThuongDB.ThemPTBT(ptbt)
    return row ? new PhieuThuBoiThuong(row) : null
  }
}

export default PhieuThuBoiThuong