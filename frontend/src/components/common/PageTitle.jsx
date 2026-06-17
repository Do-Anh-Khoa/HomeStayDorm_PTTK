export default function PageTitle({ title, description }) {
  return (
    <div className="mb-6">
      <h2 className="text-2xl font-bold text-slate-900">{title}</h2>
      {description && <p className="text-slate-500 mt-1">{description}</p>}
    </div>
  )
}
