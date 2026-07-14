import { Prisma } from '@prisma/client'
import prisma from '../config/prisma.js'

function createHttpError(message, status = 400) {
  const error = new Error(message)
  error.status = status
  return error
}

function isFutureDate(value) {
  const parsed = new Date(`${value}T00:00:00`)
  if (Number.isNaN(parsed.getTime())) {
    return false
  }

  const today = new Date()
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  return parsed > todayStart
}

function mapProfileRow(row) {
  if (!row) {
    return null
  }

  return {
    ma_dk: row.ma_dk,
    ngay_lap: row.ngay_lap,
    hinh_thuc_thue: row.hinh_thuc_thue,
    so_nguoi: row.so_nguoi,
    thoi_gian_vao: row.thoi_gian_vao,
    thoi_han_thue: row.thoi_han_thue,
    tieu_chi: row.tieu_chi,
    trang_thai: row.trang_thai,
    chi_nhanh: row.chi_nhanh,
    khach_hang: row.khach_hang,
    nv_sale: row.nv_sale,
    chi_nhanh_ho_so_dang_ky_chi_nhanhTochi_nhanh: {
      ma_cn: row.branch_code,
      ten_cn: row.branch_name,
    },
    khach_hang_ho_so_dang_ky_khach_hangTokhach_hang: {
      ma_kh: row.customer_id,
      ten_kh: row.customer_name,
      cccd: row.customer_cccd,
      sdt: row.customer_sdt,
      email: row.customer_email,
      gioi_tinh: row.customer_gender,
      cong_viec: row.customer_job,
      quoc_tich: row.customer_nationality,
    },
    lich_hen_xem_phong: [],
  }
}

async function getHoSoDangKyById(db, maDk) {
  const rows = await db.$queryRaw`
    SELECT
      h."ma_dk",
      h."ngay_lap",
      h."hinh_thuc_thue",
      h."so_nguoi",
      h."thoi_gian_vao",
      h."thoi_han_thue",
      h."tieu_chi",
      h."trang_thai",
      h."chi_nhanh",
      h."khach_hang",
      h."nv_sale",
      cn."ma_cn" AS "branch_code",
      cn."ten_cn" AS "branch_name",
      kh."ma_kh" AS "customer_id",
      kh."ten_kh" AS "customer_name",
      kh."cccd" AS "customer_cccd",
      kh."sdt" AS "customer_sdt",
      kh."email" AS "customer_email",
      kh."gioi_tinh" AS "customer_gender",
      kh."cong_viec" AS "customer_job",
      kh."quoc_tich" AS "customer_nationality"
    FROM "ho_so_dang_ky" h
    INNER JOIN "chi_nhanh" cn ON cn."ma_cn" = h."chi_nhanh"
    INNER JOIN "khach_hang" kh ON kh."ma_kh" = h."khach_hang"
    WHERE h."ma_dk" = ${maDk}
    LIMIT 1
  `

  return mapProfileRow(rows[0])
}

function buildListWhereSql({ keyword = '', normalizedStatus = '' } = {}) {
  const conditions = []

  if (normalizedStatus && normalizedStatus !== 'Tất cả trạng thái') {
    conditions.push(Prisma.sql`h."trang_thai" = ${normalizedStatus}`)
  }

  if (keyword) {
    const likeKeyword = `%${keyword}%`
    conditions.push(Prisma.sql`(
      h."ma_dk" ILIKE ${likeKeyword}
      OR h."hinh_thuc_thue" ILIKE ${likeKeyword}
      OR kh."ten_kh" ILIKE ${likeKeyword}
      OR kh."sdt" ILIKE ${likeKeyword}
      OR kh."cccd" ILIKE ${likeKeyword}
    )`)
  }

  if (!conditions.length) {
    return Prisma.empty
  }

  return Prisma.sql`WHERE ${Prisma.join(conditions, Prisma.sql` AND `)}`
}

