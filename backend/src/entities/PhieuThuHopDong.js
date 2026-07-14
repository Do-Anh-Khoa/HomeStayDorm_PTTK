// entities/PhieuThuHopDong.js
//
// PhieuThuHopDong — entity mỏng, ủy quyền trực tiếp xuống PhieuThuHopDongDB,
// đúng theo phong cách PhieuThuDatCoc dùng trong phieuThuDatCocController.js
// (Controller chỉ biết tới Entity, không đụng trực tiếp vào DB layer).

import * as PhieuThuHopDongDBModule from '../database/PhieuThuHopDongDB.js'

const PhieuThuHopDongDB = PhieuThuHopDongDBModule.default || PhieuThuHopDongDBModule

class PhieuThuHopDong {
  static ThemPTHD({ maHDT, tongTien, nvKeToan, ghiChu }) {
    return PhieuThuHopDongDB.ThemPTHD({ maHDT, tongTien, nvKeToan, ghiChu })
  }

  static LoadPTHD(maPTHD) {
    return PhieuThuHopDongDB.LoadPTHD(maPTHD)
  }

  static LoadDSPTHDDaLapHomNay(maNV) {
    return PhieuThuHopDongDB.LoadDSPTHDDaLapHomNay(maNV)
  }
}

export default PhieuThuHopDong