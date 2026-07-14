import prisma from '../config/prisma.js'

function parseDateOnly(value) {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

function toVnAppointmentDate(dateOnly, hours = 14, minutes = 30) {
  if (!dateOnly) return null
  return new Date(dateOnly.getFullYear(), dateOnly.getMonth(), dateOnly.getDate(), hours, minutes, 0)
}

function isValidReturnDate(value) {
  const dateOnly = parseDateOnly(value)
  if (!dateOnly) return false

  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  return dateOnly >= todayStart
}

async function assertSameBranchByPdc(maPdc, maCn) {
  const rows = await prisma.$queryRaw`
    SELECT 1
    FROM dat_coc_giuong dcg
    JOIN phong p ON p.ma_phong = dcg.ma_phong
    WHERE dcg.ma_pdc = ${maPdc}
      AND p.chi_nhanh = ${maCn}
    LIMIT 1
  `

  return rows.length > 0
}

export async function searchKhachTraPhong({ keyword, maCn }) {
  const normalized = String(keyword || '').trim()
  if (!normalized) return []

  const contractRows = await prisma.$queryRaw`
    SELECT
      hdt.ma_hdt AS "maHopDong",
      hdt.ma_pdc AS "maPdc",
      kt.ma_kh AS "maKhachThue",
      kh.ten_kh AS "hoVaTen",
      kh.cccd AS "cccd",
      kh.sdt AS "soDienThoai",
      kh.email AS "email",
      hdt.tg_vao AS "ngayVao",
      COALESCE(
        (
          SELECT CONCAT(dcg.ma_phong, ' / ', dcg.ma_giuong)
          FROM dat_coc_giuong dcg
          JOIN phong p ON p.ma_phong = dcg.ma_phong
          WHERE dcg.ma_pdc = hdt.ma_pdc
            AND p.chi_nhanh = ${maCn}
          ORDER BY dcg.ma_phong ASC, dcg.ma_giuong ASC
          LIMIT 1
        ),
        ''
      ) AS "phongGiuong"
    FROM hop_dong_thue hdt
    JOIN phieu_dat_coc pdc ON pdc.ma_pdc = hdt.ma_pdc
    JOIN khach_thue kt ON kt.ma_hdt = hdt.ma_hdt
    JOIN khach_hang kh ON kh.ma_kh = kt.ma_kh
    WHERE EXISTS (
      SELECT 1
      FROM dat_coc_giuong dcg_branch
      JOIN phong p_branch ON p_branch.ma_phong = dcg_branch.ma_phong
      WHERE dcg_branch.ma_pdc = hdt.ma_pdc
        AND p_branch.chi_nhanh = ${maCn}
      LIMIT 1
    )
      AND (
        hdt.ma_hdt ILIKE ${'%' + normalized + '%'} OR
        hdt.ma_pdc ILIKE ${'%' + normalized + '%'} OR
        kh.ten_kh ILIKE ${'%' + normalized + '%'} OR
        kh.cccd ILIKE ${'%' + normalized + '%'} OR
        kh.sdt ILIKE ${'%' + normalized + '%'} OR
        EXISTS (
          SELECT 1
          FROM dat_coc_giuong dcg_find
          WHERE dcg_find.ma_pdc = hdt.ma_pdc
            AND (dcg_find.ma_phong ILIKE ${'%' + normalized + '%'} OR dcg_find.ma_giuong ILIKE ${'%' + normalized + '%'})
          LIMIT 1
        )
      )
      AND NOT EXISTS (
        SELECT 1
        FROM ho_so_tra_phong hstp
        WHERE hstp.ma_hdt = hdt.ma_hdt
          AND hstp.ma_khach_thue = kt.ma_kh
          AND hstp.ngay_huy IS NULL
        LIMIT 1
      )
    ORDER BY hdt.tg_tao_hd DESC
    LIMIT 50
  `

  const depositOnlyRows = await prisma.$queryRaw`
    SELECT
      NULL AS "maHopDong",
      pdc.ma_pdc AS "maPdc",
      NULL AS "maKhachThue",
      kh.ten_kh AS "hoVaTen",
      kh.cccd AS "cccd",
      kh.sdt AS "soDienThoai",
      kh.email AS "email",
      NULL AS "ngayVao",
      COALESCE(
        (
          SELECT CONCAT(dcg.ma_phong, ' / ', dcg.ma_giuong)
          FROM dat_coc_giuong dcg
          JOIN phong p ON p.ma_phong = dcg.ma_phong
          WHERE dcg.ma_pdc = pdc.ma_pdc
            AND p.chi_nhanh = ${maCn}
          ORDER BY dcg.ma_phong ASC, dcg.ma_giuong ASC
          LIMIT 1
        ),
        ''
      ) AS "phongGiuong"
    FROM phieu_dat_coc pdc
    JOIN khach_hang kh ON kh.ma_kh = pdc.khach_dat
    WHERE pdc.trang_thai = 'Hoàn tất'
      AND NOT EXISTS (
        SELECT 1
        FROM hop_dong_thue hdt
        WHERE hdt.ma_pdc = pdc.ma_pdc
        LIMIT 1
      )
      AND EXISTS (
        SELECT 1
        FROM dat_coc_giuong dcg_branch
        JOIN phong p_branch ON p_branch.ma_phong = dcg_branch.ma_phong
        WHERE dcg_branch.ma_pdc = pdc.ma_pdc
          AND p_branch.chi_nhanh = ${maCn}
        LIMIT 1
      )
      AND (
        pdc.ma_pdc ILIKE ${'%' + normalized + '%'} OR
        kh.ten_kh ILIKE ${'%' + normalized + '%'} OR
        kh.cccd ILIKE ${'%' + normalized + '%'} OR
        kh.sdt ILIKE ${'%' + normalized + '%'} OR
        EXISTS (
          SELECT 1
          FROM dat_coc_giuong dcg_find
          WHERE dcg_find.ma_pdc = pdc.ma_pdc
            AND (
              dcg_find.ma_phong ILIKE ${'%' + normalized + '%'} OR
              dcg_find.ma_giuong ILIKE ${'%' + normalized + '%'}
            )
          LIMIT 1
        )
      )
      AND NOT EXISTS (
        SELECT 1
        FROM ho_so_tra_phong hstp
        WHERE hstp.ma_pdc = pdc.ma_pdc
          AND hstp.ma_hdt IS NULL
          AND hstp.ngay_huy IS NULL
        LIMIT 1
      )
    ORDER BY pdc.ngay_dc DESC
    LIMIT 50
  `

  return [...contractRows, ...depositOnlyRows].map((row) => ({
    maPdc: row.maPdc,
    maHopDong: row.maHopDong,
    maKhachThue: row.maKhachThue,
    hoVaTen: row.hoVaTen,
    cccd: row.cccd,
    soDienThoai: row.soDienThoai,
    email: row.email,
    phongGiuong: row.phongGiuong,
    ngayVao: row.ngayVao ? new Date(row.ngayVao).toISOString().slice(0, 10) : '',
  }))
}

export async function createHoSoTraPhong({
  maPdc,
  maHopDong,
  maKhachThue,
  ngayTraPhongDuKien,
  maNVSale,
  maCn,
}) {
  const maPDC = String(maPdc || '').trim()
  const maHDT = String(maHopDong || '').trim()
  const maKH = String(maKhachThue || '').trim()
  const isContractCase = Boolean(maHDT)

  if (!maPDC && !maHDT) {
    const error = new Error('Thiếu thông tin phiếu đặt cọc/hợp đồng thuê.')
    error.status = 400
    throw error
  }

  if (isContractCase && !isValidReturnDate(ngayTraPhongDuKien)) {
    const error = new Error('Ngày trả phòng dự kiến không hợp lệ.')
    error.status = 400
    throw error
  }

  if (isContractCase) {
    if (!maKH) {
      const error = new Error('Thiếu thông tin khách thuê.')
      error.status = 400
      throw error
    }

    const contract = await prisma.hop_dong_thue.findUnique({
      where: { ma_hdt: maHDT },
      select: { ma_hdt: true, ma_pdc: true },
    })

    if (!contract) {
      const error = new Error('Không tìm thấy hợp đồng thuê.')
      error.status = 404
      throw error
    }

    const sameBranch = await assertSameBranchByPdc(contract.ma_pdc, maCn)
    if (!sameBranch) {
      const error = new Error('Bạn không có quyền thao tác với dữ liệu ở chi nhánh khác.')
      error.status = 403
      throw error
    }

    const tenantRows = await prisma.$queryRaw`
      SELECT 1
      FROM khach_thue
      WHERE ma_kh = ${maKH}
        AND ma_hdt = ${maHDT}
      LIMIT 1
    `

    if (tenantRows.length === 0) {
      const error = new Error('Khách thuê này không thuộc hợp đồng đã chọn.')
      error.status = 400
      throw error
    }

    const existedRows = await prisma.$queryRaw`
      SELECT ma_tp
      FROM ho_so_tra_phong
      WHERE ma_hdt = ${maHDT}
        AND ma_khach_thue = ${maKH}
        AND ngay_huy IS NULL
      LIMIT 1
    `

    if (existedRows.length > 0) {
      const error = new Error('Khách thuê này đã có hồ sơ trả phòng đang hiệu lực.')
      error.status = 409
      throw error
    }

    const dateOnly = parseDateOnly(ngayTraPhongDuKien)
    const tgHen = toVnAppointmentDate(dateOnly)

    const created = await prisma.$transaction(async (tx) => {
      const insertedRows = await tx.$queryRaw`
        INSERT INTO ho_so_tra_phong (nv_sale, ma_pdc, ma_hdt, ma_khach_thue, ghi_nhan_hu_hai)
        VALUES (${maNVSale}, ${contract.ma_pdc}, ${contract.ma_hdt}, ${maKH}, FALSE)
        RETURNING ma_tp, ma_pdc, ma_hdt, ma_khach_thue, ngay_tp
      `

      const hstp = insertedRows[0]

      const lich = await tx.lich_hen_tra_phong.create({
        data: {
          tg_hen: tgHen,
          ma_tp: hstp.ma_tp,
          nv_sale: maNVSale,
        },
        select: { tg_hen: true },
      })

      const infoRows = await tx.$queryRaw`
        SELECT
          kh.ten_kh AS "tenKhachHang",
          kh.email AS "email",
          COALESCE(
            (
              SELECT STRING_AGG(t.item, ', ' ORDER BY t.item)
              FROM (
                SELECT DISTINCT CONCAT(dcg.ma_phong, ' - ', dcg.ma_giuong) AS item
                FROM dat_coc_giuong dcg
                JOIN phong p ON p.ma_phong = dcg.ma_phong
                WHERE dcg.ma_pdc = ${contract.ma_pdc}
                  AND p.chi_nhanh = ${maCn}
              ) t
            ),
            ''
          ) AS "phongGiuong"
        FROM khach_hang kh
        WHERE kh.ma_kh = ${maKH}
        LIMIT 1
      `

      return {
        hstp,
        lich,
        mailInfo: infoRows[0] || null,
      }
    })

    return {
      maTP: created.hstp.ma_tp,
      maPdc: created.hstp.ma_pdc,
      maHopDong: created.hstp.ma_hdt,
      maKhachThue: created.hstp.ma_khach_thue,
      ngayLap: created.hstp.ngay_tp,
      tgHen: created.lich.tg_hen,
      mailInfo: created.mailInfo,
      canSendEmail: true,
    }
  }

  const deposit = await prisma.phieu_dat_coc.findUnique({
    where: { ma_pdc: maPDC },
    select: { ma_pdc: true, khach_dat: true, trang_thai: true },
  })

  if (!deposit) {
    const error = new Error('Không tìm thấy phiếu đặt cọc.')
    error.status = 404
    throw error
  }

  const sameBranch = await assertSameBranchByPdc(deposit.ma_pdc, maCn)
  if (!sameBranch) {
    const error = new Error('Bạn không có quyền thao tác với dữ liệu ở chi nhánh khác.')
    error.status = 403
    throw error
  }

  if (deposit.trang_thai !== 'Hoàn tất') {
    const error = new Error('Chỉ phiếu đặt cọc đã thanh toán hoàn tất mới được lập hồ sơ trả phòng.')
    error.status = 400
    throw error
  }

  const depositHasContractRows = await prisma.$queryRaw`
    SELECT 1
    FROM hop_dong_thue
    WHERE ma_pdc = ${deposit.ma_pdc}
    LIMIT 1
  `

  if (depositHasContractRows.length > 0) {
    const error = new Error('Phiếu đặt cọc này đã phát sinh hợp đồng thuê, vui lòng lập hồ sơ theo hợp đồng.')
    error.status = 409
    throw error
  }

  const existedDepositRows = await prisma.$queryRaw`
    SELECT ma_tp
    FROM ho_so_tra_phong
    WHERE ma_pdc = ${deposit.ma_pdc}
      AND ma_hdt IS NULL
      AND ngay_huy IS NULL
    LIMIT 1
  `

  if (existedDepositRows.length > 0) {
    const error = new Error('Phiếu đặt cọc này đã có hồ sơ trả phòng đang hiệu lực.')
    error.status = 409
    throw error
  }

  const created = await prisma.$transaction(async (tx) => {
    const insertedRows = await tx.$queryRaw`
      INSERT INTO ho_so_tra_phong (nv_sale, ma_pdc, ma_hdt, ma_khach_thue, ghi_nhan_hu_hai)
      VALUES (${maNVSale}, ${deposit.ma_pdc}, NULL, NULL, FALSE)
      RETURNING ma_tp, ma_pdc, ma_hdt, ma_khach_thue, ngay_tp
    `

    return insertedRows[0]
  })

  return {
    maTP: created.ma_tp,
    maPdc: created.ma_pdc,
    maHopDong: created.ma_hdt,
    maKhachThue: created.ma_khach_thue,
    ngayLap: created.ngay_tp,
    tgHen: null,
    mailInfo: null,
    canSendEmail: false,
  }
}

export async function autoCancelOverdueHoSoTraPhong(maCn) {
  await prisma.$executeRaw`
    UPDATE ho_so_tra_phong h
    SET ngay_huy = NOW()
    WHERE h.ngay_huy IS NULL
      AND EXISTS (
        SELECT 1
        FROM lich_hen_tra_phong l
        WHERE l.ma_tp = h.ma_tp
          AND (l.tg_hen + INTERVAL '7 hour') <
            date_trunc('day', CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Ho_Chi_Minh')
        LIMIT 1
      )
      AND EXISTS (
        SELECT 1
        FROM dat_coc_giuong dcg
        JOIN phong p ON p.ma_phong = dcg.ma_phong
        WHERE dcg.ma_pdc = h.ma_pdc
          AND p.chi_nhanh = ${maCn}
        LIMIT 1
      )
  `
}

export async function listHoSoTraPhong({ maCn }) {
  await autoCancelOverdueHoSoTraPhong(maCn)

  const rows = await prisma.$queryRaw`
    SELECT
      h.ma_tp AS "maHoSo",
      h.ma_pdc AS "maPdc",
      h.ma_hdt AS "maHopDong",
      kh.ten_kh AS "khachThue",
      kh.cccd AS "cccd",
      kh.sdt AS "soDienThoai",
      COALESCE(
        (
          SELECT STRING_AGG(t.item, ', ' ORDER BY t.item)
          FROM (
            SELECT DISTINCT CONCAT(dcg.ma_phong, ' - ', dcg.ma_giuong) AS item
            FROM dat_coc_giuong dcg
            JOIN phong p ON p.ma_phong = dcg.ma_phong
            WHERE dcg.ma_pdc = h.ma_pdc
              AND p.chi_nhanh = ${maCn}
          ) t
        ),
        ''
      ) AS "phongGiuong",
      COALESCE(to_char(lh.tg_hen, 'YYYY-MM-DD'), 'Giải quyết trong ngày') AS "ngayTraPhong"
    FROM ho_so_tra_phong h
    JOIN phieu_dat_coc pdc ON pdc.ma_pdc = h.ma_pdc
    JOIN khach_hang kh ON kh.ma_kh = COALESCE(h.ma_khach_thue, pdc.khach_dat)
    LEFT JOIN LATERAL (
      SELECT tg_hen
      FROM lich_hen_tra_phong
      WHERE ma_tp = h.ma_tp
      ORDER BY tg_hen DESC, ma_lich DESC
      LIMIT 1
    ) lh ON TRUE
    WHERE h.ngay_huy IS NULL
      AND EXISTS (
        SELECT 1
        FROM dat_coc_giuong dcg_branch
        JOIN phong p_branch ON p_branch.ma_phong = dcg_branch.ma_phong
        WHERE dcg_branch.ma_pdc = h.ma_pdc
          AND p_branch.chi_nhanh = ${maCn}
        LIMIT 1
      )
    ORDER BY h.ngay_tp DESC, h.ma_tp DESC
  `

  return rows.map((row) => ({
    id: row.maHoSo,
    maPdc: row.maPdc,
    maHopDong: row.maHopDong,
    tenantName: row.khachThue,
    idCardOrPhone: row.cccd || row.soDienThoai || '',
    roomBed: row.phongGiuong || '',
    returnDate: row.ngayTraPhong || '',
  }))
}

export async function getChiTietHoSoTraPhong({ maTP, maCn }) {
  const rows = await prisma.$queryRaw`
    SELECT
      h.ma_tp AS "maHoSo",
      h.ma_pdc AS "maPdc",
      h.ma_hdt AS "maHopDong",
      h.ngay_tp AS "ngayLap",
      kh.ten_kh AS "hoVaTen",
      kh.cccd AS "cccd",
      kh.sdt AS "soDienThoai",
      kh.email AS "email",
      to_char(hdt.tg_vao, 'YYYY-MM-DD') AS "ngayVao",
      to_char(lh.tg_hen, 'YYYY-MM-DD') AS "ngayTraPhongDuKien",
      to_char(lh.tg_hen, 'HH24:MI - DD/MM/YYYY') AS "lichHenTraPhong",
      CASE
        WHEN h.ma_hdt IS NULL THEN pdc.trang_thai
        ELSE COALESCE(
          (
            SELECT g.trang_thai
            FROM dat_coc_giuong dcg_status
            JOIN giuong g
              ON g.ma_phong = dcg_status.ma_phong
              AND g.ma_giuong = dcg_status.ma_giuong
            JOIN phong p_status ON p_status.ma_phong = dcg_status.ma_phong
            WHERE dcg_status.ma_pdc = h.ma_pdc
              AND p_status.chi_nhanh = ${maCn}
            ORDER BY dcg_status.ma_phong ASC, dcg_status.ma_giuong ASC
            LIMIT 1
          ),
          ''
        )
      END AS "trangThaiHienTai",
      COALESCE(
        (
          SELECT STRING_AGG(t.item, ', ' ORDER BY t.item)
          FROM (
            SELECT DISTINCT CONCAT(dcg.ma_phong, ' - ', dcg.ma_giuong) AS item
            FROM dat_coc_giuong dcg
            JOIN phong p ON p.ma_phong = dcg.ma_phong
            WHERE dcg.ma_pdc = h.ma_pdc
              AND p.chi_nhanh = ${maCn}
          ) t
        ),
        ''
      ) AS "phongGiuong"
    FROM ho_so_tra_phong h
    JOIN phieu_dat_coc pdc ON pdc.ma_pdc = h.ma_pdc
    JOIN khach_hang kh ON kh.ma_kh = COALESCE(h.ma_khach_thue, pdc.khach_dat)
    LEFT JOIN hop_dong_thue hdt ON hdt.ma_hdt = h.ma_hdt
    LEFT JOIN LATERAL (
      SELECT tg_hen
      FROM lich_hen_tra_phong
      WHERE ma_tp = h.ma_tp
      ORDER BY tg_hen DESC, ma_lich DESC
      LIMIT 1
    ) lh ON TRUE
    WHERE h.ma_tp = ${maTP}
      AND h.ngay_huy IS NULL
      AND EXISTS (
        SELECT 1
        FROM dat_coc_giuong dcg_branch
        JOIN phong p_branch ON p_branch.ma_phong = dcg_branch.ma_phong
        WHERE dcg_branch.ma_pdc = h.ma_pdc
          AND p_branch.chi_nhanh = ${maCn}
        LIMIT 1
      )
    LIMIT 1
  `

  if (rows.length === 0) {
    const error = new Error('Không tìm thấy hồ sơ trả phòng.')
    error.status = 404
    throw error
  }

  return rows[0]
}

export async function cancelHoSoTraPhong({ maTP, maCn }) {
  const updated = await prisma.$executeRaw`
    UPDATE ho_so_tra_phong h
    SET ngay_huy = NOW()
    WHERE h.ma_tp = ${maTP}
      AND h.ngay_huy IS NULL
      AND EXISTS (
        SELECT 1
        FROM dat_coc_giuong dcg_branch
        JOIN phong p_branch ON p_branch.ma_phong = dcg_branch.ma_phong
        WHERE dcg_branch.ma_pdc = h.ma_pdc
          AND p_branch.chi_nhanh = ${maCn}
        LIMIT 1
      )
  `

  if (!updated) {
    const error = new Error('Không tìm thấy hồ sơ trả phòng hoặc hồ sơ đã bị hủy.')
    error.status = 404
    throw error
  }

  return true
}
