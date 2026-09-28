import { BookingStatus } from '../types';
import { Clock, CheckCircle2, Cog, Ban, CalendarCheck } from 'lucide-react';

interface Props {
  status: BookingStatus;
  size?: 'sm' | 'md';
}

export function StatusBadge({ status, size = 'md' }: Props) {
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-xs font-semibold';

  switch (status) {
    case 'Pending':
      return (
        <span className={`inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 ${sizeClasses}`}>
          <Clock className="w-3.5 h-3.5 animate-pulse" />
          Pending
        </span>
      );
    case 'Confirmed':
      return (
        <span className={`inline-flex items-center gap-1.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 ${sizeClasses}`}>
          <CalendarCheck className="w-3.5 h-3.5" />
          Confirmed
        </span>
      );
    case 'In Progress':
      return (
        <span className={`inline-flex items-center gap-1.5 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 ${sizeClasses}`}>
          <Cog className="w-3.5 h-3.5 animate-spin" />
          In Progress
        </span>
      );
    case 'Completed':
      return (
        <span className={`inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 ${sizeClasses}`}>
          <CheckCircle2 className="w-3.5 h-3.5" />
          Completed
        </span>
      );
    case 'Cancelled':
      return (
        <span className={`inline-flex items-center gap-1.5 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 ${sizeClasses}`}>
          <Ban className="w-3.5 h-3.5" />
          Cancelled
        </span>
      );
    default:
      return <span className={`rounded-full bg-gray-100 text-gray-700 ${sizeClasses}`}>{status}</span>;
  }
}
