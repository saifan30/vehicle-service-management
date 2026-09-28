import React, { useState, useEffect } from 'react';
import { User, Vehicle, ServiceItem, Booking } from '../types';
import { api } from '../services/api';
import { StatusBadge } from '../components/StatusBadge';
import { 
  Shield, 
  Users, 
  Car, 
  Wrench, 
  Calendar, 
  PlusCircle, 
  Check, 
  AlertCircle,
  ToggleLeft,
  ToggleRight,
  Database
} from 'lucide-react';

interface Props {
  user: User;
}

export function AdminDashboard({ user }: Props) {
  const [activeTab, setActiveTab] = useState<'bookings' | 'services' | 'vehicles' | 'users'>('bookings');
  
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // New Service modal state
  const [showAddService, setShowAddService] = useState(false);
  const [serviceName, setServiceName] = useState('');
  const [serviceDesc, setServiceDesc] = useState('');
  const [servicePrice, setServicePrice] = useState('');
  const [serviceDuration, setServiceDuration] = useState('60');

  const loadAllData = async () => {
    try {
      setLoading(true);
      const [bData, sData, vData, uData] = await Promise.all([
        api.bookings.list(),
        api.services.list(true), // all services including inactive
        api.vehicles.list(),
        api.users.list(),
      ]);
      setBookings(bData);
      setServices(sData);
      setVehicles(vData);
      setUsers(uData);
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message || 'Error fetching system data' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  const handleCreateService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!serviceName || !servicePrice || !serviceDuration) {
      setNotification({ type: 'error', message: 'Name, price, and duration are required.' });
      return;
    }

    try {
      await api.services.create({
        name: serviceName,
        description: serviceDesc,
        base_price: parseFloat(servicePrice),
        estimated_duration_mins: parseInt(serviceDuration, 10),
      });

      setNotification({ type: 'success', message: 'New service created in Amazon RDS PostgreSQL.' });
      setServiceName('');
      setServiceDesc('');
      setServicePrice('');
      setShowAddService(false);
      loadAllData();
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message || 'Failed to create service' });
    }
  };

  const handleToggleService = async (id: number, currentStatus: boolean) => {
    try {
      await api.services.toggleStatus(id, !currentStatus);
      setNotification({
        type: 'success',
        message: `Service status updated to: ${!currentStatus ? 'Active' : 'Disabled'}`,
      });
      loadAllData();
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message || 'Failed to update service' });
    }
  };

  return (
    <div className="space-y-6">
      {/* Notification banner */}
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

      {/* Admin Header */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 font-semibold text-xs uppercase tracking-wider">
            <Shield className="w-4 h-4" /> System Administrator Console
          </div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white mt-1">
            Cloud Service Administration
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Database-first PostgreSQL engine • Manage bookings, service packages, vehicle inventory, and user accounts.
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-4 gap-2 text-center text-xs">
          <div className="px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
            <div className="font-bold text-slate-900 dark:text-white">{bookings.length}</div>
            <div className="text-[10px] text-slate-500">Bookings</div>
          </div>
          <div className="px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
            <div className="font-bold text-slate-900 dark:text-white">{services.length}</div>
            <div className="text-[10px] text-slate-500">Services</div>
          </div>
          <div className="px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
            <div className="font-bold text-slate-900 dark:text-white">{vehicles.length}</div>
            <div className="text-[10px] text-slate-500">Vehicles</div>
          </div>
          <div className="px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
            <div className="font-bold text-slate-900 dark:text-white">{users.length}</div>
            <div className="text-[10px] text-slate-500">Users</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200 dark:border-slate-800 flex gap-4 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('bookings')}
          className={`py-3 border-b-2 flex items-center gap-1.5 transition-colors ${
            activeTab === 'bookings'
              ? 'border-rose-500 text-rose-600 dark:text-rose-400'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <Calendar className="w-4 h-4" /> Bookings ({bookings.length})
        </button>
        <button
          onClick={() => setActiveTab('services')}
          className={`py-3 border-b-2 flex items-center gap-1.5 transition-colors ${
            activeTab === 'services'
              ? 'border-rose-500 text-rose-600 dark:text-rose-400'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <Wrench className="w-4 h-4" /> Services Management ({services.length})
        </button>
        <button
          onClick={() => setActiveTab('vehicles')}
          className={`py-3 border-b-2 flex items-center gap-1.5 transition-colors ${
            activeTab === 'vehicles'
              ? 'border-rose-500 text-rose-600 dark:text-rose-400'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <Car className="w-4 h-4" /> Registered Vehicles ({vehicles.length})
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`py-3 border-b-2 flex items-center gap-1.5 transition-colors ${
            activeTab === 'users'
              ? 'border-rose-500 text-rose-600 dark:text-rose-400'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <Users className="w-4 h-4" /> User Directory ({users.length})
        </button>
      </div>

      {/* TAB 1: BOOKINGS */}
      {activeTab === 'bookings' && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
              All System Bookings (Amazon RDS PostgreSQL `bookings` table)
            </h3>
            <span className="text-[11px] text-slate-500">Ordered by booking ID desc</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-4">ID</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Vehicle</th>
                  <th className="py-3 px-4">Service</th>
                  <th className="py-3 px-4">Schedule</th>
                  <th className="py-3 px-4">Provider</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {bookings.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                    <td className="py-3 px-4 font-mono font-semibold">#{b.id}</td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900 dark:text-white">{b.customer_name}</div>
                      <div className="text-[11px] text-slate-500">{b.customer_email}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div>{b.vehicle_make} {b.vehicle_model}</div>
                      <div className="text-[10px] font-mono text-slate-500">{b.vehicle_plate}</div>
                    </td>
                    <td className="py-3 px-4 font-medium">{b.service_name}</td>
                    <td className="py-3 px-4">
                      <div>{b.scheduled_date}</div>
                      <div className="text-[11px] text-slate-500">{b.time_slot}</div>
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                      {b.provider_name || <span className="text-slate-400 italic">Unassigned</span>}
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={b.status} size="sm" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: SERVICES MANAGEMENT */}
      {activeTab === 'services' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5">
              <Database className="w-4 h-4 text-amber-500" />
              Service Packages (`services` table)
            </h3>
            <button
              onClick={() => setShowAddService(!showAddService)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 transition-colors"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              {showAddService ? 'Close Form' : 'Add New Service'}
            </button>
          </div>

          {/* Add Service Form */}
          {showAddService && (
            <form onSubmit={handleCreateService} className="p-5 bg-white dark:bg-slate-900 rounded-xl border border-amber-300 dark:border-amber-700/50 space-y-3 shadow-xs">
              <h4 className="text-xs font-bold text-slate-900 dark:text-white">Create Service Offering</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Service Title *</label>
                  <input
                    type="text"
                    placeholder="e.g. Transmission Fluid Flush & Filter Replacement"
                    value={serviceName}
                    onChange={(e) => setServiceName(e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Base Price ($) *</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="99.99"
                    value={servicePrice}
                    onChange={(e) => setServicePrice(e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Description</label>
                  <input
                    type="text"
                    placeholder="Brief description of work conducted..."
                    value={serviceDesc}
                    onChange={(e) => setServiceDesc(e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Est. Duration (Minutes) *</label>
                  <input
                    type="number"
                    placeholder="60"
                    value={serviceDuration}
                    onChange={(e) => setServiceDuration(e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddService(false)}
                  className="px-3 py-1.5 text-xs text-slate-500 hover:text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-bold rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950"
                >
                  Insert Service
                </button>
              </div>
            </form>
          )}

          {/* Services Table */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-4">ID</th>
                  <th className="py-3 px-4">Service Name</th>
                  <th className="py-3 px-4">Base Price</th>
                  <th className="py-3 px-4">Est. Duration</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Action (Enable/Disable)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {services.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                    <td className="py-3 px-4 font-mono font-semibold">#{s.id}</td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900 dark:text-white">{s.name}</div>
                      <div className="text-[11px] text-slate-500">{s.description}</div>
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">${s.base_price}</td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-400">{s.estimated_duration_mins} mins</td>
                    <td className="py-3 px-4">
                      {s.is_active ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                          Disabled
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleToggleService(s.id, s.is_active)}
                        className={`inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                          s.is_active
                            ? 'text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30'
                            : 'text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30'
                        }`}
                      >
                        {s.is_active ? (
                          <>
                            <ToggleRight className="w-4 h-4 text-emerald-500" /> Disable
                          </>
                        ) : (
                          <>
                            <ToggleLeft className="w-4 h-4 text-slate-400" /> Enable
                          </>
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: VEHICLES */}
      {activeTab === 'vehicles' && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
              All Registered Vehicles in System
            </h3>
            <span className="text-[11px] text-slate-500">Foreign key: `user_id` → `users.id`</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-4">ID</th>
                  <th className="py-3 px-4">Make & Model</th>
                  <th className="py-3 px-4">Year</th>
                  <th className="py-3 px-4">License Plate</th>
                  <th className="py-3 px-4">Fuel</th>
                  <th className="py-3 px-4">Owner Name</th>
                  <th className="py-3 px-4">Amazon S3 Asset</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {vehicles.map((v) => (
                  <tr key={v.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                    <td className="py-3 px-4 font-mono font-semibold">#{v.id}</td>
                    <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">
                      {v.make} {v.model}
                    </td>
                    <td className="py-3 px-4">{v.year}</td>
                    <td className="py-3 px-4 font-mono font-semibold">{v.license_plate}</td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-400">{v.fuel_type}</td>
                    <td className="py-3 px-4 text-slate-800 dark:text-slate-200 font-medium">
                      {v.owner_name} <span className="text-[10px] text-slate-400">({v.owner_email})</span>
                    </td>
                    <td className="py-3 px-4 font-mono text-[10px] text-slate-500">
                      {v.image_url ? (
                        <span className="text-emerald-600 font-medium">S3 File Attached</span>
                      ) : (
                        <span className="text-slate-400">None</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: USERS */}
      {activeTab === 'users' && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
              User Directory (`users` table)
            </h3>
            <span className="text-[11px] text-slate-500">Roles: customer, provider, admin</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-4">ID</th>
                  <th className="py-3 px-4">Name</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Phone</th>
                  <th className="py-3 px-4">Created At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                    <td className="py-3 px-4 font-mono font-semibold">#{u.id}</td>
                    <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">{u.name}</td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-400">{u.email}</td>
                    <td className="py-3 px-4">
                      {u.role === 'admin' ? (
                        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-rose-500/10 text-rose-600 border border-rose-500/20">
                          admin
                        </span>
                      ) : u.role === 'provider' ? (
                        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-indigo-500/10 text-indigo-600 border border-indigo-500/20">
                          provider
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                          customer
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-500">{u.phone || '—'}</td>
                    <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">
                      {u.created_at ? new Date(u.created_at).toLocaleDateString() : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
