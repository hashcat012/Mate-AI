import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mic, MicOff, Volume2, Loader2, Sparkles, AlertCircle } from 'lucide-react';
import { getAICompletion } from '../services/ai';

const VoiceChat = ({ messages, persona, language, onSend, onClose }) => {
    const [status, setStatus] = useState('idle'); // idle, listening, thinking, speaking
    const [transcript, setTranscript] = useState('');
    const [aiResponse, setAiResponse] = useState('');
    const [error, setError] = useState(null);

    const recognitionRef = useRef(null);
    const transcriptRef = useRef('');
    const isActiveRef = useRef(true);
    const isSpeakingRef = useRef(false);

    // Phonetic dictionary for correct English pronunciation with Turkish TTS voice
    const phoneticDictionary = {
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
    };

    const recognitionCorrection = {
        'ineklerin': 'McLaren',
        'mek laren': 'McLaren',
        'maklaren': 'McLaren',
        'ey pi ay': 'API',
        'ey ay': 'AI'
    };

    const cleanForSpeech = (text) => {
        if (language !== 'tr-TR') return text; // Only apply for Turkish voice
        let cleaned = text;
        Object.keys(phoneticDictionary).forEach(term => {
            const regex = new RegExp(`\\b${term}\\b`, 'gi');
            cleaned = cleaned.replace(regex, phoneticDictionary[term]);
        });
        return cleaned;
    };

    const correctTranscript = (text) => {
        let corrected = text;
        Object.keys(recognitionCorrection).forEach(wrong => {
            const regex = new RegExp(`\\b${wrong}\\b`, 'gi');
            corrected = corrected.replace(regex, recognitionCorrection[wrong]);
        });
        return corrected;
    };

    const startListening = () => {
        if (!recognitionRef.current || isSpeakingRef.current) return;
        try {
            recognitionRef.current.start();
        } catch (e) {
            console.warn("Recognition already running");
        }
    };

    const toggleMic = () => {
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
    };

    // AI Processing logic
    const handleVoiceSuccess = useCallback(async (text) => {
        const correctedText = correctTranscript(text);
        if (!correctedText.trim()) {
            setStatus('idle');
            return;
        }

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
            const aiText = await getAICompletion(history);
            if (!isActiveRef.current) return;
            setAiResponse(aiText);
            onSend(correctedText, aiText);

            // Speak response
            const speechFriendlyText = cleanForSpeech(aiText);
            const utterance = new SpeechSynthesisUtterance(speechFriendlyText);
            utterance.lang = language;
            utterance.rate = 1.0;

            utterance.onstart = () => {
                isSpeakingRef.current = true;
                setStatus('speaking');
            };
            utterance.onend = () => {
                isSpeakingRef.current = false;
                setStatus('idle');
                setTranscript('');
                setAiResponse('');
                transcriptRef.current = '';
                setTimeout(() => {
                    if (isActiveRef.current && status !== 'listening') {
                        startListening();
                    }
                }, 500);
            };
            window.speechSynthesis.speak(utterance);
        } catch (err) {
            console.error(err);
            setError("Hata: " + err.message);
            setStatus('idle');
        }
    }, [messages, persona, language, onSend]);

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

        recognition.onstart = () => {
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
            if (event.error === 'not-allowed') {
                setError("Mikrofon izni reddedildi.");
            } else if (event.error !== 'no-speech') {
                setError("Hata: " + event.error);
            }
            setStatus('idle');
        };

        recognition.onend = () => {
            if (isActiveRef.current && !isSpeakingRef.current) {
                const finalTranscript = transcriptRef.current;
                if (finalTranscript.trim() && status === 'listening') {
                    handleVoiceSuccess(finalTranscript);
                } else {
                    setStatus('idle');
                }
            }
        };

        recognitionRef.current = recognition;
        startListening();

        return () => {
            isActiveRef.current = false;
            recognition.stop();
            window.speechSynthesis.cancel();
        };
    }, [handleVoiceSuccess, language]);

    return (
        <div className="voice-overlay">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="voice-container"
            >
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
                                    <Mic size={48} />}
                        </motion.div>
                    </div>

                    <div className="transcript-area">
                        <div className={`voice-status-badge ${status}`}>
                            {status === 'listening' ? 'Dinleniyor' :
                                status === 'thinking' ? 'Düşünülüyor' :
                                    status === 'speaking' ? 'Konuşuluyor' : 'Hazır'}
                        </div>

                        <p className="user-text">
                            {transcript || (status === 'listening' ? 'Konuşun...' : 'Bekleniyor')}
                        </p>

                        <AnimatePresence>
                            {aiResponse && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="ai-voice-card"
                                >
                                    <Sparkles size={16} className="text-purple-400" />
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
            </motion.div>
        </div>
    );
};

export default VoiceChat;
