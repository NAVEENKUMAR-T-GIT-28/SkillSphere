export default function SectionHeader({
  title,
  description,
}) {
  return (
    <div className="border-b border-slate-200 px-5 py-4">
      <h2 className="text-lg font-bold text-slate-900">
        {title}
      </h2>

      {description && (
        <p className="mt-0.5 text-xs text-slate-500">
          {description}
        </p>
      )}
    </div>
  );
}