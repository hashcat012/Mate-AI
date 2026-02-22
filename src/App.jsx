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
import CodeEditorSidebar from './components/CodeEditorSidebar';
import { getAICompletion } from './services/ai';
import './App.css';
import './components/Sidebar.css';
import './components/Chat.css';
import './components/PromptBar.css';
import './components/Auth.css';
import './components/VoiceChat.css';
import './components/Profile.css';
import './components/CodeEditorSidebar.css';

// Parse code blocks from AI response
const parseCodeBlocks = (text) => {
  const codeBlockRegex = /```(\w+)?\s*\n?([\s\S]*?)```/g;
  const files = [];
  let match;
  let htmlCount = 0;
  let cssCount = 0;
  let jsCount = 0;
  let otherCount = 0;

  while ((match = codeBlockRegex.exec(text)) !== null) {
    const language = (match[1] || 'text').toLowerCase();
    const code = match[2].trim();

    if (!code) continue;

    // Determine filename based on language
    let filename;

    if (language === 'html') {
      filename = htmlCount === 0 ? 'index.html' : `page${htmlCount + 1}.html`;
      htmlCount++;
    } else if (language === 'css') {
      filename = cssCount === 0 ? 'style.css' : `style${cssCount + 1}.css`;
      cssCount++;
    } else if (language === 'javascript' || language === 'js') {
      filename = jsCount === 0 ? 'script.js' : `script${jsCount + 1}.js`;
      jsCount++;
    } else if (language === 'typescript' || language === 'ts') {
      filename = jsCount === 0 ? 'script.ts' : `script${jsCount + 1}.ts`;
      jsCount++;
    } else if (language === 'python' || language === 'py') {
      filename = 'main.py';
    } else if (language === 'json') {
      filename = 'data.json';
    } else if (language === 'react' || language === 'jsx') {
      filename = 'Component.jsx';
    } else if (language === 'tsx') {
      filename = 'Component.tsx';
    } else {
      filename = `code.${language}`;
    }

    files.push({ name: filename, code, language });
  }

  return files;
};

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
  const [codeEditorOpen, setCodeEditorOpen] = useState(false);
  const [codeFiles, setCodeFiles] = useState([]);

  // Settings state
  const [persona, setPersona] = useState(() => {
    const saved = localStorage.getItem('mate_ai_persona');
    return saved ? JSON.parse(saved) : { id: 'normal', name: 'Normal', prompt: 'Sen yardımsever, zeki ve dürüst bir yapay zeka asistanısın. Kullanıcı senden uygulama, website, oyun veya herhangi bir kod tabanlı proje yapmanı istediğinde, hemen kod yazmaya başla. Asla "bilgi vermem gerekiyor" veya "detayları belirleyelim" gibi şeyler söyleme. Doğrudan çalışan, tam kod yaz. HTML, CSS, JavaScript kullanarak tam çalışan uygulamalar oluştur.' };
  });

  const [language, setLanguage] = useState(() => {
    return localStorage.getItem('mate_ai_language') || 'tr-TR';
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

  const handleSendMessage = async (text, attachments = []) => {
    if (!user) { setShowAuth(true); return; }

    const currentMessages = messages;
    const isFirst = !chatIdRef.current && !isIncognito;
    const isFirstIncognito = !chatIdRef.current && isIncognito;

    if (isFirst || isFirstIncognito) setIsInitial(false);

    // Build message content for display
    let messageContent = text;
    if (attachments.length > 0) {
      const attachmentNames = attachments.map(a => a.name).join(', ');
      messageContent = text + (text ? ' ' : '') + `[${attachmentNames}]`;
    }

    const aiMessages = [
      { role: 'system', content: persona.prompt + ` Lütfen şu dilde yanıt ver: ${language}` },
      ...currentMessages.map(m => ({
        role: m.sender === 'user' ? 'user' : 'assistant',
        content: m.text
      })),
      { role: 'user', content: text || 'Bu görseli/görselleri analiz et.' }
    ];

    setMessages(prev => [...prev, {
      text: messageContent,
      sender: 'user',
      timestamp: new Date(),
      attachments: attachments.length > 0 ? attachments.map(a => ({
        name: a.name,
        type: a.type,
        preview: a.preview,
        file: a.file
      })) : undefined
    }]);

    // Pass attachments to AI for vision processing
    const aiText = await getAICompletion(aiMessages, attachments).catch(e => "Hata: " + e.message);
    setMessages(prev => [...prev, { text: aiText, sender: 'ai', timestamp: new Date() }]);

    // Auto-open code editor if response contains code blocks
    const files = parseCodeBlocks(aiText);
    if (files.length > 0) {
      setCodeFiles(files);
      setCodeEditorOpen(true);
    }

    if (!isIncognito) {
      saveToFirestore(isFirst, messageContent, aiText, currentMessages);
    }
  };

  const handleVoiceSync = (userText, aiText) => {
    const currentMessages = messagesRef.current;
    const isFirst = !chatIdRef.current && !isIncognito;

    if (isFirst) setIsInitial(false);

    setMessages(prev => [
      ...prev,
      { text: userText, sender: 'user', timestamp: new Date() },
      { text: aiText, sender: 'ai', timestamp: new Date() }
    ]);

    if (!isIncognito) {
      saveToFirestore(isFirst, userText, aiText, currentMessages);
    }
  };

  const saveToFirestore = async (isFirst, userText, aiText, previousMessages) => {
    try {
      let currentChatId = chatIdRef.current;
      if (isFirst) {
        const titleResponse = await getAICompletion([
          { role: 'system', content: 'Sadece 2-4 kelimelik kısa bir başlık yaz. Başka hiçbir şey ekleme.' },
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
      { role: 'system', content: persona.prompt + ` Lütfen şu dilde yanıt ver: ${language}` },
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
      handleNewChat();
    } else {
      chatIdRef.current = null;
      setMessages([]);
      setIsInitial(true);
      setIsIncognito(true);
    }
  };

  const handleSaveSettings = ({ persona: newPersona, language: newLang }) => {
    setPersona(newPersona);
    setLanguage(newLang);
    localStorage.setItem('mate_ai_persona', JSON.stringify(newPersona));
    localStorage.setItem('mate_ai_language', newLang);
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

      <AnimatePresence>
        {user && !sidebarOpen && (
          <motion.button
            key="sidebar-toggle-fixed"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            transition={{
              delay: 0.5,
              duration: 0.3,
              type: 'spring',
              damping: 15
            }}
            className="icon-btn topbar-btn sidebar-toggle-fixed"
            onClick={() => setSidebarOpen(true)}
            title="Kenar Çubuğunu Aç"
          >
            <PanelLeft size={20} />
          </motion.button>
        )}
      </AnimatePresence>

      <main className="main-content">
        <div className="topbar">
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
                  <MessageCirclePlus size={22} />
                ) : (
                  <MessageCircleDashed size={22} />
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
              currentLanguage={language}
              onSaveSettings={handleSaveSettings}
              onClose={() => setShowProfile(false)}
            />
          )}
        </AnimatePresence>

        <Chat messages={messages} isInitial={isInitial} onRegenerate={handleRegenerate} onOpenCodeEditor={(text) => {
          const files = parseCodeBlocks(text);
          if (files.length > 0) {
            setCodeFiles(files);
            setCodeEditorOpen(true);
          }
        }} />
        <PromptBar onSend={handleSendMessage} isInitial={isInitial} setVoiceMode={setVoiceMode} />

      </main>

      <AnimatePresence>
        {voiceMode && (
          <VoiceChat
            messages={messages}
            persona={persona}
            language={language}
            onSend={handleVoiceSync}
            onClose={() => setVoiceMode(false)}
          />
        )}
      </AnimatePresence>

      <CodeEditorSidebar
        isOpen={codeEditorOpen}
        onClose={() => setCodeEditorOpen(false)}
        files={codeFiles}
      />
    </div>
  );
}

export default App;
