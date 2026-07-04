import { formatTier, getBadgeColor } from '../utils/formatters';

export default function TierBadge({ tier, className = '' }) {
  const colorClass = getBadgeColor('tier', tier);
  const text = formatTier(tier);

  return (
    <span className={`badge ${colorClass} ${className}`}>
      {text}
    </span>
  );
}
