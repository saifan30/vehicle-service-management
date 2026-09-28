import { User, Vehicle, ServiceItem, Booking, AWSArchitectureInfo, BookingStatus } from '../types';

const TOKEN_KEY = 'cvsms_auth_token';

export const storage = {
  getToken: () => localStorage.getItem(TOKEN_KEY),
  setToken: (token: string) => localStorage.setItem(TOKEN_KEY, token),
  removeToken: () => localStorage.removeItem(TOKEN_KEY),
};

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = storage.getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(endpoint, {
    ...options,
    headers,
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.error || `HTTP error ${res.status}: ${res.statusText}`);
  }

  return data as T;
}

export const api = {
  // Authentication
  auth: {
    login: async (credentials: { email: string; password: string }) => {
      const res = await request<{ user: User; token: string; message: string }>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
      });
      storage.setToken(res.token);
      return res;
    },
    register: async (userData: { name: string; email: string; password: string; role: string; phone?: string }) => {
      const res = await request<{ user: User; token: string; message: string }>('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(userData),
      });
      storage.setToken(res.token);
      return res;
    },
    getMe: async () => {
      return request<{ user: User }>('/api/auth/me');
    },
    logout: () => {
      storage.removeToken();
    },
  },

  // Vehicles
  vehicles: {
    list: async () => {
      const res = await request<{ vehicles: Vehicle[] }>('/api/vehicles');
      return res.vehicles;
    },
    create: async (vehicleData: { make: string; model: string; year: number; license_plate: string; fuel_type: string; image_url?: string }) => {
      const res = await request<{ vehicle: Vehicle; message: string }>('/api/vehicles', {
        method: 'POST',
        body: JSON.stringify(vehicleData),
      });
      return res.vehicle;
    },
    delete: async (id: number) => {
      return request<{ message: string }>(`/api/vehicles/${id}`, {
        method: 'DELETE',
      });
    },
  },

  // Services
  services: {
    list: async (all: boolean = false) => {
      const res = await request<{ services: ServiceItem[] }>(`/api/services${all ? '?all=true' : ''}`);
      return res.services;
    },
    create: async (serviceData: { name: string; description: string; base_price: number; estimated_duration_mins: number }) => {
      const res = await request<{ service: ServiceItem; message: string }>('/api/services', {
        method: 'POST',
        body: JSON.stringify(serviceData),
      });
      return res.service;
    },
    toggleStatus: async (id: number, is_active: boolean) => {
      const res = await request<{ service: ServiceItem; message: string }>(`/api/services/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ is_active }),
      });
      return res.service;
    },
  },

  // Bookings
  bookings: {
    list: async () => {
      const res = await request<{ bookings: Booking[] }>('/api/bookings');
      return res.bookings;
    },
    create: async (bookingData: { vehicle_id: number; service_id: number; scheduled_date: string; time_slot: string; notes?: string }) => {
      const res = await request<{ booking: Booking; message: string }>('/api/bookings', {
        method: 'POST',
        body: JSON.stringify(bookingData),
      });
      return res.booking;
    },
    updateStatus: async (id: number, status: BookingStatus, provider_id?: number) => {
      const res = await request<{ booking: Booking; message: string }>(`/api/bookings/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status, provider_id }),
      });
      return res.booking;
    },
    cancel: async (id: number) => {
      const res = await request<{ booking: Booking; message: string }>(`/api/bookings/${id}/cancel`, {
        method: 'PATCH',
      });
      return res.booking;
    },
  },

  // Users (Admin)
  users: {
    list: async () => {
      const res = await request<{ users: User[] }>('/api/users');
      return res.users;
    },
  },

  // S3 File Upload
  upload: {
    uploadFile: async (fileName: string, fileData: string, contentType: string) => {
      return request<{
        url: string;
        key: string;
        bucket: string;
        storageType: string;
        message: string;
      }>('/api/upload', {
        method: 'POST',
        body: JSON.stringify({ fileName, fileData, contentType }),
      });
    },
    getStatus: async () => {
      return request<{ isConfigured: boolean; bucketName: string; region: string; service: string }>('/api/upload/status');
    },
  },

  // Cloud Architecture
  cloud: {
    getArchitecture: async () => {
      return request<AWSArchitectureInfo>('/api/cloud/architecture');
    },
  },
};
