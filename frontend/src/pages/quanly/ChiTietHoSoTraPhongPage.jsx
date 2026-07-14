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
import {
  cancelReturnProfile,
  fetchReturnProfileDetail,
  openReturnProfilePdf,
} from '../../services/hoSoTraPhong.js'

const RENT_STATUS_STYLES = {
  'Đang sử dụng': 'bg-[#f7d8d6] text-[#9f5d58]',
  'Đã trả phòng': 'bg-[#dfead5] text-[#647b44]',
}

function escapePrintHtml(value) {
  return String(value || '--')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

function printField(label, value) {
  return `
    <div class="field">
      <div class="label">${escapePrintHtml(label)}</div>
      <div class="value">${escapePrintHtml(value)}</div>
    </div>
  `
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

function formatDateTime(value) {
  if (!value) {
    return ''
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return formatDate(value)
  }

  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

function buildReturnProfilePrintHtml({
  detail,
  profileId,
  isDepositCase,
  returnDateDisplay,
  appointmentDisplay,
}) {
  const printedAt = formatDateTime(new Date())
  const documentTitle = `Ho so tra phong ${detail.maHoSo || profileId}`
  const referenceLabel = isDepositCase ? 'Mã phiếu đặt cọc' : 'Mã hợp đồng'
  const referenceValue = detail.contractId || detail.depositId

  return `
    <!doctype html>
    <html lang="vi">
      <head>
        <meta charset="utf-8" />
        <title>${escapePrintHtml(documentTitle)}</title>
        <style>
          @page {
            size: A4;
            margin: 18mm;
          }

          * {
            box-sizing: border-box;
          }

          body {
            font-family: Arial, sans-serif;
            color: #1f2937;
            margin: 0;
            background: #ffffff;
          }

          .page {
            width: 100%;
            min-height: 100vh;
            padding: 0;
          }

          .national-title {
            text-align: center;
            color: #22311a;
            font-size: 14px;
            font-weight: 700;
            text-transform: uppercase;
            margin: 0;
          }

          .national-subtitle {
            text-align: center;
            color: #374151;
            font-size: 13px;
            font-weight: 700;
            margin: 4px 0 26px;
          }

          h1 {
            margin: 0;
            text-align: center;
            font-size: 26px;
            color: #22311a;
            text-transform: uppercase;
          }

          .code {
            margin: 8px 0 22px;
            text-align: center;
            color: #5f6658;
            font-size: 14px;
            font-weight: 700;
          }

          .meta {
            display: flex;
            justify-content: space-between;
            gap: 16px;
            border: 1px solid #d9ddd2;
            border-radius: 8px;
            padding: 10px 12px;
            color: #4b5563;
            font-size: 13px;
          }

          .section {
            margin-top: 22px;
            break-inside: avoid;
          }

          .section-title {
            margin: 0 0 10px;
            padding-bottom: 7px;
            border-bottom: 1.5px solid #d9ddd2;
            font-size: 15px;
            font-weight: 700;
            text-transform: uppercase;
            color: #334126;
          }

          .grid {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 10px 14px;
          }

          .field {
            border: 1px solid #d9ddd2;
            border-radius: 8px;
            padding: 10px 12px;
            min-height: 58px;
          }

          .label {
            font-size: 11px;
            font-weight: 700;
            color: #6b7280;
            margin-bottom: 5px;
            text-transform: uppercase;
          }

          .value {
            font-size: 14px;
            font-weight: 700;
            color: #1f2937;
            word-break: break-word;
            line-height: 1.45;
          }

          .note {
            margin: 18px 0 0;
            border: 1px dashed #c7cebd;
            border-radius: 8px;
            min-height: 76px;
            padding: 10px 12px;
          }

          .note-title {
            color: #6b7280;
            font-size: 12px;
            font-weight: 700;
            text-transform: uppercase;
          }

          .signatures {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 28px;
            margin-top: 34px;
            text-align: center;
            color: #1f2937;
          }

          .signature-title {
            font-size: 14px;
            font-weight: 700;
          }

          .signature-subtitle {
            margin-top: 4px;
            font-size: 12px;
            color: #6b7280;
            font-style: italic;
          }

          .signature-line {
            margin-top: 58px;
            font-size: 13px;
            font-weight: 700;
          }

          @media screen {
            body {
              background: #eef1e9;
              padding: 24px;
            }

            .page {
              max-width: 794px;
              min-height: 1123px;
              margin: 0 auto;
              background: #ffffff;
              padding: 48px;
              box-shadow: 0 14px 40px rgba(31, 41, 55, 0.14);
            }
          }

          @media print {
            body {
              background: #ffffff;
            }

            .page {
              min-height: auto;
            }
          }
        </style>
      </head>
      <body>
        <main class="page">
          <p class="national-title">Cộng hòa xã hội chủ nghĩa Việt Nam</p>
          <p class="national-subtitle">Độc lập - Tự do - Hạnh phúc</p>

          <h1>Hồ sơ trả phòng</h1>
          <div class="code">Mã hồ sơ: ${escapePrintHtml(detail.maHoSo || profileId)}</div>

          <div class="meta">
            <span>Ngày lập hồ sơ: <strong>${escapePrintHtml(formatDateTime(detail.createdAt))}</strong></span>
            <span>Thời gian in: <strong>${escapePrintHtml(printedAt)}</strong></span>
          </div>

          <section class="section">
            <h2 class="section-title">I. Thông tin khách thuê</h2>
            <div class="grid">
              ${printField('Họ tên', detail.customerName)}
              ${printField('CCCD', detail.cccd)}
              ${printField('Số điện thoại', detail.phone)}
              ${printField('Email', detail.email)}
            </div>
          </section>

          <section class="section">
            <h2 class="section-title">II. Thông tin thuê</h2>
            <div class="grid">
              ${printField('Loại hồ sơ', detail.profileType)}
              ${printField(referenceLabel, referenceValue)}
              ${printField('Phòng/Giường', detail.roomBed)}
              ${printField('Trạng thái hiện tại', detail.currentStatus)}
            </div>
          </section>

          <section class="section">
            <h2 class="section-title">III. Thông tin trả phòng</h2>
            <div class="grid">
              ${printField('Ngày trả phòng dự kiến', returnDateDisplay)}
              ${printField('Lịch hẹn trả phòng', appointmentDisplay)}
              ${printField('Trạng thái email', detail.emailStatus)}
            </div>
            <div class="note">
              <div class="note-title">Ghi chú xử lý</div>
            </div>
          </section>

          <section class="signatures">
            <div>
              <div class="signature-title">Khách thuê</div>
              <div class="signature-subtitle">(Ký và ghi rõ họ tên)</div>
              <div class="signature-line">${escapePrintHtml(detail.customerName)}</div>
            </div>
            <div>
              <div class="signature-title">Nhân viên lập hồ sơ</div>
              <div class="signature-subtitle">(Ký và ghi rõ họ tên)</div>
              <div class="signature-line">&nbsp;</div>
            </div>
          </section>
        </main>

        <script>
          window.addEventListener('load', () => {
            window.focus()
            window.print()
          })
        </script>
      </body>
    </html>
  `
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
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false)
  const [isCancelling, setIsCancelling] = useState(false)
  const [isPrinting, setIsPrinting] = useState(false)

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
      createdAt: rawDetail.ngayLap || '',
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
    setIsCancelling(true)
    try {
      await cancelReturnProfile(profileId)
      setIsCancelModalOpen(false)
      window.alert('Hủy hồ sơ trả phòng thành công.')
      navigate(listPath)
    } catch (error) {
      window.alert(error?.response?.data?.message || 'Không thể hủy hồ sơ trả phòng.')
    } finally {
      setIsCancelling(false)
    }
  }

  const handlePrint = async () => {
    if (!detail) return

    setIsPrinting(true)
    try {
      await openReturnProfilePdf(detail.maHoSo || profileId)
    } catch (error) {
      window.alert(error?.response?.data?.message || 'Không thể tải file PDF hồ sơ trả phòng.')
    } finally {
      setIsPrinting(false)
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
                onClick={() => setIsCancelModalOpen(true)}
                disabled={isLoading || !detail}
                className="inline-flex h-[42px] items-center justify-center gap-2 rounded-[10px] border border-[#b96f6a] bg-[#f4cac8] px-4 text-[14px] font-semibold text-[#5f2623] transition hover:bg-[#efbfbc]"
              >
                <Trash2 size={15} />
                Hủy hồ sơ
              </button>

              <button
                type="button"
                onClick={handlePrint}
                disabled={isLoading || !detail || isPrinting}
                className="inline-flex h-[42px] items-center justify-center gap-2 rounded-[10px] border border-[#9cab8e] bg-white px-4 text-[14px] font-semibold text-[#4f5f3b] transition hover:bg-[#f5f7f1]"
              >
                <Printer size={15} />
                {isPrinting ? 'Đang chuẩn bị...' : 'In hồ sơ'}
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

      {isCancelModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(34,40,28,0.45)] px-4">
          <div className="w-full max-w-[460px] rounded-[18px] bg-white shadow-[0_24px_60px_rgba(28,35,22,0.2)]">
            <div className="border-b border-[#e7eadf] px-6 py-5">
              <h2 className="text-[22px] font-extrabold text-[#26351d]">
                Xác nhận hủy hồ sơ
              </h2>
            </div>

            <div className="px-6 py-5">
              <p className="text-[15px] leading-[1.7] text-[#5f6658]">
                Bạn có chắc chắn muốn hủy hồ sơ trả phòng{' '}
                <span className="font-bold text-[#2f3728]">{detail?.maHoSo || profileId}</span> không?
              </p>
            </div>

            <div className="flex flex-col-reverse gap-3 border-t border-[#e7eadf] px-6 py-4 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setIsCancelModalOpen(false)}
                disabled={isCancelling}
                className="inline-flex h-[44px] items-center justify-center rounded-[10px] border border-[#cfd5c8] bg-white px-5 text-[14px] font-semibold text-[#676d63] transition hover:bg-[#f5f7f1] disabled:cursor-not-allowed disabled:opacity-60"
              >
                Đóng
              </button>

              <button
                type="button"
                onClick={handleCancel}
                disabled={isCancelling}
                className="inline-flex h-[44px] items-center justify-center rounded-[10px] bg-[#b4453d] px-5 text-[14px] font-semibold text-white transition hover:bg-[#9f3b34] disabled:cursor-not-allowed disabled:bg-[#d4a4a0]"
              >
                {isCancelling ? 'Đang hủy...' : 'Xác nhận hủy'}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
