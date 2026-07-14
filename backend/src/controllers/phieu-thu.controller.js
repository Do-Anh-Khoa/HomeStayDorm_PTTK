import prisma from '../config/prisma.js'
import NhanVien from '../entities/NhanVien.js'
import PTDatCoc from '../entities/PTDatCoc.js'
import PTHopDong from '../entities/PTHopDong.js'
import PTTraPhong from '../entities/PTTraPhong.js'
import PTBoiThuong from '../entities/PTBoiThuong.js'

const TRANG_THAI_CAN_KIEM_TRA = ['Đã thanh toán']
const TRANG_THAI_DA_KIEM_TRA = ['Hợp lệ', 'Không hợp lệ']

const RECEIPT_CONFIGS = [
  {
    prefix: 'PTDC',
    model: 'pt_dat_coc',
    idField: 'ma_ptdc',
    type: 'Đặt cọc',
    typeKey: 'dat-coc',
    relatedLabel: 'Mã phiếu đặt cọc',
    Entity: PTDatCoc,
    select: {
      ma_ptdc: true,
      ngay: true,
      ngay_thanh_toan: true,
      ghi_chu: true,
      trang_thai: true,
      tong_tien: true,
      ma_pdc: true,
      nhanvien: {
        select: {
          ten_nv: true,
          ma_cn: true,
        },
      },
      phieu_dat_coc: {
        select: {
          khach_hang: {
            select: {
              ten_kh: true,
              sdt: true,
              cccd: true,
            },
          },
        },
      },
    },
    getCustomer: (item) => item.phieu_dat_coc?.khach_hang,
    getRelatedId: (item) => item.ma_pdc,
  },
  {
    prefix: 'PTHD',
    model: 'pt_hop_dong',
    idField: 'ma_pthd',
    type: 'Hợp đồng',
    typeKey: 'hop-dong',
    relatedLabel: 'Mã hợp đồng',
    Entity: PTHopDong,
    select: {
      ma_pthd: true,
      ngay: true,
      ngay_thanh_toan: true,
      ghi_chu: true,
      trang_thai: true,
      tong_tien: true,
      ma_hdt: true,
      nhanvien: {
        select: {
          ten_nv: true,
          ma_cn: true,
        },
      },
      hop_dong_thue: {
        select: {
          khach_thue: {
            select: {
              khach_hang: {
                select: {
                  ten_kh: true,
                  sdt: true,
                  cccd: true,
                },
              },
            },
          },
        },
      },
    },
    getCustomer: (item) => item.hop_dong_thue?.khach_thue?.[0]?.khach_hang,
    getRelatedId: (item) => item.ma_hdt,
  },
  {
    prefix: 'PTTP',
    model: 'pt_tra_phong',
    idField: 'ma_pttp',
    type: 'Trả phòng',
    typeKey: 'tra-phong',
    relatedLabel: 'Mã hồ sơ trả phòng',
    Entity: PTTraPhong,
    select: {
      ma_pttp: true,
      ngay: true,
      ngay_thanh_toan: true,
      ghi_chu: true,
      trang_thai: true,
      tong_tien: true,
      ma_tp: true,
      nhanvien: {
        select: {
          ten_nv: true,
          ma_cn: true,
        },
      },
      ho_so_tra_phong: {
        select: {
          khach_thue: {
            select: {
              khach_hang: {
                select: {
                  ten_kh: true,
                  sdt: true,
                  cccd: true,
                },
              },
            },
          },
        },
      },
    },
    getCustomer: (item) => item.ho_so_tra_phong?.khach_thue?.khach_hang,
    getRelatedId: (item) => item.ma_tp,
  },
  {
    prefix: 'PTBT',
    model: 'pt_boi_thuong',
    idField: 'ma_ptdb',
    type: 'Bồi thường',
    typeKey: 'boi-thuong',
    relatedLabel: 'Mã bồi thường',
    Entity: PTBoiThuong,
    select: {
      ma_ptdb: true,
      ngay: true,
      ngay_thanh_toan: true,
      ghi_chu: true,
      trang_thai: true,
      tong_tien: true,
      ma_bt: true,
      nhanvien: {
        select: {
          ten_nv: true,
          ma_cn: true,
        },
      },
      boi_thuong: {
        select: {
          khach_hang: {
            select: {
              ten_kh: true,
              sdt: true,
              cccd: true,
            },
          },
        },
      },
    },
    getCustomer: (item) => item.boi_thuong?.khach_hang,
    getRelatedId: (item) => item.ma_bt,
  },
]

const formatDate = (value) => {
  if (!value) return ''
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date)
}

const normalizeText = (value = '') => value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')

const matchesSearch = (receipt, query) => {
  if (!query) return true
  return normalizeText(String(receipt.maPhieuThu || '')).includes(normalizeText(query))
}

