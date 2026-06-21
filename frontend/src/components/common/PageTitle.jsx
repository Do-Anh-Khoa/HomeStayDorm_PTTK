export default function PageTitle({ title, description }) {
  return (
    <div className="min-w-0 max-w-full">
      <h1 className="break-words text-[34px] font-extrabold leading-[1.08] tracking-[-0.02em] text-[#26351d]">
        {title}
      </h1>
      {description && (
        <p className="mt-[8px] break-words text-[18px] leading-snug text-[#555852]">
          {description}
        </p>
      )}
    </div>
  )
}
