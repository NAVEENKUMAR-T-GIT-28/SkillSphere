export default function Textarea({
  label,
  error,
  className = "",
  ...props
}) {
  return (
    <div className="space-y-1.5">

      {label && (
        <label className="text-sm font-semibold text-slate-700">
          {label}
        </label>
      )}

      <textarea
        {...props}
        className={`min-h-[100px] w-full rounded-[12px] border border-slate-300 px-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 outline-none transition-all

        focus:border-blue-500
        focus:ring-4
        focus:ring-blue-100

        ${className}`}
      />

      {error && (
        <p className="text-sm text-red-500">
          {error}
        </p>
      )}

    </div>
  );
}