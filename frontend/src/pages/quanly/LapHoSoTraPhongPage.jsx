import { useMemo, useState } from 'react'
import { Search, ArrowLeft, UsersRound, UserRound, FileText, ClipboardList, Info } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'
import { createReturnProfile, searchReturnProfiles } from '../../services/hoSoTraPhong.js'

const PAGE_SIZE = 4
function getTodayDateInput() {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function formatDate(value) {
  if (!value) {
    return ''
  }

  const [year, month, day] = String(value).split('-')
  if (!year || !month || !day) {
    return value
  }

  return `${day}/${month}/${year}`
}

function normalizeText(value) {
  return String(value || '').trim().toLowerCase()
}

function DetailField({ label, value }) {
  return (
    <div className="space-y-1">
      <div className="text-[13px] font-semibold text-[#83897e]">{label}</div>
      <div className="text-[16px] font-semibold text-[#30362c]">{value || '--'}</div>
    </div>
  )
}

function getRecordKey(row) {
  if (row?.maHopDong) {
    return `${row.maHopDong}-${row.maKhachThue || ''}`
  }

  return `PDC-${row?.maPdc || ''}`
}

export default function LapHoSoTraPhongPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const basePath = location.pathname.startsWith('/sale') ? '/sale/tra-phong' : '/quan-ly/tra-phong'
  const [searchValue, setSearchValue] = useState('P.101')
  const [results, setResults] = useState([])
  const [isSearching, setIsSearching] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedRecordId, setSelectedRecordId] = useState('')
  const [viewMode, setViewMode] = useState('search')
  const [expectedReturnDate, setExpectedReturnDate] = useState('')

  const filteredRows = useMemo(() => {
    return Array.isArray(results) ? results : []
  }, [results])

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE))
  const paginatedRows = filteredRows.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)
  const selectedRecord = filteredRows.find((row) => getRecordKey(row) === selectedRecordId) || null

  const handleSearch = () => {
    setCurrentPage(1)
    setSelectedRecordId('')
    setViewMode('search')
    setExpectedReturnDate('')
    const keyword = String(searchValue || '').trim()
    if (!keyword) {
      setResults([])
      return
    }

    setIsSearching(true)
    searchReturnProfiles(keyword)
      .then((data) => setResults(Array.isArray(data) ? data : []))
      .catch(() => setResults([]))
      .finally(() => setIsSearching(false))
  }

  const handleContinue = () => {
    if (!selectedRecord) {
      return
    }

    setViewMode('detail')
  }

  const handleCreate = async () => {
    if (!selectedRecord) return
    const hasContract = Boolean(selectedRecord.maHopDong)
    if (hasContract && !expectedReturnDate) return

    const confirmed = window.confirm('Bạn có muốn lập hồ sơ trả phòng cho khách hàng này không?')
    if (!confirmed) return

    try {
      const created = await createReturnProfile({
        maPdc: selectedRecord.maPdc,
        maHopDong: selectedRecord.maHopDong,
        maKhachThue: selectedRecord.maKhachThue,
        ngayTraPhongDuKien: hasContract ? expectedReturnDate : '',
      })

      window.alert(created?.message || 'Lập hồ sơ trả phòng thành công.')
      navigate(basePath)
    } catch (error) {
      window.alert(error?.response?.data?.message || 'Không thể lập hồ sơ trả phòng.')
    }
  }

  if (viewMode === 'detail' && selectedRecord) {
    const hasContract = Boolean(selectedRecord.maHopDong)

    return (
      <section className="pb-8">
        <div className="mx-auto w-full max-w-[980px]">
          <div className="overflow-hidden rounded-[16px] border border-[#d9ddd2] bg-white shadow-[0_8px_24px_rgba(33,41,21,0.04)]">
            <div className="flex items-center gap-3 border-b border-[#e3e7de] px-5 py-5 sm:px-6">
              <button
                type="button"
                onClick={() => setViewMode('search')}
                aria-label="Quay lại bước chọn hồ sơ"
                className="inline-flex h-9 w-9 items-center justify-center rounded-full text-[#666d61] transition hover:bg-[#f3f5ef] hover:text-[#465c2d]"
              >
                <ArrowLeft size={18} />
              </button>

              <h1 className="text-[26px] font-extrabold tracking-[-0.02em] text-[#26351d]">
                Lập hồ sơ trả phòng
              </h1>
            </div>

            <div className="space-y-7 px-5 py-6 sm:px-6 sm:py-7">
              <section className="space-y-4">
                <div className="flex items-center gap-2 text-[#56604b]">
                  <UserRound size={16} />
                  <h2 className="text-[15px] font-extrabold uppercase tracking-[0.03em]">
                    I. THÔNG TIN KHÁCH THUÊ
                  </h2>
                </div>

                <div className="grid gap-5 rounded-[12px] border border-[#d9ddd2] bg-[#fcfcfa] px-5 py-5 md:grid-cols-2">
                  <DetailField label="Họ tên" value={selectedRecord.hoVaTen} />
                  <DetailField label="CCCD" value={selectedRecord.cccd} />
                  <DetailField label="Số điện thoại" value={selectedRecord.soDienThoai} />
                  <DetailField label="Email" value={selectedRecord.email} />
                </div>
              </section>

              <section className="space-y-4">
                <div className="flex items-center gap-2 text-[#56604b]">
                  <FileText size={16} />
                  <h2 className="text-[15px] font-extrabold uppercase tracking-[0.03em]">
                    II. THÔNG TIN THUÊ HIỆN TẠI
                  </h2>
                </div>

                <div className="grid gap-5 rounded-[12px] border border-[#d9ddd2] bg-[#fcfcfa] px-5 py-5 md:grid-cols-4">
                  <DetailField label={hasContract ? 'Mã hợp đồng' : 'Mã PDC'} value={selectedRecord.maHopDong || selectedRecord.maPdc} />
                  <DetailField label="Phòng/Giường" value={String(selectedRecord.phongGiuong || '').replace('/', '-')} />
                  <DetailField label="Ngày bắt đầu" value={formatDate(selectedRecord.ngayVao)} />
                  <DetailField label="Trạng thái" value={selectedRecord.trangThaiHopDong || 'Đang hiệu lực'} />
                </div>
              </section>

              <section className="space-y-4">
                <div className="flex items-center gap-2 text-[#56604b]">
                  <ClipboardList size={16} />
                  <h2 className="text-[15px] font-extrabold uppercase tracking-[0.03em]">
                    III. THÔNG TIN TRẢ PHÒNG
                  </h2>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <label className="space-y-2">
                    <span className="text-[14px] font-semibold text-[#656b61]">Hồ sơ được chọn</span>
                    <input
                      type="text"
                      value={selectedRecord.maHopDong || selectedRecord.maPdc}
                      disabled
                      className="h-[48px] w-full rounded-[10px] border border-[#d7dbd1] bg-[#f6f7f3] px-4 text-[15px] font-semibold text-[#555b50]"
                    />
                  </label>

                  {hasContract && (
                    <label className="space-y-2">
                      <span className="text-[14px] font-semibold text-[#656b61]">
                        Ngày trả phòng dự kiến <span className="text-[#c65b4f]">*</span>
                      </span>
                      <input
                        type="date"
                        value={expectedReturnDate}
                        onChange={(event) => setExpectedReturnDate(event.target.value)}
                        min={getTodayDateInput()}
                        className="h-[48px] w-full rounded-[10px] border border-[#d7dbd1] bg-white px-4 text-[15px] text-[#31372b] outline-none transition focus:border-[#9ead89]"
                      />
                    </label>
                  )}
                </div>

                <div className="flex items-start gap-3 rounded-[10px] border border-[#dbe1ef] bg-[#f3f6fd] px-4 py-3 text-[14px] leading-[1.6] text-[#6b7280]">
                  <Info size={16} className="mt-[2px] shrink-0 text-[#7a86a7]" />
                  <p>
                    {hasContract
                      ? 'Hệ thống sẽ lưu lịch hẹn và gửi email lịch hẹn trả phòng cho khách sau khi lập hồ sơ.'
                      : 'Hồ sơ trả phòng này sẽ được ghi nhận và xử lý ngay tại thời điểm lập hồ sơ.'}
                  </p>
                </div>
              </section>
            </div>

            <div className="flex flex-col-reverse gap-3 border-t border-[#e3e7de] px-5 py-4 sm:px-6 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => {
                  const confirmed = window.confirm('Bạn có chắc chắn muốn hủy thao tác lập hồ sơ trả phòng không?')
                  if (confirmed) {
                    setViewMode('search')
                    setExpectedReturnDate('')
                  }
                }}
                className="inline-flex h-[44px] items-center justify-center rounded-[10px] border border-[#cfd5c8] bg-white px-6 text-[14px] font-semibold text-[#676d63] transition hover:bg-[#f5f7f1]"
              >
                Hủy
              </button>

              <button
                type="button"
                disabled={hasContract && !expectedReturnDate}
                onClick={handleCreate}
                className="inline-flex h-[44px] items-center justify-center gap-2 rounded-[10px] bg-[#4b6132] px-6 text-[14px] font-semibold text-white transition hover:bg-[#42572c] disabled:cursor-not-allowed disabled:bg-[#bfc7b8]"
              >
                <FileText size={15} />
                {hasContract ? 'Lập hồ sơ & Gửi mail' : 'Lập hồ sơ trả phòng'}
              </button>
            </div>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="pb-8">
      <div className="mx-auto w-full max-w-[980px]">
        <div className="overflow-hidden rounded-[16px] border border-[#d9ddd2] bg-white shadow-[0_8px_24px_rgba(33,41,21,0.04)]">
          <div className="flex items-center gap-3 border-b border-[#e3e7de] px-5 py-5 sm:px-6">
            <button
              type="button"
              onClick={() => navigate(basePath)}
              aria-label="Quay lại danh sách hồ sơ trả phòng"
              className="inline-flex h-9 w-9 items-center justify-center rounded-full text-[#666d61] transition hover:bg-[#f3f5ef] hover:text-[#465c2d]"
            >
              <ArrowLeft size={18} />
            </button>

            <h1 className="text-[26px] font-extrabold tracking-[-0.02em] text-[#26351d]">
              Lập hồ sơ trả phòng
            </h1>
          </div>

          <div className="space-y-6 px-5 py-6 sm:px-6 sm:py-7">
            <div className="space-y-4">
              <h2 className="text-[15px] font-extrabold uppercase tracking-[0.03em] text-[#56604b]">
                I. TÌM KIẾM KHÁCH THUÊ
              </h2>

              <div className="flex flex-col gap-3 md:flex-row">
                <label className="relative block flex-1">
                  <Search
                    size={18}
                    className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#8e9389]"
                  />
                  <input
                    type="text"
                    value={searchValue}
                    onChange={(event) => setSearchValue(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        handleSearch()
                      }
                    }}
                    placeholder="Nhập mã phòng/CCCD/ và hồ sơ thuê của khách"
                    className="h-[48px] w-full rounded-[10px] border border-[#d7dbd1] bg-white pl-11 pr-4 text-[15px] text-[#31372b] outline-none transition placeholder:text-[#a1a69d] focus:border-[#9ead89]"
                  />
                </label>

                <button
                  type="button"
                  onClick={handleSearch}
                  className="inline-flex h-[48px] items-center justify-center gap-2 rounded-[10px] bg-[#4b6132] px-5 text-[15px] font-semibold text-white transition hover:bg-[#42572c]"
                >
                  <Search size={16} />
                  Tìm kiếm
                </button>
              </div>
            </div>

            {filteredRows.length > 0 ? (
              <div className="overflow-hidden rounded-[14px] border border-[#d9ddd2] bg-white">
                <div className="overflow-x-auto">
                  <table className="min-w-[920px] w-full border-collapse">
                    <thead>
                      <tr className="bg-[#f7f7f4] text-left text-[14px] font-bold text-[#686e63]">
                        <th className="px-6 py-4">Mã PDC</th>
                        <th className="px-6 py-4">Mã hợp đồng</th>
                        <th className="px-4 py-4">Họ và tên</th>
                        <th className="px-4 py-4">Số điện thoại</th>
                        <th className="px-4 py-4">Phòng/Giường</th>
                        <th className="px-4 py-4">Ngày vào</th>
                      </tr>
                    </thead>

                    <tbody>
                      {paginatedRows.map((row) => {
                        const recordId = getRecordKey(row)
                        const isSelected = selectedRecordId === recordId

                        return (
                        <tr
                          key={recordId}
                          onClick={() => setSelectedRecordId(recordId)}
                          className={`cursor-pointer border-t text-[15px] text-[#43483f] transition ${
                            isSelected
                              ? 'border-[#b8c59f] bg-[#eef4e5] shadow-[inset_4px_0_0_#4b6132]'
                              : 'border-[#e3e7de] bg-white hover:bg-[#f7faf2]'
                          }`}
                        >
                          <td className="px-6 py-5 font-semibold text-[#536347]">{row.maPdc}</td>
                          <td className="px-6 py-5 font-semibold text-[#536347]">{row.maHopDong || '--'}</td>
                          <td className="px-4 py-5">{row.hoVaTen}</td>
                          <td className="px-4 py-5">{row.soDienThoai}</td>
                          <td className="px-4 py-5">{row.phongGiuong}</td>
                          <td className="px-4 py-5">{formatDate(row.ngayVao)}</td>
                        </tr>
                      )})}
                    </tbody>
                  </table>
                </div>

                <div className="flex flex-col gap-3 border-t border-[#e3e7de] px-5 py-4 text-[14px] text-[#666b62] sm:px-6 lg:flex-row lg:items-center lg:justify-between">
                  <p className="font-medium">
                    Hiển thị 1 đến {paginatedRows.length} trong {filteredRows.length} kết quả
                  </p>

                  <div className="flex items-center gap-2 self-end lg:self-auto">
                    <button
                      type="button"
                      onClick={() => setCurrentPage((page) => Math.max(page - 1, 1))}
                      disabled={currentPage === 1}
                      className="inline-flex h-8 items-center justify-center rounded-[6px] border border-[#d8ddd1] bg-[#f5f5f2] px-3 text-[14px] font-medium text-[#a4aa9c] disabled:cursor-not-allowed"
                    >
                      Trước
                    </button>

                    <button
                      type="button"
                      className="inline-flex h-8 min-w-8 items-center justify-center rounded-[6px] bg-[#4b6132] px-3 text-[14px] font-semibold text-white"
                    >
                      {currentPage}
                    </button>

                    {totalPages > 1 && (
                      <button
                        type="button"
                        onClick={() => setCurrentPage(2)}
                        className="inline-flex h-8 min-w-8 items-center justify-center rounded-[6px] border border-[#d8ddd1] bg-white px-3 text-[14px] font-medium text-[#5f655a]"
                      >
                        2
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => setCurrentPage((page) => Math.min(page + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className="inline-flex h-8 items-center justify-center rounded-[6px] border border-[#d8ddd1] bg-white px-3 text-[14px] font-medium text-[#5f655a] disabled:cursor-not-allowed disabled:text-[#a4aa9c]"
                    >
                      Sau
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-[14px] border border-dashed border-[#d6d8d1] bg-[#fbfbf9] px-6 py-12">
                <div className="mx-auto flex max-w-[420px] flex-col items-center text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#e7ebf8] text-[#66708c]">
                    <UsersRound size={28} />
                  </div>

                  <h3 className="mt-6 text-[30px] font-extrabold tracking-[-0.02em] text-[#2e332a]">
                    {isSearching ? 'Đang tìm kiếm...' : 'Chưa có thông tin khách thuê'}
                  </h3>
                  <p className="mt-3 text-[16px] leading-[1.7] text-[#6d7268]">
                    Nhập mã phòng hoặc CCCD để tra cứu hợp đồng thuê hoặc phiếu đặt cọc còn hiệu lực.
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-col-reverse gap-3 border-t border-[#e3e7de] px-5 py-4 sm:px-6 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => navigate(basePath)}
              className="inline-flex h-[44px] items-center justify-center rounded-[10px] border border-[#cfd5c8] bg-white px-6 text-[14px] font-semibold text-[#676d63] transition hover:bg-[#f5f7f1]"
            >
              Quay lại
            </button>

            <button
              type="button"
              disabled={!selectedRecordId}
              onClick={handleContinue}
              className="inline-flex h-[44px] items-center justify-center rounded-[10px] bg-[#4b6132] px-6 text-[14px] font-semibold text-white disabled:cursor-not-allowed disabled:bg-[#bfc7b8]"
            >
              Tiếp tục
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
