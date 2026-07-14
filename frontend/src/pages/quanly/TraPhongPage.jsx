import { useEffect, useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, Filter, Plus, Search } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'
import PageTitle from '../../components/common/PageTitle.jsx'

const PAGE_SIZE = 3

const RETURN_PROFILE_ROWS = [
  {
    id: 'TP-2311-001',
    tenantName: 'Trần Thị B',
    idCardOrPhone: '0901234567',
    roomBed: 'P.102 - G02',
    profileType: 'Hết hạn hợp đồng',
    returnDate: '2026-11-25',
    status: 'Chờ quyết toán',
  },
  {
    id: 'TP-2311-002',
    tenantName: 'Lê Văn C',
    idCardOrPhone: '0987654321',
    roomBed: 'P.205 - G01',
    profileType: 'Trả phòng trước hạn',
    returnDate: '2026-11-28',
    status: 'Đã hẹn',
  },
  {
    id: 'TP-2310-045',
    tenantName: 'Phạm Thị D',
    idCardOrPhone: '0912345678',
    roomBed: 'P.301 - G04',
    profileType: 'Hết hạn hợp đồng',
    returnDate: '2026-11-15',
    status: 'Hoàn tất',
  },
  {
    id: 'TP-2310-031',
    tenantName: 'Nguyễn Văn A',
    idCardOrPhone: '0973456123',
    roomBed: 'P.103 - G03',
    profileType: 'Chuyển phòng nội bộ',
    returnDate: '2026-11-17',
    status: 'Chờ quyết toán',
  },
  {
    id: 'TP-2310-018',
    tenantName: 'Đỗ Minh T',
    idCardOrPhone: '0937788665',
    roomBed: 'P.202 - G02',
    profileType: 'Trả phòng trước hạn',
    returnDate: '2026-11-19',
    status: 'Đã hẹn',
  },
  {
    id: 'TP-2309-097',
    tenantName: 'Bùi Gia Hân',
    idCardOrPhone: '0924567812',
    roomBed: 'P.401 - G08',
    profileType: 'Hết hạn hợp đồng',
    returnDate: '2026-11-08',
    status: 'Hoàn tất',
  },
]

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

