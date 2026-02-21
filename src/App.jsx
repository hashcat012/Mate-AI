import React, { useState, useEffect, useRef } from 'react';
import { auth, db } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, addDoc, serverTimestamp, doc, updateDoc, getDoc } from 'firebase/firestore';
import { MessageCircleDashed, MessageCirclePlus, PanelLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from './components/Sidebar';
import Chat from './components/Chat';
import PromptBar from './components/PromptBar';
import Auth from './components/Auth';
import VoiceChat from './components/VoiceChat';
import Profile from './components/Profile';
import { getAICompletion } from './services/ai';
import './App.css';
import './components/Sidebar.css';
import './components/Chat.css';
import './components/PromptBar.css';
import './components/Auth.css';
import './components/VoiceChat.css';
import './components/Profile.css';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState([]);
  const [isInitial, setIsInitial] = useState(true);
  const [voiceMode, setVoiceMode] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isIncognito, setIsIncognito] = useState(false);

  // AI Persona state
  const [persona, setPersona] = useState(() => {
    const saved = localStorage.getItem('mate_ai_persona');
    return saved ? JSON.parse(saved) : { id: 'normal', name: 'Normal', prompt: 'Sen yardımsever, zeki ve dürüst bir yapay zeka asistanısın.' };
  });

  const chatIdRef = useRef(null);
  const messagesRef = useRef([]);

  useEffect(() => { messagesRef.current = messages; }, [messages]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
      if (!u) {
        resetChat();
        setIsIncognito(false);
      }
    });
    return () => unsubscribe();
  }, []);

  const resetChat = () => {
    chatIdRef.current = null;
    setMessages([]);
    setIsInitial(true);
    setIsIncognito(false);
  };

  const handleSendMessage = async (text) => {
    if (!user) { setShowAuth(true); return; }

    const currentMessages = messages;
    const isFirst = !chatIdRef.current && !isIncognito;
    const isFirstIncognito = !chatIdRef.current && isIncognito;

    if (isFirst || isFirstIncognito) setIsInitial(false);

    // Build AI history with PERSONA as system prompt
    const aiMessages = [
      { role: 'system', content: persona.prompt },
      ...currentMessages.map(m => ({
        role: m.sender === 'user' ? 'user' : 'assistant',
        content: m.text
      })),
      { role: 'user', content: text }
    ];

    setMessages(prev => [...prev, { text, sender: 'user', timestamp: new Date() }]);

    const aiText = await getAICompletion(aiMessages).catch(e => "Hata: " + e.message);
    setMessages(prev => [...prev, { text: aiText, sender: 'ai', timestamp: new Date() }]);

    if (!isIncognito) {
      saveToFirestore(isFirst, text, aiText, currentMessages);
    }
  };

  const saveToFirestore = async (isFirst, userText, aiText, previousMessages) => {
    try {
      let currentChatId = chatIdRef.current;
      if (isFirst) {
        const titleResponse = await getAICompletion([
          { role: 'system', content: 'Sadece 2-4 kelimelik kısa Türkçe bir başlık yaz. Başka hiçbir şey ekleme.' },
          { role: 'user', content: userText }
        ]);
        const title = titleResponse?.trim().replace(/^"|"$/g, '').slice(0, 50) || userText.slice(0, 35);
        const ref = await addDoc(collection(db, 'chats'), {
          userId: user.uid,
          title,
          createdAt: serverTimestamp(),
          pinned: false,
          updatedAt: serverTimestamp()
        });
        currentChatId = ref.id;
        chatIdRef.current = currentChatId;
      }
      const allMsgs = [
        ...previousMessages,
        { text: userText, sender: 'user' },
        { text: aiText, sender: 'ai' }
      ];
      await updateDoc(doc(db, 'chats', currentChatId), {
        messages: allMsgs.map(m => ({ text: m.text, sender: m.sender })),
        updatedAt: serverTimestamp()
      });
    } catch (e) {
      console.error("[Firebase] Kayıt hatası:", e);
    }
  };

  const handleRegenerate = async (aiMsgIndex) => {
    const msgs = messagesRef.current;
    let userText = null;
    for (let i = aiMsgIndex - 1; i >= 0; i--) {
      if (msgs[i].sender === 'user') { userText = msgs[i].text; break; }
    }
    if (!userText) return;
    setMessages(prev => prev.filter((_, i) => i !== aiMsgIndex));
    const history = [
      { role: 'system', content: persona.prompt },
      ...msgs.slice(0, aiMsgIndex).map(m => ({
        role: m.sender === 'user' ? 'user' : 'assistant',
        content: m.text
      }))
    ];
    const newAiText = await getAICompletion(history).catch(e => 'Hata: ' + e.message);
    setMessages(prev => {
      const updated = [...prev];
      updated.splice(aiMsgIndex, 0, { text: newAiText, sender: 'ai', timestamp: new Date() });
      return updated;
    });
  };

  const handleNewChat = () => {
    chatIdRef.current = null;
    setMessages([]);
    setIsInitial(true);
    setIsIncognito(false);
  };

  const handleSelectChat = async (id) => {
    chatIdRef.current = id;
    setIsInitial(false);
    setIsIncognito(false);
    try {
      const chatDoc = await getDoc(doc(db, 'chats', id));
      if (chatDoc.exists()) {
        const data = chatDoc.data();
        setMessages(data.messages?.map(m => ({ ...m, timestamp: new Date() })) || []);
      }
    } catch (e) { setMessages([]); }
  };

  const handleIncognito = () => {
    if (isIncognito) {
      if (messages.length === 0) {
        // Toggle back to normal if empty
        handleNewChat();
      } else {
        // If has messages, create a NEW NORMAL chat (user request)
        handleNewChat();
      }
    } else {
      // Enter incognito
      chatIdRef.current = null;
      setMessages([]);
      setIsInitial(true);
      setIsIncognito(true);
    }
  };

  const savePersona = (newPersona) => {
    setPersona(newPersona);
    localStorage.setItem('mate_ai_persona', JSON.stringify(newPersona));
  };

  if (loading) return <div className="loading-screen">Mate AI</div>;

  return (
    <div className={`app-container ${user ? 'logged-in' : 'anonymous'}`}>
      <AnimatePresence>
        {user && sidebarOpen && (
          <Sidebar
            user={user}
            onNewChat={handleNewChat}
            onSelectChat={handleSelectChat}
            onClose={() => setSidebarOpen(false)}
            onProfileClick={() => setShowProfile(true)}
          />
        )}
      </AnimatePresence>

      <main className="main-content">
        <div className="topbar">
          {user && !sidebarOpen && (
            <motion.button
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="icon-btn topbar-btn"
              onClick={() => setSidebarOpen(true)}
              title="Kenar Çubuğunu Aç"
            >
              <PanelLeft size={18} />
            </motion.button>
          )}

          <div className="topbar-right">
            {isIncognito && (
              <span className="incognito-badge">
                <MessageCircleDashed size={14} /> Geçici Sohbet
              </span>
            )}
            {user && (
              <button
                className={`icon-btn topbar-btn ghost-btn ${isIncognito ? 'active' : ''}`}
                onClick={handleIncognito}
                title={isIncognito && messages.length > 0 ? "Yeni Normal Sohbet" : (isIncognito ? "Normal Moda Dön" : "Geçici Sohbet")}
              >
                {isIncognito && messages.length > 0 ? (
                  <MessageCirclePlus size={20} />
                ) : (
                  <MessageCircleDashed size={20} />
                )}
              </button>
            )}
            {!user && (
              <button className="sign-in-btn" onClick={() => setShowAuth(true)}>
                Sign In
              </button>
            )}
          </div>
        </div>

        {showAuth && !user && <Auth onClose={() => setShowAuth(false)} />}

        <AnimatePresence>
          {showProfile && user && (
            <Profile
              user={user}
              currentPersona={persona}
              onSavePersona={savePersona}
              onClose={() => setShowProfile(false)}
            />
          )}
        </AnimatePresence>

        <Chat messages={messages} isInitial={isInitial} onRegenerate={handleRegenerate} />
        <PromptBar onSend={handleSendMessage} isInitial={isInitial} setVoiceMode={setVoiceMode} />
        {voiceMode && <VoiceChat onSend={handleSendMessage} onClose={() => setVoiceMode(false)} />}
      </main>
    </div>
  );
}

export default App;
