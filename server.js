// server.ts
import express from "express";
import dotenv from "dotenv";
import path2 from "path";
import fs2 from "fs";
import { fileURLToPath } from "url";

// server/config/env.ts
function validateEnvironment() {
  const nodeEnv = process.env.NODE_ENV || "development";
  const isProduction = nodeEnv === "production";
  const missingVariables = [];
  const port = parseInt(process.env.PORT || "3000", 10);
  if (isNaN(port) || port <= 0) {
    throw new Error(`[Configuration Error] Invalid PORT specified: "${process.env.PORT}". Must be a valid positive port number.`);
  }
  if (isProduction) {
    if (!process.env.DATABASE_URL || process.env.DATABASE_URL.trim() === "") {
      missingVariables.push("DATABASE_URL (Amazon RDS PostgreSQL Connection String)");
    }
    if (!process.env.JWT_SECRET || process.env.JWT_SECRET.trim() === "") {
      missingVariables.push("JWT_SECRET (Secret key for signing JSON Web Tokens)");
    }
    if (missingVariables.length > 0) {
      console.error("\n================================================================");
      console.error(" [CRITICAL ERROR] Missing Required Production Environment Variables:");
      missingVariables.forEach((v) => console.error(`  - ${v}`));
      console.error(" Please configure these in your AWS Elastic Beanstalk Environment Properties");
      console.error(" or your production .env file before starting the server.");
      console.error("================================================================\n");
      throw new Error(`Server startup aborted: Missing required production environment variables: [${missingVariables.join(", ")}]`);
    }
  } else {
    if (!process.env.DATABASE_URL) {
      console.warn("[Config Warning] DATABASE_URL is not set. Amazon RDS PostgreSQL will use local connection or testing schema.");
    }
    if (!process.env.JWT_SECRET) {
      console.warn("[Config Warning] JWT_SECRET is not set in development. Using secure internal development secret.");
    }
  }
  const jwtSecret = process.env.JWT_SECRET || "college-vehicle-service-aws-dev-secret-2026";
  const awsRegion = process.env.AWS_REGION || "us-east-1";
  return {
    PORT: port,
    NODE_ENV: nodeEnv,
    DATABASE_URL: process.env.DATABASE_URL,
    JWT_SECRET: jwtSecret,
    AWS_REGION: awsRegion,
    S3_BUCKET_NAME: process.env.S3_BUCKET_NAME,
    AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
    AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY
  };
}

