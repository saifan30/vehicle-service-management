import { Router, Response } from 'express';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth.ts';
import { uploadVehicleFile, getS3Status } from '../services/s3.ts';

const router = Router();

// GET /api/upload/status (Check S3 status)
router.get('/status', (req, res) => {
  return res.json(getS3Status());
});

// POST /api/upload (Upload image/document to Amazon S3)
router.post('/', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { fileName = 'vehicle-image.jpg', fileData, contentType = 'image/jpeg' } = req.body;

    if (!fileData) {
      return res.status(400).json({ error: 'fileData (base64 string) is required' });
    }

    // Strip header if present
    const base64Clean = fileData.replace(/^data:([A-Za-z-+/]+);base64,/, '');
    const buffer = Buffer.from(base64Clean, 'base64');

    const result = await uploadVehicleFile(fileName, buffer, contentType);

    return res.status(201).json({
      message: 'Vehicle file uploaded to Amazon S3 storage.',
      ...result,
    });
  } catch (err: any) {
    console.error('S3 Upload Error:', err.message);
    const isValidationError = err.message && err.message.includes('[File Validation Error]');
    return res.status(isValidationError ? 400 : 500).json({ error: err.message || 'Error processing S3 upload' });
  }
});

export default router;
