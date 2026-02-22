const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

// Convert file to base64
const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
    });
};

// Check if file is an image
const isImageFile = (file) => {
    return file && file.type && file.type.startsWith('image/');
};

export const getAICompletion = async (messages, attachments = []) => {
    if (!GROQ_API_KEY) {
        return "Hata: API anahtarı bulunamadı (.env dosyasını kontrol et).";
    }

    // Process attachments - convert images to base64
    const imageContents = [];
    const fileInfos = [];

    if (attachments && attachments.length > 0) {
        for (const att of attachments) {
            if (isImageFile(att.file)) {
                try {
                    const base64 = await fileToBase64(att.file);
                    imageContents.push({
                        type: "image_url",
                        image_url: {
                            url: base64
                        }
                    });
                } catch (e) {
                    console.error("Image conversion error:", e);
                }
            } else {
                fileInfos.push(`[Dosya: ${att.name}]`);
            }
        }
    }

    // Build messages with vision support
    const formattedMessages = messages.map(m => {
        const content = String(m.content || m.text || "");
        return {
            role: m.role || (m.sender === 'user' ? 'user' : 'assistant'),
            content: content
        };
    });

    // If last message is from user and has attachments, modify it
    const lastMessage = formattedMessages[formattedMessages.length - 1];
    if (lastMessage && lastMessage.role === 'user' && (imageContents.length > 0 || fileInfos.length > 0)) {
        // Build content array for vision
        const contentParts = [];

        // Add text first
        if (lastMessage.content) {
            contentParts.push({
                type: "text",
                text: lastMessage.content
            });
        }

        // Add images
        imageContents.forEach(img => contentParts.push(img));

        // Use vision model if images present
        const body = {
            model: imageContents.length > 0 ? "meta-llama/llama-4-scout-17b-16e-instruct" : "llama-3.3-70b-versatile",
            messages: formattedMessages.map((m, i) => {
                // Last user message with attachments
                if (i === formattedMessages.length - 1 && m.role === 'user') {
                    return {
                        role: "user",
                        content: contentParts.length > 1 ? contentParts : (contentParts[0]?.text || lastMessage.content)
                    };
                }
                return m;
            }),
            temperature: 0.7,
            max_tokens: 1024
        };

        return sendRequest(body);
    }

    // Regular text-only request
    const body = {
        model: "llama-3.3-70b-versatile",
        messages: formattedMessages,
        temperature: 0.7,
        max_tokens: 1024
    };

    return sendRequest(body);
};

const sendRequest = async (body) => {
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