// server/db/index.ts
import pg from "pg";
import bcrypt from "bcryptjs";
import fs from "fs";
import path from "path";
var { Pool } = pg;
var devFallbackStore = {
  users: [],
  vehicles: [],
  services: [],
  bookings: [],
  counters: { users: 0, vehicles: 0, services: 0, bookings: 0 }
};
var pool = null;
var isRdsConnected = false;
var dbDriverType = "Local PostgreSQL Emulation (Dev Mode)";
function getDbStatus() {
  return {
    driver: dbDriverType,
    isRdsConnected,
    databaseUrlConfigured: Boolean(process.env.DATABASE_URL),
    engine: "Amazon RDS PostgreSQL (DBaaS)"
  };
}
function initDevSeedData() {
  if (devFallbackStore.services.length === 0) {
    const salt = bcrypt.genSaltSync(10);
    const demoPasswordHash = bcrypt.hashSync("college123", salt);
    devFallbackStore.counters.users = 3;
    devFallbackStore.users = [
      {
        id: 1,
        name: "College Admin",
        email: "admin@awscloudservice.com",
        password_hash: demoPasswordHash,
        role: "admin",
        phone: "+1-555-0100",
        created_at: (/* @__PURE__ */ new Date()).toISOString()
      },
      {
        id: 2,
        name: "Apex Service Workshop",
        email: "provider@awscloudservice.com",
        password_hash: demoPasswordHash,
        role: "provider",
        phone: "+1-555-0200",
        created_at: (/* @__PURE__ */ new Date()).toISOString()
      },
      {
        id: 3,
        name: "Alex Johnson",
        email: "customer@awscloudservice.com",
        password_hash: demoPasswordHash,
        role: "customer",
        phone: "+1-555-0300",
        created_at: (/* @__PURE__ */ new Date()).toISOString()
      }
    ];
    devFallbackStore.counters.vehicles = 2;
    devFallbackStore.vehicles = [
      {
        id: 1,
        user_id: 3,
        make: "Toyota",
        model: "Corolla",
        year: 2022,
        license_plate: "MH-04-AB-1234",
        fuel_type: "Petrol",
        image_url: "https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=600&auto=format&fit=crop&q=80",
        created_at: (/* @__PURE__ */ new Date()).toISOString()
      },
      {
        id: 2,
        user_id: 3,
        make: "Honda",
        model: "Civic",
        year: 2021,
        license_plate: "MH-04-XY-9876",
        fuel_type: "Hybrid",
        image_url: "https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=600&auto=format&fit=crop&q=80",
        created_at: (/* @__PURE__ */ new Date()).toISOString()
      }
    ];
    devFallbackStore.counters.services = 4;
    devFallbackStore.services = [
      {
        id: 1,
        name: "Full Engine Synthetic Oil & Filter Service",
        description: "Complete engine flush, synthetic oil replacement, filter swap, and fluid top-up.",
        base_price: 89.99,
        estimated_duration_mins: 60,
        is_active: true,
        created_at: (/* @__PURE__ */ new Date()).toISOString()
      },
      {
        id: 2,
        name: "Brake Rotor & Pad Inspection and Replacement",
        description: "Comprehensive disc thickness measurement, caliper check, and premium pad replacement.",
        base_price: 149.5,
        estimated_duration_mins: 90,
        is_active: true,
        created_at: (/* @__PURE__ */ new Date()).toISOString()
      },
      {
        id: 3,
        name: "100-Point Cloud Diagnostics & Multi-Point Inspection",
        description: "Computerized OBD-II diagnostics scan, suspension integrity check, and safety audit.",
        base_price: 65,
        estimated_duration_mins: 45,
        is_active: true,
        created_at: (/* @__PURE__ */ new Date()).toISOString()
      },
      {
        id: 4,
        name: "Air Conditioning & Cabin Filter Overhaul",
        description: "Refrigerant pressure test, vacuum leak diagnosis, and anti-bacterial cabin sanitization.",
        base_price: 110,
        estimated_duration_mins: 75,
        is_active: true,
        created_at: (/* @__PURE__ */ new Date()).toISOString()
      }
    ];
    devFallbackStore.counters.bookings = 1;
    devFallbackStore.bookings = [
      {
        id: 1,
        customer_id: 3,
        vehicle_id: 1,
        service_id: 1,
        provider_id: 2,
        scheduled_date: new Date(Date.now() + 864e5 * 2).toISOString().split("T")[0],
        time_slot: "10:00 AM - 11:30 AM",
        status: "Confirmed",
        notes: "Routine scheduled mileage service. Please check tire tread depth as well.",
        created_at: (/* @__PURE__ */ new Date()).toISOString(),
        updated_at: (/* @__PURE__ */ new Date()).toISOString()
      }
    ];
  }
}
initDevSeedData();
async function initDatabase() {
  const isProduction = process.env.NODE_ENV === "production";
  const dbUrl = process.env.DATABASE_URL;
  if (isProduction && (!dbUrl || dbUrl.trim() === "")) {
    throw new Error("[Amazon RDS PostgreSQL] Production startup halted: DATABASE_URL environment variable is required.");
  }
  if (dbUrl && dbUrl.trim() !== "") {
    try {
      console.log("[DB] Connecting to Amazon RDS PostgreSQL via pg.Pool...");
      const isRds = dbUrl.includes("rds.amazonaws.com") || !dbUrl.includes("localhost");
      pool = new Pool({
        connectionString: dbUrl,
        ssl: isRds ? { rejectUnauthorized: false } : void 0,
        max: 20,
        idleTimeoutMillis: 3e4,
        connectionTimeoutMillis: 1e4
      });
      const client = await pool.connect();
      console.log("[DB] Successfully established connection with Amazon RDS PostgreSQL!");
      isRdsConnected = true;
      dbDriverType = "Amazon RDS PostgreSQL (pg.Pool)";
      const schemaPath = path.resolve(process.cwd(), "server", "db", "schema.sql");
      if (fs.existsSync(schemaPath)) {
        const schemaSql = fs.readFileSync(schemaPath, "utf8");
        await client.query(schemaSql);
        console.log("[DB] Amazon RDS PostgreSQL schema migrations applied successfully.");
      }
      client.release();
    } catch (err) {
      if (isProduction) {
        console.error("[Amazon RDS PostgreSQL Fatal Error]", err.message);
        throw new Error(`Failed to connect to Amazon RDS PostgreSQL in production: ${err.message}`);
      }
      console.warn(`[DB Dev Notice] Could not connect to external PostgreSQL (${err.message}). Using local development environment.`);
      isRdsConnected = false;
      dbDriverType = "Local PostgreSQL Emulation (Dev Mode)";
    }
  } else {
    if (isProduction) {
      throw new Error("[Amazon RDS PostgreSQL] Production requires DATABASE_URL.");
    }
    console.log("[DB Dev Notice] No DATABASE_URL specified in dev. Running in Local Dev mode.");
    dbDriverType = "Local PostgreSQL Emulation (Dev Mode)";
  }
}
async function query(sqlText, params = []) {
  if (isRdsConnected && pool) {
    try {
      const res = await pool.query(sqlText, params);
      return { rows: res.rows, rowCount: res.rowCount || 0 };
    } catch (err) {
      console.error("[Amazon RDS Query Error]", err.message);
      throw err;
    }
  }
  if (process.env.NODE_ENV === "production") {
    throw new Error("[Amazon RDS PostgreSQL Error] Database connection is not established in production.");
  }
  const trimmed = sqlText.trim();
  const lower = trimmed.toLowerCase();
  if (lower.startsWith("select")) {
    if (lower.includes("from users where id = $1")) {
      const u = devFallbackStore.users.find((x) => x.id === Number(params[0]));
      return { rows: u ? [u] : [], rowCount: u ? 1 : 0 };
    }
    if (lower.includes("from users where email = $1")) {
      const u = devFallbackStore.users.find((x) => x.email.toLowerCase() === String(params[0]).toLowerCase());
      return { rows: u ? [u] : [], rowCount: u ? 1 : 0 };
    }
    if (lower.includes("from users order by id desc") || lower.includes("from users")) {
      const safeUsers = devFallbackStore.users.map(({ password_hash, ...rest }) => rest);
      return { rows: safeUsers, rowCount: safeUsers.length };
    }
    if (lower.includes("from vehicles where user_id = $1")) {
      const rows = devFallbackStore.vehicles.filter((v) => v.user_id === Number(params[0])).reverse();
      return { rows, rowCount: rows.length };
    }
    if (lower.includes("from vehicles v") || lower.includes("from vehicles order by")) {
      const rows = devFallbackStore.vehicles.map((v) => {
        const owner = devFallbackStore.users.find((u) => u.id === v.user_id);
        return {
          ...v,
          owner_name: owner ? owner.name : "Unknown",
          owner_email: owner ? owner.email : "Unknown"
        };
      }).reverse();
      return { rows, rowCount: rows.length };
    }
    if (lower.includes("from vehicles where id = $1")) {
      const v = devFallbackStore.vehicles.find((x) => x.id === Number(params[0]));
      return { rows: v ? [v] : [], rowCount: v ? 1 : 0 };
    }
    if (lower.includes("from services where is_active = true") || lower.includes("from services")) {
      const rows = lower.includes("is_active = true") ? devFallbackStore.services.filter((s) => s.is_active) : devFallbackStore.services;
      return { rows, rowCount: rows.length };
    }
    if (lower.includes("from bookings b")) {
      let filtered = [...devFallbackStore.bookings];
      if (lower.includes("where b.customer_id = $1")) {
        filtered = filtered.filter((b) => b.customer_id === Number(params[0]));
      } else if (lower.includes("where b.provider_id = $1") || lower.includes("where (b.provider_id = $1 or b.provider_id is null)")) {
        filtered = filtered.filter((b) => b.provider_id === Number(params[0]) || b.provider_id === null);
      }
      const rows = filtered.map((b) => {
        const customer = devFallbackStore.users.find((u) => u.id === b.customer_id);
        const provider = devFallbackStore.users.find((u) => u.id === b.provider_id);
        const vehicle = devFallbackStore.vehicles.find((v) => v.id === b.vehicle_id);
        const service = devFallbackStore.services.find((s) => s.id === b.service_id);
        return {
          ...b,
          customer_name: customer ? customer.name : "Customer",
          customer_email: customer ? customer.email : "",
          customer_phone: customer ? customer.phone : "",
          provider_name: provider ? provider.name : "Unassigned",
          vehicle_make: vehicle ? vehicle.make : "",
          vehicle_model: vehicle ? vehicle.model : "",
          vehicle_plate: vehicle ? vehicle.license_plate : "",
          service_name: service ? service.name : "",
          service_price: service ? service.base_price : 0
        };
      }).sort((a, b) => b.id - a.id);
      return { rows, rowCount: rows.length };
    }
  }
  if (lower.startsWith("insert into users")) {
    devFallbackStore.counters.users += 1;
    const newUser = {
      id: devFallbackStore.counters.users,
      name: params[0],
      email: params[1],
      password_hash: params[2],
      role: params[3],
      phone: params[4] || null,
      created_at: (/* @__PURE__ */ new Date()).toISOString()
    };
    devFallbackStore.users.push(newUser);
    return { rows: [newUser], rowCount: 1 };
  }
  if (lower.startsWith("insert into vehicles")) {
    devFallbackStore.counters.vehicles += 1;
    const newVehicle = {
      id: devFallbackStore.counters.vehicles,
      user_id: Number(params[0]),
      make: params[1],
      model: params[2],
      year: Number(params[3]),
      license_plate: params[4],
      fuel_type: params[5] || "Petrol",
      image_url: params[6] || null,
      created_at: (/* @__PURE__ */ new Date()).toISOString()
    };
    devFallbackStore.vehicles.push(newVehicle);
    return { rows: [newVehicle], rowCount: 1 };
  }
  if (lower.startsWith("insert into services")) {
    devFallbackStore.counters.services += 1;
    const newService = {
      id: devFallbackStore.counters.services,
      name: params[0],
      description: params[1],
      base_price: Number(params[2]),
      estimated_duration_mins: Number(params[3]),
      is_active: true,
      created_at: (/* @__PURE__ */ new Date()).toISOString()
    };
    devFallbackStore.services.push(newService);
    return { rows: [newService], rowCount: 1 };
  }
  if (lower.startsWith("insert into bookings")) {
    devFallbackStore.counters.bookings += 1;
    const newBooking = {
      id: devFallbackStore.counters.bookings,
      customer_id: Number(params[0]),
      vehicle_id: Number(params[1]),
      service_id: Number(params[2]),
      provider_id: null,
      scheduled_date: params[3],
      time_slot: params[4],
      status: "Pending",
      notes: params[5] || null,
      created_at: (/* @__PURE__ */ new Date()).toISOString(),
      updated_at: (/* @__PURE__ */ new Date()).toISOString()
    };
    devFallbackStore.bookings.push(newBooking);
    return { rows: [newBooking], rowCount: 1 };
  }
  if (lower.startsWith("update bookings set status")) {
    const bookingId = Number(params[params.length - 1]);
    const booking = devFallbackStore.bookings.find((b) => b.id === bookingId);
    if (booking) {
      booking.status = params[0];
      if (params.length > 2 && params[1] !== void 0) {
        booking.provider_id = Number(params[1]);
      }
      booking.updated_at = (/* @__PURE__ */ new Date()).toISOString();
      return { rows: [booking], rowCount: 1 };
    }
    return { rows: [], rowCount: 0 };
  }
  if (lower.startsWith("update services set is_active")) {
    const serviceId = Number(params[1]);
    const service = devFallbackStore.services.find((s) => s.id === serviceId);
    if (service) {
      service.is_active = Boolean(params[0]);
      return { rows: [service], rowCount: 1 };
    }
    return { rows: [], rowCount: 0 };
  }
  if (lower.startsWith("delete from vehicles where id = $1")) {
    const vId = Number(params[0]);
    const idx = devFallbackStore.vehicles.findIndex((v) => v.id === vId);
    if (idx !== -1) {
      devFallbackStore.vehicles.splice(idx, 1);
      return { rows: [], rowCount: 1 };
    }
    return { rows: [], rowCount: 0 };
  }
  return { rows: [], rowCount: 0 };
}

