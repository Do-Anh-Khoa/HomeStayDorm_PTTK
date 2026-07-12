import prisma from '../config/prisma.js'

const formatDate = (value) => {
  if (!value) return ''
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(date)
}

const normalizeText = (value = '') => value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')

const matchesSearch = (receipt, query) => {
  if (!query) return true

  const q = normalizeText(query)
  const receiptCode = normalizeText(String(receipt.maPhieuThu ?? ''))

  return receiptCode.includes(q)
}

const buildReceiptPayload = ({ item, type, idField, dateField, amountField, relatedIdField, relatedLabel, employeeField, customer, statusField = 'trang_thai', notesField = 'ghi_chu' }) => ({
  maPhieuThu: item[idField],
  ngayTaoPhieu: formatDate(item[dateField]),
  ngayLap: formatDate(item[dateField]),
  nhanVienLapPhieu: item[employeeField]?.ten_nv || '—',
  maChungTuGoc: item[relatedIdField],
  nhanChungTuGoc: relatedLabel,
  tongTien: Number(item[amountField] ?? 0),
  trangThai: item[statusField] === 'Hợp lệ' || item[statusField] === 'Không hợp lệ' ? item[statusField] : 'Đã thanh toán',
  ghiChu: item[notesField] || '',
  loaiPhieuThu: type,
  tenKhachHang: customer?.ten_kh || '—',
  soDienThoai: customer?.sdt || '',
  cccd: customer?.cccd || '',
})

const getPtDatCocReceipts = async () => {
  const items = await prisma.pt_dat_coc.findMany({
    include: {
      phieu_dat_coc: { include: { khach_hang: true } },
      nhanvien: true,
    },
    orderBy: { ngay: 'desc' },
  })

  return items.map((item) => buildReceiptPayload({
    item,
    type: 'Đặt cọc',
    idField: 'ma_ptdc',
    dateField: 'ngay',
    amountField: 'tong_tien',
    relatedIdField: 'ma_pdc',
    relatedLabel: 'Mã phiếu đặt cọc',
    employeeField: 'nhanvien',
    customer: item.phieu_dat_coc?.khach_hang,
  }))
}

const getPtHopDongReceipts = async () => {
  const items = await prisma.pt_hop_dong.findMany({
    include: {
      hop_dong_thue: {
        include: {
          khach_thue: { include: { khach_hang: true } },
        },
      },
      nhanvien: true,
    },
    orderBy: { ngay: 'desc' },
  })

  return items.map((item) => buildReceiptPayload({
    item,
    type: 'Hợp đồng',
    idField: 'ma_pthd',
    dateField: 'ngay',
    amountField: 'tong_tien',
    relatedIdField: 'ma_hdt',
    relatedLabel: 'Mã hợp đồng',
    employeeField: 'nhanvien',
    customer: item.hop_dong_thue?.khach_thue?.[0]?.khach_hang,
  }))
}

const getPtTraPhongReceipts = async () => {
  const items = await prisma.pt_tra_phong.findMany({
    include: {
      ho_so_tra_phong: {
        include: {
          khach_thue: { include: { khach_hang: true } },
        },
      },
      nhanvien: true,
    },
    orderBy: { ngay: 'desc' },
  })

  return items.map((item) => buildReceiptPayload({
    item,
    type: 'Trả phòng',
    idField: 'ma_pttp',
    dateField: 'ngay',
    amountField: 'tong_tien',
    relatedIdField: 'ma_tp',
    relatedLabel: 'Mã hồ sơ trả phòng',
    employeeField: 'nhanvien',
    customer: item.ho_so_tra_phong?.khach_thue?.khach_hang,
  }))
}

const getPtBoiThuongReceipts = async () => {
  const items = await prisma.pt_boi_thuong.findMany({
    include: {
      boi_thuong: { include: { khach_hang: true } },
      nhanvien: true,
    },
    orderBy: { ngay: 'desc' },
  })

  return items.map((item) => buildReceiptPayload({
    item,
    type: 'Bồi thường',
    idField: 'ma_ptdb',
    dateField: 'ngay',
    amountField: 'tong_tien',
    relatedIdField: 'ma_bt',
    relatedLabel: 'Mã bồi thường',
    employeeField: 'nhanvien',
    customer: item.boi_thuong?.khach_hang,
  }))
}

const getAllReceipts = async () => {
  const [datCoc, hopDong, traPhong, boiThuong] = await Promise.all([
    getPtDatCocReceipts(),
    getPtHopDongReceipts(),
    getPtTraPhongReceipts(),
    getPtBoiThuongReceipts(),
  ])

  return [...datCoc, ...hopDong, ...traPhong, ...boiThuong].sort((a, b) => {
    const first = new Date(b.ngayTaoPhieu.split('/').reverse().join('-'))
    const second = new Date(a.ngayTaoPhieu.split('/').reverse().join('-'))
    return first - second
  })
}

