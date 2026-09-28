import { Router, Response } from 'express';
import { query } from '../db/index.ts';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth.ts';

const router = Router();

// GET /api/vehicles
// Customers get their own vehicles; Admin gets all vehicles
router.get('/', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;

    if (user.role === 'admin') {
      const result = await query(
        'SELECT v.*, u.name as owner_name, u.email as owner_email FROM vehicles v JOIN users u ON v.user_id = u.id ORDER BY v.id DESC'
      );
      return res.json({ vehicles: result.rows });
    }

    // Customer or provider
    const result = await query('SELECT * FROM vehicles WHERE user_id = $1 ORDER BY id DESC', [user.id]);
    return res.json({ vehicles: result.rows });
  } catch (err: any) {
    console.error('Error fetching vehicles:', err);
    return res.status(500).json({ error: err.message || 'Error fetching vehicles' });
  }
});

// POST /api/vehicles (Customer adds vehicle)
router.post('/', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const { make, model, year, license_plate, fuel_type = 'Petrol', image_url } = req.body;

    if (!make || !model || !year || !license_plate) {
      return res.status(400).json({ error: 'Make, model, year, and license plate are required.' });
    }

    const result = await query(
      'INSERT INTO vehicles (user_id, make, model, year, license_plate, fuel_type, image_url) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [user.id, make.trim(), model.trim(), parseInt(year, 10), license_plate.trim().toUpperCase(), fuel_type, image_url || null]
    );

    return res.status(201).json({
      message: 'Vehicle registered successfully in PostgreSQL database.',
      vehicle: result.rows[0],
    });
  } catch (err: any) {
    console.error('Error adding vehicle:', err);
    return res.status(500).json({ error: err.message || 'Error creating vehicle record' });
  }
});

// DELETE /api/vehicles/:id (Customer or Admin deletes vehicle)
router.delete('/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const vehicleId = parseInt(req.params.id, 10);
    const user = req.user!;

    // Check ownership if not admin
    if (user.role !== 'admin') {
      const check = await query('SELECT * FROM vehicles WHERE id = $1', [vehicleId]);
      if (check.rowCount === 0) {
        return res.status(404).json({ error: 'Vehicle not found' });
      }
      if (check.rows[0].user_id !== user.id) {
        return res.status(403).json({ error: 'Unauthorized to delete this vehicle' });
      }
    }

    await query('DELETE FROM vehicles WHERE id = $1', [vehicleId]);
    return res.json({ message: 'Vehicle deleted successfully.' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Error deleting vehicle' });
  }
});

export default router;
