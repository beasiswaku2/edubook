import React, { useState, useEffect } from 'react';
import { ShieldCheck, Users, Banknote, Clock, Check, X, Eye, Trash2, Edit2, Search, TrendingUp, LogOut, Loader2, Megaphone, Plus, MessageCircle, Key, Settings, Sparkles, Bot } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import Swal from 'sweetalert2';

declare global {
  interface Window {
    aistudio: {
      hasSelectedApiKey: () => Promise<boolean>;
      openSelectKey: () => Promise<void>;
    };
  }
}

type Tab = 'dashboard' | 'users' | 'transactions' | 'promos' | 'withdrawals' | 'settings';

export default function AdminPanel({ onLogout }: { onLogout?: () => void }) {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [stats, setStats] = useState<any>(null);
  const [pending, setPending] = useState<any[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [allTransactions, setAllTransactions] = useState<any[]>([]);
  const [allPromos, setAllPromos] = useState<any[]>([]);
  const [allWithdrawals, setAllWithdrawals] = useState<any[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [clickedWA, setClickedWA] = useState<Set<string>>(new Set());
  const [aiSettings, setAiSettings] = useState<any>({});

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const handleUpdateApiKey = async () => {
    try {
      if (window.aistudio) {
        await window.aistudio.openSelectKey();
        Swal.fire({
          title: 'API Key Diperbarui',
          text: 'Kunci API Gemini telah berhasil diperbarui.',
          icon: 'success',
          timer: 2000,
          showConfirmButton: false
        });
      } else {
        Swal.fire('Info', 'Fitur ganti API Key hanya tersedia di lingkungan AI Studio.', 'info');
      }
    } catch (error) {
      console.error("Failed to open key selector:", error);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'dashboard') {
        const [statsRes, pendingRes, chartRes] = await Promise.all([
          fetch('/api/admin/stats'),
          fetch('/api/admin/pending-transactions'),
          fetch('/api/admin/revenue-chart')
        ]);
        setStats(await statsRes.json());
        setPending(await pendingRes.json());
        setChartData(await chartRes.json());
      } else if (activeTab === 'users') {
        const res = await fetch('/api/admin/users');
        setAllUsers(await res.json());
      } else if (activeTab === 'transactions') {
        const res = await fetch('/api/admin/all-transactions');
        setAllTransactions(await res.json());
      } else if (activeTab === 'promos') {
        const res = await fetch('/api/admin/promotions');
        setAllPromos(await res.json());
      } else if (activeTab === 'withdrawals') {
        const res = await fetch('/api/admin/withdrawals');
        setAllWithdrawals(await res.json());
      } else if (activeTab === 'settings') {
        const res = await fetch('/api/admin/settings');
        setAiSettings(await res.json());
      }
    } catch (error) {
      console.error("Failed to fetch admin data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings: aiSettings })
      });
      if (res.ok) {
        Swal.fire('Berhasil!', 'Pengaturan telah disimpan.', 'success');
      }
    } catch (error) {
      Swal.fire('Error', 'Gagal menyimpan pengaturan', 'error');
    }
  };

  const handleConfirm = async (id: number) => {
    const result = await Swal.fire({
      title: 'Konfirmasi Pembayaran?',
      text: 'Kuota akan otomatis ditambahkan ke akun siswa.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Ya, Konfirmasi',
      confirmButtonColor: '#10b981'
    });

    if (result.isConfirmed) {
      try {
        const res = await fetch('/api/admin/confirm-transaction', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ transactionId: id })
        });
        if (res.ok) {
          Swal.fire('Berhasil!', 'Pembayaran telah dikonfirmasi.', 'success');
          fetchData();
        }
      } catch (error) {
        Swal.fire('Error', 'Gagal konfirmasi', 'error');
      }
    }
  };

  const handleSendWA = (user: any, type: 'verify' | 'welcome', transaction?: any) => {
    const baseUrl = window.location.origin;
    const referralLink = `${baseUrl}/register?ref=${user.referral_code}`;
    let waNumber = user.whatsapp ? user.whatsapp.replace(/[^0-9]/g, '') : '';
    
    // Standardize to international format (62...)
    if (waNumber.startsWith('0')) {
      waNumber = '62' + waNumber.slice(1);
    } else if (waNumber.startsWith('8')) {
      waNumber = '62' + waNumber;
    }
    
    if (!waNumber) {
      Swal.fire('Gagal', 'Nomor WhatsApp tidak ditemukan', 'error');
      return;
    }

    let message = "";
    if (type === 'verify') {
      message = `Halo *${user.name}*! 👋\n\nSelamat bergabung di *EduBook AI*. Akun Anda telah terdaftar dan sedang dalam proses verifikasi oleh Admin.\n\nWebsite: ${baseUrl}\nLink Referal Anda: ${referralLink}\n\nSelamat belajar! 🚀`;
    } else {
      message = `Halo *${user.name}*! 👋\n\nSelamat bergabung di *EduBook AI*! Pembayaran Anda untuk paket *${transaction?.package_name || 'Kuota'}* telah kami konfirmasi dan akun Anda telah aktif.\n\nBerikut detail akun Anda:\n• Nama: ${user.name}\n• Paket: ${transaction?.package_name}\n• Website: ${baseUrl}\n• Link Referal: ${referralLink}\n\nSelamat belajar! 🚀`;
    }

    const encodedMessage = encodeURIComponent(message);
    // Use the format requested by user but with fixed number
    const whatsappUrl = `https://api.whatsapp.com/send/?phone=${waNumber}&text=${encodedMessage}&type=phone_number&app_absent=0`;
    
    window.open(whatsappUrl, '_blank');
    
    const key = `${user.id}-${type}-${transaction?.id || 0}`;
    setClickedWA(prev => {
      const next = new Set(prev);
      next.add(key);
      return next;
    });
  };

  const handleReject = async (id: number) => {
    const result = await Swal.fire({
      title: 'Tolak Pembayaran?',
      text: 'Transaksi akan ditandai sebagai ditolak.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Ya, Tolak',
      confirmButtonColor: '#ef4444'
    });

    if (result.isConfirmed) {
      try {
        const res = await fetch('/api/admin/reject-transaction', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ transactionId: id })
        });
        if (res.ok) {
          Swal.fire('Ditolak', 'Pembayaran telah ditolak.', 'info');
          fetchData();
        }
      } catch (error) {
        Swal.fire('Error', 'Gagal menolak', 'error');
      }
    }
  };

  const handleDeleteUser = async (id: number) => {
    const result = await Swal.fire({
      title: 'Hapus Pengguna?',
      text: 'Semua data pesan dan transaksi pengguna ini akan ikut terhapus.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Ya, Hapus',
      confirmButtonColor: '#ef4444'
    });

    if (result.isConfirmed) {
      try {
        const res = await fetch('/api/admin/delete-user', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: id })
        });
        if (res.ok) {
          Swal.fire('Terhapus!', 'Pengguna telah dihapus.', 'success');
          fetchData();
        }
      } catch (error) {
        Swal.fire('Error', 'Gagal menghapus', 'error');
      }
    }
  };

  const handleEditUser = async (user: any) => {
    const { value: formValues } = await Swal.fire({
      title: 'Edit Pengguna',
      html:
        `<div class="space-y-4 text-left">
          <div>
            <label class="block text-xs font-bold text-gray-400 uppercase mb-1">Kuota Balance</label>
            <input id="swal-quota" type="number" class="w-full px-4 py-2 border rounded-xl" value="${user.quota_balance}">
          </div>
          <div>
            <label class="block text-xs font-bold text-gray-400 uppercase mb-1">Bonus Balance (Rp)</label>
            <input id="swal-bonus" type="number" class="w-full px-4 py-2 border rounded-xl" value="${user.bonus_balance}">
          </div>
          <div>
            <label class="block text-xs font-bold text-gray-400 uppercase mb-1">Role</label>
            <select id="swal-role" class="w-full px-4 py-2 border rounded-xl">
              <option value="user" ${user.role === 'user' ? 'selected' : ''}>User</option>
              <option value="admin" ${user.role === 'admin' ? 'selected' : ''}>Admin</option>
            </select>
          </div>
          <div>
            <label class="block text-xs font-bold text-gray-400 uppercase mb-1">Status Verifikasi</label>
            <select id="swal-verified" class="w-full px-4 py-2 border rounded-xl">
              <option value="1" ${user.is_verified ? 'selected' : ''}>Verified</option>
              <option value="0" ${!user.is_verified ? 'selected' : ''}>Unverified</option>
            </select>
          </div>
          <div>
            <label class="block text-xs font-bold text-gray-400 uppercase mb-1">WhatsApp</label>
            <input id="swal-whatsapp" type="text" class="w-full px-4 py-2 border rounded-xl" value="${user.whatsapp || ''}">
          </div>
        </div>`,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: 'Simpan Perubahan',
      confirmButtonColor: '#10b981',
      preConfirm: () => {
        return {
          quota_balance: (document.getElementById('swal-quota') as HTMLInputElement).value,
          bonus_balance: (document.getElementById('swal-bonus') as HTMLInputElement).value,
          role: (document.getElementById('swal-role') as HTMLSelectElement).value,
          is_verified: (document.getElementById('swal-verified') as HTMLSelectElement).value,
          whatsapp: (document.getElementById('swal-whatsapp') as HTMLInputElement).value
        }
      }
    });

    if (formValues) {
      try {
        const res = await fetch('/api/admin/update-user', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.id, ...formValues })
        });
        if (res.ok) {
          Swal.fire('Berhasil!', 'Data pengguna telah diperbarui.', 'success');
          fetchData();
        }
      } catch (error) {
        Swal.fire('Error', 'Gagal memperbarui', 'error');
      }
    }
  };

  const handleAddPromo = async () => {
    const { value: formValues } = await Swal.fire({
      title: 'Tambah Promo / Pengumuman',
      html:
        `<div class="space-y-4 text-left">
          <div>
            <label class="block text-xs font-bold text-gray-400 uppercase mb-1">Judul</label>
            <input id="swal-title" type="text" class="w-full px-4 py-2 border rounded-xl" placeholder="Contoh: Promo Ramadhan">
          </div>
          <div>
            <label class="block text-xs font-bold text-gray-400 uppercase mb-1">Isi Pesan</label>
            <textarea id="swal-content" class="w-full px-4 py-2 border rounded-xl h-32" placeholder="Tulis pengumuman di sini..."></textarea>
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-bold text-gray-400 uppercase mb-1">Tipe</label>
              <select id="swal-type" class="w-full px-4 py-2 border rounded-xl">
                <option value="promo">Promosi</option>
                <option value="announcement">Pengumuman</option>
              </select>
            </div>
            <div>
              <label class="block text-xs font-bold text-gray-400 uppercase mb-1">Format Gambar</label>
              <select id="swal-aspect" class="w-full px-4 py-2 border rounded-xl">
                <option value="16:9">Banner (16:9)</option>
                <option value="1:1">Square (1:1)</option>
                <option value="4:5">Portrait (4:5)</option>
              </select>
            </div>
          </div>
          <div>
            <label class="block text-xs font-bold text-gray-400 uppercase mb-1">Unggah Gambar (Opsional)</label>
            <input id="swal-image" type="file" accept="image/*" class="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-black file:bg-indigo-50 file:text-indigo-600 hover:file:bg-indigo-100">
          </div>
        </div>`,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: 'Publikasikan',
      confirmButtonColor: '#10b981',
      preConfirm: async () => {
        const title = (document.getElementById('swal-title') as HTMLInputElement).value;
        const content = (document.getElementById('swal-content') as HTMLTextAreaElement).value;
        const type = (document.getElementById('swal-type') as HTMLSelectElement).value;
        const image_aspect = (document.getElementById('swal-aspect') as HTMLSelectElement).value;
        const imageFile = (document.getElementById('swal-image') as HTMLInputElement).files?.[0];

        let imageBase64 = null;
        if (imageFile) {
          imageBase64 = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target?.result);
            reader.readAsDataURL(imageFile);
          });
        }

        return { title, content, type, image_aspect, image: imageBase64 };
      }
    });

    if (formValues) {
      if (!formValues.title || !formValues.content) {
        Swal.fire('Gagal', 'Judul dan isi tidak boleh kosong', 'error');
        return;
      }
      try {
        Swal.fire({
          title: 'Sedang Memproses...',
          allowOutsideClick: false,
          didOpen: () => Swal.showLoading()
        });

        const res = await fetch('/api/admin/promotions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formValues)
        });
        if (res.ok) {
          Swal.fire('Berhasil!', 'Promosi telah dipublikasikan.', 'success');
          fetchData();
        }
      } catch (error) {
        Swal.fire('Error', 'Gagal mempublikasikan', 'error');
      }
    }
  };

  const handleDeletePromo = async (id: number) => {
    const result = await Swal.fire({
      title: 'Hapus Promosi?',
      text: 'Promosi ini tidak akan terlihat lagi oleh user.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Ya, Hapus',
      confirmButtonColor: '#ef4444'
    });

    if (result.isConfirmed) {
      try {
        const res = await fetch(`/api/admin/promotions/${id}`, { method: 'DELETE' });
        if (res.ok) {
          Swal.fire('Terhapus!', 'Promosi telah dihapus.', 'success');
          fetchData();
        }
      } catch (error) {
        Swal.fire('Error', 'Gagal menghapus', 'error');
      }
    }
  };

  const handleConfirmWithdrawal = async (id: number) => {
    const result = await Swal.fire({
      title: 'Konfirmasi Penarikan?',
      text: 'Pastikan Anda sudah mentransfer dana ke rekening tujuan.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Ya, Sudah Transfer',
      confirmButtonColor: '#10b981'
    });

    if (result.isConfirmed) {
      try {
        const res = await fetch('/api/admin/confirm-withdrawal', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ withdrawalId: id, status: 'success' })
        });
        if (res.ok) {
          Swal.fire('Berhasil!', 'Penarikan telah dikonfirmasi.', 'success');
          fetchData();
        }
      } catch (error) {
        Swal.fire('Error', 'Gagal konfirmasi', 'error');
      }
    }
  };

  const handleRejectWithdrawal = async (id: number) => {
    const result = await Swal.fire({
      title: 'Tolak Penarikan?',
      text: 'Saldo akan dikembalikan ke akun siswa.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Ya, Tolak',
      confirmButtonColor: '#ef4444'
    });

    if (result.isConfirmed) {
      try {
        const res = await fetch('/api/admin/confirm-withdrawal', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ withdrawalId: id, status: 'rejected' })
        });
        if (res.ok) {
          Swal.fire('Ditolak', 'Penarikan telah ditolak.', 'info');
          fetchData();
        }
      } catch (error) {
        Swal.fire('Error', 'Gagal menolak', 'error');
      }
    }
  };

  const showProof = (img: string) => {
    Swal.fire({
      imageUrl: img,
      imageAlt: 'Bukti Pembayaran',
      width: 600,
      padding: '1em',
      showConfirmButton: false
    });
  };

  const filteredUsers = allUsers.filter(u => 
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredTransactions = allTransactions.filter(t => 
    t.user_name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    t.package_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <h1 className="text-3xl font-black text-gray-900 flex items-center gap-3">
            <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-200">
              <ShieldCheck className="text-white w-7 h-7" />
            </div>
            Admin Dashboard
          </h1>
          {onLogout && (
            <button 
              onClick={onLogout}
              className="md:hidden p-3 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-all"
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
            </button>
          )}
          <button 
            onClick={handleUpdateApiKey}
            className="p-3 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-100 transition-all flex items-center gap-2"
            title="Ganti API Key Gemini"
          >
            <Key className="w-5 h-5" />
            <span className="hidden md:inline text-sm font-bold">API Key</span>
          </button>
        </div>

        <div className="flex bg-gray-100 p-1 rounded-2xl overflow-x-auto">
          {(['dashboard', 'users', 'transactions', 'promos', 'withdrawals', 'settings'] as Tab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all capitalize whitespace-nowrap ${
                activeTab === tab 
                  ? 'bg-white text-indigo-600 shadow-sm' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab === 'promos' ? 'Promo & Info' : tab === 'withdrawals' ? 'Penarikan' : tab}
            </button>
          ))}
        </div>
      </div>

      {loading && (
        <div className="h-96 flex flex-col items-center justify-center text-gray-400 gap-4">
          <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
          <p className="font-bold animate-pulse">Memuat data panel...</p>
        </div>
      )}

      {!loading && activeTab === 'dashboard' && !stats && (
        <div className="h-96 flex flex-col items-center justify-center text-gray-400 gap-4">
          <p className="font-bold">Gagal memuat statistik dashboard.</p>
          <button onClick={fetchData} className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold">Coba Lagi</button>
        </div>
      )}

      {!loading && activeTab === 'dashboard' && stats && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm flex items-center gap-6">
              <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center">
                <Users className="w-8 h-8 text-blue-600" />
              </div>
              <div>
                <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Total Siswa</p>
                <p className="text-3xl font-black text-gray-900">{stats?.totalStudents ?? 0}</p>
              </div>
            </div>
            <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm flex items-center gap-6">
              <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center">
                <Banknote className="w-8 h-8 text-emerald-600" />
              </div>
              <div>
                <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Total Pendapatan</p>
                <p className="text-3xl font-black text-gray-900">Rp {(stats?.totalRevenue ?? 0).toLocaleString()}</p>
              </div>
            </div>
            <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm flex items-center gap-6">
              <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center">
                <Clock className="w-8 h-8 text-amber-600" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Pending</p>
                <div className="flex items-baseline gap-3">
                  <p className="text-3xl font-black text-gray-900">{(stats?.pendingPayments ?? 0) + (stats?.pendingUsers ?? 0) + (stats?.pendingWithdrawals ?? 0)}</p>
                  <div className="text-[10px] font-bold text-gray-400 leading-tight">
                    <p>{stats?.pendingPayments ?? 0} Bayar</p>
                    <p>{stats?.pendingUsers ?? 0} User</p>
                    <p>{stats?.pendingWithdrawals ?? 0} Tarik</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl font-black text-gray-900 flex items-center gap-2">
                  <TrendingUp className="text-emerald-500 w-5 h-5" />
                  Tren Pendapatan
                </h3>
                <span className="text-xs font-bold text-gray-400 bg-gray-50 px-3 py-1 rounded-full">30 Hari Terakhir</span>
              </div>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#9ca3af'}} />
                    <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#9ca3af'}} />
                    <Tooltip 
                      contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                      labelStyle={{ fontWeight: 'bold', marginBottom: '4px' }}
                    />
                    <Area type="monotone" dataKey="amount" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorAmount)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden flex flex-col">
              <div className="p-8 border-b border-gray-50">
                <h3 className="text-xl font-black text-gray-900">Konfirmasi Cepat</h3>
                <p className="text-sm text-gray-500 mt-1">Verifikasi pembayaran terbaru</p>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {pending.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-gray-400 italic text-sm p-8 text-center">
                    <Check className="w-12 h-12 mb-2 opacity-20" />
                    Semua pembayaran telah diverifikasi.
                  </div>
                ) : (
                  pending.map((t) => (
                    <div key={t.id} className="p-4 bg-gray-50 rounded-2xl border border-gray-100 space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-bold text-gray-900 text-sm">{t.user_name}</p>
                          <p className="text-[10px] text-gray-400 uppercase font-black tracking-wider">{t.package_name}</p>
                        </div>
                        <p className="font-black text-emerald-600 text-sm">Rp {(t?.price ?? 0).toLocaleString()}</p>
                      </div>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => showProof(t.proof_image)}
                          className="flex-1 py-2 bg-white text-gray-600 rounded-xl text-xs font-bold border border-gray-200 hover:bg-gray-100 transition-all"
                        >
                          Bukti
                        </button>
                        <button 
                          onClick={() => handleConfirm(t.id)}
                          className="flex-1 py-2 bg-emerald-500 text-white rounded-xl text-xs font-bold hover:bg-emerald-600 transition-all"
                        >
                          Terima
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {!loading && activeTab === 'users' && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="relative max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input 
              type="text" 
              placeholder="Cari nama atau email siswa..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white border border-gray-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 transition-all shadow-sm"
            />
          </div>

          <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-50/50 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                    <th className="px-8 py-5">Siswa</th>
                    <th className="px-8 py-5">Status & Role</th>
                    <th className="px-8 py-5">Saldo & Kuota</th>
                    <th className="px-8 py-5">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 font-bold">
                            {u.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-bold text-gray-900">{u.name}</p>
                            <p className="text-xs text-gray-400">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex flex-col gap-1">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider w-fit ${
                            u.is_verified ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                          }`}>
                            {u.is_verified ? 'Verified' : 'Pending'}
                          </span>
                          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{u.role}</span>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <div className="space-y-1">
                          <p className="text-sm font-bold text-gray-700">{u.quota_balance} Kuota</p>
                          <p className="text-xs text-emerald-600 font-bold">Rp {(u?.bonus_balance ?? 0).toLocaleString()} Bonus</p>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => handleSendWA(u, 'verify')}
                            className={`p-2.5 rounded-xl transition-all flex items-center gap-2 text-xs font-bold ${
                              clickedWA.has(`${u.id}-verify-0`)
                                ? 'bg-emerald-500 text-white'
                                : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                            }`}
                            title="Kirim Kode via WA"
                          >
                            <MessageCircle className="w-4 h-4" />
                            {u.is_verified ? 'Welcome' : 'Kirim OTP'}
                          </button>
                          <button 
                            onClick={() => handleEditUser(u)}
                            className="p-2.5 bg-gray-100 text-gray-600 rounded-xl hover:bg-indigo-50 hover:text-indigo-600 transition-all"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleDeleteUser(u.id)}
                            className="p-2.5 bg-gray-100 text-gray-600 rounded-xl hover:bg-red-50 hover:text-red-600 transition-all"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {!loading && activeTab === 'transactions' && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="relative max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input 
              type="text" 
              placeholder="Cari transaksi..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white border border-gray-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 transition-all shadow-sm"
            />
          </div>

          <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-50/50 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                    <th className="px-8 py-5">Waktu</th>
                    <th className="px-8 py-5">Siswa</th>
                    <th className="px-8 py-5">Paket & Harga</th>
                    <th className="px-8 py-5">Status</th>
                    <th className="px-8 py-5">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredTransactions.map((t) => (
                    <tr key={t.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-8 py-5 text-xs text-gray-400 font-medium">
                        {new Date(t.created_at).toLocaleString()}
                      </td>
                      <td className="px-8 py-5">
                        <p className="font-bold text-gray-900">{t.user_name}</p>
                        <p className="text-xs text-gray-400">{t.user_email}</p>
                      </td>
                      <td className="px-8 py-5">
                        <p className="text-sm font-bold text-gray-700">{t.package_name}</p>
                        <p className="text-xs text-emerald-600 font-black">Rp {(t?.price ?? 0).toLocaleString()}</p>
                      </td>
                      <td className="px-8 py-5">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                          t.status === 'success' ? 'bg-emerald-50 text-emerald-600' : 
                          t.status === 'pending' ? 'bg-amber-50 text-amber-600' : 
                          'bg-red-50 text-red-600'
                        }`}>
                          {t.status}
                        </span>
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => {
                              const user = { 
                                id: t.user_id, 
                                name: t.user_name, 
                                whatsapp: t.whatsapp || '', 
                                referral_code: t.referral_code || '',
                                verification_code: t.verification_code || ''
                              };
                              handleSendWA(user, 'welcome', t);
                            }}
                            className={`p-2.5 rounded-xl transition-all ${
                              clickedWA.has(`${t.user_id}-welcome-${t.id}`)
                                ? 'bg-emerald-500 text-white'
                                : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                            }`}
                            title="Kirim Bukti Konfirmasi via WA"
                          >
                            <MessageCircle className="w-4 h-4" />
                          </button>
                          {t.proof_image && (
                            <button 
                              onClick={() => showProof(t.proof_image)}
                              className="p-2.5 bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 transition-all"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          )}
                          {t.status === 'pending' && (
                            <>
                              <button 
                                onClick={() => handleConfirm(t.id)}
                                className="p-2.5 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-all"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={() => handleReject(t.id)}
                                className="p-2.5 bg-red-100 text-red-600 rounded-xl hover:bg-red-200 transition-all"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {!loading && activeTab === 'settings' && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm p-8">
            <h3 className="text-xl font-black text-gray-900 flex items-center gap-2 mb-8">
              <Settings className="text-indigo-600 w-6 h-6" />
              Pengaturan AI (Gemini / Groq)
            </h3>
            
            <form onSubmit={handleSaveSettings} className="space-y-8 max-w-2xl">
              <div className="space-y-4">
                <label className="block text-sm font-bold text-gray-700">Pilih Provider AI</label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setAiSettings({ ...aiSettings, ai_provider: 'gemini' })}
                    className={`p-6 rounded-3xl border-2 transition-all text-left flex flex-col gap-2 ${
                      aiSettings.ai_provider === 'gemini' 
                        ? 'border-indigo-600 bg-indigo-50/50' 
                        : 'border-gray-100 hover:border-gray-200'
                    }`}
                  >
                    <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-100">
                      <Sparkles className="text-white w-6 h-6" />
                    </div>
                    <span className="font-black text-gray-900">Google Gemini</span>
                    <span className="text-xs text-gray-500">Model: Gemini 3 Flash</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setAiSettings({ ...aiSettings, ai_provider: 'groq' })}
                    className={`p-6 rounded-3xl border-2 transition-all text-left flex flex-col gap-2 ${
                      aiSettings.ai_provider === 'groq' 
                        ? 'border-emerald-600 bg-emerald-50/50' 
                        : 'border-gray-100 hover:border-gray-200'
                    }`}
                  >
                    <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-100">
                      <Bot className="text-white w-6 h-6" />
                    </div>
                    <span className="font-black text-gray-900">Groq Cloud</span>
                    <span className="text-xs text-gray-500">Model: Llama 3.3 70B</span>
                  </button>
                </div>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-widest">Groq API Key</label>
                  <div className="relative">
                    <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="password"
                      value={aiSettings.groq_api_key || ''}
                      onChange={(e) => setAiSettings({ ...aiSettings, groq_api_key: e.target.value })}
                      className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 transition-all text-sm"
                      placeholder="gsk_..."
                    />
                  </div>
                  <p className="text-[10px] text-gray-400 italic">
                    * Jika dikosongkan, sistem akan menggunakan kunci dari environment variable.
                  </p>
                </div>
              </div>

              <button
                type="submit"
                className="px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black shadow-xl shadow-indigo-100 hover:bg-indigo-700 hover:-translate-y-0.5 transition-all"
              >
                Simpan Pengaturan
              </button>
            </form>
          </div>
        </div>
      )}

      {!loading && activeTab === 'withdrawals' && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-50/50 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                    <th className="px-8 py-5">Waktu</th>
                    <th className="px-8 py-5">Siswa</th>
                    <th className="px-8 py-5">Bank & Rekening</th>
                    <th className="px-8 py-5">Jumlah</th>
                    <th className="px-8 py-5">Status</th>
                    <th className="px-8 py-5">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {allWithdrawals.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-8 py-12 text-center text-gray-400 italic">
                        Belum ada pengajuan penarikan.
                      </td>
                    </tr>
                  ) : (
                    allWithdrawals.map((w) => (
                      <tr key={w.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-8 py-5 text-xs text-gray-400 font-medium">
                          {new Date(w.created_at).toLocaleString()}
                        </td>
                        <td className="px-8 py-5">
                          <p className="font-bold text-gray-900">{w.user_name}</p>
                          <p className="text-xs text-gray-400">{w.user_email}</p>
                        </td>
                        <td className="px-8 py-5">
                          <p className="text-sm font-bold text-gray-700">{w.bank_name}</p>
                          <p className="text-xs text-gray-400">{w.account_number}</p>
                          <p className="text-[10px] text-gray-400 font-bold uppercase">{w.account_name}</p>
                        </td>
                        <td className="px-8 py-5">
                          <p className="text-sm font-black text-emerald-600">Rp {w.amount.toLocaleString()}</p>
                        </td>
                        <td className="px-8 py-5">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                            w.status === 'success' ? 'bg-emerald-50 text-emerald-600' : 
                            w.status === 'pending' ? 'bg-amber-50 text-amber-600' : 
                            'bg-red-50 text-red-600'
                          }`}>
                            {w.status}
                          </span>
                        </td>
                        <td className="px-8 py-5">
                          {w.status === 'pending' && (
                            <div className="flex items-center gap-2">
                              <button 
                                onClick={() => handleConfirmWithdrawal(w.id)}
                                className="p-2.5 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-all"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={() => handleRejectWithdrawal(w.id)}
                                className="p-2.5 bg-red-100 text-red-600 rounded-xl hover:bg-red-200 transition-all"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {!loading && activeTab === 'promos' && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-black text-gray-900 flex items-center gap-2">
              <Megaphone className="text-indigo-600 w-6 h-6" />
              Manajemen Promo & Pengumuman
            </h3>
            <button 
              onClick={handleAddPromo}
              className="px-6 py-3 bg-indigo-600 text-white rounded-2xl font-bold flex items-center gap-2 shadow-lg shadow-indigo-100 hover:-translate-y-0.5 transition-all"
            >
              <Plus className="w-5 h-5" />
              Tambah Baru
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {allPromos.length === 0 ? (
              <div className="col-span-full h-64 flex flex-col items-center justify-center text-gray-400 bg-white rounded-[2.5rem] border border-gray-100 border-dashed">
                <Megaphone className="w-12 h-12 mb-2 opacity-20" />
                Belum ada promo atau pengumuman.
              </div>
            ) : (
              allPromos.map((p) => (
                <div key={p.id} className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm flex flex-col overflow-hidden">
                  {p.image && (
                    <div className={`w-full bg-gray-100 relative overflow-hidden ${
                      p.image_aspect === '16:9' ? 'aspect-video' : 
                      p.image_aspect === '1:1' ? 'aspect-square' : 'aspect-[4/5]'
                    }`}>
                      <img 
                        src={p.image} 
                        alt={p.title} 
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  )}
                  <div className="p-8 flex flex-col justify-between flex-1">
                    <div className="space-y-4">
                      <div className="flex justify-between items-start">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                          p.type === 'promo' ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'
                        }`}>
                          {p.type}
                        </span>
                        <button 
                          onClick={() => handleDeletePromo(p.id)}
                          className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                      <div>
                        <h4 className="text-lg font-black text-gray-900">{p.title}</h4>
                        <p className="text-sm text-gray-500 mt-2 line-clamp-3">{p.content}</p>
                      </div>
                    </div>
                    <div className="mt-6 pt-6 border-t border-gray-50 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                      Dipublikasikan: {new Date(p.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}


