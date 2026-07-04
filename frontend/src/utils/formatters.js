import { formatDate as formatDt } from './date';

export const formatDate = formatDt;

export const formatStatus = (status) => {
  const statusMap = {
    verified: 'Verified',
    pending: 'Pending',
    rejected: 'Rejected',
    expired: 'Expired',
  };
  return statusMap[status?.toLowerCase()] || status || 'Pending';
};

export const formatTier = (tier) => {
  const tierMap = {
    beginner: 'Beginner',
    developing: 'Developing',
    placement_ready: 'Placement Ready',
    industry_ready: 'Industry Ready',
  };
  return tierMap[tier?.toLowerCase()] || tier || 'Beginner';
};

export const formatScore = (score) => {
  return typeof score === 'number' ? `${score}/100` : score;
};

export const getBadgeColor = (type, value) => {
  if (type === 'status') {
    const statusColors = {
      verified: 'bg-status-verified text-status-verifiedText',
      pending: 'bg-status-pending text-status-pendingText',
      rejected: 'bg-status-rejected text-status-rejectedText',
      expired: 'bg-status-expired text-status-expiredText',
    };
    return statusColors[value?.toLowerCase()] || statusColors.pending;
  }
  
  if (type === 'tier') {
    const tierColors = {
      beginner: 'bg-gray-100 text-gray-700',
      developing: 'bg-blue-100 text-blue-700',
      placement_ready: 'bg-green-100 text-green-700',
      industry_ready: 'bg-indigo-100 text-indigo-700',
    };
    return tierColors[value?.toLowerCase()] || tierColors.beginner;
  }

  if (type === 'score') {
    const num = Number(value);
    if (num >= 80) return 'bg-green-100 text-green-700';
    if (num >= 50) return 'bg-yellow-100 text-yellow-700';
    return 'bg-red-100 text-red-700';
  }

  if (type === 'complexity') {
    const compColors = {
      basic: 'bg-green-100 text-green-700',
      intermediate: 'bg-blue-100 text-blue-700',
      advanced: 'bg-purple-100 text-purple-700',
    };
    return compColors[value?.toLowerCase()] || compColors.basic;
  }

  return 'bg-gray-100 text-gray-700';
};
