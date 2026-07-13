// QLPhieuThuDatCocController — tương ứng lớp QLPhieuThuDatCocController
// trong class diagram. Ráp Entity (PhieuDatCoc, PhieuThuDatCoc, DatCocGiuong)
// + Utils (GuiMailPTDC, InPTDacCoc) theo use-case "Lập PT đặt cọc" (Hình 92-95).

import PhieuDatCoc from '../entities/PhieuDatCoc.js'
import PhieuThuDatCoc from '../entities/PhieuThuDatCoc.js'
import DatCocGiuong from '../entities/DatCocGiuong.js'
import { NhanVienDB } from '../database/HoTroBoiThuongDB.js'
import { guiEmailYeuCauThanhToan } from '../utils/guiMailPTDC.js'
import { inPTDatCoc } from '../utils/inPTDatCoc.js'

// ------------------------------------------------------------------
// Bước 1 (Hình 92): danh sách PDC chưa lập phiếu thu.
// CHỈ lấy các PDC do NV Sale CÙNG CHI NHÁNH với kế toán đang đăng nhập.
// GET /api/phieu-thu-dat-coc/cho-xu-ly
// ------------------------------------------------------------------
export const loadDSPDCChuaLap = async (req, res) => {
  try {
    const nv = req.auth
    if (!nv?.ma_nv) return res.status(401).json({ message: 'Chưa đăng nhập.' })

    const nvHienTai = await NhanVienDB.LoadNV(nv.ma_nv)
    if (!nvHienTai) return res.status(404).json({ message: 'Không tìm thấy nhân viên.' })

    await PhieuDatCoc.CapNhatQuaHan()  

    const danhSach = await PhieuDatCoc.LoadDSPDCChuaLap(nvHienTai.ma_cn)
    return res.json({ data: danhSach })
  } catch (err) {
    console.error('loadDSPDCChuaLap:', err)
    return res.status(500).json({ message: 'Không thể tải danh sách phiếu đặt cọc.' })
  }
}

// ------------------------------------------------------------------
// Tìm kiếm theo mã PDC / tên khách hàng (ô search ở Hình 92).
// GET /api/phieu-thu-dat-coc/cho-xu-ly?tuKhoa=...
// ------------------------------------------------------------------
export const timKiemPDC = async (req, res) => {
  try {
    const nv = req.auth
    if (!nv?.ma_nv) return res.status(401).json({ message: 'Chưa đăng nhập.' })

    const tuKhoa = req.query.tuKhoa || ''
    const nvHienTai = await NhanVienDB.LoadNV(nv.ma_nv)
    if (!nvHienTai) return res.status(404).json({ message: 'Không tìm thấy nhân viên.' })

    const danhSach = await PhieuDatCoc.TimKiemPDC(tuKhoa, nvHienTai.ma_cn)
    return res.json({ data: danhSach })
  } catch (err) {
    console.error('timKiemPDC:', err)
    return res.status(500).json({ message: 'Tìm kiếm thất bại.' })
  }
}

// ------------------------------------------------------------------
// Bước 2 (Hình 93): chọn 1 PDC -> load thông tin, tính tổng tiền cọc.
// GET /api/phieu-thu-dat-coc/lap/:maPDC
// ------------------------------------------------------------------
export const loadThongTinLapPTDC = async (req, res) => {
  try {
    const { maPDC } = req.params

    const daTonTai = await PhieuThuDatCoc.KiemTraTonTaiTheoPDC(maPDC)
    if (daTonTai) {
      return res.status(409).json({
        message: 'Phiếu đặt cọc này đã được lập phiếu thu bởi nhân viên khác.',
      })
    }

    const duDieuKien = await PhieuDatCoc.KiemTraDuDieuKienLapPTDC(maPDC)
    if (!duDieuKien) {
      return res.status(409).json({
        message: 'Phiếu đặt cọc này không ở trạng thái đủ điều kiện để lập phiếu thu.',
      })
    }

    const pdc = await PhieuDatCoc.LoadPDC(maPDC)
    if (!pdc) return res.status(404).json({ message: 'Không tìm thấy phiếu đặt cọc.' })

    const dsGiuong = await DatCocGiuong.LoadDSGiuongDaCoc(maPDC)
    const tongTienCoc = dsGiuong.reduce((tong, g) => tong + g.thanhTien, 0)

    return res.json({
      data: {
        maPDC: pdc.maPDC,
        ngayDC: pdc.ngayDC,
        tenKH: pdc.tenKH,
        cccd: pdc.cccd,
        sdt: pdc.sdt,
        tenNVSale: pdc.tenNVSale,
        dsGiuong,
        tongTienCoc,
      },
    })
  } catch (err) {
    console.error('loadThongTinLapPTDC:', err)
    return res.status(500).json({ message: 'Không thể tải thông tin phiếu đặt cọc.' })
  }
}

