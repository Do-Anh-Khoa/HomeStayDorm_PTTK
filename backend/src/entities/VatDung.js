// backend/src/entities/VatDung.js
import { VatDungDB } from '../database/HoTroBoiThuongDB.js'

class VatDung {
  constructor(data = {}) {
    this.maVD = data.maVD
    this.tenVD = data.tenVD
    this.giaBoiThuong = data.giaBoiThuong
  }

  static async LayVatDung(tenVD) {
    const row = await VatDungDB.LayVatDung(tenVD)
    return row ? new VatDung(row) : null
  }
}

export default VatDung