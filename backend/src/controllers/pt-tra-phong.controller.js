import { Prisma } from '@prisma/client'
import prisma from '../config/prisma.js'
import { guiEmailPTTraPhong } from '../utils/guiMailPTTP.js'
import { inPTTraPhong } from '../utils/inPTTraPhong.js'
const RETURNING_BED_STATUS = 'Đang trả phòng'

const toNumber = value => Number(value || 0)

const getCurrentEmployee = async req => {
  const maNv =
    req.auth?.ma_nv ||
    req.authSession?.ma_nv ||
    null

  if (!maNv) return null

  const rows = await prisma.$queryRaw`
    SELECT
      nv.ma_nv,
      nv.ten_nv,
      nv.ma_cn,
      cn.ten_cn
    FROM nhanvien nv
    JOIN chi_nhanh cn ON cn.ma_cn = nv.ma_cn
    WHERE nv.ma_nv = ${maNv}
    LIMIT 1
  `

  return rows[0] || null
}

const getCustomerColumnSql = async () => {
  const rows = await prisma.$queryRaw`
    SELECT column_name
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'khach_hang'
  `

  const columns = new Set(rows.map(row => row.column_name))

  const nameColumn =
    ['ten_kh', 'ho_ten', 'ten_khach_hang', 'hoten'].find(column =>
      columns.has(column),
    ) || null

  const phoneColumn =
    ['sdt', 'so_dien_thoai', 'dien_thoai', 'phone'].find(column =>
      columns.has(column),
    ) || null

  return {
    nameSql: nameColumn ? Prisma.raw(`kh.${nameColumn}`) : Prisma.raw('kh.ma_kh'),
    phoneSql: phoneColumn ? Prisma.raw(`kh.${phoneColumn}`) : Prisma.raw('NULL'),
  }
}

const buildSameBranchExistsSql = maCn => Prisma.sql`
  EXISTS (
    SELECT 1
    FROM dat_coc_giuong dcg_branch
    JOIN phong p_branch ON p_branch.ma_phong = dcg_branch.ma_phong
    WHERE dcg_branch.ma_pdc = h.ma_pdc
      AND p_branch.chi_nhanh = ${maCn}
  )
`

const mapPendingRow = row => ({
  ma_tp: row.ma_tp,
  ma_khach_thue: row.ma_khach_thue,
  ten_khach_hang: row.ten_khach_hang || row.ma_khach_thue,
  cccd: row.cccd || '',
  sdt: row.sdt || '',
  ngay_tp: row.ngay_tp,
  ma_pdc: row.ma_pdc,
  ma_hdt: row.ma_hdt || '',
  ma_phong: row.ma_phong || '',
})

const mapHistoryRow = row => ({
  ma_pttp: row.ma_pttp,
  ma_tp: row.ma_tp,
  ma_khach_thue: row.ma_khach_thue,
  ten_khach_hang: row.ten_khach_hang || row.ma_khach_thue,
  ngay: row.ngay,
  tong_tien: toNumber(row.tong_tien),
  tien_hoan_coc: toNumber(row.tien_hoan_coc),
  tien_khau_tru: toNumber(row.tien_khau_tru),
  trang_thai: row.trang_thai || '',
  ma_phong: row.ma_phong || '',
})

const getRoomRowsByReturn = async (client, maTp, maCn) => {
  return client.$queryRaw`
    SELECT
      dcg.ma_phong,
      1::int AS so_giuong_hstp,

      COUNT(*) FILTER (
        WHERE g.trang_thai = ${RETURNING_BED_STATUS}
      )::int AS so_giuong_hstp_dang_tra_phong,

      (
        SELECT COUNT(*)::int
        FROM giuong gx
        WHERE gx.ma_phong = dcg.ma_phong
          AND gx.trang_thai = 'Đang sử dụng'
      ) AS so_giuong_phong_dang_su_dung

    FROM ho_so_tra_phong h
    JOIN dat_coc_giuong dcg ON dcg.ma_pdc = h.ma_pdc
    JOIN phong p ON p.ma_phong = dcg.ma_phong
    JOIN giuong g
      ON g.ma_phong = dcg.ma_phong
     AND g.ma_giuong = dcg.ma_giuong

    WHERE h.ma_tp = ${maTp}
      AND h.ngay_huy IS NULL
      AND p.chi_nhanh = ${maCn}
      AND h.ma_hdt IS NOT NULL
      AND dcg.trang_thai = 'Đã chốt'
    GROUP BY dcg.ma_phong
    ORDER BY dcg.ma_phong ASC
  `
}

const isLastReturnOfAnyRoom = (roomRows, options = {}) => {
  const { alreadyUpdatedCurrentBed = false } = options

  return roomRows.some(row => {
    const usingInRoom = toNumber(row.so_giuong_phong_dang_su_dung)

    // Trường hợp preview/create chạy lại sau khi preview đã cập nhật giường:
    // giường của hồ sơ hiện tại đã chuyển từ Đang sử dụng sang Đang trả phòng.
    // Nếu phòng còn 0 giường Đang sử dụng => hồ sơ này là người cuối.
    if (alreadyUpdatedCurrentBed) {
      return usingInRoom === 0
    }

    // Trường hợp check trước khi cập nhật giường:
    // nếu phòng còn đúng 1 giường Đang sử dụng,
    // người đang trả phòng chính là người cuối.
    return usingInRoom === 1
  })
}

