import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  BedDouble,
  CalendarDays,
  Hourglass,
  Phone,
  UserRoundPlus,
} from 'lucide-react'
import { getStoredUser } from '../../services/authSession.js'
import { fetchSaleDashboard } from '../../services/saleDashboard.js'

const EMPTY_DASHBOARD = {
  branch: null,
  summary: {
    availableBeds: 0,
    reservedBeds: 0,
    occupiedBeds: 0,
    appointmentCount: 0,
    newProfiles: 0,
    pendingDeposits: 0,
    totalBeds: 0,
  },
  roomStatus: {
    total: 0,
    items: [
      { key: 'occupied', label: 'Đang sử dụng', value: 0, color: '#20331a' },
      { key: 'available', label: 'Trống', value: 0, color: '#bfceb0' },
      { key: 'reserved', label: 'Đã đặt cọc', value: 0, color: '#d8dece' },
    ],
  },
  appointments: [],
}

const CARD_STYLES = {
  available: {
    iconWrap: 'bg-[#eef3e3] text-[#53624a]',
    pill: 'bg-[#dfe8cd] text-[#5d714e]',
  },
  appointment: {
    iconWrap: 'bg-[#eef0eb] text-[#5c6652]',
    pill: 'bg-[#edf1e8] text-[#5c6652]',
  },
  reserved: {
    iconWrap: 'bg-[#f3efe7] text-[#7f6449]',
    pill: 'bg-[#f6f1ea] text-[#7f6449]',
  },
  profile: {
    iconWrap: 'bg-[#eef2ea] text-[#5e7150]',
    pill: 'bg-[#edf2e9] text-[#60714f]',
  },
  deposit: {
    iconWrap: 'bg-[#fff0f0] text-[#c7372f]',
    pill: 'bg-[#fff1f1] text-[#c7372f]',
  },
}

function formatNumber(value) {
  return new Intl.NumberFormat('vi-VN').format(value || 0)
}

