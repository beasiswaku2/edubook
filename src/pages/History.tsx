import React, { useState, useEffect } from 'react';
import { History, CreditCard, MessageSquare, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import { cn } from '../lib/utils';

export default function HistoryPage({ user }: { user: any }) {
  const [transactions, setTransactions] = useState<any[]>([]);

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    const res = await fetch(`/api/transactions/${user.id}`);
    const data = await res.json();
    setTransactions(data);
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
          <History className="text-emerald-500" />
          Riwayat Transaksi
        </h1>
      </div>

      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50/50 text-xs font-bold text-gray-400 uppercase tracking-wider">
                <th className="px-6 py-4">Paket</th>
                <th className="px-6 py-4">Harga</th>
                <th className="px-6 py-4">Tanggal</th>
                <th className="px-6 py-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-gray-400 italic">
                    Belum ada riwayat transaksi.
                  </td>
                </tr>
              ) : (
                transactions.map((t, i) => (
                  <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center">
                          <CreditCard className="w-4 h-4 text-emerald-600" />
                        </div>
                        <span className="font-bold text-gray-800">{t.package_name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-600">Rp {t.price.toLocaleString()}</td>
                    <td className="px-6 py-4 text-gray-500">{new Date(t.created_at).toLocaleDateString()}</td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "text-[10px] font-bold px-2 py-1 rounded-lg uppercase",
                        t.status === 'success' ? "bg-emerald-50 text-emerald-600" : 
                        t.status === 'pending' ? "bg-amber-50 text-amber-600" : 
                        "bg-red-50 text-red-600"
                      )}>
                        {t.status === 'success' ? 'Berhasil' : t.status === 'pending' ? 'Menunggu' : 'Gagal'}
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
  );
}
