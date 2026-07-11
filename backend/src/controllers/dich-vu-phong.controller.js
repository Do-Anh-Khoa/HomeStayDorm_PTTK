import { Prisma } from '@prisma/client'
import prisma from '../config/prisma.js'

export const getDichVuPhongList = async (req, res, next) => {
  try {
    const q = req.query.q?.trim() || ''
    const page = Math.max(1, Number(req.query.page) || 1)
    const pageSize = Math.max(1, Number(req.query.pageSize) || 10)

    const filters = []
    if (q) {
      filters.push(Prisma.sql`p.ma_phong ILIKE ${`%${q}%`}`)
    }
    if (req.auth?.ma_cn) {
      filters.push(Prisma.sql`p.chi_nhanh = ${req.auth.ma_cn}`)
    }
    const whereSql = filters.length > 0 ? Prisma.sql`WHERE ${Prisma.join(filters, ' AND ')}` : Prisma.empty

    const rows = await prisma.$queryRaw`
      SELECT
        p.ma_phong,
        COALESCE(SUM(CASE WHEN ct.trang_thai <> ${'Đã thanh toán'} THEN ct.thanh_tien END), 0) AS so_tien_du_kien
      FROM phong p
      LEFT JOIN chi_tiet_dv ct ON ct.ma_phong = p.ma_phong
      ${whereSql}
      GROUP BY p.ma_phong
      ORDER BY p.ma_phong ASC
      LIMIT ${pageSize} OFFSET ${(page - 1) * pageSize}
    `

    const countRows = await prisma.$queryRaw`
      SELECT COUNT(*) AS cnt
      FROM (
        SELECT p.ma_phong
        FROM phong p
        ${whereSql}
        GROUP BY p.ma_phong
      ) t
    `

    const total = Number(countRows[0]?.cnt || 0)

    const items = (rows || []).map(r => ({
      maPhong: r.ma_phong,
      soTienDuKien: Number(r.so_tien_du_kien) || 0,
    }))

    res.json({ items, total })
  } catch (err) {
    next(err)
  }
}

export const ghiNhanDichVu = async (req, res, next) => {
  try {
    const { maPhong, ngay, items } = req.body

    if (!maPhong) return res.status(400).json({ message: 'maPhong bắt buộc.' })
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'Vui lòng chọn ít nhất một dịch vụ.' })
    }

    const processedItems = []

    for (const item of items) {
      const maDV = item.maDV
      if (!maDV) {
        return res.status(400).json({ message: 'Mã dịch vụ không hợp lệ.' })
      }

      const service = await prisma.dich_vu.findUnique({ where: { ma_dv: maDV } })
      if (!service) {
        return res.status(400).json({ message: `Không tìm thấy dịch vụ ${maDV}.` })
      }

      if (item.soLuong !== undefined) {
        const soLuong = Number(item.soLuong || 0)
        if (!Number.isFinite(soLuong) || soLuong <= 0) {
          continue
        }

        processedItems.push({
          maDV,
          soLuong,
          donGia: Number(service.gia_dv),
        })
        continue
      }

      const chiSoCu = Number(item.chiSoCu || 0)
      const chiSoMoi = Number(item.chiSoMoi || 0)
      if (!Number.isFinite(chiSoMoi) || !Number.isFinite(chiSoCu)) {
        return res.status(400).json({ message: 'Chỉ số cũ và mới phải là số hợp lệ.' })
      }

      const soLuong = chiSoMoi - chiSoCu
      if (soLuong <= 0) {
        continue
      }

      processedItems.push({
        maDV,
        soLuong,
        donGia: Number(service.gia_dv),
      })
    }

    if (processedItems.length === 0) {
      return res.status(400).json({ message: 'Vui lòng nhập chỉ số mới lớn hơn chỉ số cũ cho ít nhất một dịch vụ.' })
    }

    await prisma.$transaction(async (tx) => {
      for (const item of processedItems) {
        await tx.chi_tiet_dv.create({
          data: {
            so_luong: item.soLuong,
            thanh_tien: item.soLuong * item.donGia,
            trang_thai: 'Chưa thanh toán',
            ma_dv: item.maDV,
            ma_phong: maPhong,
            ngay: ngay ? new Date(ngay) : undefined,
          },
        })
      }
    })

    res.status(201).json({ message: 'Ghi nhận dịch vụ thành công.' })
  } catch (err) {
    next(err)
  }
}

export const getChoThanhToan = async (req, res, next) => {
  try {
    const maPhong = req.query.maPhong
    if (!maPhong) return res.status(400).json({ message: 'maPhong bắt buộc.' })

    const rows = await prisma.$queryRaw`
      SELECT
        ct.ma_ct AS ma_ct,
        dv.ten_dv AS ten,
        ct.so_luong AS so_luong,
        dv.ma_dv AS ma_dv,
        dv.gia_dv AS don_gia,
        dv.don_vi_tinh AS don_vi,
        ct.thanh_tien AS thanh_tien,
        ct.ngay AS ngay,
        ct.trang_thai AS trang_thai
      FROM chi_tiet_dv ct
      LEFT JOIN dich_vu dv ON dv.ma_dv = ct.ma_dv
      WHERE ct.ma_phong = ${maPhong}
      ORDER BY ct.ngay DESC, ct.ma_ct DESC
    `

    const cho = []
    const da = []

    for (const r of rows) {
      const item = {
        maCT: r.ma_ct,
        ten: r.ten || r.ma_dv,
        soLuong: Number(r.so_luong || 0),
        maDV: r.ma_dv,
        donGia: Number(r.don_gia || 0),
        thanhTien: Number(r.thanh_tien || 0),
        ngay: r.ngay ? r.ngay.toISOString().slice(0, 10) : null,
      }

      if (r.trang_thai === 'Đã thanh toán') da.push(item)
      else cho.push(item)
    }

    res.json({ choThanhToan: cho, daThanhToan: da })
  } catch (err) {
    next(err)
  }
}

export const xacNhanThanhToan = async (req, res, next) => {
  try {
    const { maPhong, danhSachMaCT } = req.body
    if (!maPhong || !Array.isArray(danhSachMaCT) || danhSachMaCT.length === 0) {
      return res.status(400).json({ message: 'Dữ liệu không hợp lệ.' })
    }

    await prisma.$executeRaw`
      UPDATE chi_tiet_dv
      SET trang_thai = ${'Đã thanh toán'}
      WHERE ma_phong = ${maPhong} AND ma_ct IN (${Prisma.join(danhSachMaCT)})
    `

    res.json({ message: 'Cập nhật thanh toán thành công.' })
  } catch (err) {
    next(err)
  }
}