function formatDateTime(value) {
  if (!value) return '--'

  return new Intl.DateTimeFormat('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(value))
}

function getStatusClass(statusTone) {
  if (statusTone === 'success') {
    return 'bg-[#2f4925] text-[#f3f8ee]'
  }

  if (statusTone === 'warning') {
    return 'bg-[#fff4df] text-[#9a5a00]'
  }

  return 'bg-[#ecece8] text-[#777a70]'
}

function buildRingStyle(roomStatus) {
  const total = roomStatus.total || 0
  if (!total) {
    return {
      background: 'conic-gradient(#d8dece 0deg 360deg)',
    }
  }

  let currentAngle = 0
  const segments = roomStatus.items.map((item) => {
    const angle = (item.value / total) * 360
    const start = currentAngle
    const end = currentAngle + angle
    currentAngle = end
    return `${item.color} ${start}deg ${end}deg`
  })

  return {
    background: `conic-gradient(${segments.join(', ')})`,
  }
}

function SummaryCard({ icon: Icon, title, value, hint, tone }) {
  const styles = CARD_STYLES[tone]

  return (
    <article className="rounded-[24px] border border-[#d9ddd2] bg-white p-5 shadow-[0_10px_30px_rgba(39,56,30,0.05)] sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${styles.iconWrap}`}>
          <Icon size={22} strokeWidth={2.1} />
        </div>
        <span className={`w-fit rounded-full px-3 py-1 text-[12px] font-semibold ${styles.pill}`}>
          {hint}
        </span>
      </div>
      <p className="mt-5 text-[14px] font-bold uppercase tracking-[0.04em] text-[#707867]">
        {title}
      </p>
      <p className="mt-2 text-[42px] font-extrabold leading-none tracking-[-0.04em] text-[#181d16] sm:text-[48px] xl:text-[56px]">
        {formatNumber(value)}
      </p>
    </article>
  )
}

function SectionCard({ title, action, children, className = '' }) {
  return (
    <section
      className={`rounded-[28px] border border-[#d9ddd2] bg-white p-5 shadow-[0_12px_34px_rgba(39,56,30,0.06)] sm:p-6 ${className}`}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-[22px] font-extrabold tracking-[-0.02em] text-[#26351d] sm:text-[24px]">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  )
}

export default function DashboardSale() {
  const user = useMemo(() => getStoredUser(), [])
  const [dashboard, setDashboard] = useState(EMPTY_DASHBOARD)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadDashboard = async () => {
    setLoading(true)
    setError('')

    try {
      const data = await fetchSaleDashboard()
      setDashboard({
        ...EMPTY_DASHBOARD,
        ...data,
        summary: {
          ...EMPTY_DASHBOARD.summary,
          ...data.summary,
        },
        roomStatus: {
          ...EMPTY_DASHBOARD.roomStatus,
          ...data.roomStatus,
        },
      })
    } catch (err) {
      setError(err.response?.data?.message || 'Không tải được dashboard sale.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDashboard()
  }, [])

  const summaryCards = [
    {
      key: 'available',
      title: 'Tổng giường trống',
      value: dashboard.summary.availableBeds,
      hint: `${dashboard.summary.totalBeds} tổng`,
      icon: BedDouble,
      tone: 'available',
    },
    {
      key: 'appointment',
      title: 'Lịch hẹn đã tạo',
      value: dashboard.summary.appointmentCount,
      hint: 'Theo sale phụ trách',
      icon: CalendarDays,
      tone: 'appointment',
    },
    {
      key: 'reserved',
      title: 'Giường đã đặt cọc',
      value: dashboard.summary.reservedBeds,
      hint: `${dashboard.summary.occupiedBeds} đang sử dụng`,
      icon: Hourglass,
      tone: 'reserved',
    },
    {
      key: 'profile',
      title: 'Mới tiếp nhận',
      value: dashboard.summary.newProfiles,
      hint: 'Theo chi nhánh',
      icon: UserRoundPlus,
      tone: 'profile',
    },
    {
      key: 'deposit',
      title: 'Phiếu cọc chờ xử lý',
      value: dashboard.summary.pendingDeposits,
      hint: 'Chờ duyệt hoặc thanh toán',
      icon: ArrowRight,
      tone: 'deposit',
    },
  ]

  const ringStyle = buildRingStyle(dashboard.roomStatus)
  const branchName = dashboard.branch?.name || user?.ma_cn || 'Toàn hệ thống'
  const welcomeName = user?.ten_nv || 'nhân viên Sale'

  return (
    <section className="space-y-8 pb-8">
      <div>
        <p className="text-[14px] font-semibold uppercase tracking-[0.1em] text-[#80906c]">
          Sales Dashboard
        </p>
        <h1 className="mt-2 text-[30px] font-extrabold tracking-[-0.04em] text-[#26351d] sm:text-[34px] xl:text-[40px]">
          Chào mừng trở lại, {welcomeName}
        </h1>
        <p className="mt-2 max-w-[780px] text-[16px] leading-relaxed text-[#6d7267] sm:text-[18px]">
          Theo dõi số giường trống, lịch hẹn đã tạo, hồ sơ mới và phiếu cọc đang xử lý bằng dữ liệu
          thực tế tại {branchName}.
        </p>
      </div>

      {error && (
        <div className="rounded-[20px] border border-[#f1c8c4] bg-[#fff7f7] px-5 py-4 text-[15px] font-medium text-[#b33a31]">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {summaryCards.map((card) => (
          <SummaryCard
            key={card.key}
            icon={card.icon}
            title={card.title}
            value={loading ? 0 : card.value}
            hint={card.hint}
            tone={card.tone}
          />
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
        <SectionCard title="Trạng thái phòng">
          <div className="mt-10 flex justify-center">
            <div className="relative">
              <div
                className="h-[180px] w-[180px] rounded-full sm:h-[210px] sm:w-[210px]"
                style={ringStyle}
              />
              <div className="absolute inset-[16px] grid place-items-center rounded-full bg-white text-center shadow-[inset_0_0_0_1px_rgba(215,220,208,0.95)] sm:inset-[18px]">
                <div>
                  <p className="text-[46px] font-extrabold leading-none tracking-[-0.05em] text-[#181d16] sm:text-[58px]">
                    {formatNumber(dashboard.roomStatus.total)}
                  </p>
                  <p className="mt-2 text-[14px] font-bold uppercase tracking-[0.08em] text-[#919988]">
                    Tổng cộng
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-10 space-y-4">
            {dashboard.roomStatus.items.map((item) => (
              <div key={item.key} className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span
                    className="h-3.5 w-3.5 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-[18px] font-medium text-[#4a4f46]">{item.label}</span>
                </div>
                <span className="text-[18px] font-bold text-[#20251d]">{formatNumber(item.value)}</span>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard
          title="Lịch hẹn xem phòng gần đây"
          action={
            <Link
              to="/sale/lich-xem-phong"
              className="inline-flex items-center gap-2 text-[15px] font-semibold text-[#5d6d50] transition hover:text-[#2d3b24]"
            >
              Xem tất cả
              <ArrowRight size={16} />
            </Link>
          }
        >
          <div className="mt-6 overflow-x-auto">
            <div className="min-w-[770px] overflow-hidden rounded-[22px] border border-[#ebeee6]">
              <div className="grid grid-cols-[120px_240px_180px_150px] items-center gap-4 border-b border-[#ecefe8] bg-[#fafbf8] px-6 py-4 text-[14px] font-bold text-[#71796a]">
                <span>Thời gian</span>
                <span>Khách hàng</span>
                <span>Số điện thoại</span>
                <span>Trạng thái</span>
              </div>

              {dashboard.appointments.length === 0 && (
                <div className="px-6 py-16 text-center">
                  <p className="text-[18px] font-semibold text-[#36422d]">
                    {loading ? 'Đang tải lịch hẹn...' : 'Chưa có lịch hẹn nào trong dữ liệu hiện tại.'}
                  </p>
                  <p className="mt-2 text-[15px] text-[#7a8272]">
                    Khi có lịch hẹn mới, hệ thống sẽ hiển thị các bản ghi gần nhất để Sale theo dõi.
                  </p>
                </div>
              )}

              {dashboard.appointments.map((appointment) => (
                <div
                  key={appointment.id}
                  className="grid grid-cols-[120px_240px_180px_150px] items-center gap-4 border-b border-[#ecefe8] px-6 py-5 last:border-b-0"
                >
                  <span className="text-[18px] font-bold text-[#5e6458]">
                    {formatDateTime(appointment.time)}
                  </span>
                  <span className="text-[20px] font-bold text-[#384530]">
                    {appointment.customerName}
                  </span>
                  <span className="inline-flex items-center gap-2 text-[17px] font-semibold text-[#6a7263]">
                    <Phone size={16} />
                    {appointment.phone}
                  </span>
                  <span
                    className={`inline-flex w-fit rounded-full px-4 py-2 text-[14px] font-semibold ${getStatusClass(appointment.status.tone)}`}
                  >
                    {appointment.status.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </SectionCard>
      </div>
    </section>
  )
}