// server/routes/auth.ts
import { Router } from "express";
import bcrypt2 from "bcryptjs";

// server/middleware/auth.ts
import jwt from "jsonwebtoken";
function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (process.env.NODE_ENV === "production" && (!secret || secret.trim() === "")) {
    throw new Error("[Security Error] JWT_SECRET environment variable is required in production.");
  }
  return secret || "college-vehicle-service-aws-dev-secret-2026";
}
function generateToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role, name: user.name },
    getJwtSecret(),
    { expiresIn: "7d" }
  );
}
function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) {
    return res.status(401).json({ error: "Access token required. Please login." });
  }
  try {
    const decoded = jwt.verify(token, getJwtSecret());
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ error: "Invalid or expired authentication token." });
  }
}
function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: `Forbidden: Access restricted to [${allowedRoles.join(", ")}]. Your role is ${req.user.role}.`
      });
    }
    next();
  };
}

// server/routes/auth.ts
var router = Router();
router.post("/register", async (req, res) => {
  try {
    const { name, email, password, role = "customer", phone } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: "Name, email, and password are required." });
    }
    if (!["customer", "provider", "admin"].includes(role)) {
      return res.status(400).json({ error: "Invalid user role specified." });
    }
    const existing = await query("SELECT * FROM users WHERE email = $1", [email.trim().toLowerCase()]);
    if (existing.rowCount > 0) {
      return res.status(409).json({ error: "An account with this email already exists." });
    }
    const salt = await bcrypt2.genSalt(10);
    const passwordHash = await bcrypt2.hash(password, salt);
    const result = await query(
      "INSERT INTO users (name, email, password_hash, role, phone) VALUES ($1, $2, $3, $4, $5) RETURNING id, name, email, role, phone, created_at",
      [name.trim(), email.trim().toLowerCase(), passwordHash, role, phone || null]
    );
    const user = result.rows[0];
    const token = generateToken({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role
    });
    return res.status(201).json({
      message: "User registered successfully in PostgreSQL database.",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone
      },
      token
    });
  } catch (err) {
    console.error("Registration error:", err);
    return res.status(500).json({ error: err.message || "Server error during registration" });
  }
});
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required." });
    }
    const result = await query("SELECT * FROM users WHERE email = $1", [email.trim().toLowerCase()]);
    if (result.rowCount === 0) {
      return res.status(401).json({ error: "Invalid email or password." });
    }
    const user = result.rows[0];
    const isMatch = await bcrypt2.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid email or password." });
    }
    const token = generateToken({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role
    });
    return res.json({
      message: "Login successful.",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone
      },
      token
    });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ error: err.message || "Server error during authentication" });
  }
});
router.get("/me", authenticateToken, async (req, res) => {
  try {
    const result = await query("SELECT id, name, email, role, phone, created_at FROM users WHERE id = $1", [req.user.id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: "User not found" });
    }
    return res.json({ user: result.rows[0] });
  } catch (err) {
    return res.status(500).json({ error: err.message || "Error fetching user profile" });
  }
});
var auth_default = router;

