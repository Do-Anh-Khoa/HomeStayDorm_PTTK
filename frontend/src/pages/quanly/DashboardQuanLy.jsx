import { useEffect, useState } from 'react'
import PageTitle from '../../components/common/PageTitle.jsx'
import api from '../../services/api.js'

const initialSummaryCards = [
  {
    title: 'PHIẾU THU CHỜ DUYỆT',
    value: 0,
    icon: '🧾',
  },
  {
    title: 'LỊCH BÀN GIAO HÔM NAY',
    value: 0,
    icon: '📅',
  },
  {
    title: 'TRẢ PHÒNG & KIỂM TRA',
    value: 0,
    icon: '🔑',
  },
  {
    title: 'PHIẾU THU CẦN THANH TOÁN',
    value: 0,
    icon: '💳',
  },
]

const initialBedStats = [
  {
    label: 'Đã đặt cọc',
    value: 0,
    color: '#3b4f27',
  },
  {
    label: 'Đang sử dụng',
    value: 0,
    color: '#d8e8cf',
  },
  {
    label: 'Trống',
    value: 0,
    color: '#e6e8e6',
  },
]

const initialReceiptStats = [
  {
    label: 'Đặt cọc',
    values: {
      unpaid: 0,
      paid: 0,
      valid: 0,
      invalid: 0,
    },
  },
  {
    label: 'Hợp đồng',
    values: {
      unpaid: 0,
      paid: 0,
      valid: 0,
      invalid: 0,
    },
  },
  {
    label: 'Trả phòng',
    values: {
      unpaid: 0,
      paid: 0,
      valid: 0,
      invalid: 0,
    },
  },
  {
    label: 'Bồi thường',
    values: {
      unpaid: 0,
      paid: 0,
      valid: 0,
      invalid: 0,
    },
  },
]

function SummaryCard({ item }) {
  return (
    <div style={S.summaryCard}>
      <div style={S.summaryIcon}>{item.icon}</div>
      <div style={S.summaryTitle}>{item.title}</div>
      <div style={S.summaryValue}>{item.value}</div>
    </div>
  )
}

function BedStatusCard({ bedStats }) {
  const totalBeds = bedStats.reduce((sum, item) => sum + item.value, 0)

  return (
    <div style={S.card}>
      <h3 style={S.cardTitle}>Tình trạng giường</h3>

      <div style={S.bedChartWrap}>
        <div style={S.bedChart}>
          <div style={S.bedChartInner}>
            <div style={S.bedTotal}>{totalBeds}</div>
            <div style={S.bedTotalText}>TỔNG SỐ</div>
          </div>
        </div>
      </div>

      <div style={S.bedLegend}>
        {bedStats.map(item => (
          <div key={item.label} style={S.bedLegendRow}>
            <div style={S.bedLegendLeft}>
              <span style={{ ...S.legendDot, backgroundColor: item.color }} />
              <span>{item.label}</span>
            </div>
            <strong>{item.value}</strong>
          </div>
        ))}
      </div>
    </div>
  )
}

