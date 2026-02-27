import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mic, MicOff, Volume2, Loader2, Sparkles, AlertCircle } from 'lucide-react';
import { getAICompletion } from '../services/ai';

const VoiceChat = ({ messages, persona, language, apiKey, provider, onSend, onClose }) => {
    const [status, setStatus] = useState('initializing');
    const [transcript, setTranscript] = useState('');
    const [aiResponse, setAiResponse] = useState('');
    const [error, setError] = useState(null);

    const recognitionRef = useRef(null);
    const transcriptRef = useRef('');
    const isActiveRef = useRef(true);
    const isSpeakingRef = useRef(false);
    const isProcessingRef = useRef(false);

    // Phonetic dictionary for correct English pronunciation with Turkish TTS voice
    const phoneticDictionary = useRef({
        'api': 'ey pi ay',
        'ai': 'ey ay',
        'mclaren': 'meklaren',
        'groq': 'grok',
        'firebase': 'fayırbeys',
        'react': 'riyekt',
        'javascript': 'cevaskiript',
        'engine': 'encin',
        'hypercar': 'haypır kar',
        'p1': 'pi bir',
        'f1': 'ef bir'
    }).current;

    const recognitionCorrection = useRef({
        'ineklerin': 'McLaren',
        'mek laren': 'McLaren',
        'maklaren': 'McLaren',
        'ey pi ay': 'API',
        'ey ay': 'AI'
    }).current;

    const cleanForSpeech = useCallback((text) => {
        if (language !== 'tr-TR') return text;
        let cleaned = text;
        Object.keys(phoneticDictionary).forEach(term => {
            const regex = new RegExp(`\\b${term}\\b`, 'gi');
            cleaned = cleaned.replace(regex, phoneticDictionary[term]);
        });
        return cleaned;
    }, [language, phoneticDictionary]);

    const correctTranscript = useCallback((text) => {
        let corrected = text;
        Object.keys(recognitionCorrection).forEach(wrong => {
            const regex = new RegExp(`\\b${wrong}\\b`, 'gi');
            corrected = corrected.replace(regex, recognitionCorrection[wrong]);
        });
        return corrected;
    }, [recognitionCorrection]);

    const startListening = useCallback(() => {
        if (!recognitionRef.current || isSpeakingRef.current) return;
        try {
            recognitionRef.current.start();
        } catch (e) {
            console.warn("Recognition already running");
        }
    }, []);

    const speakResponse = useCallback((text) => {
        if (!isActiveRef.current) return;

        // Cancel any ongoing speech
        window.speechSynthesis.cancel();

        const speechFriendlyText = cleanForSpeech(text);
        const utterance = new SpeechSynthesisUtterance(speechFriendlyText);
        utterance.lang = language;
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        utterance.volume = 1.0;

        // Try to find a suitable voice
        const voices = window.speechSynthesis.getVoices();
        const langVoice = voices.find(v => v.lang.startsWith(language.split('-')[0]));
        if (langVoice) {
            utterance.voice = langVoice;
        }

        utterance.onstart = () => {
            isSpeakingRef.current = true;
            setStatus('speaking');
        };

        utterance.onend = () => {
            isSpeakingRef.current = false;
            isProcessingRef.current = false;
            setStatus('idle');
            setTranscript('');
            setAiResponse('');
            transcriptRef.current = '';
            setTimeout(() => {
                if (isActiveRef.current && !isProcessingRef.current) {
                    startListening();
                }
            }, 600);
        };

        utterance.onerror = (event) => {
            console.error('Speech synthesis error:', event.error);
            isSpeakingRef.current = false;
            isProcessingRef.current = false;
            setStatus('idle');
        };

        // Small delay to ensure speech synthesis is ready
        setTimeout(() => {
            window.speechSynthesis.speak(utterance);
        }, 100);
    }, [language, cleanForSpeech, startListening]);

    // AI Processing logic
    const handleVoiceSuccess = useCallback(async (text) => {
        if (isProcessingRef.current) return;

        const correctedText = correctTranscript(text);
        if (!correctedText.trim()) {
            setStatus('idle');
            return;
        }

        isProcessingRef.current = true;
        setStatus('thinking');
        const history = [
            {
                role: 'system',
                content: `${persona.prompt} Sözlü sohbet yapıyoruz. Cevapların kısa, doğal ve akıcı olsun. Lütfen şu dilde yanıt ver: ${language}. Teknik terimleri doğru formda kullan.`
            },
            ...messages.slice(-6).map(m => ({
                role: m.sender === 'user' ? 'user' : 'assistant',
                content: m.text
            })),
            { role: 'user', content: correctedText }
        ];

        try {
            const aiText = await getAICompletion(history, [], apiKey, provider);
            if (!isActiveRef.current) return;
            setAiResponse(aiText);
            onSend(correctedText, aiText);
            speakResponse(aiText);
        } catch (err) {
            console.error(err);
            setError("Hata: " + err.message);
            isProcessingRef.current = false;
            setStatus('idle');
        }
    }, [messages, persona, language, apiKey, provider, onSend, speakResponse, correctTranscript]);

    const toggleMic = useCallback(() => {
        if (status === 'listening') {
            const finalTranscript = transcriptRef.current;
            recognitionRef.current?.stop();

            if (finalTranscript.trim()) {
                handleVoiceSuccess(finalTranscript);
            } else {
                setStatus('idle');
            }
        } else {
            startListening();
        }
    }, [status, handleVoiceSuccess, startListening]);

    // Preload voices for speech synthesis
    useEffect(() => {
        const loadVoices = () => {
            window.speechSynthesis.getVoices();
        };

        // Load voices immediately if available
        loadVoices();

        // Chrome requires this event
        window.speechSynthesis.onvoiceschanged = loadVoices;

        return () => {
            window.speechSynthesis.onvoiceschanged = null;
        };
    }, []);

    useEffect(() => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            setError("Tarayıcınız ses tanımayı desteklemiyor.");
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.lang = language;
        recognition.continuous = false;
        recognition.interimResults = true;

        let isComponentActive = true;

        recognition.onstart = () => {
            if (!isComponentActive) return;
            setStatus('listening');
            setError(null);
            transcriptRef.current = '';
            setTranscript('');
        };

        recognition.onresult = (event) => {
            let interim = '';
            for (let i = event.resultIndex; i < event.results.length; ++i) {
                interim += event.results[i][0].transcript;
            }
            transcriptRef.current = interim;
            setTranscript(interim);
        };

        recognition.onerror = (event) => {
            if (!isComponentActive) return;
            if (event.error === 'not-allowed') {
                setError("Mikrofon izni reddedildi. Lütfen mikrofon izni verin.");
                setStatus('idle');
            } else if (event.error === 'no-speech') {
                setStatus('idle');
            } else {
                setError("Hata: " + event.error);
                setStatus('idle');
            }
        };

        recognition.onend = () => {
            if (!isComponentActive) return;
            if (isActiveRef.current && !isSpeakingRef.current) {
                const finalTranscript = transcriptRef.current;
                if (finalTranscript.trim()) {
                    handleVoiceSuccess(finalTranscript);
                } else if (isActiveRef.current) {
                    setStatus('idle');
                    setTimeout(() => {
                        if (isActiveRef.current && !isSpeakingRef.current) {
                            try {
                                recognition.start();
                            } catch (e) {
                                console.warn("Recognition restart failed:", e);
                            }
                        }
                    }, 500);
                }
            }
        };

        recognitionRef.current = recognition;

        // Small delay before starting to ensure component is fully mounted
        const startTimer = setTimeout(() => {
            if (isComponentActive) {
                try {
                    recognition.start();
                } catch (e) {
                    console.warn("Initial start failed:", e);
                }
            }
        }, 300);

        return () => {
            isComponentActive = false;
            isActiveRef.current = false;
            clearTimeout(startTimer);
            try {
                recognition.stop();
            } catch (e) { }
            window.speechSynthesis.cancel();
        };
    }, [handleVoiceSuccess, language]);

    return (
        <motion.div
            className="voice-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
        >
            <div className="voice-container">
                <button className="close-voice" onClick={onClose} title="Kapat"><X size={32} /></button>

                <div className="voice-content">
                    <div className="bubble-wrapper">
                        <motion.div
                            className={`liquid-bubble liquid-glass ${status}`}
                            animate={{
                                borderRadius: ["40% 60% 60% 40%", "60% 40% 40% 60%", "40% 60% 60% 40%"],
                                transition: { duration: 8, repeat: Infinity }
                            }}
                        >
                            {status === 'thinking' ? <Loader2 size={48} className="animate-spin" /> :
                                status === 'speaking' ? <Volume2 size={48} /> :
                                    status === 'initializing' ? <Loader2 size={48} className="animate-spin" /> :
                                        <Mic size={48} />}
                        </motion.div>
                    </div>

                    <div className="transcript-area">
                        <div className={`voice-status-badge ${status}`}>
                            {status === 'listening' ? 'Dinleniyor' :
                                status === 'thinking' ? 'Düşünülüyor' :
                                    status === 'speaking' ? 'Konuşuluyor' :
                                        status === 'initializing' ? 'Başlatılıyor...' : 'Hazır'}
                        </div>

                        <p className="user-text">
                            {transcript || (status === 'listening' ? 'Konuşun...' :
                                status === 'initializing' ? 'Mikrofon hazırlanıyor...' : 'Bekleniyor')}
                        </p>

                        <AnimatePresence mode="wait">
                            {aiResponse && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="ai-voice-card"
                                >
                                    <Sparkles size={16} style={{ color: '#a78bfa', flexShrink: 0, marginTop: 4 }} />
                                    <p>{aiResponse}</p>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {error && (
                            <div className="voice-error-box">
                                <AlertCircle size={16} />
                                <span>{error}</span>
                            </div>
                        )}
                    </div>
                </div>

                <div className="voice-footer">
                    <button
                        className={`mic-btn-large ${status === 'listening' ? 'listening' : ''}`}
                        onClick={toggleMic}
                    >
                        {status === 'listening' ? <MicOff size={32} /> : <Mic size={32} />}
                    </button>
                    <span className="voice-hint">Dil: {language}</span>
                </div>
            </div>
        </motion.div>
    );
};

export default VoiceChat;
