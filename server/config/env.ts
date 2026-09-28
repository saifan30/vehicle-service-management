/**
 * Environment Variable Validation for AWS Deployment
 * College Project: Cloud-Based Vehicle Service Management System
 */

export interface ValidatedEnv {
  PORT: number;
  NODE_ENV: 'development' | 'production' | 'test';
  DATABASE_URL?: string;
  JWT_SECRET: string;
  AWS_REGION: string;
  S3_BUCKET_NAME?: string;
  AWS_ACCESS_KEY_ID?: string;
  AWS_SECRET_ACCESS_KEY?: string;
}

export function validateEnvironment(): ValidatedEnv {
  const nodeEnv = (process.env.NODE_ENV as 'development' | 'production' | 'test') || 'development';
  const isProduction = nodeEnv === 'production';
  const missingVariables: string[] = [];

  const port = parseInt(process.env.PORT || '3000', 10);
  if (isNaN(port) || port <= 0) {
    throw new Error(`[Configuration Error] Invalid PORT specified: "${process.env.PORT}". Must be a valid positive port number.`);
  }

  // In production (AWS Elastic Beanstalk / EC2), DATABASE_URL and JWT_SECRET are strictly required
  if (isProduction) {
    if (!process.env.DATABASE_URL || process.env.DATABASE_URL.trim() === '') {
      missingVariables.push('DATABASE_URL (Amazon RDS PostgreSQL Connection String)');
    }

    if (!process.env.JWT_SECRET || process.env.JWT_SECRET.trim() === '') {
      missingVariables.push('JWT_SECRET (Secret key for signing JSON Web Tokens)');
    }

    if (missingVariables.length > 0) {
      console.error('\n================================================================');
      console.error(' [CRITICAL ERROR] Missing Required Production Environment Variables:');
      missingVariables.forEach(v => console.error(`  - ${v}`));
      console.error(' Please configure these in your AWS Elastic Beanstalk Environment Properties');
      console.error(' or your production .env file before starting the server.');
      console.error('================================================================\n');
      throw new Error(`Server startup aborted: Missing required production environment variables: [${missingVariables.join(', ')}]`);
    }
  } else {
    // Development warnings
    if (!process.env.DATABASE_URL) {
      console.warn('[Config Warning] DATABASE_URL is not set. Amazon RDS PostgreSQL will use local connection or testing schema.');
    }
    if (!process.env.JWT_SECRET) {
      console.warn('[Config Warning] JWT_SECRET is not set in development. Using secure internal development secret.');
    }
  }

  const jwtSecret = process.env.JWT_SECRET || 'college-vehicle-service-aws-dev-secret-2026';
  const awsRegion = process.env.AWS_REGION || 'us-east-1';

  return {
    PORT: port,
    NODE_ENV: nodeEnv,
    DATABASE_URL: process.env.DATABASE_URL,
    JWT_SECRET: jwtSecret,
    AWS_REGION: awsRegion,
    S3_BUCKET_NAME: process.env.S3_BUCKET_NAME,
    AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
    AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,
  };
}
