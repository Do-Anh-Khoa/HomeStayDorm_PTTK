import { Link } from 'react-router-dom'

export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4">
      <h1 className="text-3xl font-bold text-slate-900">404</h1>
      <p className="text-slate-500">Không tìm thấy trang.</p>
      <Link className="text-blue-600" to="/login">Quay về đăng nhập</Link>
    </div>
  )
}
