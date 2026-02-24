import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Users, Copy, Check, Award, TrendingUp, Wallet, History, ArrowUpRight, Loader2 } from 'lucide-react';
import Swal from 'sweetalert2';

export default function Referral({ user, onUpdateUser }: { user: any, onUpdateUser?: () => void }) {
  const [referrals, setReferrals] = useState<any[]>([]);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchReferrals();
    fetchWithdrawals();
  }, []);

  const fetchReferrals = async () => {
    const res = await fetch(`/api/referrals/${user.referral_code}`);
    const data = await res.json();
    setReferrals(data);
  };

  const fetchWithdrawals = async () => {
    const res = await fetch(`/api/withdrawals/${user.id}`);
    const data = await res.json();
    setWithdrawals(data);
  };

  const copyLink = () => {
    const link = `${window.location.origin}/register?ref=${user.referral_code}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    Swal.fire({
      title: 'Tautan Disalin!',
      text: 'Bagikan tautan ini kepada teman Anda untuk mendapatkan bonus.',
      icon: 'success',
      timer: 1500,
      showConfirmButton: false,
      toast: true,
      position: 'top-end'
    });
  };

  const handleWithdraw = async () => {
    if (user.bonus_balance < 50000) {
      Swal.fire({
        title: 'Saldo Tidak Cukup',
        text: 'Minimal penarikan adalah Rp 50.000',
        icon: 'warning',
        confirmButtonColor: '#10b981'
      });
      return;
    }

    const { value: formValues } = await Swal.fire({
      title: 'Tarik Saldo Bonus',
      html:
        `<div class="space-y-4 text-left">
          <div>
            <label class="block text-xs font-bold text-gray-400 uppercase mb-1">Jumlah Penarikan (Min Rp 50.000)</label>
            <input id="swal-amount" type="number" class="w-full px-4 py-2 border rounded-xl" value="${user.bonus_balance}" min="50000" max="${user.bonus_balance}">
          </div>
          <div>
            <label class="block text-xs font-bold text-gray-400 uppercase mb-1">Nama Bank</label>
            <input id="swal-bank" type="text" class="w-full px-4 py-2 border rounded-xl" placeholder="Contoh: BCA, Mandiri, BRI">
          </div>
          <div>
            <label class="block text-xs font-bold text-gray-400 uppercase mb-1">Nomor Rekening</label>
            <input id="swal-account-number" type="text" class="w-full px-4 py-2 border rounded-xl" placeholder="Masukkan nomor rekening">
          </div>
          <div>
            <label class="block text-xs font-bold text-gray-400 uppercase mb-1">Nama Pemilik Rekening</label>
            <input id="swal-account-name" type="text" class="w-full px-4 py-2 border rounded-xl" placeholder="Sesuai buku tabungan">
          </div>
        </div>`,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: 'Ajukan Penarikan',
      confirmButtonColor: '#10b981',
      preConfirm: () => {
        const amount = parseInt((document.getElementById('swal-amount') as HTMLInputElement).value);
        const bankName = (document.getElementById('swal-bank') as HTMLInputElement).value;
        const accountNumber = (document.getElementById('swal-account-number') as HTMLInputElement).value;
        const accountName = (document.getElementById('swal-account-name') as HTMLInputElement).value;

        if (!amount || !bankName || !accountNumber || !accountName) {
          Swal.showValidationMessage('Semua data harus diisi');
          return false;
        }

        if (amount < 50000) {
          Swal.showValidationMessage('Minimal penarikan Rp 50.000');
          return false;
        }

        if (amount > user.bonus_balance) {
          Swal.showValidationMessage('Saldo tidak mencukupi');
          return false;
        }

        return { amount, bankName, accountNumber, accountName };
      }
    });

    if (formValues) {
      setLoading(true);
      try {
        const res = await fetch('/api/withdrawals', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.id, ...formValues })
        });
        
        if (res.ok) {
          Swal.fire({
            title: 'Pengajuan Berhasil',
            text: 'Permintaan penarikan Anda sedang diproses oleh admin (1-2 hari kerja).',
            icon: 'success',
            confirmButtonColor: '#10b981'
          });
          if (onUpdateUser) onUpdateUser();
          fetchWithdrawals();
        } else {
          const error = await res.json();
          Swal.fire('Gagal', error.message, 'error');
        }
      } catch (error) {
        Swal.fire('Error', 'Terjadi kesalahan sistem', 'error');
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="space-y-8">
      <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm flex flex-col md:flex-row items-center gap-8">
        <div className="w-24 h-24 bg-emerald-100 rounded-3xl flex items-center justify-center flex-shrink-0">
          <Award className="w-12 h-12 text-emerald-600" />
        </div>
        <div className="flex-1 space-y-4 text-center md:text-left">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Program Referal EduBook AI</h1>
            <p className="text-gray-500">Dapatkan komisi <span className="text-emerald-600 font-bold">10% selamanya</span> dari setiap transaksi teman yang Anda undang!</p>
            <Link to="/referral-info" className="text-emerald-600 text-sm font-bold hover:underline mt-2 inline-block">
              Lihat Panduan Lengkap & Keuntungan →
            </Link>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="flex-1 bg-gray-50 px-4 py-3 rounded-xl border border-gray-100 font-mono text-sm text-gray-600 w-full">
              {window.location.origin}/register?ref={user.referral_code}
            </div>
            <button 
              onClick={copyLink}
              className="bg-emerald-500 text-white px-6 py-3 rounded-xl font-bold hover:bg-emerald-600 transition-all flex items-center gap-2 w-full sm:w-auto justify-center"
            >
              {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
              {copied ? 'Tersalin' : 'Salin Tautan'}
            </button>
          </div>
        </div>
        <div className="bg-emerald-50 p-8 rounded-[2rem] border border-emerald-100 text-center min-w-[200px] space-y-4">
          <div>
            <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Bonus Anda</p>
            <p className="text-3xl font-black text-emerald-700 mt-1">Rp {user.bonus_balance.toLocaleString()}</p>
          </div>
          <button 
            onClick={handleWithdraw}
            disabled={loading}
            className="w-full bg-emerald-600 text-white py-3 rounded-xl font-bold text-sm hover:bg-emerald-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wallet className="w-4 h-4" />}
            Tarik Saldo
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-50 flex items-center justify-between">
            <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <Users className="text-emerald-500 w-5 h-5" />
              Teman yang Diundang
            </h3>
            <span className="bg-gray-100 text-gray-600 text-xs font-bold px-3 py-1 rounded-full">
              {referrals.length} Orang
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50/50 text-xs font-bold text-gray-400 uppercase tracking-wider">
                  <th className="px-6 py-4">Nama</th>
                  <th className="px-6 py-4">Tanggal Gabung</th>
                  <th className="px-6 py-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {referrals.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-6 py-12 text-center text-gray-400 italic">
                      Belum ada teman yang bergabung.
                    </td>
                  </tr>
                ) : (
                  referrals.map((ref, i) => (
                    <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <p className="font-bold text-gray-800">{ref.name}</p>
                        <p className="text-xs text-gray-400">{ref.email}</p>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">{new Date(ref.created_at).toLocaleDateString()}</td>
                      <td className="px-6 py-4">
                        <span className="bg-emerald-50 text-emerald-600 text-[10px] font-bold px-2 py-1 rounded-lg uppercase">Aktif</span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-50 flex items-center justify-between">
            <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <History className="text-indigo-500 w-5 h-5" />
              Riwayat Penarikan
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50/50 text-xs font-bold text-gray-400 uppercase tracking-wider">
                  <th className="px-6 py-4">Tanggal</th>
                  <th className="px-6 py-4">Jumlah</th>
                  <th className="px-6 py-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {withdrawals.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-6 py-12 text-center text-gray-400 italic">
                      Belum ada riwayat penarikan.
                    </td>
                  </tr>
                ) : (
                  withdrawals.map((w, i) => (
                    <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4 text-sm text-gray-500">{new Date(w.created_at).toLocaleDateString()}</td>
                      <td className="px-6 py-4 font-bold text-gray-800">Rp {w.amount.toLocaleString()}</td>
                      <td className="px-6 py-4">
                        <span className={`text-[10px] font-bold px-2 py-1 rounded-lg uppercase ${
                          w.status === 'success' ? 'bg-emerald-50 text-emerald-600' :
                          w.status === 'pending' ? 'bg-amber-50 text-amber-600' :
                          'bg-red-50 text-red-600'
                        }`}>
                          {w.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

