import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  Clock, 
  Award, 
  BookOpen, 
  Zap, 
  MessageSquare,
  ArrowRight,
  Megaphone,
  ChevronRight
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Dashboard({ user }: { user: any }) {
  const [promos, setPromos] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/promotions')
      .then(res => res.json())
      .then(data => setPromos(data))
      .catch(err => console.error("Failed to fetch promos:", err));
  }, []);

  const stats = [
    { label: 'Sisa Kuota', value: user.quota_balance, icon: Zap, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Bonus Referral', value: `Rp ${user.bonus_balance.toLocaleString()}`, icon: Award, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Masa Aktif', value: user.quota_expiry ? new Date(user.quota_expiry).toLocaleDateString() : 'Belum Aktif', icon: Clock, color: 'text-blue-600', bg: 'bg-blue-50' },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Halo, {user.name}! 👋</h1>
          <p className="text-gray-500 mt-1">Siap untuk menjadi lebih cerdas hari ini?</p>
        </div>
        <Link 
          to="/chat" 
          className="bg-emerald-500 text-white px-6 py-3 rounded-2xl font-bold shadow-lg shadow-emerald-100 hover:bg-emerald-600 transition-all flex items-center gap-2 w-fit"
        >
          Mulai Belajar
          <ArrowRight className="w-5 h-5" />
        </Link>
      </div>

      {/* Promotions Section */}
      {promos.length > 0 && (
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-50 flex items-center justify-between">
            <h3 className="font-bold text-gray-800 flex items-center gap-2">
              <Megaphone className="w-5 h-5 text-indigo-600" />
              Info & Promo Terbaru
            </h3>
          </div>
          <div className="divide-y divide-gray-50">
            {promos.map((p) => (
              <div key={p.id} className="p-6 hover:bg-gray-50 transition-colors group">
                <div className="flex flex-col md:flex-row gap-6">
                  {p.image && (
                    <div className={`shrink-0 bg-gray-100 rounded-2xl overflow-hidden ${
                      p.image_aspect === '16:9' ? 'w-full md:w-48 aspect-video' : 
                      p.image_aspect === '1:1' ? 'w-full md:w-32 aspect-square' : 'w-full md:w-32 aspect-[4/5]'
                    }`}>
                      <img 
                        src={p.image} 
                        alt={p.title} 
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  )}
                  <div className="flex-1 flex justify-between items-start gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${
                          p.type === 'promo' ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'
                        }`}>
                          {p.type}
                        </span>
                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                          {new Date(p.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <h4 className="font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">{p.title}</h4>
                      <p className="text-sm text-gray-500">{p.content}</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-indigo-600 transition-all shrink-0" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-4">
            <div className={`w-14 h-14 ${stat.bg} rounded-2xl flex items-center justify-center`}>
              <stat.icon className={`w-7 h-7 ${stat.color}`} />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-400">{stat.label}</p>
              <p className="text-2xl font-bold text-gray-800">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-gray-800">Aktivitas Terakhir</h3>
            <Link to="/history" className="text-emerald-600 text-sm font-bold hover:underline">Lihat Semua</Link>
          </div>
          <div className="space-y-4">
            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl">
              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                <MessageSquare className="w-5 h-5 text-emerald-500" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-gray-800">Tanya Kak AI</p>
                <p className="text-xs text-gray-400">Baru saja</p>
              </div>
              <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">-1 Kuota</span>
            </div>
          </div>
        </div>

        <div className="bg-emerald-600 p-8 rounded-3xl shadow-xl shadow-emerald-100 relative overflow-hidden">
          <div className="relative z-10 space-y-4">
            <h3 className="text-2xl font-bold text-white">Undang Teman, <br />Dapatkan Bonus!</h3>
            <p className="text-emerald-100 text-sm max-w-xs">Dapatkan komisi 10% dari setiap transaksi teman yang Anda undang menggunakan kode referal Anda.</p>
            <Link 
              to="/referral" 
              className="inline-block bg-white text-emerald-600 px-6 py-3 rounded-xl font-bold hover:bg-emerald-50 transition-all"
            >
              Periksa Referal
            </Link>
          </div>
          <TrendingUp className="absolute -bottom-4 -right-4 w-48 h-48 text-emerald-500/30 rotate-12" />
        </div>
      </div>
    </div>
  );
}

