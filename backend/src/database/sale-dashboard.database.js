import prisma from '../config/prisma.js'

function toNumber(value) {
  return Number(value || 0)
}

export async function getSaleDashboardSnapshot({ maCn = null, maNv = null } = {}) {
  const [roomStatusRows, summaryRows, appointmentRows, branchRows] = await Promise.all([
    prisma.$queryRaw`
      SELECT
        COUNT(*)::int AS total_beds,
        COUNT(*) FILTER (WHERE g.trang_thai = ${'Đang sử dụng'})::int AS occupied_beds,
        COUNT(*) FILTER (WHERE g.trang_thai = ${'Trống'})::int AS available_beds,
        COUNT(*) FILTER (WHERE g.trang_thai = ${'Đã đặt cọc'})::int AS reserved_beds
      FROM giuong g
      JOIN phong p ON p.ma_phong = g.ma_phong
      WHERE (${maCn}::varchar IS NULL OR p.chi_nhanh = ${maCn})
    `,
    prisma.$queryRaw`
      SELECT
        (
          SELECT COUNT(*)::int
          FROM ho_so_dang_ky hs
          WHERE hs.trang_thai = ${'Mới tiếp nhận'}
            AND (${maCn}::varchar IS NULL OR hs.chi_nhanh = ${maCn})
        ) AS new_profiles,
        (
          SELECT COUNT(*)::int
          FROM lich_hen_xem_phong l
          JOIN ho_so_dang_ky hs ON hs.ma_dk = l.ma_dk
          WHERE (${maNv}::varchar IS NULL OR l.nv_sale = ${maNv})
            AND (${maCn}::varchar IS NULL OR hs.chi_nhanh = ${maCn})
        ) AS appointment_count,
        (
          SELECT COUNT(*)::int
          FROM phieu_dat_coc pdc
          JOIN nhanvien nv ON nv.ma_nv = pdc.nv_sale
          WHERE (${maNv}::varchar IS NULL OR pdc.nv_sale = ${maNv})
            AND (${maCn}::varchar IS NULL OR nv.ma_cn = ${maCn})
            AND pdc.trang_thai ILIKE ${'Chờ%'}
        ) AS pending_deposits
    `,
    prisma.$queryRaw`
      SELECT
        l.ma_lich,
        l.tg_hen,
        kh.ten_kh,
        kh.sdt,
        hs.trang_thai AS profile_status
      FROM lich_hen_xem_phong l
      JOIN ho_so_dang_ky hs ON hs.ma_dk = l.ma_dk
      JOIN khach_hang kh ON kh.ma_kh = hs.khach_hang
      WHERE (${maNv}::varchar IS NULL OR l.nv_sale = ${maNv})
        AND (${maCn}::varchar IS NULL OR hs.chi_nhanh = ${maCn})
      ORDER BY l.tg_hen DESC
      LIMIT 5
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

  return {
    branch,
    summary: {
      availableBeds: toNumber(roomStatus.available_beds),
      reservedBeds: toNumber(roomStatus.reserved_beds),
      occupiedBeds: toNumber(roomStatus.occupied_beds),
      totalBeds: toNumber(roomStatus.total_beds),
      appointmentCount: toNumber(summary.appointment_count),
      newProfiles: toNumber(summary.new_profiles),
      pendingDeposits: toNumber(summary.pending_deposits),
    },
    roomStatus: {
      total: toNumber(roomStatus.total_beds),
      occupied: toNumber(roomStatus.occupied_beds),
      available: toNumber(roomStatus.available_beds),
      reserved: toNumber(roomStatus.reserved_beds),
    },
    appointments: appointmentRows.map((row) => ({
      id: row.ma_lich,
      time: row.tg_hen,
      customerName: row.ten_kh,
      phone: row.sdt,
      profileStatus: row.profile_status,
    })),
  }
}
