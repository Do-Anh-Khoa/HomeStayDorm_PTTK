import PageTitle from '../../components/common/PageTitle.jsx'
import PlaceholderTable from '../../components/common/PlaceholderTable.jsx'

export default function TraCuuPhongGiuongPage() {
  return (
    <section className="space-y-8 pb-8">
      <PageTitle
        title="Tra cứu phòng/giường"
        description="Tìm phòng/giường theo tiêu chí của khách sau khi tiếp nhận hồ sơ đăng ký."
      />

      <PlaceholderTable />
    </section>
  )
}