const getReceiptConfig = (maPhieuThu) => {
  const normalized = String(maPhieuThu || '').trim().toUpperCase()
  return RECEIPT_CONFIGS.find((config) => normalized.startsWith(config.prefix)) || null
}

const mapPrismaItemToPayload = (config, item, extra = {}) => {
  const customer = config.getCustomer(item)
  const ngay = item.ngay ? new Date(item.ngay) : null

  return {
    maPhieuThu: item[config.idField],
    ngayTaoPhieu: formatDate(item.ngay),
    ngayLap: formatDate(item.ngay),
    nhanVienLapPhieu: item.nhanvien?.ten_nv || '—',
    maChungTuGoc: config.getRelatedId(item) || '',
    nhanChungTuGoc: config.relatedLabel,
    tongTien: Number(item.tong_tien ?? 0),
    trangThai: item.trang_thai || '',
    ghiChu: item.ghi_chu || '',
    loaiPhieuThu: config.type,
    loaiPT: config.typeKey,
    tenKhachHang: customer?.ten_kh || '—',
    soDienThoai: customer?.sdt || '',
    cccd: customer?.cccd || '',
    sortTime: extra.sortTime ?? (ngay ? ngay.getTime() : 0),
  }
}

const mapEntityToPayload = (config, entity) => ({
  maPhieuThu: entity.maPT,
  ngayTaoPhieu: formatDate(entity.ngay),
  ngayLap: formatDate(entity.ngay),
  nhanVienLapPhieu: entity.tenNVKeToan || entity.maNVKeToan || '—',
  maChungTuGoc: entity.maLienKet || '',
  nhanChungTuGoc: config.relatedLabel,
  tongTien: Number(entity.tongTien ?? 0),
  trangThai: entity.trangThai || '',
  ghiChu: entity.ghiChu || '',
  loaiPhieuThu: config.type,
  loaiPT: config.typeKey,
  tenKhachHang: entity.tenKH || '—',
  soDienThoai: entity.sdt || '',
  cccd: entity.cccd || '',
})

const sortReceiptsByNewest = (receipts) => receipts.sort((a, b) => (b.sortTime || 0) - (a.sortTime || 0))

const getTodayRange = () => {
  const start = new Date()
  start.setHours(0, 0, 0, 0)
  const end = new Date(start)
  end.setDate(end.getDate() + 1)
  return { start, end }
}

const layNhanVienQuanLyDangNhap = async (req, res) => {
  const maNV = req.auth?.ma_nv || req.auth?.maNV
  if (!maNV) {
    res.status(401).json({ message: 'Bạn chưa đăng nhập.' })
    return null
  }

  const nvHienTai = await NhanVien.LayTheoMaNV(maNV)
  if (!nvHienTai) {
    res.status(404).json({ message: 'Không tìm thấy nhân viên đang đăng nhập.' })
    return null
  }

  if (nvHienTai.loaiNV !== 'QL') {
    res.status(403).json({ message: 'Chỉ Nhân viên Quản lý được truy cập chức năng này.' })
    return null
  }

  return nvHienTai
}

const loadReceiptsByBranch = async (maCN) => {
  const groups = await Promise.all(
    RECEIPT_CONFIGS.map(async (config) => {
      const items = await prisma[config.model].findMany({
        where: {
          nhanvien: {
            is: {
              ma_cn: maCN,
            },
          },
          trang_thai: {
            in: [...TRANG_THAI_CAN_KIEM_TRA, ...TRANG_THAI_DA_KIEM_TRA],
          },
        },
        select: config.select,
        orderBy: { ngay: 'desc' },
      })

      return items.map((item) => mapPrismaItemToPayload(config, item))
    }),
  )

  return sortReceiptsByNewest(groups.flat())
}

const loadCheckedReceiptsByEmployeeToday = async (maNV, maCN) => {
  const { start, end } = getTodayRange()

  const groups = await Promise.all(
    RECEIPT_CONFIGS.map(async (config) => {
      const items = await prisma[config.model].findMany({
        where: {
          nhanvien: {
            is: {
              ma_cn: maCN,
            },
          },
          nv_cap_nhat: maNV,
          trang_thai: {
            in: TRANG_THAI_DA_KIEM_TRA,
          },
          ngay_thanh_toan: {
            gte: start,
            lt: end,
          },
        },
        select: config.select,
        orderBy: { ngay_thanh_toan: 'desc' },
      })

      return items.map((item) =>
        mapPrismaItemToPayload(config, item, {
          sortTime: item.ngay_thanh_toan ? new Date(item.ngay_thanh_toan).getTime() : 0,
        }),
      )
    }),
  )

  return sortReceiptsByNewest(groups.flat())
}

const loadReceiptDetail = async (maPhieuThu, maCN) => {
  const config = getReceiptConfig(maPhieuThu)
  if (!config) return null

  const entity = await config.Entity.LayChiTiet(maPhieuThu, maCN)
  if (!entity) return null

  return mapEntityToPayload(config, entity)
}

