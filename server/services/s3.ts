import { S3Client, PutObjectCommand, S3ClientConfig } from '@aws-sdk/client-s3';

const region = process.env.AWS_REGION || 'us-east-1';
const bucketName = process.env.S3_BUCKET_NAME;

// Supported vehicle image MIME types
export const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
// Reasonable maximum file size for vehicle images/documents (5 MB)
export const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;

const s3Config: S3ClientConfig = {
  region,
};

// Use explicit credentials ONLY if provided in environment (e.g., local testing).
// When deployed on AWS Elastic Beanstalk / EC2, the AWS SDK automatically utilizes
// the attached IAM Role (Default Credential Provider Chain) without requiring static access keys.
if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
  s3Config.credentials = {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  };
}

let s3Client: S3Client | null = null;
try {
  s3Client = new S3Client(s3Config);
} catch (err) {
  console.warn('[AWS S3 Initialization Warning]:', err);
}

export interface S3UploadResult {
  url: string;
  key: string;
  bucket: string;
  storageType: 'Amazon S3 (Storage as a Service)' | 'Local S3 Storage Adapter (Dev Mode)';
  etag?: string;
}

/**
 * Validate vehicle file type and size before uploading
 */
export function validateVehicleFile(contentType: string, byteLength: number): void {
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

/**
 * Upload vehicle photo or service document to Amazon S3.
 * Uses EC2 IAM role / AWS credentials in production.
 */
export async function uploadVehicleFile(
  fileName: string,
  buffer: Buffer,
  contentType: string
): Promise<S3UploadResult> {
  // Validate file type and size
  validateVehicleFile(contentType, buffer.length);

  const sanitizedName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
  const key = `vehicles/${Date.now()}-${sanitizedName}`;
  const effectiveBucket = bucketName || 'vehicle-service-assets-prod';
  const isProduction = process.env.NODE_ENV === 'production';

  // In production or when bucket is explicitly specified, attempt AWS S3 upload
  if (s3Client && (bucketName || isProduction)) {
    try {
      const command = new PutObjectCommand({
        Bucket: effectiveBucket,
        Key: key,
        Body: buffer,
        ContentType: contentType,
      });

      const response = await s3Client.send(command);
      const publicUrl = `https://${effectiveBucket}.s3.${region}.amazonaws.com/${key}`;

      console.log(`[AWS S3] Uploaded to s3://${effectiveBucket}/${key} via IAM Role / S3 Client`);

      return {
        url: publicUrl,
        key,
        bucket: effectiveBucket,
        storageType: 'Amazon S3 (Storage as a Service)',
        etag: response.ETag,
      };
    } catch (err: any) {
      if (isProduction) {
        console.error('[AWS S3 Production Error] Upload to S3 failed:', err.message);
        throw new Error(`Amazon S3 upload failed in production: ${err.message}`);
      }
      console.warn(`[AWS S3 Dev Notice] S3 upload skipped (${err.message}). Using local development adapter.`);
    }
  }

  // Development Fallback Adapter for local offline testing
  const base64Data = buffer.toString('base64');
  const dataUrl = `data:${contentType};base64,${base64Data}`;

  return {
    url: dataUrl,
    key,
    bucket: effectiveBucket,
    storageType: 'Local S3 Storage Adapter (Dev Mode)',
  };
}

export function getS3Status() {
  const hasIamOrKeys = Boolean(process.env.AWS_ACCESS_KEY_ID || process.env.NODE_ENV === 'production');
  return {
    isConfigured: Boolean(bucketName && hasIamOrKeys),
    bucketName: bucketName || 'vehicle-service-assets-prod (IAM Role Managed)',
    region,
    authMode: process.env.AWS_ACCESS_KEY_ID ? 'Static Access Keys' : 'EC2 Instance IAM Role (Recommended)',
    service: 'Amazon Simple Storage Service (S3)',
  };
}
