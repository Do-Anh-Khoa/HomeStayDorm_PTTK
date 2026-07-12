import prisma from '../config/prisma.js'

function toNumber(value) {
  return Number(value || 0)
}

export async function getAdminDashboardOverview() {
  const [overviewRows] = await Promise.all([
    prisma.$queryRaw`
      SELECT
        (SELECT COUNT(*)::int FROM chi_nhanh) AS tong_chi_nhanh,
        (
          SELECT COUNT(*)::int
          FROM nhanvien
          WHERE tinh_trang = ${'Đang làm việc'}
        ) AS tong_nhan_vien,
        (
          SELECT COUNT(*)::int
          FROM giuong
          WHERE trang_thai = ${'Trống'}
        ) AS tong_giuong_trong,
        (
          SELECT COUNT(*)::int
          FROM giuong
        ) AS tong_giuong,
        (
          SELECT COUNT(*)::int
          FROM giuong
          WHERE trang_thai IN (${'Đang sử dụng'}, ${'Đã đặt cọc'})
        ) AS giuong_da_lap,
        (
          SELECT COUNT(*)::int FROM quy_dinh_ktx
        ) AS tong_quy_dinh
    `,
  ])

  const row = overviewRows[0] || {}
  const tongGiuong = toNumber(row.tong_giuong)
  const giuongDaLap = toNumber(row.giuong_da_lap)
  const tyLeLapDay = tongGiuong > 0 ? (giuongDaLap / tongGiuong) * 100 : 0

  return {
    tong_chi_nhanh: toNumber(row.tong_chi_nhanh),
    tong_nhan_vien: toNumber(row.tong_nhan_vien),
    tong_giuong_trong: toNumber(row.tong_giuong_trong),
    ty_le_lap_day: tyLeLapDay,
    tong_quy_dinh: toNumber(row.tong_quy_dinh),
  }
}

export async function getGiuongTheoChiNhanh() {
  const rows = await prisma.$queryRaw`
    SELECT
      cn.ma_cn,
      cn.ten_cn,
      COUNT(g.ma_giuong) FILTER (WHERE g.trang_thai = ${'Đang sử dụng'})::int AS dang_su_dung,
      COUNT(g.ma_giuong) FILTER (WHERE g.trang_thai = ${'Đã đặt cọc'})::int AS da_dat_coc,
      COUNT(g.ma_giuong) FILTER (WHERE g.trang_thai = ${'Trống'})::int AS trong
    FROM chi_nhanh cn
    LEFT JOIN phong p ON p.chi_nhanh = cn.ma_cn
    LEFT JOIN giuong g ON g.ma_phong = p.ma_phong
    GROUP BY cn.ma_cn, cn.ten_cn
    ORDER BY cn.ma_cn ASC
  `

  return rows.map((row) => ({
    ma_cn: row.ma_cn,
    ten_cn: row.ten_cn,
    dang_su_dung: toNumber(row.dang_su_dung),
    da_dat_coc: toNumber(row.da_dat_coc),
    trong: toNumber(row.trong),
  }))
}

export async function getPhanBoNhanSu() {
  const rows = await prisma.$queryRaw`
    SELECT loai_nv, COUNT(*)::int AS count
    FROM nhanvien
    WHERE tinh_trang = ${'Đang làm việc'}
      AND loai_nv <> ${'ADMIN'}
    GROUP BY loai_nv
    ORDER BY count DESC
  `

  const total = rows.reduce((sum, row) => sum + toNumber(row.count), 0)
  
  let sumRounded = 0
  const result = rows.map((row, index) => {
    const rawPct = total > 0 ? (toNumber(row.count) / total) * 100 : 0
    let pct = Math.round(rawPct)
    if (index === rows.length - 1) {
      // Adjust last item to make sure total is 100
      pct = 100 - sumRounded
    } else {
      sumRounded += pct
    }
    return {
      loai_nv: row.loai_nv,
      count: toNumber(row.count),
      pct,
    }
  })

  return result
}
