import { format, isToday, isYesterday, formatDistanceToNow } from 'date-fns';

export function formatTimestamp(timestamp: Date): string {
  if (isToday(timestamp)) {
    return `Today at ${format(timestamp, 'h:mm a')}`;
  }
  
  if (isYesterday(timestamp)) {
    return `Yesterday at ${format(timestamp, 'h:mm a')}`;
  }
  
  return format(timestamp, 'MMM d, h:mm a');
}

export function formatTimeAgo(timestamp: Date): string {
  return formatDistanceToNow(timestamp, { addSuffix: true });
}

export function formatLocalDateTime(date: Date): string {
  // Format for datetime-local input
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}
