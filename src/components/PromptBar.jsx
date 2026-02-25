import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, ArrowUp, AudioLines, X, FileText } from 'lucide-react';

// Sidebar width + margin = 304px total (desktop only)
const SIDEBAR_WIDTH = 304;

const PromptBar = ({ onSend, isInitial, setVoiceMode, sidebarOpen = false }) => {
    const [input, setInput] = useState('');
    const [attachments, setAttachments] = useState([]);
    const [isMobile, setIsMobile] = useState(() => window.innerWidth <= 768);
    const fileInputRef = useRef(null);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth <= 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (input.trim() || attachments.length > 0) {
            onSend(input, attachments);
            setInput('');
            setAttachments([]);
        }
    };

    const handleFileSelect = (e) => {
        const files = Array.from(e.target.files);
        const newAttachments = files.map(file => ({
            file,
            name: file.name,
            type: file.type,
            preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : null
        }));
        setAttachments(prev => [...prev, ...newAttachments]);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const removeAttachment = (index) => {
        setAttachments(prev => {
            const newAttachments = [...prev];
            if (newAttachments[index].preview) {
                URL.revokeObjectURL(newAttachments[index].preview);
            }
            newAttachments.splice(index, 1);
            return newAttachments;
        });
    };

    // Vertical: when initial, center vertically; when not initial, stay at bottom
    // With position:fixed and bottom:32px:
    // To center: translateY = calc(-50vh + 32px + 50%)
    const promptBarY = isInitial
        ? 'calc(-50vh + 32px + 50%)'
        : '0px';

    // Horizontal centering:
    // The prompt bar is inside main-content (position: relative).
    // main-content is flex:1, so its left edge is at SIDEBAR_WIDTH when sidebar is open, 0 when closed.
    // We want the bar centered in the FULL viewport, not just main-content.
    // So we use position: fixed to escape the flex layout, and calculate center manually.
    // When sidebar open: center = SIDEBAR_WIDTH + (100vw - SIDEBAR_WIDTH) / 2
    // When sidebar closed: center = 100vw / 2
    // Both simplify to: left = 50vw + SIDEBAR_WIDTH/2 (open) or left = 50vw (closed)

    return (
        <motion.div
            className="prompt-bar-outer-container"
            initial={false}
            animate={{
                y: promptBarY,
                left: (sidebarOpen && !isMobile)
                    ? `calc(50vw + ${SIDEBAR_WIDTH / 2}px)`
                    : '50vw',
                width: isInitial ? 'min(600px, 90vw)' : 'min(850px, 92vw)',
            }}
            transition={{
                y: { type: 'spring', damping: 40, stiffness: 300, mass: 0.8 },
                left: { type: 'tween', duration: 0.35, ease: [0.4, 0, 0.2, 1] },
                width: { type: 'spring', damping: 32, stiffness: 120, mass: 1 },
            }}
            style={{
                position: 'fixed',
                bottom: '32px',
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
                        exit={{ opacity: 0, transition: { duration: 0.15 } }}
                        transition={{ duration: 0.3 }}
                        className="welcome-text-container"
                    >
                        <h1>Bugün sana nasıl yardımcı olabilirim?</h1>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Attachments Preview */}
            <AnimatePresence>
                {attachments.length > 0 && (
                    <motion.div
                        className="attachments-preview"
                        initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                        animate={{ opacity: 1, height: 'auto', marginBottom: 12 }}
                        exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                        transition={{ duration: 0.2 }}
                    >
                        {attachments.map((att, index) => (
                            <motion.div
                                key={index}
                                className="attachment-item"
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.8 }}
                                transition={{ duration: 0.15 }}
                            >
                                {att.preview ? (
                                    <div className="attachment-preview-image">
                                        <img src={att.preview} alt={att.name} />
                                        <button
                                            className="attachment-remove-btn"
                                            onClick={() => removeAttachment(index)}
                                        >
                                            <X size={12} />
                                        </button>
                                    </div>
                                ) : (
                                    <div className="attachment-file-item">
                                        <FileText size={16} />
                                        <span className="attachment-file-name">{att.name}</span>
                                        <button
                                            className="attachment-remove-btn-file"
                                            onClick={() => removeAttachment(index)}
                                        >
                                            <X size={14} />
                                        </button>
                                    </div>
                                )}
                            </motion.div>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="prompt-controls-wrapper">
                <label className="white-circle-outside">
                    <Plus size={22} color="black" />
                    <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        accept="image/*,.pdf,.txt,.doc,.docx"
                        style={{ display: 'none' }}
                        onChange={handleFileSelect}
                    />
                </label>

                <form onSubmit={handleSubmit} className="prompt-form liquid-glass">
                    <textarea
                        placeholder="Mate AI'a bir şeyler sor..."
                        value={input}
                        onChange={(e) => {
                            setInput(e.target.value);
                            // Auto-resize textarea
                            e.target.style.height = 'auto';
                            e.target.style.height = Math.min(e.target.scrollHeight, 150) + 'px';
                        }}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSubmit(e);
                            }
                        }}
                        rows={1}
                    />

                    <div className="inner-action-container">
                        <AnimatePresence mode="wait">
                            {input.length === 0 && attachments.length === 0 ? (
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
