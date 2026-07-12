import { Prisma } from '@prisma/client'
import prisma from '../config/prisma.js'

function createHttpError(message, status = 400) {
  const error = new Error(message)
  error.status = status
  return error
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
  const branches = await prisma.chi_nhanh.findMany({
    select: {
      ma_cn: true,
      ten_cn: true,
    },
    orderBy: {
      ma_cn: 'asc',
    },
  })

  const defaultBranchCode = branches.some((branch) => branch.ma_cn === maCn)
    ? maCn
    : branches[0]?.ma_cn || ''

  return {
    branches,
    defaultBranchCode,
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
