import { GoogleGenAI } from "@google/genai";
import Groq from "groq-sdk";

export async function getAIResponse(prompt: string, history: { role: string, parts: { text: string }[] }[] = []) {
  // Fetch settings from API (since this is client-side code in the applet context)
  // Actually, in this architecture, the AI call is happening in the frontend.
  // We should probably fetch the settings first.
  
  let settings: any = { ai_provider: 'gemini' };
  try {
    const res = await fetch('/api/admin/settings');
    if (res.ok) {
      settings = await res.json();
    }
  } catch (e) {
    console.error("Failed to fetch AI settings, defaulting to Gemini", e);
  }

  const provider = settings.ai_provider || 'gemini';
  const systemInstruction = `Anda adalah Kak AI, seorang mentor pendidikan profesional yang membimbing, mengarahkan, dan membina siswa di Edubook AI. 
        
  Karakteristik Anda:
  1. Anda WAJIB menggunakan Bahasa Indonesia yang baik dan benar sesuai dengan kaidah Tata Bahasa Baku Bahasa Indonesia (TBBBI) dan Ejaan Bahasa Indonesia yang Disempurnakan (EYD).
  2. Hindari penggunaan bahasa gaul, prokem, atau singkatan yang tidak baku (seperti "gak", "udah", "ya", "tapi", dll.).
  3. Gunakan gaya bahasa yang formal, sopan, namun tetap hangat, suportif, dan inspiratif. Gunakan kata ganti "Anda" untuk menyapa siswa.
  4. Gunakan penjelasan yang TERSTRUKTUR dan MUDAH DIPAHAMI. Manfaatkan format Markdown seperti:
     - Gunakan **teks tebal** untuk poin-poin penting.
     - Gunakan *bullet points* atau daftar bernomor untuk langkah-langkah.
     - Gunakan pemisah antar bagian agar teks tidak menumpuk.
  5. Jangan hanya memberikan jawaban langsung. Berikan penjelasan konsep secara mendalam dan bimbing siswa langkah demi langkah agar mereka memahami proses berpikirnya.
  6. Gunakan simbol matematika yang tepat (contoh: √ untuk akar, ² untuk kuadrat, π untuk pi, dll.) agar penjelasan terlihat profesional dan mudah dipahami.
  7. Bertindaklah sebagai mentor yang membina karakter dan semangat belajar siswa, bukan sekadar mesin penjawab soal.
  8. Selalu berinisiatif menawarkan contoh soal baru atau tantangan tambahan setelah menjelaskan suatu materi untuk memastikan pemahaman siswa telah tuntas.
  9. Berikan apresiasi yang tulus atas setiap kemajuan dan usaha belajar yang dilakukan oleh siswa.
  
  Tujuan utama Anda adalah membantu siswa menguasai materi pelajaran dan membangun kemandirian dalam belajar.`;

  if (provider === 'groq') {
    const apiKey = settings.groq_api_key || process.env.GROQ_API_KEY;
    if (!apiKey) return "Kunci API Groq tidak ditemukan.";
    
    const groq = new Groq({ apiKey, dangerouslyAllowBrowser: true });
    try {
      const messages = history.map(h => ({
        role: h.role === 'model' ? 'assistant' : h.role,
        content: h.parts[0].text
      }));
      messages.unshift({ role: 'system', content: systemInstruction });
      messages.push({ role: 'user', content: prompt });

      const completion = await groq.chat.completions.create({
        messages: messages as any,
        model: "llama-3.3-70b-versatile",
      });

      return completion.choices[0]?.message?.content || "Maaf, Groq tidak memberikan respons.";
    } catch (error: any) {
      console.error("Groq API Error:", error);
      return "Maaf, terjadi kesalahan pada layanan Groq.";
    }
  } else {
    // Default to Gemini
    const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY;
    if (!apiKey) return "Kunci API Gemini tidak ditemukan.";

    const ai = new GoogleGenAI({ apiKey });
    try {
      const contents = history.map(h => ({ role: h.role, parts: h.parts }));
      contents.push({ role: 'user', parts: [{ text: prompt }] });

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: contents,
        config: { systemInstruction }
      });

      return response.text || "Maaf, Gemini tidak memberikan respons.";
    } catch (error: any) {
      console.error("Gemini API Error:", error);
      return "Maaf, terjadi kesalahan pada layanan Gemini.";
    }
  }
}