// server/routes/vehicles.ts
import { Router as Router2 } from "express";
var router2 = Router2();
router2.get("/", authenticateToken, async (req, res) => {
  try {
    const user = req.user;
    if (user.role === "admin") {
      const result2 = await query(
        "SELECT v.*, u.name as owner_name, u.email as owner_email FROM vehicles v JOIN users u ON v.user_id = u.id ORDER BY v.id DESC"
      );
      return res.json({ vehicles: result2.rows });
    }
    const result = await query("SELECT * FROM vehicles WHERE user_id = $1 ORDER BY id DESC", [user.id]);
    return res.json({ vehicles: result.rows });
  } catch (err) {
    console.error("Error fetching vehicles:", err);
    return res.status(500).json({ error: err.message || "Error fetching vehicles" });
  }
});
router2.post("/", authenticateToken, async (req, res) => {
  try {
    const user = req.user;
    const { make, model, year, license_plate, fuel_type = "Petrol", image_url } = req.body;
    if (!make || !model || !year || !license_plate) {
      return res.status(400).json({ error: "Make, model, year, and license plate are required." });
    }
    const result = await query(
      "INSERT INTO vehicles (user_id, make, model, year, license_plate, fuel_type, image_url) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *",
      [user.id, make.trim(), model.trim(), parseInt(year, 10), license_plate.trim().toUpperCase(), fuel_type, image_url || null]
    );
    return res.status(201).json({
      message: "Vehicle registered successfully in PostgreSQL database.",
      vehicle: result.rows[0]
    });
  } catch (err) {
    console.error("Error adding vehicle:", err);
    return res.status(500).json({ error: err.message || "Error creating vehicle record" });
  }
});
router2.delete("/:id", authenticateToken, async (req, res) => {
  try {
    const vehicleId = parseInt(req.params.id, 10);
    const user = req.user;
    if (user.role !== "admin") {
      const check = await query("SELECT * FROM vehicles WHERE id = $1", [vehicleId]);
      if (check.rowCount === 0) {
        return res.status(404).json({ error: "Vehicle not found" });
      }
      if (check.rows[0].user_id !== user.id) {
        return res.status(403).json({ error: "Unauthorized to delete this vehicle" });
      }
    }
    await query("DELETE FROM vehicles WHERE id = $1", [vehicleId]);
    return res.json({ message: "Vehicle deleted successfully." });
  } catch (err) {
    return res.status(500).json({ error: err.message || "Error deleting vehicle" });
  }
});
var vehicles_default = router2;