const getReturnRule = header => {
  if (!header.ma_hdt || !header.tg_vao) {
    return {
      ma_qdhc: 1,
      ty_le: 0.8,
    }
  }

  const ngayTp = new Date(header.ngay_tp)
  const tgVao = new Date(header.tg_vao)
  const thoiHanThue = Number(header.thoi_han_thue || 0)

  if (!Number.isNaN(tgVao.getTime()) && thoiHanThue > 0) {
    const endDate = new Date(tgVao)
    endDate.setMonth(endDate.getMonth() + thoiHanThue)

    if (!Number.isNaN(ngayTp.getTime()) && ngayTp >= endDate) {
      return {
        ma_qdhc: 4,
        ty_le: 1,
      }
    }
  }

  const sixMonthDate = new Date(tgVao)
  sixMonthDate.setMonth(sixMonthDate.getMonth() + 6)

  if (!Number.isNaN(ngayTp.getTime()) && ngayTp < sixMonthDate) {
    return {
      ma_qdhc: 2,
      ty_le: 0.5,
    }
  }

  return {
    ma_qdhc: 3,
    ty_le: 0.7,
  }
}

const getRuleInfo = async (client, maQdhc) => {
  const rows = await client.$queryRaw`
    SELECT
      ma_qdhc,
      ten_qd,
      noi_dung
    FROM quy_dinh_hoan_coc
    WHERE ma_qdhc = ${maQdhc}
    LIMIT 1
  `

  return rows[0] || {
    ma_qdhc: maQdhc,
    ten_qd: '',
    noi_dung: '',
  }
}

const getDamageItems = async (client, maTp) => {
  const rows = await client.$queryRaw`
    SELECT
      vdh.ma_vd,
      vd.ten_vd,
      vdh.sl_hu_hai AS so_luong,
      vd.gia_boi_thuong AS don_gia,
      (vdh.sl_hu_hai * vd.gia_boi_thuong) AS thanh_tien
    FROM vat_dung_hu_hai vdh
    JOIN vat_dung vd ON vd.ma_vd = vdh.ma_vd
    WHERE vdh.ma_tp = ${maTp}
    ORDER BY vd.ten_vd ASC, vd.ma_vd ASC
  `

  return rows.map(row => ({
    loai: 'VAT_DUNG_HU_HAI',
    ma_vd: row.ma_vd,
    ten: row.ten_vd,
    so_luong: toNumber(row.so_luong),
    don_gia: toNumber(row.don_gia),
    thanh_tien: toNumber(row.thanh_tien),
  }))
}

const getUnpaidServiceItemsByRooms = async (client, roomCodes) => {
  if (!roomCodes.length) return []

  const rows = await client.$queryRaw`
    SELECT
      ct.ma_ct,
      ct.ma_dv,
      dv.ten_dv,
      ct.ma_phong,
      ct.so_luong,
      dv.gia_dv AS don_gia,
      ct.thanh_tien,
      ct.ngay
    FROM chi_tiet_dv ct
    JOIN dich_vu dv ON dv.ma_dv = ct.ma_dv
    WHERE ct.ma_phong IN (${Prisma.join(roomCodes)})
      AND ct.trang_thai = 'Chưa thanh toán'
      AND ct.ma_pttp IS NULL
    ORDER BY ct.ngay ASC, ct.ma_ct ASC
  `

  return rows.map(row => ({
    loai: 'DICH_VU',

    // Cái này mới là ID cần nhớ để gán ma_pttp
    ma_ct: row.ma_ct,

    // Cái này chỉ là mã loại dịch vụ
    ma_dv: row.ma_dv,

    ten: row.ten_dv,
    ma_phong: row.ma_phong,
    so_luong: toNumber(row.so_luong),
    don_gia: toNumber(row.don_gia),
    thanh_tien: toNumber(row.thanh_tien),
    ngay: row.ngay,
  }))
}

const getServiceItemsByReceipt = async (client, maPttp) => {
  const rows = await client.$queryRaw`
    SELECT
      ct.ma_ct,
      ct.ma_dv,
      dv.ten_dv,
      ct.ma_phong,
      ct.so_luong,
      dv.gia_dv AS don_gia,
      ct.thanh_tien,
      ct.ngay
    FROM chi_tiet_dv ct
    JOIN dich_vu dv ON dv.ma_dv = ct.ma_dv
    WHERE ct.ma_pttp = ${maPttp}
    ORDER BY ct.ngay ASC, ct.ma_ct ASC
  `

  return rows.map(row => ({
    loai: 'DICH_VU',
    ma_ct: row.ma_ct,
    ma_dv: row.ma_dv,
    ten: row.ten_dv,
    ma_phong: row.ma_phong,
    so_luong: toNumber(row.so_luong),
    don_gia: toNumber(row.don_gia),
    thanh_tien: toNumber(row.thanh_tien),
    ngay: row.ngay,
  }))
}