// ------------------------------------------------------------------
// Bước 2 (tiếp, nút "Tạo Phiếu Thu Đặt Cọc" - Hình 93): tạo phiếu, kiểm
// tra lại tồn tại (chống race-condition), gửi email. Xuất PDF gọi riêng
// ở endpoint /pdf — frontend tự gọi ngay sau khi tạo thành công.
// POST /api/phieu-thu-dat-coc/lap
// body: { maPDC }
// ------------------------------------------------------------------
export const lapVaLuuPTDC = async (req, res) => {
  try {
    const { maPDC } = req.body
    const nv = req.auth
    if (!nv?.ma_nv) return res.status(401).json({ message: 'Chưa đăng nhập.' })
    if (!maPDC) return res.status(400).json({ message: 'Thiếu mã phiếu đặt cọc.' })

    const daTonTai = await PhieuThuDatCoc.KiemTraTonTaiTheoPDC(maPDC)
    if (daTonTai) {
      return res.status(409).json({
        message: 'Phiếu đặt cọc này đã được lập phiếu thu bởi nhân viên khác.',
      })
    }
     await PhieuDatCoc.CapNhatQuaHan() 
    const duDieuKien = await PhieuDatCoc.KiemTraDuDieuKienLapPTDC(maPDC)
    if (!duDieuKien) {
      return res.status(409).json({
        message: 'Phiếu đặt cọc này không ở trạng thái đủ điều kiện để lập phiếu thu.',
      })
    }

    const pdc = await PhieuDatCoc.LoadPDC(maPDC)
    if (!pdc) return res.status(404).json({ message: 'Không tìm thấy phiếu đặt cọc.' })

    const dsGiuong = await DatCocGiuong.LoadDSGiuongDaCoc(maPDC)
    const tongTienCoc = dsGiuong.reduce((tong, g) => tong + g.thanhTien, 0)

    const ptdcMoi = await PhieuThuDatCoc.ThemPTDC({
      maPDC: pdc.maPDC,
      tongTien: tongTienCoc,
      nvKeToan: nv.ma_nv,
    })

    const ptdcChiTiet = await PhieuThuDatCoc.LoadPTDC(ptdcMoi.maPTDC)

    const guiEmailThanhCong = await guiEmailYeuCauThanhToan(ptdcChiTiet)

    if (!guiEmailThanhCong) {
      return res.status(201).json({
        data: ptdcChiTiet,
        warning: 'Tạo phiếu thu đặt cọc thành công nhưng gửi email thất bại.',
      })
    }

    return res.status(201).json({
      data: ptdcChiTiet,
      message: 'Tạo phiếu thu đặt cọc thành công.',
    })
  } catch (err) {
    console.error('lapVaLuuPTDC:', err)
    return res.status(500).json({ message: 'Không thể tạo phiếu thu đặt cọc.' })
  }
}

// ------------------------------------------------------------------
// Bước 3 (Hình 94): danh sách PTDC đã lập HÔM NAY, chỉ những phiếu do
// CHÍNH nhân viên đang đăng nhập lập.
// GET /api/phieu-thu-dat-coc/da-lap-hom-nay
// ------------------------------------------------------------------
export const loadDSPTDCDaLapHomNay = async (req, res) => {
  try {
    const nv = req.auth
    if (!nv?.ma_nv) return res.status(401).json({ message: 'Chưa đăng nhập.' })

    const danhSach = await PhieuThuDatCoc.LoadDSPTDCDaLapHomNay(nv.ma_nv)
    return res.json({ data: danhSach })
  } catch (err) {
    console.error('loadDSPTDCDaLapHomNay:', err)
    return res.status(500).json({ message: 'Không thể tải danh sách phiếu thu đã lập hôm nay.' })
  }
}

// ------------------------------------------------------------------
// Bước 4 (Hình 95): xem chi tiết 1 phiếu thu đặt cọc đã lập.
// GET /api/phieu-thu-dat-coc/:maPTDC
// ------------------------------------------------------------------
export const xemChiTietPTDC = async (req, res) => {
  try {
    const { maPTDC } = req.params
    const ptdc = await PhieuThuDatCoc.LoadPTDC(maPTDC)
    if (!ptdc) return res.status(404).json({ message: 'Không tìm thấy phiếu thu.' })

    const dsGiuong = await DatCocGiuong.LoadDSGiuongDaCoc(ptdc.maPDC)

    return res.json({ data: { ...ptdc, dsGiuong } })
  } catch (err) {
    console.error('xemChiTietPTDC:', err)
    return res.status(500).json({ message: 'Không thể tải chi tiết phiếu thu.' })
  }
}

// ------------------------------------------------------------------
// Nút "In phiếu thu" (Hình 95): xuất PDF, trả file cho client tải về.
// GET /api/phieu-thu-dat-coc/:maPTDC/pdf
// ------------------------------------------------------------------
export const inPhieuThuPDF = async (req, res) => {
  try {
    const { maPTDC } = req.params
    const ptdc = await PhieuThuDatCoc.LoadPTDC(maPTDC)
    if (!ptdc) return res.status(404).json({ message: 'Không tìm thấy phiếu thu.' })

    const dsGiuong = await DatCocGiuong.LoadDSGiuongDaCoc(ptdc.maPDC)

    const filePath = await inPTDatCoc({ ...ptdc, dsGiuong })
    return res.download(filePath, `${ptdc.maPTDC}.pdf`)
  } catch (err) {
    console.error('inPhieuThuPDF:', err)
    return res.status(500).json({ message: 'Không thể xuất file PDF.' })
  }
}