// server/routes/services.ts
import { Router as Router3 } from "express";
var router3 = Router3();
router3.get("/", async (req, res) => {
  try {
    const all = req.query.all === "true";
    const sql = all ? "SELECT * FROM services ORDER BY id ASC" : "SELECT * FROM services WHERE is_active = true ORDER BY id ASC";
    const result = await query(sql);
    return res.json({ services: result.rows });
  } catch (err) {
    return res.status(500).json({ error: err.message || "Error fetching services" });
  }
});
router3.post("/", authenticateToken, requireRole("admin"), async (req, res) => {
  try {
    const { name, description, base_price, estimated_duration_mins } = req.body;
    if (!name || base_price === void 0 || !estimated_duration_mins) {
      return res.status(400).json({ error: "Name, base price, and duration are required." });
    }
    const result = await query(
      "INSERT INTO services (name, description, base_price, estimated_duration_mins) VALUES ($1, $2, $3, $4) RETURNING *",
      [name.trim(), description || "", parseFloat(base_price), parseInt(estimated_duration_mins, 10)]
    );
    return res.status(201).json({
      message: "Service package created successfully.",
      service: result.rows[0]
    });
  } catch (err) {
    return res.status(500).json({ error: err.message || "Error creating service" });
  }
});
router3.patch("/:id/status", authenticateToken, requireRole("admin"), async (req, res) => {
  try {
    const serviceId = parseInt(req.params.id, 10);
    const { is_active } = req.body;
    if (typeof is_active !== "boolean") {
      return res.status(400).json({ error: "is_active must be a boolean (true/false)." });
    }
    const result = await query(
      "UPDATE services SET is_active = $1 WHERE id = $2 RETURNING *",
      [is_active, serviceId]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Service not found." });
    }
    return res.json({
      message: `Service status updated to ${is_active ? "Active" : "Disabled"}.`,
      service: result.rows[0]
    });
  } catch (err) {
    return res.status(500).json({ error: err.message || "Error updating service status" });
  }
});
var services_default = router3;

