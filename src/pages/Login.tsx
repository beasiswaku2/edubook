import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { GraduationCap, Mail, Lock, ArrowRight } from 'lucide-react';
import Swal from 'sweetalert2';

export default function Login({ onLogin }: { onLogin: (user: any) => void }) {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();

      if (data.success) {
        onLogin(data.user);
        Swal.fire({
          title: 'Berhasil Masuk!',
          text: `Selamat datang kembali, ${data.user.name}!`,
          icon: 'success',
          timer: 2000,
          showConfirmButton: false
        });
      } else if (data.unverified) {
        Swal.fire({
          title: 'Akun Belum Diverifikasi',
          text: 'Silakan verifikasi akun Anda terlebih dahulu.',
          icon: 'warning',
          confirmButtonText: 'Verifikasi Sekarang',
          confirmButtonColor: '#10b981'
        }).then(() => {
          navigate(`/verify?email=${email}`);
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
          <h2 className="text-2xl font-bold">EduBook AI</h2>
          <p className="text-emerald-100 text-sm mt-1">Cerdas Belajar Bersama Kak AI</p>
        </div>

        <div className="p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                  placeholder="nama@email.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-emerald-200 hover:bg-emerald-600 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 group"
            >
              {loading ? 'Memproses...' : 'Masuk Sekarang'}
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-gray-500 text-sm">
              Belum memiliki akun?{' '}
              <Link to="/register" className="text-emerald-600 font-bold hover:underline">
                Daftar Sekarang
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
