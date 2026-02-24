import React from 'react';
import { 
  Users, 
  Gift, 
  TrendingUp, 
  CheckCircle2, 
  ArrowRight, 
  Zap,
  ShieldCheck,
  CreditCard
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function ReferralInfo() {
  const benefits = [
    {
      icon: <TrendingUp className="w-6 h-6 text-emerald-500" />,
      title: "Komisi 10% Selamanya",
      description: "Dapatkan komisi 10% dari setiap transaksi top up yang dilakukan oleh teman yang Anda undang, berlaku selamanya."
    },
    {
      icon: <Gift className="w-6 h-6 text-emerald-500" />,
      title: "Bonus Tanpa Batas",
      description: "Tidak ada batasan jumlah teman yang bisa Anda undang. Semakin banyak teman, semakin besar bonus Anda."
    },
    {
      icon: <Zap className="w-6 h-6 text-emerald-500" />,
      title: "Pencairan Cepat",
      description: "Bonus dapat dicairkan langsung ke saldo akun Anda atau ditarik ke rekening bank (minimal saldo tertentu)."
    }
  ];

  const steps = [
    {
      title: "Ambil Link/Kode",
      description: "Buka halaman 'Referal' dan salin link referal unik atau kode referal Anda."
    },
    {
      title: "Bagikan",
      description: "Bagikan link atau kode tersebut kepada teman, keluarga, atau melalui media sosial Anda."
    },
    {
      title: "Pendaftaran Teman",
      description: "Pastikan teman Anda mendaftar menggunakan link tersebut atau memasukkan kode Anda saat registrasi."
    },
    {
      title: "Dapatkan Komisi",
      description: "Setelah teman Anda melakukan Top Up dan dikonfirmasi, komisi 10% otomatis masuk ke saldo Anda."
    },
    {
      title: "Cairkan Bonus",
      description: "Gunakan saldo bonus untuk membeli paket kuota atau tarik ke rekening bank Anda."
    }
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-12 pb-20">
      {/* Hero Section */}
      <div className="bg-emerald-600 rounded-[2.5rem] p-12 text-white relative overflow-hidden shadow-xl shadow-emerald-100">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 blur-[80px] rounded-full -translate-y-1/2 translate-x-1/2"></div>
        <div className="relative z-10 space-y-6">
          <div className="inline-flex items-center gap-2 bg-white/20 px-4 py-2 rounded-full text-sm font-bold backdrop-blur-md">
            <Gift className="w-4 h-4" />
            Program Kemitraan EduBook AI
          </div>
          <h1 className="text-4xl md:text-5xl font-black leading-tight">
            Undang Teman, <br />Belajar Gratis Bersama!
          </h1>
          <p className="text-emerald-50 text-lg max-w-xl leading-relaxed">
            Bantu teman Anda mendapatkan pengalaman belajar terbaik dengan Kak AI dan dapatkan komisi 10% dari setiap transaksi mereka.
          </p>
          <div className="pt-4">
            <Link to="/referral" className="bg-white text-emerald-600 px-8 py-4 rounded-2xl font-bold hover:bg-emerald-50 transition-all inline-flex items-center gap-2">
              Buka Dasbor Referal
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
        <Users className="absolute -bottom-10 -right-10 w-64 h-64 text-white/10 rotate-12" />
      </div>

      {/* Benefits Grid */}
      <div className="space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-black text-gray-900">Keuntungan Bergabung</h2>
          <p className="text-gray-500">Mengapa Anda harus membagikan EduBook AI?</p>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {benefits.map((b, i) => (
            <div key={i} className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center mb-6">
                {b.icon}
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-3">{b.title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{b.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* How it Works */}
      <div className="bg-gray-900 rounded-[2.5rem] p-12 text-white">
        <div className="text-center mb-12 space-y-2">
          <h2 className="text-3xl font-black">Cara Kerja Referal</h2>
          <p className="text-gray-400">Ikuti langkah mudah berikut ini</p>
        </div>
        <div className="grid md:grid-cols-3 lg:grid-cols-5 gap-8">
          {steps.map((s, i) => (
            <div key={i} className="space-y-4 relative">
              <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center font-bold text-lg">
                {i + 1}
              </div>
              <h3 className="font-bold text-lg">{s.title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">{s.description}</p>
              {i < steps.length - 1 && (
                <div className="hidden lg:block absolute top-5 left-10 w-full h-px border-t border-dashed border-gray-700 -z-0"></div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* FAQ / Info Section */}
      <div className="grid md:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm space-y-6">
          <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <ShieldCheck className="text-emerald-500" />
            Syarat & Ketentuan
          </h3>
          <ul className="space-y-4">
            {[
              "Komisi dihitung dari nilai bersih transaksi top up.",
              "Bonus akan masuk ke saldo setelah pembayaran teman dikonfirmasi.",
              "Penyalahgunaan sistem referal dapat mengakibatkan pemblokiran akun.",
              "Keputusan admin bersifat mutlak dan tidak dapat diganggu gugat."
            ].map((item, i) => (
              <li key={i} className="flex items-start gap-3 text-sm text-gray-600">
                <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-emerald-50 p-8 rounded-3xl border border-emerald-100 space-y-6">
          <h3 className="text-xl font-bold text-emerald-900 flex items-center gap-2">
            <CreditCard className="text-emerald-600" />
            Metode Pencairan
          </h3>
          <p className="text-emerald-800 text-sm leading-relaxed">
            Saldo bonus Anda dapat digunakan untuk:
          </p>
          <div className="space-y-3">
            <div className="bg-white p-4 rounded-2xl border border-emerald-100 flex items-center justify-between">
              <span className="text-sm font-bold text-gray-700">Beli Paket Kuota</span>
              <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded-lg font-bold">Instan</span>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-emerald-100 flex items-center justify-between">
              <span className="text-sm font-bold text-gray-700">Tarik ke Rekening</span>
              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-lg font-bold">1-3 Hari</span>
            </div>
          </div>
          <p className="text-xs text-emerald-600 italic">
            *Minimal penarikan ke rekening bank adalah Rp 100.000.
          </p>
        </div>
      </div>
    </div>
  );
}
