import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mic, MicOff } from 'lucide-react';

const VoiceChat = ({ onClose }) => {
    const [isListening, setIsListening] = useState(true);
    const [transcript, setTranscript] = useState('');

    // Auto-speak simulation for demo
    useEffect(() => {
        if (!isListening && transcript) {
            const speak = (text) => {
                if ('speechSynthesis' in window) {
                    const utterance = new SpeechSynthesisUtterance(text);
                    utterance.lang = 'tr-TR';
                    window.speechSynthesis.speak(utterance);
                }
            };

            // Simulating AI response in voice mode
            setTimeout(() => {
                speak("Anladım. Size nasıl yardımcı olabilirim?");
            }, 1000);
        }
    }, [isListening, transcript]);

    // Simple animation variants for the liquid bubble
    const bubbleVariants = {
        animate: {
            scale: [1, 1.1, 1],
            borderRadius: ["40% 60% 60% 40% / 40% 40% 60% 60%", "60% 40% 40% 60% / 60% 60% 40% 40%", "40% 60% 60% 40% / 40% 40% 60% 60%"],
            rotate: [0, 90, 180, 270, 360],
            transition: {
                duration: 8,
                repeat: Infinity,
                ease: "linear"
            }
        }
    };

    const waveVariants = {
        animate: {
            scale: [1, 1.5, 1],
            opacity: [0.5, 0, 0.5],
            transition: {
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
            }
        }
    };

    return (
        <div className="voice-overlay">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="voice-container"
            >
                <button className="close-voice" onClick={onClose}><X size={32} /></button>

                <div className="voice-content">
                    <div className="bubble-wrapper">
                        <motion.div
                            className="liquid-bubble-pulse"
                            variants={waveVariants}
                            animate="animate"
                        />
                        <motion.div
                            className="liquid-bubble liquid-glass"
                            variants={bubbleVariants}
                            animate="animate"
                        >
                            {isListening ? <Mic size={48} /> : <MicOff size={48} />}
                        </motion.div>
                    </div>

                    <div className="transcript-area">
                        <h3>{isListening ? 'Seni Dinliyorum...' : 'Mate AI Konuşuyor...'}</h3>
                        <p>{transcript || 'Bir şeyler söyleyin...'}</p>
                    </div>
                </div>

                <div className="voice-controls">
                    <button
                        className={`mic-toggle rounded-full ${isListening ? 'active' : ''}`}
                        onClick={() => setIsListening(!isListening)}
                    >
                        {isListening ? <MicOff size={24} /> : <Mic size={24} />}
                    </button>
                </div>
            </motion.div>
        </div>
    );
};

export default VoiceChat;
