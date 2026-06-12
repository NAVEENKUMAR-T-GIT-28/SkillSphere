export default function StatusBadge({ status, label = null }) {
  const statusMap = {
    verified: { bg: 'bg-status-verified', text: 'text-status-verifiedText', label: 'Verified' },
    pending: { bg: 'bg-status-pending', text: 'text-status-pendingText', label: 'Pending' },
    rejected: { bg: 'bg-status-rejected', text: 'text-status-rejectedText', label: 'Rejected' },
    expired: { bg: 'bg-status-expired', text: 'text-status-expiredText', label: 'Expired' },
  };

  const config = statusMap[status] || statusMap.pending;

  return (
    <span className={`badge ${config.bg} ${config.text}`}>
      {label || config.label}
    </span>
  );
}
