import PhieuThuHopDong from '../entities/PhieuThuHopDong.js'
import HopDongThue from '../entities/HopDongThue.js'
import { NhanVienDB } from '../database/HoTroBoiThuongDB.js'
import { guiEmailYeuCauThanhToanHopDong } from '../utils/guiMailPTHD.js'
import { inPTHopDong } from '../utils/inPTHopDong.js'

async function getNhanVienHienTai(maNv) {
  return NhanVienDB.LoadNV(maNv)
}

async function boSungDanhSachGiuong(pthd) {
  if (!pthd || (Array.isArray(pthd.dsGiuong) && pthd.dsGiuong.length > 0)) {
    return pthd
  }

  const thongTinHopDong = await HopDongThue.LoadChiTietTinhTien(pthd.maHDT)
  if (!thongTinHopDong) return pthd

  return {
    ...pthd,
    ...thongTinHopDong,
    maPTHD: pthd.maPTHD,
    ngay: pthd.ngay,
    ngayThanhToan: pthd.ngayThanhToan,
    ghiChu: pthd.ghiChu,
    trangThai: pthd.trangThai,
    tongTien: pthd.tongTien,
    maNVKeToan: pthd.maNVKeToan,
    maNVCapNhat: pthd.maNVCapNhat,
    tenNVKeToan: pthd.tenNVKeToan,
  }
}

export async function loadDSPTHDChoXuLy(req, res) {
  try {
    const nv = req.auth
    if (!nv?.ma_nv) return res.status(401).json({ message: 'Chưa đăng nhập.' })

    const nvHienTai = await getNhanVienHienTai(nv.ma_nv)
    if (!nvHienTai) return res.status(404).json({ message: 'Không tìm thấy nhân viên.' })

    const danhSach = await HopDongThue.LoadDSHDCanLap(nvHienTai.ma_cn)
    return res.json({ data: danhSach })
  } catch (error) {
    console.error('loadDSPTHDChoXuLy:', error)
    return res.status(500).json({ message: 'Không thể tải danh sách hợp đồng đến hạn.' })
  }
}

export async function timKiemPTHDChoXuLy(req, res) {
  try {
    const nv = req.auth
    if (!nv?.ma_nv) return res.status(401).json({ message: 'Chưa đăng nhập.' })

    const tuKhoa = String(req.query.tuKhoa || '').trim()
    const nvHienTai = await getNhanVienHienTai(nv.ma_nv)
    if (!nvHienTai) return res.status(404).json({ message: 'Không tìm thấy nhân viên.' })

    const danhSach = await HopDongThue.TimKiem(tuKhoa, nvHienTai.ma_cn)
    return res.json({ data: danhSach })
  } catch (error) {
    console.error('timKiemPTHDChoXuLy:', error)
    return res.status(500).json({ message: 'Tìm kiếm thất bại.' })
  }
}

export async function loadThongTinLapPTHD(req, res) {
  try {
    const nv = req.auth
    if (!nv?.ma_nv) return res.status(401).json({ message: 'Chưa đăng nhập.' })

    const { maHDT } = req.params
    if (!maHDT) return res.status(400).json({ message: 'Thiếu mã hợp đồng.' })

    const thongTin = await HopDongThue.LoadChiTietTinhTien(maHDT)
    if (!thongTin) {
      return res.status(409).json({ message: 'Hợp đồng chưa đủ điều kiện để lập phiếu thu.' })
    }

    return res.json({ data: thongTin })
  } catch (error) {
    console.error('loadThongTinLapPTHD:', error)
    return res.status(500).json({ message: 'Không thể tải thông tin hợp đồng.' })
  }
}

export async function lapVaLuuPTHD(req, res) {
  try {
    const nv = req.auth
    if (!nv?.ma_nv) return res.status(401).json({ message: 'Chưa đăng nhập.' })

    const { maHDT } = req.body
    if (!maHDT) return res.status(400).json({ message: 'Thiếu mã hợp đồng.' })

    const thongTin = await HopDongThue.LoadChiTietTinhTien(maHDT)
    if (!thongTin) {
      return res.status(409).json({ message: 'Hợp đồng chưa đủ điều kiện để lập phiếu thu.' })
    }

    const pthdMoi = await PhieuThuHopDong.ThemPTHD({
      maHDT,
      tongTien: thongTin.tongTien,
      nvKeToan: nv.ma_nv,
      ghiChu: null
    })
    

    const pthdChiTiet = await PhieuThuHopDong.LoadPTHD(pthdMoi.maPTHD)
    const pthdHoanChinh = {
      ...pthdChiTiet,
      kyHienTai: thongTin.kyHienTai,
      dsGiuong: thongTin.dsGiuong,
    }
    const guiEmailThanhCong = await guiEmailYeuCauThanhToanHopDong(pthdHoanChinh)

    return res.status(201).json({
      data: pthdHoanChinh,
      message: guiEmailThanhCong
        ? 'Tạo phiếu thu hợp đồng thành công.'
        : 'Tạo phiếu thu hợp đồng thành công nhưng gửi email thất bại.',
      warning: guiEmailThanhCong ? undefined : 'Email gửi thất bại.',
    })
  } catch (error) {
    console.error('lapVaLuuPTHD:', error)
    return res.status(500).json({ message: 'Không thể tạo phiếu thu hợp đồng.' })
  }
}

export async function loadDSPTHDDaLapHomNay(req, res) {
  try {
    const nv = req.auth
    if (!nv?.ma_nv) return res.status(401).json({ message: 'Chưa đăng nhập.' })

    const danhSach = await PhieuThuHopDong.LoadDSPTHDDaLapHomNay(nv.ma_nv)
    return res.json({ data: danhSach })
  } catch (error) {
    console.error('loadDSPTHDDaLapHomNay:', error)
    return res.status(500).json({ message: 'Không thể tải danh sách phiếu thu đã lập hôm nay.' })
  }
}

export async function xemChiTietPTHD(req, res) {
  try {
    const { maPTHD } = req.params
    const pthd = await PhieuThuHopDong.LoadPTHD(maPTHD)
    if (!pthd) return res.status(404).json({ message: 'Không tìm thấy phiếu thu.' })

    return res.json({ data: await boSungDanhSachGiuong(pthd) })
  } catch (error) {
    console.error('xemChiTietPTHD:', error)
    return res.status(500).json({ message: 'Không thể tải chi tiết phiếu thu.' })
  }
}

export async function inPhieuThuPDF(req, res) {
  try {
    const { maPTHD } = req.params
    const pthd = await PhieuThuHopDong.LoadPTHD(maPTHD)
    if (!pthd) return res.status(404).json({ message: 'Không tìm thấy phiếu thu.' })

    const pthdCoGiuong = await boSungDanhSachGiuong(pthd)
    const filePath = await inPTHopDong(pthdCoGiuong)
    return res.download(filePath, `${pthd.maPTHD}.pdf`)
  } catch (error) {
    console.error('inPhieuThuPDF:', error)
    return res.status(500).json({ message: 'Không thể xuất file PDF.' })
  }
}