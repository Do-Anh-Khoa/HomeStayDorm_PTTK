// entities/HopDongThue.js
//
// HopDongThue — entity chứa TOÀN BỘ business logic của use-case
// "Lập phiếu thu hợp đồng": tính ngày mốc chuẩn, xác định kỳ hiện tại,
// kiểm tra điều kiện đến hạn, và tính tiền cần thu (kể cả kỳ cuối quy đổi
// theo ngày thực tế). HopDongThueDB chỉ lo truy vấn thô.
//
// Công thức (theo đặc tả use-case):
//   Ngày mốc = TGVao + SoPhieuThuDaLap x KyTT (tháng)
//   Đủ điều kiện lập PT khi:
//     NgayHienTai >= NgayMoc
//     HOẶC SoNgayConLaiCuaHopDong < KyTT quy đổi ngày - 2 (kỳ cuối, sắp hết hạn)

import * as HopDongThueDB from '../database/hop-dong-thue.database.js'

const NGAY_MOI_THANG = 30 // quy ước quy đổi ngày/tháng khi tính kỳ cuối
const SO_NGAY_DEM = 2      // "hai ngày trước kỳ thanh toán quy định"

const themThang = (date, soThang) => {
  const d = new Date(date)
  d.setMonth(d.getMonth() + soThang)
  return d
}

const soNgayGiua = (a, b) => Math.round((new Date(b) - new Date(a)) / 86400000)

class HopDongThue {
  // Tính ngày mốc / kỳ hiện tại / có phải kỳ cuối / đã đủ điều kiện lập PT
  // hay chưa, cho MỘT hợp đồng (đã có soPhieuDaLap mới nhất).
  // Trả về null nếu hợp đồng đã thu đủ tất cả các kỳ (không còn kỳ nào để lập).
  static TinhKyThu({ tgVao, thoiHanThue, kyTT, soPhieuDaLap }) {
    const ngayKetThuc = themThang(tgVao, thoiHanThue)
    const ngayMoc = themThang(tgVao, kyTT * soPhieuDaLap)
    const kyHienTai = soPhieuDaLap + 1

    if (ngayMoc >= ngayKetThuc) return null

    const ngayHienTai = new Date()
    const soNgayConLaiHD = soNgayGiua(ngayMoc, ngayKetThuc)
    const kyTTTinhNgay = kyTT * NGAY_MOI_THANG
    const laKyCuoi = soNgayConLaiHD < kyTTTinhNgay - SO_NGAY_DEM
    const duDieuKien = ngayHienTai >= ngayMoc || laKyCuoi

    return { ngayMoc, ngayKetThuc, kyHienTai, duDieuKien, laKyCuoi, soNgayConLaiHD }
  }

  // Tính tiền cho 1 giường: bình thường = giá x số tháng kỳ TT;
  // kỳ cuối = quy đổi theo số ngày thực tế còn lại đến ngày kết thúc HĐ.
  static TinhTienGiuong(giuong, kyTT, laKyCuoi, soNgayConLaiHD) {
    const giaThue = Number(giuong.giaGiuong)
    if (laKyCuoi) {
      const soNgayThu = Math.max(soNgayConLaiHD, 0)
      return {
        soThangThu: +(soNgayThu / NGAY_MOI_THANG).toFixed(2),
        soNgayThu,
        thanhTien: Math.round((giaThue / NGAY_MOI_THANG) * soNgayThu),
      }
    }
    return {
      soThangThu: kyTT,
      soNgayThu: null,
      thanhTien: Math.round(giaThue * kyTT),
    }
  }