const updateBedsToReturning = async (client, maTp, maCn, options = {}) => {
  const { onlyRefundBeds = false } = options

  // Case không có HĐT:
  // hoàn cọc trước hợp đồng, cập nhật tất cả giường có trạng thái Hoàn cọc.
  if (onlyRefundBeds) {
    await client.$executeRaw`
      UPDATE giuong g
      SET trang_thai = ${RETURNING_BED_STATUS}
      FROM ho_so_tra_phong h
      JOIN dat_coc_giuong dcg ON dcg.ma_pdc = h.ma_pdc
      JOIN phong p ON p.ma_phong = dcg.ma_phong
      WHERE h.ma_tp = ${maTp}
        AND h.ngay_huy IS NULL
        AND h.ma_hdt IS NULL
        AND p.chi_nhanh = ${maCn}
        AND dcg.trang_thai = 'Hoàn cọc'
        AND g.ma_phong = dcg.ma_phong
        AND g.ma_giuong = dcg.ma_giuong
        AND g.trang_thai IN ('Đang sử dụng', 'Đã đặt cọc')
    `

    return
  }

  // Case có HĐT:
  // 1 HSTP = 1 khách thuê = chỉ cập nhật 1 giường.
  await client.$executeRaw`
    WITH bed_to_update AS (
      SELECT
        g.ma_phong,
        g.ma_giuong
      FROM ho_so_tra_phong h
      JOIN dat_coc_giuong dcg ON dcg.ma_pdc = h.ma_pdc
      JOIN phong p ON p.ma_phong = dcg.ma_phong
      JOIN giuong g
        ON g.ma_phong = dcg.ma_phong
       AND g.ma_giuong = dcg.ma_giuong
      WHERE h.ma_tp = ${maTp}
        AND h.ngay_huy IS NULL
        AND h.ma_hdt IS NOT NULL
        AND p.chi_nhanh = ${maCn}
        AND dcg.trang_thai = 'Đã chốt'
        AND g.trang_thai = 'Đang sử dụng'
      ORDER BY g.ma_phong ASC, g.ma_giuong ASC
      LIMIT 1
    )
    UPDATE giuong g
    SET trang_thai = ${RETURNING_BED_STATUS}
    FROM bed_to_update b
    WHERE g.ma_phong = b.ma_phong
      AND g.ma_giuong = b.ma_giuong
  `
}

const revertBedsAfterCancel = async (client, maTp, maCn) => {
  await client.$executeRaw`
    UPDATE giuong g
    SET trang_thai = CASE
      WHEN h.ma_hdt IS NULL THEN 'Đã đặt cọc'
      ELSE 'Đang sử dụng'
    END
    FROM ho_so_tra_phong h
    JOIN dat_coc_giuong dcg ON dcg.ma_pdc = h.ma_pdc
    JOIN phong p ON p.ma_phong = dcg.ma_phong
    WHERE h.ma_tp = ${maTp}
      AND h.ngay_huy IS NULL
      AND p.chi_nhanh = ${maCn}
      AND g.ma_phong = dcg.ma_phong
      AND g.ma_giuong = dcg.ma_giuong
      AND g.trang_thai = ${RETURNING_BED_STATUS}
      AND NOT EXISTS (
        SELECT 1
        FROM pt_tra_phong pttp
        WHERE pttp.ma_tp = h.ma_tp
      )
  `
}

export const cancelPtTraPhongPreview = async (req, res, next) => {
  try {
    const maTp = req.params.ma_tp?.trim().toUpperCase()
// Bước 1: Xác định nhân viên đang đăng nhập và chi nhánh làm việc.
    const currentEmployee = await getCurrentEmployee(req)

    if (!maTp) {
      return res.status(400).json({
        message: 'Mã hồ sơ trả phòng không hợp lệ.',
      })
    }

    if (!currentEmployee?.ma_cn) {
      return res.status(401).json({
        message: 'Không xác định được chi nhánh của nhân viên đang đăng nhập.',
      })
    }

    const existedRows = await prisma.$queryRaw`
      SELECT ma_pttp
      FROM pt_tra_phong
      WHERE ma_tp = ${maTp}
      LIMIT 1
    `

    if (existedRows.length > 0) {
      return res.json({
        success: true,
        message: 'Phiếu thu đã được tạo nên không hoàn trạng thái giường.',
      })
    }

    await revertBedsAfterCancel(prisma, maTp, currentEmployee.ma_cn)

    res.json({
      success: true,
      message: 'Đã hủy thao tác lập phiếu và hoàn trạng thái giường.',
    })
  } catch (error) {
    next(error)
  }
}

