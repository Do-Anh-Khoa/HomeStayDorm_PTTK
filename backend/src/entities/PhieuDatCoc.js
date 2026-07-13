import PhieuDatCocDB from '../database/PhieuDatCocDB.js'

class PhieuDatCoc {
  constructor(data = {}) {
    this.maPDC = data.maPDC
    this.ngayDC = data.ngayDC
    this.trangThai = data.trangThai
    this.khachDat = data.khachDat ?? data.maKH
    this.nvSale = data.nvSale ?? data.maNVSale
    this.tenKH = data.tenKH
    this.cccd = data.cccd
    this.sdt = data.sdt
    this.tenNVSale = data.tenNVSale
  }

  static async LoadDSPDCChuaLap(maCN) {
    const rows = await PhieuDatCocDB.LoadDSPDCChuaLap(maCN)
    return rows.map((r) => new PhieuDatCoc(r))
  }

  static async TimKiemPDC(tuKhoa, maCN) {
    const rows = await PhieuDatCocDB.TimKiemPDC(tuKhoa, maCN)
    return rows.map((r) => new PhieuDatCoc(r))
  }

  static async LoadPDC(maPDC) {
    const row = await PhieuDatCocDB.LoadPDC(maPDC)
    return row ? new PhieuDatCoc(row) : null
  }

  static async LoadPDCTheoKhach(maKH) {
    const row = await PhieuDatCocDB.LoadPDCTheoKhach(maKH)
    return row ? new PhieuDatCoc(row) : null
  }

  static async KiemTraDuDieuKienLapPTDC(maPDC) {
    return PhieuDatCocDB.KiemTraDuDieuKienLapPTDC(maPDC)
  }
  static async CapNhatQuaHan() {
  return PhieuDatCocDB.CapNhatQuaHan()
}
}

export default PhieuDatCoc