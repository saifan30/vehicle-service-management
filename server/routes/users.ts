import { Router, Response } from 'express';
import { query } from '../db/index.ts';
import { authenticateToken, requireRole, AuthenticatedRequest } from '../middleware/auth.ts';

const router = Router();

// GET /api/users (Admin views all registered users)
router.get('/', authenticateToken, requireRole('admin'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const result = await query(
      'SELECT id, name, email, role, phone, created_at FROM users ORDER BY id DESC'
    );
    return res.json({ users: result.rows });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Error fetching users' });
  }
});

export default router;
