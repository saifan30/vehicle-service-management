import { useState, useEffect } from 'react';
import { AWSArchitectureInfo } from '../types';
import { api } from '../services/api';
import { 
  Cloud, 
  Server, 
  Database, 
  HardDrive, 
  ShieldCheck, 
  Layers, 
  X, 
  CheckCircle, 
  ArrowRight,
  Code2,
  Table,
  Cpu
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export function AWSArchitectureModal({ isOpen, onClose }: Props) {
  const [arch, setArch] = useState<AWSArchitectureInfo | null>(null);
  const [activeTab, setActiveTab] = useState<'architecture' | 'database' | 'apis' | 'security'>('architecture');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      api.cloud.getArchitecture()
        .then(setArch)
        .catch(err => console.error('Failed to load AWS architecture:', err))
        .finally(() => setLoading(false));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Cloud className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                AWS Cloud Architecture & College Documentation
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                PaaS (Beanstalk) • IaaS (EC2) • DBaaS (RDS PostgreSQL) • Storage (S3) • IAM & Security Groups
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab navigation */}
        <div className="px-6 border-b border-slate-200 dark:border-slate-800 flex gap-4 text-sm font-medium">
          <button
            onClick={() => setActiveTab('architecture')}
            className={`py-3 border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'architecture'
                ? 'border-amber-500 text-amber-600 dark:text-amber-400'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Layers className="w-4 h-4" />
            Cloud Topology
          </button>
          <button
            onClick={() => setActiveTab('database')}
            className={`py-3 border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'database'
                ? 'border-amber-500 text-amber-600 dark:text-amber-400'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Database className="w-4 h-4" />
            RDS PostgreSQL Schema
          </button>
          <button
            onClick={() => setActiveTab('security')}
            className={`py-3 border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'security'
                ? 'border-amber-500 text-amber-600 dark:text-amber-400'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            IAM & Security Groups
          </button>
          <button
            onClick={() => setActiveTab('apis')}
            className={`py-3 border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'apis'
                ? 'border-amber-500 text-amber-600 dark:text-amber-400'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Code2 className="w-4 h-4" />
            REST APIs
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {loading ? (
            <div className="flex items-center justify-center py-12 text-slate-500">
              <Cpu className="w-6 h-6 animate-spin mr-2" /> Loading AWS Infrastructure metadata...
            </div>
          ) : activeTab === 'architecture' ? (
            <div className="space-y-6">
              {/* Architecture Flow Diagram */}
              <div className="bg-slate-50 dark:bg-slate-950/60 p-5 rounded-xl border border-slate-200 dark:border-slate-800">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-4">
                  End-to-End Request Pipeline (AWS Architecture Plan)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-3 items-center text-center">
                  <div className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 shadow-xs">
                    <div className="text-xs font-bold text-slate-900 dark:text-white">Client / Browser</div>
                    <div className="text-[10px] text-slate-500 mt-1">React SPA Frontend</div>
                  </div>
                  <div className="flex justify-center text-slate-400">
                    <ArrowRight className="w-5 h-5 rotate-90 md:rotate-0" />
                  </div>
                  <div className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-amber-300 dark:border-amber-700/50 shadow-xs">
                    <span className="text-[10px] font-bold px-1.5 py-0.5 bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300 rounded">
                      PaaS
                    </span>
                    <div className="text-xs font-bold text-slate-900 dark:text-white mt-1">AWS Elastic Beanstalk</div>
                    <div className="text-[10px] text-slate-500">Auto-deploy & Load Balancer</div>
                  </div>
                  <div className="flex justify-center text-slate-400">
                    <ArrowRight className="w-5 h-5 rotate-90 md:rotate-0" />
                  </div>
                  <div className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-orange-300 dark:border-orange-700/50 shadow-xs">
                    <span className="text-[10px] font-bold px-1.5 py-0.5 bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300 rounded">
                      IaaS
                    </span>
                    <div className="text-xs font-bold text-slate-900 dark:text-white mt-1">Amazon EC2</div>
                    <div className="text-[10px] text-slate-500">Node.js / Express Server</div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 pt-4 border-t border-slate-200 dark:border-slate-800">
                  <div className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-blue-300 dark:border-blue-700/50 flex items-start gap-3">
                    <Database className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold px-1.5 py-0.5 bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 rounded">
                          DBaaS
                        </span>
                        <div className="text-xs font-bold text-slate-900 dark:text-white">Amazon RDS (PostgreSQL)</div>
                      </div>
                      <div className="text-xs text-slate-500 mt-1">
                        Relational storage for Users, Vehicles, Services, and Bookings via port 5432.
                      </div>
                    </div>
                  </div>

                  <div className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-emerald-300 dark:border-emerald-700/50 flex items-start gap-3">
                    <HardDrive className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0" />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold px-1.5 py-0.5 bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 rounded">
                          Storage as a Service
                        </span>
                        <div className="text-xs font-bold text-slate-900 dark:text-white">Amazon S3</div>
                      </div>
                      <div className="text-xs text-slate-500 mt-1">
                        Object storage bucket for vehicle inspection photos & repair documents.
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* AWS Services Table */}
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                  <Server className="w-4 h-4 text-amber-500" />
                  College Requirement Checklist & AWS Service Breakdown
                </h4>
                <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-800">
                      <tr>
                        <th className="py-2.5 px-3">College Requirement</th>
                        <th className="py-2.5 px-3">AWS Service</th>
                        <th className="py-2.5 px-3">Role in System</th>
                        <th className="py-2.5 px-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                      <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                        <td className="py-2 px-3 font-semibold text-slate-800 dark:text-slate-200">Public Cloud</td>
                        <td className="py-2 px-3 text-amber-600 dark:text-amber-400 font-medium">Amazon Web Services (AWS)</td>
                        <td className="py-2 px-3 text-slate-600 dark:text-slate-400">Target cloud hosting infrastructure</td>
                        <td className="py-2 px-3">
                          <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                            <CheckCircle className="w-3.5 h-3.5" /> Planned
                          </span>
                        </td>
                      </tr>
                      <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                        <td className="py-2 px-3 font-semibold text-slate-800 dark:text-slate-200">PaaS</td>
                        <td className="py-2 px-3 text-amber-600 dark:text-amber-400 font-medium">AWS Elastic Beanstalk</td>
                        <td className="py-2 px-3 text-slate-600 dark:text-slate-400">Node.js environment deployment & management</td>
                        <td className="py-2 px-3">
                          <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                            <CheckCircle className="w-3.5 h-3.5" /> Configured
                          </span>
                        </td>
                      </tr>
                      <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                        <td className="py-2 px-3 font-semibold text-slate-800 dark:text-slate-200">IaaS</td>
                        <td className="py-2 px-3 text-amber-600 dark:text-amber-400 font-medium">Amazon EC2</td>
                        <td className="py-2 px-3 text-slate-600 dark:text-slate-400">Virtual machine compute running Express server</td>
                        <td className="py-2 px-3">
                          <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                            <CheckCircle className="w-3.5 h-3.5" /> Active
                          </span>
                        </td>
                      </tr>
                      <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                        <td className="py-2 px-3 font-semibold text-slate-800 dark:text-slate-200">DBaaS</td>
                        <td className="py-2 px-3 text-amber-600 dark:text-amber-400 font-medium">Amazon RDS PostgreSQL</td>
                        <td className="py-2 px-3 text-slate-600 dark:text-slate-400">Relational DB with ACID transactions</td>
                        <td className="py-2 px-3">
                          <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                            <CheckCircle className="w-3.5 h-3.5" /> pg Driver Ready
                          </span>
                        </td>
                      </tr>
                      <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                        <td className="py-2 px-3 font-semibold text-slate-800 dark:text-slate-200">Storage as a Service</td>
                        <td className="py-2 px-3 text-amber-600 dark:text-amber-400 font-medium">Amazon S3</td>
                        <td className="py-2 px-3 text-slate-600 dark:text-slate-400">Object storage bucket for vehicle files</td>
                        <td className="py-2 px-3">
                          <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                            <CheckCircle className="w-3.5 h-3.5" /> SDK Integrated
                          </span>
                        </td>
                      </tr>
                      <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                        <td className="py-2 px-3 font-semibold text-slate-800 dark:text-slate-200">Security</td>
                        <td className="py-2 px-3 text-amber-600 dark:text-amber-400 font-medium">AWS IAM + Security Groups</td>
                        <td className="py-2 px-3 text-slate-600 dark:text-slate-400">Least privilege roles & 2-tier network isolation</td>
                        <td className="py-2 px-3">
                          <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                            <CheckCircle className="w-3.5 h-3.5" /> Architected
                          </span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : activeTab === 'database' ? (
            <div className="space-y-4">
              <div className="p-4 bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 rounded-lg text-xs text-blue-900 dark:text-blue-300">
                <strong>PostgreSQL DBaaS Schema:</strong> Database contains 4 core relational tables with foreign key constraints, indexed lookups, and strict enum checking.
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 border border-slate-200 dark:border-slate-800 rounded-lg bg-slate-50 dark:bg-slate-900/40">
                  <div className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-1.5 mb-2">
                    <Table className="w-4 h-4 text-blue-500" />
                    1. users (Customer, Provider, Admin)
                  </div>
                  <ul className="text-[11px] space-y-1 text-slate-600 dark:text-slate-400 font-mono">
                    <li>• id: SERIAL PRIMARY KEY</li>
                    <li>• name: VARCHAR(100) NOT NULL</li>
                    <li>• email: VARCHAR(150) UNIQUE NOT NULL</li>
                    <li>• password_hash: VARCHAR(255) NOT NULL</li>
                    <li>• role: ('customer', 'provider', 'admin')</li>
                    <li>• phone: VARCHAR(30)</li>
                    <li>• created_at: TIMESTAMP WITH TIME ZONE</li>
                  </ul>
                </div>

                <div className="p-4 border border-slate-200 dark:border-slate-800 rounded-lg bg-slate-50 dark:bg-slate-900/40">
                  <div className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-1.5 mb-2">
                    <Table className="w-4 h-4 text-emerald-500" />
                    2. vehicles
                  </div>
                  <ul className="text-[11px] space-y-1 text-slate-600 dark:text-slate-400 font-mono">
                    <li>• id: SERIAL PRIMARY KEY</li>
                    <li>• user_id: REFERENCES users(id) ON DELETE CASCADE</li>
                    <li>• make: VARCHAR(50) NOT NULL</li>
                    <li>• model: VARCHAR(50) NOT NULL</li>
                    <li>• year: INTEGER NOT NULL</li>
                    <li>• license_plate: VARCHAR(30) NOT NULL</li>
                    <li>• fuel_type: VARCHAR(30)</li>
                    <li>• image_url: TEXT (Amazon S3 Key/URL)</li>
                  </ul>
                </div>

                <div className="p-4 border border-slate-200 dark:border-slate-800 rounded-lg bg-slate-50 dark:bg-slate-900/40">
                  <div className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-1.5 mb-2">
                    <Table className="w-4 h-4 text-amber-500" />
                    3. services
                  </div>
                  <ul className="text-[11px] space-y-1 text-slate-600 dark:text-slate-400 font-mono">
                    <li>• id: SERIAL PRIMARY KEY</li>
                    <li>• name: VARCHAR(100) NOT NULL</li>
                    <li>• description: TEXT</li>
                    <li>• base_price: NUMERIC(10, 2) NOT NULL</li>
                    <li>• estimated_duration_mins: INTEGER NOT NULL</li>
                    <li>• is_active: BOOLEAN DEFAULT TRUE</li>
                  </ul>
                </div>

                <div className="p-4 border border-slate-200 dark:border-slate-800 rounded-lg bg-slate-50 dark:bg-slate-900/40">
                  <div className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-1.5 mb-2">
                    <Table className="w-4 h-4 text-purple-500" />
                    4. bookings
                  </div>
                  <ul className="text-[11px] space-y-1 text-slate-600 dark:text-slate-400 font-mono">
                    <li>• id: SERIAL PRIMARY KEY</li>
                    <li>• customer_id: REFERENCES users(id)</li>
                    <li>• vehicle_id: REFERENCES vehicles(id)</li>
                    <li>• service_id: REFERENCES services(id)</li>
                    <li>• provider_id: REFERENCES users(id)</li>
                    <li>• scheduled_date: DATE NOT NULL</li>
                    <li>• time_slot: VARCHAR(50) NOT NULL</li>
                    <li>• status: Pending|Confirmed|In Progress|Completed|Cancelled</li>
                  </ul>
                </div>
              </div>
            </div>
          ) : activeTab === 'security' ? (
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 dark:bg-slate-950/60 rounded-lg border border-slate-200 dark:border-slate-800">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-2">
                  1. AWS Security Groups (Network Isolation)
                </h4>
                <div className="space-y-3 text-xs text-slate-600 dark:text-slate-400">
                  <div className="p-3 bg-white dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-800">
                    <strong className="text-slate-900 dark:text-white">Web Tier Security Group (sg-web-tier-ec2):</strong>
                    <ul className="list-disc list-inside mt-1 space-y-0.5">
                      <li>Inbound: HTTP Port 80 (from 0.0.0.0/0), HTTPS Port 443 (from 0.0.0.0/0)</li>
                      <li>Inbound: SSH Port 22 (from Bastion Host IP only)</li>
                      <li>Outbound: TCP Port 5432 strictly to sg-db-tier-rds</li>
                    </ul>
                  </div>
                  <div className="p-3 bg-white dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-800">
                    <strong className="text-slate-900 dark:text-white">Database Tier Security Group (sg-db-tier-rds):</strong>
                    <ul className="list-disc list-inside mt-1 space-y-0.5">
                      <li>Inbound: PostgreSQL Port 5432 restricted to sg-web-tier-ec2 only</li>
                      <li>Inbound: No direct internet access (Private Subnet)</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-950/60 rounded-lg border border-slate-200 dark:border-slate-800">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-2">
                  2. AWS IAM Execution Role (Least Privilege)
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  The EC2 instance runs under an IAM Role with attached policies:
                </p>
                <div className="mt-2 flex flex-wrap gap-2 text-[11px] font-mono">
                  <span className="px-2 py-1 bg-slate-200 dark:bg-slate-800 rounded text-slate-800 dark:text-slate-200">
                    AmazonS3FullAccess (scoped to vehicle-service-assets bucket)
                  </span>
                  <span className="px-2 py-1 bg-slate-200 dark:bg-slate-800 rounded text-slate-800 dark:text-slate-200">
                    AWSElasticBeanstalkWebTier
                  </span>
                  <span className="px-2 py-1 bg-slate-200 dark:bg-slate-800 rounded text-slate-800 dark:text-slate-200">
                    CloudWatchAgentServerPolicy
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Node.js Express REST API Contract
              </h4>
              <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden text-xs">
                <table className="w-full text-left font-mono">
                  <thead className="bg-slate-100 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300">
                    <tr>
                      <th className="py-2 px-3">Method</th>
                      <th className="py-2 px-3">Endpoint</th>
                      <th className="py-2 px-3">Scope / Role</th>
                      <th className="py-2 px-3">Function</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-[11px]">
                    <tr>
                      <td className="py-1.5 px-3 text-emerald-600 font-bold">POST</td>
                      <td className="py-1.5 px-3">/api/auth/register</td>
                      <td className="py-1.5 px-3 text-slate-500">Public</td>
                      <td className="py-1.5 px-3 text-slate-600 dark:text-slate-400">Register Customer or Provider</td>
                    </tr>
                    <tr>
                      <td className="py-1.5 px-3 text-emerald-600 font-bold">POST</td>
                      <td className="py-1.5 px-3">/api/auth/login</td>
                      <td className="py-1.5 px-3 text-slate-500">Public</td>
                      <td className="py-1.5 px-3 text-slate-600 dark:text-slate-400">Authenticate & generate JWT</td>
                    </tr>
                    <tr>
                      <td className="py-1.5 px-3 text-blue-600 font-bold">GET</td>
                      <td className="py-1.5 px-3">/api/vehicles</td>
                      <td className="py-1.5 px-3 text-slate-500">Customer / Admin</td>
                      <td className="py-1.5 px-3 text-slate-600 dark:text-slate-400">List user or all vehicles</td>
                    </tr>
                    <tr>
                      <td className="py-1.5 px-3 text-emerald-600 font-bold">POST</td>
                      <td className="py-1.5 px-3">/api/vehicles</td>
                      <td className="py-1.5 px-3 text-slate-500">Customer</td>
                      <td className="py-1.5 px-3 text-slate-600 dark:text-slate-400">Add vehicle & S3 image key</td>
                    </tr>
                    <tr>
                      <td className="py-1.5 px-3 text-blue-600 font-bold">GET</td>
                      <td className="py-1.5 px-3">/api/services</td>
                      <td className="py-1.5 px-3 text-slate-500">Authenticated</td>
                      <td className="py-1.5 px-3 text-slate-600 dark:text-slate-400">List active service packages</td>
                    </tr>
                    <tr>
                      <td className="py-1.5 px-3 text-emerald-600 font-bold">POST</td>
                      <td className="py-1.5 px-3">/api/services</td>
                      <td className="py-1.5 px-3 text-slate-500">Admin</td>
                      <td className="py-1.5 px-3 text-slate-600 dark:text-slate-400">Create new service package</td>
                    </tr>
                    <tr>
                      <td className="py-1.5 px-3 text-amber-600 font-bold">PATCH</td>
                      <td className="py-1.5 px-3">/api/services/:id/status</td>
                      <td className="py-1.5 px-3 text-slate-500">Admin</td>
                      <td className="py-1.5 px-3 text-slate-600 dark:text-slate-400">Enable or disable service</td>
                    </tr>
                    <tr>
                      <td className="py-1.5 px-3 text-blue-600 font-bold">GET</td>
                      <td className="py-1.5 px-3">/api/bookings</td>
                      <td className="py-1.5 px-3 text-slate-500">All Roles</td>
                      <td className="py-1.5 px-3 text-slate-600 dark:text-slate-400">Role-scoped booking records</td>
                    </tr>
                    <tr>
                      <td className="py-1.5 px-3 text-emerald-600 font-bold">POST</td>
                      <td className="py-1.5 px-3">/api/bookings</td>
                      <td className="py-1.5 px-3 text-slate-500">Customer</td>
                      <td className="py-1.5 px-3 text-slate-600 dark:text-slate-400">Book service for vehicle</td>
                    </tr>
                    <tr>
                      <td className="py-1.5 px-3 text-amber-600 font-bold">PATCH</td>
                      <td className="py-1.5 px-3">/api/bookings/:id/status</td>
                      <td className="py-1.5 px-3 text-slate-500">Provider / Admin</td>
                      <td className="py-1.5 px-3 text-slate-600 dark:text-slate-400">Update booking status progression</td>
                    </tr>
                    <tr>
                      <td className="py-1.5 px-3 text-amber-600 font-bold">PATCH</td>
                      <td className="py-1.5 px-3">/api/bookings/:id/cancel</td>
                      <td className="py-1.5 px-3 text-slate-500">Customer</td>
                      <td className="py-1.5 px-3 text-slate-600 dark:text-slate-400">Cancel Pending/Confirmed booking</td>
                    </tr>
                    <tr>
                      <td className="py-1.5 px-3 text-emerald-600 font-bold">POST</td>
                      <td className="py-1.5 px-3">/api/upload</td>
                      <td className="py-1.5 px-3 text-slate-500">Authenticated</td>
                      <td className="py-1.5 px-3 text-slate-600 dark:text-slate-400">Upload vehicle photo to Amazon S3</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 flex items-center justify-between text-xs text-slate-500">
          <span>Target Platform: Amazon Web Services (AWS)</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 text-white hover:bg-slate-900 dark:bg-slate-200 dark:text-slate-900 dark:hover:bg-white font-medium transition-colors"
          >
            Close Documentation
          </button>
        </div>
      </div>
    </div>
  );
}
