import React, { useState, useEffect } from 'react';
import { User, Vehicle, ServiceItem, Booking } from '../types';
import { api } from '../services/api';
import { StatusBadge } from '../components/StatusBadge';
import { 
  Car, 
  PlusCircle, 
  Calendar, 
  Clock, 
  Trash2, 
  Upload, 
  Check, 
  AlertCircle,
  HardDrive,
  FileCheck
} from 'lucide-react';

interface Props {
  user: User;
}

export function CustomerDashboard({ user }: Props) {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Add Vehicle Form state
  const [showAddVehicle, setShowAddVehicle] = useState(false);
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [licensePlate, setLicensePlate] = useState('');
  const [fuelType, setFuelType] = useState('Petrol');
  const [vehicleImage, setVehicleImage] = useState<string>('');
  const [uploadingS3, setUploadingS3] = useState(false);
  const [s3UploadedKey, setS3UploadedKey] = useState<string | null>(null);

  // Book Service Form state
  const [showBookModal, setShowBookModal] = useState(false);
  const [selectedVehicleId, setSelectedVehicleId] = useState<number | ''>('');
  const [selectedServiceId, setSelectedServiceId] = useState<number | ''>('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [timeSlot, setTimeSlot] = useState('10:00 AM - 11:30 AM');
  const [bookingNotes, setBookingNotes] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      const [vData, sData, bData] = await Promise.all([
        api.vehicles.list(),
        api.services.list(false),
        api.bookings.list(),
      ]);
      setVehicles(vData);
      setServices(sData);
      setBookings(bData);
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message || 'Error loading dashboard data' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingS3(true);
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = reader.result as string;
        try {
          const res = await api.upload.uploadFile(file.name, base64, file.type);
          setVehicleImage(res.url);
          setS3UploadedKey(res.key);
          setNotification({
            type: 'success',
            message: `File uploaded to ${res.storageType} (Key: ${res.key})`,
          });
        } catch (uploadErr: any) {
          setNotification({ type: 'error', message: 'S3 upload failed: ' + uploadErr.message });
        } finally {
          setUploadingS3(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      setUploadingS3(false);
      setNotification({ type: 'error', message: err.message });
    }
  };

  const handleAddVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!make || !model || !year || !licensePlate) {
      setNotification({ type: 'error', message: 'Please fill in all required vehicle fields.' });
      return;
    }

    try {
      await api.vehicles.create({
        make,
        model,
        year: parseInt(year, 10),
        license_plate: licensePlate,
        fuel_type: fuelType,
        image_url: vehicleImage || undefined,
      });

      setNotification({ type: 'success', message: 'Vehicle registered successfully in PostgreSQL database!' });
      setMake('');
      setModel('');
      setLicensePlate('');
      setVehicleImage('');
      setS3UploadedKey(null);
      setShowAddVehicle(false);
      loadData();
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message || 'Failed to register vehicle' });
    }
  };

  const handleDeleteVehicle = async (id: number) => {
    if (!confirm('Are you sure you want to delete this vehicle from PostgreSQL?')) return;
    try {
      await api.vehicles.delete(id);
      setNotification({ type: 'success', message: 'Vehicle deleted from database.' });
      loadData();
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message || 'Failed to delete vehicle' });
    }
  };

  const handleBookService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVehicleId || !selectedServiceId || !scheduledDate || !timeSlot) {
      setNotification({ type: 'error', message: 'Please complete all booking fields.' });
      return;
    }

    try {
      await api.bookings.create({
        vehicle_id: Number(selectedVehicleId),
        service_id: Number(selectedServiceId),
        scheduled_date: scheduledDate,
        time_slot: timeSlot,
        notes: bookingNotes,
      });

      setNotification({ type: 'success', message: 'Service booked successfully with initial status: Pending' });
      setShowBookModal(false);
      setSelectedVehicleId('');
      setSelectedServiceId('');
      setScheduledDate('');
      setBookingNotes('');
      loadData();
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message || 'Failed to book service' });
    }
  };

  const handleCancelBooking = async (id: number) => {
    if (!confirm('Are you sure you want to cancel this booking?')) return;
    try {
      await api.bookings.cancel(id);
      setNotification({ type: 'success', message: 'Booking status updated to Cancelled.' });
      loadData();
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message || 'Failed to cancel booking' });
    }
  };

  return (
    <div className="space-y-8">
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

      {/* Customer Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">
            Welcome back, {user.name}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Customer Dashboard • Manage your registered vehicles & scheduled service appointments.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowAddVehicle(!showAddVehicle)}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 transition-colors"
          >
            <PlusCircle className="w-4 h-4" />
            {showAddVehicle ? 'Close Vehicle Form' : 'Add Vehicle'}
          </button>
          <button
            onClick={() => {
              if (vehicles.length === 0) {
                setNotification({ type: 'error', message: 'Please add a vehicle first before booking a service.' });
                setShowAddVehicle(true);
                return;
              }
              setShowBookModal(true);
            }}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold shadow-xs transition-colors"
          >
            <Calendar className="w-4 h-4" />
            Book a Service
          </button>
        </div>
      </div>

      {/* ADD VEHICLE FORM (Collapsible) */}
      {showAddVehicle && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-amber-300 dark:border-amber-700/50 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Car className="w-4 h-4 text-amber-500" />
              Register New Vehicle (Stored in Amazon RDS PostgreSQL)
            </h2>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
              Table: `vehicles`
            </span>
          </div>

          <form onSubmit={handleAddVehicle} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Make *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Toyota, Honda, Ford"
                  value={make}
                  onChange={(e) => setMake(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Model *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Corolla, Civic, F-150"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Year *
                </label>
                <input
                  type="number"
                  min="1990"
                  max={new Date().getFullYear() + 1}
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  License Plate *
                </label>
                <input
                  type="text"
                  placeholder="e.g. MH-04-AB-1234"
                  value={licensePlate}
                  onChange={(e) => setLicensePlate(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-amber-500 uppercase"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Fuel Type
                </label>
                <select
                  value={fuelType}
                  onChange={(e) => setFuelType(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                >
                  <option value="Petrol">Petrol</option>
                  <option value="Diesel">Diesel</option>
                  <option value="Electric">Electric (EV)</option>
                  <option value="Hybrid">Hybrid</option>
                  <option value="CNG">CNG</option>
                </select>
              </div>

              {/* S3 Storage File Upload */}
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                  <HardDrive className="w-3.5 h-3.5 text-amber-500" />
                  Vehicle Image / RC (Amazon S3 Storage)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageFileChange}
                    className="text-xs text-slate-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-amber-50 file:text-amber-700 hover:file:bg-amber-100 dark:file:bg-slate-800 dark:file:text-slate-200"
                  />
                  {uploadingS3 && <span className="text-[11px] text-amber-600 animate-pulse">Uploading to S3...</span>}
                  {s3UploadedKey && (
                    <span className="text-[11px] text-emerald-600 flex items-center gap-1 font-mono">
                      <FileCheck className="w-3.5 h-3.5" /> S3 Key: {s3UploadedKey.substring(0, 15)}...
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAddVehicle(false)}
                className="px-3 py-1.5 text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950"
              >
                Save Vehicle to PostgreSQL
              </button>
            </div>
          </form>
        </div>
      )}

      {/* SECTION 1: REGISTERED VEHICLES */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Car className="w-4 h-4 text-amber-500" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
              My Registered Vehicles ({vehicles.length})
            </h2>
          </div>
          <span className="text-[11px] text-slate-500">PostgreSQL DBaaS • Amazon S3 Assets</span>
        </div>

        {loading ? (
          <div className="p-8 text-center text-xs text-slate-500">Loading vehicles...</div>
        ) : vehicles.length === 0 ? (
          <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-xl border border-dashed border-slate-300 dark:border-slate-800">
            <Car className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-xs text-slate-500">No vehicles registered yet.</p>
            <button
              onClick={() => setShowAddVehicle(true)}
              className="mt-3 px-3 py-1.5 text-xs font-semibold rounded-lg bg-amber-500 text-slate-950"
            >
              Add Your First Vehicle
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {vehicles.map((v) => (
              <div
                key={v.id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-all flex flex-col"
              >
                {/* Vehicle image or placeholder */}
                <div className="h-32 bg-slate-100 dark:bg-slate-800 relative flex items-center justify-center overflow-hidden">
                  {v.image_url ? (
                    <img src={v.image_url} alt={`${v.make} ${v.model}`} className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-slate-400 flex flex-col items-center">
                      <Car className="w-8 h-8 mb-1" />
                      <span className="text-[10px]">No S3 Image</span>
                    </div>
                  )}
                  <span className="absolute top-2 right-2 text-[10px] font-mono px-2 py-0.5 rounded bg-black/60 text-white backdrop-blur-xs font-semibold">
                    {v.license_plate}
                  </span>
                </div>

                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      {v.year} {v.make} {v.model}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[11px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-medium">
                        {v.fuel_type}
                      </span>
                      <span className="text-[10px] text-slate-400">ID #{v.id}</span>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <button
                      onClick={() => {
                        setSelectedVehicleId(v.id);
                        setShowBookModal(true);
                      }}
                      className="text-xs text-amber-600 dark:text-amber-400 hover:underline font-semibold flex items-center gap-1"
                    >
                      <Calendar className="w-3.5 h-3.5" /> Book Service
                    </button>
                    <button
                      onClick={() => handleDeleteVehicle(v.id)}
                      className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
                      title="Delete Vehicle"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SECTION 2: SERVICE BOOKING STATUS */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-amber-500" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
              My Service Bookings & Status Tracking ({bookings.length})
            </h2>
          </div>
          <span className="text-[11px] text-slate-500">
            Lifecycle: Pending → Confirmed → In Progress → Completed
          </span>
        </div>

        {bookings.length === 0 ? (
          <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-xl border border-dashed border-slate-300 dark:border-slate-800">
            <Calendar className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-xs text-slate-500">No service bookings scheduled yet.</p>
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800 font-semibold">
                  <tr>
                    <th className="py-3 px-4">Booking ID</th>
                    <th className="py-3 px-4">Vehicle</th>
                    <th className="py-3 px-4">Service Package</th>
                    <th className="py-3 px-4">Schedule Date & Slot</th>
                    <th className="py-3 px-4">Assigned Provider</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {bookings.map((b) => (
                    <tr key={b.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                      <td className="py-3 px-4 font-mono font-semibold text-slate-900 dark:text-white">
                        #{b.id}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900 dark:text-white">
                          {b.vehicle_make} {b.vehicle_model}
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono">{b.vehicle_plate}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-900 dark:text-white">{b.service_name}</div>
                        <div className="text-[11px] text-slate-500">${b.service_price}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-900 dark:text-white flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          {b.scheduled_date}
                        </div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                          <Clock className="w-3 h-3 text-slate-400" />
                          {b.time_slot}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-400 font-medium">
                        {b.provider_name || <span className="text-slate-400 italic">Assigning provider...</span>}
                      </td>
                      <td className="py-3 px-4">
                        <StatusBadge status={b.status} />
                      </td>
                      <td className="py-3 px-4 text-right">
                        {(b.status === 'Pending' || b.status === 'Confirmed') && (
                          <button
                            onClick={() => handleCancelBooking(b.id)}
                            className="px-2.5 py-1 text-[11px] font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded transition-colors"
                          >
                            Cancel Booking
                          </button>
                        )}
                        {b.status === 'In Progress' && (
                          <span className="text-[11px] text-purple-600 font-medium">In Workshop</span>
                        )}
                        {b.status === 'Completed' && (
                          <span className="text-[11px] text-emerald-600 font-medium">Service Done</span>
                        )}
                        {b.status === 'Cancelled' && (
                          <span className="text-[11px] text-slate-400">Cancelled</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* BOOK SERVICE MODAL */}
      {showBookModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl w-full max-w-lg p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-amber-500" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Book a Vehicle Service</h3>
              </div>
              <button onClick={() => setShowBookModal(false)} className="text-slate-400 hover:text-slate-600">
                ×
              </button>
            </div>

            <form onSubmit={handleBookService} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Select Registered Vehicle *
                </label>
                <select
                  value={selectedVehicleId}
                  onChange={(e) => setSelectedVehicleId(e.target.value ? Number(e.target.value) : '')}
                  className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500"
                  required
                >
                  <option value="">-- Choose a Vehicle --</option>
                  {vehicles.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.year} {v.make} {v.model} ({v.license_plate})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Select Service Package *
                </label>
                <select
                  value={selectedServiceId}
                  onChange={(e) => setSelectedServiceId(e.target.value ? Number(e.target.value) : '')}
                  className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500"
                  required
                >
                  <option value="">-- Choose a Service --</option>
                  {services.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} — ${s.base_price} ({s.estimated_duration_mins} mins)
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Scheduled Date *
                  </label>
                  <input
                    type="date"
                    min={new Date().toISOString().split('T')[0]}
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Time Slot *
                  </label>
                  <select
                    value={timeSlot}
                    onChange={(e) => setTimeSlot(e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="09:00 AM - 10:30 AM">09:00 AM - 10:30 AM</option>
                    <option value="10:00 AM - 11:30 AM">10:00 AM - 11:30 AM</option>
                    <option value="11:30 AM - 01:00 PM">11:30 AM - 01:00 PM</option>
                    <option value="02:00 PM - 03:30 PM">02:00 PM - 03:30 PM</option>
                    <option value="04:00 PM - 05:30 PM">04:00 PM - 05:30 PM</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Special Notes or Issues (Optional)
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g. Squeaking noise in front brake, check tire air pressure..."
                  value={bookingNotes}
                  onChange={(e) => setBookingNotes(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowBookModal(false)}
                  className="px-3 py-2 text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950"
                >
                  Confirm Booking (Pending)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
