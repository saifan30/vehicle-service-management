import { Router, Request, Response } from 'express';
import { query } from '../db/index.ts';
import { authenticateToken, requireRole, AuthenticatedRequest } from '../middleware/auth.ts';

const router = Router();

// GET /api/services (Public / Authenticated: customers see active services, admins see all)
router.get('/', async (req: Request, res: Response) => {
  try {
    const all = req.query.all === 'true';
    const sql = all
      ? 'SELECT * FROM services ORDER BY id ASC'
      : 'SELECT * FROM services WHERE is_active = true ORDER BY id ASC';

    const result = await query(sql);
    return res.json({ services: result.rows });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Error fetching services' });
  }
});

// POST /api/services (Admin adds a new service)
router.post('/', authenticateToken, requireRole('admin'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name, description, base_price, estimated_duration_mins } = req.body;

    if (!name || base_price === undefined || !estimated_duration_mins) {
      return res.status(400).json({ error: 'Name, base price, and duration are required.' });
    }

    const result = await query(
      'INSERT INTO services (name, description, base_price, estimated_duration_mins) VALUES ($1, $2, $3, $4) RETURNING *',
      [name.trim(), description || '', parseFloat(base_price), parseInt(estimated_duration_mins, 10)]
    );

    return res.status(201).json({
      message: 'Service package created successfully.',
      service: result.rows[0],
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Error creating service' });
  }
});

// PATCH /api/services/:id/status (Admin enables or disables a service)
router.patch('/:id/status', authenticateToken, requireRole('admin'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const serviceId = parseInt(req.params.id, 10);
    const { is_active } = req.body;

    if (typeof is_active !== 'boolean') {
      return res.status(400).json({ error: 'is_active must be a boolean (true/false).' });
    }

    const result = await query(
      'UPDATE services SET is_active = $1 WHERE id = $2 RETURNING *',
      [is_active, serviceId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Service not found.' });
    }

    return res.json({
      message: `Service status updated to ${is_active ? 'Active' : 'Disabled'}.`,
      service: result.rows[0],
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Error updating service status' });
  }
});

export default router;
