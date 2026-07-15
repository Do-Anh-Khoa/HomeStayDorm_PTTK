import prisma from '../config/prisma.js'

function toNumber(value) {
  return Number(value || 0)
}

/**
 * Quy tắc nghiệp vụ:
 * - Tình trạng giường / phòng: lấy theo CHI NHÁNH của nhân viên phụ trách (maCn),
 *   không phụ thuộc vào nhân viên nào phụ trách hợp đồng.
 * - "Chờ lập hợp đồng": các phiếu đặt cọc (phieu_dat_coc) có trang_thai = 'Hoàn tất',
 *   thuộc cùng chi nhánh (xác định qua nhân viên sale đã tạo phiếu: phieu_dat_coc.nv_sale
 *   -> nhanvien.ma_cn), và CHƯA có hợp đồng thuê (hop_dong_thue) nào được lập từ phiếu đó.
 * - Hợp đồng đã lập / biểu đồ hợp đồng / số khách đã chốt / tổng hợp đồng /
 *   hợp đồng tháng này / hợp đồng năm nay: đều lọc theo NHÂN VIÊN PHỤ TRÁCH (maNv)
 *   thông qua hop_dong_thue.nv_phu_trach.
 */
export async function getPhuTrachDashboardSnapshot({ maCn = null, maNv = null } = {}) {
  const [roomStatusRows, summaryRows, contractChartRows, branchRows] = await Promise.all([
    // Tình trạng giường theo chi nhánh
    prisma.$queryRaw`
      SELECT
        COUNT(*)::int AS total_beds,
        COUNT(*) FILTER (WHERE g.trang_thai = ${'Đang sử dụng'})::int AS occupied_beds,
        COUNT(*) FILTER (WHERE g.trang_thai = ${'Trống'})::int AS available_beds,
        COUNT(*) FILTER (WHERE g.trang_thai = ${'Đã đặt cọc'})::int AS reserved_beds,
        COUNT(*) FILTER (WHERE g.trang_thai = ${'Đang trả phòng'})::int AS checking_out_beds
      FROM giuong g
      JOIN phong p ON p.ma_phong = g.ma_phong
      WHERE (${maCn}::varchar IS NULL OR p.chi_nhanh = ${maCn})
    `,

    // Các số liệu tổng hợp
    prisma.$queryRaw`
      SELECT
        (
          SELECT COUNT(*)::int
          FROM phieu_dat_coc pdc
          JOIN nhanvien nv ON nv.ma_nv = pdc.nv_sale
          WHERE pdc.trang_thai = ${'Hoàn tất'}
            AND NOT EXISTS (
              SELECT 1 FROM hop_dong_thue hdt WHERE hdt.ma_pdc = pdc.ma_pdc
            )
            AND (${maCn}::varchar IS NULL OR nv.ma_cn = ${maCn})
        ) AS pending_contracts,

        (
          SELECT COUNT(*)::int
          FROM hop_dong_thue hdt
          WHERE (${maNv}::varchar IS NULL OR hdt.nv_phu_trach = ${maNv})
        ) AS total_contracts,

        (
          SELECT COUNT(*)::int
          FROM hop_dong_thue hdt
          WHERE (${maNv}::varchar IS NULL OR hdt.nv_phu_trach = ${maNv})
            AND date_trunc('month', hdt.tg_tao_hd) = date_trunc('month', CURRENT_DATE)
        ) AS contracts_this_month,

        (
          SELECT COUNT(*)::int
          FROM hop_dong_thue hdt
          WHERE (${maNv}::varchar IS NULL OR hdt.nv_phu_trach = ${maNv})
            AND date_trunc('year', hdt.tg_tao_hd) = date_trunc('year', CURRENT_DATE)
        ) AS contracts_this_year,

        (
          SELECT COUNT(*)::int
          FROM khach_thue kt
          JOIN hop_dong_thue hdt ON hdt.ma_hdt = kt.ma_hdt
          WHERE (${maNv}::varchar IS NULL OR hdt.nv_phu_trach = ${maNv})
        ) AS closed_customers
    `,

    // Biểu đồ hợp đồng theo tháng trong năm hiện tại, của riêng nhân viên phụ trách
    prisma.$queryRaw`
      SELECT
        EXTRACT(MONTH FROM hdt.tg_tao_hd)::int AS month,
        COUNT(*)::int AS total
      FROM hop_dong_thue hdt
      WHERE (${maNv}::varchar IS NULL OR hdt.nv_phu_trach = ${maNv})
        AND EXTRACT(YEAR FROM hdt.tg_tao_hd) = EXTRACT(YEAR FROM CURRENT_DATE)
      GROUP BY 1
      ORDER BY 1
    `,

    maCn
      ? prisma.$queryRaw`
          SELECT ma_cn, ten_cn
          FROM chi_nhanh
          WHERE ma_cn = ${maCn}
          LIMIT 1
        `
      : Promise.resolve([]),
  ])

  const roomStatus = roomStatusRows[0] || {}
  const summary = summaryRows[0] || {}
  const branch = branchRows[0] || null

  const contractsByMonth = Array.from({ length: 12 }, (_, index) => {
    const month = index + 1
    const found = contractChartRows.find((row) => toNumber(row.month) === month)
    return {
      month,
      label: `T${month}`,
      total: found ? toNumber(found.total) : 0,
    }
  })

  return {
    branch,
    summary: {
      pendingContracts: toNumber(summary.pending_contracts),
      availableBeds: toNumber(roomStatus.available_beds),
      contractsSigned: toNumber(summary.total_contracts),
      closedCustomers: toNumber(summary.closed_customers),
      totalContracts: toNumber(summary.total_contracts),
      contractsThisMonth: toNumber(summary.contracts_this_month),
      contractsThisYear: toNumber(summary.contracts_this_year),
    },
    roomStatus: {
      total: toNumber(roomStatus.total_beds),
      occupied: toNumber(roomStatus.occupied_beds),
      available: toNumber(roomStatus.available_beds),
      reserved: toNumber(roomStatus.reserved_beds),
      checkingOut: toNumber(roomStatus.checking_out_beds),
    },
    contractsByMonth,
  }
}