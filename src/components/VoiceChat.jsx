import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mic, MicOff, Volume2 } from 'lucide-react';

const VoiceChat = ({ onSend, onClose }) => {
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [isThinking, setIsThinking] = useState(false);
    const [error, setError] = useState(null);

    const recognitionRef = useRef(null);

    useEffect(() => {
        // Initialize Speech Recognition
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            setError("Tarayıcınız ses tanımayı desteklemiyor.");
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.lang = 'tr-TR';
        recognition.continuous = true;
        recognition.interimResults = true;

        recognition.onstart = () => {
            setIsListening(true);
            setError(null);
        };

        recognition.onresult = (event) => {
            let currentTranscript = '';
            for (let i = event.resultIndex; i < event.results.length; i++) {
                currentTranscript += event.results[i][0].transcript;
            }
            setTranscript(currentTranscript);
        };

        recognition.onerror = (event) => {
            console.error("Speech recognition error:", event.error);
            if (event.error === 'not-allowed') {
                setError("Mikrofon izni reddedildi.");
            } else {
                setError("Ses tanıma hatası oluştu.");
            }
            setIsListening(false);
        };

        recognition.onend = () => {
            setIsListening(false);
        };

        recognitionRef.current = recognition;

        // Start automatically
        handleStart();

        return () => {
            if (recognitionRef.current) recognitionRef.current.stop();
        };
    }, []);

    const handleStart = () => {
        if (recognitionRef.current) {
            try {
                recognitionRef.current.start();
            } catch (e) {
                console.warn("Recognition already started");
            }
        }
    };

    const handleStop = () => {
        if (recognitionRef.current) {
            recognitionRef.current.stop();
            if (transcript.trim()) {
                handleFinish(transcript);
            }
        }
    };

    const handleFinish = (text) => {
        setIsThinking(true);
        onSend(text);
        // We close after a small delay to show feedback or stay open 
        // if you want the user to hear the AI. But per user request 
        // "çalışmıyor düzelt", we make it functional.
        setTimeout(() => {
            onClose();
        }, 1500);
    };

    // Bubble variants WITHOUT rotation as requested
    const bubbleVariants = {
        animate: {
            scale: [1, 1.05, 1],
            borderRadius: [
                "40% 60% 60% 40% / 40% 40% 60% 60%",
                "50% 50% 50% 50% / 50% 50% 50% 50%",
                "40% 60% 60% 40% / 40% 40% 60% 60%"
            ],
            transition: {
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut"
            }
        }
    };

    const waveVariants = {
        animate: {
            scale: isListening ? [1, 1.4, 1] : 1,
            opacity: isListening ? [0.4, 0, 0.4] : 0,
            transition: {
                duration: 1.5,
                repeat: Infinity,
                ease: "easeInOut"
            }
        }
    };

    return (
        <div className="voice-overlay">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="voice-container liquid-glass"
            >
                <button className="close-voice" onClick={onClose}><X size={24} /></button>

                <div className="voice-content">
                    <div className="bubble-wrapper">
                        <motion.div
                            className="liquid-bubble-pulse"
                            variants={waveVariants}
                            animate="animate"
                        />
                        <motion.div
                            className="liquid-bubble"
                            variants={bubbleVariants}
                            animate="animate"
                        >
                            {isThinking ? (
                                <Volume2 size={40} className="pulse-icon" />
                            ) : isListening ? (
                                <Mic size={40} />
                            ) : (
                                <MicOff size={40} />
                            )}
                        </motion.div>
                    </div>

                    <div className="transcript-area">
                        <h3>
                            {error ? "Hata Oluştu" :
                                isThinking ? "Düşünülüyor..." :
                                    isListening ? "Seni Dinliyorum..." : "Durduruldu"}
                        </h3>
                        <p className={error ? "error-text" : ""}>
                            {error || transcript || 'Bir şeyler söyleyin...'}
                        </p>
                    </div>
                </div>

                <div className="voice-controls">
                    <button
                        className={`mic-toggle rounded-full ${isListening ? 'active' : ''}`}
                        onClick={isListening ? handleStop : handleStart}
                        disabled={isThinking}
                    >
                        {isListening ? "Bitti" : "Konuş"}
                    </button>
                </div>
            </motion.div>
        </div>
    );
};

export default VoiceChat;
