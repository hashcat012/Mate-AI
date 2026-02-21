import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, Save, Trash2, LogOut, Sparkles, Send } from 'lucide-react';
import { updateProfile, deleteUser, signOut } from 'firebase/auth';

const personas = [
    { id: 'normal', name: 'Normal', prompt: 'Sen yardımsever, zeki ve dürüst bir yapay zeka asistanısın.' },
    { id: 'genius', name: 'Zeki & Analitik', prompt: 'Sen son derece zeki, analitik ve detaylara odaklanan bir bilim insanı gibisin. Teknik terimler kullanmaktan çekinme.' },
    { id: 'blunt', name: 'Sert & Dobra', prompt: 'Sen çok dobra, kısa ve öz konuşan birisin. Lafı hiç dolandırmazsın, bazen sert olabilirsin.' },
    { id: 'funny', name: 'Eğlenceli & Esprili', prompt: 'Sen çok eğlenceli, esprili ve sürekli şaka yapan bir asistansın. Her cevabında mizah olsun.' },
    { id: 'polite', name: 'Kibar & Yardımsever', prompt: 'Sen son derece kibar, nazik ve her zaman "efendim" diyen, çok yardımcı bir asistansın.' }
];

const Profile = ({ user, currentPersona, onSavePersona, onClose }) => {
    const [displayName, setDisplayName] = useState(user?.displayName || '');
    const [selectedPersona, setSelectedPersona] = useState(currentPersona?.id || 'normal');
    const [customPrompt, setCustomPrompt] = useState(currentPersona?.id === 'custom' ? currentPersona.prompt : '');
    const [isSaving, setIsSaving] = useState(false);

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

            onSavePersona(personaData);
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
                    {/* Ad Değiştirme */}
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

                    {/* AI Kişilik Seçimi */}
                    <div className="profile-section-group">
                        <label>Mate AI Kişiliği</label>
                        <div className="persona-grid">
                            {personas.map((p) => (
                                <button
                                    key={p.id}
                                    className={`persona-card ${selectedPersona === p.id ? 'active' : ''}`}
                                    onClick={() => setSelectedPersona(p.id)}
                                >
                                    <div className="persona-info">
                                        <span className="p-name">{p.name}</span>
                                        {selectedPersona === p.id && <Sparkles size={14} className="sparkle" />}
                                    </div>
                                </button>
                            ))}
                        </div>

                        {/* Custom Persona Area (Prompt Bar style) */}
                        <div className="custom-persona-wrapper">
                            <div className={`custom-persona-input-container ${selectedPersona === 'custom' ? 'active' : ''}`}>
                                <textarea
                                    className="custom-persona-textarea"
                                    placeholder="Özel kişilik ayarla... (Örn: Sen bir tarih profesörüsün)"
                                    value={customPrompt}
                                    onChange={(e) => {
                                        setCustomPrompt(e.target.value);
                                        setSelectedPersona('custom');
                                    }}
                                />
                                <div className="custom-persona-action">
                                    <div className={`persona-type-badge ${selectedPersona === 'custom' ? 'visible' : ''}`}>
                                        <Sparkles size={12} /> Özel Mod
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Aksiyon Butonları */}
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
