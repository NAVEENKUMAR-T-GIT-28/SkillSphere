export default function Input({
  label,
  error,
  className = "",
  id,
  ...props
}) {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);
  const errorId = error && inputId ? `${inputId}-error` : undefined;

  return (
    <div className="space-y-1.5">
      {label && (
        <label
          htmlFor={inputId}
          className="text-sm font-semibold text-slate-700"
        >
          {label}
        </label>
      )}

      <input
        id={inputId}
        aria-describedby={errorId}
        aria-invalid={!!error}
        {...props}
        className={`w-full rounded-[12px] border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 outline-none transition-all duration-200

        focus:border-blue-500
        focus:ring-4
        focus:ring-blue-100

        disabled:bg-slate-100
        disabled:text-slate-500

        ${className}`}
      />

      {error && (
        <p id={errorId} className="text-sm text-red-500" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}