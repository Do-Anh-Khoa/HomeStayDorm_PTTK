import dns from 'dns/promises'
import nodemailer from 'nodemailer'
import { Prisma } from '@prisma/client'
import prisma from '../config/prisma.js'
import PhieuDatCocDB from '../database/PhieuDatCocDB.js' 
import { inPhieuDatCoc } from '../utils/inPhieuDatCoc.js'
const TRANG_THAI_HO_SO_HOP_LE = ['Đã hẹn']
const TRANG_THAI_GIUONG_TRONG = 'Trống'
const TRANG_THAI_GIUONG_DA_COC = 'Đã đặt cọc'
const TRANG_THAI_PDC_MOI = 'Chờ thanh toán'
const HE_SO_DAT_COC = 2

const formatDateTime = (value) => (value ? new Date(value).toLocaleString('vi-VN') : '')

async function hasValidMailDomain(email) {
  try {
    const domain = String(email || '').split('@')[1]
    if (!domain) return false

    const mxRecords = await dns.resolveMx(domain)
    return mxRecords.some((record) => record.exchange && record.exchange.trim() !== '')
  } catch {
    return false
  }
}

async function guiEmailPhieuDatCoc(phieuDatCoc) {
  const email = String(phieuDatCoc?.email || '').trim()
  if (!email) {
    return false
  }

  const domainHopLe = await hasValidMailDomain(email)
  if (!domainHopLe) {
    console.error(`Email phiếu đặt cọc không hợp lệ: ${email}`)
    return false
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  })

  try {
    await transporter.sendMail({
      from: `"Homestay Dorm System" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `Thông tin phiếu đặt cọc ${phieuDatCoc.maPDC}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 560px; margin: auto; padding: 24px; border: 1px solid #e6e6e6; border-radius: 12px;">
          <h2 style="margin: 0 0 16px; color: #3b4f27;">Thông tin phiếu đặt cọc</h2>
          <p>Xin chào <strong>${phieuDatCoc.tenKH}</strong>,</p>
          <p>Homestay Dorm System đã ghi nhận phiếu đặt cọc <strong>${phieuDatCoc.maPDC}</strong> cho hồ sơ đăng ký <strong>${phieuDatCoc.maDK}</strong>.</p>
          <p>Dưới đây là thông tin đã được xác nhận:</p>
          <table style="width: 100%; border-collapse: collapse; margin: 18px 0;">
            <tbody>
              <tr>
                <td style="padding: 8px 0; color: #666;">Ngày lập</td>
                <td style="padding: 8px 0; text-align: right; font-weight: 700;">${formatDateTime(phieuDatCoc.ngayLap)}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666;">Phòng</td>
                <td style="padding: 8px 0; text-align: right; font-weight: 700;">${phieuDatCoc.maPhong}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666;">Giường</td>
                <td style="padding: 8px 0; text-align: right; font-weight: 700;">${phieuDatCoc.dsGiuong.join(', ')}</td>
              </tr>
            </tbody>
          </table>
          <p>Các giường đã chọn đã được cập nhật sang trạng thái <strong>${TRANG_THAI_GIUONG_DA_COC}</strong>, đồng thời hồ sơ đăng ký đã được chuyển sang <strong>Đã chốt cọc</strong>.</p>
          <p>Đây là email thông báo tự động từ hệ thống, vui lòng không phản hồi lại email này.</p>
          <p style="margin-top: 20px;">Trân trọng,<br />Homestay Dorm System</p>
        </div>
      `,
    })

    return true
  } catch (error) {
    console.error('guiEmailPhieuDatCoc:', error?.message)
    return false
  }
}

async function taoMaPhieuDatCoc(tx) {
  await tx.$executeRawUnsafe('LOCK TABLE phieu_dat_coc IN EXCLUSIVE MODE')

  const rows = await tx.$queryRaw`
    SELECT COALESCE(MAX(CAST(SUBSTRING(ma_pdc FROM 4) AS INTEGER)), 0) AS current_max
    FROM phieu_dat_coc
    WHERE ma_pdc ~ '^PDC[0-9]+$'
  `

  const currentMax = Number(rows?.[0]?.current_max || 0)
  return `PDC${String(currentMax + 1).padStart(3, '0')}`
}

export async function createPhieuDatCoc(req, res) {
  try {
    const maNv = req.auth?.ma_nv || ''
    const maCn = req.auth?.ma_cn || ''

    if (!maNv || !maCn) {
      return res.status(401).json({ message: 'Bạn chưa đăng nhập.' })
    }

    const maDk = String(req.body.maDk || req.body.ma_dk || '').trim().toUpperCase()
    const maPhong = String(req.body.maPhong || req.body.ma_phong || '').trim().toUpperCase()
    const soLuongGiuongInput = Number(req.body.soLuongGiuong || req.body.so_luong_giuong || 0)
    const dsGiuongRaw = Array.isArray(req.body.dsGiuong)
      ? req.body.dsGiuong
      : Array.isArray(req.body.ds_giuong)
        ? req.body.ds_giuong
        : []

    const dsGiuong = [...new Set(
      dsGiuongRaw
        .map((item) => String(item || '').trim().toUpperCase())
        .filter(Boolean),
    )]

    if (!maDk || !maPhong) {
      return res.status(400).json({ message: 'Thiếu thông tin hồ sơ hoặc phòng.' })
    }

    const result = await prisma.$transaction(async (tx) => {
      const hoSo = await tx.ho_so_dang_ky.findUnique({
        where: { ma_dk: maDk },
        include: {
          khach_hang_ho_so_dang_ky_khach_hangTokhach_hang: true,
        },
      })

      if (!hoSo) {
        const error = new Error('Không tìm thấy hồ sơ đăng ký.')
        error.status = 404
        throw error
      }

      if (hoSo.chi_nhanh !== maCn) {
        const error = new Error('Bạn không có quyền lập phiếu đặt cọc cho hồ sơ thuộc chi nhánh khác.')
        error.status = 403
        throw error
      }

      if (!TRANG_THAI_HO_SO_HOP_LE.includes(hoSo.trang_thai)) {
        const error = new Error(`Hồ sơ đang ở trạng thái "${hoSo.trang_thai}", không thể lập phiếu đặt cọc.`)
        error.status = 409
        throw error
      }

      const phong = await tx.phong.findFirst({
        where: {
          ma_phong: maPhong,
          chi_nhanh: maCn,
        },
        include: {
          loai_phong: true,
        },
      })

      if (!phong) {
        const error = new Error('Không tìm thấy phòng phù hợp tại chi nhánh hiện tại.')
        error.status = 404
        throw error
      }

      const soLuongYeuCau = Number(hoSo.so_nguoi || 0)
      const soLuongCanDat = dsGiuong.length > 0 ? dsGiuong.length : soLuongGiuongInput

      if (!Number.isInteger(soLuongCanDat) || soLuongCanDat <= 0) {
        const error = new Error('Số lượng giường không hợp lệ.')
        error.status = 400
        throw error
      }

      if (soLuongYeuCau > 0 && soLuongCanDat !== soLuongYeuCau) {
        const error = new Error(`Hồ sơ này cần ${soLuongYeuCau} giường. Vui lòng nhập đúng số lượng theo nhu cầu.`)
        error.status = 400
        throw error
      }

      let beds = []

      if (dsGiuong.length > 0) {
        beds = await tx.$queryRaw`
          SELECT ma_giuong, trang_thai
          FROM giuong
          WHERE ma_phong = ${maPhong}
            AND ma_giuong IN (${Prisma.join(dsGiuong)})
          FOR UPDATE
        `

        if (beds.length !== dsGiuong.length) {
          const error = new Error('Một hoặc nhiều giường không tồn tại trong phòng đã chọn.')
          error.status = 400
          throw error
        }

        const bedsKhongTrong = beds.filter((bed) => bed.trang_thai !== TRANG_THAI_GIUONG_TRONG)
        if (bedsKhongTrong.length > 0) {
          const error = new Error(
            `Phòng không còn đủ chỗ theo nhu cầu. Các giường sau không còn trống: ${bedsKhongTrong.map((bed) => bed.ma_giuong).join(', ')}.`,
          )
          error.status = 409
          error.code = 'INSUFFICIENT_BEDS'
          error.data = {
            availableBeds: beds.filter((bed) => bed.trang_thai === TRANG_THAI_GIUONG_TRONG).length,
            unavailableBeds: bedsKhongTrong.map((bed) => bed.ma_giuong),
          }
          throw error
        }
      } else {
        beds = await tx.$queryRaw`
          SELECT ma_giuong, trang_thai
          FROM giuong
          WHERE ma_phong = ${maPhong}
            AND trang_thai = ${TRANG_THAI_GIUONG_TRONG}
          ORDER BY ma_giuong
          FOR UPDATE
        `

        if (beds.length < soLuongCanDat) {
          const error = new Error(`Phòng hiện chỉ còn ${beds.length} giường trống, không đủ theo số lượng yêu cầu.`)
          error.status = 409
          error.code = 'INSUFFICIENT_BEDS'
          error.data = {
            availableBeds: beds.length,
          }
          throw error
        }

        beds = beds.slice(0, soLuongCanDat)
      }

      const dsGiuongDat = beds.map((bed) => bed.ma_giuong)

      const maPdcMoi = await taoMaPhieuDatCoc(tx)

      const phieuDatCoc = await tx.phieu_dat_coc.create({
        data: {
          ma_pdc: maPdcMoi,
          trang_thai: TRANG_THAI_PDC_MOI,
          khach_dat: hoSo.khach_hang,
          nv_sale: maNv,
        },
      })

      await tx.$executeRaw`
        INSERT INTO dat_coc_giuong (ma_pdc, ma_phong, ma_giuong)
        VALUES ${Prisma.join(
          dsGiuongDat.map((maGiuong) => Prisma.sql`(${phieuDatCoc.ma_pdc}, ${maPhong}, ${maGiuong})`),
        )}
      `

      await tx.giuong.updateMany({
        where: {
          ma_phong: maPhong,
          ma_giuong: { in: dsGiuongDat },
        },
        data: {
          trang_thai: TRANG_THAI_GIUONG_DA_COC,
        },
      })

      await tx.ho_so_dang_ky.update({
        where: { ma_dk: maDk },
        data: { trang_thai: 'Đã chốt cọc' },
      })

      return {
        maPDC: phieuDatCoc.ma_pdc,
        maDK: maDk,
        maPhong,
        dsGiuong: dsGiuongDat,
        soLuongGiuong: dsGiuongDat.length,
        giaGiuong: Number(phong.loai_phong.gia_giuong || 0),
        soTienCoc: Number(phong.loai_phong.gia_giuong || 0) * HE_SO_DAT_COC * dsGiuongDat.length,
        ngayLap: phieuDatCoc.ngay_dc,
        tenKH: hoSo.khach_hang_ho_so_dang_ky_khach_hangTokhach_hang.ten_kh,
        email: hoSo.khach_hang_ho_so_dang_ky_khach_hangTokhach_hang.email,
      }
    })

    const guiMailThanhCong = await guiEmailPhieuDatCoc(result)

    return res.status(201).json({
      message: guiMailThanhCong
        ? 'Lập phiếu đặt cọc thành công và đã gửi email cho khách.'
        : 'Lập phiếu đặt cọc thành công nhưng gửi email cho khách chưa thành công.',
      data: {
        ...result,
        guiMailThanhCong,
      },
    })
  } catch (error) {
    console.error('createPhieuDatCoc:', error)
    return res.status(error.status || 500).json({
      code: error.code || 'CREATE_PHIEU_DAT_COC_FAILED',
      message: error.message || 'Không thể lập phiếu đặt cọc.',
      data: error.data || null,
    })
  }
}
export async function getPhieuDatCocList(req, res) {
  try {
    const maCn = req.auth?.ma_cn || ''
    const search = req.query.search || ''

    if (!maCn) {
      return res.status(401).json({ message: 'Bạn chưa đăng nhập.' })
    }

    const rows = await prisma.$queryRaw`
      SELECT
        pdc.ma_pdc AS "maPDC",
        pdc.ngay_dc AS "ngayLap",
        pdc.trang_thai AS "trangThai",
        kh.ten_kh AS "tenKH",
        kh.cccd AS "cccd",
        kh.sdt AS "sdt",
        kh.email AS "email",
        ptdc.ma_ptdc AS "ptMa",
        ptdc.trang_thai AS "ptTrangThai",
        COALESCE(
          (SELECT string_agg(DISTINCT ma_phong, ', ') FROM dat_coc_giuong WHERE ma_pdc = pdc.ma_pdc),
          ''
        ) AS "phong",
        COALESCE(
          (SELECT string_agg(DISTINCT ma_giuong, ', ') FROM dat_coc_giuong WHERE ma_pdc = pdc.ma_pdc),
          ''
        ) AS "giuong",
        COALESCE(
          (
            SELECT SUM(lp.gia_giuong * 2)
            FROM dat_coc_giuong dcg
            JOIN phong p ON p.ma_phong = dcg.ma_phong
            JOIN loai_phong lp ON lp.ma_loai = p.ma_loai
            WHERE dcg.ma_pdc = pdc.ma_pdc
          ),
          0
        ) AS "soTien"
      FROM phieu_dat_coc pdc
      JOIN khach_hang kh ON kh.ma_kh = pdc.khach_dat
      JOIN nhanvien nv ON nv.ma_nv = pdc.nv_sale
      LEFT JOIN pt_dat_coc ptdc ON ptdc.ma_pdc = pdc.ma_pdc
      WHERE nv.ma_cn = ${maCn}
        AND (
          ${search} = '' OR
          pdc.ma_pdc ILIKE '%' || ${search} || '%' OR
          kh.ten_kh ILIKE '%' || ${search} || '%' OR
          kh.cccd ILIKE '%' || ${search} || '%' OR
          kh.sdt ILIKE '%' || ${search} || '%'
        )
      ORDER BY pdc.ngay_dc DESC
    `

    const items = rows.map(row => {
      const ngayLapDate = new Date(row.ngayLap)
      const hanTTDate = new Date(ngayLapDate.getTime() + 24 * 60 * 60 * 1000)

      return {
        ...row,
        soTien: Number(row.soTien || 0),
        ngayLap: ngayLapDate.toLocaleDateString('vi-VN'),
        hanTT: hanTTDate.toLocaleDateString('vi-VN') + ' ' + hanTTDate.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
        ptMa: row.ptMa || '',
        ptTrangThai: row.ptTrangThai || 'Chưa thanh toán'
      }
    })

    res.json({ items })
  } catch (error) {
    res.status(500).json({ message: 'Không thể tải danh sách phiếu đặt cọc.' })
  }
}

export async function cancelPhieuDatCoc(req, res) {
  try {
    const { maPDC } = req.params
    await prisma.phieu_dat_coc.update({
      where: { ma_pdc: maPDC },
      data: { trang_thai: 'Đã hủy' }
    })
    res.json({ message: 'Hủy phiếu thành công.' })
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi hủy phiếu.' })
  }
}

export async function printPhieuDatCoc(req, res) {
  try {
    const { maPDC } = req.params
    const pdc = await PhieuDatCocDB.LayTheoMaDatCoc(maPDC)
    if (!pdc) return res.status(404).json({ message: 'Không tìm thấy phiếu.' })

    const chiTiet = await prisma.$queryRaw`
      SELECT string_agg(DISTINCT dcg.ma_phong, ', ') as phong,
             string_agg(DISTINCT dcg.ma_giuong, ', ') as giuong,
             SUM(lp.gia_giuong * 2) as "soTien",
             MAX(cn.ten_cn) as "coSo"
      FROM dat_coc_giuong dcg
      JOIN phong p ON p.ma_phong = dcg.ma_phong
      JOIN loai_phong lp ON lp.ma_loai = p.ma_loai
      JOIN chi_nhanh cn ON p.chi_nhanh = cn.ma_cn
      WHERE dcg.ma_pdc = ${maPDC}
      GROUP BY dcg.ma_pdc
    `

    const nhanVien = await prisma.nhanvien.findUnique({
      where: { ma_nv: pdc.maNVSale },
      select: { ten_nv: true }
    })
    
    const tienCoc = chiTiet[0]?.soTien ? Number(chiTiet[0].soTien) : 0

    const dataIn = { 
      ...pdc, 
      phong: chiTiet[0]?.phong || 'N/A', 
      giuong: chiTiet[0]?.giuong || 'N/A', 
      coSo: chiTiet[0]?.coSo || 'Chưa cập nhật',
      soTien: tienCoc,
      tenNVSale: nhanVien?.ten_nv || pdc.maNVSale
    }

    const filePath = await inPhieuDatCoc(dataIn)
    res.download(filePath)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Lỗi server khi tạo file in.' })
  }
}