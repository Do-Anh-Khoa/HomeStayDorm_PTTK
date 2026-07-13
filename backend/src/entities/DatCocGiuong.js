import DatCocGiuongDB from '../database/DatCocGiuongDB.js'
import { HE_SO_DAT_COC } from '../database/PhieuDatCocDB.js'

class DatCocGiuong {
  constructor(data = {}) {
    this.maPDC = data.maPDC
    this.maPhong = data.maPhong
    this.maGiuong = data.maGiuong
    this.trangThai = data.trangThai
    this.sucChuaToiDa = data.sucChuaToiDa
    this.maLoai = data.maLoai
    this.chiNhanh = data.chiNhanh
    this.tenLoai = data.tenLoai
    this.giaGiuong = Number(data.giaGiuong || 0)
    this.heSo = HE_SO_DAT_COC
    this.thanhTien = this.giaGiuong * HE_SO_DAT_COC
  }

  static async LoadDSGiuongDaCoc(maPDC) {
    const rows = await DatCocGiuongDB.LoadDSGiuongDaCoc(maPDC)
    return rows.map((r) => new DatCocGiuong(r))
  }
}

export default DatCocGiuong