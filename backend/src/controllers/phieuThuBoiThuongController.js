// backend/src/controllers/phieuThuBoiThuongController.js
import BoiThuong from '../entities/BoiThuong.js'
import PhieuThuBoiThuong from '../entities/PhieuThuBoiThuong.js'
import VatDung from '../entities/VatDung.js'
import { NhanVienDB } from '../database/HoTroBoiThuongDB.js'
import { guiEmailThongBaoDongPhat } from '../utils/guiMailPhieuThuBT.js'
import { inPTBT } from '../utils/inPTBoiThuong.js'

// Toàn bộ use-case 1.4.20 chỉ xử lý MỘT loại vi phạm cố định: mất thẻ ra vào.
// Vì boi_thuong không lưu loại vật dụng, tên này được dùng để tra cứu
// VatDung.LayVatDung(tenVD) mỗi khi cần lấy đơn giá bồi thường.
const TEN_VD_VI_PHAM = 'Thẻ ra vào'

// Bước 1: danh sách biên bản bồi thường chờ xử lý
// CHỈ lấy các BT do người quản lý CÙNG CHI NHÁNH với kế toán đang đăng nhập.
// GET /api/phieu-thu-boi-thuong/cho-xu-ly
export const loadDSBTChoXuLy = async (req, res) => {
  try {
    const nv = req.auth // lấy từ middleware xác thực (đã đăng nhập)
    if (!nv?.ma_nv) return res.status(401).json({ message: 'Chưa đăng nhập.' })

    const nvHienTai = await NhanVienDB.LoadNV(nv.ma_nv)
    if (!nvHienTai) return res.status(404).json({ message: 'Không tìm thấy nhân viên.' })

    const danhSach = await BoiThuong.LoadDSBTChoXuLy(nvHienTai.ma_cn)
    return res.json({ data: danhSach })
  } catch (err) {
    console.error('loadDSBTChoXuLy:', err)
    return res.status(500).json({ message: 'Không thể tải danh sách biên bản bồi thường.' })
  }
}


// Tìm kiếm theo mã biên bản / tên khách hàng 
// GET /api/phieu-thu-boi-thuong/cho-xu-ly?tuKhoa=...
export const timKiemBBBT = async (req, res) => {
  try {
    const nv = req.auth
    if (!nv?.ma_nv) return res.status(401).json({ message: 'Chưa đăng nhập.' })

    const tuKhoa = req.query.tuKhoa || ''
    const nvHienTai = await NhanVienDB.LoadNV(nv.ma_nv)
    if (!nvHienTai) return res.status(404).json({ message: 'Không tìm thấy nhân viên.' })

    const danhSach = await BoiThuong.TimKiemBBBT(tuKhoa, nvHienTai.ma_cn)
    return res.json({ data: danhSach })
  } catch (err) {
    console.error('timKiemBBBT:', err)
    return res.status(500).json({ message: 'Tìm kiếm thất bại.' })
  }
}

// Bước 2: chọn 1 biên bản -> load thông tin, tự tính số lần vi
// phạm và số tiền cần thu, đổ sẵn lên biểu mẫu.
// GET /api/phieu-thu-boi-thuong/lap/:maBT

export const loadThongTinLapPTBT = async (req, res) => {
  try {
    const { maBT } = req.params

    // A7: nếu BT đã có phiếu thu rồi thì không cho lập nữa
    const daTonTai = await PhieuThuBoiThuong.KiemTraTonTaiTheoBT(maBT)
    if (daTonTai) {
      return res.status(409).json({
        message: 'Biên bản bồi thường này đã được lập phiếu thu bởi nhân viên khác.',
      })
    }

    const bt = await BoiThuong.LoadBT(maBT)
    if (!bt) return res.status(404).json({ message: 'Không tìm thấy biên bản bồi thường.' })

    // LayVatDung(tenVD): VatDung — tra riêng theo tên
    const vd = await VatDung.LayVatDung(TEN_VD_VI_PHAM)
    if (!vd) {
      return res.status(500).json({ message: `Không tìm thấy vật dụng "${TEN_VD_VI_PHAM}" trong hệ thống.` })
    }

    const tongTienPhat = bt.soLanViPham * Number(vd.giaBoiThuong)

    return res.json({
      data: {
        maBT: bt.maBT,
        ngayBT: bt.ngayBT,
        maKH: bt.maKH,
        tenKH: bt.tenKH,
        cccd: bt.cccd,
        sdt: bt.sdt,
        tenVD: vd.tenVD,
        giaBoiThuong: vd.giaBoiThuong,
        soLanViPham: bt.soLanViPham,
        tongTienPhat,
      },
    })
  } catch (err) {
    console.error('loadThongTinLapPTBT:', err)
    return res.status(500).json({ message: 'Không thể tải thông tin biên bản bồi thường.' })
  }
}

