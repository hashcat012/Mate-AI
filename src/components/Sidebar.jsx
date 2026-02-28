import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, User, LogOut, MoreVertical, Trash2, Edit2, Pin, X, PanelLeft, Settings } from 'lucide-react';
import { auth, db } from '../firebase';
import { signOut } from 'firebase/auth';
import { collection, query, onSnapshot, deleteDoc, updateDoc, doc, where } from 'firebase/firestore';

const Sidebar = ({ user, onNewChat, onSelectChat, onClose, onProfileClick }) => {
    const [chats, setChats] = useState([]);
    const [activeMenu, setActiveMenu] = useState(null);
    const [editingId, setEditingId] = useState(null);
    const [editTitle, setEditTitle] = useState('');
    const [activeId, setActiveId] = useState(null);

    useEffect(() => {
        if (!user) return;

        const q = query(
            collection(db, 'chats'),
            where('userId', '==', user.uid)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const chatData = snapshot.docs.map(d => ({
                id: d.id,
                ...d.data()
            }));
            // Sort: pinned first, then by createdAt desc
            chatData.sort((a, b) => {
                if (a.pinned && !b.pinned) return -1;
                if (!a.pinned && b.pinned) return 1;
                const aTime = a.createdAt?.toMillis?.() || 0;
                const bTime = b.createdAt?.toMillis?.() || 0;
                return bTime - aTime;
            });
            setChats(chatData);
        });

        return () => unsubscribe();
    }, [user]);

    const handleDeleteChat = async (e, id) => {
        e.stopPropagation();
        await deleteDoc(doc(db, 'chats', id));
        if (activeId === id) {
            setActiveId(null);
            onNewChat?.();
        }
        setActiveMenu(null);
    };

    const handleTogglePin = async (e, id, currentPinned) => {
        e.stopPropagation();
        await updateDoc(doc(db, 'chats', id), { pinned: !currentPinned });
        setActiveMenu(null);
    };

    const startEditing = (e, chat) => {
        e.stopPropagation();
        setEditingId(chat.id);
        setEditTitle(chat.title);
        setActiveMenu(null);
    };

    const handleRename = async (e, id) => {
        if (e.key === 'Enter') {
            await updateDoc(doc(db, 'chats', id), { title: editTitle });
            setEditingId(null);
        }
        if (e.key === 'Escape') setEditingId(null);
    };

    const handleSelectChat = (id) => {
        setActiveId(id);
        onSelectChat?.(id);
    };

    const handleLogout = async () => {
        await signOut(auth);
        // Reset handled by App.jsx via onAuthStateChanged
    };

    // Close menu on outside click
    const handleBackdropClick = () => setActiveMenu(null);

    return (
        <motion.aside
            initial={{ x: -320, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -320, opacity: 0 }}
            transition={{ type: 'spring', damping: 28, stiffness: 200 }}
            className="sidebar liquid-glass"
        >
            {/* Header */}
            <div className="sidebar-header">
                <div className="logo-wrapper">
                    {/* Rounded triangle logo icon */}
                    <svg className="logo-flower" width="20" height="18" viewBox="0 0 100 90" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path
                            d="M50 8 L92 82 Q92 88 86 88 L14 88 Q8 88 8 82 Z"
                            stroke="currentColor"
                            strokeWidth="13"
                            strokeLinejoin="round"
                            strokeLinecap="round"
                            fill="none"
                        />
                    </svg>
                    <h1 className="logo-text">Mate AI</h1>
                </div>
                <div className="sidebar-header-actions">
                    <button className="icon-btn" onClick={() => onNewChat?.()} title="Yeni Sohbet">
                        <Plus size={18} />
                    </button>
                    <button className="icon-btn" onClick={() => onClose?.()} title="Kenar Çubuğunu Kapat">
                        <PanelLeft size={18} />
                    </button>
                </div>
            </div>

            {/* Chat List */}
            <div className="chats-container" onClick={handleBackdropClick}>
                {chats.length === 0 ? (
                    <div className="no-chats">Henüz sohbet yok</div>
                ) : (
                    chats.map((chat) => (
                        <div
                            key={chat.id}
                            className={`chat-item ${chat.pinned ? 'pinned' : ''} ${activeId === chat.id ? 'active' : ''}`}
                            onClick={() => handleSelectChat(chat.id)}
                            onContextMenu={(e) => {
                                e.preventDefault();
                                setActiveMenu(chat.id);
                            }}
                        >
                            {/* Title — no icon */}
                            {editingId === chat.id ? (
                                <input
                                    className="rename-input"
                                    value={editTitle}
                                    onChange={(e) => setEditTitle(e.target.value)}
                                    onKeyDown={(e) => handleRename(e, chat.id)}
                                    onBlur={() => setEditingId(null)}
                                    autoFocus
                                    onClick={(e) => e.stopPropagation()}
                                />
                            ) : (
                                <span className="chat-title">
                                    {chat.pinned && <Pin size={10} className="pin-icon-inline" />}
                                    {chat.title}
                                </span>
                            )}

                            <button
                                className="more-btn"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setActiveMenu(activeMenu === chat.id ? null : chat.id);
                                }}
                            >
                                <MoreVertical size={14} />
                            </button>

                            <AnimatePresence>
                                {activeMenu === chat.id && (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.92, y: -4 }}
                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.92, y: -4 }}
                                        transition={{ duration: 0.15 }}
                                        className="chat-options-menu liquid-glass"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <button className="option-item" onClick={(e) => handleTogglePin(e, chat.id, chat.pinned)}>
                                            <Pin size={13} /> {chat.pinned ? 'Sabiti Kaldır' : 'Sabitle'}
                                        </button>
                                        <button className="option-item" onClick={(e) => startEditing(e, chat)}>
                                            <Edit2 size={13} /> Yeniden Adlandır
                                        </button>
                                        <button className="option-item delete" onClick={(e) => handleDeleteChat(e, chat.id)}>
                                            <Trash2 size={13} /> Sil
                                        </button>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    ))
                )}
            </div>

            {/* Footer */}
            <div className="sidebar-footer">
                <div className="profile-section" onClick={onProfileClick} style={{ cursor: 'pointer' }}>
                    <div className="avatar-wrapper">
                        {user.photoURL ? (
                            <img src={user.photoURL} alt="profile" referrerPolicy="no-referrer" />
                        ) : (
                            <div className="avatar-placeholder">
                                <User size={18} />
                            </div>
                        )}
                    </div>
                    <div className="profile-info">
                        <span className="username">{user.displayName || user.email?.split('@')[0]}</span>
                        <span className="plan">Ayarları Düzenle</span>
                    </div>
                    <div className="settings-icon">
                        <Settings size={16} color="rgba(255,255,255,0.4)" />
                    </div>
                </div>
            </div>
        </motion.aside>
    );
};

export default Sidebar;
