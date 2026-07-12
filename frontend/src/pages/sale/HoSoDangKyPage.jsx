import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Eye,
  Plus,
  Search,
} from 'lucide-react'
import PageTitle from '../../components/common/PageTitle.jsx'
import { fetchHoSoDangKyList } from '../../services/hoSoDangKy.js'

const PAGE_SIZE = 4

const STATUS_OPTIONS = [
  'Tất cả trạng thái',
  'Mới tiếp nhận',
  'Đã hẹn',
  'Đã chốt cọc',
  'Hủy yêu cầu',
]

const STATUS_STYLES = {
  'Mới tiếp nhận': 'bg-[#dff0ff] text-[#3f87c7]',
  'Đã hẹn': 'bg-[#dfe9ff] text-[#4a79d9]',
  'Đã chốt cọc': 'bg-[#dfeccf] text-[#6f9251]',
  'Hủy yêu cầu': 'bg-[#ffe3e1] text-[#d46b64]',
}

function StatusBadge({ status }) {
  return (
    <span
      className={`inline-flex min-h-11 items-center rounded-[14px] px-4 py-2 text-[15px] font-semibold leading-tight ${STATUS_STYLES[status] || 'bg-[#ecece8] text-[#62665d]'}`}
    >
      {status}
    </span>
  )
}

