import { formatStatus, getBadgeColor } from '../utils/formatters';

export default function StatusBadge({ status, label = null }) {
  const colorClass = getBadgeColor('status', status);
  const text = label || formatStatus(status);

  return (
    <span className={`badge ${colorClass}`}>
      {text}
    </span>
  );
}
