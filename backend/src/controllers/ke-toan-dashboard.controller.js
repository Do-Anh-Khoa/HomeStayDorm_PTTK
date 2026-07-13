import prisma from '../config/prisma.js'

const TRANG_THAI_PT = ['Chưa thanh toán', 'Đã thanh toán', 'Không hợp lệ', 'Hợp lệ']

const getCurrentEmployee = async (req) => {
  const maNv = req.auth?.ma_nv || req.authSession?.ma_nv || null
  if (!maNv) return null

  const rows = await prisma.$queryRaw`
    SELECT ma_nv, ma_cn 
    FROM nhanvien 
    WHERE ma_nv = ${maNv} 
    LIMIT 1
  `
  return rows[0] || null
}


export const getDashboardSummary = async (req, res) => {
  try {
    const employee = await getCurrentEmployee(req)
    if (!employee) {
      return res.status(401).json({ message: 'Không tìm thấy thông tin nhân viên' })
    }
    const { ma_cn: maCN, ma_nv: tenDangNhap } = employee

    const [nvInfo] = await prisma.$queryRaw`
      SELECT ten_nv, loai_nv FROM nhanvien WHERE ma_nv = ${tenDangNhap} LIMIT 1
    `

    // ---- TinhSoPTDatCocCanLap(dsPDC): phiếu đặt cọc chưa hủy nhưng chưa có phiếu thu ----
    const [{ count: soPTDatCocCanLap }] = await prisma.$queryRaw`
      SELECT COUNT(*)::int AS count
      FROM phieu_dat_coc pdc
      JOIN nhanvien nv ON pdc.nv_sale = nv.ma_nv
      WHERE nv.ma_cn = ${maCN}
        AND pdc.trang_thai <> 'Đã hủy'
        AND NOT EXISTS (
          SELECT 1 FROM pt_dat_coc ptdc WHERE ptdc.ma_pdc = pdc.ma_pdc
        )
    `

    // ---- TinhSoPTHopDongCanLap(dsHDT): hợp đồng thuê chưa có phiếu thu hợp đồng ----
    const [{ count: soPTHopDongCanLap }] = await prisma.$queryRaw`
      SELECT COUNT(*)::int AS count
      FROM hop_dong_thue hdt
      JOIN nhanvien nv ON hdt.nv_phu_trach = nv.ma_nv
      WHERE nv.ma_cn = ${maCN}
        AND NOT EXISTS (
          SELECT 1 FROM pt_hop_dong pthd WHERE pthd.ma_hdt = hdt.ma_hdt
        )
    `

    // ---- TinhSoPTBoiThuongCanLap(dsBT): hồ sơ bồi thường chưa có phiếu thu bồi thường ----
    const [{ count: soPTBoiThuongCanLap }] = await prisma.$queryRaw`
      SELECT COUNT(*)::int AS count
      FROM boi_thuong bt
      JOIN nhanvien nv ON bt.nv_quan_ly = nv.ma_nv
      WHERE nv.ma_cn = ${maCN}
        AND NOT EXISTS (
          SELECT 1 FROM pt_boi_thuong ptbt WHERE ptbt.ma_bt = bt.ma_bt
        )
    `

    // ---- TinhSoPTTraPhongCanLap(dsHSTP): hồ sơ trả phòng (chưa hủy) chưa có phiếu thu trả phòng ----
    const [{ count: soPTTraPhongCanLap }] = await prisma.$queryRaw`
      SELECT COUNT(*)::int AS count
      FROM ho_so_tra_phong hstp
      JOIN nhanvien nv ON hstp.nv_sale = nv.ma_nv
      WHERE nv.ma_cn = ${maCN}
        AND hstp.ngay_huy IS NULL
        AND NOT EXISTS (
          SELECT 1 FROM pt_tra_phong pttp WHERE pttp.ma_tp = hstp.ma_tp
        )
    `

    // ---- TinhSoPTTongHop(trangThai): gộp trạng thái của cả 4 loại phiếu thu đã lập ----
    const tongHopRows = await prisma.$queryRaw`
      SELECT trang_thai, COUNT(*)::int AS so_luong FROM (
        SELECT ptdc.trang_thai
        FROM pt_dat_coc ptdc
        JOIN nhanvien nv ON ptdc.nv_ke_toan = nv.ma_nv
        WHERE nv.ma_cn = ${maCN}
        UNION ALL
        SELECT pthd.trang_thai
        FROM pt_hop_dong pthd
        JOIN nhanvien nv ON pthd.nv_ke_toan = nv.ma_nv
        WHERE nv.ma_cn = ${maCN}
        UNION ALL
        SELECT pttp.trang_thai
        FROM pt_tra_phong pttp
        JOIN nhanvien nv ON pttp.nv_ke_toan = nv.ma_nv
        WHERE nv.ma_cn = ${maCN}
        UNION ALL
        SELECT ptbt.trang_thai
        FROM pt_boi_thuong ptbt
        JOIN nhanvien nv ON ptbt.nv_ke_toan = nv.ma_nv
        WHERE nv.ma_cn = ${maCN}
      ) all_pt
      GROUP BY trang_thai
    `

    const trangThaiTongHop = TRANG_THAI_PT.reduce((acc, tt) => {
      acc[tt] = 0
      return acc
    }, {})
    let tongSoPhieuThu = 0
    for (const row of tongHopRows) {
      trangThaiTongHop[row.trang_thai] = row.so_luong
      tongSoPhieuThu += row.so_luong
    }

    const soPhieuCanLap = {
      datCoc: soPTDatCocCanLap,
      hopDong: soPTHopDongCanLap,
      boiThuong: soPTBoiThuongCanLap,
      traPhong: soPTTraPhongCanLap
    }
    const tongChungTuCanXuLy =
      soPTDatCocCanLap + soPTHopDongCanLap + soPTBoiThuongCanLap + soPTTraPhongCanLap

    res.json({
      data: {
        tenNhanVien: nvInfo?.ten_nv || null,
        loaiNhanVien: nvInfo?.loai_nv || null,
        tongChungTuCanXuLy,
        soPhieuCanLap,
        trangThaiTongHop: {
          tongSo: tongSoPhieuThu,
          daThanhToan: trangThaiTongHop['Đã thanh toán'],
          chuaThanhToan: trangThaiTongHop['Chưa thanh toán'],
          hopLe: trangThaiTongHop['Hợp lệ'],
          khongHopLe: trangThaiTongHop['Không hợp lệ']
        }
      }
    })
  } catch (error) {
    console.error('Lỗi getDashboardSummary:', error)
    res.status(500).json({ message: 'Lỗi server khi lấy dữ liệu dashboard kế toán' })
  }
}


