import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import PageTitle from '../../components/common/PageTitle.jsx'
import api from '../../services/api.js'
import { BriefcaseBusiness, Home, UserRound, ChevronLeft, ChevronRight, Search, Printer, ArrowLeft, CircleCheck } from 'lucide-react'
const ROOM_IMAGE =
  'https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?auto=format&fit=crop&w=900&q=80'

const DEFAULT_FILTERS = {
  chi_nhanh: '',
  loai_phong: '',
  trang_thai: 'Trống',
}

const DEFAULT_OPTIONS = {
  chi_nhanh: [{ value: '', label: 'Tất cả chi nhánh' }],
  loai_phong: [{ value: '', label: 'Tất cả loại phòng' }],
  trang_thai: [{ value: '', label: 'Tất cả tình trạng' }],
  tieu_chi: [],
}

const HO_SO_BADGE = {
  'Mới tiếp nhận': { bg: '#eef2e8', color: '#3b4f27' },
  'Đã hẹn': { bg: '#f7deef', color: '#9b5f8e' },
  'Đã chốt cọc': { bg: '#e3f0e1', color: '#2e7d32' },
  'Hủy yêu cầu': { bg: '#fbe4e1', color: '#c0392b' },
}

const PDC_BADGE = {
  'Chờ thanh toán': { bg: '#fef3c7', color: '#b45309' },
  'Quá hạn': { bg: '#fee2e2', color: '#b91c1c' },
  'Hoàn tất': { bg: '#dcfce7', color: '#15803d' },
  'Đã hủy': { bg: '#f1f5f9', color: '#475569' },
  'Chờ duyệt': { bg: '#3b4f27', color: '#ffffff' }, 
}

const PT_BADGE = {
  'Chưa thanh toán': { bg: '#fee2e2', color: '#b91c1c' },
  'Đã thanh toán': { bg: '#dcfce7', color: '#15803d' },
}



const IconEye = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
const IconArrowLeft = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
const IconPrinter = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
const IconExternalLink = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>



const BED_BADGE = {
  Trống: { bg: '#e2f8e5', color: '#56c76a' },
  'Đã đặt cọc': { bg: '#fff0b8', color: '#d3a62a' },
  'Đang sử dụng': { bg: '#ffd2d7', color: '#ff5c65' },
  'Đang bảo trì': { bg: '#eeeeee', color: '#8e908f' },
}

const money = (value) => `${Number(value || 0).toLocaleString('vi-VN')} đ`

const IconSearch = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
)

const IconRefresh = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 4 23 10 17 10" />
    <polyline points="1 20 1 14 7 14" />
    <path d="M3.51 9a9 9 0 0 1 14.13-3.36L23 10M1 14l5.36 4.36A9 9 0 0 0 20.49 15" />
  </svg>
)

const IconEdit = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 20h9" />
    <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L8 18l-4 1 1-4 11.5-11.5z" />
  </svg>
)

const IconCheckCircle = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="9" />
    <path d="m9 12 2 2 4-4" />
  </svg>
)

function Badge({ label, map = HO_SO_BADGE }) {
  const style = map[label] || { bg: '#eceee8', color: '#6b7560' }
  return <span style={{ ...S.badge, backgroundColor: style.bg, color: style.color }}>{label}</span>
}

function StepIndicator({ step }) {
  return (
    <div style={S.stepRow}>
      <div style={S.stepItem}>
        <div style={{ ...S.stepCircle, ...(step >= 1 ? S.stepCircleActive : {}) }}>1</div>
        <span style={{ ...S.stepLabel, ...(step === 1 ? S.stepLabelActive : {}) }}>Tra cứu phòng/giường</span>
      </div>
      <div style={{ ...S.stepLine, ...(step >= 2 ? S.stepLineActive : {}) }} />
      <div style={S.stepItem}>
        <div style={{ ...S.stepCircle, ...(step >= 2 ? S.stepCircleActive : {}) }}>2</div>
        <span style={{ ...S.stepLabel, ...(step === 2 ? S.stepLabelActive : {}) }}>Lập phiếu đặt cọc</span>
      </div>
    </div>
  )
}
// ==========================================
// COMPONENT: VIEW DANH SÁCH PHIẾU ĐẶT CỌC (ĐÃ PHÂN TRANG)
// ==========================================
function PhieuDatCocListView({ onSelectPDC }) {
  const [search, setSearch] = useState('')
  const [pdcList, setPdcList] = useState([])
  const [loading, setLoading] = useState(false)
  
  // State phân trang
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 4 

  const fetchDanhSachPDC = async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/phieu-dat-coc', { params: { search } })
      setPdcList(data?.items || [])
      setCurrentPage(1) // Reset về trang 1 khi tìm kiếm
    } catch (error) {
      setPdcList([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchDanhSachPDC() }, [])

  // Tính toán dữ liệu hiển thị cho trang hiện tại
  const totalItems = pdcList.length
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))
  const startIndex = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1
  const endIndex = Math.min(currentPage * pageSize, totalItems)
  const currentData = pdcList.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  return (
    <div className="overflow-hidden rounded-[18px] border border-[#d9ddd2] bg-white shadow-[0_8px_24px_rgba(33,41,21,0.04)] mt-5">
      <div className="border-b border-[#e2e5dd] px-6 py-6 sm:px-8">
        <div className="flex w-full xl:max-w-[420px]">
          <label className="relative block w-full">
            <Search size={22} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#8f938b]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchDanhSachPDC()}
              placeholder="Tìm theo Mã phiếu, Khách hàng, CCCD..."
              className="h-[54px] w-full rounded-[8px] border border-[#d7dbd1] bg-white pl-13 pr-4 text-[16px] text-[#31372b] outline-none transition placeholder:text-[#a1a69d] focus:border-[#9ead89]"
            />
          </label>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-[960px] w-full border-collapse">
          <thead>
            <tr className="bg-[#f8f8f6] text-left text-[14px] font-bold text-[#616659] uppercase tracking-wider">
              <th className="px-8 py-5">Mã phiếu</th>
              <th className="px-5 py-5">Khách hàng</th>
              <th className="px-5 py-5">CCCD/SĐT</th>
              <th className="px-5 py-5">Phòng/Giường</th>
              <th className="px-5 py-5">Ngày lập</th>
              <th className="px-5 py-5 text-right">Số tiền cọc</th>
              <th className="px-5 py-5">Hạn thanh toán</th>
              <th className="px-5 py-5">Trạng thái</th>
              <th className="px-8 py-5 text-center">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="9" className="px-8 py-14 text-center text-[16px] text-[#74796f]">Đang tải dữ liệu từ hệ thống...</td></tr>
            ) : currentData.length === 0 ? (
              <tr><td colSpan="9" className="px-8 py-14 text-center text-[16px] text-[#74796f]">Không tìm thấy phiếu đặt cọc nào.</td></tr>
            ) : (
              currentData.map((item) => (
                <tr key={item.maPDC} className="border-t border-[#e7e9e2] text-[15px] font-medium text-[#444a3f]">
                  <td className="px-8 py-5 font-bold text-[#2d3725]">{item.maPDC}</td>
                  <td className="px-5 py-5 text-[#343a2f] font-semibold">{item.tenKH}</td>
                  <td className="px-5 py-5 text-[#5f645b]">{item.cccd}</td>
                  <td className="px-5 py-5">{item.phong} - {item.giuong}</td>
                  <td className="px-5 py-5 text-[#5b6056]">{item.ngayLap}</td>
                  <td className="px-5 py-5 text-right font-bold text-[#1f2937]">{money(item.soTien)}</td>
                  <td className="px-5 py-5 text-[#5b6056]">{item.hanTT}</td>
                  <td className="px-5 py-5"><Badge label={item.trangThai} map={PDC_BADGE} /></td>
                  <td className="px-8 py-5">
                    <div className="flex items-center justify-center">
                      <button onClick={() => onSelectPDC(item)} className="text-[#8e9389] transition hover:text-[#465c2d]" title="Xem chi tiết">
                        <IconEye />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Footer Phân trang */}
      <div className="flex flex-col gap-4 border-t border-[#e2e5dd] px-6 py-5 text-[15px] text-[#666b62] sm:px-8 lg:flex-row lg:items-center lg:justify-between bg-white">
        <p className="font-medium">
          {totalItems === 0 ? 'Hiển thị 0 kết quả' : `Hiển thị ${startIndex} - ${endIndex} của ${totalItems} kết quả`}
        </p>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} 
            disabled={currentPage === 1}
            className="inline-flex h-10 w-10 items-center justify-center rounded-[10px] border border-[#d9ddd2] bg-white text-[#7d8277] transition hover:border-[#b9c2ad] hover:text-[#45592d] disabled:opacity-45"
          >
            <ChevronLeft size={18} />
          </button>
          <span className="min-w-[90px] text-center text-[16px] font-semibold text-[#474d40]">
            {currentPage} / {totalPages}
          </span>
          <button 
            onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))} 
            disabled={currentPage === totalPages}
            className="inline-flex h-10 w-10 items-center justify-center rounded-[10px] border border-[#d9ddd2] bg-white text-[#7d8277] transition hover:border-[#b9c2ad] hover:text-[#45592d] disabled:opacity-45"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
    </div>
  )
}


