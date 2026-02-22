import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Editor from '@monaco-editor/react';
import { X, FileCode, Eye, Download, MoreVertical, FolderOpen, Code2, Copy, Check, RefreshCw } from 'lucide-react';

const CodeEditorSidebar = ({ isOpen, onClose, files, activeFileIndex, onFileSelect }) => {
    const [activeTab, setActiveTab] = useState('files'); // 'files' | 'preview'
    const [selectedFileIndex, setSelectedFileIndex] = useState(0);
    const [copied, setCopied] = useState(false);
    const [showMenu, setShowMenu] = useState(false);
    const iframeRef = useRef(null);

    useEffect(() => {
        if (activeFileIndex !== undefined) {
            setSelectedFileIndex(activeFileIndex);
        }
    }, [activeFileIndex]);

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
        }

        // Inject JS
        if (js && html) {
            html = html.replace('</body>', `<script>${js}</script></body>`);
        }

        // If no HTML but has CSS/JS, create basic structure
        if (!htmlFile && (css || js)) {
            html = `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    ${css ? `<style>${css}</style>` : ''}
</head>
<body>
    ${js ? `<script>${js}</script>` : ''}
</body>
</html>`;
        }

        return html;
    };

    const refreshPreview = () => {
        if (iframeRef.current) {
            const html = generatePreviewHTML();
            iframeRef.current.srcdoc = html;
        }
    };

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

                    {/* Tabs */}
                    <div className="code-editor-tabs">
                        <button
                            className={`code-tab ${activeTab === 'files' ? 'active' : ''}`}
                            onClick={() => setActiveTab('files')}
                        >
                            <FolderOpen size={16} />
                            <span>Files</span>
                        </button>
                        <button
                            className={`code-tab ${activeTab === 'preview' ? 'active' : ''}`}
                            onClick={() => {
                                setActiveTab('preview');
                                setTimeout(refreshPreview, 100);
                            }}
                        >
                            <Eye size={16} />
                            <span>Preview</span>
                        </button>
                    </div>

                    {/* Content */}
                    <div className="code-editor-content">
                        {activeTab === 'files' ? (
                            <>
                                {/* File List */}
                                <div className="code-file-list">
                                    {files.map((file, index) => (
                                        <button
                                            key={index}
                                            className={`code-file-item ${selectedFileIndex === index ? 'active' : ''}`}
                                            onClick={() => setSelectedFileIndex(index)}
                                        >
                                            <FileCode size={16} />
                                            <span>{file.name}</span>
                                        </button>
                                    ))}
                                </div>

                                {/* Editor */}
                                <div className="code-editor-wrapper">
                                    <div className="code-editor-file-header">
                                        <span>{currentFile?.name}</span>
                                        <div className="code-editor-file-actions">
                                            <button onClick={handleCopy} title="Kopyala">
                                                {copied ? <Check size={16} color="#4ade80" /> : <Copy size={16} />}
                                            </button>
                                            <button onClick={handleDownload} title="İndir">
                                                <Download size={16} />
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
                                            padding: { top: 10 }
                                        }}
                                    />
                                </div>
                            </>
                        ) : (
                            <div className="code-preview-wrapper">
                                <div className="code-preview-header">
                                    <span>Live Preview</span>
                                    <button onClick={refreshPreview} title="Yenile">
                                        <RefreshCw size={16} />
                                    </button>
                                </div>
                                <iframe
                                    ref={iframeRef}
                                    className="code-preview-iframe"
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
