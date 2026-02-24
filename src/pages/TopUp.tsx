import React, { useState } from 'react';
import { Check, CreditCard, Upload, Banknote, ShieldCheck, Download } from 'lucide-react';
import Swal from 'sweetalert2';
import { cn } from '../lib/utils';
import { jsPDF } from 'jspdf';

const packages = [
  { id: 1, name: 'Paket Pintar 1', price: 50000, quota: 1000, days: 15, color: 'emerald' },
  { id: 2, name: 'Paket Pintar 2', price: 100000, quota: 2000, days: 30, color: 'indigo', popular: true },
  { id: 3, name: 'Paket Pintar 3', price: 150000, quota: 3000, days: 30, color: 'purple' },
];

export default function TopUp({ user, onUpdateUser }: { user: any, onUpdateUser: () => void }) {
  const [selectedPkg, setSelectedPkg] = useState<any>(null);
  const [proofImage, setProofImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProofImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const downloadPDF = () => {
    if (!selectedPkg) return;

    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(22);
    doc.setTextColor(16, 185, 129); // Emerald-500
    doc.text('EduBook AI Indonesia', 105, 20, { align: 'center' });
    
    doc.setFontSize(16);
    doc.setTextColor(31, 41, 55); // Gray-800
    doc.text('Instruksi Pembayaran', 105, 35, { align: 'center' });
    
    // Horizontal Line
    doc.setDrawColor(229, 231, 235);
    doc.line(20, 45, 190, 45);
    
    // Details
    doc.setFontSize(12);
    doc.setTextColor(107, 114, 128); // Gray-500
    doc.text('Paket Terpilih:', 20, 60);
    doc.setFontSize(14);
    doc.setTextColor(31, 41, 55);
    doc.text(selectedPkg.name, 20, 68);
    
    doc.setFontSize(12);
    doc.setTextColor(107, 114, 128);
    doc.text('Transfer Ke Rekening:', 20, 85);
    doc.setFontSize(14);
    doc.setTextColor(31, 41, 55);
    doc.text('Bank Mandiri', 20, 93);
    doc.text('1760006631301', 20, 101);
    doc.text('A/N Ribut Nurdiansyah', 20, 109);
    
    doc.setFontSize(12);
    doc.setTextColor(107, 114, 128);
    doc.text('Jumlah Transfer:', 20, 125);
    doc.setFontSize(20);
    doc.setTextColor(16, 185, 129);
    doc.text(`Rp ${selectedPkg.price.toLocaleString()}`, 20, 135);
    
    // Footer Note
    doc.setFontSize(10);
    doc.setTextColor(156, 163, 175);
    doc.text('Silakan unggah bukti transfer di aplikasi setelah melakukan pembayaran.', 105, 160, { align: 'center' });
    
    doc.save(`Instruksi_Pembayaran_${selectedPkg.name.replace(/\s+/g, '_')}.pdf`);
  };

  const handleSubmit = async () => {
    if (!selectedPkg || !proofImage) return;
    setLoading(true);

    try {
      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          packageName: selectedPkg.name,
          price: selectedPkg.price,
          proofImage: proofImage
        })
      });
      const data = await res.json();

      if (data.success) {
        Swal.fire({
          title: 'Berhasil Dikirim!',
          text: 'Bukti pembayaran Anda sedang diverifikasi oleh admin. Mohon tunggu sebentar.',
          icon: 'success',
          confirmButtonText: 'Oke',
          confirmButtonColor: '#10b981'
        });
        setSelectedPkg(null);
        setProofImage(null);
      }
    } catch (error) {
      Swal.fire('Error', 'Gagal mengirim bukti pembayaran', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-12">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-gray-800">Isi Ulang Kuota Belajar</h1>
        <p className="text-gray-500">Pilih paket yang sesuai dengan kebutuhan belajar Anda</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {packages.map((pkg) => (
          <div 
            key={pkg.id}
            onClick={() => setSelectedPkg(pkg)}
            className={cn(
              "relative bg-white p-8 rounded-3xl border-2 transition-all cursor-pointer group hover:-translate-y-2",
              selectedPkg?.id === pkg.id 
                ? `border-emerald-500 shadow-xl shadow-emerald-100` 
                : "border-gray-100 hover:border-emerald-200 shadow-sm",
              pkg.popular && "ring-4 ring-emerald-50"
            )}
          >
            {pkg.popular && (
              <span className="absolute -top-4 left-1/2 -translate-x-1/2 bg-emerald-500 text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-lg">
                PALING POPULER
              </span>
            )}
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-bold text-gray-800">{pkg.name}</h3>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="text-3xl font-black text-gray-900">Rp {pkg.price.toLocaleString()}</span>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <div className="w-5 h-5 bg-emerald-100 rounded-full flex items-center justify-center">
                    <Check className="w-3 h-3 text-emerald-600" />
                  </div>
                  {pkg.quota} Kuota Chat
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <div className="w-5 h-5 bg-emerald-100 rounded-full flex items-center justify-center">
                    <Check className="w-3 h-3 text-emerald-600" />
                  </div>
                  Aktif {pkg.days} Hari
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <div className="w-5 h-5 bg-emerald-100 rounded-full flex items-center justify-center">
                    <Check className="w-3 h-3 text-emerald-600" />
                  </div>
                  Akses 24/7 Kak AI
                </div>
              </div>

              <div className={cn(
                "w-full py-3 rounded-xl font-bold text-center transition-all",
                selectedPkg?.id === pkg.id 
                  ? "bg-emerald-500 text-white" 
                  : "bg-gray-50 text-gray-500 group-hover:bg-emerald-50 group-hover:text-emerald-600"
              )}>
                {selectedPkg?.id === pkg.id ? 'Terpilih' : 'Pilih Paket'}
              </div>
            </div>
          </div>
        ))}
      </div>

      {selectedPkg && (
        <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-lg space-y-8 animate-in fade-in slide-in-from-bottom-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                  <Banknote className="text-emerald-500" />
                  Instruksi Pembayaran
                </h3>
                <button 
                  onClick={downloadPDF}
                  className="flex items-center gap-2 text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-2 rounded-lg hover:bg-emerald-100 transition-all"
                >
                  <Download className="w-4 h-4" />
                  Download PDF
                </button>
              </div>
              <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 space-y-4">
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Transfer Ke Rekening</p>
                  <p className="text-lg font-bold text-gray-800 mt-1">Bank Mandiri: 1760006631301</p>
                  <p className="text-sm text-gray-500">A/N Ribut Nurdiansyah</p>
                </div>
                <div className="pt-4 border-t border-gray-200">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Jumlah Transfer</p>
                  <p className="text-2xl font-black text-emerald-600 mt-1">Rp {selectedPkg.price.toLocaleString()}</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 bg-amber-50 rounded-xl border border-amber-100">
                <ShieldCheck className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-amber-700 leading-relaxed">
                  Pastikan nominal transfer sesuai sampai 3 digit terakhir (jika ada) untuk mempercepat proses verifikasi otomatis.
                </p>
              </div>
            </div>

            <div className="space-y-6">
              <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <Upload className="text-emerald-500" />
                Unggah Bukti Pembayaran
              </h3>
              <div className="relative group">
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
                <div className={cn(
                  "h-48 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center transition-all",
                  proofImage ? "border-emerald-500 bg-emerald-50" : "border-gray-200 bg-gray-50 group-hover:border-emerald-300"
                )}>
                  {proofImage ? (
                    <img src={proofImage} className="h-full w-full object-contain p-2 rounded-2xl" alt="Proof" />
                  ) : (
                    <>
                      <Upload className="w-10 h-10 text-gray-300 mb-2" />
                      <p className="text-sm font-medium text-gray-500">Klik atau seret gambar ke sini</p>
                      <p className="text-xs text-gray-400 mt-1">Format: JPG, PNG (Maks 5MB)</p>
                    </>
                  )}
                </div>
              </div>
              <button
                onClick={handleSubmit}
                disabled={loading || !proofImage}
                className="w-full bg-emerald-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-emerald-200 hover:bg-emerald-600 disabled:bg-gray-200 disabled:shadow-none transition-all"
              >
                {loading ? 'Mengirim...' : 'Konfirmasi Pembayaran'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

