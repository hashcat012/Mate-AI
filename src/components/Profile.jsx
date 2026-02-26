import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, Save, Trash2, LogOut, Sparkles, ChevronDown, Sun, Moon } from 'lucide-react';
import { updateProfile, deleteUser, signOut } from 'firebase/auth';

const personas = [
    { id: 'normal', name: 'Klasik', prompt: 'Sen Mate AI\'sın — yardımsever, zeki ve dürüst bir yapay zeka asistanısın. Kullanıcıların sorularını, isteklerini ve konuşmalarını doğal bir şekilde yanıtla. Genel bilgi, tavsiye, analiz, yaratıcı yazarlık, dil, matematik, bilim, tarih ve daha fazlası dahil her konuda yardımcı ol. Kullanıcı açıkça kod yazmanı, uygulama veya program oluşturmanı istemediği sürece kod yazma. Sadece sohbet et, açıkla ve yardımcı ol.' },
    { id: 'genius', name: 'Zeki & Analitik', prompt: 'Sen son derece zeki, analitik ve detaylara odaklanan bir bilim insanı gibisin. Teknik terimler kullanmaktan çekinme. Verilere ve kanıtlara dayalı, mantıklı ve sistematik düşün.' },
    { id: 'funny', name: 'Eğlenceli & Esprili', prompt: 'Sen çok eğlenceli, esprili ve sürekli şaka yapan bir asistansın. Her cevabında mizah olsun. Konuşmayı neşeli ve hafif tut.' },
    { id: 'blunt', name: 'Sert & Dobra', prompt: 'Sen çok dobra, kısa ve öz konuşan birisin. Lafı hiç dolandırmazsın, bazen sert olabilirsin. Gereksiz nezaket yok.' },
    { id: 'custom', name: 'Özel', prompt: '' },
];

const languages = [
    { id: 'tr-TR', name: 'Türkçe', flag: '🇹🇷' },
    { id: 'en-US', name: 'English', flag: '🇺🇸' },
    { id: 'de-DE', name: 'Deutsch', flag: '🇩🇪' },
    { id: 'fr-FR', name: 'Français', flag: '🇫🇷' }
];

const apiOptions = [
    { id: 'default', name: 'Varsayılan' },
    { id: 'custom', name: 'Kendi API\'nizi Girin' }
];

