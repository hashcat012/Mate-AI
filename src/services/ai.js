const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

export const getAICompletion = async (messages) => {
    if (!GROQ_API_KEY) {
        return "Hata: API anahtarı bulunamadı (.env dosyasını kontrol et).";
    }

    // Strict format - only role and content, always strings
    const body = {
        model: "llama-3.3-70b-versatile",
        messages: messages.map(m => ({
            role: m.role || (m.sender === 'user' ? 'user' : 'assistant'),
            content: String(m.content || m.text || "")
        })),
        temperature: 0.7,
        max_tokens: 1024
    };

    try {
        const res = await fetch(GROQ_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${GROQ_API_KEY}`
            },
            body: JSON.stringify(body)
        });

        const data = await res.json();

        if (!res.ok) {
            console.error("[AI] Error:", data);
            return `Hata (${res.status}): ${data?.error?.message || 'bilinmiyor'}`;
        }

        return data.choices[0].message.content;
    } catch (e) {
        console.error("[AI] Fetch Error:", e);
        return "Bağlantı hatası: Groq API'ye ulaşılamıyor.";
    }
};
