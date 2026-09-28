import React, { useState } from 'react';
import { User } from '../types';
import { api } from '../services/api';
import { 
  Cloud, 
  Lock, 
  Mail, 
  User as UserIcon, 
  Phone, 
  Check, 
  AlertCircle, 
  ArrowRight,
  Server,
  Database,
  HardDrive,
  ShieldCheck,
  Zap
} from 'lucide-react';

interface Props {
  onAuthSuccess: (user: User) => void;
  onOpenArchitecture: () => void;
}

export function AuthPage({ onAuthSuccess, onOpenArchitecture }: Props) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<'customer' | 'provider'>('customer');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isLogin) {
        const res = await api.auth.login({ email, password });
        onAuthSuccess(res.user);
      } else {
        const res = await api.auth.register({ name, email, password, role, phone });
        onAuthSuccess(res.user);
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setIsLogin(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-between p-4 sm:p-6 lg:p-8">
      {/* Top Banner */}
      <div className="max-w-6xl mx-auto w-full flex items-center justify-between pb-6 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold shadow-xs">
            <Cloud className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-900 dark:text-white">
              Cloud Vehicle Service Management System
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              College Mini-Project • AWS Architecture Deployment
            </p>
          </div>
        </div>

        <button
          onClick={onOpenArchitecture}
          className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/30 hover:bg-amber-500/20 transition-colors"
        >
          View AWS Cloud Docs
        </button>
      </div>

      {/* Main Container */}
      <div className="max-w-6xl mx-auto w-full my-auto py-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Left Column: Academic / AWS Overview */}
        <div className="lg:col-span-7 space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
            <Zap className="w-3.5 h-3.5" /> AWS Cloud Architecture Validated
          </div>

          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight">
            Production-Ready Cloud Vehicle Service Management
          </h2>

          <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            Engineered to fulfill all cloud computing syllabus requirements: Platform as a Service (Elastic Beanstalk), 
            Infrastructure as a Service (Amazon EC2), Database as a Service (Amazon RDS PostgreSQL), and Storage as a Service (Amazon S3).
          </p>

          {/* Cloud Mapping Badges */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
              <Server className="w-4 h-4 text-orange-500 mb-1" />
              <div className="text-[10px] uppercase font-bold text-slate-400">PaaS / IaaS</div>
              <div className="text-xs font-bold text-slate-900 dark:text-white">Beanstalk & EC2</div>
            </div>

            <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
              <Database className="w-4 h-4 text-blue-500 mb-1" />
              <div className="text-[10px] uppercase font-bold text-slate-400">DBaaS</div>
              <div className="text-xs font-bold text-slate-900 dark:text-white">RDS PostgreSQL</div>
            </div>

            <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
              <HardDrive className="w-4 h-4 text-emerald-500 mb-1" />
              <div className="text-[10px] uppercase font-bold text-slate-400">Storage</div>
              <div className="text-xs font-bold text-slate-900 dark:text-white">Amazon S3</div>
            </div>

            <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
              <ShieldCheck className="w-4 h-4 text-amber-500 mb-1" />
              <div className="text-[10px] uppercase font-bold text-slate-400">Security</div>
              <div className="text-xs font-bold text-slate-900 dark:text-white">IAM & SG</div>
            </div>
          </div>

          {/* Quick Demo Credentials Box for College Evaluators */}
          <div className="p-4 bg-amber-500/5 dark:bg-amber-950/20 border border-amber-500/20 rounded-xl space-y-2">
            <div className="text-xs font-bold text-amber-800 dark:text-amber-400 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5" />
              College Evaluation Quick-Fill:
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-400">
              Click any role to populate demo credentials (password for all: <code className="font-mono font-bold">college123</code>):
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              <button
                type="button"
                onClick={() => handleQuickLogin('customer@awscloudservice.com', 'college123')}
                className="px-2.5 py-1 text-xs rounded-lg bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-950/60 dark:hover:bg-emerald-900 text-emerald-800 dark:text-emerald-300 font-medium transition-colors"
              >
                1. Customer (Alex Johnson)
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('provider@awscloudservice.com', 'college123')}
                className="px-2.5 py-1 text-xs rounded-lg bg-indigo-100 hover:bg-indigo-200 dark:bg-indigo-950/60 dark:hover:bg-indigo-900 text-indigo-800 dark:text-indigo-300 font-medium transition-colors"
              >
                2. Service Provider (Apex Workshop)
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('admin@awscloudservice.com', 'college123')}
                className="px-2.5 py-1 text-xs rounded-lg bg-rose-100 hover:bg-rose-200 dark:bg-rose-950/60 dark:hover:bg-rose-900 text-rose-800 dark:text-rose-300 font-medium transition-colors"
              >
                3. System Admin
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Auth Card */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl">
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-200 dark:border-slate-800">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {isLogin ? 'Sign In to Your Account' : 'Register New Account'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Direct REST API with PostgreSQL database
              </p>
            </div>
            <div className="flex bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg text-xs">
              <button
                type="button"
                onClick={() => setIsLogin(true)}
                className={`px-3 py-1 rounded-md font-semibold transition-colors ${
                  isLogin
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Login
              </button>
              <button
                type="button"
                onClick={() => setIsLogin(false)}
                className={`px-3 py-1 rounded-md font-semibold transition-colors ${
                  !isLogin
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Register
              </button>
            </div>
          </div>

          {error && (
            <div className="p-3 mb-4 rounded-lg bg-rose-500/10 border border-rose-500/20 text-xs text-rose-600 dark:text-rose-400 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Full Name *
                  </label>
                  <div className="relative">
                    <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      placeholder="e.g. John Doe"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full text-xs pl-9 pr-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Phone Number (Optional)
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="tel"
                      placeholder="+1-555-0199"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full text-xs pl-9 pr-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Account Role *
                  </label>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <button
                      type="button"
                      onClick={() => setRole('customer')}
                      className={`p-2 rounded-lg border text-center font-medium transition-colors ${
                        role === 'customer'
                          ? 'border-amber-500 bg-amber-500/10 text-amber-800 dark:text-amber-300 font-bold'
                          : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      Customer (Vehicle Owner)
                    </button>
                    <button
                      type="button"
                      onClick={() => setRole('provider')}
                      className={`p-2 rounded-lg border text-center font-medium transition-colors ${
                        role === 'provider'
                          ? 'border-amber-500 bg-amber-500/10 text-amber-800 dark:text-amber-300 font-bold'
                          : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      Service Provider (Mechanic)
                    </button>
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Email Address *
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full text-xs pl-9 pr-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Password *
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full text-xs pl-9 pr-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 text-xs font-bold rounded-lg bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-950 shadow-xs flex items-center justify-center gap-1.5 transition-colors"
            >
              {loading ? (
                'Processing...'
              ) : isLogin ? (
                <>
                  Login with PostgreSQL <ArrowRight className="w-3.5 h-3.5" />
                </>
              ) : (
                <>
                  Register User Record <Check className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Footer */}
      <div className="max-w-6xl mx-auto w-full pt-4 border-t border-slate-200 dark:border-slate-800 text-center text-xs text-slate-400">
        College Mini-Project • Cloud Architecture: AWS Elastic Beanstalk (PaaS), Amazon EC2 (IaaS), Amazon RDS PostgreSQL (DBaaS), Amazon S3
      </div>
    </div>
  );
}
