import React, { useState, useEffect, useRef } from 'react';
import { Send, Paperclip, Camera, Volume2, Bot, User, Sparkles, LogOut } from 'lucide-react';
import { cn } from '../lib/utils';
import { getAIResponse } from '../services/aiService';
import Swal from 'sweetalert2';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function ChatAI({ user, onUpdateUser }: { user: any, onUpdateUser: () => void }) {
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchMessages();
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const fetchMessages = async () => {
    const res = await fetch(`/api/messages/${user.id}`);
    const data = await res.json();
    setMessages(data);
  };

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || isLoading) return;

    // Check quota
    const now = new Date();
    const expiry = user.quota_expiry ? new Date(user.quota_expiry) : null;
    if (user.quota_balance <= 0 || (expiry && expiry < now)) {
      Swal.fire({
        title: 'Kuota Habis!',
        text: 'Silakan isi ulang kuota Anda untuk melanjutkan belajar.',
        icon: 'warning',
        confirmButtonText: 'Isi Ulang Sekarang',
        confirmButtonColor: '#10b981',
        showCancelButton: true,
        cancelButtonText: 'Nanti saja'
      }).then((result) => {
        if (result.isConfirmed) {
          window.location.href = '/topup';
        }
      });
      return;
    }

    const userMsg = { userId: user.id, role: 'user', content: input };
    setInput('');
    setIsLoading(true);

    // Optimistic update
    setMessages(prev => [...prev, { ...userMsg, created_at: new Date().toISOString() }]);

    try {
      // Save user message
      const saveUserRes = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userMsg)
      });
      
      if (!saveUserRes.ok) throw new Error("Gagal menyimpan pesan Anda ke server.");

      onUpdateUser(); // Update quota in UI

      // Get AI response (exclude the optimistic message we just added)
      const history = messages.map(m => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.content }]
      }));
      
      const aiResponse = await getAIResponse(input, history);
      
      const aiMsg = { userId: user.id, role: 'model', content: aiResponse };
      
      // Save AI message
      const saveAiRes = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(aiMsg)
      });

      if (!saveAiRes.ok) throw new Error("Gagal menyimpan respons Kak AI ke server.");

      setMessages(prev => [...prev, { ...aiMsg, created_at: new Date().toISOString() }]);
    } catch (error: any) {
      console.error(error);
      Swal.fire({
        title: 'Koneksi Terputus',
        text: error.message || 'Gagal terhubung ke server atau Kak AI. Silakan periksa koneksi internet Anda.',
        icon: 'error',
        confirmButtonColor: '#10b981'
      });
      // Remove the optimistic user message if saving failed
      setMessages(prev => prev.slice(0, -1));
      setInput(userMsg.content); // Restore input
    } finally {
      setIsLoading(false);
    }
  };

  const [isSpeaking, setIsSpeaking] = useState(false);

  const speak = (text: string) => {
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'id-ID';
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    
    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  const handleFinish = async () => {
    if (messages.length === 0) {
      window.location.href = '/';
      return;
    }

    const result = await Swal.fire({
      title: 'Selesai Belajar?',
      text: 'Apakah Anda ingin menyimpan riwayat percakapan ini dalam format PDF?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Ya, Simpan PDF',
      cancelButtonText: 'Tidak, keluar saja',
      confirmButtonColor: '#10b981',
      cancelButtonColor: '#6b7280',
    });

    if (result.isConfirmed) {
      const doc = new jsPDF();
      
      // Header
      doc.setFontSize(20);
      doc.setTextColor(16, 185, 129); // Emerald 500
      doc.text('EduBook AI - Riwayat Belajar', 14, 22);
      
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(`Siswa: ${user.name}`, 14, 30);
      doc.text(`Tanggal: ${new Date().toLocaleString('id-ID')}`, 14, 35);
      
      const tableData = messages.map(msg => [
        msg.role === 'user' ? user.name : 'Kak AI',
        msg.content,
        new Date(msg.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
      ]);

      autoTable(doc, {
        startY: 45,
        head: [['Pengirim', 'Pesan', 'Waktu']],
        body: tableData,
        headStyles: { fillColor: [16, 185, 129] },
        styles: { fontSize: 9, cellPadding: 4 },
        columnStyles: {
          0: { cellWidth: 30, fontStyle: 'bold' },
          1: { cellWidth: 'auto' },
          2: { cellWidth: 20, halign: 'center' }
        }
      });

      doc.save(`Riwayat_Belajar_${user.name}_${new Date().getTime()}.pdf`);
      
      Swal.fire({
        title: 'Berhasil!',
        text: 'Riwayat belajar Anda telah disimpan.',
        icon: 'success',
        timer: 2000,
        showConfirmButton: false
      }).then(() => {
        window.location.href = '/';
      });
    } else if (result.dismiss === Swal.DismissReason.cancel) {
      window.location.href = '/';
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-2rem)] bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-50 flex items-center justify-between bg-emerald-50/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center shadow-md">
            <Bot className="text-white w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-gray-800">Kak AI</h3>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
              <span className="text-xs text-emerald-600 font-medium">Aktif Belajar</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-full border border-emerald-100 shadow-sm mr-2">
            <Sparkles className="w-4 h-4 text-emerald-500" />
            <span className="text-sm font-bold text-emerald-700">KUOTA: {user.quota_balance}</span>
          </div>
          <button 
            onClick={handleFinish}
            className="flex items-center gap-2 bg-gray-900 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-gray-800 transition-all shadow-lg shadow-gray-200"
          >
            <LogOut className="w-4 h-4" />
            Selesai Belajar
          </button>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 bg-[#f8fafc]">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
            <div className="w-20 h-20 bg-emerald-100 rounded-3xl flex items-center justify-center">
              <Bot className="w-10 h-10 text-emerald-600" />
            </div>
            <div>
              <h4 className="text-lg font-bold text-gray-800">Halo, {user.name}!</h4>
              <p className="text-gray-500 max-w-xs">Kak AI siap membantu Anda belajar hari ini. Ada yang dapat Kakak bantu?</p>
            </div>
          </div>
        )}
        
        {messages.map((msg, i) => (
          <div key={i} className={cn(
            "flex w-full",
            msg.role === 'user' ? "justify-end" : "justify-start"
          )}>
            <div className={cn(
              "max-w-[80%] flex gap-3",
              msg.role === 'user' ? "flex-row-reverse" : "flex-row"
            )}>
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1",
                msg.role === 'user' ? "bg-indigo-500" : "bg-emerald-500"
              )}>
                {msg.role === 'user' ? <User className="w-5 h-5 text-white" /> : <Bot className="w-5 h-5 text-white" />}
              </div>
              <div className="space-y-1">
                <div className={cn(
                  "p-4 rounded-2xl shadow-sm text-sm leading-relaxed",
                  msg.role === 'user' 
                    ? "bg-indigo-600 text-white rounded-tr-none" 
                    : "bg-white text-gray-800 rounded-tl-none border border-gray-100"
                )}>
                  {msg.content}
                </div>
                <div className={cn(
                  "flex items-center gap-2 text-[10px] text-gray-400",
                  msg.role === 'user' ? "justify-end" : "justify-start"
                )}>
                  {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  {msg.role === 'model' && (
                    <button 
                      onClick={() => speak(msg.content)}
                      className={cn(
                        "flex items-center gap-1 px-2 py-1 rounded-full transition-all text-[10px] font-bold",
                        isSpeaking 
                          ? "bg-emerald-100 text-emerald-600 animate-pulse" 
                          : "bg-gray-100 text-gray-500 hover:bg-emerald-50 hover:text-emerald-600"
                      )}
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                      {isSpeaking ? 'Berhenti' : 'Dengarkan'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white border border-gray-100 p-4 rounded-2xl rounded-tl-none shadow-sm flex gap-2">
              <span className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce"></span>
              <span className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce [animation-delay:0.2s]"></span>
              <span className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce [animation-delay:0.4s]"></span>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="p-4 bg-white border-t border-gray-100">
        <div className="flex items-center gap-2 bg-gray-50 p-2 rounded-2xl border border-gray-200 focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-100 transition-all">
          <button type="button" className="p-2 text-gray-400 hover:text-emerald-600 transition-colors">
            <Paperclip className="w-5 h-5" />
          </button>
          <button type="button" className="p-2 text-gray-400 hover:text-emerald-600 transition-colors">
            <Camera className="w-5 h-5" />
          </button>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Tanya Kak AI..."
            className="flex-1 bg-transparent border-none focus:ring-0 text-sm py-2"
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className={cn(
              "p-2.5 rounded-xl transition-all shadow-md",
              input.trim() && !isLoading 
                ? "bg-emerald-500 text-white hover:bg-emerald-600 scale-100" 
                : "bg-gray-200 text-gray-400 scale-95 cursor-not-allowed"
            )}
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </form>
    </div>
  );
}