export default function HoSoDangKyPage() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState(STATUS_OPTIONS[0])
  const [currentPage, setCurrentPage] = useState(1)
  const [profiles, setProfiles] = useState([])
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: PAGE_SIZE,
    totalItems: 0,
    totalPages: 1,
  })
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    let isMounted = true

    async function loadProfiles() {
      setLoading(true)
      setErrorMessage('')

      try {
        const data = await fetchHoSoDangKyList({
          search,
          status: statusFilter,
          page: currentPage,
          pageSize: PAGE_SIZE,
        })

        if (!isMounted) {
          return
        }

        setProfiles(data.items || [])
        setPagination(data.pagination || pagination)
      } catch (error) {
        if (isMounted) {
          setProfiles([])
          setErrorMessage(error.response?.data?.message || 'Không thể tải danh sách hồ sơ.')
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    loadProfiles()

    return () => {
      isMounted = false
    }
  }, [search, statusFilter, currentPage])

  const handleSearchChange = (event) => {
    setSearch(event.target.value)
    setCurrentPage(1)
  }

  const handleStatusChange = (event) => {
    setStatusFilter(event.target.value)
    setCurrentPage(1)
  }

  const handlePreviousPage = () => {
    setCurrentPage((page) => Math.max(page - 1, 1))
  }

  const handleNextPage = () => {
    setCurrentPage((page) => Math.min(page + 1, pagination.totalPages || 1))
  }

  const startIndex =
    pagination.totalItems === 0 ? 0 : (pagination.page - 1) * pagination.pageSize + 1
  const endIndex = Math.min(
    pagination.page * pagination.pageSize,
    pagination.totalItems,
  )

  return (
    <section className="space-y-8 pb-8">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <PageTitle
          title="Quản lý Hồ sơ Khách hàng"
          description="Danh sách các yêu cầu thuê phòng đang xử lý"
        />

        <button
          type="button"
          onClick={() => navigate('/sale/ho-so-dang-ky/tao-moi')}
          className="inline-flex h-[54px] items-center justify-center gap-2 rounded-[8px] bg-[#4b6132] px-7 text-[18px] font-semibold text-white shadow-[0_6px_12px_rgba(75,97,50,0.16)] transition hover:bg-[#42572c]"
        >
          <Plus size={20} />
          Thêm mới hồ sơ
        </button>
      </div>

      <div className="overflow-hidden rounded-[18px] border border-[#d9ddd2] bg-white shadow-[0_8px_24px_rgba(33,41,21,0.04)]">
        <div className="border-b border-[#e2e5dd] px-6 py-6 sm:px-8">
          <div className="flex flex-col gap-4 xl:flex-row">
            <label className="relative block xl:max-w-[420px] xl:flex-1">
              <Search
                size={22}
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#8f938b]"
              />
              <input
                type="text"
                value={search}
                onChange={handleSearchChange}
                placeholder="Tìm kiếm theo tên, CCCD hoặc SĐT..."
                className="h-[54px] w-full rounded-[8px] border border-[#d7dbd1] bg-white pl-13 pr-4 text-[18px] text-[#31372b] outline-none transition placeholder:text-[#a1a69d] focus:border-[#9ead89]"
              />
            </label>

            <div className="relative w-full xl:w-[240px]">
              <select
                value={statusFilter}
                onChange={handleStatusChange}
                className="h-[54px] w-full appearance-none rounded-[8px] border border-[#d7dbd1] bg-white px-4 pr-12 text-[18px] text-[#43493b] outline-none transition focus:border-[#9ead89]"
              >
                {STATUS_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={20}
                className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[#7c8177]"
              />
            </div>
          </div>
        </div>

        {errorMessage && (
          <div className="border-b border-[#f0d5d3] bg-[#fff4f3] px-8 py-4 text-[15px] font-semibold text-[#c1443e]">
            {errorMessage}
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="min-w-[960px] w-full border-collapse">
            <thead>
              <tr className="bg-[#f8f8f6] text-left text-[15px] font-bold text-[#616659]">
                <th className="px-8 py-5">Mã HS</th>
                <th className="px-5 py-5">Khách hàng</th>
                <th className="px-5 py-5">SĐT</th>
                <th className="px-5 py-5">Nhu cầu</th>
                <th className="px-5 py-5">Ngày tạo</th>
                <th className="px-5 py-5">NV Sale</th>
                <th className="px-5 py-5">Trạng thái</th>
                <th className="px-8 py-5 text-center">Hành động</th>
              </tr>
            </thead>

            <tbody>
              {!loading && profiles.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-8 py-14 text-center text-[17px] text-[#74796f]">
                    Không tìm thấy hồ sơ phù hợp với bộ lọc hiện tại.
                  </td>
                </tr>
              )}

              {loading && (
                <tr>
                  <td colSpan={8} className="px-8 py-14 text-center text-[17px] text-[#74796f]">
                    Đang tải danh sách hồ sơ...
                  </td>
                </tr>
              )}

              {!loading &&
                profiles.map((profile) => (
                  <tr
                    key={profile.id}
                    className="border-t border-[#e7e9e2] text-[17px] font-medium text-[#444a3f]"
                  >
                    <td className="px-8 py-6 font-semibold text-[#575c50]">{profile.id}</td>
                    <td className="px-5 py-6">
                      <span className="block max-w-[140px] whitespace-normal font-semibold leading-[1.45] text-[#343a2f]">
                        {profile.customerName}
                      </span>
                    </td>
                    <td className="px-5 py-6 text-[#5f645b]">{profile.phone}</td>
                    <td className="px-5 py-6">
                      <span className="block max-w-[150px] whitespace-normal leading-[1.45] text-[#40453d]">
                        {profile.demand}
                      </span>
                    </td>
                    <td className="px-5 py-6 text-[#5b6056]">{profile.createdAt}</td>
                    <td className="px-5 py-6 text-[#575c50]">{profile.saleCode}</td>
                    <td className="px-5 py-6">
                      <StatusBadge status={profile.status} />
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center justify-center text-[#8e9389]">
                        <button
                          type="button"
                          aria-label={`Xem hồ sơ ${profile.id}`}
                          onClick={() => navigate(`/sale/ho-so-dang-ky/${profile.id}`)}
                          className="transition hover:text-[#465c2d]"
                        >
                          <Eye size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col gap-4 border-t border-[#e2e5dd] px-6 py-5 text-[15px] text-[#666b62] sm:px-8 lg:flex-row lg:items-center lg:justify-between">
          <p className="font-medium">
            {pagination.totalItems === 0
              ? 'Hiển thị 0 kết quả'
              : `Hiển thị ${startIndex} - ${endIndex} của ${pagination.totalItems} kết quả`}
          </p>

          <div className="flex items-center gap-3 self-end lg:self-auto">
            <button
              type="button"
              onClick={handlePreviousPage}
              disabled={pagination.page === 1}
              aria-label="Trang trước"
              className="inline-flex h-10 w-10 items-center justify-center rounded-[10px] border border-[#d9ddd2] bg-white text-[#7d8277] transition hover:border-[#b9c2ad] hover:text-[#45592d] disabled:cursor-not-allowed disabled:opacity-45"
            >
              <ChevronLeft size={18} />
            </button>
            <span className="min-w-[104px] text-center text-[17px] font-semibold text-[#474d40]">
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <button
              type="button"
              onClick={handleNextPage}
              disabled={pagination.page === pagination.totalPages}
              aria-label="Trang sau"
              className="inline-flex h-10 w-10 items-center justify-center rounded-[10px] border border-[#d9ddd2] bg-white text-[#7d8277] transition hover:border-[#b9c2ad] hover:text-[#45592d] disabled:cursor-not-allowed disabled:opacity-45"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
