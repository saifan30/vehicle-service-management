import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { query } from '../db/index.ts';
import { generateToken, authenticateToken, AuthenticatedRequest } from '../middleware/auth.ts';

const router = Router();

// POST /api/auth/register
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { name, email, password, role = 'customer', phone } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required.' });
    }

    if (!['customer', 'provider', 'admin'].includes(role)) {
      return res.status(400).json({ error: 'Invalid user role specified.' });
    }

    // Check if email already registered
    const existing = await query('SELECT * FROM users WHERE email = $1', [email.trim().toLowerCase()]);
    if (existing.rowCount > 0) {
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }

    // Hash password using bcrypt
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Insert user into PostgreSQL
    const result = await query(
      'INSERT INTO users (name, email, password_hash, role, phone) VALUES ($1, $2, $3, $4, $5) RETURNING id, name, email, role, phone, created_at',
      [name.trim(), email.trim().toLowerCase(), passwordHash, role, phone || null]
    );

    const user = result.rows[0];
    const token = generateToken({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    });

    return res.status(201).json({
      message: 'User registered successfully in PostgreSQL database.',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
      },
      token,
    });
  } catch (err: any) {
    console.error('Registration error:', err);
    return res.status(500).json({ error: err.message || 'Server error during registration' });
  }
});

// POST /api/auth/login
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    // Lookup user in PostgreSQL
    const result = await query('SELECT * FROM users WHERE email = $1', [email.trim().toLowerCase()]);
    if (result.rowCount === 0) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const user = result.rows[0];

    // Validate password hash
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const token = generateToken({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    });

    return res.json({
      message: 'Login successful.',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
      },
      token,
    });
  } catch (err: any) {
    console.error('Login error:', err);
    return res.status(500).json({ error: err.message || 'Server error during authentication' });
  }
});

// GET /api/auth/me
router.get('/me', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const result = await query('SELECT id, name, email, role, phone, created_at FROM users WHERE id = $1', [req.user!.id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    return res.json({ user: result.rows[0] });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Error fetching user profile' });
  }
});

export default router;