// server/routes/bookings.ts
import { Router as Router4 } from "express";
var router4 = Router4();
var ALLOWED_STATUSES = ["Pending", "Confirmed", "In Progress", "Completed", "Cancelled"];
router4.get("/", authenticateToken, async (req, res) => {
  try {
    const user = req.user;
    let sql = `
      SELECT 
        b.id,
        b.customer_id,
        b.vehicle_id,
        b.service_id,
        b.provider_id,
        b.scheduled_date,
        b.time_slot,
        b.status,
        b.notes,
        b.created_at,
        b.updated_at,
        u.name as customer_name,
        u.email as customer_email,
        u.phone as customer_phone,
        p.name as provider_name,
        v.make as vehicle_make,
        v.model as vehicle_model,
        v.license_plate as vehicle_plate,
        s.name as service_name,
        s.base_price as service_price
      FROM bookings b
      JOIN users u ON b.customer_id = u.id
      LEFT JOIN users p ON b.provider_id = p.id
      JOIN vehicles v ON b.vehicle_id = v.id
      JOIN services s ON b.service_id = s.id
    `;
    let params = [];
    if (user.role === "customer") {
      sql += " WHERE b.customer_id = $1 ORDER BY b.id DESC";
      params = [user.id];
    } else if (user.role === "provider") {
      sql += " WHERE (b.provider_id = $1 OR b.provider_id IS NULL) ORDER BY b.id DESC";
      params = [user.id];
    } else {
      sql += " ORDER BY b.id DESC";
    }
    const result = await query(sql, params);
    return res.json({ bookings: result.rows });
  } catch (err) {
    console.error("Error fetching bookings:", err);
    return res.status(500).json({ error: err.message || "Error fetching bookings" });
  }
});
router4.post("/", authenticateToken, async (req, res) => {
  try {
    const user = req.user;
    const { vehicle_id, service_id, scheduled_date, time_slot, notes } = req.body;
    if (!vehicle_id || !service_id || !scheduled_date || !time_slot) {
      return res.status(400).json({ error: "Vehicle, service, scheduled date, and time slot are required." });
    }
    if (user.role === "customer") {
      const vehicleCheck = await query("SELECT * FROM vehicles WHERE id = $1 AND user_id = $2", [vehicle_id, user.id]);
      if (vehicleCheck.rowCount === 0) {
        return res.status(403).json({ error: "You can only book services for your own registered vehicles." });
      }
    }
    const result = await query(
      `INSERT INTO bookings (customer_id, vehicle_id, service_id, scheduled_date, time_slot, notes, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'Pending')
       RETURNING *`,
      [user.id, vehicle_id, service_id, scheduled_date, time_slot, notes || null]
    );
    return res.status(201).json({
      message: "Booking created successfully with status: Pending",
      booking: result.rows[0]
    });
  } catch (err) {
    console.error("Error creating booking:", err);
    return res.status(500).json({ error: err.message || "Error creating booking" });
  }
});
router4.patch("/:id/status", authenticateToken, async (req, res) => {
  try {
    const user = req.user;
    const bookingId = parseInt(req.params.id, 10);
    const { status, provider_id } = req.body;
    if (!ALLOWED_STATUSES.includes(status)) {
      return res.status(400).json({ error: `Invalid status. Must be one of: ${ALLOWED_STATUSES.join(", ")}` });
    }
    if (user.role === "customer") {
      return res.status(403).json({ error: "Customers cannot modify status directly. Use cancel endpoint instead." });
    }
    const assignedProvider = provider_id || (user.role === "provider" ? user.id : void 0);
    let result;
    if (assignedProvider !== void 0) {
      result = await query(
        "UPDATE bookings SET status = $1, provider_id = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3 RETURNING *",
        [status, assignedProvider, bookingId]
      );
    } else {
      result = await query(
        "UPDATE bookings SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *",
        [status, bookingId]
      );
    }
    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Booking not found." });
    }
    return res.json({
      message: `Booking #${bookingId} status updated to: ${status}`,
      booking: result.rows[0]
    });
  } catch (err) {
    return res.status(500).json({ error: err.message || "Error updating booking status" });
  }
});
router4.patch("/:id/cancel", authenticateToken, async (req, res) => {
  try {
    const user = req.user;
    const bookingId = parseInt(req.params.id, 10);
    const check = await query("SELECT * FROM bookings WHERE id = $1", [bookingId]);
    if (check.rowCount === 0) {
      return res.status(404).json({ error: "Booking not found" });
    }
    const booking = check.rows[0];
    if (user.role === "customer" && booking.customer_id !== user.id) {
      return res.status(403).json({ error: "Unauthorized to cancel this booking" });
    }
    if (booking.status !== "Pending" && booking.status !== "Confirmed") {
      return res.status(400).json({
        error: `Cannot cancel a booking that is '${booking.status}'. Only Pending or Confirmed bookings can be cancelled.`
      });
    }
    const result = await query(
      "UPDATE bookings SET status = 'Cancelled', updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *",
      [bookingId]
    );
    return res.json({
      message: "Booking cancelled successfully.",
      booking: result.rows[0]
    });
  } catch (err) {
    return res.status(500).json({ error: err.message || "Error cancelling booking" });
  }
});
var bookings_default = router4;

// server/routes/users.ts
import { Router as Router5 } from "express";
var router5 = Router5();
router5.get("/", authenticateToken, requireRole("admin"), async (req, res) => {
  try {
    const result = await query(
      "SELECT id, name, email, role, phone, created_at FROM users ORDER BY id DESC"
    );
    return res.json({ users: result.rows });
  } catch (err) {
    return res.status(500).json({ error: err.message || "Error fetching users" });
  }
});
var users_default = router5;

// server/routes/upload.ts
import { Router as Router6 } from "express";

