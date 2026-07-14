import NhanVien from '../entities/NhanVien.js'
import PhieuDatCoc from '../entities/PhieuDatCoc.js'
import PTDatCoc from '../entities/PTDatCoc.js'
import PTHopDong from '../entities/PTHopDong.js'

const LOAI_PHIEU_THU = {
  'dat-coc': {
    ten: 'Đặt cọc',
    Entity: PTDatCoc,
  },
  'hop-dong': {
    ten: 'Hợp đồng',
    Entity: PTHopDong,
  },
}

const sapXepTheoNgayMoiNhat = (a, b) => {
  const ngayA = new Date(a.ngayThanhToan || a.ngay || 0).getTime()
  const ngayB = new Date(b.ngayThanhToan || b.ngay || 0).getTime()
  return ngayB - ngayA
}

const layMaNVTuToken = (req) => req.auth?.ma_nv || req.auth?.maNV
const layLoaiNVTuToken = (req) => req.auth?.loai_nv || req.auth?.loaiNV

const chuanHoaLoaiPT = (loaiPT) => {
  const value = String(loaiPT || '').trim()
  if (['dat-coc', 'datCoc', 'pt-dat-coc', 'PTDatCoc'].includes(value)) return 'dat-coc'
  if (['hop-dong', 'hopDong', 'pt-hop-dong', 'PTHopDong'].includes(value)) return 'hop-dong'
  return null
}

const parseNgayThanhToan = (value) => {
  if (!value) return { error: 'Vui lòng nhập thời điểm thanh toán.' }

  const ngay = new Date(value)
  if (Number.isNaN(ngay.getTime()) || ngay > new Date()) {
    return { error: 'Thời điểm thanh toán không hợp lệ.' }
  }

  return { ngay }
}

const layNhanVienSaleDangNhap = async (req, res) => {
  const maNV = layMaNVTuToken(req)
  if (!maNV) {
    res.status(401).json({ message: 'Bạn chưa đăng nhập.' })
    return null
  }

  const nvHienTai = await NhanVien.LayTheoMaNV(maNV)
  if (!nvHienTai) {
    res.status(404).json({ message: 'Không tìm thấy nhân viên đang đăng nhập.' })
    return null
  }

  if (nvHienTai.loaiNV !== 'SALE') {
    res.status(403).json({ message: 'Chỉ Nhân viên Sale được cập nhật trạng thái phiếu thu này.' })
    return null
  }

  return nvHienTai
}

const dongBoPhieuDatCocQuaHan = async () => {
  await PhieuDatCoc.CapNhatCacPhieuQuaHan()
}

// LoadDanhSachCanCapNhat(tuKhoa, maNV): Object[]
// GET /api/cap-nhat-phieu-thu-sale/can-cap-nhat?tuKhoa=...
export const loadDanhSachCanCapNhat = async (req, res) => {
  try {
    const nvHienTai = await layNhanVienSaleDangNhap(req, res)
    if (!nvHienTai) return

    await dongBoPhieuDatCocQuaHan()

    const tuKhoa = req.query.tuKhoa || ''
    const [dsPTDatCoc, dsPTHopDong] = await Promise.all([
      PTDatCoc.LayDanhSachCanCapNhat(tuKhoa, nvHienTai.maCN),
      PTHopDong.LayDanhSachCanCapNhat(tuKhoa, nvHienTai.maCN),
    ])

    const data = [...dsPTDatCoc, ...dsPTHopDong].sort(sapXepTheoNgayMoiNhat)
    return res.json({ data })
  } catch (err) {
    console.error('loadDanhSachCanCapNhatSale:', err)
    return res.status(500).json({ message: 'Không thể tải danh sách phiếu thu cần cập nhật.' })
  }
}

// LoadLichSuCapNhat(maNVHienTai): Object[]
// GET /api/cap-nhat-phieu-thu-sale/lich-su
export const loadLichSuCapNhat = async (req, res) => {
  try {
    const nvHienTai = await layNhanVienSaleDangNhap(req, res)
    if (!nvHienTai) return

    const [dsPTDatCoc, dsPTHopDong] = await Promise.all([
      PTDatCoc.LayLichSuCapNhat(nvHienTai.maNV),
      PTHopDong.LayLichSuCapNhat(nvHienTai.maNV),
    ])

    const data = [...dsPTDatCoc, ...dsPTHopDong].sort(sapXepTheoNgayMoiNhat)
    return res.json({ data })
  } catch (err) {
    console.error('loadLichSuCapNhatSale:', err)
    return res.status(500).json({ message: 'Không thể tải lịch sử cập nhật phiếu thu.' })
  }
}

