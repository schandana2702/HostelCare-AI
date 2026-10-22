export function formatDate(date) {
  if (!date) return '-';
  const d = date?.toDate ? date.toDate() : new Date(date);
  if (isNaN(d.getTime())) return '-';
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

export function formatDateTime(date) {
  if (!date) return '-';
  const d = date?.toDate ? date.toDate() : new Date(date);
  if (isNaN(d.getTime())) return '-';
  return d.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
}

export function timeAgo(date) {
  if (!date) return '-';
  const d = date?.toDate ? date.toDate() : new Date(date);
  if (isNaN(d.getTime())) return '-';
  
  const now = new Date();
  const seconds = Math.floor((now - d) / 1000);
  
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

export function isOverdue(createdAt, slaHours = 24, status) {
  if (!createdAt) return false;
  if (status === 'CLOSED' || status === 'COMPLETED' || status === 'AWAITING_VERIFICATION') {
    return false;
  }
  const d = createdAt?.toDate ? createdAt.toDate() : new Date(createdAt);
  if (isNaN(d.getTime())) return false;
  const deadline = d.getTime() + (slaHours * 60 * 60 * 1000);
  return Date.now() > deadline;
}

export function getRemainingSLA(createdAt, slaHours = 24) {
  if (!createdAt) return null;
  const d = createdAt?.toDate ? createdAt.toDate() : new Date(createdAt);
  if (isNaN(d.getTime())) return null;
  const deadline = d.getTime() + (slaHours * 60 * 60 * 1000);
  const diffMs = deadline - Date.now();
  
  if (diffMs <= 0) {
    const overdueHours = Math.abs(Math.floor(diffMs / (1000 * 60 * 60)));
    return { overdue: true, text: `${overdueHours}h overdue`, hoursRemaining: 0 };
  }
  
  const hoursRemaining = Math.floor(diffMs / (1000 * 60 * 60));
  const minsRemaining = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  return {
    overdue: false,
    text: hoursRemaining > 0 ? `${hoursRemaining}h ${minsRemaining}m left` : `${minsRemaining}m left`,
    hoursRemaining
  };
}
