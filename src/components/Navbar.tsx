import { User } from '../types';
import { Cloud, Wrench, Shield, Car, LogOut, FileText, UserCheck } from 'lucide-react';

interface Props {
  user: User;
  onLogout: () => void;
  onOpenArchitecture: () => void;
  onSwitchRole: (role: 'customer' | 'provider' | 'admin') => void;
}

export function Navbar({ user, onLogout, onOpenArchitecture, onSwitchRole }: Props) {
  const getRoleBadge = () => {
    switch (user.role) {
      case 'admin':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
            <Shield className="w-3 h-3" /> Admin
          </span>
        );
      case 'provider':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
            <Wrench className="w-3 h-3" /> Service Provider
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <Car className="w-3 h-3" /> Customer
          </span>
        );
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo and Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-600 to-amber-400 flex items-center justify-center text-white shadow-xs">
            <Cloud className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900 dark:text-white text-base tracking-tight">
                Cloud Vehicle Service
              </span>
              <span className="hidden sm:inline-block text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 font-semibold">
                AWS Mini-Project
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:block">
              EC2 • Beanstalk • RDS PostgreSQL • S3
            </p>
          </div>
        </div>

        {/* Center / Right controls */}
        <div className="flex items-center gap-3">
          {/* Quick role switcher dropdown/buttons for college reviewer */}
          <div className="hidden md:flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs">
            <button
              onClick={() => onSwitchRole('customer')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                user.role === 'customer'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-medium shadow-2xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Customer
            </button>
            <button
              onClick={() => onSwitchRole('provider')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                user.role === 'provider'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-medium shadow-2xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Provider
            </button>
            <button
              onClick={() => onSwitchRole('admin')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                user.role === 'admin'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-medium shadow-2xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Admin
            </button>
          </div>

          {/* Architecture Modal Trigger */}
          <button
            onClick={onOpenArchitecture}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/30 hover:bg-amber-500/20 transition-colors"
            title="View AWS Architecture & College Documentation"
          >
            <FileText className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">AWS Architecture</span>
          </button>

          {/* User Profile and Role */}
          <div className="flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-800">
            <div className="hidden lg:block text-right">
              <div className="text-xs font-semibold text-slate-900 dark:text-white truncate max-w-[120px]">
                {user.name}
              </div>
              <div>{getRoleBadge()}</div>
            </div>

            <button
              onClick={onLogout}
              className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
