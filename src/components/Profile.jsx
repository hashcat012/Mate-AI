import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, Save, Trash2, LogOut, Sparkles, ChevronDown } from 'lucide-react';
import { updateProfile, deleteUser, signOut } from 'firebase/auth';

const personas = [
    { id: 'normal', name: 'Klasik', prompt: 'Sen yardımsever, zeki ve dürüst bir yapay zeka asistanısın. Kullanıcı senden uygulama, website, oyun, sayfa, buton, form, menü, slider, galeri, hesap makinesi, saat, takvim, liste, tablo, kart, modal, popup, animasyon, efekt, tasarım, şablon, tema, component, fonksiyon, script, program, tool, araç, oyun veya herhangi bir dijital ürün yapmanı istediğinde, hemen kod yazmaya başla. Doğrudan çalışan, tam kod yaz.' },
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

const Profile = ({ user, currentPersona, currentLanguage, onSaveSettings, onClose }) => {
    const [displayName, setDisplayName] = useState(user?.displayName || '');
    const [selectedPersona, setSelectedPersona] = useState(currentPersona?.id || 'normal');
    const [customPrompt, setCustomPrompt] = useState(currentPersona?.id === 'custom' ? currentPersona.prompt : '');
    const [selectedLanguage, setSelectedLanguage] = useState(currentLanguage || 'tr-TR');
    const [isSaving, setIsSaving] = useState(false);
    const [langOpen, setLangOpen] = useState(false);
    const [personaOpen, setPersonaOpen] = useState(false);

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

            onSaveSettings({ persona: personaData, language: selectedLanguage });
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
                                className="pill-selector-btn liquid-glass"
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
                                        className="pill-dropdown liquid-glass"
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

                    {/* Persona Selector - Pill Style */}
                    <div className="profile-section-group">
                        <label>Mate AI Kişiliği</label>
                        <div className="pill-selector-wrapper">
                            <button
                                className="pill-selector-btn liquid-glass"
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
                                        className="pill-dropdown liquid-glass"
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
                                                    if (p.id !== 'custom') setPersonaOpen(false);
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
