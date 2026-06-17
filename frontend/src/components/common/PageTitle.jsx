export default function PageTitle({ title, description }) {
  return (
    <div>
      <h1 className="text-[34px] font-extrabold leading-[1.08] tracking-[-0.02em] text-[#26351d]">
        {title}
      </h1>
      {description && <p className="mt-[8px] text-[18px] leading-snug text-[#555852]">{description}</p>}
    </div>
  )
}
