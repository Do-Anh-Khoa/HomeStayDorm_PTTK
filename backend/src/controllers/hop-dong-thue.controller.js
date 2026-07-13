import {
  KY_THANH_TOAN_LABELS,
  createHopDongThue,
  getChiTietHopDong,
  getDanhSachHopDongDaLapHomNay,
  getDanhSachPhieuDatCocChoLapHopDong,
  getHopDongFormContext,
  getNhanVienByMa,
} from '../database/hop-dong-thue.database.js'
import { inHopDongThue } from '../utils/inHopDongThue.js'

function formatDateInput(value) {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null

  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function parseDateOnly(value) {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

function addMonths(dateValue, months) {
  const date = new Date(dateValue)
  date.setMonth(date.getMonth() + Number(months || 0))
  return date
}

function parseThoiHanThue(value) {
  if (typeof value === 'number') return value
  if (typeof value !== 'string') return NaN
  const match = value.match(/\d+/)
  return match ? Number(match[0]) : NaN
}

function parseKyThanhToan(value) {
  if (typeof value === 'number') return value
  if (typeof value !== 'string') return NaN

  const normalized = value.trim().toLowerCase()
  if (!normalized) return NaN
  if (normalized.includes('hàng tháng')) return 1

  const match = normalized.match(/\d+/)
  return match ? Number(match[0]) : NaN
}

function buildTongTien(dsGiuong = []) {
  return dsGiuong.reduce((sum, item) => sum + Number(item.giaThue || 0), 0)
}

function normalizeTenant(tenant = {}, index = 0) {
  return {
    maKh: String(tenant.maKh || tenant.ma_kh || '').trim() || null,
    hoTen: String(tenant.hoTen || tenant.tenKhachHang || tenant.ten_kh || '').trim(),
    cccd: String(tenant.cccd || '').trim(),
    soDienThoai: String(tenant.soDienThoai || tenant.sdt || '').trim(),
    email: String(tenant.email || '').trim(),
    gioiTinh: String(tenant.gioiTinh || tenant.gioi_tinh || 'Nữ').trim() || 'Nữ',
    congViec: String(tenant.congViec || tenant.cong_viec || '').trim(),
    quocTich: String(tenant.quocTich || tenant.quoc_tich || 'Việt Nam').trim() || 'Việt Nam',
    tinhTrang: String(tenant.tinhTrang || 'Đang làm việc').trim() || 'Đang làm việc',
    isChuHopDong: Boolean(tenant.isChuHopDong ?? index === 0),
  }
}

function normalizeSelectedBed(bed = {}) {
  return {
    maPhong: String(bed.maPhong || bed.ma_phong || '').trim(),
    maGiuong: String(bed.maGiuong || bed.ma_giuong || '').trim(),
  }
}

function buildDraftFromContext(context, employee) {
  const tenants = [
    {
      ...context.khachDatCoc,
      isChuHopDong: true,
    },
  ]

  return {
    maPhieuDatCoc: context.maPhieuDatCoc,
    nhanVienPhuTrach: employee.ten_nv,
    thoiGianLapHopDong: formatDateInput(new Date()),
    thoiGianBatDauThue: context.thoiGianBatDauThueMacDinh,
    thoiHanThue: context.thoiHanThueMacDinh,
    thoiHanThueLabel: `${context.thoiHanThueMacDinh} tháng`,
    kyThanhToan: context.kyThanhToanMacDinh,
    kyThanhToanLabel: KY_THANH_TOAN_LABELS[context.kyThanhToanMacDinh] || `${context.kyThanhToanMacDinh} tháng / lần`,
    beds: context.beds,
    tenants,
    terms: context.terms,
    summary: {
      soLuongGiuong: context.beds.length,
      soKhachThue: tenants.length,
      tongTien: buildTongTien(context.beds),
    },
  }
}

function buildPreviewFromPayload({ context, employee, tgTaoHD, tgVao, thoiHanThue, kyThanhToan, selectedBeds, tenants }) {
  const selectedKeySet = new Set(
    selectedBeds.map((bed) => `${bed.maPhong}__${bed.maGiuong}`),
  )

  const selectedBedDetails = context.beds.filter((bed) =>
    selectedKeySet.has(`${bed.maPhong}__${bed.maGiuong}`),
  )

  const tgKetThuc = addMonths(tgVao, thoiHanThue)

  return {
    maPhieuDatCoc: context.maPhieuDatCoc,
    nhanVienPhuTrach: employee.ten_nv,
    thoiGianLapHopDong: formatDateInput(tgTaoHD),
    thoiGianBatDauThue: formatDateInput(tgVao),
    thoiGianKetThuc: formatDateInput(tgKetThuc),
    thoiHanThue,
    thoiHanThueLabel: `${thoiHanThue} tháng`,
    kyThanhToan,
    kyThanhToanLabel: KY_THANH_TOAN_LABELS[kyThanhToan] || `${kyThanhToan} tháng / lần`,
    beds: selectedBedDetails,
    tenants,
    terms: context.terms,
    summary: {
      soLuongGiuong: selectedBedDetails.length,
      soKhachThue: tenants.length,
      tongTien: buildTongTien(selectedBedDetails),
    },
  }
}

function validateAndPreparePayload(context, payload = {}) {
  const tenants = Array.isArray(payload.tenants)
    ? payload.tenants.map((item, index) => normalizeTenant(item, index))
    : []

  if (tenants.length === 0) {
    const error = new Error('Phải có ít nhất một khách thuê.')
    error.status = 400
    throw error
  }

  const ownerIncluded = tenants.some(
    (tenant) =>
      tenant.maKh === context.khachDatCoc.maKh ||
      tenant.cccd === context.khachDatCoc.cccd,
  )
  if (!ownerIncluded) {
    const error = new Error('Danh sách khách thuê phải bao gồm khách đặt cọc.')
    error.status = 400
    throw error
  }

  const seenCCCD = new Set()
  for (const tenant of tenants) {
    if (!tenant.hoTen) {
      const error = new Error('Vui lòng nhập họ tên đầy đủ cho khách thuê.')
      error.status = 400
      throw error
    }
    if (!/^\d{9,20}$/.test(tenant.cccd)) {
      const error = new Error(`CCCD không hợp lệ: ${tenant.hoTen}.`)
      error.status = 400
      throw error
    }
    if (!/^\d{9,15}$/.test(tenant.soDienThoai)) {
      const error = new Error(`Số điện thoại không hợp lệ: ${tenant.hoTen}.`)
      error.status = 400
      throw error
    }
    if (tenant.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(tenant.email)) {
      const error = new Error(`Email không đúng định dạng: ${tenant.hoTen}.`)
      error.status = 400
      throw error
    }
    if (seenCCCD.has(tenant.cccd)) {
      const error = new Error('Danh sách khách thuê có CCCD bị trùng.')
      error.status = 400
      throw error
    }
    seenCCCD.add(tenant.cccd)
  }

  const allBedKeySet = new Set(
    context.beds.map((bed) => `${bed.maPhong}__${bed.maGiuong}`),
  )

  const selectedBeds =
    Array.isArray(payload.selectedBeds) && payload.selectedBeds.length > 0
      ? payload.selectedBeds.map((item) => normalizeSelectedBed(item))
      : context.beds.map((bed) => ({
          maPhong: bed.maPhong,
          maGiuong: bed.maGiuong,
        }))

  const selectedBedKeys = new Set()
  for (const bed of selectedBeds) {
    const key = `${bed.maPhong}__${bed.maGiuong}`
    if (!bed.maPhong || !bed.maGiuong || !allBedKeySet.has(key)) {
      const error = new Error('Danh sách giường thuê không hợp lệ.')
      error.status = 400
      throw error
    }
    if (selectedBedKeys.has(key)) {
      const error = new Error('Danh sách giường thuê đang bị trùng.')
      error.status = 400
      throw error
    }
    selectedBedKeys.add(key)
  }

  if (selectedBeds.length !== tenants.length) {
    const error = new Error('Số thành viên chưa hợp lệ!')
    error.status = 400
    throw error
  }

  const thoiHanThue = parseThoiHanThue(payload.thoiHanThue)
  if (!Number.isInteger(thoiHanThue) || thoiHanThue <= 0) {
    const error = new Error('Thời hạn thuê không hợp lệ.')
    error.status = 400
    throw error
  }

  const kyThanhToan = parseKyThanhToan(payload.kyThanhToan)
  if (!Number.isInteger(kyThanhToan) || kyThanhToan <= 0) {
    const error = new Error('Kỳ thanh toán không hợp lệ.')
    error.status = 400
    throw error
  }

  if (kyThanhToan > thoiHanThue || thoiHanThue % kyThanhToan !== 0) {
    const error = new Error('Thời hạn thuê và kỳ thanh toán chưa hợp lý.')
    error.status = 400
    throw error
  }

  const tgTaoHD = parseDateOnly(payload.thoiGianLapHopDong) || new Date()
  const tgVao = parseDateOnly(payload.thoiGianBatDauThue || payload.tgVao)
  if (!tgVao) {
    const error = new Error('Thời gian bắt đầu thuê không hợp lệ.')
    error.status = 400
    throw error
  }

  const tgKetThuc = addMonths(tgVao, thoiHanThue)
  if (tgKetThuc <= tgVao) {
    const error = new Error('Thông tin thời gian thuê không hợp lý.')
    error.status = 400
    throw error
  }

  const ownerCCCD = context.khachDatCoc.cccd
  const orderedTenants = [
    ...tenants.filter((tenant) => tenant.cccd === ownerCCCD || tenant.maKh === context.khachDatCoc.maKh),
    ...tenants.filter((tenant) => tenant.cccd !== ownerCCCD && tenant.maKh !== context.khachDatCoc.maKh),
  ].map((tenant, index) => ({
    ...tenant,
    isChuHopDong: index === 0,
  }))

  return {
    tgTaoHD,
    tgVao,
    thoiHanThue,
    kyThanhToan,
    selectedBeds,
    tenants: orderedTenants,
  }
}

async function getCurrentEmployee(req) {
  const maNV = req.auth?.ma_nv
  if (!maNV) return null
  return getNhanVienByMa(maNV)
}

export async function loadDSPDCChoLapHopDong(req, res) {
  try {
    const employee = await getCurrentEmployee(req)
    if (!employee) {
      return res.status(401).json({ message: 'Chưa đăng nhập.' })
    }

    const tuKhoa = String(req.query.tuKhoa || '').trim()
    const data = await getDanhSachPhieuDatCocChoLapHopDong({
      maCn: employee.ma_cn,
      tuKhoa,
    })

    return res.json({ data })
  } catch (error) {
    console.error('loadDSPDCChoLapHopDong:', error)
    return res.status(500).json({ message: 'Không thể tải danh sách phiếu đặt cọc.' })
  }
}

export async function loadThongTinLapHopDong(req, res) {
  try {
    const employee = await getCurrentEmployee(req)
    if (!employee) {
      return res.status(401).json({ message: 'Chưa đăng nhập.' })
    }

    const { maPDC } = req.params
    const context = await getHopDongFormContext({
      maPDC,
      maCn: employee.ma_cn,
    })

    if (!context) {
      return res.status(404).json({ message: 'Không tìm thấy phiếu đặt cọc phù hợp.' })
    }

    if (context.daCoHopDong) {
      return res.status(409).json({
        message: 'Phiếu đặt cọc này đã được lập hợp đồng.',
        maHopDong: context.maHopDongDaTonTai,
      })
    }

    if (context.trangThaiPhieuDatCoc !== 'Hoàn tất') {
      return res.status(409).json({
        message: 'Phiếu đặt cọc này chưa đủ điều kiện để lập hợp đồng.',
      })
    }

    return res.json({
      data: buildDraftFromContext(context, employee),
    })
  } catch (error) {
    console.error('loadThongTinLapHopDong:', error)
    return res.status(500).json({ message: 'Không thể tải thông tin lập hợp đồng.' })
  }
}

export async function xemTruocHopDong(req, res) {
  try {
    const employee = await getCurrentEmployee(req)
    if (!employee) {
      return res.status(401).json({ message: 'Chưa đăng nhập.' })
    }

    const maPDC = String(req.body.maPDC || req.body.maPhieuDatCoc || '').trim()
    if (!maPDC) {
      return res.status(400).json({ message: 'Thiếu mã phiếu đặt cọc.' })
    }

    const context = await getHopDongFormContext({
      maPDC,
      maCn: employee.ma_cn,
    })

    if (!context) {
      return res.status(404).json({ message: 'Không tìm thấy phiếu đặt cọc phù hợp.' })
    }

    if (context.daCoHopDong) {
      return res.status(409).json({
        message: 'Phiếu đặt cọc này đã được lập hợp đồng.',
        maHopDong: context.maHopDongDaTonTai,
      })
    }

    const prepared = validateAndPreparePayload(context, req.body)
    const preview = buildPreviewFromPayload({
      context,
      employee,
      ...prepared,
    })

    return res.json({ data: preview })
  } catch (error) {
    console.error('xemTruocHopDong:', error)
    return res.status(error.status || 500).json({
      message: error.message || 'Không thể xem trước hợp đồng.',
    })
  }
}

export async function lapVaLuuHopDong(req, res) {
  try {
    const employee = await getCurrentEmployee(req)
    if (!employee) {
      return res.status(401).json({ message: 'Chưa đăng nhập.' })
    }

    const maPDC = String(req.body.maPDC || req.body.maPhieuDatCoc || '').trim()
    if (!maPDC) {
      return res.status(400).json({ message: 'Thiếu mã phiếu đặt cọc.' })
    }

    const context = await getHopDongFormContext({
      maPDC,
      maCn: employee.ma_cn,
    })

    if (!context) {
      return res.status(404).json({ message: 'Không tìm thấy phiếu đặt cọc phù hợp.' })
    }

    if (context.daCoHopDong) {
      return res.status(409).json({
        message: 'Phiếu đặt cọc này đã được lập hợp đồng.',
        maHopDong: context.maHopDongDaTonTai,
      })
    }

    const prepared = validateAndPreparePayload(context, req.body)
    const contract = await createHopDongThue({
      maPDC,
      maNVPhuTrach: employee.ma_nv,
      maCn: employee.ma_cn,
      tgTaoHD: prepared.tgTaoHD,
      tgVao: prepared.tgVao,
      thoiHanThue: prepared.thoiHanThue,
      kyThanhToan: prepared.kyThanhToan,
      selectedBeds: prepared.selectedBeds,
      tenants: prepared.tenants,
    })

    return res.status(201).json({
      message: 'Lập hợp đồng thuê thành công.',
      data: contract,
    })
  } catch (error) {
    console.error('lapVaLuuHopDong:', error)
    return res.status(error.status || 500).json({
      message: error.message || 'Không thể lập hợp đồng thuê.',
    })
  }
}

export async function loadDSHopDongDaLapHomNay(req, res) {
  try {
    const employee = await getCurrentEmployee(req)
    if (!employee) {
      return res.status(401).json({ message: 'Chưa đăng nhập.' })
    }

    const data = await getDanhSachHopDongDaLapHomNay({
      maNV: employee.ma_nv,
    })

    return res.json({ data })
  } catch (error) {
    console.error('loadDSHopDongDaLapHomNay:', error)
    return res.status(500).json({ message: 'Không thể tải danh sách hợp đồng đã lập hôm nay.' })
  }
}

export async function xemChiTietHopDong(req, res) {
  try {
    const employee = await getCurrentEmployee(req)
    if (!employee) {
      return res.status(401).json({ message: 'Chưa đăng nhập.' })
    }

    const { maHDT } = req.params
    const contract = await getChiTietHopDong({
      maHDT,
      maCn: employee.ma_cn,
    })

    if (!contract) {
      return res.status(404).json({ message: 'Không tìm thấy hợp đồng thuê.' })
    }

    return res.json({
      data: {
        ...contract,
        summary: {
          soLuongGiuong: contract.beds.length,
          soKhachThue: contract.tenants.length,
          tongTien: buildTongTien(contract.beds),
        },
      },
    })
  } catch (error) {
    console.error('xemChiTietHopDong:', error)
    return res.status(500).json({ message: 'Không thể tải chi tiết hợp đồng thuê.' })
  }
}

export async function inHopDongPDF(req, res) {
  try {
    const employee = await getCurrentEmployee(req)
    if (!employee) {
      return res.status(401).json({ message: 'Chưa đăng nhập.' })
    }

    const { maHDT } = req.params
    const contract = await getChiTietHopDong({
      maHDT,
      maCn: employee.ma_cn,
    })

    if (!contract) {
      return res.status(404).json({ message: 'Không tìm thấy hợp đồng thuê.' })
    }

    const filePath = await inHopDongThue(contract)
    return res.download(filePath, `${contract.maHopDong}.pdf`)
  } catch (error) {
    console.error('inHopDongPDF:', error)
    return res.status(500).json({ message: 'Không thể in hợp đồng thuê.' })
  }
}
