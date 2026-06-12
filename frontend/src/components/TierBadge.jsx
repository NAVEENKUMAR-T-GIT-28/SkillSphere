export default function TierBadge({ tier, className = '' }) {
  const tierMap = {
    beginner: { bg: 'bg-gray-100', text: 'text-gray-700', label: 'Beginner' },
    developing: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Developing' },
    placement_ready: { bg: 'bg-green-100', text: 'text-green-700', label: 'Placement Ready' },
    industry_ready: { bg: 'bg-indigo-100', text: 'text-indigo-700', label: 'Industry Ready' },
  };

  const config = tierMap[tier] || tierMap.beginner;

  return (
    <span className={`badge ${config.bg} ${config.text} ${className}`}>
      {config.label}
    </span>
  );
}
