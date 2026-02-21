import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, ArrowUp, AudioLines } from 'lucide-react';

const PromptBar = ({ onSend, isInitial, setVoiceMode }) => {
    const [input, setInput] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (input.trim()) {
            onSend(input);
            setInput('');
        }
    };

    // KEY FIX: Always at bottom: 32px (same coordinate system)
    // When initial, lift it up using translateY in the SAME unit (vh)
    // No bottom % <-> bottom px switching = no teleport
    const promptBarY = isInitial
        ? 'calc(-50vh + 50%)'  // Moves bar to vertical center from its bottom position
        : '0px';               // Stays at the bottom

    return (
        <motion.div
            className="prompt-bar-outer-container"
            initial={false}
            animate={{
                y: promptBarY,
                width: isInitial ? 'min(600px, 90%)' : 'min(850px, 92%)',
            }}
            transition={{
                y: { type: 'spring', damping: 32, stiffness: 120, mass: 1 },
                width: { type: 'spring', damping: 32, stiffness: 120, mass: 1 },
            }}
            style={{
                position: 'absolute',
                bottom: '32px',
                left: '50%',
                x: '-50%',
                zIndex: 100,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                transformOrigin: 'bottom center'
            }}
        >
            <AnimatePresence>
                {isInitial && (
                    <motion.div
                        key="welcome"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="welcome-text-container"
                    >
                        <h1>Bugün sana nasıl yardımcı olabilirim?</h1>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="prompt-controls-wrapper">
                <label className="white-circle-outside">
                    <Plus size={22} color="black" />
                    <input
                        type="file"
                        multiple
                        style={{ display: 'none' }}
                        onChange={(e) => console.log('Files:', e.target.files)}
                    />
                </label>

                <form onSubmit={handleSubmit} className="prompt-form liquid-glass">
                    <input
                        type="text"
                        placeholder="Mate AI'a bir şeyler sor..."
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                    />

                    <div className="inner-action-container">
                        <AnimatePresence mode="wait">
                            {input.length === 0 ? (
                                <motion.button
                                    key="voice"
                                    initial={{ scale: 0.7, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    exit={{ scale: 0.7, opacity: 0 }}
                                    type="button"
                                    className="white-circle-inside"
                                    onClick={() => setVoiceMode(true)}
                                >
                                    <AudioLines size={20} color="black" />
                                </motion.button>
                            ) : (
                                <motion.button
                                    key="send"
                                    initial={{ scale: 0.7, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    exit={{ scale: 0.7, opacity: 0 }}
                                    type="submit"
                                    className="white-circle-inside"
                                >
                                    <ArrowUp size={20} color="black" />
                                </motion.button>
                            )}
                        </AnimatePresence>
                    </div>
                </form>
            </div>
        </motion.div>
    );
};

export default PromptBar;
