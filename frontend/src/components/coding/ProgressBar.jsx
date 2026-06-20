export default function ProgressBar({
  label,
  value,
  max,
  color = "bg-primary"
}) {
  const width = max ? (value / max) * 100 : 0;

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span>{label}</span>
        <span>{value}</span>
      </div>

      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full ${color}`}
          style={{ width: `${width}%` }}
        />
      </div>
    </div>
  );
}