const buildPreviewData = async (client, maTp, currentEmployee, options = {}) => {
  const { updateBeds = false } = options
  const { nameSql, phoneSql } = await getCustomerColumnSql()
  const maCn = currentEmployee.ma_cn

  const headerRows = await client.$queryRaw`
    SELECT
      h.ma_tp,
      h.ngay_tp,
      h.ngay_huy,
      h.ma_pdc,
      h.ma_hdt,
      CASE
        WHEN h.ma_hdt IS NULL THEN pdc.khach_dat
        ELSE h.ma_khach_thue
      END AS ma_khach_thue,
      kh.email,
      kh.cccd,
      ${phoneSql} AS sdt,
      ${nameSql} AS ten_khach_hang,
      hdt.tg_vao,
      hdt.thoi_han_thue,

      ptdc.tong_tien AS tong_tien_coc_pdc,

      COALESCE(
        (
          SELECT COUNT(*)::int
          FROM dat_coc_giuong dcg_count
          JOIN phong p_count ON p_count.ma_phong = dcg_count.ma_phong
          WHERE dcg_count.ma_pdc = h.ma_pdc
            AND p_count.chi_nhanh = ${maCn}
        ),
        0
      ) AS so_giuong_dat_coc,

      COALESCE(
        (
          SELECT COUNT(*)::int
          FROM dat_coc_giuong dcg_refund
          JOIN phong p_refund ON p_refund.ma_phong = dcg_refund.ma_phong
          WHERE dcg_refund.ma_pdc = h.ma_pdc
            AND p_refund.chi_nhanh = ${maCn}
            AND dcg_refund.trang_thai = 'Hoàn cọc'
        ),
        0
      ) AS so_giuong_hoan_coc,

      COALESCE(
        (
          SELECT STRING_AGG(DISTINCT dcg.ma_phong, ', ' ORDER BY dcg.ma_phong)
          FROM dat_coc_giuong dcg
          JOIN phong p ON p.ma_phong = dcg.ma_phong
          WHERE dcg.ma_pdc = h.ma_pdc
            AND p.chi_nhanh = ${maCn}
        ),
        ''
      ) AS ma_phong

    FROM ho_so_tra_phong h
    JOIN phieu_dat_coc pdc ON pdc.ma_pdc = h.ma_pdc
    JOIN khach_hang kh
      ON kh.ma_kh = CASE
        WHEN h.ma_hdt IS NULL THEN pdc.khach_dat
        ELSE h.ma_khach_thue
      END
    LEFT JOIN hop_dong_thue hdt ON hdt.ma_hdt = h.ma_hdt
    LEFT JOIN LATERAL (
      SELECT ptdc_inner.tong_tien
      FROM pt_dat_coc ptdc_inner
      WHERE ptdc_inner.ma_pdc = h.ma_pdc
      ORDER BY ptdc_inner.ngay DESC, ptdc_inner.ma_ptdc DESC
      LIMIT 1
    ) ptdc ON TRUE

    WHERE h.ma_tp = ${maTp}
      AND h.ngay_huy IS NULL
      AND ${buildSameBranchExistsSql(maCn)}
    LIMIT 1
  `

  if (headerRows.length === 0) {
    const error = new Error('Không tìm thấy hồ sơ trả phòng thuộc chi nhánh của bạn.')
    error.statusCode = 404
    throw error
  }

  const existedRows = await client.$queryRaw`
    SELECT ma_pttp
    FROM pt_tra_phong
    WHERE ma_tp = ${maTp}
    LIMIT 1
  `

  if (existedRows.length > 0) {
    const error = new Error('Hồ sơ trả phòng này đã có phiếu thu trả phòng.')
    error.statusCode = 400
    throw error
  }

  const header = headerRows[0]

  const hasContract = Boolean(header.ma_hdt)

  const tongTienCocPdc = toNumber(header.tong_tien_coc_pdc)
  const soGiuongDatCoc = Math.max(1, toNumber(header.so_giuong_dat_coc))
  const soGiuongHoanCoc = toNumber(header.so_giuong_hoan_coc)

  if (!hasContract && soGiuongHoanCoc <= 0) {
    const error = new Error('Hồ sơ không có hợp đồng cần có ít nhất một giường trạng thái Hoàn cọc trong đặt cọc giường.')
    error.statusCode = 400
    throw error
  }

  const roomRows = await getRoomRowsByReturn(client, maTp, maCn)
  const roomCodes = roomRows.map(row => row.ma_phong)

  const lastReturn = hasContract
  ? isLastReturnOfAnyRoom(roomRows, {
      alreadyUpdatedCurrentBed: options.alreadyUpdatedCurrentBed === true,
    })
  : false

  let serviceItems = []
  let damageItems = []

  if (hasContract && lastReturn) {
    serviceItems = await getUnpaidServiceItemsByRooms(client, roomCodes)

    if (serviceItems.length === 0) {
      const error = new Error('Đây là hồ sơ trả phòng cuối cùng của phòng này. Vui lòng ghi nhận dịch vụ tháng cuối trước khi lập phiếu thu.')
      error.statusCode = 409
      error.code = 'LAST_RETURN_NEEDS_SERVICE'
      error.data = {
        ma_tp: header.ma_tp,
        ma_phong: header.ma_phong,
      }
      throw error
    }
  }

  if (hasContract) {
    damageItems = await getDamageItems(client, maTp)
  }

  if (updateBeds) {
    await updateBedsToReturning(client, maTp, maCn, {
      onlyRefundBeds: !hasContract,
    })
  }

  const refundRule = getReturnRule(header)
  const ruleInfo = await getRuleInfo(client, refundRule.ma_qdhc)

  const soGiuongTinhHoan = hasContract ? 1 : soGiuongHoanCoc

  const tienCocMoiGiuong = Math.round(tongTienCocPdc / soGiuongDatCoc)
  const tienCocGoc = tienCocMoiGiuong * soGiuongTinhHoan
  const tienHoanCoc = Math.round(tienCocGoc * refundRule.ty_le)

  const tongHuHai = damageItems.reduce((sum, item) => sum + item.thanh_tien, 0)
  const tongDichVu = serviceItems.reduce((sum, item) => sum + item.thanh_tien, 0)
  const tienKhauTru = tongHuHai + tongDichVu
  const tongTien = tienHoanCoc - tienKhauTru

  return {
    ma_tp: header.ma_tp,
    ngay_tp: header.ngay_tp,
    ma_pdc: header.ma_pdc,
    ma_hdt: header.ma_hdt,
    email: header.email || '',
    tham_chieu: header.ma_hdt || header.ma_pdc,
    loai_tham_chieu: header.ma_hdt ? 'HDT' : 'PDC',
    ma_phong: header.ma_phong,
    ma_khach_thue: header.ma_khach_thue,
    ten_khach_hang: header.ten_khach_hang || header.ma_khach_thue,
    cccd: header.cccd || '',
    sdt: header.sdt || '',

    tong_tien_coc_pdc: tongTienCocPdc,
    so_nguoi_dat_coc: soGiuongDatCoc,
    so_giuong_dat_coc: soGiuongDatCoc,
    so_giuong_hoan_coc: soGiuongHoanCoc,
    so_giuong_tinh_hoan: soGiuongTinhHoan,
    tien_coc_moi_giuong: tienCocMoiGiuong,
    tien_coc_goc: tienCocGoc,

    quy_dinh_hoan_coc: {
      ...ruleInfo,
      ty_le: refundRule.ty_le,
    },
    tien_hoan_coc: tienHoanCoc,
    tien_khau_tru: tienKhauTru,
    tong_tien: tongTien,

    la_ho_so_cuoi: lastReturn,
    vat_dung_hu_hai: damageItems,
    dich_vu: serviceItems,
  }
}

