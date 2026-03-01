const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const OPENAI_URL = "https://api.openai.com/v1/chat/completions";
const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions";
const GROK_URL = "https://api.x.ai/v1/chat/completions";
const DEEPSEEK_URL = "https://api.deepseek.com/v1/chat/completions";
const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";

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

export const getAICompletion = async (messages, attachments = [], customApiKey = null, provider = 'groq', signal = null) => {
    let apiKey = customApiKey;
    let baseUrl;
    let defaultModel;
    let visionModel;
    let providerName;

    // Configure based on provider
    switch (provider) {
        case 'openai':
            baseUrl = OPENAI_URL;
            apiKey = apiKey || import.meta.env.VITE_OPENAI_API_KEY;
            defaultModel = "gpt-4o-mini";
            visionModel = "gpt-4o";
            providerName = "OpenAI";
            break;
        case 'openrouter':
            baseUrl = OPENROUTER_URL;
            apiKey = apiKey || import.meta.env.VITE_OPENROUTER_API_KEY;
            defaultModel = "google/gemini-2.0-flash-001";
            visionModel = "google/gemini-2.0-flash-001";
            providerName = "OpenRouter";
            break;
        case 'gemini':
            baseUrl = GEMINI_URL;
            apiKey = apiKey || import.meta.env.VITE_GEMINI_API_KEY;
            defaultModel = "gemini-2.0-flash";
            visionModel = "gemini-2.0-flash";
            providerName = "Gemini";
            break;
        case 'grok':
            baseUrl = GROK_URL;
            apiKey = apiKey || import.meta.env.VITE_GROK_API_KEY;
            defaultModel = "grok-2-1212";
            visionModel = "grok-2-vision-1212";
            providerName = "Grok";
            break;
        case 'deepseek':
            baseUrl = DEEPSEEK_URL;
            apiKey = apiKey || import.meta.env.VITE_DEEPSEEK_API_KEY;
            defaultModel = "deepseek-chat";
            visionModel = "deepseek-chat";
            providerName = "DeepSeek";
            break;
        case 'claude':
            baseUrl = ANTHROPIC_URL;
            apiKey = apiKey || import.meta.env.VITE_CLAUDE_API_KEY;
            defaultModel = "claude-3-5-haiku-20241022";
            visionModel = "claude-3-5-haiku-20241022";
            providerName = "Claude";
            break;
        case 'groq':
        default:
            baseUrl = GROQ_URL;
            apiKey = apiKey || GROQ_API_KEY;
            defaultModel = "llama-3.3-70b-versatile";
            visionModel = "meta-llama/llama-4-maverick-17b-128e-instruct";
            providerName = "Groq";
            break;
    }

    if (!apiKey) {
        return `Hata: ${providerName} API anahtarı bulunamadı. Ayarlardan API anahtarı ekleyin.`;
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
            model: imageContents.length > 0 ? visionModel : defaultModel,
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
            max_tokens: 8192
        };

        // Add Anthropic-specific headers
        const headers = {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${apiKey}`
        };

        if (provider === 'claude') {
            headers["x-api-key"] = apiKey;
            // Anthropic uses a different format
            const claudeMessages = formattedMessages.map(m => ({
                role: m.role,
                content: m.content
            }));
            // Convert to Anthropic format
            body.messages = claudeMessages;
            body.max_tokens = 4096;
            return sendAnthropicRequest(body, apiKey, providerName, signal);
        }

        return sendRequest(body, apiKey, baseUrl, providerName, signal);
    }

    // Regular text-only request
    const body = {
        model: defaultModel,
        messages: formattedMessages,
        temperature: 0.7,
        max_tokens: 8192
    };

    // Anthropic uses different endpoint
    if (provider === 'claude') {
        const claudeMessages = formattedMessages.map(m => ({
            role: m.role,
            content: m.content
        }));
        body.messages = claudeMessages;
        body.max_tokens = 4096;
        return sendAnthropicRequest(body, apiKey, providerName, signal);
    }

    return sendRequest(body, apiKey, baseUrl, providerName, signal);
};

const sendAnthropicRequest = async (body, apiKey, providerName, signal = null) => {
    try {
        const res = await fetch(ANTHROPIC_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-api-key": apiKey,
                "anthropic-version": "2023-06-01",
                "HTTP-Referer": "https://mate-ai.app",
                "X-Title": "Mate AI"
            },
            body: JSON.stringify(body),
            signal: signal || undefined
        });

        const data = await res.json();

        if (!res.ok) {
            console.error("[AI] Error:", data);
            return `Hata (${res.status}): ${data?.error?.message || 'bilinmiyor'}`;
        }

        return data.content[0].text;
    } catch (e) {
        if (e.name === 'AbortError') throw e;
        console.error("[AI] Fetch Error:", e);
        return `Bağlantı hatası: ${providerName} API'ye ulaşılamıyor.`;
    }
};

const sendRequest = async (body, apiKey, baseUrl, providerName, signal = null) => {
    try {
        const headers = {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${apiKey}`,
            "HTTP-Referer": window.location.href || "https://mate-ai.app",
            "X-Title": "Mate AI"
        };

        // Combine user abort signal with a 60-second timeout
        const timeoutController = new AbortController();
        const timeoutId = setTimeout(() => timeoutController.abort(), 60000);

        // Merge signals: abort if either user stops OR timeout fires
        let combinedSignal;
        if (signal && typeof AbortSignal.any === 'function') {
            combinedSignal = AbortSignal.any([signal, timeoutController.signal]);
        } else if (signal) {
            combinedSignal = signal;
        } else {
            combinedSignal = timeoutController.signal;
        }

        try {
            const res = await fetch(baseUrl, {
                method: "POST",
                headers: headers,
                body: JSON.stringify(body),
                signal: combinedSignal
            });

            clearTimeout(timeoutId);

            const data = await res.json();

            if (!res.ok) {
                console.error("[AI] Error:", data);
                return `Hata (${res.status}): ${data?.error?.message || 'bilinmiyor'} (${providerName})`;
            }

            return data.choices[0].message.content;
        } catch (e) {
            clearTimeout(timeoutId);
            throw e;
        }
    } catch (e) {
        if (e.name === 'AbortError') throw e;
        console.error("[AI] Fetch Error:", e);
        return `Bağlantı hatası: ${providerName} API'ye ulaşılamıyor. (İnternet bağlantınızı kontrol edin)`;
    }
};

