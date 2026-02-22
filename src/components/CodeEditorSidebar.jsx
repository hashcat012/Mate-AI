import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Editor from '@monaco-editor/react';
import { X, FileCode, Eye, Download, Copy, Check, RefreshCw, Code2, Play } from 'lucide-react';

const CodeEditorSidebar = ({ isOpen, onClose, files }) => {
    const [selectedFileIndex, setSelectedFileIndex] = useState(0);
    const [copied, setCopied] = useState(false);
    const [activeTab, setActiveTab] = useState('files'); // 'files' | 'preview'
    const iframeRef = useRef(null);

    useEffect(() => {
        if (files && files.length > 0) {
            setSelectedFileIndex(0);
        }
    }, [files]);

    useEffect(() => {
        if (activeTab === 'preview' && iframeRef.current) {
            refreshPreview();
        }
    }, [activeTab, files]);

    const currentFile = files && files[selectedFileIndex];

    const handleCopy = () => {
        if (currentFile) {
            navigator.clipboard.writeText(currentFile.code);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const handleDownload = () => {
        if (currentFile) {
            const blob = new Blob([currentFile.code], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = currentFile.name;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }
    };

    const handleDownloadAll = () => {
        files.forEach(file => {
            const blob = new Blob([file.code], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = file.name;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        });
    };

    const getLanguage = (filename) => {
        const ext = filename.split('.').pop().toLowerCase();
        const langMap = {
            'html': 'html',
            'css': 'css',
            'js': 'javascript',
            'jsx': 'javascript',
            'ts': 'typescript',
            'tsx': 'typescript',
            'json': 'json',
            'py': 'python',
            'java': 'java',
            'cpp': 'cpp',
            'c': 'c',
            'php': 'php',
            'rb': 'ruby',
            'go': 'go',
            'rs': 'rust',
            'swift': 'swift',
            'kt': 'kotlin',
            'md': 'markdown',
            'sql': 'sql',
            'sh': 'shell',
            'yaml': 'yaml',
            'yml': 'yaml',
            'xml': 'xml',
            'vue': 'vue',
            'scss': 'scss',
            'sass': 'scss',
            'less': 'less'
        };
        return langMap[ext] || 'plaintext';
    };

    const getFileIcon = (filename) => {
        const ext = filename.split('.').pop().toLowerCase();
        if (['html', 'htm'].includes(ext)) return '🌐';
        if (['css', 'scss', 'sass', 'less'].includes(ext)) return '🎨';
        if (['js', 'jsx', 'ts', 'tsx'].includes(ext)) return '⚡';
        if (ext === 'json') return '📋';
        if (ext === 'py') return '🐍';
        if (ext === 'md') return '📝';
        if (['png', 'jpg', 'jpeg', 'gif', 'svg'].includes(ext)) return '🖼️';
        return '📄';
    };

    const generatePreviewHTML = () => {
        if (!files) return '';

        const htmlFile = files.find(f => f.name.endsWith('.html'));
        const cssFile = files.find(f => f.name.endsWith('.css'));
        const jsFile = files.find(f => f.name.endsWith('.js'));

        let html = htmlFile?.code || '';
        const css = cssFile?.code || '';
        const js = jsFile?.code || '';

        // Inject CSS
        if (css && html) {
            html = html.replace('</head>', `<style>${css}</style></head>`);
        } else if (css && !html) {
            html = `<!DOCTYPE html><html><head><style>${css}</style></head><body></body></html>`;
        }

        // Inject JS
        if (js && html) {
            html = html.replace('</body>', `<script>${js}</script></body>`);
        } else if (js && !html) {
            html = `<!DOCTYPE html><html><head></head><body><script>${js}</script></body></html>`;
        }

        return html;
    };

    const refreshPreview = () => {
        if (iframeRef.current) {
            const html = generatePreviewHTML();
            iframeRef.current.srcdoc = html;
        }
    };

    const hasHTMLFile = files && files.some(f => f.name.endsWith('.html'));

    if (!files || files.length === 0) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    className="code-editor-sidebar"
                    initial={{ x: '100%' }}
                    animate={{ x: 0 }}
                    exit={{ x: '100%' }}
                    transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                >
                    {/* Header */}
                    <div className="code-editor-header">
                        <div className="code-editor-title">
                            <Code2 size={20} />
                            <span>Kod Editörü</span>
                        </div>
                        <div className="code-editor-actions">
                            <button className="code-action-btn" onClick={handleDownloadAll} title="Tümünü İndir">
                                <Download size={18} />
                            </button>
                            <button className="code-action-btn" onClick={onClose} title="Kapat">
                                <X size={18} />
                            </button>
                        </div>
                    </div>

                    {/* Tab Toggle */}
                    <div className="code-editor-tabs">
                        <button
                            className={`code-tab ${activeTab === 'files' ? 'active' : ''}`}
                            onClick={() => setActiveTab('files')}
                        >
                            <Code2 size={16} />
                            <span>Files</span>
                        </button>
                        {hasHTMLFile && (
                            <button
                                className={`code-tab ${activeTab === 'preview' ? 'active' : ''}`}
                                onClick={() => setActiveTab('preview')}
                            >
                                <Play size={16} />
                                <span>Preview</span>
                            </button>
                        )}
                    </div>

                    {/* Content */}
                    <div className="code-editor-content">
                        {activeTab === 'files' ? (
                            <div className="code-files-layout">
                                {/* File List */}
                                <div className="code-file-list">
                                    {files.map((file, index) => (
                                        <button
                                            key={index}
                                            className={`code-file-item ${selectedFileIndex === index ? 'active' : ''}`}
                                            onClick={() => setSelectedFileIndex(index)}
                                        >
                                            <span className="file-icon">{getFileIcon(file.name)}</span>
                                            <span className="file-name">{file.name}</span>
                                        </button>
                                    ))}
                                </div>

                                {/* Editor */}
                                <div className="code-editor-area">
                                    <div className="code-editor-tab-bar">
                                        <div className="tab-file-info">
                                            <span className="file-icon">{getFileIcon(currentFile?.name)}</span>
                                            <span>{currentFile?.name}</span>
                                        </div>
                                        <div className="tab-actions">
                                            <button onClick={handleCopy} title="Kopyala">
                                                {copied ? <Check size={14} color="#4ade80" /> : <Copy size={14} />}
                                            </button>
                                            <button onClick={handleDownload} title="İndir">
                                                <Download size={14} />
                                            </button>
                                        </div>
                                    </div>
                                    <Editor
                                        height="100%"
                                        language={getLanguage(currentFile?.name || '')}
                                        value={currentFile?.code || ''}
                                        theme="vs-dark"
                                        options={{
                                            minimap: { enabled: false },
                                            fontSize: 13,
                                            lineNumbers: 'on',
                                            scrollBeyondLastLine: false,
                                            readOnly: false,
                                            automaticLayout: true,
                                            wordWrap: 'on',
                                            padding: { top: 10 },
                                            fontFamily: "'Fira Code', 'Cascadia Code', Consolas, monospace",
                                            fontLigatures: true
                                        }}
                                    />
                                </div>
                            </div>
                        ) : (
                            <div className="code-preview-area">
                                <div className="preview-toolbar">
                                    <span>Live Preview</span>
                                    <button onClick={refreshPreview} title="Yenile">
                                        <RefreshCw size={14} />
                                    </button>
                                </div>
                                <iframe
                                    ref={iframeRef}
                                    className="preview-iframe"
                                    srcDoc={generatePreviewHTML()}
                                    title="Preview"
                                    sandbox="allow-scripts allow-same-origin"
                                />
                            </div>
                        )}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default CodeEditorSidebar;