export default function TraPhongPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [search, setSearch] = useState('')
  const [dateFilter, setDateFilter] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [appliedFilters, setAppliedFilters] = useState({
    search: '',
    date: '',
  })

  const filteredRows = useMemo(() => {
    return RETURN_PROFILE_ROWS.filter((row) => {
      const query = normalizeText(appliedFilters.search)
      const matchesSearch =
        !query ||
        [row.id, row.tenantName, row.idCardOrPhone, row.roomBed, row.profileType].some((value) =>
          normalizeText(value).includes(query),
        )

      const matchesDate = !appliedFilters.date || row.returnDate === appliedFilters.date

      return matchesSearch && matchesDate
    })
  }, [appliedFilters])

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE))

  useEffect(() => {
    setCurrentPage((page) => Math.min(page, totalPages))
  }, [totalPages])

  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE
    return filteredRows.slice(start, start + PAGE_SIZE)
  }, [currentPage, filteredRows])

  const startIndex = filteredRows.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1
  const endIndex =
    filteredRows.length === 0 ? 0 : Math.min(currentPage * PAGE_SIZE, filteredRows.length)

  const handleApplyFilters = () => {
    setAppliedFilters({
      search,
      date: dateFilter,
    })
    setCurrentPage(1)
  }

  const createProfilePath = location.pathname.startsWith('/sale')
    ? '/sale/tra-phong/lap-ho-so'
    : '/quan-ly/tra-phong/lap-ho-so'
  const detailBasePath = location.pathname.startsWith('/sale')
    ? '/sale/tra-phong'
    : '/quan-ly/tra-phong'

  return (
    <section className="space-y-8 pb-8">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <PageTitle
          title="Hồ sơ trả phòng"
          description="Theo dõi các hồ sơ trả phòng và lịch hẹn trả phòng của khách thuê."
        />

        <button
          type="button"
          onClick={() => navigate(createProfilePath)}
          className="inline-flex h-[52px] items-center justify-center gap-2 rounded-[8px] bg-[#4b6132] px-6 text-[16px] font-semibold text-white shadow-[0_6px_12px_rgba(75,97,50,0.16)] transition hover:bg-[#42572c]"
        >
          <Plus size={18} />
          Lập hồ sơ trả phòng
        </button>
      </div>

      <div className="overflow-hidden rounded-[16px] border border-[#d9ddd2] bg-white shadow-[0_8px_24px_rgba(33,41,21,0.04)]">
        <div className="border-b border-[#e3e7de] px-5 py-4 sm:px-6">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
            <label className="relative block xl:flex-[1.35]">
              <Search
                size={18}
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#8e9389]"
              />
              <input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Tìm theo mã hồ sơ, CCCD, mã phòng..."
                className="h-[46px] w-full rounded-[8px] border border-[#d7dbd1] bg-white pl-11 pr-4 text-[15px] text-[#31372b] outline-none transition placeholder:text-[#a1a69d] focus:border-[#9ead89]"
              />
            </label>

            <div className="xl:flex-[0.75]">
              <input
                type="date"
                value={dateFilter}
                onChange={(event) => setDateFilter(event.target.value)}
                className="h-[46px] w-full rounded-[8px] border border-[#d7dbd1] bg-white px-4 text-[15px] text-[#43493b] outline-none transition focus:border-[#9ead89]"
              />
            </div>

            <button
              type="button"
              onClick={handleApplyFilters}
              className="inline-flex h-[46px] min-w-[96px] items-center justify-center gap-2 rounded-[8px] border border-[#d7dbd1] bg-white px-4 text-[15px] font-semibold text-[#5d6258] transition hover:border-[#c3cab8] hover:bg-[#f7f8f4]"
            >
              <Filter size={16} />
              Lọc
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-[1080px] w-full border-collapse">
            <thead>
              <tr className="bg-[#f8f8f6] text-left text-[12px] font-bold uppercase tracking-[0.03em] text-[#7a8074]">
                <th className="px-5 py-4">Mã hồ sơ</th>
                <th className="px-4 py-4">Khách thuê</th>
                <th className="px-4 py-4">CCCD/SĐT</th>
                <th className="px-4 py-4">Phòng/Giường</th>
                <th className="px-4 py-4">Ngày trả phòng</th>
                <th className="px-5 py-4 text-center">Thao tác</th>
              </tr>
            </thead>

            <tbody>
              {paginatedRows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-14 text-center text-[16px] text-[#74796f]">
                    Không có hồ sơ trả phòng phù hợp với bộ lọc hiện tại.
                  </td>
                </tr>
              ) : (
                paginatedRows.map((row) => (
                  <tr
                    key={row.id}
                    className="border-t border-[#e7e9e2] text-[15px] font-medium text-[#444a3f]"
                  >
                    <td className="px-5 py-5 font-semibold text-[#575c50]">
                      <span className="block max-w-[88px] break-words leading-[1.45]">{row.id}</span>
                    </td>
                    <td className="px-4 py-5">
                      <span className="block max-w-[130px] break-words leading-[1.45] text-[#343a2f]">
                        {row.tenantName}
                      </span>
                    </td>
                    <td className="px-4 py-5 text-[#5f645b]">{row.idCardOrPhone}</td>
                    <td className="px-4 py-5 text-[#575c50]">{row.roomBed}</td>
                    <td className="px-4 py-5 text-[#5b6056]">{formatDate(row.returnDate)}</td>
                    <td className="px-5 py-5 text-center">
                      <button
                        type="button"
                        onClick={() => navigate(`${detailBasePath}/${row.id}`)}
                        className="text-[15px] font-semibold text-[#5c614e] transition hover:text-[#465c2d]"
                      >
                        Chi tiết
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col gap-3 border-t border-[#e2e5dd] px-5 py-4 text-[14px] text-[#666b62] sm:px-6 lg:flex-row lg:items-center lg:justify-between">
          <p className="font-medium">
            {filteredRows.length === 0
              ? 'Hiển thị 0 hồ sơ'
              : `Hiển thị ${startIndex} - ${endIndex} trong số ${filteredRows.length} hồ sơ`}
          </p>

          <div className="flex items-center gap-2 self-end lg:self-auto">
            <button
              type="button"
              onClick={() => setCurrentPage((page) => Math.max(page - 1, 1))}
              disabled={currentPage === 1}
              aria-label="Trang trước"
              className="inline-flex h-8 w-8 items-center justify-center rounded-full text-[#7d8277] transition hover:bg-[#f3f5ef] hover:text-[#45592d] disabled:cursor-not-allowed disabled:opacity-45"
            >
              <ChevronLeft size={18} />
            </button>

            <button
              type="button"
              onClick={() => setCurrentPage((page) => Math.min(page + 1, totalPages))}
              disabled={currentPage === totalPages}
              aria-label="Trang sau"
              className="inline-flex h-8 w-8 items-center justify-center rounded-full text-[#7d8277] transition hover:bg-[#f3f5ef] hover:text-[#45592d] disabled:cursor-not-allowed disabled:opacity-45"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
