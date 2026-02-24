import React from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { 
  GraduationCap, 
  CheckCircle2, 
  ArrowRight, 
  Users, 
  BookOpen, 
  Zap, 
  ShieldCheck,
  Star,
  MessageSquare,
  TrendingUp
} from 'lucide-react';
import { motion } from 'motion/react';

export default function Landing() {
  const [searchParams] = useSearchParams();
  const ref = searchParams.get('ref');
  const registerPath = ref ? `/register?ref=${ref}` : '/register';

  const features = [
    {
      icon: <GraduationCap className="w-6 h-6" />,
      title: "Sesuai Kurikulum",
      description: "Materi lengkap untuk SD, SMP, hingga SMA sesuai kurikulum nasional terbaru."
    },
    {
      icon: <Zap className="w-6 h-6" />,
      title: "Respon Kilat",
      description: "Dapatkan jawaban dan penjelasan mendalam dalam hitungan detik."
    },
    {
      icon: <TrendingUp className="w-6 h-6" />,
      title: "Program Referal",
      description: "Dapatkan komisi 10% selamanya dari setiap transaksi teman yang Anda undang."
    },
    {
      icon: <ShieldCheck className="w-6 h-6" />,
      title: "Terpercaya",
      description: "Telah digunakan oleh ribuan siswa di seluruh Indonesia untuk meningkatkan prestasi."
    }
  ];

  const pricing = [
    {
      name: "Basic",
      price: "50.000",
      quota: "1.000",
      features: ["Riwayat Pertanyaan", "Filter Mata Pelajaran", "Akses Semua Tingkat", "Program Referal"],
      popular: false
    },
    {
      name: "Standard",
      price: "100.000",
      quota: "2.000",
      features: ["Semua Fitur Basic", "Progress Tracking", "Simpan Jawaban Favorit", "Prioritas Respon"],
      popular: true
    },
    {
      name: "Premium",
      price: "150.000",
      quota: "3.000",
      features: ["Semua Fitur Standard", "Materi Tambahan Eksklusif", "Laporan Belajar Bulanan", "Dukungan VIP"],
      popular: false
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-200">
                <GraduationCap className="text-white w-6 h-6" />
              </div>
              <span className="text-xl font-bold text-gray-900">EduBook AI</span>
            </div>
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-gray-600 hover:text-emerald-600 font-medium transition-colors">Fitur</a>
              <a href="#pricing" className="text-gray-600 hover:text-emerald-600 font-medium transition-colors">Paket</a>
              <Link to="/login" className="text-gray-900 font-semibold hover:text-emerald-600 transition-colors">Masuk</Link>
              <Link to={registerPath} className="bg-emerald-500 text-white px-6 py-3 rounded-xl font-bold hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-200">
                Daftar Gratis
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-40 pb-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="space-y-8"
            >
              <div className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-600 px-4 py-2 rounded-full text-sm font-bold border border-emerald-100">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                10,000+ Siswa Telah Bergabung
              </div>
              <h1 className="text-5xl lg:text-7xl font-black text-gray-900 leading-[1.1] tracking-tight">
                Cerdas Belajar Bersama <span className="text-emerald-500">Kak AI</span>
              </h1>
              <p className="text-xl text-gray-500 leading-relaxed max-w-lg">
                Mentor pendidikan AI pribadi untuk siswa SD hingga SMA. Penjelasan terstruktur, mudah dipahami, dan sesuai kurikulum nasional.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link to={registerPath} className="bg-emerald-500 text-white px-8 py-4 rounded-2xl font-bold text-lg hover:bg-emerald-600 transition-all shadow-xl shadow-emerald-200 flex items-center justify-center gap-2 group">
                  Mulai Belajar Sekarang
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link to="/login" className="bg-white text-gray-700 border-2 border-gray-100 px-8 py-4 rounded-2xl font-bold text-lg hover:border-emerald-500 hover:text-emerald-500 transition-all flex items-center justify-center gap-2">
                  Lihat Demo
                </Link>
              </div>
              <div className="flex items-center gap-6 pt-8 border-t border-gray-100">
                <div className="flex -space-x-3">
                  {[1,2,3,4].map(i => (
                    <img key={i} src={`https://picsum.photos/seed/${i+10}/100/100`} className="w-10 h-10 rounded-full border-2 border-white object-cover" alt="User" />
                  ))}
                </div>
                <p className="text-sm text-gray-500 font-medium">
                  <span className="text-gray-900 font-bold">4.9/5</span> dari 2,000+ ulasan siswa
                </p>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="relative"
            >
              <div className="absolute -inset-4 bg-emerald-500/10 blur-3xl rounded-full"></div>
              <div className="relative bg-white rounded-[2rem] shadow-2xl border border-gray-100 overflow-hidden">
                <div className="bg-emerald-500 p-6 flex items-center gap-4">
                  <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md">
                    <GraduationCap className="text-white w-7 h-7" />
                  </div>
                  <div>
                    <h3 className="text-white font-bold">Kak AI</h3>
                    <p className="text-emerald-100 text-xs">Sedang aktif membimbing</p>
                  </div>
                </div>
                <div className="p-6 space-y-4 h-[400px] bg-gray-50/50">
                  <div className="flex gap-3">
                    <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center text-white text-xs flex-shrink-0">AI</div>
                    <div className="bg-white p-4 rounded-2xl rounded-tl-none shadow-sm text-sm text-gray-700 max-w-[80%] border border-gray-100">
                      Halo! Saya Kak AI. Ada materi pelajaran yang ingin Anda diskusikan hari ini?
                    </div>
                  </div>
                  <div className="flex gap-3 justify-end">
                    <div className="bg-emerald-500 text-white p-4 rounded-2xl rounded-tr-none shadow-md text-sm max-w-[80%]">
                      Kak, tolong jelaskan konsep fotosintesis dengan cara yang mudah.
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center text-white text-xs flex-shrink-0">AI</div>
                    <div className="bg-white p-4 rounded-2xl rounded-tl-none shadow-sm text-sm text-gray-700 max-w-[80%] border border-gray-100">
                      Tentu! Bayangkan tanaman seperti sebuah dapur kecil yang memasak makanannya sendiri menggunakan:
                      <ul className="mt-2 space-y-1 list-disc list-inside">
                        <li>Cahaya Matahari</li>
                        <li>Air</li>
                        <li>Karbondioksida</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
            <h2 className="text-sm font-bold text-emerald-600 uppercase tracking-widest">Fitur Unggulan</h2>
            <p className="text-4xl font-black text-gray-900">Mengapa Memilih EduBook AI?</p>
            <p className="text-gray-500">Kami menggabungkan teknologi AI tercanggih dengan pedagogi pendidikan untuk hasil belajar terbaik.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((f, i) => (
              <div key={i} className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                <div className="w-14 h-14 bg-emerald-50 text-emerald-500 rounded-2xl flex items-center justify-center mb-6">
                  {f.icon}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{f.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
            <h2 className="text-sm font-bold text-emerald-600 uppercase tracking-widest">Paket Belajar</h2>
            <p className="text-4xl font-black text-gray-900">Investasi Terbaik Untuk Masa Depan</p>
            <p className="text-gray-500">Pilih paket yang paling sesuai dengan kebutuhan belajar Anda.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {pricing.map((p, i) => (
              <div key={i} className={`relative p-8 rounded-[2.5rem] border ${p.popular ? 'border-emerald-500 shadow-2xl shadow-emerald-100 scale-105 z-10' : 'border-gray-100 shadow-sm'} bg-white flex flex-col`}>
                {p.popular && (
                  <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-emerald-500 text-white px-6 py-2 rounded-full text-sm font-bold shadow-lg">
                    Paling Populer
                  </div>
                )}
                <div className="mb-8">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{p.name}</h3>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-black text-gray-900">Rp{p.price}</span>
                    <span className="text-gray-500 font-medium">/bulan</span>
                  </div>
                  <p className="mt-4 text-emerald-600 font-bold text-sm bg-emerald-50 inline-block px-3 py-1 rounded-lg">
                    {p.quota} Pertanyaan
                  </p>
                </div>
                <ul className="space-y-4 mb-10 flex-1">
                  {p.features.map((f, j) => (
                    <li key={j} className="flex items-center gap-3 text-gray-600 text-sm">
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link 
                  to={registerPath} 
                  className={`w-full py-4 rounded-2xl font-bold text-center transition-all ${
                    p.popular 
                      ? 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-lg shadow-emerald-200' 
                      : 'bg-gray-50 text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  Pilih Paket
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-4">
        <div className="max-w-5xl mx-auto bg-gray-900 rounded-[3rem] p-12 md:p-20 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-64 h-64 bg-emerald-500/20 blur-[100px] rounded-full -translate-x-1/2 -translate-y-1/2"></div>
          <div className="absolute bottom-0 right-0 w-64 h-64 bg-emerald-500/10 blur-[100px] rounded-full translate-x-1/2 translate-y-1/2"></div>
          
          <div className="relative space-y-8">
            <h2 className="text-4xl md:text-5xl font-black text-white leading-tight">
              Siap Menjadi Juara Kelas Bersama Kak AI?
            </h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              Daftar sekarang dan dapatkan bonus 20 pertanyaan gratis untuk mencoba pengalaman belajar masa depan.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to={registerPath} className="bg-emerald-500 text-white px-10 py-4 rounded-2xl font-bold text-lg hover:bg-emerald-600 transition-all shadow-xl shadow-emerald-500/20">
                Daftar Sekarang - Gratis
              </Link>
              <Link to="/login" className="bg-white/10 text-white border border-white/20 px-10 py-4 rounded-2xl font-bold text-lg hover:bg-white/20 transition-all backdrop-blur-sm">
                Hubungi Kami
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 text-center space-y-6">
          <div className="flex items-center justify-center gap-2">
            <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
              <GraduationCap className="text-white w-5 h-5" />
            </div>
            <span className="text-lg font-bold text-gray-900">EduBook AI</span>
          </div>
          <p className="text-gray-500 text-sm">
            &copy; 2026 EduBook AI. Semua hak cipta dilindungi.
          </p>
        </div>
      </footer>
    </div>
  );
}
