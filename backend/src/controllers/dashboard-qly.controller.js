import prisma from '../config/prisma.js'

const normalizeStatus = (value = '') => String(value ?? '').trim().toLowerCase()

const classifyBedStatus = (value = '') => {
  const status = normalizeStatus(value)

  if (status.includes('đặt cọc') || status.includes('dat coc') || status.includes('deposit')) {
    return 'Đã đặt cọc'
  }

  if (status.includes('sử dụng') || status.includes('su dung') || status.includes('using') || status.includes('thuê') || status.includes('thue')) {
    return 'Đang sử dụng'
  }

  if (status.includes('trống') || status.includes('trong') || status.includes('empty')) {
    return 'Trống'
  }

  return 'Trống'
}

const isPaidReceipt = (row) => {
  if (row?.ngay_thanh_toan) {
    return true
  }

  const status = normalizeStatus(row?.trang_thai)
  return status.includes('đã thanh toán') || status.includes('da thanh toan') || status.includes('paid') || status.includes('đã thu') || status.includes('da thu')
}

const isValidReceipt = (row) => {
  const status = normalizeStatus(row?.trang_thai)
  return status.includes('hợp lệ') || status.includes('hop le') || status.includes('valid')
}

const isInvalidReceipt = (row) => {
  const status = normalizeStatus(row?.trang_thai)
  return status.includes('không hợp lệ') || status.includes('khong hop le') || status.includes('invalid')
}

const classifyReceipt = (row) => {
  const status = normalizeStatus(row?.trang_thai)

  if (status.includes('không hợp lệ') || status.includes('khong hop le') || status.includes('invalid')) {
    return 'invalid'
  }

  if (status.includes('hợp lệ') || status.includes('hop le') || status.includes('valid')) {
    return 'valid'
  }

  if (
    status.includes('đã thanh toán') ||
    status.includes('da thanh toan') ||
    status.includes('paid') ||
    status.includes('đã thu') ||
    status.includes('da thu') ||
    row?.ngay_thanh_toan
  ) {
    return 'paid'
  }

  if (status.includes('chưa thanh toán') || status.includes('chua thanh toan') || status.includes('unpaid')) {
    return 'unpaid'
  }

  return 'unpaid'
}

const classifyReceiptAction = (row) => {
  const status = normalizeStatus(row?.trang_thai)

  if (
    status.includes('đã thanh toán') ||
    status.includes('da thanh toan') ||
    status.includes('paid')
  ) {
    return 'pendingApproval'
  }

  if (
    status.includes('chưa thanh toán') ||
    status.includes('chua thanh toan') ||
    status.includes('unpaid') ||
    status.includes('không hợp lệ') ||
    status.includes('khong hop le') ||
    status.includes('invalid')
  ) {
    return 'needPayment'
  }

  if (isValidReceipt(row)) return 'valid'
  if (isInvalidReceipt(row)) return 'invalid'

  return 'needPayment'
}

const getTodayRange = () => {
  const start = new Date()
  start.setHours(0, 0, 0, 0)

  const end = new Date()
  end.setHours(23, 59, 59, 999)

  return { start, end }
}