export const getDichVuPhongCanGhiNhan = async (req, res) => {
  try {
    const employee = await getCurrentEmployee(req)
    if (!employee) {
      return res.status(401).json({ message: 'Không tìm thấy thông tin nhân viên' })
    }
    const { ma_cn: maCN } = employee

    const page = Math.max(1, parseInt(req.query.page, 10) || 1)
    const pageSize = Math.min(50, Math.max(1, parseInt(req.query.pageSize, 10) || 5))
    const offset = (page - 1) * pageSize

    const [{ count: total }] = await prisma.$queryRaw`
      SELECT COUNT(*)::int AS count FROM phong WHERE chi_nhanh = ${maCN}
    `

    const items = await prisma.$queryRaw`
      SELECT
        p.ma_phong,
        ct.ten_dv,
        ct.so_luong,
        CASE WHEN ct.ma_ct IS NULL THEN 'Chưa ghi nhận' ELSE 'Đã lập dịch vụ' END AS trang_thai
      FROM phong p
      LEFT JOIN (
        SELECT DISTINCT ON (ctdv.ma_phong)
          ctdv.ma_ct, ctdv.ma_phong, ctdv.so_luong, dv.ten_dv
        FROM chi_tiet_dv ctdv
        JOIN dich_vu dv ON ctdv.ma_dv = dv.ma_dv
        ORDER BY ctdv.ma_phong, ctdv.ngay DESC
      ) ct ON p.ma_phong = ct.ma_phong
      WHERE p.chi_nhanh = ${maCN}
      ORDER BY p.ma_phong ASC
      LIMIT ${pageSize} OFFSET ${offset}
    `

    res.json({
      data: {
        items,
        total,
        page,
        pageSize,
        totalPages: Math.max(1, Math.ceil(total / pageSize))
      }
    })
  } catch (error) {
    console.error('Lỗi getDichVuPhongCanGhiNhan:', error)
    res.status(500).json({ message: 'Lỗi server khi lấy danh sách dịch vụ phòng' })
  }
}