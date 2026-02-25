import React, { useEffect, useRef, useState, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Copy, Check, ThumbsUp, ThumbsDown,
    RotateCcw, Volume2, VolumeX, FileText, Code2
} from 'lucide-react';

// ── Code Block with Copy Button ─────────────────────────────────
const CodeBlock = ({ language, children }) => {
    const [copied, setCopied] = useState(false);
    const code = String(children).replace(/\n$/, '');

    const handleCopy = () => {
        navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="code-block-wrapper">
            <div className="code-block-header">
                <span className="code-lang">{language || 'code'}</span>
                <button className="code-copy-btn" onClick={handleCopy} title="Kodu kopyala">
                    <AnimatePresence mode="wait">
                        {copied ? (
                            <motion.span key="check" initial={{ scale: 0.7 }} animate={{ scale: 1 }} exit={{ scale: 0.7 }}>
                                <Check size={14} color="#4ade80" />
                            </motion.span>
                        ) : (
                            <motion.span key="copy" initial={{ scale: 0.7 }} animate={{ scale: 1 }} exit={{ scale: 0.7 }}>
                                <Copy size={14} />
                            </motion.span>
                        )}
                    </AnimatePresence>
                    <span>{copied ? 'Kopyalandı' : 'Kopyala'}</span>
                </button>
            </div>
            <SyntaxHighlighter
                style={vscDarkPlus}
                language={language || 'text'}
                PreTag="div"
                customStyle={{ margin: 0, borderRadius: '0 0 12px 12px', background: '#0d0d0d' }}
            >
                {code}
            </SyntaxHighlighter>
        </div>
    );
};

// ── Message Action Bar ───────────────────────────────────────────
const MessageActions = ({ text, onRegenerate, index, onOpenCodeEditor }) => {
    const [copied, setCopied] = useState(false);
    const [liked, setLiked] = useState(null); // 'up' | 'down' | null
    const [speaking, setSpeaking] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleLike = (val) => {
        setLiked(prev => prev === val ? null : val);
    };

    const detectLang = (t) => {
        // Turkish-specific characters and common Turkish words
        const trChars = (t.match(/[çğışöüÇĞİŞÖÜ]/g) || []).length;
        const trWords = (t.match(/\b(bir|ve|bu|ile|için|olan|var|da|de|ki|mi|ne|bu|o|ben|sen|biz|siz|ama|ya|ya da|veya|hem|nasıl|neden)\b/gi) || []).length;
        return (trChars > 1 || trWords > 1) ? 'tr-TR' : 'en-US';
    };

    const handleSpeak = () => {
        if (speaking) {
            window.speechSynthesis.cancel();
            setSpeaking(false);
            return;
        }

        const lang = detectLang(text);
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = lang;
        utterance.rate = 1;
        utterance.pitch = 1;

        // Pick best voice for detected language
        const voices = window.speechSynthesis.getVoices();
        const langCode = lang.split('-')[0];
        const bestVoice = voices.find(v => v.lang.startsWith(langCode) && v.localService)
            || voices.find(v => v.lang.startsWith(langCode));
        if (bestVoice) utterance.voice = bestVoice;

        utterance.onend = () => setSpeaking(false);
        utterance.onerror = () => setSpeaking(false);
        window.speechSynthesis.speak(utterance);
        setSpeaking(true);
    };

    // Check if message has code blocks (more comprehensive)
    const hasCodeBlocks = /```[\s\S]*?```/.test(text) || /``[\s\S]*?``/.test(text) || /`[^`]+`/.test(text);

    return (
        <div className="message-actions">
            {/* Thumbs Up */}
            <button
                className={`action-btn ${liked === 'up' ? 'active-like' : ''}`}
                onClick={() => handleLike('up')}
                title="Beğen"
            >
                <ThumbsUp size={14} />
            </button>

            {/* Thumbs Down */}
            <button
                className={`action-btn ${liked === 'down' ? 'active-dislike' : ''}`}
                onClick={() => handleLike('down')}
                title="Beğenme"
            >
                <ThumbsDown size={14} />
            </button>

            {/* Copy Response */}
            <button className="action-btn" onClick={handleCopy} title="Yanıtı kopyala">
                {copied ? <Check size={14} color="#4ade80" /> : <Copy size={14} />}
            </button>

            {/* Regenerate */}
            <button className="action-btn" onClick={() => onRegenerate(index)} title="Yeniden üret">
                <RotateCcw size={14} />
            </button>

            {/* Text to Speech */}
            <button
                className={`action-btn ${speaking ? 'active-speaking' : ''}`}
                onClick={handleSpeak}
                title={speaking ? 'Durdur' : 'Sesli oku'}
            >
                {speaking ? <VolumeX size={14} /> : <Volume2 size={14} />}
            </button>

            {/* Open in Code Editor */}
            {hasCodeBlocks && (
                <button
                    className="action-btn code-editor-btn"
                    onClick={() => onOpenCodeEditor(text)}
                    title="Kod Editöründe Aç"
                >
                    <Code2 size={14} />
                </button>
            )}
        </div>
    );
};

// ── Main Chat Component ──────────────────────────────────────────
const Chat = ({ messages, isInitial, onRegenerate, onOpenCodeEditor }) => {
    const bottomRef = useRef(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    if (isInitial && messages.length === 0) {
        return <div className="chat-messages-container" />;
    }

    return (
        <motion.div layout className="chat-messages-container">
            <AnimatePresence>
                {messages.map((msg, index) => (
                    <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.25 }}
                        className={`message-wrapper ${msg.sender}`}
                    >
                        <div className={`message-bubble ${msg.sender === 'ai' ? 'liquid-glass' : 'user-bubble'}`}>
                            {/* Display attachments (images) */}
                            {msg.attachments && msg.attachments.length > 0 && (
                                <div className="message-attachments">
                                    {msg.attachments.map((att, attIndex) => (
                                        att.preview ? (
                                            <div key={attIndex} className="message-image-container">
                                                <img
                                                    src={att.preview}
                                                    alt={att.name}
                                                    className="message-attached-image"
                                                />
                                            </div>
                                        ) : (
                                            <div key={attIndex} className="message-file-container">
                                                <FileText size={16} />
                                                <span>{att.name}</span>
                                            </div>
                                        )
                                    ))}
                                </div>
                            )}

                            {/* Display text content - remove file names from display */}
                            {msg.text && !msg.text.match(/^\[.*\]$/) && (
                                <ReactMarkdown
                                    components={{
                                        code({ node, inline, className, children, ...props }) {
                                            const match = /language-(\w+)/.exec(className || '');
                                            return !inline && match ? (
                                                <CodeBlock language={match[1]}>
                                                    {children}
                                                </CodeBlock>
                                            ) : (
                                                <code className={className} {...props}>
                                                    {children}
                                                </code>
                                            );
                                        }
                                    }}
                                >
                                    {msg.text.replace(/\[.*?\]/g, '').trim()}
                                </ReactMarkdown>
                            )}

                            {/* Action bar only for AI messages */}
                            {msg.sender === 'ai' && (
                                <MessageActions
                                    text={msg.text}
                                    index={index}
                                    onRegenerate={onRegenerate}
                                    onOpenCodeEditor={onOpenCodeEditor}
                                />
                            )}
                        </div>
                    </motion.div>
                ))}
            </AnimatePresence>
            <div ref={bottomRef} />
        </motion.div>
    );
};

export default Chat;