// Bước 2 (nút "Tạo & In Phiếu Thu Bồi Thường" ):
// tạo phiếu thu, kiểm tra lại tồn tại (chống race-condition khi 2 kế toán
// cùng xử lý 1 BT), gửi email, xuất PDF.
// POST /api/phieu-thu-boi-thuong/lap
// body: { maBT }
export const lapVaLuuPTBT = async (req, res) => {
  try {
    const { maBT } = req.body
    const nv = req.auth
    if (!nv?.ma_nv) return res.status(401).json({ message: 'Chưa đăng nhập.' })
    if (!maBT) return res.status(400).json({ message: 'Thiếu mã biên bản bồi thường.' })

    // B7: kiểm tra lại lần cuối trước khi ghi (A7)
    const daTonTai = await PhieuThuBoiThuong.KiemTraTonTaiTheoBT(maBT)
    if (daTonTai) {
      return res.status(409).json({
        message: 'Biên bản bồi thường này đã được lập phiếu thu bởi nhân viên khác.',
      })
    }

    const bt = await BoiThuong.LoadBT(maBT)
    if (!bt) return res.status(404).json({ message: 'Không tìm thấy biên bản bồi thường.' })

    const vd = await VatDung.LayVatDung(TEN_VD_VI_PHAM)
    if (!vd) {
      return res.status(500).json({ message: `Không tìm thấy vật dụng "${TEN_VD_VI_PHAM}" trong hệ thống.` })
    }

    const tongTienPhat = bt.soLanViPham * Number(vd.giaBoiThuong)

    // Tạo & lưu phiếu thu — trạng thái "Chưa thanh toán", ngày lập = hiện tại,
    // nhân viên phụ trách = kế toán đang đăng nhập.
    const ptbtMoi = await PhieuThuBoiThuong.ThemPTBT({
      maBT: bt.maBT,
      tongTien: tongTienPhat,
      nvKeToan: nv.ma_nv,
    })

    // Load lại đầy đủ thông tin (khách hàng, nhân viên...) để gửi mail / in PDF
    const ptbtChiTiet = await PhieuThuBoiThuong.LoadPTBT(ptbtMoi.maPTDB)
    ptbtChiTiet.tenVD = vd.tenVD
    ptbtChiTiet.giaBoiThuong = vd.giaBoiThuong
    ptbtChiTiet.soLanViPham = bt.soLanViPham

    // Gửi email thông báo đóng phạt
    const guiEmailThanhCong = await guiEmailThongBaoDongPhat(ptbtChiTiet)

    if (!guiEmailThanhCong) {
      // A9: tạo phiếu thành công nhưng gửi email thất bại
      return res.status(201).json({
        data: ptbtChiTiet,
        warning: 'Tạo phiếu thu đền bù thành công nhưng gửi email thất bại.',
      })
    }

    return res.status(201).json({
      data: ptbtChiTiet,
      message: 'Tạo phiếu thu bồi thường thành công.',
    })
  } catch (err) {
    console.error('lapVaLuuPTBT:', err)
    return res.status(500).json({ message: 'Không thể tạo phiếu thu bồi thường.' })
  }
}

// Bước 3 : danh sách phiếu thu bồi thường đã lập HÔM NAY,
// chỉ những phiếu do CHÍNH nhân viên đang đăng nhập lập.
// GET /api/phieu-thu-boi-thuong/da-lap-hom-nay
export const loadDSPTBTDaLapHomNay = async (req, res) => {
  try {
    const nv = req.auth
    if (!nv?.ma_nv) return res.status(401).json({ message: 'Chưa đăng nhập.' })

    const danhSach = await PhieuThuBoiThuong.LoadDSPTBTDaLapHomNay(nv.ma_nv)
    return res.json({ data: danhSach })
  } catch (err) {
    console.error('loadDSPTBTDaLapHomNay:', err)
    return res.status(500).json({ message: 'Không thể tải danh sách phiếu thu đã lập hôm nay.' })
  }
}

// Bước 4: xem chi tiết 1 phiếu thu đã lập
// GET /api/phieu-thu-boi-thuong/:maPTDB
export const xemChiTietPTBT = async (req, res) => {
  try {
    const { maPTDB } = req.params
    const ptbt = await PhieuThuBoiThuong.LoadPTBT(maPTDB)
    if (!ptbt) return res.status(404).json({ message: 'Không tìm thấy phiếu thu.' })

    const vd = await VatDung.LayVatDung(TEN_VD_VI_PHAM)
const giaBoiThuong = Number(vd?.giaBoiThuong || 0)
const tongTien = Number(ptbt.tongTien || 0)

ptbt.tenVD = vd?.tenVD
ptbt.giaBoiThuong = giaBoiThuong
ptbt.soLanViPham = giaBoiThuong > 0 ? Math.round(tongTien / giaBoiThuong) : 0

    return res.json({ data: ptbt })
  } catch (err) {
    console.error('xemChiTietPTBT:', err)
    return res.status(500).json({ message: 'Không thể tải chi tiết phiếu thu.' })
  }
}

// Nút "In phiếu thu": xuất PDF và trả file cho client tải về
// GET /api/phieu-thu-boi-thuong/:maPTDB/pdf
export const inPhieuThuPDF = async (req, res) => {
  try {
    const { maPTDB } = req.params
    const ptbt = await PhieuThuBoiThuong.LoadPTBT(maPTDB)
    if (!ptbt) return res.status(404).json({ message: 'Không tìm thấy phiếu thu.' })

const vd = await VatDung.LayVatDung(TEN_VD_VI_PHAM)
const giaBoiThuong = Number(vd?.giaBoiThuong || 0)
const tongTien = Number(ptbt.tongTien || 0)

ptbt.tenVD = vd?.tenVD
ptbt.giaBoiThuong = giaBoiThuong
ptbt.soLanViPham = giaBoiThuong > 0 ? Math.round(tongTien / giaBoiThuong) : 0
    const filePath = await inPTBT(ptbt)
    return res.download(filePath, `${ptbt.maPTDB}.pdf`)
  } catch (err) {
    console.error('inPhieuThuPDF:', err)
    return res.status(500).json({ message: 'Không thể xuất file PDF.' })
  }
}