const DEFAULT_STATUS = 'Mới tiếp nhận'
const RENT_TYPE_LABELS = {
  'Theo giường': 'Ở ghép / Theo giường',
  'Nguyên phòng': 'Nguyên phòng',
}
const RENT_TYPE_VALUE_MAP = {
  'Ở ghép': 'Theo giường',
  'Thuê giường': 'Theo giường',
  'Theo giường': 'Theo giường',
  'Thuê nguyên phòng': 'Nguyên phòng',
  'Nguyên phòng': 'Nguyên phòng',
}

function createHttpError(message, status = 400) {
  const error = new Error(message)
  error.status = status
  return error
}

function normalizeText(value) {
  return String(value || '').trim()
}

function normalizePhone(value) {
  return normalizeText(value).replace(/\s+/g, '')
}

function validateEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

function validateDate(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value)
}

function toDateStartOfDay(value) {
  return new Date(`${value}T00:00:00`)
}

function isFutureDate(value) {
  if (!validateDate(value)) {
    return false
  }

  const inputDate = toDateStartOfDay(value)
  const today = new Date()
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate())

  return inputDate > todayStart
}

function splitCriteria(criteriaText) {
  return String(criteriaText || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

function formatDate(value) {
  if (!value) {
    return ''
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return ''
  }

  return new Intl.DateTimeFormat('vi-VN').format(date)
}

function formatPhone(value) {
  const digits = String(value || '').replace(/\D/g, '')
  if (digits.length !== 10) {
    return value || ''
  }

  return `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7)}`
}

function buildDemandLabel({ hinhThucThue, soNguoi }) {
  const displayRentType = RENT_TYPE_LABELS[hinhThucThue] || hinhThucThue

  if (!hinhThucThue) {
    return `${soNguoi} người`
  }

  return `${displayRentType} - ${soNguoi} người`
}

export function buildCreateHoSoDangKyInput(payload = {}, context = {}) {
  const hoTen = normalizeText(payload.hoTen)
  const soDienThoai = normalizePhone(payload.soDienThoai)
  const email = normalizeText(payload.email).toLowerCase()
  const gioiTinh = normalizeText(payload.gioiTinh)
  const cccd = normalizePhone(payload.cccd)
  const ngheNghiep = normalizeText(payload.ngheNghiep)
  const quocTich = normalizeText(payload.quocTich) || 'Việt Nam'
  const hinhThucThue = RENT_TYPE_VALUE_MAP[normalizeText(payload.hinhThucThue)] || ''
  const soLuongNguoi = Number(payload.soLuongNguoi)
  const thoiGianVao = normalizeText(payload.thoiGianVao)
  const thoiHanThue = Number(payload.thoiHanThue)
  const chiNhanh = normalizeText(payload.chiNhanh)
  const tieuChi = splitCriteria(payload.tieuChi).join(', ')
  const saleCode = normalizeText(context.maNv)

  if (!hoTen || !soDienThoai || !email || !gioiTinh || !cccd || !hinhThucThue || !chiNhanh) {
    throw createHttpError('Vui lòng nhập đầy đủ các trường bắt buộc của hồ sơ đăng ký.')
  }

  if (!validateEmail(email)) {
    throw createHttpError('Email không đúng định dạng.')
  }

  if (!/^\d{9,15}$/.test(soDienThoai)) {
    throw createHttpError('Số điện thoại không hợp lệ.')
  }

  if (!/^\d{9,20}$/.test(cccd)) {
    throw createHttpError('CCCD không hợp lệ.')
  }

  if (!Number.isInteger(soLuongNguoi) || soLuongNguoi <= 0) {
    throw createHttpError('Số lượng người phải là số nguyên lớn hơn 0.')
  }

  if (!Number.isInteger(thoiHanThue) || thoiHanThue <= 0) {
    throw createHttpError('Thời hạn thuê phải là số tháng hợp lệ.')
  }

  if (!validateDate(thoiGianVao)) {
    throw createHttpError('Thời gian dự kiến vào ở không hợp lệ.')
  }

  if (!isFutureDate(thoiGianVao)) {
    throw createHttpError('Thời gian dự kiến vào ở phải là ngày trong tương lai.')
  }

  if (!hinhThucThue) {
    throw createHttpError('Hình thức thuê không hợp lệ.')
  }

  if (!saleCode) {
    throw createHttpError('Không xác định được nhân viên sale phụ trách hồ sơ.', 401)
  }

  return {
    customer: {
      ten_kh: hoTen,
      sdt: soDienThoai,
      email,
      gioi_tinh: gioiTinh,
      cccd,
      cong_viec: ngheNghiep || null,
      quoc_tich: quocTich,
    },
    profile: {
      hinh_thuc_thue: hinhThucThue,
      so_nguoi: soLuongNguoi,
      thoi_gian_vao: toDateStartOfDay(thoiGianVao),
      thoi_han_thue: thoiHanThue,
      tieu_chi: tieuChi || null,
      trang_thai: DEFAULT_STATUS,
      chi_nhanh: chiNhanh,
      nv_sale: saleCode,
    },
  }
}

export function buildHoSoDangKyFormEntity(snapshot = {}) {
  return {
    defaults: {
      chiNhanh: snapshot.defaultBranchCode || '',
      trangThai: DEFAULT_STATUS,
    },
    branches: (snapshot.branches || []).map((branch) => ({
      value: branch.ma_cn,
      label: `${branch.ma_cn} - ${branch.ten_cn}`,
    })),
    rentTypes: [
      { value: 'Theo giường', label: RENT_TYPE_LABELS['Theo giường'] },
      { value: 'Nguyên phòng', label: RENT_TYPE_LABELS['Nguyên phòng'] },
    ],
    termOptions: [
      { value: 3, label: '3 tháng' },
      { value: 6, label: '6 tháng' },
      { value: 12, label: '12 tháng' },
    ],
    criteriaByBranch: snapshot.criteriaByBranch || {},
    capacityByBranch: snapshot.capacityByBranch || {},
  }
}

export function buildCreatedHoSoDangKyEntity(record) {
  return {
    id: record.ma_dk,
    status: record.trang_thai,
    saleCode: record.nv_sale || '--',
    customer: {
      id: record.khach_hang_ho_so_dang_ky_khach_hangTokhach_hang.ma_kh,
      name: record.khach_hang_ho_so_dang_ky_khach_hangTokhach_hang.ten_kh,
      phone: record.khach_hang_ho_so_dang_ky_khach_hangTokhach_hang.sdt,
    },
    branch: {
      code: record.chi_nhanh_ho_so_dang_ky_chi_nhanhTochi_nhanh.ma_cn,
      name: record.chi_nhanh_ho_so_dang_ky_chi_nhanhTochi_nhanh.ten_cn,
    },
    searchContext: {
      hinhThucThue: record.hinh_thuc_thue,
      soNguoi: record.so_nguoi,
      thoiGianVao: record.thoi_gian_vao,
      thoiHanThue: record.thoi_han_thue,
      chiNhanh: record.chi_nhanh,
      tieuChi: record.tieu_chi || '',
    },
  }
}

export function buildHoSoDangKyListEntity(snapshot = {}) {
  return {
    items: (snapshot.items || []).map((item) => ({
      id: item.ma_dk,
      customerName: item.khach_hang_ho_so_dang_ky_khach_hangTokhach_hang.ten_kh,
      phone: item.khach_hang_ho_so_dang_ky_khach_hangTokhach_hang.sdt,
      cccd: item.khach_hang_ho_so_dang_ky_khach_hangTokhach_hang.cccd,
      demand: buildDemandLabel({
        hinhThucThue: item.hinh_thuc_thue,
        soNguoi: item.so_nguoi,
      }),
      createdAt: formatDate(item.ngay_lap),
      saleCode: item.nv_sale || '--',
      status: item.trang_thai,
    })),
    pagination: {
      page: snapshot.page || 1,
      pageSize: snapshot.pageSize || 10,
      totalItems: snapshot.totalItems || 0,
      totalPages: snapshot.totalPages || 1,
    },
  }
}

export function buildHoSoDangKyDetailEntity(record) {
  return {
    id: record.ma_dk,
    status: record.trang_thai,
    customerName: record.khach_hang_ho_so_dang_ky_khach_hangTokhach_hang.ten_kh,
    phone: formatPhone(record.khach_hang_ho_so_dang_ky_khach_hangTokhach_hang.sdt),
    email: record.khach_hang_ho_so_dang_ky_khach_hangTokhach_hang.email,
    cccd: record.khach_hang_ho_so_dang_ky_khach_hangTokhach_hang.cccd,
    gender: record.khach_hang_ho_so_dang_ky_khach_hangTokhach_hang.gioi_tinh,
    occupation: record.khach_hang_ho_so_dang_ky_khach_hangTokhach_hang.cong_viec || '--',
    nationality: record.khach_hang_ho_so_dang_ky_khach_hangTokhach_hang.quoc_tich,
    rentType: RENT_TYPE_LABELS[record.hinh_thuc_thue] || record.hinh_thuc_thue,
    peopleCount: `${record.so_nguoi} người`,
    moveInDate: formatDate(record.thoi_gian_vao),
    duration: `${record.thoi_han_thue} tháng`,
    branch: `${record.chi_nhanh_ho_so_dang_ky_chi_nhanhTochi_nhanh.ma_cn} - ${record.chi_nhanh_ho_so_dang_ky_chi_nhanhTochi_nhanh.ten_cn}`,
    saleCode: record.nv_sale || '--',
    criteriaText: record.tieu_chi || '',
    criteriaItems: splitCriteria(record.tieu_chi),
    createdAt: formatDate(record.ngay_lap),
  }
}