const insertPtTraPhong = async (client, data, currentEmployee, ghiChu) => {
  const columnRows = await client.$queryRaw`
    SELECT column_name
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'pt_tra_phong'
  `

  const hasNvCapNhatColumn = columnRows.some(row => row.column_name === 'nv_cap_nhat')

  // Nếu bảng có cột nv_cap_nhat thì vẫn insert cột này,
  // nhưng để NULL vì lúc mới lập phiếu chưa có ai cập nhật.
  if (hasNvCapNhatColumn) {
    return client.$queryRaw`
      INSERT INTO pt_tra_phong (
        ngay,
        ghi_chu,
        trang_thai,
        tong_tien,
        tien_hoan_coc,
        tien_khau_tru,
        nv_ke_toan,
        ma_tp,
        nv_cap_nhat
      )
      VALUES (
        CURRENT_TIMESTAMP,
        ${ghiChu || null},
        'Chưa thanh toán',
        ${data.tong_tien},
        ${data.tien_hoan_coc},
        ${data.tien_khau_tru},
        ${currentEmployee.ma_nv},
        ${data.ma_tp},
        NULL
      )
      RETURNING ma_pttp
    `
  }

  return client.$queryRaw`
    INSERT INTO pt_tra_phong (
      ngay,
      ghi_chu,
      trang_thai,
      tong_tien,
      tien_hoan_coc,
      tien_khau_tru,
      nv_ke_toan,
      ma_tp
    )
    VALUES (
      CURRENT_TIMESTAMP,
      ${ghiChu || null},
      'Chưa thanh toán',
      ${data.tong_tien},
      ${data.tien_hoan_coc},
      ${data.tien_khau_tru},
      ${currentEmployee.ma_nv},
      ${data.ma_tp}
    )
    RETURNING ma_pttp
  `
}

