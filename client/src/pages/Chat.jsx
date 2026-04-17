import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import axios from '../api';
import toast from 'react-hot-toast';
import { Send, Bot, User, RefreshCw } from 'lucide-react';

const LANGUAGE_NAMES = {
  ar: 'Arabic', de: 'German', en: 'English', tr: 'Turkish',
  ru: 'Russian', uk: 'Ukrainian', fr: 'French', fa: 'Persian',
};

export default function Chat() {
  const { t, i18n } = useTranslation();
  const [messages, setMessages] = useState([
    { role: 'assistant', content: t('chat.welcome') },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => { scrollToBottom(); }, [messages]);

  const sessionId = useState(() => {
    let id = localStorage.getItem('sb_session');
    if (!id) { id = `s_${Date.now()}`; localStorage.setItem('sb_session', id); }
    return id;
  })[0];

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg = { role: 'user', content: text };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const res = await axios.post('/api/chat/message', {
        messages: newMessages.map((m) => ({ role: m.role, content: m.content })),
        userLanguage: LANGUAGE_NAMES[i18n.language] || 'English',
      }, { headers: { 'x-session-id': sessionId } });
      setMessages([...newMessages, { role: 'assistant', content: res.data.message }]);
    } catch (err) {
      toast.error(t('chat.error'));
      setMessages([...newMessages, { role: 'assistant', content: t('chat.error') }]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const resetChat = () => {
    setMessages([{ role: 'assistant', content: t('chat.welcome') }]);
    setInput('');
  };

  return (
    <div className="fade-in flex flex-col h-[calc(100vh-10rem)]">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl flex items-center justify-center shadow">
            <Bot size={22} className="text-white" />
          </div>
          <div>
            <h1 className="font-bold text-blue-900 text-lg">{t('chat.title')}</h1>
            <span className="text-xs text-green-600 font-medium">● Online</span>
          </div>
        </div>
        <button
          onClick={resetChat}
          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
          title="Neu starten"
        >
          <RefreshCw size={18} />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 bg-white rounded-2xl p-4 shadow-sm border border-blue-50">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex gap-3 fade-in ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div
              className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-sm ${
                msg.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gradient-to-br from-blue-100 to-indigo-100 text-blue-700'
              }`}
            >
              {msg.role === 'user' ? <User size={16} /> : '🌉'}
            </div>
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                msg.role === 'user'
                  ? 'bg-blue-600 text-white rounded-tr-sm'
                  : 'bg-gray-50 text-gray-800 rounded-tl-sm border border-gray-100'
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}

        {/* Loading indicator */}
        {loading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center text-sm">
              🌉
            </div>
            <div className="bg-gray-50 rounded-2xl rounded-tl-sm px-4 py-3 border border-gray-100">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-blue-400 rounded-full typing-dot" />
                <span className="w-2 h-2 bg-blue-400 rounded-full typing-dot" />
                <span className="w-2 h-2 bg-blue-400 rounded-full typing-dot" />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="mt-4 flex gap-2">
        <textarea
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={t('chat.placeholder')}
          rows={2}
          className="flex-1 resize-none bg-white border border-blue-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
          disabled={loading}
        />
        <button
          onClick={sendMessage}
          disabled={loading || !input.trim()}
          className="w-12 h-12 bg-blue-700 hover:bg-blue-800 disabled:bg-gray-300 text-white rounded-2xl flex items-center justify-center shadow-md transition-all self-end"
        >
          <Send size={18} />
        </button>
      </div>
    </div>
  );
}
