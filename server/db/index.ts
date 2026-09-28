import pg from 'pg';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';

const { Pool } = pg;

export interface DBUser {
  id: number;
  name: string;
  email: string;
  password_hash: string;
  role: 'customer' | 'provider' | 'admin';
  phone: string | null;
  created_at: string;
}

export interface DBVehicle {
  id: number;
  user_id: number;
  make: string;
  model: string;
  year: number;
  license_plate: string;
  fuel_type: string;
  image_url: string | null;
  created_at: string;
}

export interface DBService {
  id: number;
  name: string;
  description: string;
  base_price: number;
  estimated_duration_mins: number;
  is_active: boolean;
  created_at: string;
}

export interface DBBooking {
  id: number;
  customer_id: number;
  vehicle_id: number;
  service_id: number;
  provider_id: number | null;
  scheduled_date: string;
  time_slot: string;
  status: 'Pending' | 'Confirmed' | 'In Progress' | 'Completed' | 'Cancelled';
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// Development-only fallback relational store used ONLY when DATABASE_URL is not provided in dev/test
interface DevFallbackStore {
  users: DBUser[];
  vehicles: DBVehicle[];
  services: DBService[];
  bookings: DBBooking[];
  counters: {
    users: number;
    vehicles: number;
    services: number;
    bookings: number;
  };
}

const devFallbackStore: DevFallbackStore = {
  users: [],
  vehicles: [],
  services: [],
  bookings: [],
  counters: { users: 0, vehicles: 0, services: 0, bookings: 0 },
};

let pool: pg.Pool | null = null;
let isRdsConnected = false;
let dbDriverType: 'Amazon RDS PostgreSQL (pg.Pool)' | 'Local PostgreSQL Emulation (Dev Mode)' = 'Local PostgreSQL Emulation (Dev Mode)';

export function getDbStatus() {
  return {
    driver: dbDriverType,
    isRdsConnected,
    databaseUrlConfigured: Boolean(process.env.DATABASE_URL),
    engine: 'Amazon RDS PostgreSQL (DBaaS)',
  };
}

// Initialize seed data ONLY for local dev when DATABASE_URL is absent
function initDevSeedData() {
  if (devFallbackStore.services.length === 0) {
    const salt = bcrypt.genSaltSync(10);
    const demoPasswordHash = bcrypt.hashSync('college123', salt);

    devFallbackStore.counters.users = 3;
    devFallbackStore.users = [
      {
        id: 1,
        name: 'College Admin',
        email: 'admin@awscloudservice.com',
        password_hash: demoPasswordHash,
        role: 'admin',
        phone: '+1-555-0100',
        created_at: new Date().toISOString(),
      },
      {
        id: 2,
        name: 'Apex Service Workshop',
        email: 'provider@awscloudservice.com',
        password_hash: demoPasswordHash,
        role: 'provider',
        phone: '+1-555-0200',
        created_at: new Date().toISOString(),
      },
      {
        id: 3,
        name: 'Alex Johnson',
        email: 'customer@awscloudservice.com',
        password_hash: demoPasswordHash,
        role: 'customer',
        phone: '+1-555-0300',
        created_at: new Date().toISOString(),
      },
    ];

    devFallbackStore.counters.vehicles = 2;
    devFallbackStore.vehicles = [
      {
        id: 1,
        user_id: 3,
        make: 'Toyota',
        model: 'Corolla',
        year: 2022,
        license_plate: 'MH-04-AB-1234',
        fuel_type: 'Petrol',
        image_url: 'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=600&auto=format&fit=crop&q=80',
        created_at: new Date().toISOString(),
      },
      {
        id: 2,
        user_id: 3,
        make: 'Honda',
        model: 'Civic',
        year: 2021,
        license_plate: 'MH-04-XY-9876',
        fuel_type: 'Hybrid',
        image_url: 'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=600&auto=format&fit=crop&q=80',
        created_at: new Date().toISOString(),
      },
    ];

    devFallbackStore.counters.services = 4;
    devFallbackStore.services = [
      {
        id: 1,
        name: 'Full Engine Synthetic Oil & Filter Service',
        description: 'Complete engine flush, synthetic oil replacement, filter swap, and fluid top-up.',
        base_price: 89.99,
        estimated_duration_mins: 60,
        is_active: true,
        created_at: new Date().toISOString(),
      },
      {
        id: 2,
        name: 'Brake Rotor & Pad Inspection and Replacement',
        description: 'Comprehensive disc thickness measurement, caliper check, and premium pad replacement.',
        base_price: 149.50,
        estimated_duration_mins: 90,
        is_active: true,
        created_at: new Date().toISOString(),
      },
      {
        id: 3,
        name: '100-Point Cloud Diagnostics & Multi-Point Inspection',
        description: 'Computerized OBD-II diagnostics scan, suspension integrity check, and safety audit.',
        base_price: 65.00,
        estimated_duration_mins: 45,
        is_active: true,
        created_at: new Date().toISOString(),
      },
      {
        id: 4,
        name: 'Air Conditioning & Cabin Filter Overhaul',
        description: 'Refrigerant pressure test, vacuum leak diagnosis, and anti-bacterial cabin sanitization.',
        base_price: 110.00,
        estimated_duration_mins: 75,
        is_active: true,
        created_at: new Date().toISOString(),
      },
    ];

    devFallbackStore.counters.bookings = 1;
    devFallbackStore.bookings = [
      {
        id: 1,
        customer_id: 3,
        vehicle_id: 1,
        service_id: 1,
        provider_id: 2,
        scheduled_date: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
        time_slot: '10:00 AM - 11:30 AM',
        status: 'Confirmed',
        notes: 'Routine scheduled mileage service. Please check tire tread depth as well.',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];
  }
}

initDevSeedData();

/**
 * Initialize Database connection.
 * Connects to Amazon RDS PostgreSQL using DATABASE_URL via pg.Pool.
 * In production: Throws fatal error if DATABASE_URL is missing or connection fails (no failover in production).
 * Automatically applies schema.sql DDL to RDS PostgreSQL.
 */
export async function initDatabase() {
  const isProduction = process.env.NODE_ENV === 'production';
  const dbUrl = process.env.DATABASE_URL;

  if (isProduction && (!dbUrl || dbUrl.trim() === '')) {
    throw new Error('[Amazon RDS PostgreSQL] Production startup halted: DATABASE_URL environment variable is required.');
  }

  if (dbUrl && dbUrl.trim() !== '') {
    try {
      console.log('[DB] Connecting to Amazon RDS PostgreSQL via pg.Pool...');
      const isRds = dbUrl.includes('rds.amazonaws.com') || !dbUrl.includes('localhost');

      pool = new Pool({
        connectionString: dbUrl,
        ssl: isRds ? { rejectUnauthorized: false } : undefined,
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 10000,
      });

      // Test connection
      const client = await pool.connect();
      console.log('[DB] Successfully established connection with Amazon RDS PostgreSQL!');
      isRdsConnected = true;
      dbDriverType = 'Amazon RDS PostgreSQL (pg.Pool)';

      // Run schema migrations from schema.sql
      const schemaPath = path.resolve(process.cwd(), 'server', 'db', 'schema.sql');
      if (fs.existsSync(schemaPath)) {
        const schemaSql = fs.readFileSync(schemaPath, 'utf8');
        await client.query(schemaSql);
        console.log('[DB] Amazon RDS PostgreSQL schema migrations applied successfully.');
      }
      client.release();
    } catch (err: any) {
      if (isProduction) {
        console.error('[Amazon RDS PostgreSQL Fatal Error]', err.message);
        throw new Error(`Failed to connect to Amazon RDS PostgreSQL in production: ${err.message}`);
      }
      console.warn(`[DB Dev Notice] Could not connect to external PostgreSQL (${err.message}). Using local development environment.`);
      isRdsConnected = false;
      dbDriverType = 'Local PostgreSQL Emulation (Dev Mode)';
    }
  } else {
    if (isProduction) {
      throw new Error('[Amazon RDS PostgreSQL] Production requires DATABASE_URL.');
    }
    console.log('[DB Dev Notice] No DATABASE_URL specified in dev. Running in Local Dev mode.');
    dbDriverType = 'Local PostgreSQL Emulation (Dev Mode)';
  }
}

/**
 * Central database query interface.
 * When Amazon RDS PostgreSQL is connected, executes real SQL via pg.Pool.
 * In production: Strictly executes against pg.Pool.
 */
export async function query<T = any>(sqlText: string, params: any[] = []): Promise<{ rows: T[]; rowCount: number }> {
  if (isRdsConnected && pool) {
    try {
      const res = await pool.query(sqlText, params);
      return { rows: res.rows as T[], rowCount: res.rowCount || 0 };
    } catch (err: any) {
      console.error('[Amazon RDS Query Error]', err.message);
      throw err;
    }
  }

  if (process.env.NODE_ENV === 'production') {
    throw new Error('[Amazon RDS PostgreSQL Error] Database connection is not established in production.');
  }

  // --- Development-Only Emulation Query Engine (Used only when DATABASE_URL is not configured locally) ---
  const trimmed = sqlText.trim();
  const lower = trimmed.toLowerCase();

  // 1. SELECT queries
  if (lower.startsWith('select')) {
    // USERS by ID
    if (lower.includes('from users where id = $1')) {
      const u = devFallbackStore.users.find(x => x.id === Number(params[0]));
      return { rows: (u ? [u] : []) as T[], rowCount: u ? 1 : 0 };
    }

    // USERS by email
    if (lower.includes('from users where email = $1')) {
      const u = devFallbackStore.users.find(x => x.email.toLowerCase() === String(params[0]).toLowerCase());
      return { rows: (u ? [u] : []) as T[], rowCount: u ? 1 : 0 };
    }

    // ALL USERS (Admin)
    if (lower.includes('from users order by id desc') || lower.includes('from users')) {
      const safeUsers = devFallbackStore.users.map(({ password_hash, ...rest }) => rest);
      return { rows: safeUsers as unknown as T[], rowCount: safeUsers.length };
    }

    // VEHICLES for user
    if (lower.includes('from vehicles where user_id = $1')) {
      const rows = devFallbackStore.vehicles.filter(v => v.user_id === Number(params[0])).reverse();
      return { rows: rows as T[], rowCount: rows.length };
    }

    // ALL VEHICLES (Admin)
    if (lower.includes('from vehicles v') || lower.includes('from vehicles order by')) {
      const rows = devFallbackStore.vehicles.map(v => {
        const owner = devFallbackStore.users.find(u => u.id === v.user_id);
        return {
          ...v,
          owner_name: owner ? owner.name : 'Unknown',
          owner_email: owner ? owner.email : 'Unknown',
        };
      }).reverse();
      return { rows: rows as T[], rowCount: rows.length };
    }

    // VEHICLE by id
    if (lower.includes('from vehicles where id = $1')) {
      const v = devFallbackStore.vehicles.find(x => x.id === Number(params[0]));
      return { rows: (v ? [v] : []) as T[], rowCount: v ? 1 : 0 };
    }

    // SERVICES (Active or All)
    if (lower.includes('from services where is_active = true') || lower.includes('from services')) {
      const rows = lower.includes('is_active = true')
        ? devFallbackStore.services.filter(s => s.is_active)
        : devFallbackStore.services;
      return { rows: rows as T[], rowCount: rows.length };
    }

    // BOOKINGS with joins
    if (lower.includes('from bookings b')) {
      let filtered = [...devFallbackStore.bookings];
      if (lower.includes('where b.customer_id = $1')) {
        filtered = filtered.filter(b => b.customer_id === Number(params[0]));
      } else if (lower.includes('where b.provider_id = $1') || lower.includes('where (b.provider_id = $1 or b.provider_id is null)')) {
        filtered = filtered.filter(b => b.provider_id === Number(params[0]) || b.provider_id === null);
      }

      const rows = filtered.map(b => {
        const customer = devFallbackStore.users.find(u => u.id === b.customer_id);
        const provider = devFallbackStore.users.find(u => u.id === b.provider_id);
        const vehicle = devFallbackStore.vehicles.find(v => v.id === b.vehicle_id);
        const service = devFallbackStore.services.find(s => s.id === b.service_id);
        return {
          ...b,
          customer_name: customer ? customer.name : 'Customer',
          customer_email: customer ? customer.email : '',
          customer_phone: customer ? customer.phone : '',
          provider_name: provider ? provider.name : 'Unassigned',
          vehicle_make: vehicle ? vehicle.make : '',
          vehicle_model: vehicle ? vehicle.model : '',
          vehicle_plate: vehicle ? vehicle.license_plate : '',
          service_name: service ? service.name : '',
          service_price: service ? service.base_price : 0,
        };
      }).sort((a, b) => b.id - a.id);

      return { rows: rows as T[], rowCount: rows.length };
    }
  }

  // 2. INSERT queries
  if (lower.startsWith('insert into users')) {
    devFallbackStore.counters.users += 1;
    const newUser: DBUser = {
      id: devFallbackStore.counters.users,
      name: params[0],
      email: params[1],
      password_hash: params[2],
      role: params[3],
      phone: params[4] || null,
      created_at: new Date().toISOString(),
    };
    devFallbackStore.users.push(newUser);
    return { rows: [newUser] as T[], rowCount: 1 };
  }

  if (lower.startsWith('insert into vehicles')) {
    devFallbackStore.counters.vehicles += 1;
    const newVehicle: DBVehicle = {
      id: devFallbackStore.counters.vehicles,
      user_id: Number(params[0]),
      make: params[1],
      model: params[2],
      year: Number(params[3]),
      license_plate: params[4],
      fuel_type: params[5] || 'Petrol',
      image_url: params[6] || null,
      created_at: new Date().toISOString(),
    };
    devFallbackStore.vehicles.push(newVehicle);
    return { rows: [newVehicle] as T[], rowCount: 1 };
  }

  if (lower.startsWith('insert into services')) {
    devFallbackStore.counters.services += 1;
    const newService: DBService = {
      id: devFallbackStore.counters.services,
      name: params[0],
      description: params[1],
      base_price: Number(params[2]),
      estimated_duration_mins: Number(params[3]),
      is_active: true,
      created_at: new Date().toISOString(),
    };
    devFallbackStore.services.push(newService);
    return { rows: [newService] as T[], rowCount: 1 };
  }

  if (lower.startsWith('insert into bookings')) {
    devFallbackStore.counters.bookings += 1;
    const newBooking: DBBooking = {
      id: devFallbackStore.counters.bookings,
      customer_id: Number(params[0]),
      vehicle_id: Number(params[1]),
      service_id: Number(params[2]),
      provider_id: null,
      scheduled_date: params[3],
      time_slot: params[4],
      status: 'Pending',
      notes: params[5] || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    devFallbackStore.bookings.push(newBooking);
    return { rows: [newBooking] as T[], rowCount: 1 };
  }

  // 3. UPDATE queries
  if (lower.startsWith('update bookings set status')) {
    const bookingId = Number(params[params.length - 1]);
    const booking = devFallbackStore.bookings.find(b => b.id === bookingId);
    if (booking) {
      booking.status = params[0];
      if (params.length > 2 && params[1] !== undefined) {
        booking.provider_id = Number(params[1]);
      }
      booking.updated_at = new Date().toISOString();
      return { rows: [booking] as T[], rowCount: 1 };
    }
    return { rows: [], rowCount: 0 };
  }

  if (lower.startsWith('update services set is_active')) {
    const serviceId = Number(params[1]);
    const service = devFallbackStore.services.find(s => s.id === serviceId);
    if (service) {
      service.is_active = Boolean(params[0]);
      return { rows: [service] as T[], rowCount: 1 };
    }
    return { rows: [], rowCount: 0 };
  }

  // 4. DELETE queries
  if (lower.startsWith('delete from vehicles where id = $1')) {
    const vId = Number(params[0]);
    const idx = devFallbackStore.vehicles.findIndex(v => v.id === vId);
    if (idx !== -1) {
      devFallbackStore.vehicles.splice(idx, 1);
      return { rows: [], rowCount: 1 };
    }
    return { rows: [], rowCount: 0 };
  }

  return { rows: [] as T[], rowCount: 0 };
}
