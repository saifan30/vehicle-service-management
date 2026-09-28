/**
 * AWS Architecture & Configuration Layer
 * College Project: Cloud-Based Vehicle Service Management System
 * 
 * Maps AWS Cloud Services:
 * - PaaS: AWS Elastic Beanstalk
 * - IaaS: Amazon EC2
 * - DBaaS: Amazon RDS PostgreSQL
 * - Storage as a Service: Amazon S3
 * - Security: AWS IAM + AWS Security Groups
 */

export interface AWSConfig {
  region: string;
  s3: {
    bucketName: string;
    isConfigured: boolean;
  };
  rds: {
    databaseUrl: string | null;
    isConfigured: boolean;
    engine: string;
  };
  ec2: {
    instanceType: string;
    ami: string;
    securityGroupId: string;
  };
  elasticBeanstalk: {
    environmentName: string;
    platform: string;
  };
  iam: {
    roleName: string;
    policy: string;
  };
  securityGroups: {
    webTier: {
      name: string;
      inbound: string[];
      outbound: string[];
    };
    dbTier: {
      name: string;
      inbound: string[];
      outbound: string[];
    };
  };
}

export const getAWSConfig = (): AWSConfig => {
  const region = process.env.AWS_REGION || 'us-east-1';
  const s3Bucket = process.env.S3_BUCKET_NAME || 'vehicle-service-assets-prod';
  const dbUrl = process.env.DATABASE_URL || null;

  return {
    region,
    s3: {
      bucketName: s3Bucket,
      isConfigured: Boolean(process.env.S3_BUCKET_NAME || process.env.NODE_ENV === 'production'),
    },
    rds: {
      databaseUrl: dbUrl ? `Amazon RDS PostgreSQL (${dbUrl.split('@')[1] ? dbUrl.split('@')[1].split('/')[0] : 'Provisioned Endpoint'})` : null,
      isConfigured: Boolean(dbUrl),
      engine: 'PostgreSQL 15 (Amazon RDS DBaaS)',
    },
    ec2: {
      instanceType: 't3.micro (AWS Free Tier Eligible)',
      ami: 'Amazon Linux 2023 AMI (Node.js 20)',
      securityGroupId: 'sg-0a812b7f3ec2web',
    },
    elasticBeanstalk: {
      environmentName: 'VehicleService-env',
      platform: 'Node.js 20 running on 64bit Amazon Linux 2023',
    },
    iam: {
      roleName: 'aws-elasticbeanstalk-ec2-role',
      policy: 'AmazonS3ReadOnlyAccess, AWSElasticBeanstalkWebTier, CloudWatchAgentServerPolicy',
    },
    securityGroups: {
      webTier: {
        name: 'sg-web-tier-ec2',
        inbound: ['HTTP (80) from 0.0.0.0/0', 'HTTPS (443) from 0.0.0.0/0', 'SSH (22) from Bastion'],
        outbound: ['PostgreSQL (5432) to sg-db-tier-rds', 'All HTTPS (443) outbound to AWS S3 & APIs'],
      },
      dbTier: {
        name: 'sg-db-tier-rds',
        inbound: ['PostgreSQL (5432) restricted strictly to sg-web-tier-ec2'],
        outbound: ['None (isolated private subnet)'],
      },
    },
  };
};
