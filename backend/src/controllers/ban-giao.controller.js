import prisma from '../config/prisma.js'

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

export const getBanGiaoPageData = async (req, res) => {
  try {
    const employee = await getCurrentEmployee(req)
    if (!employee) {
      return res.status(401).json({ message: 'Không tìm thấy thông tin nhân viên' })
    }
    const { ma_cn } = employee

    // 1. Danh sách chờ bàn giao (Chưa có trong bảng bien_ban_ban_giao, phiếu thu đã thanh toán/hợp lệ)
    const pendingList = await prisma.$queryRaw`
      SELECT 
        hdt.ma_hdt,
        kh.ten_kh AS ten_khach_hang,
        kh.ma_kh,
        CONCAT(dcg.ma_phong, ' - ', dcg.ma_giuong) AS phong_giuong,
        hdt.tg_vao AS ngay_ban_giao,
        pthd.trang_thai AS trang_thai_phieu_thu
      FROM hop_dong_thue hdt
      JOIN khach_thue kt ON hdt.ma_hdt = kt.ma_hdt
      JOIN khach_hang kh ON kt.ma_kh = kh.ma_kh
      JOIN phieu_dat_coc pdc ON hdt.ma_pdc = pdc.ma_pdc
      JOIN dat_coc_giuong dcg ON pdc.ma_pdc = dcg.ma_pdc
      JOIN phong p ON dcg.ma_phong = p.ma_phong
      LEFT JOIN pt_hop_dong pthd ON hdt.ma_hdt = pthd.ma_hdt
      LEFT JOIN bien_ban_ban_giao bb ON hdt.ma_hdt = bb.ma_hdt
      WHERE bb.ma_bb IS NULL
        AND pthd.trang_thai IN ('Đã thanh toán', 'Hợp lệ')
        AND p.chi_nhanh = ${ma_cn}
      ORDER BY hdt.tg_vao DESC
    `

    const historyList = await prisma.$queryRaw`
      SELECT 
        hdt.ma_hdt,
        kh.ten_kh AS ten_khach_hang,
        kh.ma_kh,
        CONCAT(dcg.ma_phong, ' - ', dcg.ma_giuong) AS phong_giuong,
        bb.ngay_bg AS ngay_ban_giao,
        pthd.trang_thai AS trang_thai_phieu_thu,
        bb.ma_bb
      FROM bien_ban_ban_giao bb
      JOIN hop_dong_thue hdt ON bb.ma_hdt = hdt.ma_hdt
      JOIN khach_thue kt ON hdt.ma_hdt = kt.ma_hdt
      JOIN khach_hang kh ON kt.ma_kh = kh.ma_kh
      JOIN phieu_dat_coc pdc ON hdt.ma_pdc = pdc.ma_pdc
      JOIN dat_coc_giuong dcg ON pdc.ma_pdc = dcg.ma_pdc
      JOIN phong p ON dcg.ma_phong = p.ma_phong
      LEFT JOIN pt_hop_dong pthd ON hdt.ma_hdt = pthd.ma_hdt
      WHERE p.chi_nhanh = ${ma_cn}
      ORDER BY bb.ngay_bg DESC
    `

    res.json({
      data: {
        pendingList,
        historyList
      }
    })
  } catch (error) {
    console.error('Lỗi getBanGiaoPageData:', error)
    res.status(500).json({ message: 'Lỗi server khi lấy dữ liệu bàn giao' })
  }
}


import { Prisma } from '@prisma/client'

export const getBanGiaoDetail = async (req, res) => {
  try {
    const { ma_hdt } = req.params
    const employee = await getCurrentEmployee(req) // Dùng lại hàm ở trên đầu file
    if (!employee) return res.status(401).json({ message: 'Không tìm thấy thông tin nhân viên' })

   
    const contractRows = await prisma.$queryRaw`
      SELECT 
        hdt.ma_hdt,
        kh.ten_kh AS ten_khach_hang,
        CONCAT(dcg.ma_phong, ' - ', dcg.ma_giuong) AS phong_giuong,
        pthd.trang_thai AS trang_thai_phieu_thu
      FROM hop_dong_thue hdt
      JOIN khach_thue kt ON hdt.ma_hdt = kt.ma_hdt
      JOIN khach_hang kh ON kt.ma_kh = kh.ma_kh
      JOIN phieu_dat_coc pdc ON hdt.ma_pdc = pdc.ma_pdc
      JOIN dat_coc_giuong dcg ON pdc.ma_pdc = dcg.ma_pdc
      LEFT JOIN pt_hop_dong pthd ON hdt.ma_hdt = pthd.ma_hdt
      WHERE hdt.ma_hdt = ${ma_hdt}
      LIMIT 1
    `

    if (contractRows.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy hợp đồng hoặc hợp đồng chưa hợp lệ.' })
    }

    // 2. Lấy danh sách Vật dụng (Để xổ xuống ở ComboBox)
    const vatDungs = await prisma.$queryRaw`
      SELECT ma_vd, ten_vd FROM vat_dung ORDER BY ten_vd ASC
    `

    res.json({
      data: {
        contract: contractRows[0],
        vatDungs
      }
    })
  } catch (error) {
    console.error('Lỗi getBanGiaoDetail:', error)
    res.status(500).json({ message: 'Lỗi server khi lấy chi tiết bàn giao' })
  }
}