export const getPtTraPhongPageData = async (req, res, next) => {
  try {
    const currentEmployee = await getCurrentEmployee(req)

    if (!currentEmployee?.ma_cn) {
      return res.status(401).json({
        message: 'Không xác định được chi nhánh của nhân viên đang đăng nhập.',
      })
    }

    const maCn = currentEmployee.ma_cn
    const maNv = currentEmployee.ma_nv
    const { nameSql, phoneSql } = await getCustomerColumnSql()
    const search = String(req.query?.search || '').trim()

    const pendingWhere = [
      Prisma.sql`h.ngay_huy IS NULL`,

  // Chỉ cho xem/lập phiếu với hồ sơ trả phòng từ hôm nay trở về trước.
  // Không load các hồ sơ có ngày trả phòng ở tương lai.
      Prisma.sql`DATE(h.ngay_tp) <= CURRENT_DATE`,

      buildSameBranchExistsSql(maCn),
      Prisma.sql`NOT EXISTS (
        SELECT 1
        FROM pt_tra_phong pttp_check
        WHERE pttp_check.ma_tp = h.ma_tp
      )`,
    ]

    if (search) {
      pendingWhere.push(Prisma.sql`
        (
          UPPER(h.ma_tp) LIKE ${`%${search.toUpperCase()}%`}
          OR UPPER(
          CASE
            WHEN h.ma_hdt IS NULL THEN pdc.khach_dat
            ELSE h.ma_khach_thue
          END
          ) LIKE ${`%${search.toUpperCase()}%`}
          OR kh.cccd LIKE ${`%${search}%`}
          OR ${nameSql} ILIKE ${`%${search}%`}
        )
      `)
    }

    const pendingRows = await prisma.$queryRaw`
      SELECT
        h.ma_tp,
        CASE
          WHEN h.ma_hdt IS NULL THEN pdc.khach_dat
          ELSE h.ma_khach_thue
        END AS ma_khach_thue,
        ${nameSql} AS ten_khach_hang,
        kh.cccd,
        ${phoneSql} AS sdt,
        h.ngay_tp,
        h.ma_pdc,
        h.ma_hdt,
        COALESCE(
          (
            SELECT STRING_AGG(DISTINCT dcg.ma_phong, ', ' ORDER BY dcg.ma_phong)
            FROM dat_coc_giuong dcg
            JOIN phong p ON p.ma_phong = dcg.ma_phong
            WHERE dcg.ma_pdc = h.ma_pdc
              AND p.chi_nhanh = ${maCn}
          ),
          ''
        ) AS ma_phong
      FROM ho_so_tra_phong h
      JOIN phieu_dat_coc pdc ON pdc.ma_pdc = h.ma_pdc
      JOIN khach_hang kh
        ON kh.ma_kh = CASE
          WHEN h.ma_hdt IS NULL THEN pdc.khach_dat
          ELSE h.ma_khach_thue
        END
      WHERE ${Prisma.join(pendingWhere, ' AND ')}
      ORDER BY h.ngay_tp DESC, h.ma_tp DESC
    `

    const historyRows = await prisma.$queryRaw`
      SELECT
        pttp.ma_pttp,
        pttp.ma_tp,
        pttp.ngay,
        pttp.tong_tien,
        pttp.tien_hoan_coc,
        pttp.tien_khau_tru,
        pttp.trang_thai,
        CASE
          WHEN h.ma_hdt IS NULL THEN pdc.khach_dat
          ELSE h.ma_khach_thue
        END AS ma_khach_thue,
        ${nameSql} AS ten_khach_hang,
        COALESCE(
          (
            SELECT STRING_AGG(DISTINCT dcg.ma_phong, ', ' ORDER BY dcg.ma_phong)
            FROM dat_coc_giuong dcg
            JOIN phong p ON p.ma_phong = dcg.ma_phong
            WHERE dcg.ma_pdc = h.ma_pdc
              AND p.chi_nhanh = ${maCn}
          ),
          ''
        ) AS ma_phong
      FROM pt_tra_phong pttp
      JOIN ho_so_tra_phong h ON h.ma_tp = pttp.ma_tp
      JOIN phieu_dat_coc pdc ON pdc.ma_pdc = h.ma_pdc
      JOIN khach_hang kh
        ON kh.ma_kh = CASE
          WHEN h.ma_hdt IS NULL THEN pdc.khach_dat
          ELSE h.ma_khach_thue
        END
      WHERE DATE(pttp.ngay) = CURRENT_DATE
        AND pttp.nv_ke_toan = ${maNv}
      ORDER BY pttp.ngay DESC, pttp.ma_pttp DESC
    `

    res.json({
      pending: pendingRows.map(mapPendingRow),
      history: historyRows.map(mapHistoryRow),
      currentEmployee,
    })
  } catch (error) {
    next(error)
  }
}

export const getPtTraPhongPreview = async (req, res, next) => {
  try {
    const maTp = req.params.ma_tp?.trim().toUpperCase()
    const currentEmployee = await getCurrentEmployee(req)

    if (!maTp) {
      return res.status(400).json({
        message: 'Mã hồ sơ trả phòng không hợp lệ.',
      })
    }

    if (!currentEmployee?.ma_cn) {
      return res.status(401).json({
        message: 'Không xác định được chi nhánh của nhân viên đang đăng nhập.',
      })
    }

    const data = await buildPreviewData(prisma, maTp, currentEmployee, {
      updateBeds: true,
    })

    res.json(data)
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        code: error.code,
        message: error.message,
        data: error.data,
      })
    }

    next(error)
  }
}

