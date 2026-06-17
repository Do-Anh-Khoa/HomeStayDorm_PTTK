export default function PlaceholderTable({ columns = ['Mã', 'Tên', 'Trạng thái', 'Thao tác'] }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-slate-100 text-slate-600">
          <tr>
            {columns.map((col) => (
              <th key={col} className="text-left px-4 py-3 font-semibold">{col}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr className="border-t border-slate-100">
            <td className="px-4 py-4 text-slate-500" colSpan={columns.length}>
              Dữ liệu mẫu sẽ được nối API sau.
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  )
}
