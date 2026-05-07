import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { MessageSquare, X, Send, Bot, User } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

export default function ChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { sender: 'bot', text: '👋 ¡Hola! Soy el asistente virtual del ERP. Puedo darte el **stock de productos** o el **estado de una orden** de reparación. ¿En qué te ayudo?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = input.trim();
    setMessages(prev => [...prev, { sender: 'user', text: userMessage }]);
    setInput('');
    setIsLoading(true);

    try {
      const token = sessionStorage.getItem('access_token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const historyToSend = messages.filter((m, i) => i > 0);

      const response = await axios.post(
        'http://localhost:8000/api/v1/chatbot/',
        { 
          message: userMessage,
          history: historyToSend
        },
        { headers }
      );

      setMessages(prev => [...prev, { sender: 'bot', text: response.data.reply }]);
    } catch (error) {
      console.error(error);
      const errorMsg = error.response?.data?.reply 
        || (error.response?.status === 401 
          ? "⚠️ Necesitas estar autenticado para usar el asistente." 
          : "❌ Hubo un error de conexión con el servidor.");
      setMessages(prev => [...prev, { sender: 'bot', text: errorMsg }]);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleChat = () => setIsOpen(!isOpen);

  return (
    <div className="chatbot-container" style={styles.wrapper}>
      {isOpen && (
        <div className="chatbot-window" style={styles.window}>
          <div style={styles.header}>
            <div style={styles.headerTitle}>
              <Bot size={20} /> Asistente ERP
            </div>
            <button onClick={toggleChat} style={styles.closeBtn}>
              <X size={20} />
            </button>
          </div>
          
          <div style={styles.messagesContainer}>
            {messages.map((msg, idx) => (
              <div key={idx} style={msg.sender === 'bot' ? styles.botMessageWrapper : styles.userMessageWrapper}>
                {msg.sender === 'bot' && <div style={styles.botIcon}><Bot size={16} /></div>}
                <div style={msg.sender === 'bot' ? styles.botBubble : styles.userBubble}>
                  <ReactMarkdown>{msg.text}</ReactMarkdown>
                </div>
              </div>
            ))}
            {isLoading && (
              <div style={styles.botMessageWrapper}>
                <div style={styles.botIcon}><Bot size={16} /></div>
                <div style={styles.typingIndicator}>Escribiendo...</div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSend} style={styles.inputArea}>
            <input 
              type="text" 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Escribe tu consulta..." 
              style={styles.input}
            />
            <button type="submit" disabled={isLoading} style={styles.sendBtn}>
              <Send size={18} />
            </button>
          </form>
        </div>
      )}

      {!isOpen && (
        <button onClick={toggleChat} style={styles.fab} className="hover-lift">
          <MessageSquare size={28} />
        </button>
      )}
    </div>
  );
}

const styles = {
  wrapper: {
    position: 'fixed',
    bottom: '20px',
    right: '20px',
    zIndex: 9999,
  },
  fab: {
    backgroundColor: 'var(--primary-color)',
    color: 'white',
    border: 'none',
    borderRadius: '50%',
    width: '60px',
    height: '60px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
    cursor: 'pointer',
    transition: 'transform 0.2s',
  },
  window: {
    width: '350px',
    height: '500px',
    backgroundColor: 'var(--bg-secondary)',
    borderRadius: '16px',
    boxShadow: '0 8px 30px rgba(0,0,0,0.5)',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    border: '1px solid var(--border-color)',
  },
  header: {
    backgroundColor: 'var(--bg-tertiary)',
    padding: '16px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid var(--border-color)',
  },
  headerTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontWeight: 'bold',
    color: 'var(--text-main)',
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--text-muted)',
    cursor: 'pointer',
  },
  messagesContainer: {
    flex: 1,
    padding: '16px',
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  botMessageWrapper: {
    display: 'flex',
    alignItems: 'flex-end',
    gap: '8px',
    alignSelf: 'flex-start',
    maxWidth: '85%',
  },
  userMessageWrapper: {
    alignSelf: 'flex-end',
    maxWidth: '85%',
  },
  botIcon: {
    backgroundColor: 'var(--bg-tertiary)',
    borderRadius: '50%',
    width: '28px',
    height: '28px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'var(--primary-color)',
    marginBottom: '4px',
  },
  botBubble: {
    backgroundColor: 'var(--bg-tertiary)',
    color: 'var(--text-main)',
    padding: '10px 14px',
    borderRadius: '16px 16px 16px 4px',
    fontSize: '0.9rem',
    lineHeight: '1.4',
  },
  userBubble: {
    backgroundColor: 'var(--primary-color)',
    color: 'white',
    padding: '10px 14px',
    borderRadius: '16px 16px 4px 16px',
    fontSize: '0.9rem',
    lineHeight: '1.4',
  },
  typingIndicator: {
    backgroundColor: 'var(--bg-tertiary)',
    color: 'var(--text-muted)',
    padding: '10px 14px',
    borderRadius: '16px 16px 16px 4px',
    fontSize: '0.85rem',
    fontStyle: 'italic',
  },
  inputArea: {
    display: 'flex',
    padding: '12px',
    backgroundColor: 'var(--bg-tertiary)',
    borderTop: '1px solid var(--border-color)',
    gap: '8px',
  },
  input: {
    flex: 1,
    backgroundColor: 'var(--bg-main)',
    border: '1px solid var(--border-color)',
    borderRadius: '20px',
    padding: '10px 16px',
    color: 'var(--text-main)',
    outline: 'none',
  },
  sendBtn: {
    backgroundColor: 'var(--primary-color)',
    color: 'white',
    border: 'none',
    borderRadius: '50%',
    width: '40px',
    height: '40px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
  }
};