export const createPtTraPhong = async (req, res, next) => {
  try {
    const maTp = req.params.ma_tp?.trim().toUpperCase()
    const currentEmployee = await getCurrentEmployee(req)

    if (!maTp) {
      return res.status(400).json({
        message: 'Mã hồ sơ trả phòng không hợp lệ.',
      })
    }

    if (!currentEmployee?.ma_cn) {
      return res.status(401).json({
        message: 'Không xác định được chi nhánh của nhân viên đang đăng nhập.',
      })
    }
// Bước 10: Tạo phiếu thu trong transaction
// để bảo đảm các cập nhật thành công hoặc thất bại cùng nhau.
    const result = await prisma.$transaction(async tx => {
      const data = await buildPreviewData(tx, maTp, currentEmployee, {
        updateBeds: false,
        alreadyUpdatedCurrentBed: true,
      })

      const insertedRows = await insertPtTraPhong(
        tx,
        data,
        currentEmployee,
        req.body?.ghi_chu || null,
      )

      const maPttp = insertedRows[0]?.ma_pttp

      const normalizeServiceId = value => {
        const text = String(value || '').trim()
      if (!text) return null

      // Nếu ma_ct là số thì dùng number.
      // Nếu ma_ct là dạng CT001 thì giữ string.
      return /^\d+$/.test(text) ? Number(text) : text
    }

      const serviceIdsFromBody = Array.isArray(req.body?.service_ids)
        ? req.body.service_ids
          .map(normalizeServiceId)
          .filter(Boolean)
        : []

      const serviceIdsFromData = Array.isArray(data.dich_vu)
        ? data.dich_vu
          .map(item => normalizeServiceId(item.ma_ct))
          .filter(Boolean)
      : []

      const serviceIds = serviceIdsFromBody.length > 0
        ? serviceIdsFromBody
        : serviceIdsFromData

    console.log('DEBUG GAN MA_PTTP VAO CTDV:', {
      maPttp,
      serviceIdsFromBody,
      serviceIdsFromData,
      serviceIds,
      la_ho_so_cuoi: data.la_ho_so_cuoi,
    })

    if (serviceIds.length > 0) {
      const updatedServices = await tx.$queryRaw`
        UPDATE chi_tiet_dv
        SET ma_pttp = ${maPttp}
        WHERE ma_ct IN (${Prisma.join(serviceIds)})
          AND ma_pttp IS NULL
        RETURNING ma_ct, ma_dv, ma_phong, ma_pttp
      `

      console.log('DEBUG CTDV DA GAN PTTP:', updatedServices)
      }
          return {
            ...data,
            ma_pttp: maPttp,
          }
        })

    const resultData = {
      ...result,
      ngay: result.ngay || new Date(),
    }

    // Trả response ngay để frontend hiện popup liền
    res.json({
      success: true,
      message: 'Tạo phiếu thu trả phòng thành công.',
      data: {
        ...resultData,
        pdf_processing: true,
        email_processing: true,
      },
    })

// Bước 12: Xuất PDF và gửi email ở chế độ bất đồng bộ,
// không làm người dùng phải chờ popup thành công.
    setImmediate(async () => {
      try {
        await inPTTraPhong(resultData)
      } catch (pdfError) {
        console.error('Lỗi in PDF phiếu thu trả phòng:', pdfError?.message)
      }

      try {
        await guiEmailPTTraPhong(resultData)
      } catch (mailError) {
        console.error('Lỗi gửi mail phiếu thu trả phòng:', mailError?.message)
      }
    })
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        code: error.code,
        message: error.message,
        data: error.data,
      })
    }

    next(error)
  }
}

export const getPtTraPhongReceiptDetail = async (req, res, next) => {
  try {
    const maPttp = req.params.ma_pttp?.trim().toUpperCase()
    const currentEmployee = await getCurrentEmployee(req)

    if (!maPttp) {
      return res.status(400).json({
        message: 'Mã phiếu thu trả phòng không hợp lệ.',
      })
    }

    if (!currentEmployee?.ma_cn) {
      return res.status(401).json({
        message: 'Không xác định được chi nhánh của nhân viên đang đăng nhập.',
      })
    }

    const { nameSql, phoneSql } = await getCustomerColumnSql()
    const maCn = currentEmployee.ma_cn

    const rows = await prisma.$queryRaw`
      SELECT
        pttp.ma_pttp,
        pttp.ngay,
        pttp.trang_thai,
        pttp.tong_tien,
        pttp.tien_hoan_coc,
        pttp.tien_khau_tru,
        pttp.ma_tp,
        h.ma_pdc,
        h.ma_hdt,
        CASE
          WHEN h.ma_hdt IS NULL THEN pdc.khach_dat
          ELSE h.ma_khach_thue
        END AS ma_khach_thue,
        h.ngay_tp,
        kh.cccd,
        kh.email,
        ${phoneSql} AS sdt,
        ${nameSql} AS ten_khach_hang,
        COALESCE(
          (
            SELECT STRING_AGG(DISTINCT dcg.ma_phong, ', ' ORDER BY dcg.ma_phong)
            FROM dat_coc_giuong dcg
            JOIN phong p ON p.ma_phong = dcg.ma_phong
            WHERE dcg.ma_pdc = h.ma_pdc
              AND p.chi_nhanh = ${maCn}
          ),
          ''
        ) AS ma_phong
      FROM pt_tra_phong pttp
      JOIN ho_so_tra_phong h ON h.ma_tp = pttp.ma_tp
      JOIN phieu_dat_coc pdc ON pdc.ma_pdc = h.ma_pdc
      JOIN khach_hang kh
        ON kh.ma_kh = CASE
          WHEN h.ma_hdt IS NULL THEN pdc.khach_dat
          ELSE h.ma_khach_thue
        END
      WHERE pttp.ma_pttp = ${maPttp}
        AND ${buildSameBranchExistsSql(maCn)}
      LIMIT 1
    `

    if (rows.length === 0) {
      return res.status(404).json({
        message: 'Không tìm thấy phiếu thu trả phòng thuộc chi nhánh của bạn.',
      })
    }

    const header = rows[0]
    const hasContract = Boolean(header.ma_hdt)

    const damageItems = hasContract
      ? await getDamageItems(prisma, header.ma_tp)
      : []

    const serviceItems = hasContract
      ? await getServiceItemsByReceipt(prisma, maPttp)
      : []

    res.json({
      ma_pttp: header.ma_pttp,
      ma_tp: header.ma_tp,
      ngay: header.ngay,
      ngay_tp: header.ngay_tp,
      trang_thai: header.trang_thai,
      ma_pdc: header.ma_pdc,
      ma_hdt: header.ma_hdt,
      email: header.email || '',
      tham_chieu: header.ma_hdt || header.ma_pdc,
      loai_tham_chieu: header.ma_hdt ? 'HDT' : 'PDC',
      ma_phong: header.ma_phong,
      ma_khach_thue: header.ma_khach_thue,
      ten_khach_hang: header.ten_khach_hang || header.ma_khach_thue,
      cccd: header.cccd || '',
      sdt: header.sdt || '',
      tien_hoan_coc: toNumber(header.tien_hoan_coc),
      tien_khau_tru: toNumber(header.tien_khau_tru),
      tong_tien: toNumber(header.tong_tien),
      vat_dung_hu_hai: damageItems,
      dich_vu: serviceItems,
    })
  } catch (error) {
    next(error)
  }
}