// server/services/s3.ts
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
var region = process.env.AWS_REGION || "us-east-1";
var bucketName = process.env.S3_BUCKET_NAME;
var ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];
var MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;
var s3Config = {
  region
};
if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
  s3Config.credentials = {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  };
}
var s3Client = null;
try {
  s3Client = new S3Client(s3Config);
} catch (err) {
  console.warn("[AWS S3 Initialization Warning]:", err);
}
function validateVehicleFile(contentType, byteLength) {
  if (!ALLOWED_MIME_TYPES.includes(contentType.toLowerCase())) {
    throw new Error(
      `[File Validation Error] Invalid file type "${contentType}". Only JPEG, PNG, and WebP vehicle images are allowed.`
    );
  }
  if (byteLength > MAX_FILE_SIZE_BYTES) {
    const sizeInMb = (byteLength / (1024 * 1024)).toFixed(2);
    throw new Error(
      `[File Validation Error] File size (${sizeInMb} MB) exceeds maximum allowed limit of 5 MB.`
    );
  }
}
async function uploadVehicleFile(fileName, buffer, contentType) {
  validateVehicleFile(contentType, buffer.length);
  const sanitizedName = fileName.replace(/[^a-zA-Z0-9.-]/g, "_");
  const key = `vehicles/${Date.now()}-${sanitizedName}`;
  const effectiveBucket = bucketName || "vehicle-service-assets-prod";
  const isProduction = process.env.NODE_ENV === "production";
  if (s3Client && (bucketName || isProduction)) {
    try {
      const command = new PutObjectCommand({
        Bucket: effectiveBucket,
        Key: key,
        Body: buffer,
        ContentType: contentType
      });
      const response = await s3Client.send(command);
      const publicUrl = `https://${effectiveBucket}.s3.${region}.amazonaws.com/${key}`;
      console.log(`[AWS S3] Uploaded to s3://${effectiveBucket}/${key} via IAM Role / S3 Client`);
      return {
        url: publicUrl,
        key,
        bucket: effectiveBucket,
        storageType: "Amazon S3 (Storage as a Service)",
        etag: response.ETag
      };
    } catch (err) {
      if (isProduction) {
        console.error("[AWS S3 Production Error] Upload to S3 failed:", err.message);
        throw new Error(`Amazon S3 upload failed in production: ${err.message}`);
      }
      console.warn(`[AWS S3 Dev Notice] S3 upload skipped (${err.message}). Using local development adapter.`);
    }
  }
  const base64Data = buffer.toString("base64");
  const dataUrl = `data:${contentType};base64,${base64Data}`;
  return {
    url: dataUrl,
    key,
    bucket: effectiveBucket,
    storageType: "Local S3 Storage Adapter (Dev Mode)"
  };
}
function getS3Status() {
  const hasIamOrKeys = Boolean(process.env.AWS_ACCESS_KEY_ID || process.env.NODE_ENV === "production");
  return {
    isConfigured: Boolean(bucketName && hasIamOrKeys),
    bucketName: bucketName || "vehicle-service-assets-prod (IAM Role Managed)",
    region,
    authMode: process.env.AWS_ACCESS_KEY_ID ? "Static Access Keys" : "EC2 Instance IAM Role (Recommended)",
    service: "Amazon Simple Storage Service (S3)"
  };
}

// server/routes/upload.ts
var router6 = Router6();
router6.get("/status", (req, res) => {
  return res.json(getS3Status());
});
router6.post("/", authenticateToken, async (req, res) => {
  try {
    const { fileName = "vehicle-image.jpg", fileData, contentType = "image/jpeg" } = req.body;
    if (!fileData) {
      return res.status(400).json({ error: "fileData (base64 string) is required" });
    }
    const base64Clean = fileData.replace(/^data:([A-Za-z-+/]+);base64,/, "");
    const buffer = Buffer.from(base64Clean, "base64");
    const result = await uploadVehicleFile(fileName, buffer, contentType);
    return res.status(201).json({
      message: "Vehicle file uploaded to Amazon S3 storage.",
      ...result
    });
  } catch (err) {
    console.error("S3 Upload Error:", err.message);
    const isValidationError = err.message && err.message.includes("[File Validation Error]");
    return res.status(isValidationError ? 400 : 500).json({ error: err.message || "Error processing S3 upload" });
  }
});
var upload_default = router6;

// server/routes/cloud.ts
import { Router as Router7 } from "express";

// server/config/aws.ts
var getAWSConfig = () => {
  const region2 = process.env.AWS_REGION || "us-east-1";
  const s3Bucket = process.env.S3_BUCKET_NAME || "vehicle-service-assets-prod";
  const dbUrl = process.env.DATABASE_URL || null;
  return {
    region: region2,
    s3: {
      bucketName: s3Bucket,
      isConfigured: Boolean(process.env.S3_BUCKET_NAME || process.env.NODE_ENV === "production")
    },
    rds: {
      databaseUrl: dbUrl ? `Amazon RDS PostgreSQL (${dbUrl.split("@")[1] ? dbUrl.split("@")[1].split("/")[0] : "Provisioned Endpoint"})` : null,
      isConfigured: Boolean(dbUrl),
      engine: "PostgreSQL 15 (Amazon RDS DBaaS)"
    },
    ec2: {
      instanceType: "t3.micro (AWS Free Tier Eligible)",
      ami: "Amazon Linux 2023 AMI (Node.js 20)",
      securityGroupId: "sg-0a812b7f3ec2web"
    },
    elasticBeanstalk: {
      environmentName: "VehicleService-env",
      platform: "Node.js 20 running on 64bit Amazon Linux 2023"
    },
    iam: {
      roleName: "aws-elasticbeanstalk-ec2-role",
      policy: "AmazonS3ReadOnlyAccess, AWSElasticBeanstalkWebTier, CloudWatchAgentServerPolicy"
    },
    securityGroups: {
      webTier: {
        name: "sg-web-tier-ec2",
        inbound: ["HTTP (80) from 0.0.0.0/0", "HTTPS (443) from 0.0.0.0/0", "SSH (22) from Bastion"],
        outbound: ["PostgreSQL (5432) to sg-db-tier-rds", "All HTTPS (443) outbound to AWS S3 & APIs"]
      },
      dbTier: {
        name: "sg-db-tier-rds",
        inbound: ["PostgreSQL (5432) restricted strictly to sg-web-tier-ec2"],
        outbound: ["None (isolated private subnet)"]
      }
    }
  };
};