export async function getHoSoDangKyFormSnapshot({ maCn = '' } = {}) {
  const [branches, criteriaRows, capacityRows] = await Promise.all([
    prisma.chi_nhanh.findMany({
      select: {
        ma_cn: true,
        ten_cn: true,
      },
      orderBy: {
        ma_cn: 'asc',
      },
    }),
    prisma.$queryRaw`
      SELECT
        p.chi_nhanh AS "ma_cn",
        BTRIM(tc.ten_tc) AS "ten_tc"
      FROM tieu_chi tc
      JOIN phong p ON p.ma_phong = tc.ma_phong
      WHERE tc.ten_tc IS NOT NULL
        AND BTRIM(tc.ten_tc) <> ''
      GROUP BY p.chi_nhanh, BTRIM(tc.ten_tc)
      ORDER BY p.chi_nhanh ASC, BTRIM(tc.ten_tc) ASC
    `,
    prisma.$queryRaw`
      SELECT
        chi_nhanh AS "ma_cn",
        suc_chua_toi_da AS "suc_chua"
      FROM phong
      WHERE suc_chua_toi_da IS NOT NULL
        AND suc_chua_toi_da > 0
      GROUP BY chi_nhanh, suc_chua_toi_da
      ORDER BY chi_nhanh ASC, suc_chua_toi_da ASC
    `,
  ])

  const defaultBranchCode = branches.some((branch) => branch.ma_cn === maCn)
    ? maCn
    : branches[0]?.ma_cn || ''

  const criteriaByBranch = criteriaRows.reduce((accumulator, row) => {
    const branchCode = row.ma_cn
    if (!accumulator[branchCode]) {
      accumulator[branchCode] = []
    }

    accumulator[branchCode].push({
      value: row.ten_tc,
      label: row.ten_tc,
    })

    return accumulator
  }, {})

  const capacityByBranch = capacityRows.reduce((accumulator, row) => {
    const branchCode = row.ma_cn
    if (!accumulator[branchCode]) {
      accumulator[branchCode] = []
    }

    accumulator[branchCode].push(Number(row.suc_chua || 0))
    return accumulator
  }, {})

  return {
    branches,
    defaultBranchCode,
    criteriaByBranch,
    capacityByBranch,
  }
}

async function validateNguyenPhongCapacity(db, { chiNhanh, hinhThucThue, soNguoi }) {
  if (hinhThucThue !== 'Nguyên phòng') {
    return
  }

  const capacityRows = await db.$queryRaw`
    SELECT DISTINCT suc_chua_toi_da AS "suc_chua"
    FROM phong
    WHERE chi_nhanh = ${chiNhanh}
      AND suc_chua_toi_da IS NOT NULL
      AND suc_chua_toi_da > 0
    ORDER BY suc_chua_toi_da ASC
  `

  const capacities = capacityRows.map((row) => Number(row.suc_chua || 0)).filter(Boolean)

  if (capacities.length === 0) {
    throw createHttpError('Chi nhánh này chưa có phòng để đăng ký theo hình thức nguyên phòng.', 400)
  }

  if (!capacities.includes(Number(soNguoi))) {
    throw createHttpError(
      `Thuê nguyên phòng phải chọn số lượng người đúng với sức chứa phòng hiện có (${capacities.join(', ')} người).`,
      400,
    )
  }
}

export async function createHoSoDangKyRecord(input) {
  const branch = await prisma.chi_nhanh.findUnique({
    where: { ma_cn: input.profile.chi_nhanh },
    select: { ma_cn: true },
  })

  if (!branch) {
    throw createHttpError('Chi nhánh được chọn không tồn tại.', 404)
  }

  return prisma.$transaction(async (tx) => {
    await validateNguyenPhongCapacity(tx, {
      chiNhanh: input.profile.chi_nhanh,
      hinhThucThue: input.profile.hinh_thuc_thue,
      soNguoi: input.profile.so_nguoi,
    })

    const existingByCccd = await tx.khach_hang.findUnique({
      where: { cccd: input.customer.cccd },
    })

    const existingByEmail = await tx.khach_hang.findUnique({
      where: { email: input.customer.email },
    })

    if (
      existingByCccd &&
      existingByEmail &&
      existingByCccd.ma_kh !== existingByEmail.ma_kh
    ) {
      throw createHttpError('CCCD và email đang thuộc về hai khách hàng khác nhau.', 409)
    }

    const matchedCustomer = existingByCccd || existingByEmail

    let customerRecord

    if (matchedCustomer) {
      customerRecord = await tx.khach_hang.update({
        where: { ma_kh: matchedCustomer.ma_kh },
        data: {
          ten_kh: input.customer.ten_kh,
          sdt: input.customer.sdt,
          email: input.customer.email,
          gioi_tinh: input.customer.gioi_tinh,
          cccd: input.customer.cccd,
          cong_viec: input.customer.cong_viec,
          quoc_tich: input.customer.quoc_tich,
        },
      })
    } else {
      customerRecord = await tx.khach_hang.create({
        data: {
          ten_kh: input.customer.ten_kh,
          sdt: input.customer.sdt,
          email: input.customer.email,
          gioi_tinh: input.customer.gioi_tinh,
          cccd: input.customer.cccd,
          cong_viec: input.customer.cong_viec,
          quoc_tich: input.customer.quoc_tich,
        },
      })
    }

    const createdProfiles = await tx.$queryRaw`
      INSERT INTO "ho_so_dang_ky" (
        "hinh_thuc_thue",
        "so_nguoi",
        "thoi_gian_vao",
        "thoi_han_thue",
        "tieu_chi",
        "trang_thai",
        "chi_nhanh",
        "khach_hang",
        "nv_sale"
      )
      VALUES (
        ${input.profile.hinh_thuc_thue},
        ${input.profile.so_nguoi},
        ${input.profile.thoi_gian_vao},
        ${input.profile.thoi_han_thue},
        ${input.profile.tieu_chi},
        ${input.profile.trang_thai},
        ${input.profile.chi_nhanh},
        ${customerRecord.ma_kh},
        ${input.profile.nv_sale}
      )
      RETURNING "ma_dk"
    `

    return getHoSoDangKyById(tx, createdProfiles[0]?.ma_dk)
  })
}