export const exportPtTraPhongPdf = async (req, res, next) => {
  try {
    const maPttp = req.params.ma_pttp?.trim().toUpperCase()
    const currentEmployee = await getCurrentEmployee(req)

    if (!maPttp) {
      return res.status(400).json({
        message: 'Mã phiếu thu trả phòng không hợp lệ.',
      })
    }

    if (!currentEmployee?.ma_cn) {
      return res.status(401).json({
        message: 'Không xác định được chi nhánh của nhân viên đang đăng nhập.',
      })
    }

    const { nameSql, phoneSql } = await getCustomerColumnSql()
    const maCn = currentEmployee.ma_cn

    const rows = await prisma.$queryRaw`
      SELECT
        pttp.ma_pttp,
        pttp.ngay,
        pttp.trang_thai,
        pttp.tong_tien,
        pttp.tien_hoan_coc,
        pttp.tien_khau_tru,
        pttp.ma_tp,
        h.ma_pdc,
        h.ma_hdt,
        CASE
          WHEN h.ma_hdt IS NULL THEN pdc.khach_dat
          ELSE h.ma_khach_thue
        END AS ma_khach_thue,
        h.ngay_tp,
        kh.cccd,
        kh.email,
        ${phoneSql} AS sdt,
        ${nameSql} AS ten_khach_hang,
        COALESCE(
          (
            SELECT STRING_AGG(DISTINCT dcg.ma_phong, ', ' ORDER BY dcg.ma_phong)
            FROM dat_coc_giuong dcg
            JOIN phong p ON p.ma_phong = dcg.ma_phong
            WHERE dcg.ma_pdc = h.ma_pdc
              AND p.chi_nhanh = ${maCn}
          ),
          ''
        ) AS ma_phong
      FROM pt_tra_phong pttp
      JOIN ho_so_tra_phong h ON h.ma_tp = pttp.ma_tp
      JOIN phieu_dat_coc pdc ON pdc.ma_pdc = h.ma_pdc
      JOIN khach_hang kh
        ON kh.ma_kh = CASE
          WHEN h.ma_hdt IS NULL THEN pdc.khach_dat
          ELSE h.ma_khach_thue
        END
      WHERE pttp.ma_pttp = ${maPttp}
        AND ${buildSameBranchExistsSql(maCn)}
      LIMIT 1
    `

    if (rows.length === 0) {
      return res.status(404).json({
        message: 'Không tìm thấy phiếu thu trả phòng thuộc chi nhánh của bạn.',
      })
    }

    const header = rows[0]
    const hasContract = Boolean(header.ma_hdt)

    const damageItems = hasContract
      ? await getDamageItems(prisma, header.ma_tp)
      : []

    const serviceItems = hasContract
      ? await getServiceItemsByReceipt(prisma, maPttp)
      : []

    const data = {
      ma_pttp: header.ma_pttp,
      ma_tp: header.ma_tp,
      ngay: header.ngay,
      ngay_tp: header.ngay_tp,
      trang_thai: header.trang_thai,
      ma_pdc: header.ma_pdc,
      ma_hdt: header.ma_hdt,
      email: header.email || '',
      tham_chieu: header.ma_hdt || header.ma_pdc,
      loai_tham_chieu: header.ma_hdt ? 'HDT' : 'PDC',
      ma_phong: header.ma_phong,
      ma_khach_thue: header.ma_khach_thue,
      ten_khach_hang: header.ten_khach_hang || header.ma_khach_thue,
      cccd: header.cccd || '',
      sdt: header.sdt || '',
      tien_hoan_coc: toNumber(header.tien_hoan_coc),
      tien_khau_tru: toNumber(header.tien_khau_tru),
      tong_tien: toNumber(header.tong_tien),
      vat_dung_hu_hai: damageItems,
      dich_vu: serviceItems,
    }

    const pdfPath = await inPTTraPhong(data)

    return res.download(pdfPath, `${maPttp}.pdf`)
  } catch (error) {
    next(error)
  }
}