export const getManagerDashboard = async (req, res) => {
  try {
    const { start, end } = getTodayRange()

    const [depositReceipts, contractReceipts, returnReceipts, compensationReceipts, bedRows, handoverRows] = await Promise.all([
      prisma.pt_dat_coc.findMany({
        select: {
          trang_thai: true,
          ngay_thanh_toan: true,
        },
      }),
      prisma.pt_hop_dong.findMany({
        select: {
          trang_thai: true,
          ngay_thanh_toan: true,
        },
      }),
      prisma.pt_tra_phong.findMany({
        select: {
          trang_thai: true,
          ngay_thanh_toan: true,
        },
      }),
      prisma.pt_boi_thuong.findMany({
        select: {
          trang_thai: true,
          ngay_thanh_toan: true,
        },
      }),
      prisma.giuong.findMany({
        select: {
          trang_thai: true,
        },
      }),
      prisma.$queryRaw`
        SELECT ma_hdt
        FROM hop_dong_thue
        WHERE DATE(tg_vao) = CURRENT_DATE
      `,
    ])

    const [cancelColumnCheck] = await prisma.$queryRaw`
      SELECT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'ho_so_tra_phong'
          AND column_name = 'ngay_huy'
      ) AS exists
    `
    const hasNgayHuyColumn = cancelColumnCheck?.exists === true || cancelColumnCheck?.exists === 't'

    const returnRowsCount = hasNgayHuyColumn
      ? Number(
          (
            await prisma.$queryRaw`
              SELECT COUNT(*)::int AS count
              FROM ho_so_tra_phong
              WHERE DATE(ngay_tp) = CURRENT_DATE
                AND ngay_huy IS NULL
            `
          )[0]?.count ?? 0,
        )
      : Number(
          (
            await prisma.$queryRaw`
              SELECT COUNT(*)::int AS count
              FROM ho_so_tra_phong
              WHERE DATE(ngay_tp) = CURRENT_DATE
            `
          )[0]?.count ?? 0,
        )

    const receiptStats = [
      {
        label: 'Đặt cọc',
        values: depositReceipts.reduce(
          (acc, row) => {
            acc[classifyReceipt(row)] += 1
            return acc
          },
          { unpaid: 0, paid: 0, valid: 0, invalid: 0 },
        ),
      },
      {
        label: 'Hợp đồng',
        values: contractReceipts.reduce(
          (acc, row) => {
            acc[classifyReceipt(row)] += 1
            return acc
          },
          { unpaid: 0, paid: 0, valid: 0, invalid: 0 },
        ),
      },
      {
        label: 'Trả phòng',
        values: returnReceipts.reduce(
          (acc, row) => {
            acc[classifyReceipt(row)] += 1
            return acc
          },
          { unpaid: 0, paid: 0, valid: 0, invalid: 0 },
        ),
      },
      {
        label: 'Bồi thường',
        values: compensationReceipts.reduce(
          (acc, row) => {
            acc[classifyReceipt(row)] += 1
            return acc
          },
          { unpaid: 0, paid: 0, valid: 0, invalid: 0 },
        ),
      },
    ]

    const bedCounts = bedRows.reduce(
      (acc, row) => {
        const category = classifyBedStatus(row.trang_thai)
        acc[category] += 1
        return acc
      },
      {
        'Đã đặt cọc': 0,
        'Đang sử dụng': 0,
        Trống: 0,
      },
    )

    const bedStats = [
      {
        label: 'Đã đặt cọc',
        value: bedCounts['Đã đặt cọc'],
        color: '#3b4f27',
      },
      {
        label: 'Đang sử dụng',
        value: bedCounts['Đang sử dụng'],
        color: '#d8e8cf',
      },
      {
        label: 'Trống',
        value: bedCounts.Trống,
        color: '#e6e8e6',
      },
    ]

    const allReceiptRows = [...depositReceipts, ...contractReceipts, ...returnReceipts, ...compensationReceipts]
    const pendingApprovalCount = allReceiptRows.filter((row) => classifyReceiptAction(row) === 'pendingApproval').length
    const needPaymentCount = allReceiptRows.filter((row) => classifyReceiptAction(row) === 'needPayment').length
    const totalTasks = handoverRows.length + returnRowsCount + pendingApprovalCount + needPaymentCount
    const taskBreakdown = `phiếu thu chờ duyệt: ${pendingApprovalCount}; lịch bàn giao hôm nay: ${handoverRows.length}; trả phòng & kiểm tra: ${returnRowsCount}; phiếu thu cần thanh toán: ${needPaymentCount}`

    const summaryCards = [
      {
        title: 'PHIẾU THU CHỜ DUYỆT',
        value: pendingApprovalCount,
        icon: '🧾',
      },
      {
        title: 'LỊCH BÀN GIAO HÔM NAY',
        value: handoverRows.length,
        icon: '📅',
      },
      {
        title: 'TRẢ PHÒNG & KIỂM TRA',
        value: returnRowsCount,
        icon: '🔑',
      },
      {
        title: 'PHIẾU THU CẦN THANH TOÁN',
        value: needPaymentCount,
        icon: '💳',
      },
    ]

    res.json({
      success: true,
      data: {
        summaryCards,
        bedStats,
        receiptStats,
        description: `Chào mừng trở lại! Hôm nay bạn có ${totalTasks} công việc cần xử lý.`,
      },
      message: 'Lấy dữ liệu dashboard thành công',
    })
  } catch (error) {
    console.error('Lỗi khi lấy dữ liệu dashboard:', error)
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy dữ liệu dashboard',
      error: error.message,
    })
  }
}
