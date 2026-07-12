import prisma from '../config/prisma.js'

const normalizeStatus = (value = '') => String(value ?? '').trim().toLowerCase()

const classifyBedStatus = (value = '') => {
  const status = normalizeStatus(value)

  if (
    status.includes('đặt cọc') ||
    status.includes('dat coc') ||
    status.includes('deposit')
  ) {
    return 'Đã đặt cọc'
  }

  if (
    status.includes('sử dụng') ||
    status.includes('su dung') ||
    status.includes('using') ||
    status.includes('thuê') ||
    status.includes('thue')
  ) {
    return 'Đang sử dụng'
  }

  if (
    status.includes('trống') ||
    status.includes('trong') ||
    status.includes('empty')
  ) {
    return 'Trống'
  }

  return 'Trống'
}

const isValidReceipt = row => {
  const status = normalizeStatus(row?.trang_thai)
  return (
    status.includes('hợp lệ') ||
    status.includes('hop le') ||
    status.includes('valid')
  )
}

const isInvalidReceipt = row => {
  const status = normalizeStatus(row?.trang_thai)
  return (
    status.includes('không hợp lệ') ||
    status.includes('khong hop le') ||
    status.includes('invalid')
  )
}

const classifyReceipt = row => {
  const status = normalizeStatus(row?.trang_thai)

  if (
    status.includes('không hợp lệ') ||
    status.includes('khong hop le') ||
    status.includes('invalid')
  ) {
    return 'invalid'
  }

  if (
    status.includes('hợp lệ') ||
    status.includes('hop le') ||
    status.includes('valid')
  ) {
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

  if (
    status.includes('chưa thanh toán') ||
    status.includes('chua thanh toan') ||
    status.includes('unpaid')
  ) {
    return 'unpaid'
  }

  return 'unpaid'
}

const classifyReceiptAction = row => {
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

const buildReceiptStat = (label, rows) => ({
  label,
  values: rows.reduce(
    (acc, row) => {
      acc[classifyReceipt(row)] += 1
      return acc
    },
    {
      unpaid: 0,
      paid: 0,
      valid: 0,
      invalid: 0,
    },
  ),
})

const getCurrentEmployeeBranch = async req => {
  const maNv = req.auth?.ma_nv || req.authSession?.ma_nv || req.user?.ma_nv

  if (!maNv) {
    return null
  }

  const rows = await prisma.$queryRaw`
    SELECT
      ma_nv,
      ten_nv,
      ma_cn
    FROM nhanvien
    WHERE ma_nv = ${maNv}
    LIMIT 1
  `

  return rows[0] || null
}

export const getManagerDashboard = async (req, res) => {
  try {
    const currentEmployee = await getCurrentEmployeeBranch(req)

    if (!currentEmployee?.ma_cn) {
      return res.status(401).json({
        success: false,
        message: 'Không xác định được chi nhánh của nhân viên đang đăng nhập.',
      })
    }

    const maCn = currentEmployee.ma_cn

    const [
      depositReceipts,
      contractReceipts,
      returnReceipts,
      compensationReceipts,
      bedRows,
      handoverRows,
      returnRows,
    ] = await Promise.all([
      // Phiếu thu đặt cọc thuộc chi nhánh hiện tại
      prisma.$queryRaw`
        SELECT
          ptdc.ma_ptdc,
          ptdc.trang_thai,
          ptdc.ngay_thanh_toan
        FROM pt_dat_coc ptdc
        WHERE EXISTS (
          SELECT 1
          FROM phieu_dat_coc pdc
          JOIN dat_coc_giuong dcg ON dcg.ma_pdc = pdc.ma_pdc
          JOIN phong p ON p.ma_phong = dcg.ma_phong
          WHERE pdc.ma_pdc = ptdc.ma_pdc
            AND p.chi_nhanh = ${maCn}
        )
      `,

      // Phiếu thu hợp đồng thuộc chi nhánh hiện tại
      prisma.$queryRaw`
        SELECT
          pthd.ma_pthd,
          pthd.trang_thai,
          pthd.ngay_thanh_toan
        FROM pt_hop_dong pthd
        WHERE EXISTS (
          SELECT 1
          FROM hop_dong_thue hdt
          JOIN phieu_dat_coc pdc ON pdc.ma_pdc = hdt.ma_pdc
          JOIN dat_coc_giuong dcg ON dcg.ma_pdc = pdc.ma_pdc
          JOIN phong p ON p.ma_phong = dcg.ma_phong
          WHERE hdt.ma_hdt = pthd.ma_hdt
            AND p.chi_nhanh = ${maCn}
        )
      `,

      // Phiếu thu trả phòng thuộc chi nhánh hiện tại
      prisma.$queryRaw`
        SELECT
          pttp.ma_pttp,
          pttp.trang_thai,
          pttp.ngay_thanh_toan
        FROM pt_tra_phong pttp
        WHERE EXISTS (
          SELECT 1
          FROM ho_so_tra_phong hstp
          JOIN phieu_dat_coc pdc ON pdc.ma_pdc = hstp.ma_pdc
          JOIN dat_coc_giuong dcg ON dcg.ma_pdc = pdc.ma_pdc
          JOIN phong p ON p.ma_phong = dcg.ma_phong
          WHERE hstp.ma_tp = pttp.ma_tp
            AND p.chi_nhanh = ${maCn}
        )
      `,

      // Phiếu thu bồi thường: bảng bồi thường không có phòng,
      // nên lọc theo chi nhánh của nhân viên quản lý tạo bồi thường.
      prisma.$queryRaw`
        SELECT
          ptbt.ma_ptdb,
          ptbt.trang_thai,
          ptbt.ngay_thanh_toan
        FROM pt_boi_thuong ptbt
        JOIN boi_thuong bt ON bt.ma_bt = ptbt.ma_bt
        JOIN nhanvien nv ON nv.ma_nv = bt.nv_quan_ly
        WHERE nv.ma_cn = ${maCn}
      `,

      // Tình trạng giường của chi nhánh hiện tại
      prisma.$queryRaw`
        SELECT
          g.trang_thai
        FROM giuong g
        JOIN phong p ON p.ma_phong = g.ma_phong
        WHERE p.chi_nhanh = ${maCn}
      `,

      // Lịch bàn giao hôm nay thuộc chi nhánh hiện tại
      prisma.$queryRaw`
        SELECT DISTINCT
          hdt.ma_hdt
        FROM hop_dong_thue hdt
        JOIN phieu_dat_coc pdc ON pdc.ma_pdc = hdt.ma_pdc
        JOIN dat_coc_giuong dcg ON dcg.ma_pdc = pdc.ma_pdc
        JOIN phong p ON p.ma_phong = dcg.ma_phong
        WHERE DATE(hdt.tg_vao) = CURRENT_DATE
          AND p.chi_nhanh = ${maCn}
      `,

      // Hồ sơ trả phòng hôm nay thuộc chi nhánh hiện tại
      prisma.$queryRaw`
        SELECT DISTINCT
          hstp.ma_tp
        FROM ho_so_tra_phong hstp
        JOIN phieu_dat_coc pdc ON pdc.ma_pdc = hstp.ma_pdc
        JOIN dat_coc_giuong dcg ON dcg.ma_pdc = pdc.ma_pdc
        JOIN phong p ON p.ma_phong = dcg.ma_phong
        WHERE DATE(hstp.ngay_tp) = CURRENT_DATE
          AND hstp.ngay_huy IS NULL
          AND hstp.ghi_nhan_hu_hai = false
          AND p.chi_nhanh = ${maCn}
      `,
    ])

    const receiptStats = [
      buildReceiptStat('Đặt cọc', depositReceipts),
      buildReceiptStat('Hợp đồng', contractReceipts),
      buildReceiptStat('Trả phòng', returnReceipts),
      buildReceiptStat('Bồi thường', compensationReceipts),
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

    const allReceiptRows = [
      ...depositReceipts,
      ...contractReceipts,
      ...returnReceipts,
      ...compensationReceipts,
    ]

    const pendingApprovalCount = allReceiptRows.filter(
      row => classifyReceiptAction(row) === 'pendingApproval',
    ).length

    const needPaymentCount = allReceiptRows.filter(
      row => classifyReceiptAction(row) === 'needPayment',
    ).length

    const returnRowsCount = returnRows.length

    const totalTasks =
      handoverRows.length +
      returnRowsCount +
      pendingApprovalCount +
      needPaymentCount

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
        currentBranch: {
          ma_cn: maCn,
          ma_nv: currentEmployee.ma_nv,
          ten_nv: currentEmployee.ten_nv,
        },
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