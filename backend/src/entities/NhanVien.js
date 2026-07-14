import NhanVienDB from '../database/NhanVienDB.js'

class NhanVien {
  constructor(data = {}) {
    this.maNV = data.maNV
    this.tenNV = data.tenNV
    this.loaiNV = data.loaiNV
    this.maCN = data.maCN
    this.tinhTrang = data.tinhTrang
  }

  static async LayTheoMaNV(maNV) {
    const row = await NhanVienDB.LayTheoMaNV(maNV)
    return row ? new NhanVien(row) : null
  }
}

export default NhanVien