const getReceiptConfig = (maPhieuThu) => {
  if (!maPhieuThu) return null

  if (maPhieuThu.startsWith('PTDC')) {
    return {
      model: 'pt_dat_coc',
      idField: 'ma_ptdc',
      type: 'Đặt cọc',
      relatedIdField: 'ma_pdc',
      relatedLabel: 'Mã phiếu đặt cọc',
      include: {
        phieu_dat_coc: { include: { khach_hang: true } },
        nhanvien: true,
      },
    }
  }

  if (maPhieuThu.startsWith('PTHD')) {
    return {
      model: 'pt_hop_dong',
      idField: 'ma_pthd',
      type: 'Hợp đồng',
      relatedIdField: 'ma_hdt',
      relatedLabel: 'Mã hợp đồng',
      include: {
        hop_dong_thue: { include: { khach_thue: { include: { khach_hang: true } } } },
        nhanvien: true,
      },
    }
  }

  if (maPhieuThu.startsWith('PTTP')) {
    return {
      model: 'pt_tra_phong',
      idField: 'ma_pttp',
      type: 'Trả phòng',
      relatedIdField: 'ma_tp',
      relatedLabel: 'Mã hồ sơ trả phòng',
      include: {
        ho_so_tra_phong: { include: { khach_thue: { include: { khach_hang: true } } } },
        nhanvien: true,
      },
    }
  }

  if (maPhieuThu.startsWith('PTBT')) {
    return {
      model: 'pt_boi_thuong',
      idField: 'ma_ptdb',
      type: 'Bồi thường',
      relatedIdField: 'ma_bt',
      relatedLabel: 'Mã bồi thường',
      include: {
        boi_thuong: { include: { khach_hang: true } },
        nhanvien: true,
      },
    }
  }

  return null
}

const loadReceiptByConfig = async (config, maPhieuThu) => {
  const model = prisma[config.model]
  const item = await model.findUnique({
    where: { [config.idField]: maPhieuThu },
    include: config.include,
  })

  if (!item) return null

  const customer = config.model === 'pt_hop_dong'
    ? item.hop_dong_thue?.khach_thue?.[0]?.khach_hang
    : config.model === 'pt_tra_phong'
      ? item.ho_so_tra_phong?.khach_thue?.khach_hang
      : config.model === 'pt_boi_thuong'
        ? item.boi_thuong?.khach_hang
        : item.phieu_dat_coc?.khach_hang

  return buildReceiptPayload({
    item,
    type: config.type,
    idField: config.idField,
    dateField: 'ngay',
    amountField: 'tong_tien',
    relatedIdField: config.relatedIdField,
    relatedLabel: config.relatedLabel,
    employeeField: 'nhanvien',
    customer,
  })
}

export const getCanKiemTraReceipts = async (req, res) => {
  try {
    const q = req.query.q || ''
    const allReceipts = await getAllReceipts()
    const filtered = allReceipts.filter((receipt) => !['Hợp lệ', 'Không hợp lệ'].includes(receipt.trangThai) && matchesSearch(receipt, q))

    res.status(200).json({ data: filtered })
  } catch (error) {
    console.error('getCanKiemTraReceipts error:', error)
    res.status(500).json({ message: 'Không thể tải danh sách phiếu thu cần kiểm tra.' })
  }
}

export const getCheckedReceipts = async (req, res) => {
  try {
    const q = req.query.q || ''
    const allReceipts = await getAllReceipts()
    const filtered = allReceipts.filter((receipt) => ['Hợp lệ', 'Không hợp lệ'].includes(receipt.trangThai) && matchesSearch(receipt, q))

    res.status(200).json({ data: filtered })
  } catch (error) {
    console.error('getCheckedReceipts error:', error)
    res.status(500).json({ message: 'Không thể tải lịch sử kiểm tra phiếu thu.' })
  }
}

export const getReceiptDetail = async (req, res) => {
  try {
    const { maPhieuThu } = req.params
    const config = getReceiptConfig(maPhieuThu)

    if (!config) {
      return res.status(404).json({ message: 'Không tìm thấy phiếu thu.' })
    }

    const receipt = await loadReceiptByConfig(config, maPhieuThu)
    if (!receipt) {
      return res.status(404).json({ message: 'Không tìm thấy phiếu thu.' })
    }

    return res.status(200).json({ data: receipt })
  } catch (error) {
    console.error('getReceiptDetail error:', error)
    return res.status(500).json({ message: 'Không thể tải chi tiết phiếu thu.' })
  }
}

export const verifyReceipt = async (req, res) => {
  try {
    const { maPhieuThu } = req.params
    const { trangThai, ghiChu = '' } = req.body

    if (!['Hợp lệ', 'Không hợp lệ'].includes(trangThai)) {
      return res.status(400).json({ message: 'Kết quả kiểm tra không hợp lệ.' })
    }

    if (trangThai === 'Không hợp lệ' && !String(ghiChu || '').trim()) {
      return res.status(400).json({ message: 'Vui lòng nhập lý do phiếu thu không hợp lệ.' })
    }

    const config = getReceiptConfig(maPhieuThu)
    if (!config) {
      return res.status(404).json({ message: 'Không tìm thấy phiếu thu.' })
    }

    const model = prisma[config.model]
    const updateData = {
      trang_thai: trangThai,
      ghi_chu: trangThai === 'Không hợp lệ' ? String(ghiChu || '').trim() : '',
      nv_cap_nhat: req.auth?.ma_nv || null,
    }

    const updated = await model.update({
      where: { [config.idField]: maPhieuThu },
      data: updateData,
    })

    if (!updated) {
      return res.status(404).json({ message: 'Không tìm thấy phiếu thu.' })
    }

    const receipt = await loadReceiptByConfig(config, maPhieuThu)
    return res.status(200).json({ data: receipt, message: 'Cập nhật kết quả kiểm tra thành công.' })
  } catch (error) {
    console.error('verifyReceipt error:', error)
    return res.status(500).json({ message: 'Không thể cập nhật kết quả kiểm tra phiếu thu.' })
  }
}
