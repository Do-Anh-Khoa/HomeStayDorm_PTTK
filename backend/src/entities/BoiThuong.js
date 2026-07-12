// backend/src/entities/BoiThuong.js
import BoiThuongDB from '../database/BoiThuongDB.js'

class BoiThuong {
  constructor(data = {}) {
    this.maBT = data.maBT
    this.ngayBT = data.ngayBT
    this.maKH = data.maKH
    this.nvQuanLy = data.nvQuanLy
    this.tenKH = data.tenKH
    this.cccd = data.cccd
    this.sdt = data.sdt
    this.soLanViPham = data.soLanViPham
  }

  static async LoadBT(maBT) {
    const row = await BoiThuongDB.LoadBT(maBT)
    return row ? new BoiThuong(row) : null
  }

  static async LoadBTTheoKhach(maKH) {
    const rows = await BoiThuongDB.LoadBTTheoKhach(maKH)
    return rows.map((r) => new BoiThuong(r))
  }

  static async LoadDSBTChoXuLy(maCN) {
    const rows = await BoiThuongDB.LoadDSBTChoXuLy(maCN)
    return rows.map((r) => new BoiThuong(r))
  }

  static async TimKiemBBBT(tuKhoa, maCN) {
    const rows = await BoiThuongDB.TimKiemBBBT(tuKhoa, maCN)
    return rows.map((r) => new BoiThuong(r))
  }

  static async TinhSoLanViPhamTheoBT(maBT) {
    return BoiThuongDB.TinhSoLanViPhamTheoBT(maBT)
  }
}

export default BoiThuong