function ReceiptStatusCard({ receiptStats }) {
  const colors = {
    unpaid: '#dedfdd',
    paid: '#d8e8cf',
    valid: '#3b4f27',
    invalid: '#d71920',
  }

  return (
    <div style={S.cardWide}>
      <div style={S.receiptHeader}>
        <h3 style={S.cardTitle}>Tình trạng phiếu thu</h3>

        <div style={S.receiptLegend}>
          <div style={S.receiptLegendItem}>
            <span style={{ ...S.legendSquare, backgroundColor: colors.unpaid }} />
            Chưa thanh toán
          </div>
          <div style={S.receiptLegendItem}>
            <span style={{ ...S.legendSquare, backgroundColor: colors.paid }} />
            Đã thanh toán
          </div>
          <div style={S.receiptLegendItem}>
            <span style={{ ...S.legendSquare, backgroundColor: colors.valid }} />
            Hợp lệ
          </div>
          <div style={S.receiptLegendItem}>
            <span style={{ ...S.legendSquare, backgroundColor: colors.invalid }} />
            Không hợp lệ
          </div>
        </div>
      </div>

      <div style={S.receiptRows}>
        {receiptStats.map(row => {
          const total =
            row.values.unpaid +
            row.values.paid +
            row.values.valid +
            row.values.invalid

          return (
            <div key={row.label} style={S.receiptRow}>
              <div style={S.receiptLabel}>{row.label}</div>

              <div style={S.stackedBar}>
                <div
                  style={{
                    ...S.stackedPart,
                    width: `${(row.values.unpaid / total) * 100}%`,
                    backgroundColor: colors.unpaid,
                  }}
                />
                <div
                  style={{
                    ...S.stackedPart,
                    width: `${(row.values.paid / total) * 100}%`,
                    backgroundColor: colors.paid,
                  }}
                />
                <div
                  style={{
                    ...S.stackedPart,
                    width: `${(row.values.valid / total) * 100}%`,
                    backgroundColor: colors.valid,
                  }}
                />
                <div
                  style={{
                    ...S.stackedPart,
                    width: `${(row.values.invalid / total) * 100}%`,
                    backgroundColor: colors.invalid,
                  }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function TrangChuQuanLyPage() {
  const [summaryCards, setSummaryCards] = useState(initialSummaryCards)
  const [bedStats, setBedStats] = useState(initialBedStats)
  const [receiptStats, setReceiptStats] = useState(initialReceiptStats)
  const [description, setDescription] = useState('Đang tải dữ liệu...')

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const response = await api.get('/dashboard/manager')

        if (response.data?.success) {
          const { summaryCards: serverSummaryCards, bedStats: serverBedStats, receiptStats: serverReceiptStats, description: serverDescription } = response.data.data

          setSummaryCards(serverSummaryCards || initialSummaryCards)
          setBedStats(serverBedStats || initialBedStats)
          setReceiptStats(serverReceiptStats || initialReceiptStats)
          setDescription(serverDescription || 'Chào mừng trở lại!')
        }
      } catch (error) {
        console.error('Không thể tải dữ liệu dashboard:', error)
        setDescription('Chào mừng trở lại! Không thể tải dữ liệu mới nhất.')
      }
    }

    fetchDashboard()
  }, [])

  return (
    <section style={S.page}>
      <div style={S.header}>
        <PageTitle
          title="Trang chủ Quản lý"
          description={description}
        />
      </div>

      <div style={S.summaryGrid}>
        {summaryCards.map(item => (
          <SummaryCard key={item.title} item={item} />
        ))}
      </div>

      <div style={S.chartGrid}>
        <BedStatusCard bedStats={bedStats} />
        <ReceiptStatusCard receiptStats={receiptStats} />
      </div>
    </section>
  )
}

const S = {
  page: {
    padding: '0',
  },

  header: {
    marginBottom: '16px',
  },

  summaryGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, minmax(160px, 1fr))',
    gap: '16px',
    marginBottom: '12px',
  },

  summaryCard: {
    backgroundColor: '#fff',
    border: '1px solid #d9ded4',
    borderRadius: '10px',
    padding: '14px 22px',
    minHeight: '115px',
    boxSizing: 'border-box',
  },

  summaryIcon: {
    width: '40px',
    height: '40px',
    borderRadius: '12px',
    backgroundColor: '#f0f4eb',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '22px',
    marginBottom: '10px',
  },

  summaryTitle: {
    color: '#6b7560',
    fontSize: '12px',
    fontWeight: 800,
    letterSpacing: '0.3px',
    lineHeight: 1.35,
    minHeight: '34px',
  },

  summaryValue: {
    marginTop: '6px',
    fontSize: '34px',
    fontWeight: 900,
    color: '#151915',
    lineHeight: 1,
  },

  chartGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 2.08fr',
    gap: '18px',
    alignItems: 'stretch',
  },

  card: {
    backgroundColor: '#fff',
    border: '1px solid #d9ded4',
    borderRadius: '10px',
    padding: '16px 18px',
    boxSizing: 'border-box',
    minHeight: '300px',
  },

  cardWide: {
    backgroundColor: '#fff',
    border: '1px solid #d9ded4',
    borderRadius: '10px',
    padding: '18px 28px',
    boxSizing: 'border-box',
    minHeight: '300px',
    display: 'flex',
    flexDirection: 'column',
  },

  cardTitle: {
    margin: 0,
    color: '#1f2a1d',
    fontSize: '20px',
    fontWeight: 800,
  },

  bedChartWrap: {
    display: 'flex',
    justifyContent: 'center',
    margin: '18px 0 18px',
  },

  bedChart: {
    width: '125px',
    height: '125px',
    borderRadius: '50%',
    background:
    'conic-gradient(#3b4f27 0deg 180deg, #d8e8cf 180deg 300deg, #e6e8e6 300deg 360deg)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },

  bedChartInner: {
    width: '78px',
    height: '78px',
    borderRadius: '50%',
    backgroundColor: '#fff',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },

  bedTotal: {
    fontSize: '32px',
    fontWeight: 900,
    color: '#1a1f14',
    lineHeight: 1,
  },

  bedTotalText: {
    marginTop: '4px',
    fontSize: '11px',
    fontWeight: 800,
    color: '#6b7560',
  },

  bedLegend: {
    display: 'grid',
    gap: '10px',
  },

  bedLegendRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f4f5f3',
    borderRadius: '8px',
    padding: '7px 12px',
    fontSize: '13px',
    color: '#4c5548',
  },

  bedLegendLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },

  legendDot: {
    width: '10px',
    height: '10px',
    borderRadius: '50%',
    display: 'inline-block',
  },

  receiptHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '12px',
    marginBottom: '18px',
  },
  
  receiptLegend: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    flexWrap: 'wrap',
    color: '#6b7560',
    fontSize: '11px',
    fontWeight: 600,
  },

  receiptLegendItem: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
  },

  legendSquare: {
    width: '8px',
    height: '8px',
    display: 'inline-block',
    borderRadius: '2px',
  },

  receiptRow: {
    display: 'grid',
    gridTemplateColumns: '95px 1fr',
    alignItems: 'center',
    gap: '16px',
  },

  receiptRows: {
    flex: 1,
    display: 'grid',
    gap: '22px',
    alignContent: 'center',
  },

  receiptLabel: {
    color: '#4f5949',
    fontSize: '13px',
    fontWeight: 700,
    textAlign: 'right',
  },

  stackedBar: {
    height: '44px',
    borderRadius: '0',
    overflow: 'hidden',
    display: 'flex',
    backgroundColor: '#eef0eb',
    width: '100%',
  },

  stackedPart: {
    height: '100%',
  },
}