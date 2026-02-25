import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles } from 'lucide-react';
import { startPrescriptionChat } from '../services/geminiService';
import { Loader } from './Loader';

interface Message {
  role: 'user' | 'model';
  text: string;
}

interface ChatPrescriptionProps {
  onGenerateFromChat: (prescription: string) => void;
  isLoading: boolean;
}

export const ChatPrescription: React.FC<ChatPrescriptionProps> = ({ onGenerateFromChat, isLoading }) => {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', text: "Hello. I am Glia. Tell me about your current mental state or what you're trying to achieve, and I will prescribe an acoustic flush for you." }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      chatRef.current = startPrescriptionChat();
    } catch (e) {
      console.error("Failed to initialize chat", e);
    }
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;
    
    const userText = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userText }]);
    setIsTyping(true);

    try {
      if (!chatRef.current) {
        chatRef.current = startPrescriptionChat();
      }
      const response = await chatRef.current.sendMessage({ message: userText });
      setMessages(prev => [...prev, { role: 'model', text: response.text }]);
    } catch (e) {
      console.error(e);
      setMessages(prev => [...prev, { role: 'model', text: "I'm sorry, I encountered an error analyzing your request." }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleGenerate = () => {
    const chatHistory = messages.map(m => `${m.role === 'user' ? 'User' : 'Glia'}: ${m.text}`).join('\n');
    onGenerateFromChat(chatHistory);
  };

  return (
    <div className="flex flex-col h-[450px] bg-[#282a36] rounded-xl border border-[#6272a4]/30 overflow-hidden">
      <div className="flex-grow overflow-y-auto p-4 space-y-4">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] p-3 rounded-xl ${msg.role === 'user' ? 'bg-[#bd93f9]/20 text-[#f8f8f2] border border-[#bd93f9]/30 rounded-tr-none' : 'bg-[#44475a]/50 text-[#f8f8f2]/90 border border-[#6272a4]/20 rounded-tl-none'}`}>
              <p className="text-sm whitespace-pre-wrap font-light leading-relaxed">{msg.text}</p>
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-[#44475a]/50 p-3 rounded-xl rounded-tl-none border border-[#6272a4]/20">
              <Loader />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      
      <div className="p-3 bg-[#44475a]/30 border-t border-[#6272a4]/30">
        <div className="flex gap-2 mb-3">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
            placeholder="E.g., I need to focus but feel anxious..."
            className="flex-grow bg-[#282a36] border border-[#6272a4]/50 rounded-lg px-3 py-2 text-sm text-[#f8f8f2] focus:outline-none focus:border-[#bd93f9] font-light"
          />
          <button
            onClick={handleSend}
            disabled={isTyping || !input.trim()}
            className="bg-[#bd93f9] hover:bg-[#ff79c6] text-[#282a36] p-2 rounded-lg transition-colors disabled:opacity-50"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
        <button
          onClick={handleGenerate}
          disabled={isLoading || messages.length < 3}
          className="w-full flex items-center justify-center gap-2 bg-[#50fa7b]/20 hover:bg-[#50fa7b]/30 text-[#50fa7b] border border-[#50fa7b]/50 py-3 rounded-lg transition-colors disabled:opacity-50 text-sm font-display tracking-wide"
        >
          <Sparkles className="w-4 h-4" />
          {isLoading ? 'Synthesizing...' : 'Generate Prescribed Soundscape'}
        </button>
      </div>
    </div>
  );
};
