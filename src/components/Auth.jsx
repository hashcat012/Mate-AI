import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { auth } from '../firebase';
import { GoogleAuthProvider, signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { X, Mail, Lock, Chrome } from 'lucide-react';

const Auth = ({ onClose }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isRegister, setIsRegister] = useState(false);
    const [error, setError] = useState('');

    const handleGoogleLogin = async () => {
        try {
            const provider = new GoogleAuthProvider();
            await signInWithPopup(auth, provider);
            onClose();
        } catch (err) {
            setError(err.message);
        }
    };

    const handleEmailAuth = async (e) => {
        e.preventDefault();
        try {
            if (isRegister) {
                await createUserWithEmailAndPassword(auth, email, password);
            } else {
                await signInWithEmailAndPassword(auth, email, password);
            }
            onClose();
        } catch (err) {
            setError(err.message);
        }
    };

    return (
        <div className="auth-overlay">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="auth-modal liquid-glass"
            >
                <button className="close-btn" onClick={onClose}><X size={20} /></button>

                <h2>{isRegister ? 'Hesap Oluştur' : 'Tekrar Hoş Geldin'}</h2>
                <p className="subtitle">Devam etmek için Mate AI hesabına giriş yap.</p>

                <div className="auth-options">
                    <button className="google-btn rounded-full" onClick={handleGoogleLogin}>
                        <Chrome size={20} />
                        Google ile devam et
                    </button>

                    <div className="divider">
                        <span>veya</span>
                    </div>

                    <form onSubmit={handleEmailAuth}>
                        <div className="input-group">
                            <Mail size={18} />
                            <input
                                type="email"
                                placeholder="E-posta"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                        <div className="input-group">
                            <Lock size={18} />
                            <input
                                type="password"
                                placeholder="Şifre"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>
                        {error && <p className="error-text">{error}</p>}
                        <button type="submit" className="submit-btn rounded-full">
                            {isRegister ? 'Kayıt Ol' : 'Giriş Yap'}
                        </button>
                    </form>

                    <p className="toggle-auth">
                        {isRegister ? 'Zaten hesabın var mı?' : 'Hesabın yok mu?'}
                        <button onClick={() => setIsRegister(!isRegister)}>
                            {isRegister ? 'Giriş Yap' : 'Kayıt Ol'}
                        </button>
                    </p>
                </div>
            </motion.div>
        </div>
    );
};

export default Auth;