const Profile = ({ user, currentPersona, currentLanguage, currentTheme, currentApiKey, onSaveSettings, onClose }) => {
    const [displayName, setDisplayName] = useState(user?.displayName || '');
    const [selectedPersona, setSelectedPersona] = useState(currentPersona?.id || 'normal');
    const [customPrompt, setCustomPrompt] = useState(currentPersona?.id === 'custom' ? currentPersona.prompt : '');
    const [selectedLanguage, setSelectedLanguage] = useState(currentLanguage || 'tr-TR');
    const [selectedTheme, setSelectedTheme] = useState(currentTheme || 'dark');
    const [selectedApi, setSelectedApi] = useState(currentApiKey ? 'custom' : 'default');
    const [customApiKey, setCustomApiKey] = useState(currentApiKey || '');
    const [isSaving, setIsSaving] = useState(false);
    const [langOpen, setLangOpen] = useState(false);
    const [personaOpen, setPersonaOpen] = useState(false);
    const [apiOpen, setApiOpen] = useState(false);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            if (displayName !== user.displayName) {
                await updateProfile(user, { displayName });
            }

            let personaData;
            if (selectedPersona === 'custom') {
                personaData = { id: 'custom', name: 'Özel', prompt: customPrompt };
            } else {
                const p = personas.find(p => p.id === selectedPersona);
                personaData = p;
            }

            const apiKeyToSave = selectedApi === 'custom' ? customApiKey.trim() : null;
            onSaveSettings({ persona: personaData, language: selectedLanguage, theme: selectedTheme, apiKey: apiKeyToSave });
            onClose();
        } catch (e) {
            console.error(e);
            alert("Hata oluştu: " + e.message);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteAccount = async () => {
        if (window.confirm("Hesabınızı silmek istediğinize emin misiniz? Bu işlem geri alınamaz.")) {
            try {
                await deleteUser(user);
                window.location.reload();
            } catch (e) {
                alert("Lütfen tekrar giriş yaparak bu işlemi yapın (Güvenlik gereği).");
            }
        }
    };

    const currentLang = languages.find(l => l.id === selectedLanguage);
    const currentPersonaObj = personas.find(p => p.id === selectedPersona);
    const currentApiObj = apiOptions.find(a => a.id === selectedApi);

    return (
        <div className="auth-overlay">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="profile-modal liquid-glass"
            >
                <div className="profile-modal-header">
                    <h2>Profil Ayarları</h2>
                    <button className="close-btn" onClick={onClose}><X size={20} /></button>
                </div>

                <div className="profile-scroll-area">
                    <div className="profile-section-group">
                        <label>Görünen Ad</label>
                        <div className="input-group">
                            <User size={18} />
                            <input
                                type="text"
                                placeholder="Adınız"
                                value={displayName}
                                onChange={(e) => setDisplayName(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Language Selector - Pill Style */}
                    <div className="profile-section-group">
                        <label>Dil Seçimi (Sesli & Yazılı)</label>
                        <div className="pill-selector-wrapper">
                            <button
                                className="pill-selector-btn"
                                onClick={() => { setLangOpen(!langOpen); setPersonaOpen(false); }}
                            >
                                <span className="pill-selector-value">
                                    <span className="lang-flag">{currentLang?.flag}</span>
                                    <span>{currentLang?.name}</span>
                                </span>
                                <motion.span
                                    animate={{ rotate: langOpen ? 180 : 0 }}
                                    transition={{ duration: 0.2 }}
                                    className="pill-chevron"
                                >
                                    <ChevronDown size={16} />
                                </motion.span>
                            </button>
                            <AnimatePresence>
                                {langOpen && (
                                    <motion.div
                                        className="pill-dropdown"
                                        initial={{ opacity: 0, y: -8, scaleY: 0.9 }}
                                        animate={{ opacity: 1, y: 0, scaleY: 1 }}
                                        exit={{ opacity: 0, y: -8, scaleY: 0.9 }}
                                        transition={{ duration: 0.18 }}
                                        style={{ transformOrigin: 'top center' }}
                                    >
                                        {languages.map((lang) => (
                                            <button
                                                key={lang.id}
                                                className={`pill-option ${selectedLanguage === lang.id ? 'active' : ''}`}
                                                onClick={() => { setSelectedLanguage(lang.id); setLangOpen(false); }}
                                            >
                                                <span className="lang-flag">{lang.flag}</span>
                                                <span>{lang.name}</span>
                                            </button>
                                        ))}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>

                    {/* Theme Toggle - Dark/Light */}
                    <div className="profile-section-group">
                        <label>Tema</label>
                        <div className="theme-toggle-switch-wrapper">
                            <span className={`theme-icon ${selectedTheme === 'dark' ? 'active' : ''}`}>
                                <Moon size={14} />
                            </span>
                            <button
                                className={`theme-toggle-switch ${selectedTheme}`}
                                onClick={() => setSelectedTheme(selectedTheme === 'dark' ? 'light' : 'dark')}
                                aria-label="Tema değiştir"
                            >
                                <span className="theme-toggle-thumb" />
                            </button>
                            <span className={`theme-icon ${selectedTheme === 'light' ? 'active' : ''}`}>
                                <Sun size={14} />
                            </span>
                        </div>
                    </div>

                    {/* Persona Selector - Pill Style */}
                    <div className="profile-section-group">
                        <label>Mate AI Kişiliği</label>
                        <div className="pill-selector-wrapper">
                            <button
                                className="pill-selector-btn"
                                onClick={() => { setPersonaOpen(!personaOpen); setLangOpen(false); }}
                            >
                                <span className="pill-selector-value">
                                    <Sparkles size={14} />
                                    <span>{currentPersonaObj?.name || 'Klasik'}</span>
                                </span>
                                <motion.span
                                    animate={{ rotate: personaOpen ? 180 : 0 }}
                                    transition={{ duration: 0.2 }}
                                    className="pill-chevron"
                                >
                                    <ChevronDown size={16} />
                                </motion.span>
                            </button>
                            <AnimatePresence>
                                {personaOpen && (
                                    <motion.div
                                        className="pill-dropdown"
                                        initial={{ opacity: 0, y: -8, scaleY: 0.9 }}
                                        animate={{ opacity: 1, y: 0, scaleY: 1 }}
                                        exit={{ opacity: 0, y: -8, scaleY: 0.9 }}
                                        transition={{ duration: 0.18 }}
                                        style={{ transformOrigin: 'top center' }}
                                    >
                                        {personas.map((p) => (
                                            <button
                                                key={p.id}
                                                className={`pill-option ${selectedPersona === p.id ? 'active' : ''}`}
                                                onClick={() => {
                                                    setSelectedPersona(p.id);
                                                    setPersonaOpen(false);
                                                }}
                                            >
                                                <Sparkles size={13} />
                                                <span>{p.name}</span>
                                            </button>
                                        ))}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Custom persona text input */}
                        <AnimatePresence>
                            {selectedPersona === 'custom' && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    transition={{ duration: 0.2 }}
                                    className="custom-persona-wrapper"
                                >
                                    <div className="custom-persona-input-container active">
                                        <textarea
                                            className="custom-persona-textarea"
                                            placeholder="Özel kişilik tanımla... (Örn: Sen bir tarih profesörüsün, her konuyu tarihi örneklerle açıklarsın.)"
                                            value={customPrompt}
                                            onChange={(e) => setCustomPrompt(e.target.value)}
                                            autoFocus
                                        />
                                        <div className="custom-persona-action">
                                            <div className="persona-type-badge visible">
                                                <Sparkles size={12} /> Özel Mod Aktif
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* API Key Selector */}
                    <div className="profile-section-group">
                        <label>API Anahtarı</label>
                        <div className="pill-selector-wrapper">
                            <button
                                className="pill-selector-btn"
                                onClick={() => { setApiOpen(!apiOpen); setLangOpen(false); setPersonaOpen(false); }}
                            >
                                <span className="pill-selector-value">
                                    <span>{currentApiObj?.name || 'Varsayılan (Groq)'}</span>
                                </span>
                                <motion.span
                                    animate={{ rotate: apiOpen ? 180 : 0 }}
                                    transition={{ duration: 0.2 }}
                                    className="pill-chevron"
                                >
                                    <ChevronDown size={16} />
                                </motion.span>
                            </button>
                            <AnimatePresence>
                                {apiOpen && (
                                    <motion.div
                                        className="pill-dropdown"
                                        initial={{ opacity: 0, y: -8, scaleY: 0.9 }}
                                        animate={{ opacity: 1, y: 0, scaleY: 1 }}
                                        exit={{ opacity: 0, y: -8, scaleY: 0.9 }}
                                        transition={{ duration: 0.18 }}
                                        style={{ transformOrigin: 'top center' }}
                                    >
                                        {apiOptions.map((api) => (
                                            <button
                                                key={api.id}
                                                className={`pill-option ${selectedApi === api.id ? 'active' : ''}`}
                                                onClick={() => {
                                                    setSelectedApi(api.id);
                                                    setApiOpen(false);
                                                }}
                                            >
                                                <span>{api.name}</span>
                                            </button>
                                        ))}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Custom API Key Input */}
                        <AnimatePresence>
                            {selectedApi === 'custom' && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    transition={{ duration: 0.2 }}
                                    className="custom-apikey-wrapper"
                                >
                                    <div className="custom-apikey-input-container active">
                                        <input
                                            type="password"
                                            className="custom-apikey-input"
                                            placeholder="Api anahtarınızı girin..."
                                            value={customApiKey}
                                            onChange={(e) => setCustomApiKey(e.target.value)}
                                            autoFocus
                                        />
                                        <div className="custom-apikey-action">
                                            <div className="apikey-type-badge visible">
                                                <Sparkles size={12} /> Özel API Aktif
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    <div className="profile-actions">
                        <button className="sign-in-btn save-profile-btn" onClick={handleSave} disabled={isSaving}>
                            <Save size={18} />
                            <span>{isSaving ? 'Kaydediliyor...' : 'Ayarları Uygula'}</span>
                        </button>

                        <div className="danger-zone">
                            <button className="danger-btn" onClick={() => signOut(user.auth)}>
                                <LogOut size={16} />
                                <span>Çıkış Yap</span>
                            </button>
                            <button className="danger-btn delete" onClick={handleDeleteAccount}>
                                <Trash2 size={16} />
                                <span>Hesabı Sil</span>
                            </button>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default Profile;
