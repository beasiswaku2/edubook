import { GoogleGenAI } from "@google/genai";

export async function getGeminiResponse(prompt: string, history: { role: string, parts: { text: string }[] }[] = []) {
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    return "Mohon maaf, kunci API Gemini tidak terdeteksi. Harap hubungi administrator sistem.";
  }

  const ai = new GoogleGenAI({ apiKey });

  try {
    const contents = history.length > 0 
      ? history.map(h => ({ role: h.role, parts: h.parts }))
      : [];
    
    contents.push({ role: 'user', parts: [{ text: prompt }] });

    // Create a promise that rejects after 30 seconds
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Timeout")), 30000)
    );

    const apiCallPromise = ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: contents,
      config: {
        systemInstruction: `Anda adalah Kak AI, seorang mentor pendidikan profesional yang membimbing, mengarahkan, dan membina siswa di Edubook AI. 
        
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
        
        Tujuan utama Anda adalah membantu siswa menguasai materi pelajaran dan membangun kemandirian dalam belajar.`,
      }
    });

    const response = await Promise.race([apiCallPromise, timeoutPromise]) as any;

    if (!response || !response.text) {
      throw new Error("Invalid response from AI");
    }

    return response.text;
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    if (error.message === "Timeout") {
      return "Mohon maaf, koneksi ke Kak AI terputus karena terlalu lama merespons. Silakan coba lagi.";
    }
    return "Mohon maaf, Kak AI sedang mengalami gangguan teknis. Silakan mencoba kembali beberapa saat lagi.";
  }
}
