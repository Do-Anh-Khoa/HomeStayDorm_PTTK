import {
  ArrowLeft,
  CalendarDays,
  Clock3,
  FileText,
  Mail,
  Printer,
  SquareArrowOutUpRight,
  Trash2,
  UserRound,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { cancelReturnProfile, fetchReturnProfileDetail } from '../../services/hoSoTraPhong.js'

const RENT_STATUS_STYLES = {
  'Đang sử dụng': 'bg-[#f7d8d6] text-[#9f5d58]',
  'Đã trả phòng': 'bg-[#dfead5] text-[#647b44]',
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

function InfoField({ label, value, icon: Icon, badge = false }) {
  if (badge) {
    return (
      <div className="space-y-2">
        <div className="text-[13px] font-semibold text-[#7b8176]">{label}</div>
        <span
          className={`inline-flex min-h-[28px] items-center rounded-full px-3 py-1 text-[13px] font-semibold ${RENT_STATUS_STYLES[value] || 'bg-[#ecece8] text-[#62665d]'}`}
        >
          {value}
        </span>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <div className="text-[13px] font-semibold text-[#7b8176]">{label}</div>
      <div className="flex items-center gap-2 text-[16px] font-semibold text-[#32382d]">
        {Icon ? <Icon size={16} className="text-[#6d7268]" /> : null}
        <span>{value || '--'}</span>
      </div>
    </div>
  )
}

export default function ChiTietHoSoTraPhongPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { profileId = '' } = useParams()
  const listPath = location.pathname.startsWith('/sale') ? '/sale/tra-phong' : '/quan-ly/tra-phong'

  const [rawDetail, setRawDetail] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function load() {
      setIsLoading(true)
      try {
        const data = await fetchReturnProfileDetail(profileId)
        if (!cancelled) {
          setRawDetail(data)
        }
      } catch {
        if (!cancelled) {
          setRawDetail(null)
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    load()

    return () => {
      cancelled = true
    }
  }, [profileId])

  const detail = useMemo(() => {
    if (!rawDetail) return null
    const contractId = rawDetail.maHopDong || ''
    const expectedReturnDate = rawDetail.ngayTraPhongDuKien || ''
    const isDepositCase = !contractId
    const emailStatus = isDepositCase
      ? 'Không gửi email'
      : expectedReturnDate
        ? 'Đã gửi'
        : '--'

    return {
      maHoSo: rawDetail.maHoSo || profileId,
      customerName: rawDetail.hoVaTen || '',
      cccd: rawDetail.cccd || '',
      phone: rawDetail.soDienThoai || '',
      email: rawDetail.email || '',
      profileType: contractId ? 'Hợp đồng thuê' : 'Phiếu đặt cọc',
      contractId,
      depositId: rawDetail.maPdc || '',
      roomBed: rawDetail.phongGiuong || '',
      currentStatus: rawDetail.trangThaiHienTai || 'Đang sử dụng',
      expectedReturnDate,
      appointmentTime: rawDetail.lichHenTraPhong || '',
      emailStatus,
    }
  }, [profileId, rawDetail])

  const isDepositCase = !detail?.contractId
  const returnDateDisplay = isDepositCase
    ? 'Giải quyết trong ngày'
    : formatDate(detail?.expectedReturnDate)
  const appointmentDisplay = isDepositCase
    ? 'Giải quyết trong ngày'
    : detail?.appointmentTime

  const handleCancel = async () => {
    const confirmed = window.confirm('Bạn có chắc chắn muốn hủy hồ sơ trả phòng này không?')
    if (!confirmed) return

    try {
      await cancelReturnProfile(profileId)
      window.alert('Hủy hồ sơ trả phòng thành công.')
      navigate(listPath)
    } catch (error) {
      window.alert(error?.response?.data?.message || 'Không thể hủy hồ sơ trả phòng.')
    }
  }

  return (
    <section className="pb-8">
      <div className="mx-auto w-full max-w-[1080px]">
        <div className="overflow-hidden rounded-[16px] border border-[#d9ddd2] bg-white shadow-[0_8px_24px_rgba(33,41,21,0.04)]">
          <div className="flex flex-col gap-4 border-b border-[#e3e7de] px-5 py-5 sm:px-6 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => navigate(listPath)}
                aria-label="Quay lại danh sách hồ sơ trả phòng"
                className="inline-flex h-9 w-9 items-center justify-center rounded-full text-[#666d61] transition hover:bg-[#f3f5ef] hover:text-[#465c2d]"
              >
                <ArrowLeft size={18} />
              </button>

              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-[24px] font-extrabold tracking-[-0.02em] text-[#26351d] sm:text-[30px]">
                  Chi tiết hồ sơ trả phòng {detail?.maHoSo || profileId}
                </h1>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={handleCancel}
                disabled={isLoading || !detail}
                className="inline-flex h-[42px] items-center justify-center gap-2 rounded-[10px] border border-[#b96f6a] bg-[#f4cac8] px-4 text-[14px] font-semibold text-[#5f2623] transition hover:bg-[#efbfbc]"
              >
                <Trash2 size={15} />
                Hủy hồ sơ
              </button>

              <button
                type="button"
                className="inline-flex h-[42px] items-center justify-center gap-2 rounded-[10px] border border-[#9cab8e] bg-white px-4 text-[14px] font-semibold text-[#4f5f3b] transition hover:bg-[#f5f7f1]"
              >
                <Printer size={15} />
                In hồ sơ
              </button>
            </div>
          </div>

          <div className="space-y-10 px-5 py-6 sm:px-6 sm:py-7">
            <section className="space-y-4">
              <div className="flex items-center gap-2 border-b border-[#ecefe8] pb-3 text-[#55604a]">
                <UserRound size={16} />
                <h2 className="text-[15px] font-extrabold uppercase tracking-[0.03em]">
                  I. THÔNG TIN KHÁCH THUÊ
                </h2>
              </div>

              <div className="grid gap-x-10 gap-y-6 md:grid-cols-2">
                <InfoField label="Họ tên" value={detail?.customerName || ''} />
                <InfoField label="CCCD" value={detail?.cccd || ''} />
                <InfoField label="Số điện thoại" value={detail?.phone || ''} />
                <InfoField label="Email" value={detail?.email || ''} />
              </div>
            </section>

            <section className="space-y-4">
              <div className="flex items-center gap-2 border-b border-[#ecefe8] pb-3 text-[#55604a]">
                <FileText size={16} />
                <h2 className="text-[15px] font-extrabold uppercase tracking-[0.03em]">
                  II. THÔNG TIN THUÊ
                </h2>
              </div>

              <div className="grid gap-5 rounded-[12px] border border-[#d9ddd2] bg-[#fcfcfa] px-5 py-5 md:grid-cols-2 xl:grid-cols-4">
                <InfoField label="Loại hồ sơ" value={detail?.profileType || ''} />
                <div className="space-y-2">
                  <div className="text-[13px] font-semibold text-[#7b8176]">
                    {isDepositCase ? 'Mã PDC' : 'Mã hợp đồng'}
                  </div>
                  <div className="flex items-center gap-2 text-[16px] font-semibold text-[#32382d]">
                    <span>{detail?.contractId || detail?.depositId || '--'}</span>
                    {!isDepositCase ? (
                      <SquareArrowOutUpRight size={14} className="text-[#6d7268]" />
                    ) : null}
                  </div>
                </div>
                <InfoField label="Phòng/Giường" value={detail?.roomBed || ''} />
                <InfoField label="Trạng thái hiện tại" value={detail?.currentStatus || ''} badge />
              </div>
            </section>

            <section className="space-y-4">
              <div className="flex items-center gap-2 border-b border-[#ecefe8] pb-3 text-[#55604a]">
                <CalendarDays size={16} />
                <h2 className="text-[15px] font-extrabold uppercase tracking-[0.03em]">
                  III. THÔNG TIN TRẢ PHÒNG
                </h2>
              </div>

              <div className="grid gap-x-10 gap-y-6 md:grid-cols-2">
                <InfoField
                  label="Ngày trả phòng dự kiến"
                  value={returnDateDisplay}
                  icon={CalendarDays}
                />
                <InfoField
                  label="Lịch hẹn trả phòng"
                  value={appointmentDisplay}
                  icon={Clock3}
                />
                <InfoField label="Trạng thái email" value={detail?.emailStatus || ''} icon={Mail} />
              </div>
            </section>
          </div>

          <div className="flex justify-end border-t border-[#e3e7de] px-5 py-4 sm:px-6">
            <button
              type="button"
              onClick={() => navigate(listPath)}
              className="inline-flex h-[44px] items-center justify-center rounded-[10px] border border-[#cfd5c8] bg-white px-6 text-[14px] font-semibold text-[#676d63] transition hover:bg-[#f5f7f1]"
            >
              Quay lại danh sách
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
