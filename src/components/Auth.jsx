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
                        <svg width="20" height="20" viewBox="0 0 48 48">
                            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                        </svg>
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
