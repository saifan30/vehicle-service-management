import { Router, Response } from 'express';
import { query } from '../db/index.ts';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth.ts';

const router = Router();

const ALLOWED_STATUSES = ['Pending', 'Confirmed', 'In Progress', 'Completed', 'Cancelled'] as const;

// GET /api/bookings
// Customer: view their bookings
// Provider: view assigned bookings (and open pending bookings to accept)
// Admin: view all bookings
router.get('/', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;

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

    let params: any[] = [];

    if (user.role === 'customer') {
      sql += ' WHERE b.customer_id = $1 ORDER BY b.id DESC';
      params = [user.id];
    } else if (user.role === 'provider') {
      // Providers see bookings assigned to them or unassigned
      sql += ' WHERE (b.provider_id = $1 OR b.provider_id IS NULL) ORDER BY b.id DESC';
      params = [user.id];
    } else {
      // Admin sees everything
      sql += ' ORDER BY b.id DESC';
    }

    const result = await query(sql, params);
    return res.json({ bookings: result.rows });
  } catch (err: any) {
    console.error('Error fetching bookings:', err);
    return res.status(500).json({ error: err.message || 'Error fetching bookings' });
  }
});

// POST /api/bookings (Customer books a service)
router.post('/', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const { vehicle_id, service_id, scheduled_date, time_slot, notes } = req.body;

    if (!vehicle_id || !service_id || !scheduled_date || !time_slot) {
      return res.status(400).json({ error: 'Vehicle, service, scheduled date, and time slot are required.' });
    }

    // Verify vehicle belongs to user (or admin booking on behalf)
    if (user.role === 'customer') {
      const vehicleCheck = await query('SELECT * FROM vehicles WHERE id = $1 AND user_id = $2', [vehicle_id, user.id]);
      if (vehicleCheck.rowCount === 0) {
        return res.status(403).json({ error: 'You can only book services for your own registered vehicles.' });
      }
    }

    // Insert booking into PostgreSQL
    const result = await query(
      `INSERT INTO bookings (customer_id, vehicle_id, service_id, scheduled_date, time_slot, notes, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'Pending')
       RETURNING *`,
      [user.id, vehicle_id, service_id, scheduled_date, time_slot, notes || null]
    );

    return res.status(201).json({
      message: 'Booking created successfully with status: Pending',
      booking: result.rows[0],
    });
  } catch (err: any) {
    console.error('Error creating booking:', err);
    return res.status(500).json({ error: err.message || 'Error creating booking' });
  }
});

// PATCH /api/bookings/:id/status (Service Provider or Admin updates status)
router.patch('/:id/status', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const bookingId = parseInt(req.params.id, 10);
    const { status, provider_id } = req.body;

    if (!ALLOWED_STATUSES.includes(status)) {
      return res.status(400).json({ error: `Invalid status. Must be one of: ${ALLOWED_STATUSES.join(', ')}` });
    }

    if (user.role === 'customer') {
      return res.status(403).json({ error: 'Customers cannot modify status directly. Use cancel endpoint instead.' });
    }

    // Determine assigned provider ID
    const assignedProvider = provider_id || (user.role === 'provider' ? user.id : undefined);

    let result;
    if (assignedProvider !== undefined) {
      result = await query(
        'UPDATE bookings SET status = $1, provider_id = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3 RETURNING *',
        [status, assignedProvider, bookingId]
      );
    } else {
      result = await query(
        'UPDATE bookings SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
        [status, bookingId]
      );
    }

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Booking not found.' });
    }

    return res.json({
      message: `Booking #${bookingId} status updated to: ${status}`,
      booking: result.rows[0],
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Error updating booking status' });
  }
});

// PATCH /api/bookings/:id/cancel (Customer cancels Pending or Confirmed booking)
router.patch('/:id/cancel', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const bookingId = parseInt(req.params.id, 10);

    // Verify booking
    const check = await query('SELECT * FROM bookings WHERE id = $1', [bookingId]);
    if (check.rowCount === 0) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    const booking = check.rows[0];

    // Customer can only cancel their own booking
    if (user.role === 'customer' && booking.customer_id !== user.id) {
      return res.status(403).json({ error: 'Unauthorized to cancel this booking' });
    }

    // Rule: Pending/Confirmed → Cancelled
    if (booking.status !== 'Pending' && booking.status !== 'Confirmed') {
      return res.status(400).json({
        error: `Cannot cancel a booking that is '${booking.status}'. Only Pending or Confirmed bookings can be cancelled.`,
      });
    }

    const result = await query(
      "UPDATE bookings SET status = 'Cancelled', updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *",
      [bookingId]
    );

    return res.json({
      message: 'Booking cancelled successfully.',
      booking: result.rows[0],
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Error cancelling booking' });
  }
});

export default router;