export const createBienBanBanGiao = async (req, res) => {
  try {
    const { ma_hdt } = req.params
    const { tinh_trang_vs, items } = req.body 
    
    const employee = await getCurrentEmployee(req)
    if (!employee) return res.status(401).json({ message: 'Vui lòng đăng nhập.' })

    // Bắt lỗi Luồng A7a: Dữ liệu không hợp lệ
    if (!items || items.length === 0) {
      return res.status(400).json({ message: 'Phải có ít nhất một vật dụng được bàn giao.' })
    }

    for (const item of items) {
      if (item.so_luong <= 0) {
        return res.status(400).json({ message: `Vật dụng "${item.ten_vd}" phải có số lượng lớn hơn 0.` })
      }
      if (!item.tinh_trang || item.tinh_trang.trim() === '') {
        return res.status(400).json({ message: `Vui lòng nhập tình trạng cho vật dụng "${item.ten_vd}".` })
      }
      // Bắt lỗi Luồng A7b: Chưa bấm chọn ô Đã duyệt
      if (!item.da_duyet) {
        return res.status(400).json({ message: 'Vui lòng xác nhận trạng thái “Đã duyệt” cùng Khách hàng trước khi lưu biên bản.' })
      }
    }

    await prisma.$transaction(async tx => {
      // Hành động 1: Tạo Biên bản bàn giao mới
      const insertedBB = await tx.$queryRaw`
        INSERT INTO bien_ban_ban_giao (tinh_trang_vs, nv_quan_ly, ma_hdt)
        VALUES (${tinh_trang_vs}, ${employee.ma_nv}, ${ma_hdt})
        RETURNING ma_bb
      `
      const ma_bb = insertedBB[0].ma_bb

      // Hành động 2: Lưu danh sách vật dụng vào vd_bg
      const insertValues = items.map(vd => Prisma.sql`(${vd.ma_vd}, ${ma_bb}, ${Number(vd.so_luong)}, ${vd.tinh_trang})`)
      await tx.$executeRaw`
        INSERT INTO vd_bg (ma_vd, ma_bb, so_luong, tinh_trang)
        VALUES ${Prisma.join(insertValues)}
      `

      // Hành động 3: Hậu điều kiện - Cập nhật trạng thái Giường sang "Đang sử dụng"
      await tx.$executeRaw`
        UPDATE giuong
        SET trang_thai = 'Đang sử dụng'
        FROM dat_coc_giuong dcg
        JOIN hop_dong_thue hdt ON hdt.ma_pdc = dcg.ma_pdc
        WHERE giuong.ma_phong = dcg.ma_phong
          AND giuong.ma_giuong = dcg.ma_giuong
          AND hdt.ma_hdt = ${ma_hdt}
      `
    })

    // Luồng chính: Thành công
    res.json({ message: 'Lập biên bản thành công' })
  } catch (error) {
    console.error('Lỗi createBienBanBanGiao:', error)
    res.status(500).json({ message: 'Đã có lỗi xảy ra khi lưu biên bản.' })
  }
}


export const getBienBanHistoryDetail = async (req, res) => {
  try {
    const { ma_hdt } = req.params;
    const employee = await getCurrentEmployee(req);
    if (!employee) return res.status(401).json({ message: 'Không tìm thấy thông tin nhân viên' });

    // 1. Lấy thông tin hợp đồng và biên bản
    const contractRows = await prisma.$queryRaw`
      SELECT 
        hdt.ma_hdt,
        kh.ten_kh AS ten_khach_hang,
        CONCAT(dcg.ma_phong, ' - ', dcg.ma_giuong) AS phong_giuong,
        pthd.trang_thai AS trang_thai_phieu_thu,
        bb.ma_bb,
        bb.ngay_bg,
        bb.tinh_trang_vs
      FROM bien_ban_ban_giao bb
      JOIN hop_dong_thue hdt ON bb.ma_hdt = hdt.ma_hdt
      JOIN khach_thue kt ON hdt.ma_hdt = kt.ma_hdt
      JOIN khach_hang kh ON kt.ma_kh = kh.ma_kh
      JOIN phieu_dat_coc pdc ON hdt.ma_pdc = pdc.ma_pdc
      JOIN dat_coc_giuong dcg ON pdc.ma_pdc = dcg.ma_pdc
      LEFT JOIN pt_hop_dong pthd ON hdt.ma_hdt = pthd.ma_hdt
      WHERE hdt.ma_hdt = ${ma_hdt}
      LIMIT 1
    `;

    if (contractRows.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy lịch sử biên bản.' });
    }

    const contract = contractRows[0];

    // 2. Lấy danh sách chi tiết vật dụng trong biên bản đó từ vd_bg
    const items = await prisma.$queryRaw`
      SELECT 
        vdbg.ma_vd,
        vd.ten_vd,
        vdbg.so_luong,
        vdbg.tinh_trang
      FROM vd_bg vdbg
      JOIN vat_dung vd ON vdbg.ma_vd = vd.ma_vd
      WHERE vdbg.ma_bb = ${contract.ma_bb}
    `;

    res.json({
      data: {
        contract,
        items
      }
    });
  } catch (error) {
    console.error('Lỗi getBienBanHistoryDetail:', error);
    res.status(500).json({ message: 'Lỗi server khi lấy chi tiết lịch sử bàn giao' });
  }
};