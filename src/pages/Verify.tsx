import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ShieldCheck, ArrowRight, RefreshCcw } from 'lucide-react';
import Swal from 'sweetalert2';

export default function Verify() {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const emailParam = params.get('email');
    if (emailParam) setEmail(emailParam);
  }, [location]);

  const handleChange = (index: number, value: string) => {
    if (value.length > 1) return;
    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    // Auto focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`code-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      const prevInput = document.getElementById(`code-${index - 1}`);
      prevInput?.focus();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const verificationCode = code.join('');
    if (verificationCode.length < 6) return;

    setLoading(true);
    try {
      const res = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code: verificationCode })
      });
      const data = await res.json();

      if (data.success) {
        Swal.fire({
          title: 'Verifikasi Berhasil!',
          text: 'Akun Anda telah aktif. Silakan masuk.',
          icon: 'success',
          confirmButtonColor: '#10b981'
        }).then(() => {
          navigate('/login');
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
            <ShieldCheck className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-bold">Verifikasi Akun</h2>
          <p className="text-emerald-100 text-sm mt-1">Masukkan 6 digit kode yang dikirimkan ke {email}</p>
        </div>

        <div className="p-8">
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="flex justify-between gap-2">
              {code.map((digit, i) => (
                <input
                  key={i}
                  id={`code-${i}`}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleChange(i, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(i, e)}
                  className="w-12 h-14 text-center text-2xl font-bold bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                />
              ))}
            </div>

            <button
              type="submit"
              disabled={loading || code.join('').length < 6}
              className="w-full bg-emerald-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-emerald-200 hover:bg-emerald-600 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 group"
            >
              {loading ? 'Memverifikasi...' : 'Verifikasi Sekarang'}
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </form>

          <div className="mt-8 text-center">
            <button className="text-emerald-600 font-bold hover:underline flex items-center justify-center gap-2 mx-auto text-sm">
              <RefreshCcw className="w-4 h-4" />
              Kirim Ulang Kode
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
