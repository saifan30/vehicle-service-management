import { useState, useEffect } from 'react';
import { User } from './types';
import { api, storage } from './services/api';
import { Navbar } from './components/Navbar';
import { CustomerDashboard } from './pages/CustomerDashboard';
import { ProviderDashboard } from './pages/ProviderDashboard';
import { AdminDashboard } from './pages/AdminDashboard';
import { AuthPage } from './pages/AuthPage';
import { AWSArchitectureModal } from './components/AWSArchitectureModal';
import { Cloud, Server, Database, HardDrive, ShieldCheck } from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [showArchModal, setShowArchModal] = useState(false);

  useEffect(() => {
    const token = storage.getToken();
    if (token) {
      api.auth.getMe()
        .then(res => setCurrentUser(res.user))
        .catch(() => {
          storage.removeToken();
          setCurrentUser(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const handleLogout = () => {
    api.auth.logout();
    setCurrentUser(null);
  };

  const handleSwitchRole = async (targetRole: 'customer' | 'provider' | 'admin') => {
    // Switch between the pre-seeded college evaluation accounts
    let targetEmail = 'customer@awscloudservice.com';
    if (targetRole === 'provider') targetEmail = 'provider@awscloudservice.com';
    if (targetRole === 'admin') targetEmail = 'admin@awscloudservice.com';

    try {
      const res = await api.auth.login({ email: targetEmail, password: 'college123' });
      setCurrentUser(res.user);
    } catch {
      // Fallback update current role in session
      if (currentUser) {
        setCurrentUser({ ...currentUser, role: targetRole });
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center text-slate-500">
        <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center animate-pulse mb-3">
          <Cloud className="w-6 h-6" />
        </div>
        <p className="text-xs font-medium">Connecting to Cloud Backend & PostgreSQL...</p>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <>
        <AuthPage 
          onAuthSuccess={setCurrentUser} 
          onOpenArchitecture={() => setShowArchModal(true)} 
        />
        <AWSArchitectureModal 
          isOpen={showArchModal} 
          onClose={() => setShowArchModal(false)} 
        />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100/60 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col">
      {/* Top Navbar */}
      <Navbar
        user={currentUser}
        onLogout={handleLogout}
        onOpenArchitecture={() => setShowArchModal(true)}
        onSwitchRole={handleSwitchRole}
      />

      {/* Cloud Architecture Quick Status Bar */}
      <div className="bg-slate-900 text-slate-300 text-xs px-4 py-2 border-b border-slate-800">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-4 text-[11px]">
            <span className="flex items-center gap-1.5 text-amber-400 font-semibold">
              <Cloud className="w-3.5 h-3.5" /> AWS Elastic Beanstalk (PaaS)
            </span>
            <span className="hidden sm:inline-flex items-center gap-1.5 text-orange-400">
              <Server className="w-3.5 h-3.5" /> EC2 Node.js (IaaS)
            </span>
            <span className="inline-flex items-center gap-1.5 text-blue-400">
              <Database className="w-3.5 h-3.5" /> RDS PostgreSQL (DBaaS)
            </span>
            <span className="hidden md:inline-flex items-center gap-1.5 text-emerald-400">
              <HardDrive className="w-3.5 h-3.5" /> Amazon S3
            </span>
            <span className="hidden lg:inline-flex items-center gap-1.5 text-purple-400">
              <ShieldCheck className="w-3.5 h-3.5" /> IAM & Security Groups
            </span>
          </div>

          <button
            onClick={() => setShowArchModal(true)}
            className="text-[11px] text-amber-400 hover:text-amber-300 underline font-medium"
          >
            Review College Architecture Specs →
          </button>
        </div>
      </div>

      {/* Main App Content by Role */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentUser.role === 'customer' && <CustomerDashboard user={currentUser} />}
        {currentUser.role === 'provider' && <ProviderDashboard user={currentUser} />}
        {currentUser.role === 'admin' && <AdminDashboard user={currentUser} />}
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-4 text-center text-xs text-slate-500 dark:text-slate-400">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            Cloud-Based Vehicle Service Management System • College Mini-Project
          </div>
          <div className="text-[11px] text-slate-400 font-mono">
            AWS Architecture: Beanstalk + EC2 + RDS PostgreSQL + S3 + IAM
          </div>
        </div>
      </footer>

      {/* AWS Cloud Architecture & Documentation Modal */}
      <AWSArchitectureModal
        isOpen={showArchModal}
        onClose={() => setShowArchModal(false)}
      />
    </div>
  );
}
