import { useEffect, useState } from 'react'
import {
  ArrowLeft,
  BadgeCheck,
  CircleCheck,
  Home,
  PencilLine,
  Trash2,
  UserRound,
} from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import { fetchHoSoDangKyDetail } from '../../services/hoSoDangKy.js'

const STATUS_STYLES = {
  'Mới tiếp nhận': 'bg-[#dff0ff] text-[#3f87c7]',
  'Đã hẹn': 'bg-[#dfe9ff] text-[#4a79d9]',
  'Đã chốt cọc': 'bg-[#dfeccf] text-[#6f9251]',
  'Hủy yêu cầu': 'bg-[#ffe3e1] text-[#d46b64]',
}

function SectionHeader({ icon: Icon, title }) {
  return (
    <div className="mb-6 flex items-center gap-3">
      <span className="h-7 w-[3px] rounded-full bg-[#4b6132]" />
      <div className="flex items-center gap-2 text-[#4f5d40]">
        <Icon size={18} />
        <h2 className="text-[20px] font-bold tracking-[-0.01em] text-[#354129]">{title}</h2>
      </div>
    </div>
  )
}

function DetailRow({ label, value }) {
  return (
    <div className="grid grid-cols-[140px_minmax(0,1fr)] gap-3 text-[17px] leading-[1.65] md:grid-cols-[170px_minmax(0,1fr)]">
      <span className="font-medium text-[#666c61]">{label}:</span>
      <span className="font-semibold text-[#31382b]">{value || '--'}</span>
    </div>
  )
}

export default function ChiTietHoSoDangKyPage() {
  const navigate = useNavigate()
  const { profileId = '' } = useParams()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    let isMounted = true

    async function loadProfile() {
      setLoading(true)
      setErrorMessage('')

      try {
        const data = await fetchHoSoDangKyDetail(profileId)

        if (isMounted) {
          setProfile(data)
        }
      } catch (error) {
        if (isMounted) {
          setErrorMessage(error.response?.data?.message || 'Không thể tải chi tiết hồ sơ.')
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    loadProfile()

    return () => {
      isMounted = false
    }
  }, [profileId])

  const criteriaList = profile?.criteriaItems || []

  return (
    <section className="space-y-8 pb-8">
      <div className="rounded-[18px] border border-[#e3e5df] bg-white px-6 py-5 shadow-[0_8px_24px_rgba(33,41,21,0.04)] sm:px-8">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-4">
              <h1 className="text-[34px] font-extrabold leading-[1.1] tracking-[-0.02em] text-[#26351d]">
                Chi tiết Hồ sơ Khách hàng
              </h1>
              {profile?.status && (
                <span
                  className={`inline-flex min-h-11 items-center rounded-[14px] px-4 py-2 text-[15px] font-semibold ${STATUS_STYLES[profile.status] || 'bg-[#ecece8] text-[#62665d]'}`}
                >
                  {profile.status}
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              className="inline-flex h-[52px] items-center justify-center gap-2 rounded-[8px] border border-[#d7dbd1] bg-white px-6 text-[16px] font-semibold text-[#6a7065] transition hover:border-[#b9c2ad] hover:text-[#465c2d]"
            >
              <PencilLine size={18} />
              Chỉnh sửa hồ sơ
            </button>
            <button
              type="button"
              className="inline-flex h-[52px] items-center justify-center gap-2 rounded-[8px] border border-[#efc1bd] bg-[#fff0ef] px-6 text-[16px] font-semibold text-[#d46b64] transition hover:bg-[#ffe5e2]"
            >
              <Trash2 size={18} />
              Hủy hồ sơ
            </button>
          </div>
        </div>
      </div>

      <div className="rounded-[18px] border border-[#d9ddd2] bg-white p-5 shadow-[0_8px_24px_rgba(33,41,21,0.04)] sm:p-6 xl:p-8">
        {loading && (
          <div className="py-10 text-center text-[17px] text-[#737a70]">
            Đang tải chi tiết hồ sơ...
          </div>
        )}

        {!loading && errorMessage && (
          <div className="rounded-[12px] border border-[#efc1bd] bg-[#fff0ef] px-4 py-4 text-[15px] font-semibold text-[#c1443e]">
            {errorMessage}
          </div>
        )}

        {!loading && profile && (
          <>
            <div className="grid gap-10 xl:grid-cols-2">
              <div>
                <SectionHeader icon={UserRound} title="Thông tin cá nhân" />
                <div className="space-y-5">
                  <DetailRow label="Họ và tên" value={profile.customerName} />
                  <DetailRow label="Số điện thoại" value={profile.phone} />
                  <DetailRow label="Email" value={profile.email} />
                  <DetailRow label="Giới tính" value={profile.gender} />
                  <DetailRow label="CCCD" value={profile.cccd} />
                  <DetailRow label="Nghề nghiệp" value={profile.occupation} />
                  <DetailRow label="Quốc tịch" value={profile.nationality} />
                </div>
              </div>

              <div>
                <SectionHeader icon={Home} title="Yêu cầu lưu trú" />
                <div className="space-y-5">
                  <DetailRow label="Hình thức thuê" value={profile.rentType} />
                  <DetailRow label="Số lượng người" value={profile.peopleCount} />
                  <DetailRow label="Thời gian vào ở" value={profile.moveInDate} />
                  <DetailRow label="Thời hạn thuê" value={profile.duration} />
                  <DetailRow label="Chi nhánh" value={profile.branch} />
                </div>
              </div>
            </div>

            <div className="mt-12 border-t border-[#edf0ea] pt-8">
              <SectionHeader icon={CircleCheck} title="Tiện ích & Yêu cầu đặc biệt" />

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {criteriaList.map((criterion) => (
                  <div
                    key={criterion}
                    className="flex min-h-[68px] items-center justify-between rounded-[10px] border border-[#d5dec9] bg-[#dfead0] px-4 py-3"
                  >
                    <div className="flex items-center gap-3">
                      <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#edf4e3] text-[#4a6030]">
                        <BadgeCheck size={18} />
                      </span>
                      <span className="text-[17px] font-semibold text-[#4f5f3d]">{criterion}</span>
                    </div>
                    <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#354823] text-white">
                      <CircleCheck size={16} />
                    </span>
                  </div>
                ))}

                {criteriaList.length === 0 && (
                  <div className="rounded-[10px] border border-dashed border-[#d9ddd2] bg-[#fafbf8] px-4 py-5 text-[16px] text-[#6b7067]">
                    Hồ sơ này chưa có tiêu chí đặc biệt trong trường <span className="font-semibold">tieu_chi</span>.
                  </div>
                )}
              </div>

              <div className="mt-10 flex justify-end border-t border-[#edf0ea] pt-8">
                <button
                  type="button"
                  onClick={() => navigate('/sale/ho-so-dang-ky')}
                  className="inline-flex h-[52px] items-center justify-center gap-2 rounded-[8px] bg-[#4b6132] px-8 text-[16px] font-semibold text-white shadow-[0_6px_12px_rgba(75,97,50,0.16)] transition hover:bg-[#42572c]"
                >
                  <ArrowLeft size={18} />
                  Quay lại
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </section>
  )
}
