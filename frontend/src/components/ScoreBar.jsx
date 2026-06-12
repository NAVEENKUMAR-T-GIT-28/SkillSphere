export default function ScoreBar({ label, value = 0, max = 20 }) {
  const percentage = (value / max) * 100;

  return (
    <div className="flex items-center gap-3">
      <p className="text-sm text-text-secondary min-w-16">{label}</p>
      <div className="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden">
        <div
          className="bg-primary h-full rounded-full transition-all duration-500"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <p className="text-sm font-medium text-text-primary min-w-12 text-right">
        {value}/{max}
      </p>
    </div>
  );
}