function PhieuDatCocDetailView({ phieu, onBack,onCreateNewPDC }) {
  if (!phieu) return null
  const [isCanceling, setIsCanceling] = useState(false)
  const [cancelError, setCancelError] = useState('')
  const [isPrinting, setIsPrinting] = useState(false)
  
  const [timeLeft, setTimeLeft] = useState('00:00:00')

  useEffect(() => {
    if (phieu?.trangThai !== 'Chờ thanh toán' || !phieu?.hanTT) return

    const [datePart, timePart] = phieu.hanTT.split(' ')
    if (!datePart || !timePart) return
    const [day, month, year] = datePart.split('/')
    const [hour, minute] = timePart.split(':')
    const targetTime = new Date(year, month - 1, day, hour, minute).getTime()

    const timer = setInterval(() => {
      const now = new Date().getTime()
      const diff = targetTime - now

      if (diff <= 0) {
        setTimeLeft('00:00:00')
        clearInterval(timer)
      } else {
        const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
        const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
        const s = Math.floor((diff % (1000 * 60)) / 1000)
        setTimeLeft(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`)
      }
    }, 1000)

    return () => clearInterval(timer)
  }, [phieu])
  const handleCancelPDC = async () => {
    if (!window.confirm(`Bạn có chắc chắn muốn hủy phiếu đặt cọc ${phieu.maPDC} không?`)) return
    setIsCanceling(true)
    setCancelError('')
    try {
      // Gọi API PATCH để hủy phiếu
      await api.patch(`/phieu-dat-coc/${phieu.maPDC}/cancel`)
      onRefreshList() // Cập nhật lại danh sách và đóng màn chi tiết
      onBack() 
    } catch (err) {
      setCancelError(err.response?.data?.message || 'Không thể hủy phiếu đặt cọc.')
    } finally {
      setIsCanceling(false)
    }
  }

  const handlePrintPDC = async () => {
    setIsPrinting(true)
    try {
      // Giả lập gọi API tạo file PDF từ backend
      const response = await api.get(`/phieu-dat-coc/${phieu.maPDC}/print`, { responseType: 'blob' })
      const fileUrl = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }))
      window.open(fileUrl, '_blank') // Mở file PDF sang tab mới để in
    } catch (err) {
      alert('Không thể tải file in. Vui lòng thử lại.')
    } finally {
      setIsPrinting(false)
    }
  }
  const renderAlertBanner = () => {
    switch(phieu.trangThai) {
      case 'Quá hạn':
        return (
          <div className="mb-6 flex gap-3 rounded-lg border border-[#fecaca] bg-[#fef2f2] p-4 text-[#b91c1c]">
            <span className="font-bold">⚠</span>
            <div><strong className="block text-[15px]">Phiếu đặt cọc đã quá hạn thanh toán.</strong><span className="text-[14px]">Phòng/Giường đã được trả về trạng thái Trống.</span></div>
          </div>
        )
      case 'Hoàn tất':
        return (
          <div className="mb-6 flex gap-3 rounded-lg border border-[#bbf7d0] bg-[#f0fdf4] p-4 text-[#15803d]">
            <CircleCheck size={20} className="mt-0.5" />
            <span className="text-[15px] font-medium">Phiếu đặt cọc đã hoàn tất. Thanh toán đã được Quản lý xác nhận hợp lệ.</span>
          </div>
        )
      case 'Đã hủy':
        return (
          <div className="mb-6 flex gap-3 rounded-lg border border-[#e5e7eb] bg-[#f3f4f6] p-4 text-[#4b5563]">
            <span className="font-bold">ⓘ</span>
            <span className="text-[15px] font-medium">Phiếu đặt cọc đã bị hủy. Hồ sơ không còn giữ chỗ cho phòng/giường này.</span>
          </div>
        )
      case 'Chờ duyệt':
        return (
          <div className="mb-6 flex gap-3 rounded-lg border border-[#dbeafe] bg-[#eff6ff] p-4 text-[#1d4ed8]">
            <span className="font-bold">ⓘ</span>
            <span className="text-[15px] font-medium">Phiếu đặt cọc đang chờ Quản lý duyệt.</span>
          </div>
        )
      default: return null
    }
  }

  // Các thẻ thông tin (Cards)
  const CardKhachHang = () => (
    <div className="rounded-[12px] border border-[#e5e7eb] bg-white shadow-sm overflow-hidden">
      <div className="flex items-center gap-2 border-b border-[#f3f4f6] bg-[#fafafa] px-5 py-4 text-[#374151]">
        <UserRound size={18} />
        <h3 className="font-bold text-[16px] text-[#111827]">Thông tin chung & Khách hàng</h3>
      </div>
      <div className="grid grid-cols-2 gap-y-5 gap-x-6 p-5">
        <div><span className="block text-[11px] font-bold text-[#6b7280] uppercase">Mã phiếu</span><span className="text-[15px] font-bold text-[#111827]">{phieu.maPDC}</span></div>
        <div><span className="block text-[11px] font-bold text-[#6b7280] uppercase">Ngày lập</span><span className="text-[15px] text-[#111827]">{phieu.ngayLap}</span></div>
        <div><span className="block text-[11px] font-bold text-[#6b7280] uppercase">Tên khách hàng</span><span className="text-[15px] font-bold text-[#111827]">{phieu.tenKH}</span></div>
        <div><span className="block text-[11px] font-bold text-[#6b7280] uppercase">SĐT</span><span className="text-[15px] text-[#111827]">{phieu.sdt || phieu.cccd}</span></div>
        <div><span className="block text-[11px] font-bold text-[#6b7280] uppercase">CCCD/CMND</span><span className="text-[15px] text-[#111827]">{phieu.cccd}</span></div>
        <div><span className="block text-[11px] font-bold text-[#6b7280] uppercase">Email</span><span className="text-[15px] text-[#111827]">{phieu.email}</span></div>
      </div>
    </div>
  )

  const CardPhongGiuong = () => (
    <div className="rounded-[12px] border border-[#e5e7eb] bg-white shadow-sm overflow-hidden">
      <div className="flex items-center gap-2 border-b border-[#f3f4f6] bg-[#fafafa] px-5 py-4 text-[#374151]">
        <Home size={18} />
        <h3 className="font-bold text-[16px] text-[#111827]">Thông tin Phòng/Giường</h3>
      </div>
      <div className="p-5">
        <div className="mb-5 rounded-md bg-[#f4f5f1] px-4 py-3 text-[14px] font-semibold text-[#3b4f27]">
           {phieu.coSo || 'Chưa cập nhật'}
        </div>
        <div className="grid grid-cols-2 gap-y-5">
          <div><span className="block text-[11px] font-bold text-[#6b7280] uppercase">Phòng</span><span className="text-[15px] text-[#111827]">{phieu.phong}</span></div>
          <div><span className="block text-[11px] font-bold text-[#6b7280] uppercase">Giường</span><span className="text-[15px] text-[#111827]">{phieu.giuong}</span></div>
        </div>
      </div>
    </div>
  )

  const CardThanhToan = () => (
    <div className="rounded-[12px] border border-[#e5e7eb] bg-white shadow-sm overflow-hidden">
      <div className="flex items-center gap-2 border-b border-[#f3f4f6] bg-[#fafafa] px-5 py-4 text-[#374151]">
        <BriefcaseBusiness size={18} />
        <h3 className="font-bold text-[16px] text-[#111827]">Thông tin thanh toán</h3>
      </div>
      <div className="p-5 space-y-4">
        <div className="flex justify-between items-center bg-[#f9fafb] p-3 rounded-lg border border-[#e5e7eb]">
          <span className="text-[13px] font-bold text-[#4b5563] uppercase">Số tiền</span>
          <span className="text-[18px] font-extrabold text-[#111827]">{money(phieu.soTien)}</span>
        </div>
        <div className="flex justify-between text-[14px]"><span className="text-[#6b7280]">Hình thức</span><span className="font-medium">{phieu.hinhThucTT || 'Chuyển khoản'}</span></div>
        {phieu.ptMa && <div className="flex justify-between text-[14px]"><span className="text-[#6b7280]">Mã phiếu thu</span><span className="font-bold text-[#3b4f27] cursor-pointer hover:underline">{phieu.ptMa}</span></div>}
        <div className="flex justify-between text-[14px] items-center"><span className="text-[#6b7280]">Trạng thái</span><Badge label={phieu.ptTrangThai} map={PT_BADGE} /></div>
        {phieu.hanTT && phieu.trangThai !== 'Đã hủy' && (
          <div className="flex justify-between text-[14px]">
            <span className="text-[#6b7280]">{phieu.ngayTT ? 'Ngày thanh toán' : 'Hạn thanh toán'}</span>
            <span className={`font-bold ${phieu.trangThai === 'Quá hạn' ? 'text-[#b91c1c]' : 'text-[#111827]'}`}>{phieu.ngayTT || phieu.hanTT}</span>
          </div>
        )}
      </div>
    </div>
  )

  // Layout linh hoạt theo đúng bản thiết kế
  const isPending = phieu.trangThai === 'Chờ thanh toán'
  const isCanceled = phieu.trangThai === 'Đã hủy'

  return (
    <div className="bg-white rounded-[16px] border border-[#e5e7eb] p-8 shadow-sm">
      
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="flex items-center gap-2 text-[#4b5563] hover:text-[#111827] transition font-medium">
            <ArrowLeft size={20} /> Quay lại danh sách
          </button>
          <h2 className="text-[24px] font-extrabold text-[#111827] ml-2">Chi tiết phiếu đặt cọc {phieu.maPDC}</h2>
          <Badge label={phieu.trangThai} map={PDC_BADGE} />
        </div>
        <button 
          onClick={handlePrintPDC} 
          disabled={isPrinting}
          className="flex items-center gap-2 rounded-lg border border-[#d1d5db] px-4 py-2 text-[14px] font-semibold text-[#374151] hover:bg-gray-50 transition disabled:opacity-50"
        >
          <Printer size={16} /> {isPrinting ? 'Đang tải...' : 'In phiếu'}
        </button>
      </div>

      {renderAlertBanner()}

      {/* Grid Layout thông minh */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Cột trái (Chiếm 2 phần) */}
        <div className="lg:col-span-2 space-y-6">
          <CardKhachHang />
          {isCanceled ? <CardThanhToan /> : <CardPhongGiuong />}
          {isCanceled ? <CardPhongGiuong /> : null}
        </div>

        {/* Cột phải (Chiếm 1 phần) */}
        <div className="space-y-6">
          {isPending && (
            <div className="rounded-[12px] border border-[#fef08a] bg-[#fffbeb] shadow-sm overflow-hidden text-center p-6">
              <span className="block text-[14px] font-bold text-[#b45309] uppercase mb-2">Hạn thanh toán</span>
              <div className="text-[28px] font-extrabold text-[#b91c1c] mb-2 tracking-widest">{timeLeft}</div>
              <p className="text-[13px] text-[#92400e]">Khách cần thanh toán trước hạn để giữ chỗ. Quá hạn, phiếu sẽ bị hủy.</p>
            </div>
          )}
          {!isCanceled && <CardThanhToan />}
          
          {/* Nút hành động dời qua cột phải cho Đã Hủy */}
          {isCanceled && (
             <div className="flex justify-end">
               <button onClick={onBack} className="rounded-lg border border-[#d1d5db] bg-white px-6 py-2.5 font-semibold text-[#374151] hover:bg-gray-50 transition w-full">Quay lại</button>
             </div>
          )}
        </div>
      </div>

      {/* Thông báo lỗi nếu hủy thất bại */}
      {cancelError && <div className="mt-4 text-right text-[14px] text-red-600 font-medium">{cancelError}</div>}

      {/* Footer Buttons */}
      {!isCanceled && (
        <div className="mt-4 flex justify-end gap-3 border-t border-[#e5e7eb] pt-6">
          {phieu.trangThai === 'Quá hạn' ? (
            <>
              <button onClick={onBack} className="rounded-lg border border-[#d1d5db] bg-white px-6 py-2.5 font-semibold text-[#374151] hover:bg-gray-50 transition">Quay lại</button>
              <button onClick={onCreateNewPDC} className="rounded-lg bg-[#3b4f27] px-6 py-2.5 font-semibold text-white hover:bg-[#2d3d1e] transition shadow-md">Tạo phiếu đặt cọc mới</button>
            </>
          ) : phieu.trangThai === 'Hoàn tất' || phieu.trangThai === 'Chờ duyệt' ? (
            <button onClick={onBack} className="rounded-lg border border-[#d1d5db] bg-white px-6 py-2.5 font-semibold text-[#374151] hover:bg-gray-50 transition">Quay lại</button>
          ) : (
            <>
              <button 
                onClick={handleCancelPDC}
                disabled={isCanceling}
                className="rounded-lg bg-[#ef4444] px-6 py-2.5 font-semibold text-white hover:bg-[#dc2626] transition shadow-md disabled:opacity-50"
              >
                {isCanceling ? 'Đang xử lý...' : 'Hủy phiếu'}
              </button>
              <button onClick={onBack} className="rounded-lg border border-[#d1d5db] bg-white px-6 py-2.5 font-semibold text-[#374151] hover:bg-gray-50 transition">Quay lại</button>
            </>
          )}
        </div>
      )}
    </div>
  )
}
function ProfileListView({
  tab,
  searchKeyword,
  profiles,
  loading,
  message,
  error,
  onTabChange,
  onSearchChange,
  onSearch,
  onRefresh,
  onChooseProfile,
  // 4 Props mới để truyền dữ liệu cho màn Tra cứu của bạn:
  danhSachView,
  setDanhSachView,
  selectedPDC,
  setSelectedPDC,
  onCreateNewPDC
}) {
  return (
    <section>
      <div style={{ marginBottom: '20px' }}>
        <PageTitle
          title={tab === 'lap-phieu' ? "Lập phiếu đặt cọc" : "Tra cứu phiếu đặt cọc"}
          description={tab === 'lap-phieu' ? "Chọn hồ sơ đã hẹn/chờ đặt cọc để tạo phiếu giữ chỗ phòng/giường cho khách." : "Tìm kiếm, xem chi tiết và kiểm tra trạng thái của phiếu đặt cọc."}
        />
      </div>

      {message ? <div style={S.bannerSuccess}>{message}</div> : null}
      {error ? <div style={S.bannerError}>{error}</div> : null}

      <div style={S.listCard}>
        <div style={S.tabRow}>
          <button
            style={{ ...S.tabBtn, ...(tab === 'lap-phieu' ? S.tabBtnActive : {}) }}
            onClick={() => {
              onTabChange('lap-phieu')
              setDanhSachView('list') // Reset lại view khi đổi tab
            }}
          >
            Lập phiếu đặt cọc
          </button>
          <button
            style={{ ...S.tabBtn, ...(tab === 'danh-sach' ? S.tabBtnActive : {}) }}
            onClick={() => onTabChange('danh-sach')}
          >
            Danh sách phiếu đặt cọc
          </button>
        </div>

        {tab === 'lap-phieu' ? (
          <>
            <div style={S.toolbarRow}>
              <div style={S.searchInputWrap}>
                <span style={S.searchIcon}><IconSearch /></span>
                <input
                  style={S.searchInput}
                  placeholder="Tìm theo tên khách hàng, CCCD"
                  value={searchKeyword}
                  onChange={(event) => onSearchChange(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') onSearch()
                  }}
                />
              </div>

              <button style={S.btnRefresh} onClick={onRefresh}>
                <IconRefresh />
                Làm mới
              </button>
            </div>

            <div style={S.tableWrap}>
              <table style={S.table}>
                <thead>
                  <tr>
                    <th style={S.th}>MÃ HỒ SƠ</th>
                    <th style={S.th}>HỌ TÊN KHÁCH</th>
                    <th style={S.th}>LIÊN HỆ</th>
                    <th style={S.th}>NGÀY TẠO</th>
                    <th style={S.th}>TRẠNG THÁI HỒ SƠ</th>
                    <th style={S.th}>TRẠNG THÁI PHIẾU</th>
                    <th style={{ ...S.th, textAlign: 'center' }}>HÀNH ĐỘNG</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan="7" style={S.emptyCell}>Đang tải danh sách hồ sơ...</td>
                    </tr>
                  ) : profiles.length === 0 ? (
                    <tr>
                      <td colSpan="7" style={S.emptyCell}>Không có hồ sơ nào đang chờ lập phiếu.</td>
                    </tr>
                  ) : profiles.map((profile) => (
                    <tr key={profile.id} style={S.tr}>
                      <td style={S.td}><strong>{profile.id}</strong></td>
                      <td style={S.td}>{profile.customerName}</td>
                      <td style={S.td}>
                        <div>{profile.phone}</div>
                        <div style={S.tdSub}>CCCD: {profile.cccd}</div>
                      </td>
                      <td style={S.td}>{profile.createdAt}</td>
                      <td style={S.td}><Badge label={profile.status} /></td>
                      <td style={S.td}><Badge label="Chưa lập" map={{ 'Chưa lập': { bg: '#eceee8', color: '#6b7560' } }} /></td>
                      <td style={{ ...S.td, textAlign: 'center' }}>
                        <button style={S.btnSmallPrimary} onClick={() => onChooseProfile(profile.id)}>
                          Lập phiếu
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={S.tableFooter}>
              Hiển thị {profiles.length === 0 ? 0 : 1} đến {profiles.length} trong số {profiles.length} kết quả
            </div>
          </>
        ) : danhSachView === 'list' ? (
          <PhieuDatCocListView onSelectPDC={(pdc) => { setSelectedPDC(pdc); setDanhSachView('detail') }} />
        ) : (
          <PhieuDatCocDetailView 
            phieu={selectedPDC} 
            onBack={() => setDanhSachView('list')} 
            onCreateNewPDC={() => onCreateNewPDC(selectedPDC)} 
          />
        )}
      </div>
    </section>
  )
}

function getCriteriaArray(room) {
  if (Array.isArray(room?.tieu_chi)) {
    return room.tieu_chi
  }

  if (room?.tieu_chi_text) {
    return String(room.tieu_chi_text)
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean)
  }

  return []
}

function normalizeRoom(room) {
  const criteria = getCriteriaArray(room)

  return {
    ...room,
    gia_giuong: Number(room.gia_giuong || 0),
    thoi_han_toi_thieu: Number(room.thoi_han_toi_thieu || 0),
    thoi_han_toi_da: Number(room.thoi_han_toi_da || 0),
    hinh_anh: ROOM_IMAGE,
    tien_ich:
      Array.isArray(room.tien_ich) && room.tien_ich.length > 0
        ? room.tien_ich
        : ['WiFi', ...criteria].slice(0, 3),
    tieu_chi: criteria,
    tieu_chi_text: room.tieu_chi_text || criteria.join(', '),
    beds: Array.isArray(room.beds) ? room.beds.map((bed) => ({
      ...bed,
      don_gia: Number(bed.don_gia || 0),
    })) : [],
  }
}

function formatMoneyShort(value) {
  const number = Number(value)
  if (!Number.isFinite(number)) return '0'

  if (number >= 1000000) {
    const million = number / 1000000
    return `${million.toFixed(million % 1 === 0 ? 0 : 1)}tr`
  }

  return new Intl.NumberFormat('vi-VN').format(number)
}

function formatMoney(value) {
  const number = Number(value)
  if (!Number.isFinite(number)) return '0'
  return new Intl.NumberFormat('vi-VN').format(number)
}

function normalizeSearchValue(value) {
  return String(value || '').trim().toLowerCase()
}

function normalizeDigits(value) {
  return String(value || '').replace(/\D/g, '')
}

function formatTermRange(room) {
  const min = Number(room?.thoi_han_toi_thieu || 0)
  const max = Number(room?.thoi_han_toi_da || 0)

  if (!min && !max) return 'Chưa có'
  if (min && max && min === max) return `${min} tháng`
  if (min && max) return `${min} - ${max} tháng`
  if (min) return `Từ ${min} tháng`
  return `Tối đa ${max} tháng`
}

function BedStatusBadge({ status }) {
  return <Badge label={status} map={BED_BADGE} />
}

function RoomDetailModal({ room, onClose }) {
  if (!room) return null

  return (
    <div style={R.modalOverlay}>
      <div style={R.modalBox}>
        <div style={R.modalHeader}>
          <h2 style={R.modalTitle}>
            Phòng: {room.ten_hien_thi || room.ma_phong} - {room.ten_loai}
          </h2>
          <button type="button" style={R.closeButton} onClick={onClose}>×</button>
        </div>

        <div style={R.criteriaLine}>
          <strong>Tiêu chí:</strong> {room.tieu_chi_text || 'Không có tiêu chí đặc biệt'}
        </div>

        <div style={R.criteriaLine}>
          <strong>Thời hạn thuê:</strong> {formatTermRange(room)}
        </div>

        <div style={R.modalTableWrap}>
          <table style={R.modalTable}>
            <thead>
              <tr>
                <th style={R.modalTh}>Mã giường</th>
                <th style={R.modalTh}>Trạng thái</th>
                <th style={{ ...R.modalTh, textAlign: 'right' }}>Đơn giá (VNĐ/Tháng)</th>
              </tr>
            </thead>
            <tbody>
              {room.beds.length === 0 ? (
                <tr>
                  <td colSpan="3" style={R.modalEmptyCell}>Không có dữ liệu giường.</td>
                </tr>
              ) : room.beds.map((bed) => (
                <tr key={bed.ma_giuong} style={R.modalTr}>
                  <td style={R.modalTd}><strong>{bed.ma_giuong}</strong></td>
                  <td style={R.modalTd}><BedStatusBadge status={bed.trang_thai} /></td>
                  <td style={{ ...R.modalTd, textAlign: 'right', fontWeight: 700 }}>{formatMoney(bed.don_gia)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={R.modalFooter}>
          <button type="button" style={R.btnCancel} onClick={onClose}>Hủy bỏ</button>
        </div>
      </div>
    </div>
  )
}

function SearchRoomView({ profile, onBack, onNext, onCancelProfile }) {
  const navigate = useNavigate()
  const [search, setSearch] = useState(profile?.id || '')
  const [filters, setFilters] = useState(DEFAULT_FILTERS)
  const [criteria, setCriteria] = useState([])
  const [appliedCriteria, setAppliedCriteria] = useState([])
  const [options, setOptions] = useState(DEFAULT_OPTIONS)
  const [rooms, setRooms] = useState([])
  const [loadingOptions, setLoadingOptions] = useState(false)
  const [loadingRooms, setLoadingRooms] = useState(false)
  const [selectedRoom, setSelectedRoom] = useState(null)

  const filteredRooms = useMemo(() => {
    if (appliedCriteria.length === 0) return rooms

    return rooms.filter((room) => {
      const roomCriteria = getCriteriaArray(room)
      return appliedCriteria.some((item) => roomCriteria.includes(item))
    })
  }, [rooms, appliedCriteria])

  useEffect(() => {
    setSearch(profile?.id || '')
  }, [profile?.id])

  const fetchOptions = async () => {
    setLoadingOptions(true)
    try {
      const response = await api.get('/tra-cuu-phong-giuong/options')
      const data = response.data || {}
      setOptions({
        chi_nhanh: data.chi_nhanh || DEFAULT_OPTIONS.chi_nhanh,
        loai_phong: data.loai_phong || DEFAULT_OPTIONS.loai_phong,
        trang_thai: data.trang_thai || DEFAULT_OPTIONS.trang_thai,
        tieu_chi: data.tieu_chi || DEFAULT_OPTIONS.tieu_chi,
      })
    } catch {
      setOptions(DEFAULT_OPTIONS)
    } finally {
      setLoadingOptions(false)
    }
  }

  const fetchRooms = async (
    currentFilters = filters,
    currentCriteria = criteria,
    currentSearch = search,
  ) => {
    setLoadingRooms(true)
    try {
      const params = {}

      if (currentSearch.trim()) params.search = currentSearch.trim()
      if (currentFilters.chi_nhanh) params.chi_nhanh = currentFilters.chi_nhanh
      if (currentFilters.loai_phong) params.loai_phong = currentFilters.loai_phong
      if (currentFilters.trang_thai) params.trang_thai = currentFilters.trang_thai
      if (currentCriteria.length > 0) params.tieu_chi = currentCriteria.join(',')

      const response = await api.get('/tra-cuu-phong-giuong', { params })
      const data = Array.isArray(response.data) ? response.data : []
      setRooms(data.map(normalizeRoom))
      setAppliedCriteria(currentCriteria)
    } catch {
      setRooms([])
    } finally {
      setLoadingRooms(false)
    }
  }

  useEffect(() => {
    fetchOptions()
    fetchRooms(DEFAULT_FILTERS, [], profile?.id || '')
  }, [profile?.id])

  const toggleCriteria = (item) => {
    setCriteria((current) => (
      current.includes(item)
        ? current.filter((value) => value !== item)
        : [...current, item]
    ))
  }

  const setFilter = (key, value) => {
    setFilters((current) => ({ ...current, [key]: value }))
  }

  const requiredBeds = Number(String(profile?.peopleCount || '').replace(/[^\d]/g, '') || 0)

  return (
    <section>
      <div style={{ marginBottom: '20px' }}>
        <PageTitle
          title="Lập phiếu đặt cọc"
          description="Vui lòng tra cứu hồ sơ và kiểm tra tình trạng phòng/giường trước khi lập phiếu đặt cọc."
        />
      </div>

      <div style={S.formCard}>
        <StepIndicator step={1} />

        <div style={R.profileBanner}>
          Hồ sơ <strong>{profile?.id}</strong> | {profile?.customerName} | {profile?.rentType} | {requiredBeds} người
        </div>

        <section style={R.page}>
          <div style={R.searchCard}>
            <div style={R.searchRow}>
              <div style={R.searchInputWrap}>
                <span style={R.searchIcon}><IconSearch /></span>
                <input
                  style={R.searchInput}
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') fetchRooms(filters, criteria, search)
                  }}
                  placeholder="Nhập mã hồ sơ đăng ký, CCCD, tên khách hàng hoặc số điện thoại"
                />
              </div>

              <button type="button" style={R.btnSearch} onClick={() => fetchRooms(filters, criteria, search)}>
                {loadingRooms ? 'Đang tải...' : 'Tìm kiếm'}
              </button>
            </div>

            <div style={R.filterGrid}>
              <div>
                <label style={R.label}>Chi nhánh</label>
                <select
                  style={R.select}
                  value={filters.chi_nhanh}
                  onChange={(event) => setFilter('chi_nhanh', event.target.value)}
                  disabled={loadingOptions}
                >
                  {options.chi_nhanh.map((option) => (
                    <option key={option.value || 'all'} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={R.label}>Loại phòng</label>
                <select
                  style={R.select}
                  value={filters.loai_phong}
                  onChange={(event) => setFilter('loai_phong', event.target.value)}
                  disabled={loadingOptions}
                >
                  {options.loai_phong.map((option) => (
                    <option key={option.value || 'all'} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={R.label}>Tình trạng</label>
                <select
                  style={R.select}
                  value={filters.trang_thai}
                  onChange={(event) => setFilter('trang_thai', event.target.value)}
                  disabled={loadingOptions}
                >
                  {options.trang_thai.map((option) => (
                    <option key={option.value || 'all'} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div style={R.criteriaSection}>
            <div style={R.criteriaTitle}>
              <IconCheckCircle />
              <span>TIỆN ÍCH & YÊU CẦU ĐẶC BIỆT</span>
            </div>

            <div style={R.criteriaGrid}>
              {options.tieu_chi.length === 0 ? (
                <p style={R.criteriaEmptyText}>Chưa có tiêu chí phòng.</p>
              ) : (
                options.tieu_chi.map((option) => (
                  <label key={option.value} style={R.checkboxLabel}>
                    <input
                      type="checkbox"
                      checked={criteria.includes(option.value)}
                      onChange={() => toggleCriteria(option.value)}
                    />
                    <span style={R.checkboxText}>{String(option.label).toUpperCase()}</span>
                  </label>
                ))
              )}
            </div>
          </div>

          {loadingRooms ? (
            <div style={R.emptyBox}>
              <p style={R.emptyText}>Đang tải danh sách phòng...</p>
            </div>
          ) : filteredRooms.length > 0 ? (
            <div style={R.roomGrid}>
              {filteredRooms.map((room) => (
                <article key={room.ma_phong} style={R.roomCard}>
                  <div style={R.imageWrap}>
                    <img src={ROOM_IMAGE} alt={room.ten_hien_thi || room.ma_phong} style={R.roomImage} />
                    <span style={R.statusBadge}>{room.trang_thai}</span>
                  </div>

                  <div style={R.roomBody}>
                    <div style={R.roomTop}>
                      <div style={R.roomInfo}>
                        <h3 style={R.roomCode}>{room.ten_hien_thi || room.ma_phong}</h3>
                        <p style={R.roomType}>Loại: {room.ten_loai}</p>
                        <p style={R.roomTerm}>Thời hạn: {formatTermRange(room)}</p>
                      </div>

                      <div style={R.priceBox}>
                        <strong>{formatMoneyShort(room.gia_giuong)}</strong>
                        <span>/THÁNG</span>
                      </div>
                    </div>

                    <div style={R.chipRow}>
                      {room.tien_ich.map((item) => (
                        <span key={item} style={R.chip}>{item}</span>
                      ))}
                    </div>

                    <button type="button" style={R.btnDetail} onClick={async () => {
                      const response = await api.get(`/tra-cuu-phong-giuong/${room.ma_phong}`)
                      setSelectedRoom(normalizeRoom(response.data || room))
                    }}>
                      Xem chi tiết
                    </button>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div style={R.emptyBox}>
              <p style={R.emptyText}>Không tìm thấy, mời đổi tiêu chí</p>
              <div style={S.actionInline}>
                <button type="button" style={R.btnEditCriteria} onClick={() => navigate(`/sale/ho-so-dang-ky/chinh-sua/${profile?.id}`)}>
                  <IconEdit />
                  Chỉnh sửa hồ sơ
                </button>
                <button type="button" style={S.btnDanger} onClick={onCancelProfile}>Hủy hồ sơ</button>
              </div>
            </div>
          )}
        </section>

      </div>

      <RoomDetailModal
        room={selectedRoom}
        onClose={() => setSelectedRoom(null)}
      />

      <div style={S.bottomActionsBetween}>
        <button style={S.btnSecondary} onClick={onBack}>Quay lại</button>
        {filteredRooms.length > 0 ? (
          <button
            style={S.btnPrimary}
            onClick={() => onNext(filteredRooms)}
          >
            Bước tiếp theo
          </button>
        ) : null}
      </div>
    </section>
  )
}

function CreatePhieuView({ profile, rooms, onBack, onCreated, onRequestCancelProfile }) {
  const navigate = useNavigate()
  const requiredBeds = Number(String(profile?.peopleCount || '').replace(/[^\d]/g, '') || 0)
  const [selectedRoomCode, setSelectedRoomCode] = useState(rooms?.[0]?.ma_phong || '')
  const [bedQuantity, setBedQuantity] = useState(requiredBeds || 1)
  const [submitting, setSubmitting] = useState(false)
  const [serverError, setServerError] = useState('')
  const [decisionModal, setDecisionModal] = useState(null)
  const [confirmCreateOpen, setConfirmCreateOpen] = useState(false)
  const [selectedRoom, setSelectedRoom] = useState(
    () => rooms.find((item) => item.ma_phong === (rooms?.[0]?.ma_phong || '')) || rooms[0] || null,
  )
  const [loadingRoomDetail, setLoadingRoomDetail] = useState(false)
  const availableBeds = useMemo(
    () => (selectedRoom?.beds || []).filter((bed) => bed.trang_thai === 'Trống'),
    [selectedRoom],
  )
  const normalizedBedQuantity = Math.max(1, Number(bedQuantity) || 0)

  useEffect(() => {
    setSelectedRoomCode(rooms?.[0]?.ma_phong || '')
    setSelectedRoom(rooms[0] || null)
    setBedQuantity(requiredBeds || 1)
    setServerError('')
  }, [rooms, requiredBeds])

  useEffect(() => {
    const maPhong = selectedRoomCode || rooms?.[0]?.ma_phong || ''
    if (!maPhong) return

    let active = true

    const fetchRoomDetail = async () => {
      setLoadingRoomDetail(true)

      try {
        const response = await api.get(`/tra-cuu-phong-giuong/${maPhong}`)
        if (!active) return
        setSelectedRoom(normalizeRoom(response.data || {}))
      } catch {
        if (!active) return
        setSelectedRoom(rooms.find((item) => item.ma_phong === maPhong) || null)
        setServerError('Không tải được số giường trống mới nhất của phòng đã chọn.')
      } finally {
        if (active) {
          setLoadingRoomDetail(false)
        }
      }
    }

    fetchRoomDetail()

    return () => {
      active = false
    }
  }, [selectedRoomCode, rooms])

  const tongTienCoc = Number(selectedRoom?.gia_giuong || 0) * 2 * normalizedBedQuantity

  const submitCreate = async () => {
    setSubmitting(true)
    setServerError('')
    setConfirmCreateOpen(false)
    setDecisionModal(null)

    try {
      const response = await api.post('/phieu-dat-coc', {
        maDk: profile?.id,
        maPhong: selectedRoom?.ma_phong,
        soLuongGiuong: normalizedBedQuantity,
      })

      onCreated(response.data?.message || 'Lập phiếu đặt cọc thành công.')
    } catch (error) {
      if (error.response?.data?.code === 'INSUFFICIENT_BEDS') {
        setDecisionModal({
          availableBeds: error.response?.data?.data?.availableBeds ?? 0,
        })
      } else {
        setServerError(error.response?.data?.message || 'Không thể lập phiếu đặt cọc.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  const handleSubmit = async () => {
    if (!selectedRoom?.ma_phong) return

    if (normalizedBedQuantity < 1) {
      setServerError('Số lượng giường phải lớn hơn 0.')
      return
    }

    setServerError('')
    setDecisionModal(null)
    setConfirmCreateOpen(true)
  }

  return (
    <section>
      <div style={{ marginBottom: '20px' }}>
        <PageTitle title="Lập phiếu đặt cọc" description="" />
      </div>

      <div style={S.formCard}>
        <StepIndicator step={2} />

        <div style={S.twoColGrid}>
          <div style={{ display: 'grid', gap: '16px' }}>
            <div style={S.subCard}>
              <h4 style={S.subCardTitle}>I. Thông tin khách hàng</h4>
              <div style={S.infoGrid}>
                <div><div style={S.infoLabel}>HỌ TÊN</div><div style={S.infoValue}>{profile?.customerName}</div></div>
                <div><div style={S.infoLabel}>CCCD</div><div style={S.infoValue}>{profile?.cccd}</div></div>
                <div><div style={S.infoLabel}>SĐT</div><div style={S.infoValue}>{profile?.phone}</div></div>
                <div><div style={S.infoLabel}>EMAIL</div><div style={S.infoValue}>{profile?.email}</div></div>
                <div><div style={S.infoLabel}>QUỐC TỊCH</div><div style={S.infoValue}>{profile?.nationality || 'Việt Nam'}</div></div>
              </div>
            </div>

            <div style={S.subCard}>
              <h4 style={S.subCardTitle}>II. Thông tin hồ sơ đăng ký</h4>
              <div style={S.infoGrid}>
                <div><div style={S.infoLabel}>MÃ HS</div><div style={S.infoValue}>{profile?.id}</div></div>
                <div><div style={S.infoLabel}>TRẠNG THÁI</div><Badge label={profile?.status} /></div>
                <div><div style={S.infoLabel}>HÌNH THỨC THUÊ</div><div style={S.infoValue}>{profile?.rentType}</div></div>
                <div><div style={S.infoLabel}>SỐ NGƯỜI</div><div style={S.infoValue}>{profile?.peopleCount}</div></div>
                <div><div style={S.infoLabel}>NGÀY VÀO (DỰ KIẾN)</div><div style={S.infoValue}>{profile?.moveInDate}</div></div>
                <div><div style={S.infoLabel}>TIÊU CHÍ</div><div style={S.infoValue}>{profile?.criteriaText || 'Không có'}</div></div>
              </div>
            </div>
          </div>

          <div style={S.subCard}>
            <h4 style={S.subCardTitle}>III. Chi tiết đặt cọc</h4>

            <div style={S.infoGrid} className="room-summary">
              <div>
                <div style={S.infoLabel}>PHÒNG CHỌN</div>
                <select
                  style={S.inlineSelect}
                  value={selectedRoomCode}
                  onChange={(event) => {
                    setSelectedRoomCode(event.target.value)
                    setServerError('')
                  }}
                >
                  {rooms.map((item) => (
                    <option key={item.ma_phong} value={item.ma_phong}>
                      {item.ten_hien_thi || item.ma_phong}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <div style={S.infoLabel}>SỐ LƯỢNG GIƯỜNG</div>
                <input
                  type="number"
                  min="1"
                  max={Math.max(availableBeds.length, 1)}
                  style={S.inlineInputEditable}
                  value={bedQuantity}
                  onChange={(event) => {
                    setBedQuantity(event.target.value)
                    setServerError('')
                  }}
                />
              </div>
            </div>

            <div style={S.priceBox}>
              <div style={S.priceRow}><span>Giá phòng (1 giường/tháng):</span><strong>{money(selectedRoom?.gia_giuong)}</strong></div>
              <div style={S.priceRow}><span>Thời gian cọc yêu cầu:</span><strong>2 tháng</strong></div>
              <div style={{ ...S.priceRow, borderTop: '1px solid #dde3d8', marginTop: '8px', paddingTop: '10px' }}>
                <span style={{ fontWeight: 700 }}>Tổng tiền cọc dự kiến:</span>
                <strong style={{ fontSize: '17px', color: '#3b4f27' }}>{money(tongTienCoc)}</strong>
              </div>
            </div>

            <div style={S.warnBox}>
              <span><strong>Lưu ý:</strong> Sau khi tạo, phòng/giường sẽ khóa tạm thời và hệ thống bắt đầu đếm ngược 24h chờ thanh toán.</span>
            </div>

            {serverError ? <p style={{ ...S.errMsg, marginTop: '12px' }}>{serverError}</p> : null}
          </div>
        </div>

        <div style={S.bottomActionsBetween}>
          <button style={S.btnSecondary} onClick={onBack}>Quay lại tra cứu</button>
          <button
            style={S.btnPrimary}
            onClick={handleSubmit}
            disabled={submitting || loadingRoomDetail}
          >
            {submitting ? 'Đang lưu...' : 'Lập phiếu đặt cọc'}
          </button>
        </div>
      </div>

      {decisionModal ? (
        <div style={S.confirmOverlay}>
          <div style={S.confirmBox}>
            <h3 style={S.confirmTitle}>Phòng không còn đủ chỗ</h3>
            <p style={S.confirmSubText}>
              Phòng đang chọn hiện còn <strong>{decisionModal.availableBeds}</strong> giường trống. Vui lòng trao đổi với khách hàng và chọn một hướng xử lý bên dưới.
            </p>
            <div style={S.caseActionList}>
              <button
                style={S.btnPrimary}
                onClick={() => {
                  setDecisionModal(null)
                  onBack()
                }}
              >
                Trường hợp 1: Chọn phòng khác
              </button>
              <button
                style={S.btnWarning}
                onClick={() => {
                  setDecisionModal(null)
                  navigate(`/sale/ho-so-dang-ky/chinh-sua/${profile?.id}`)
                }}
              >
                Trường hợp 2: Điều chỉnh hồ sơ
              </button>
              <button
                style={S.btnDangerSolid}
                onClick={() => {
                  setDecisionModal(null)
                  onRequestCancelProfile()
                }}
              >
                Trường hợp 3: Hủy hồ sơ
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {confirmCreateOpen ? (
        <div style={S.confirmOverlay}>
          <div style={S.confirmBox}>
            <h3 style={S.confirmTitle}>Xác nhận lập phiếu đặt cọc</h3>
            <p style={S.confirmSubText}>Bạn có xác nhận lập phiếu đặt cọc này không?</p>
            <div style={S.confirmActions}>
              <button
                style={S.btnSecondary}
                onClick={() => setConfirmCreateOpen(false)}
                disabled={submitting}
              >
                Đóng
              </button>
              <button
                style={S.btnPrimary}
                onClick={submitCreate}
                disabled={submitting}
              >
                {submitting ? 'Đang lưu...' : 'Xác nhận'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  )
}

function CancelProfileModal({ open, profile, submitting, onClose, onConfirm }) {
  if (!open) return null

  return (
    <div style={S.confirmOverlay}>
      <div style={S.confirmBox}>
        <h3 style={S.confirmTitle}>Xác nhận hủy hồ sơ</h3>
        <p style={S.confirmText}>
          Bạn có chắc muốn hủy hồ sơ <strong>{profile?.id}</strong> của khách hàng <strong>{profile?.customerName}</strong> không?
        </p>
        <p style={S.confirmSubText}>
          Sau khi xác nhận, trạng thái hồ sơ sẽ được cập nhật thành <strong>Hủy yêu cầu</strong>.
        </p>
        <div style={S.confirmActions}>
          <button style={S.btnSecondary} onClick={onClose} disabled={submitting}>Đóng</button>
          <button style={S.btnDangerSolid} onClick={onConfirm} disabled={submitting}>
            {submitting ? 'Đang hủy...' : 'Xác nhận hủy hồ sơ'}
          </button>
        </div>
      </div>
    </div>
  )
}




export default function LapPhieuDatCocPage() {
  const [tab, setTab] = useState('lap-phieu')
  const [view, setView] = useState('list')
  const [searchKeyword, setSearchKeyword] = useState('')
  const [profiles, setProfiles] = useState([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [selectedProfile, setSelectedProfile] = useState(null)
  const [availableRooms, setAvailableRooms] = useState([])
  const [cancelModalOpen, setCancelModalOpen] = useState(false)
  const [cancelSubmitting, setCancelSubmitting] = useState(false)
  const [currentTab, setCurrentTab] = useState('lap-phieu') 
  const [danhSachView, setDanhSachView] = useState('list') 
  const [selectedPDC, setSelectedPDC] = useState(null)

  const handleCreateNewPDC = (phieu) => {
    
    const matchedProfile = profiles.find(p => p.cccd === phieu.cccd || p.phone === phieu.sdt)
    
    if (matchedProfile) {
      setTab('lap-phieu')
      setDanhSachView('list')
      handleChooseProfile(matchedProfile.id) // Tự động gọi hàm của Toàn để nhảy sang bước Tra cứu phòng
    } else {
      alert('Hồ sơ của khách hàng này hiện không ở trạng thái "Đã hẹn" để lập phiếu mới. Hệ thống sẽ chuyển về danh sách Lập phiếu để bạn kiểm tra.')
      setTab('lap-phieu')
      setDanhSachView('list')
      setSearchKeyword(phieu.cccd) // Tự điền CCCD vào ô tìm kiếm
    }
  }
  const loadProfiles = async () => {
    setLoading(true)
    setError('')

    try {
      const response = await api.get('/ho-so-dang-ky', {
        params: {
          status: 'Đã hẹn',
          page: 1,
          pageSize: 100,
        },
      })
      setProfiles(response.data?.items || [])
    } catch (loadError) {
      setProfiles([])
      setError(loadError.response?.data?.message || 'Không tải được danh sách hồ sơ đăng ký.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadProfiles()
  }, [])

  const filteredProfiles = useMemo(() => {
    const keyword = normalizeSearchValue(searchKeyword)
    const keywordDigits = normalizeDigits(searchKeyword)

    if (!keyword && !keywordDigits) {
      return profiles
    }

    return profiles.filter((profile) => {
      const customerName = normalizeSearchValue(profile.customerName)
      const email = normalizeSearchValue(profile.email)
      const phone = normalizeDigits(profile.phone)
      const cccd = normalizeDigits(profile.cccd)

      return (
        customerName.includes(keyword)
        || email.includes(keyword)
        || (keywordDigits ? phone.includes(keywordDigits) || cccd.includes(keywordDigits) : false)
      )
    })
  }, [profiles, searchKeyword])

  const handleChooseProfile = async (profileId) => {
    setMessage('')
    setError('')

    try {
      const response = await api.get(`/ho-so-dang-ky/${profileId}`)
      setSelectedProfile(response.data)
      setAvailableRooms([])
      setView('search')
    } catch (detailError) {
      setError(detailError.response?.data?.message || 'Không tải được hồ sơ đã chọn.')
    }
  }

  const requestCancelProfile = () => {
    if (!selectedProfile?.id) return
    setCancelModalOpen(true)
  }

  const handleCancelProfile = async () => {
    if (!selectedProfile?.id) return

    try {
      setCancelSubmitting(true)
      await api.patch(`/ho-so-dang-ky/${selectedProfile.id}/cancel`)
      setMessage('Đã hủy hồ sơ đăng ký thành công.')
      setSelectedProfile(null)
      setAvailableRooms([])
      setCancelModalOpen(false)
      setView('list')
      loadProfiles()
    } catch (cancelError) {
      setError(cancelError.response?.data?.message || 'Không thể hủy hồ sơ đăng ký.')
    } finally {
      setCancelSubmitting(false)
    }
  }

  let content = null

  if (view === 'search' && selectedProfile) {
    content = (
      <SearchRoomView
        profile={selectedProfile}
        onBack={() => {
          setCancelModalOpen(false)
          setView('list')
        }}
          onNext={(rooms) => {
            setAvailableRooms(rooms)
            setView('form')
          }}
        onCancelProfile={requestCancelProfile}
        />
    )
  } else if (view === 'form' && selectedProfile && availableRooms.length > 0) {
    content = (
      <CreatePhieuView
        profile={selectedProfile}
        rooms={availableRooms}
        onBack={() => {
          setCancelModalOpen(false)
          setView('search')
        }}
        onRequestCancelProfile={requestCancelProfile}
        onCreated={(successMessage) => {
          setMessage(successMessage)
          setSelectedProfile(null)
          setAvailableRooms([])
          setCancelModalOpen(false)
          setView('list')
          loadProfiles(searchKeyword.trim())
        }}
      />
    )
  } else {
    content = (
      <ProfileListView
        tab={tab}
        searchKeyword={searchKeyword}
          profiles={filteredProfiles}
        loading={loading}
        message={message}
        error={error}
        onTabChange={(nextTab) => {
          setTab(nextTab)
          setMessage('')
          setError('')
        }}
        onSearchChange={setSearchKeyword}
          onSearch={() => loadProfiles()}
        onRefresh={() => {
          setSearchKeyword('')
            loadProfiles()
        }}
        onChooseProfile={handleChooseProfile}
        danhSachView={danhSachView}
        setDanhSachView={setDanhSachView}
        selectedPDC={selectedPDC}
        setSelectedPDC={setSelectedPDC}
        onCreateNewPDC={handleCreateNewPDC}
      />
    )
  }

  return (
    <>
      {content}
      <CancelProfileModal
        open={cancelModalOpen}
        profile={selectedProfile}
        submitting={cancelSubmitting}
        onClose={() => setCancelModalOpen(false)}
        onConfirm={handleCancelProfile}
      />
    </>
  )
}

const S = {
  badge: { display: 'inline-block', padding: '4px 10px', borderRadius: '999px', fontSize: '11.5px', fontWeight: 700 },
  bannerSuccess: { marginBottom: '16px', padding: '12px 14px', borderRadius: '8px', backgroundColor: '#e3f0e1', color: '#2e7d32', fontSize: '13px' },
  bannerError: { marginBottom: '16px', padding: '12px 14px', borderRadius: '8px', backgroundColor: '#fbe4e1', color: '#c0392b', fontSize: '13px' },

  listCard: { backgroundColor: '#fff', border: '1px solid #dde3d8', borderRadius: '10px' },
  tabRow: { display: 'flex', gap: '4px', borderBottom: '1px solid #dde3d8', padding: '0 18px' },
  tabBtn: { padding: '12px 16px', background: 'none', border: 'none', borderBottom: '2px solid transparent', fontSize: '13px', fontWeight: 700, color: '#9aa090', cursor: 'pointer', fontFamily: 'inherit' },
  tabBtnActive: { color: '#3b4f27', borderBottom: '#3b4f27' },

  toolbarRow: { display: 'flex', gap: '12px', padding: '14px 18px', alignItems: 'center' },
  searchInputWrap: { position: 'relative', flex: 1 },
  searchIcon: { position: 'absolute', left: '13px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#9aa090' },
  searchInput: { width: '100%', boxSizing: 'border-box', padding: '10px 14px 10px 36px', border: '1.5px solid #dde3d8', borderRadius: '8px', fontSize: '13px', fontFamily: 'inherit', color: '#1a1f14', outline: 'none', backgroundColor: '#fff' },
  btnRefresh: { display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '9px 14px', borderRadius: '8px', backgroundColor: '#fff', border: '1.5px solid #dde3d8', color: '#4a4a4a', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' },

  tableWrap: { borderTop: '1px solid #eef0eb', overflowX: 'auto' },
  table: { width: '100%', minWidth: '960px', borderCollapse: 'collapse', fontSize: '13px' },
  th: { padding: '12px 16px', textAlign: 'left', color: '#7e8578', fontWeight: 700, fontSize: '11px', letterSpacing: '0.4px', borderBottom: '1px solid #eef0eb' },
  tr: { borderBottom: '1px solid #f1f3ee' },
  td: { padding: '12px 16px', color: '#1a1f14', verticalAlign: 'middle' },
  tdSub: { fontSize: '11px', color: '#9aa090', marginTop: '3px' },
  emptyCell: { textAlign: 'center', padding: '40px', color: '#8c9387', fontSize: '13px' },
  btnSmallPrimary: { padding: '7px 12px', backgroundColor: '#5e7542', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' },
  tableFooter: { padding: '10px 16px', color: '#808679', fontSize: '12px' },

  placeholderBox: { padding: '38px 20px', textAlign: 'center' },
  placeholderTitle: { margin: '0 0 8px', fontSize: '16px', color: '#26351d' },
  placeholderText: { margin: 0, fontSize: '13px', color: '#6f7768' },

  formCard: { maxWidth: '100%', backgroundColor: '#fff', border: '1px solid #dde3d8', borderRadius: '12px', padding: '28px 32px' },
  stepRow: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginBottom: '26px' },
  stepItem: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' },
  stepCircle: { width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#eef0eb', color: '#9aa090', fontWeight: 700, fontSize: '13px' },
  stepCircleActive: { backgroundColor: '#3b4f27', color: '#fff' },
  stepLabel: { fontSize: '12.5px', fontWeight: 600, color: '#9aa090' },
  stepLabelActive: { color: '#1a1f14' },
  stepLine: { width: '90px', height: '2px', backgroundColor: '#eef0eb', marginBottom: '22px' },
  stepLineActive: { backgroundColor: '#3b4f27' },

  bottomActions: { display: 'flex', justifyContent: 'space-between', marginTop: '24px' },
  bottomActionsBetween: { display: 'flex', justifyContent: 'space-between', gap: '16px', alignItems: 'center', marginTop: '24px', flexWrap: 'wrap' },
  actionInline: { display: 'flex', gap: '10px', flexWrap: 'wrap' },
  btnPrimary: { padding: '10px 22px', backgroundColor: '#3b4f27', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' },
  btnSecondary: { padding: '9px 20px', backgroundColor: '#fff', color: '#1a1f14', border: '1.5px solid #dde3d8', borderRadius: '8px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' },
  btnWarning: { padding: '10px 20px', backgroundColor: '#f5c451', color: '#5f4303', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' },
  btnDanger: { padding: '9px 20px', backgroundColor: '#fff1ef', color: '#c0392b', border: '1px solid #f1ccc7', borderRadius: '8px', fontSize: '14px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' },
  btnDangerSolid: { padding: '10px 20px', backgroundColor: '#c0392b', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' },

  twoColGrid: { display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1.1fr)', gap: '18px', alignItems: 'start' },
  subCard: { border: '1px solid #eef0eb', borderRadius: '10px', padding: '18px 20px', backgroundColor: '#fafbf8' },
  subCardTitle: { margin: '0 0 14px', fontSize: '14px', fontWeight: 700, color: '#1a1f14', borderBottom: '1px solid #eef0eb', paddingBottom: '10px' },
  infoGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px 12px' },
  infoLabel: { fontSize: '10.5px', fontWeight: 700, color: '#9aa090', letterSpacing: '0.3px', marginBottom: '4px' },
  infoValue: { fontSize: '13.5px', color: '#1a1f14' },
  inlineSelect: { width: '100%', boxSizing: 'border-box', padding: '10px 12px', border: '1.5px solid #dde3d8', borderRadius: '8px', fontSize: '13px', fontFamily: 'inherit', backgroundColor: '#fff', color: '#1a1f14', outline: 'none' },
  inlineInput: { width: '100%', boxSizing: 'border-box', padding: '10px 12px', border: '1.5px solid #dde3d8', borderRadius: '8px', fontSize: '13px', fontFamily: 'inherit', backgroundColor: '#f8faf6', color: '#1a1f14', outline: 'none' },
  inlineInputEditable: { width: '100%', boxSizing: 'border-box', padding: '10px 12px', border: '1.5px solid #dde3d8', borderRadius: '8px', fontSize: '13px', fontFamily: 'inherit', backgroundColor: '#fff', color: '#1a1f14', outline: 'none' },
  roomHintBox: { marginTop: '14px', marginBottom: '16px', backgroundColor: '#f5f8f2', color: '#51604a', padding: '12px 14px', borderRadius: '8px', fontSize: '12.5px', lineHeight: 1.6 },
  priceBox: { backgroundColor: '#fff', border: '1px solid #dde3d8', borderRadius: '8px', padding: '14px 16px', marginTop: '4px' },
  priceRow: { display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#4a4a4a', padding: '4px 0' },
  warnBox: { marginTop: '14px', backgroundColor: '#fff5e8', color: '#8a5a07', padding: '12px 14px', borderRadius: '8px', fontSize: '12.5px', lineHeight: 1.6 },
  errMsg: { margin: 0, fontSize: '13px', color: '#c0392b' },
  confirmOverlay: { position: 'fixed', inset: 0, backgroundColor: 'rgba(0, 0, 0, 0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1200 },
  confirmBox: { width: 'min(440px, calc(100vw - 32px))', backgroundColor: '#fff', borderRadius: '14px', padding: '24px', boxShadow: '0 16px 50px rgba(0, 0, 0, 0.18)' },
  confirmTitle: { margin: '0 0 12px', fontSize: '18px', fontWeight: 800, color: '#1a1f14' },
  confirmText: { margin: '0 0 10px', fontSize: '14px', color: '#2d3429', lineHeight: 1.6 },
  confirmSubText: { margin: '0 0 20px', fontSize: '13px', color: '#6d7567', lineHeight: 1.6 },
  confirmActions: { display: 'flex', justifyContent: 'flex-end', gap: '10px', flexWrap: 'wrap' },
  caseActionList: { display: 'grid', gap: '10px' },
}
// Styles cho phần Chi tiết Tra cứu
const D = {
  wrapper: { backgroundColor: '#fff', padding: '24px 30px', borderRadius: '12px', border: '1px solid #dde3d8' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' },
  headerLeft: { display: 'flex', alignItems: 'center', gap: '12px' },
  backBtn: { background: 'none', border: 'none', color: '#4b5563', cursor: 'pointer', padding: 0 },
  title: { margin: 0, fontSize: '20px', fontWeight: 700, color: '#1f2937' },
  printBtn: { display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 14px', border: '1px solid #d1d5db', borderRadius: '6px', backgroundColor: '#fff', color: '#374151', fontSize: '14px', fontWeight: 600, cursor: 'pointer' },
  gridCols: { display: 'grid', gridTemplateColumns: 'minmax(0,1.3fr) minmax(0,1fr)', gap: '24px', alignItems: 'start' },
  colLeft: { display: 'grid', gap: '24px' },
  colRight: { display: 'grid', gap: '24px' },
  card: { border: '1px solid #e5e7eb', borderRadius: '8px', backgroundColor: '#fff', overflow: 'hidden' },
  cardHeader: { display: 'flex', alignItems: 'center', gap: '8px', padding: '16px 20px', borderBottom: '1px solid #f3f4f6', backgroundColor: '#fafafa', color: '#4b5563' },
  cardTitle: { fontSize: '15px', fontWeight: 700, color: '#111827' },
  cardBody: { padding: '20px' },
  cardBodyFlex: { display: 'flex', flexDirection: 'column', gap: '16px', padding: '20px' },
  cardBody2Col: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', padding: '20px' },
  infoBlock: { display: 'flex', flexDirection: 'column', gap: '4px' },
  label: { fontSize: '11px', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase' },
  value: { fontSize: '14px', color: '#111827' },
  valueBold: { fontSize: '14px', color: '#111827', fontWeight: 700 },
  flexRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  priceText: { fontSize: '16px', fontWeight: 800, color: '#111827' },
  linkText: { fontSize: '14px', fontWeight: 600, color: '#3b4f27', display: 'inline-flex', alignItems: 'center', cursor: 'pointer' },
}
const R = {
  page: {
    minHeight: '100%',
    maxHeight: 'calc(100vh - 96px)',
    overflowY: 'auto',
    overflowX: 'hidden',
    paddingRight: '8px',
    paddingBottom: '24px',
    boxSizing: 'border-box',
    backgroundColor: 'transparent',
  },

  profileBanner: {
    marginBottom: '16px',
    padding: '12px 14px',
    borderRadius: '8px',
    backgroundColor: '#eef2e8',
    color: '#3b4f27',
    fontSize: '13px',
  },

  searchCard: {
    border: '1px solid #dde3d8',
    borderRadius: '8px',
    padding: '14px',
    backgroundColor: '#fff',
    marginBottom: '16px',
  },

  searchRow: {
    display: 'flex',
    gap: '14px',
    marginBottom: '14px',
  },

  searchInputWrap: {
    position: 'relative',
    flex: 1,
  },

  searchIcon: {
    position: 'absolute',
    left: '14px',
    top: '50%',
    transform: 'translateY(-50%)',
    color: '#6b7560',
    display: 'inline-flex',
  },

  searchInput: {
    width: '100%',
    height: '40px',
    boxSizing: 'border-box',
    padding: '10px 14px 10px 42px',
    border: '1.5px solid #cfd6c9',
    borderRadius: '4px',
    fontSize: '14px',
    fontFamily: 'inherit',
    color: '#1a1f14',
    outline: 'none',
    backgroundColor: '#fff',
  },

  btnSearch: {
    width: '100px',
    height: '40px',
    border: 'none',
    borderRadius: '4px',
    backgroundColor: '#3b4f27',
    color: '#fff',
    fontFamily: 'inherit',
    fontWeight: 700,
    cursor: 'pointer',
  },

  filterGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, minmax(140px, 1fr))',
    gap: '14px',
  },

  label: {
    display: 'block',
    marginBottom: '6px',
    color: '#5f675b',
    fontSize: '12px',
    fontWeight: 600,
  },

  select: {
    width: '100%',
    height: '36px',
    padding: '0 10px',
    border: '1.5px solid #cfd6c9',
    borderRadius: '4px',
    backgroundColor: '#fff',
    color: '#1a1f14',
    fontFamily: 'inherit',
    outline: 'none',
  },

  criteriaSection: {
    marginBottom: '18px',
    border: '1px solid #dde3d8',
    borderRadius: '8px',
    backgroundColor: '#fff',
    overflow: 'hidden',
  },

  criteriaTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '12px 16px',
    borderBottom: '1px solid #eef0eb',
    color: '#3b4f27',
    fontSize: '13px',
    fontWeight: 800,
    backgroundColor: '#fff',
  },

  criteriaGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, minmax(140px, 1fr))',
    gap: '12px 24px',
    padding: '14px 16px',
  },

  criteriaEmptyText: {
    gridColumn: '1 / -1',
    margin: 0,
    color: '#8b9285',
    fontSize: '14px',
  },

  checkboxLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    color: '#1a1f14',
    fontSize: '13px',
    fontWeight: 700,
    cursor: 'pointer',
  },

  checkboxText: {
    textTransform: 'uppercase',
    whiteSpace: 'nowrap',
  },

  roomGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 255px))',
    gap: '22px',
    alignItems: 'start',
    justifyContent: 'start',
  },

  roomCard: {
    border: '1px solid #d6dccf',
    borderRadius: '6px',
    backgroundColor: '#fff',
    overflow: 'hidden',
    boxShadow: '0 8px 18px rgba(20, 30, 15, 0.07)',
  },

  imageWrap: {
    position: 'relative',
    height: '122px',
    overflow: 'hidden',
    backgroundColor: '#f3f4f1',
  },

  roomImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    display: 'block',
  },

  statusBadge: {
    position: 'absolute',
    top: '10px',
    right: '10px',
    padding: '5px 11px',
    borderRadius: '999px',
    backgroundColor: '#dcffe1',
    color: '#30b44d',
    fontSize: '12px',
    fontWeight: 800,
  },

  roomBody: {
    padding: '12px',
  },

  roomTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '10px',
    marginBottom: '10px',
  },

  roomInfo: {
    minWidth: 0,
    flex: 1,
  },

  roomCode: {
    margin: 0,
    color: '#2f4426',
    fontSize: '20px',
    fontWeight: 800,
    lineHeight: 1.1,
    whiteSpace: 'nowrap',
  },

  roomType: {
    margin: '4px 0 0',
    color: '#6c7468',
    fontSize: '11px',
    fontWeight: 700,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },

  roomTerm: {
    margin: '3px 0 0',
    color: '#6c7468',
    fontSize: '11px',
    fontWeight: 700,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },

  priceBox: {
    flexShrink: 0,
    minWidth: '92px',
    textAlign: 'right',
    color: '#2f4426',
    whiteSpace: 'nowrap',
    fontSize: '12px',
  },

  chipRow: {
    display: 'flex',
    gap: '6px',
    flexWrap: 'wrap',
    minHeight: '25px',
    marginBottom: '12px',
  },

  chip: {
    maxWidth: '100%',
    padding: '4px 8px',
    borderRadius: '999px',
    backgroundColor: '#f0f2ee',
    color: '#4d554a',
    fontSize: '10px',
    fontWeight: 700,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },

  btnDetail: {
    width: '100%',
    height: '34px',
    border: '1.5px solid #3b4f27',
    borderRadius: '3px',
    backgroundColor: '#fff',
    color: '#1a1f14',
    fontFamily: 'inherit',
    fontSize: '14px',
    fontWeight: 700,
    cursor: 'pointer',
  },

  emptyBox: {
    minHeight: '260px',
    border: '2px dashed #d4dacd',
    borderRadius: '10px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '16px',
    color: '#787f74',
  },

  emptyText: {
    margin: 0,
    fontSize: '16px',
  },

  btnEditCriteria: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    height: '40px',
    padding: '0 18px',
    border: '1.5px solid #bfc7b8',
    borderRadius: '4px',
    backgroundColor: '#fff',
    color: '#56604f',
    fontFamily: 'inherit',
    fontWeight: 600,
    cursor: 'pointer',
  },

  modalOverlay: {
    position: 'fixed',
    inset: 0,
    zIndex: 1000,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(30, 35, 28, 0.25)',
  },

  modalBox: {
    width: 'min(680px, calc(100vw - 40px))',
    maxHeight: '86vh',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: '#fff',
    borderRadius: '12px',
    boxShadow: '0 24px 80px rgba(0,0,0,0.18)',
    padding: '20px 24px 18px',
    overflow: 'hidden',
  },

  modalHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '16px',
    paddingBottom: '12px',
    borderBottom: '1px solid #eef0eb',
  },

  modalTitle: {
    margin: 0,
    color: '#3b4f27',
    fontSize: '22px',
    fontWeight: 800,
  },

  closeButton: {
    border: 'none',
    backgroundColor: 'transparent',
    color: '#aab0a5',
    fontSize: '34px',
    lineHeight: 1,
    cursor: 'pointer',
  },

  criteriaLine: {
    margin: '6px 0',
    color: '#4e574a',
    fontSize: '13px',
    lineHeight: 1.35,
  },

  modalTableWrap: {
    maxHeight: '48vh',
    overflowY: 'auto',
    overflowX: 'hidden',
    borderTop: '1px solid #eef0eb',
    marginRight: '-14px',
    paddingRight: '14px',
  },

  modalTable: {
    width: '100%',
    borderCollapse: 'collapse',
  },

  modalTh: {
    position: 'sticky',
    top: 0,
    zIndex: 1,
    padding: '10px 0',
    backgroundColor: '#fff',
    color: '#9fa79c',
    textAlign: 'left',
    fontSize: '13px',
    fontWeight: 800,
    borderBottom: '1px solid #eef0eb',
  },

  modalTr: {
    borderBottom: '1px solid #f1f2ef',
  },

  modalTd: {
    padding: '12px 0',
    color: '#505866',
    fontSize: '16px',
  },

  modalEmptyCell: {
    padding: '22px 0',
    color: '#8b9285',
    textAlign: 'center',
    fontSize: '14px',
  },

  modalFooter: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '10px',
    marginTop: '14px',
  },

  btnCancel: {
    width: '110px',
    height: '42px',
    border: 'none',
    borderRadius: '10px',
    backgroundColor: '#ededf0',
    color: '#59606b',
    fontFamily: 'inherit',
    fontSize: '15px',
    fontWeight: 800,
    cursor: 'pointer',
  },

  btnChoose: {
    height: '42px',
    padding: '0 18px',
    border: 'none',
    borderRadius: '10px',
    backgroundColor: '#3b4f27',
    color: '#fff',
    fontFamily: 'inherit',
    fontSize: '14px',
    fontWeight: 800,
    cursor: 'pointer',
  },
}
