import { Router, Request, Response } from 'express';
import { getAWSConfig } from '../config/aws.ts';
import { getDbStatus } from '../db/index.ts';
import { getS3Status } from '../services/s3.ts';

const router = Router();

// GET /api/cloud/architecture
// College Mini-Project AWS Infrastructure Mapping
router.get('/architecture', (req: Request, res: Response) => {
  const awsConfig = getAWSConfig();
  const dbStatus = getDbStatus();
  const s3Status = getS3Status();

  return res.json({
    projectTitle: 'Cloud-Based Vehicle Service Management System',
    academicContext: 'College Mini-Project Cloud Computing Architecture',
    awsServices: [
      {
        service: 'Amazon Elastic Beanstalk',
        type: 'PaaS (Platform as a Service)',
        role: 'Orchestrates Node.js/Express application container, autoscaling triggers, load balancer, and deployment pipelines.',
        configured: true,
        details: awsConfig.elasticBeanstalk,
      },
      {
        service: 'Amazon EC2',
        type: 'IaaS (Infrastructure as a Service)',
        role: 'Virtual computing instances (Amazon Linux 2023 / t3.micro) hosting the Node.js backend server and serving API endpoints.',
        configured: true,
        details: awsConfig.ec2,
      },
      {
        service: 'Amazon RDS (PostgreSQL)',
        type: 'DBaaS (Database as a Service)',
        role: 'Managed relational database engine running PostgreSQL 15, handling ACID transactions for Users, Vehicles, Services, and Bookings.',
        configured: dbStatus.databaseUrlConfigured,
        activeDriver: dbStatus.driver,
        details: {
          engine: 'PostgreSQL 15',
          endpoint: awsConfig.rds.databaseUrl || 'Configured via DATABASE_URL',
          schema: 'users, vehicles, services, bookings',
        },
      },
      {
        service: 'Amazon Simple Storage Service (S3)',
        type: 'Storage as a Service',
        role: 'Secure object storage for vehicle inspection photos, registration certificates, and maintenance receipts.',
        configured: s3Status.isConfigured,
        details: s3Status,
      },
      {
        service: 'AWS IAM & Security Groups',
        type: 'Cloud Security & Access Control',
        role: 'IAM roles enforce least-privilege policies. Two-tier Security Groups restrict PostgreSQL port 5432 strictly to EC2 web tier instances.',
        configured: true,
        details: {
          iam: awsConfig.iam,
          securityGroups: awsConfig.securityGroups,
        },
      },
    ],
    environmentSummary: {
      nodeEnv: process.env.NODE_ENV || 'development',
      port: process.env.PORT || 3000,
      awsRegion: process.env.AWS_REGION || 'us-east-1',
      s3Bucket: process.env.S3_BUCKET_NAME || 'vehicle-service-assets-prod',
      databaseEngine: dbStatus.driver,
    },
  });
});

export default router;