// LoadChiTietPhieuThu(maPT, loaiPT): Object
// GET /api/cap-nhat-phieu-thu-sale/:loaiPT/:maPT
export const loadChiTietPhieuThu = async (req, res) => {
  try {
    const nvHienTai = await layNhanVienSaleDangNhap(req, res)
    if (!nvHienTai) return

    await dongBoPhieuDatCocQuaHan()

    const loaiPT = chuanHoaLoaiPT(req.params.loaiPT)
    const { maPT } = req.params
    if (!loaiPT || !LOAI_PHIEU_THU[loaiPT]) {
      return res.status(400).json({ message: 'Loại phiếu thu không hợp lệ.' })
    }

    const { Entity } = LOAI_PHIEU_THU[loaiPT]
    const phieuThu = await Entity.LayChiTiet(maPT, nvHienTai.maCN)
    if (!phieuThu) {
      return res.status(404).json({ message: 'Không tìm thấy phiếu thu trong phạm vi chi nhánh của bạn.' })
    }

    return res.json({ data: phieuThu })
  } catch (err) {
    console.error('loadChiTietPhieuThuSale:', err)
    return res.status(500).json({ message: 'Không thể tải chi tiết phiếu thu.' })
  }
}

// XacNhanThanhToan(maPT, loaiPT, ngayTT): boolean
// PATCH /api/cap-nhat-phieu-thu-sale/:loaiPT/:maPT/xac-nhan-thanh-toan
// body: { ngayThanhToan: '2026-07-13T15:20:30' }
export const xacNhanThanhToan = async (req, res) => {
  try {
    const nvHienTai = await layNhanVienSaleDangNhap(req, res)
    if (!nvHienTai) return

    await dongBoPhieuDatCocQuaHan()

    const loaiPT = chuanHoaLoaiPT(req.params.loaiPT)
    const { maPT } = req.params
    if (!loaiPT || !LOAI_PHIEU_THU[loaiPT]) {
      return res.status(400).json({ message: 'Loại phiếu thu không hợp lệ.' })
    }

    const ngayThanhToanInput = req.body?.ngayThanhToan || req.body?.ngayTT
    const { ngay, error } = parseNgayThanhToan(ngayThanhToanInput)
    if (error) return res.status(400).json({ message: error })

    const { Entity } = LOAI_PHIEU_THU[loaiPT]
    const phieuThuHienTai = await Entity.LayChiTiet(maPT, nvHienTai.maCN)
    if (!phieuThuHienTai) {
      return res.status(404).json({ message: 'Không tìm thấy phiếu thu trong phạm vi chi nhánh của bạn.' })
    }

    if (ngay <= new Date(phieuThuHienTai.ngay)) {
      return res.status(400).json({ message: 'Thời điểm thanh toán không hợp lệ.' })
    }

    const laChuaThanhToan = await Entity.KiemTraTrangThai(
      maPT,
      loaiPT,
      'Chưa thanh toán',
      nvHienTai.maCN,
    )
    const laKhongHopLe = await Entity.KiemTraTrangThai(
      maPT,
      loaiPT,
      'Không hợp lệ',
      nvHienTai.maCN,
    )

    if (!laChuaThanhToan && !laKhongHopLe) {
      return res.status(409).json({
        message: 'Phiếu thu không còn ở trạng thái được phép cập nhật hoặc không thuộc chi nhánh của bạn.',
      })
    }

    const capNhatThanhCong = await Entity.CapNhatDaThanhToan(
      maPT,
      ngay,
      nvHienTai.maNV,
      nvHienTai.maCN,
    )

    if (!capNhatThanhCong) {
      return res.status(409).json({
        message: 'Cập nhật thất bại. Phiếu thu có thể đã được cập nhật bởi nhân viên khác.',
      })
    }

    const phieuThuSauCapNhat = await Entity.LayChiTiet(maPT, nvHienTai.maCN)
    return res.json({
      data: phieuThuSauCapNhat,
      message: 'Cập nhật trạng thái phiếu thu thành công.',
    })
  } catch (err) {
    console.error('xacNhanThanhToanSale:', err)
    return res.status(500).json({ message: 'Không thể cập nhật trạng thái phiếu thu.' })
  }
}