  // Ghép DS giường + tính tổng tiền cho 1 HĐT, LUÔN đọc soPhieuDaLap MỚI
  // NHẤT tại thời điểm gọi (quan trọng để chống race-condition khi 2 kế
  // toán cùng thao tác 1 hợp đồng).
  static async LoadChiTietTinhTien(maHDT) {
    const hdtRaw = await HopDongThueDB.LoadHDT(maHDT)
    if (!hdtRaw) return null

    const soPhieuDaLap = await HopDongThueDB.DemSoPhieuDaLap(maHDT)
    const hdt = { ...hdtRaw, soPhieuDaLap }
    const ky = this.TinhKyThu(hdt)
    if (!ky) return null

    const dsGiuongRaw = await HopDongThueDB.LoadDSGiuongThue(maHDT)

    const dsGiuong = dsGiuongRaw.map((g) => ({
      ...g,
      ...this.TinhTienGiuong(g, hdt.kyTT, ky.laKyCuoi, ky.soNgayConLaiHD),
    }))

    const tongTien = dsGiuong.reduce((tong, g) => tong + g.thanhTien, 0)

    // Nhãn "Phòng/Giường" hiển thị: nếu số giường đã thuê trong 1 phòng =
    // tổng số giường của phòng đó -> hiển thị "Phòng {maPhong}" (thuê
    // nguyên phòng); ngược lại liệt kê từng giường lẻ.
    const nhomTheoPhong = {}
    dsGiuongRaw.forEach((g) => {
      if (!nhomTheoPhong[g.maPhong]) nhomTheoPhong[g.maPhong] = { tong: Number(g.tongGiuongPhong), giuong: [] }
      nhomTheoPhong[g.maPhong].giuong.push(g.maGiuong)
    })
    const nhanPhongGiuong = Object.entries(nhomTheoPhong)
      .map(([maPhong, tt]) =>
        tt.giuong.length >= tt.tong
          ? `Phòng ${maPhong}`
          : tt.giuong.map((mg) => `${mg} - ${maPhong}`).join(', ')
      )
      .join(', ')

    return {
      maHDT: hdt.maHDT,
      maPDC: hdt.maPDC,
      tgVao: hdt.tgVao,
      thoiHanThue: hdt.thoiHanThue,
      kyTT: hdt.kyTT,
      tenKH: hdt.tenKH,
      cccd: hdt.cccd,
      sdt: hdt.sdt,
      emailKH: hdt.emailKH,
      tenNVPhuTrach: hdt.tenNVPhuTrach,
      soPhieuDaLap,
      kyHienTai: ky.kyHienTai,
      ngayMoc: ky.ngayMoc,
      laKyCuoi: ky.laKyCuoi,
      duDieuKien: ky.duDieuKien,
      nhanPhongGiuong,
      dsGiuong,
      tongTien,
    }
  }

  // Danh sách hợp đồng ĐỦ ĐIỀU KIỆN lập phiếu thu, thuộc chi nhánh maCN.
  static async LoadDSHDCanLap(maCN) {
    return this.#locDSDuDieuKien(await HopDongThueDB.LoadDSHDConHieuLuc(maCN))
  }

  static async TimKiem(tuKhoa, maCN) {
    return this.#locDSDuDieuKien(await HopDongThueDB.TimKiemHD(tuKhoa, maCN))
  }

  static async #locDSDuDieuKien(dsHD) {
    const ketQua = []
    for (const hdt of dsHD) {
      const chiTiet = await this.LoadChiTietTinhTien(hdt.maHDT)
      if (!chiTiet || !chiTiet.duDieuKien) continue
      ketQua.push({
        maHDT: chiTiet.maHDT,
        tenKH: chiTiet.tenKH,
        cccd: chiTiet.cccd,
        nhanPhongGiuong: chiTiet.nhanPhongGiuong,
        kyTT: chiTiet.kyTT,
        kyHienTai: chiTiet.kyHienTai,
        tgVao: chiTiet.tgVao,
        laKyCuoi: chiTiet.laKyCuoi,
      })
    }
    return ketQua
  }

  // A6 (chống race-condition): kiểm tra lại điều kiện NGAY TRƯỚC khi tạo
  // phiếu. Nếu kế toán khác vừa lập phiếu cho đúng kỳ này, soPhieuDaLap sẽ
  // tăng lên -> ngày mốc dời tới tương lai -> điều kiện false -> báo lỗi.
  static async KiemTraDuDieuKienLapPTHD(maHDT) {
    const chiTiet = await this.LoadChiTietTinhTien(maHDT)
    return !!(chiTiet && chiTiet.duDieuKien)
  }
}

export default HopDongThue