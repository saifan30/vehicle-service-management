import { useState, useEffect } from 'react';
import { User, Booking, BookingStatus } from '../types';
import { api } from '../services/api';
import { StatusBadge } from '../components/StatusBadge';
import { 
  Wrench, 
  Calendar, 
  Clock, 
  User as UserIcon, 
  Phone, 
  Mail, 
  Car, 
  Check, 
  AlertCircle,
  Play,
  CheckCircle,
  ArrowRight
} from 'lucide-react';

interface Props {
  user: User;
}

export function ProviderDashboard({ user }: Props) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [filter, setFilter] = useState<string>('All');

  const loadBookings = async () => {
    try {
      setLoading(true);
      const data = await api.bookings.list();
      setBookings(data);
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message || 'Error loading bookings' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBookings();
  }, []);

  const handleUpdateStatus = async (bookingId: number, nextStatus: BookingStatus) => {
    try {
      await api.bookings.updateStatus(bookingId, nextStatus, user.id);
      setNotification({
        type: 'success',
        message: `Booking #${bookingId} updated to '${nextStatus}'. Synchronized with PostgreSQL.`,
      });
      loadBookings();
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message || 'Failed to update status' });
    }
  };

  const filteredBookings = filter === 'All' 
    ? bookings 
    : bookings.filter(b => b.status === filter);

  return (
    <div className="space-y-6">
      {/* Notification */}
      {notification && (
        <div
          className={`p-4 rounded-xl flex items-center justify-between text-xs font-medium border ${
            notification.type === 'success'
              ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20'
              : 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20'
          }`}
        >
          <div className="flex items-center gap-2">
            {notification.type === 'success' ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            <span>{notification.message}</span>
          </div>
          <button onClick={() => setNotification(null)} className="text-slate-400 hover:text-slate-600">
            ×
          </button>
        </div>
      )}

      {/* Header */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-semibold text-xs uppercase tracking-wider">
            <Wrench className="w-4 h-4" /> Service Provider Portal
          </div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white mt-1">
            Workshop Queue & Work Orders
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Logged in as {user.name} • Process customer appointments through lifecycle: Pending → Confirmed → In Progress → Completed.
          </p>
        </div>

        {/* Filter Badges */}
        <div className="flex flex-wrap gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs">
          {['All', 'Pending', 'Confirmed', 'In Progress', 'Completed'].map((st) => (
            <button
              key={st}
              onClick={() => setFilter(st)}
              className={`px-3 py-1.5 rounded-lg transition-colors font-medium ${
                filter === st
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Bookings Queue */}
      {loading ? (
        <div className="p-12 text-center text-xs text-slate-500">Loading service queue...</div>
      ) : filteredBookings.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-xl border border-dashed border-slate-300 dark:border-slate-800">
          <Wrench className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="text-xs text-slate-500">No bookings found for filter: {filter}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredBookings.map((b) => (
            <div
              key={b.id}
              className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs flex flex-col justify-between"
            >
              <div className="space-y-3">
                {/* Header row */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-slate-900 dark:text-white px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800">
                      Order #{b.id}
                    </span>
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      {b.service_name}
                    </span>
                  </div>
                  <StatusBadge status={b.status} />
                </div>

                {/* Vehicle & Customer Details */}
                <div className="p-3 bg-slate-50 dark:bg-slate-950/60 rounded-lg border border-slate-100 dark:border-slate-800/80 space-y-2 text-xs">
                  <div className="flex items-center justify-between text-slate-800 dark:text-slate-200 font-semibold">
                    <span className="flex items-center gap-1.5">
                      <Car className="w-3.5 h-3.5 text-amber-500" />
                      {b.vehicle_make} {b.vehicle_model}
                    </span>
                    <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                      {b.vehicle_plate}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200/60 dark:border-slate-800/60 text-[11px] text-slate-500 dark:text-slate-400">
                    <div className="flex items-center gap-1 truncate">
                      <UserIcon className="w-3 h-3 text-slate-400" />
                      {b.customer_name}
                    </div>
                    <div className="flex items-center gap-1 truncate">
                      <Phone className="w-3 h-3 text-slate-400" />
                      {b.customer_phone || 'No phone'}
                    </div>
                    <div className="flex items-center gap-1 truncate col-span-2">
                      <Mail className="w-3 h-3 text-slate-400" />
                      {b.customer_email}
                    </div>
                  </div>
                </div>

                {/* Schedule & Notes */}
                <div className="text-xs space-y-1">
                  <div className="flex items-center gap-4 text-slate-600 dark:text-slate-400">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" /> {b.scheduled_date}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" /> {b.time_slot}
                    </span>
                  </div>
                  {b.notes && (
                    <div className="text-[11px] bg-amber-50/50 dark:bg-amber-950/20 text-amber-800 dark:text-amber-300 p-2 rounded border border-amber-200 dark:border-amber-900">
                      <strong>Customer Note:</strong> {b.notes}
                    </div>
                  )}
                </div>
              </div>

              {/* Status Action Controls */}
              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div className="text-[11px] text-slate-500">
                  Assigned: {b.provider_name || 'Open Order'}
                </div>

                <div className="flex items-center gap-2">
                  {b.status === 'Pending' && (
                    <button
                      onClick={() => handleUpdateStatus(b.id, 'Confirmed')}
                      className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1 transition-colors"
                    >
                      <Check className="w-3.5 h-3.5" /> Accept & Confirm
                    </button>
                  )}

                  {b.status === 'Confirmed' && (
                    <button
                      onClick={() => handleUpdateStatus(b.id, 'In Progress')}
                      className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-purple-600 hover:bg-purple-700 text-white flex items-center gap-1 transition-colors"
                    >
                      <Play className="w-3.5 h-3.5" /> Start Work
                    </button>
                  )}

                  {b.status === 'In Progress' && (
                    <button
                      onClick={() => handleUpdateStatus(b.id, 'Completed')}
                      className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1 transition-colors"
                    >
                      <CheckCircle className="w-3.5 h-3.5" /> Mark Completed
                    </button>
                  )}

                  {b.status === 'Completed' && (
                    <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                      <CheckCircle className="w-3.5 h-3.5" /> Finished
                    </span>
                  )}

                  {b.status === 'Cancelled' && (
                    <span className="text-xs text-rose-500 font-medium">Order Cancelled</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