export const getCanKiemTraReceipts = async (req, res) => {
  try {
    const nvHienTai = await layNhanVienQuanLyDangNhap(req, res)
    if (!nvHienTai) return

    const q = String(req.query.q || '').trim()
    const allReceipts = await loadReceiptsByBranch(nvHienTai.maCN)
    const filtered = allReceipts.filter(
      (receipt) => TRANG_THAI_CAN_KIEM_TRA.includes(receipt.trangThai) && matchesSearch(receipt, q),
    )

    return res.status(200).json({ data: filtered })
  } catch (error) {
    console.error('getCanKiemTraReceipts error:', error)
    return res.status(500).json({ message: 'Không thể tải danh sách phiếu thu cần kiểm tra.' })
  }
}

export const getCheckedReceipts = async (req, res) => {
  try {
    const nvHienTai = await layNhanVienQuanLyDangNhap(req, res)
    if (!nvHienTai) return

    const q = String(req.query.q || '').trim()
    const allReceipts = await loadCheckedReceiptsByEmployeeToday(nvHienTai.maNV, nvHienTai.maCN)
    const filtered = allReceipts.filter(
      (receipt) => TRANG_THAI_DA_KIEM_TRA.includes(receipt.trangThai) && matchesSearch(receipt, q),
    )

    return res.status(200).json({ data: filtered })
  } catch (error) {
    console.error('getCheckedReceipts error:', error)
    return res.status(500).json({ message: 'Không thể tải lịch sử kiểm tra phiếu thu.' })
  }
}

export const getReceiptDetail = async (req, res) => {
  try {
    const nvHienTai = await layNhanVienQuanLyDangNhap(req, res)
    if (!nvHienTai) return

    const { maPhieuThu } = req.params
    const receipt = await loadReceiptDetail(maPhieuThu, nvHienTai.maCN)
    if (!receipt) {
      return res.status(404).json({ message: 'Không tìm thấy phiếu thu trong phạm vi chi nhánh của bạn.' })
    }

    return res.status(200).json({ data: receipt })
  } catch (error) {
    console.error('getReceiptDetail error:', error)
    return res.status(500).json({ message: 'Không thể tải chi tiết phiếu thu.' })
  }
}

export const verifyReceipt = async (req, res) => {
  try {
    const nvHienTai = await layNhanVienQuanLyDangNhap(req, res)
    if (!nvHienTai) return

    const { maPhieuThu } = req.params
    const { trangThai, ghiChu = '' } = req.body

    if (!TRANG_THAI_DA_KIEM_TRA.includes(trangThai)) {
      return res.status(400).json({ message: 'Kết quả kiểm tra không hợp lệ.' })
    }

    if (trangThai === 'Không hợp lệ' && !String(ghiChu || '').trim()) {
      return res.status(400).json({ message: 'Vui lòng nhập lý do phiếu thu không hợp lệ.' })
    }

    const config = getReceiptConfig(maPhieuThu)
    if (!config) {
      return res.status(404).json({ message: 'Không tìm thấy phiếu thu.' })
    }

    const duocKiemTra = await config.Entity.KiemTraTrangThai(
      maPhieuThu,
      config.typeKey,
      'Đã thanh toán',
      nvHienTai.maCN,
    )

    if (!duocKiemTra) {
      return res.status(409).json({
        message: 'Phiếu thu không còn ở trạng thái đã thanh toán để kiểm tra hoặc không thuộc chi nhánh của bạn.',
      })
    }

    await prisma.$transaction(async (tx) => {
      await tx[config.model].update({
        where: { [config.idField]: maPhieuThu },
        data: {
          trang_thai: trangThai,
          ghi_chu: trangThai === 'Không hợp lệ' ? String(ghiChu || '').trim() : '',
          nv_cap_nhat: nvHienTai.maNV,
          ngay_thanh_toan: new Date(),
        },
      })

      if (config.typeKey === 'dat-coc' && trangThai === 'Hợp lệ') {
        const phieuThuDatCoc = await tx.pt_dat_coc.findUnique({
          where: { ma_ptdc: maPhieuThu },
          select: { ma_pdc: true },
        })

        if (phieuThuDatCoc?.ma_pdc) {
          await tx.phieu_dat_coc.update({
            where: { ma_pdc: phieuThuDatCoc.ma_pdc },
            data: { trang_thai: 'Hoàn tất' },
          })
        }
      }
    })

    const receipt = await loadReceiptDetail(maPhieuThu, nvHienTai.maCN)
    return res.status(200).json({
      data: receipt,
      message: 'Cập nhật kết quả kiểm tra thành công.',
    })
  } catch (error) {
    console.error('verifyReceipt error:', error)
    return res.status(500).json({ message: 'Không thể cập nhật kết quả kiểm tra phiếu thu.' })
  }
}