// server/routes/cloud.ts
var router7 = Router7();
router7.get("/architecture", (req, res) => {
  const awsConfig = getAWSConfig();
  const dbStatus = getDbStatus();
  const s3Status = getS3Status();
  return res.json({
    projectTitle: "Cloud-Based Vehicle Service Management System",
    academicContext: "College Mini-Project Cloud Computing Architecture",
    awsServices: [
      {
        service: "Amazon Elastic Beanstalk",
        type: "PaaS (Platform as a Service)",
        role: "Orchestrates Node.js/Express application container, autoscaling triggers, load balancer, and deployment pipelines.",
        configured: true,
        details: awsConfig.elasticBeanstalk
      },
      {
        service: "Amazon EC2",
        type: "IaaS (Infrastructure as a Service)",
        role: "Virtual computing instances (Amazon Linux 2023 / t3.micro) hosting the Node.js backend server and serving API endpoints.",
        configured: true,
        details: awsConfig.ec2
      },
      {
        service: "Amazon RDS (PostgreSQL)",
        type: "DBaaS (Database as a Service)",
        role: "Managed relational database engine running PostgreSQL 15, handling ACID transactions for Users, Vehicles, Services, and Bookings.",
        configured: dbStatus.databaseUrlConfigured,
        activeDriver: dbStatus.driver,
        details: {
          engine: "PostgreSQL 15",
          endpoint: awsConfig.rds.databaseUrl || "Configured via DATABASE_URL",
          schema: "users, vehicles, services, bookings"
        }
      },
      {
        service: "Amazon Simple Storage Service (S3)",
        type: "Storage as a Service",
        role: "Secure object storage for vehicle inspection photos, registration certificates, and maintenance receipts.",
        configured: s3Status.isConfigured,
        details: s3Status
      },
      {
        service: "AWS IAM & Security Groups",
        type: "Cloud Security & Access Control",
        role: "IAM roles enforce least-privilege policies. Two-tier Security Groups restrict PostgreSQL port 5432 strictly to EC2 web tier instances.",
        configured: true,
        details: {
          iam: awsConfig.iam,
          securityGroups: awsConfig.securityGroups
        }
      }
    ],
    environmentSummary: {
      nodeEnv: process.env.NODE_ENV || "development",
      port: process.env.PORT || 3e3,
      awsRegion: process.env.AWS_REGION || "us-east-1",
      s3Bucket: process.env.S3_BUCKET_NAME || "vehicle-service-assets-prod",
      databaseEngine: dbStatus.driver
    }
  });
});
var cloud_default = router7;

// server.ts
dotenv.config();
var envConfig = validateEnvironment();
var __filename = fileURLToPath(import.meta.url);
var __dirname = path2.dirname(__filename);
var app = express();
var PORT = envConfig.PORT;
var isProd = envConfig.NODE_ENV === "production";
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use((req, res, next) => {
  if (req.path.startsWith("/api")) {
    console.log(`[REST API] ${req.method} ${req.path}`);
  }
  next();
});
app.get("/health", (req, res) => {
  const dbStatus = getDbStatus();
  res.status(200).json({
    status: "HEALTHY",
    service: "Vehicle Service Management System",
    platform: "AWS Elastic Beanstalk",
    compute: "Amazon EC2",
    database: dbStatus.driver,
    timestamp: (/* @__PURE__ */ new Date()).toISOString()
  });
});
app.use("/api/auth", auth_default);
app.use("/api/vehicles", vehicles_default);
app.use("/api/services", services_default);
app.use("/api/bookings", bookings_default);
app.use("/api/users", users_default);
app.use("/api/upload", upload_default);
app.use("/api/cloud", cloud_default);
app.use((err, req, res, next) => {
  console.error("[Unhandled Server Error]:", err.message);
  res.status(err.status || 500).json({
    error: isProd ? "Internal server error occurred." : err.message || "Server error"
  });
});
async function startServer() {
  await initDatabase();
  if (!isProd) {
    const { createServer } = await import("vite");
    const vite = await createServer({
      server: {
        middlewareMode: true
      },
      appType: "custom"
    });
    app.use(vite.middlewares);
    app.use("*", async (req, res, next) => {
      const url = req.originalUrl;
      try {
        let template = fs2.readFileSync(path2.resolve(__dirname, "index.html"), "utf-8");
        template = await vite.transformIndexHtml(url, template);
        res.status(200).set({ "Content-Type": "text/html" }).end(template);
      } catch (e) {
        vite.ssrFixStacktrace(e);
        next(e);
      }
    });
  } else {
    const distPath = path2.resolve(__dirname, "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path2.resolve(distPath, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`=======================================================`);
    console.log(` Cloud-Based Vehicle Service Management System Started `);
    console.log(` Host: http://0.0.0.0:${PORT}                          `);
    console.log(` Mode: ${envConfig.NODE_ENV.toUpperCase()}             `);
    console.log(` Target Cloud Platform: AWS (Beanstalk + EC2 + RDS + S3) `);
    console.log(`=======================================================`);
  });
}
startServer().catch((err) => {
  console.error("[Server Fatal Startup Error]:", err.message);
  process.exit(1);
});
