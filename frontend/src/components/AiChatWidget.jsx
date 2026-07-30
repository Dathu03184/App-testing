import React, { useState, useRef, useEffect } from 'react';
import { Bot, X, Send, Sparkles, RotateCcw, ChevronDown } from 'lucide-react';
import { api } from '../utils/api';

const SUGGESTIONS = [
  'What is the NIHSS scale?',
  'Explain TOAST classification',
  'Signs of hemorrhagic stroke?',
  'When to use tPA?',
];

export default function AiChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: '👋 Hi! I\'m **NeuroAI**, your clinical assistant. Ask me anything about stroke management, NIHSS scoring, treatment protocols, or patient care.',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const endRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [open]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const sendMessage = async (text) => {
    const trimmed = (text || input).trim();
    if (!trimmed || loading) return;
    setInput('');

    const userMsg = { role: 'user', content: trimmed };
    const history = [...messages, userMsg];
    setMessages(history);
    setLoading(true);

    try {
      const data = await api.aiChat(trimmed, messages.slice(-8));
      const reply = data.reply || data.message || 'Sorry, I could not process your request.';
      setMessages([...history, { role: 'assistant', content: reply }]);
    } catch {
      setMessages([...history, {
        role: 'assistant',
        content: '⚠️ I\'m having trouble connecting to the AI service right now. Please try again shortly.',
      }]);
    } finally {
      setLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([{
      role: 'assistant',
      content: '👋 Hi! I\'m **NeuroAI**, your clinical assistant. Ask me anything about stroke management, NIHSS scoring, treatment protocols, or patient care.',
    }]);
  };

  // Simple markdown bold renderer
  const renderContent = (text) => {
    const parts = text.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((p, i) =>
      p.startsWith('**') && p.endsWith('**')
        ? <strong key={i}>{p.slice(2, -2)}</strong>
        : <span key={i}>{p}</span>
    );
  };

  return (
    <>
      {/* Floating Toggle Button */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          position: 'fixed',
          top: '1.2rem',
          right: '1.5rem',
          zIndex: 10000,
          width: '48px',
          height: '48px',
          borderRadius: '50%',
          border: 'none',
          background: open
            ? 'rgba(30,30,40,0.9)'
            : 'linear-gradient(135deg, #059669, #34d399)',
          color: '#fff',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: open
            ? '0 4px 20px rgba(0,0,0,0.4)'
            : '0 4px 20px rgba(5,150,105,0.5)',
          transition: 'all 0.3s cubic-bezier(0.4,0,0.2,1)',
          transform: open ? 'rotate(0deg)' : 'rotate(0deg)',
        }}
        title={open ? 'Close AI Assistant' : 'Open AI Assistant'}
      >
        {open ? <ChevronDown size={20} /> : <Bot size={22} />}
      </button>

      {/* Chat Panel */}
      <div style={{
        position: 'fixed',
        top: '4.5rem',
        right: '1.5rem',
        zIndex: 9999,
        width: '380px',
        height: open ? '520px' : '0px',
        opacity: open ? 1 : 0,
        pointerEvents: open ? 'auto' : 'none',
        overflow: 'hidden',
        borderRadius: '20px',
        boxShadow: '0 24px 60px rgba(0,0,0,0.3)',
        border: open ? '1px solid rgba(255,255,255,0.1)' : 'none',
        transition: 'height 0.35s cubic-bezier(0.4,0,0.2,1), opacity 0.25s ease',
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--surface, #1e1e2e)',
      }}>
        {/* Header */}
        <div style={{
          padding: '1rem 1.2rem',
          background: 'linear-gradient(135deg, #059669 0%, #0d9488 100%)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          flexShrink: 0,
        }}>
          <div style={{
            width: '36px', height: '36px', borderRadius: '50%',
            background: 'rgba(255,255,255,0.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Sparkles size={18} color="#fff" />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ color: '#fff', fontWeight: '800', fontSize: '0.95rem', lineHeight: 1.2 }}>NeuroAI Assistant</div>
            <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.72rem', fontWeight: '600' }}>
              {loading ? '✦ Thinking...' : '✦ Clinical AI · Always available'}
            </div>
          </div>
          <button
            onClick={clearChat}
            title="Clear chat"
            style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.7)', cursor: 'pointer', padding: '4px' }}
          >
            <RotateCcw size={16} />
          </button>
          <button
            onClick={() => setOpen(false)}
            style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.7)', cursor: 'pointer', padding: '4px' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Messages */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '1rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem',
          scrollbarWidth: 'thin',
          scrollbarColor: 'rgba(255,255,255,0.1) transparent',
        }}>
          {messages.map((msg, i) => (
            <div key={i} style={{
              display: 'flex',
              alignItems: 'flex-end',
              gap: '0.5rem',
              flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
            }}>
              {/* Avatar */}
              <div style={{
                width: '28px', height: '28px', borderRadius: '50%', flexShrink: 0,
                background: msg.role === 'user'
                  ? 'linear-gradient(135deg,#059669,#34d399)'
                  : 'linear-gradient(135deg,#6366f1,#8b5cf6)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.7rem', fontWeight: '800', color: '#fff',
              }}>
                {msg.role === 'user' ? 'U' : <Sparkles size={12} />}
              </div>
              {/* Bubble */}
              <div style={{
                maxWidth: '82%',
                padding: '0.7rem 1rem',
                borderRadius: msg.role === 'user' ? '16px 4px 16px 16px' : '4px 16px 16px 16px',
                background: msg.role === 'user'
                  ? 'linear-gradient(135deg,#059669,#0d9488)'
                  : 'rgba(255,255,255,0.06)',
                border: msg.role === 'assistant' ? '1px solid rgba(255,255,255,0.08)' : 'none',
                color: '#fff',
                fontSize: '0.85rem',
                lineHeight: 1.55,
                fontWeight: '500',
              }}>
                {renderContent(msg.content)}
              </div>
            </div>
          ))}

          {loading && (
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.5rem' }}>
              <div style={{
                width: '28px', height: '28px', borderRadius: '50%',
                background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Sparkles size={12} color="#fff" />
              </div>
              <div style={{
                padding: '0.7rem 1rem',
                borderRadius: '4px 16px 16px 16px',
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.08)',
                display: 'flex', gap: '4px', alignItems: 'center',
              }}>
                {[0,1,2].map(d => (
                  <div key={d} style={{
                    width: '6px', height: '6px', borderRadius: '50%',
                    background: '#34d399',
                    animation: `bounce 1.2s ease-in-out ${d * 0.2}s infinite`,
                  }} />
                ))}
              </div>
            </div>
          )}
          <div ref={endRef} />
        </div>

        {/* Suggestions */}
        {messages.length <= 1 && (
          <div style={{
            padding: '0 1rem 0.5rem',
            display: 'flex', flexWrap: 'wrap', gap: '0.4rem',
          }}>
            {SUGGESTIONS.map(s => (
              <button
                key={s}
                onClick={() => sendMessage(s)}
                style={{
                  padding: '0.3rem 0.7rem', fontSize: '0.72rem', fontWeight: '700',
                  borderRadius: '20px', border: '1px solid rgba(5,150,105,0.4)',
                  background: 'rgba(5,150,105,0.1)', color: '#34d399',
                  cursor: 'pointer', transition: 'all 0.2s',
                }}
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        <div style={{
          padding: '0.85rem 1rem',
          borderTop: '1px solid rgba(255,255,255,0.08)',
          display: 'flex', gap: '0.6rem', alignItems: 'center',
          flexShrink: 0,
        }}>
          <input
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
            placeholder="Ask about stroke, NIHSS, treatment..."
            style={{
              flex: 1, padding: '0.6rem 1rem', borderRadius: '12px',
              border: '1px solid rgba(255,255,255,0.12)',
              background: 'rgba(255,255,255,0.06)',
              color: '#fff', fontSize: '0.85rem', outline: 'none',
            }}
          />
          <button
            onClick={() => sendMessage()}
            disabled={!input.trim() || loading}
            style={{
              width: '36px', height: '36px', borderRadius: '50%', border: 'none',
              background: input.trim() && !loading
                ? 'linear-gradient(135deg,#059669,#34d399)'
                : 'rgba(255,255,255,0.08)',
              color: '#fff', cursor: input.trim() && !loading ? 'pointer' : 'not-allowed',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.2s', flexShrink: 0,
            }}
          >
            <Send size={15} />
          </button>
        </div>
      </div>

      <style>{`
        @keyframes bounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-5px); }
        }
      `}</style>
    </>
  );
}
