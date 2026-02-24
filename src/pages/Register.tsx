import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { GraduationCap, Mail, Lock, User, Phone, Tag, ArrowRight } from 'lucide-react';
import Swal from 'sweetalert2';

export default function Register() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isReferralLocked, setIsReferralLocked] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    whatsapp: '',
    password: '',
    referralCode: ''
  });

  useEffect(() => {
    const ref = searchParams.get('ref');
    if (ref) {
      setFormData(prev => ({ ...prev, referralCode: ref.toUpperCase() }));
      setIsReferralLocked(true);
    }
  }, [searchParams]);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();

      if (data.success) {
        Swal.fire({
          title: 'Pendaftaran Berhasil!',
          text: `Kode verifikasi Anda adalah: ${data.otp}. Silakan masukkan di halaman berikutnya.`,
          icon: 'success',
          confirmButtonText: 'Verifikasi Sekarang',
          confirmButtonColor: '#10b981'
        }).then(() => {
          navigate(`/verify?email=${formData.email}`);
        });
      } else {
        Swal.fire('Gagal', data.message, 'error');
      }
    } catch (error) {
      Swal.fire('Error', 'Terjadi kesalahan server', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-emerald-50 p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl shadow-emerald-100 overflow-hidden">
        <div className="p-8 text-center bg-emerald-500 text-white">
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
            <GraduationCap className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-bold">Daftar EduBook AI</h2>
          <p className="text-emerald-100 text-sm mt-1">Mulai petualangan belajar Anda hari ini!</p>
        </div>

        <div className="p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-700">Nama Lengkap</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-emerald-500 transition-all text-sm"
                  placeholder="Budi Santoso"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-700">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-emerald-500 transition-all text-sm"
                  placeholder="budi@email.com"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-700">WhatsApp</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="tel"
                  required
                  value={formData.whatsapp}
                  onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-emerald-500 transition-all text-sm"
                  placeholder="08123456789"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-700">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-emerald-500 transition-all text-sm"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-700">
                Kode Referal {isReferralLocked ? '(Terkunci)' : '(Opsional)'}
              </label>
              <div className="relative">
                <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={formData.referralCode}
                  readOnly={isReferralLocked}
                  onChange={(e) => !isReferralLocked && setFormData({ ...formData, referralCode: e.target.value.toUpperCase() })}
                  className={`w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-emerald-500 transition-all text-sm ${isReferralLocked ? 'opacity-70 cursor-not-allowed bg-gray-100' : ''}`}
                  placeholder="ABC123"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-500 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-emerald-200 hover:bg-emerald-600 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 group mt-4"
            >
              {loading ? 'Mendaftarkan...' : 'Daftar Sekarang'}
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-500 text-xs">
              Sudah memiliki akun?{' '}
              <Link to="/login" className="text-emerald-600 font-bold hover:underline">
                Masuk di sini
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