export async function getHoSoDangKyListSnapshot({
  search = '',
  status = '',
  page = 1,
  pageSize = 4,
} = {}) {
  const keyword = String(search || '').trim()
  const normalizedStatus = String(status || '').trim()

  const safePage = Math.max(1, Number(page) || 1)
  const safePageSize = Math.max(1, Number(pageSize) || 4)
  const offset = (safePage - 1) * safePageSize
  const whereSql = buildListWhereSql({ keyword, normalizedStatus })

  const [countRows, items] = await prisma.$transaction([
    prisma.$queryRaw`
      SELECT COUNT(*)::int AS "total_items"
      FROM "ho_so_dang_ky" h
      INNER JOIN "khach_hang" kh ON kh."ma_kh" = h."khach_hang"
      ${whereSql}
    `,
    prisma.$queryRaw`
      SELECT
        h."ma_dk",
        h."ngay_lap",
        h."hinh_thuc_thue",
        h."so_nguoi",
        h."thoi_gian_vao",
        h."thoi_han_thue",
        h."tieu_chi",
        h."trang_thai",
        h."chi_nhanh",
        h."khach_hang",
        h."nv_sale",
        cn."ma_cn" AS "branch_code",
        cn."ten_cn" AS "branch_name",
        kh."ma_kh" AS "customer_id",
        kh."ten_kh" AS "customer_name",
        kh."cccd" AS "customer_cccd",
        kh."sdt" AS "customer_sdt",
        kh."email" AS "customer_email",
        kh."gioi_tinh" AS "customer_gender",
        kh."cong_viec" AS "customer_job",
        kh."quoc_tich" AS "customer_nationality"
      FROM "ho_so_dang_ky" h
      INNER JOIN "chi_nhanh" cn ON cn."ma_cn" = h."chi_nhanh"
      INNER JOIN "khach_hang" kh ON kh."ma_kh" = h."khach_hang"
      ${whereSql}
      ORDER BY h."ngay_lap" DESC
      LIMIT ${safePageSize}
      OFFSET ${offset}
    `,
  ])

  const totalItems = Number(countRows[0]?.total_items || 0)

  return {
    items: items.map(mapProfileRow),
    page: safePage,
    pageSize: safePageSize,
    totalItems,
    totalPages: Math.max(1, Math.ceil(totalItems / safePageSize)),
  }
}

export async function getHoSoDangKyDetailSnapshot(maDk) {
  return getHoSoDangKyById(prisma, maDk)
}

export const updateHoSoDangKyRecord = async (maDk, data) => {
  
  return await prisma.$transaction(async (tx) => {
    const normalizedSoNguoi = parseInt(data.soLuongNguoi, 10)
    const normalizedThoiHanThue = parseInt(data.thoiHanThue, 10)

    if (!isFutureDate(data.thoiGianVao)) {
      throw createHttpError('Thời gian dự kiến vào ở phải là ngày trong tương lai.', 400)
    }

    await validateNguyenPhongCapacity(tx, {
      chiNhanh: data.chiNhanh,
      hinhThucThue: data.hinhThucThue,
      soNguoi: normalizedSoNguoi,
    })

    await tx.khach_hang.update({
      where: { ma_kh: data.maKhachHang },
      data: {
        ten_kh: data.hoTen,
        sdt: data.soDienThoai,
        email: data.email,
        gioi_tinh: data.gioiTinh,
        cccd: data.cccd,
        cong_viec: data.ngheNghiep,
        quoc_tich: data.quocTich,
      },
    })

    
    const updatedHoSo = await tx.ho_so_dang_ky.update({
      where: { ma_dk: maDk },
      data: {
        hinh_thuc_thue: data.hinhThucThue,
        so_nguoi: normalizedSoNguoi,
        thoi_gian_vao: new Date(data.thoiGianVao),
        thoi_han_thue: normalizedThoiHanThue,
        tieu_chi: data.tieuChi,
        chi_nhanh: data.chiNhanh,
      },
      include: {
        khach_hang_ho_so_dang_ky_khach_hangTokhach_hang: true,
      }
    })

    return updatedHoSo
  })
}


export const cancelHoSoDangKyRecord = async (maDk) => {
  return await prisma.ho_so_dang_ky.update({
    where: { ma_dk: maDk },
    data: { trang_thai: 'Hủy yêu cầu' }
  })
}
