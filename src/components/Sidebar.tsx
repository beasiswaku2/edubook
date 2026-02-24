import { 
  LayoutDashboard, 
  MessageSquare, 
  CreditCard, 
  Users, 
  History, 
  LogOut,
  GraduationCap,
  ShieldCheck,
  Info
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '../lib/utils';

const menuItems = [
  { icon: LayoutDashboard, label: 'Dasbor', path: '/' },
  { icon: MessageSquare, label: 'Chat AI', path: '/chat' },
  { icon: CreditCard, label: 'Isi Ulang', path: '/topup' },
  { icon: Users, label: 'Referal', path: '/referral' },
  { icon: Info, label: 'Panduan Referal', path: '/referral-info' },
  { icon: History, label: 'Riwayat', path: '/history' },
];

const adminItems = [
  { icon: ShieldCheck, label: 'Panel Admin', path: '/admin' },
];

export default function Sidebar({ user, onLogout }: { user: any, onLogout: () => void }) {
  const location = useLocation();

  return (
    <div className="w-64 bg-white border-r border-gray-100 flex flex-col h-screen sticky top-0">
      <div className="p-6 flex items-center gap-3">
        <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-200">
          <GraduationCap className="text-white w-6 h-6" />
        </div>
        <span className="text-xl font-bold text-gray-800">EduBook AI</span>
      </div>

      <nav className="flex-1 px-4 py-4 space-y-1">
        <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 mb-2">Menu Utama</div>
        {menuItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={cn(
              "flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group",
              location.pathname === item.path 
                ? "bg-emerald-50 text-emerald-600 font-medium" 
                : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
            )}
          >
            <item.icon className={cn(
              "w-5 h-5",
              location.pathname === item.path ? "text-emerald-600" : "text-gray-400 group-hover:text-gray-600"
            )} />
            {item.label}
          </Link>
        ))}

        {user?.role === 'admin' && (
          <>
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 mt-8 mb-2">Administrasi</div>
            {adminItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group",
                  location.pathname === item.path 
                    ? "bg-indigo-50 text-indigo-600 font-medium" 
                    : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                )}
              >
                <item.icon className={cn(
                  "w-5 h-5",
                  location.pathname === item.path ? "text-indigo-600" : "text-gray-400 group-hover:text-gray-600"
                )} />
                {item.label}
              </Link>
            ))}
          </>
        )}
      </nav>

      <div className="p-4 border-t border-gray-50">
        <button
          onClick={onLogout}
          className="flex items-center gap-3 w-full px-3 py-3 rounded-xl text-gray-500 hover:bg-red-50 hover:text-red-600 transition-all duration-200"
        >
          <LogOut className="w-5 h-5" />
          Keluar
        </button>
      </div>
    </div>
  );
}
