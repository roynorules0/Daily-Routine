import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, MessageSquare, X, Send, Command, User, ShieldAlert, Cpu, Heart, Flame, Star, Lightbulb, RefreshCw, Compass } from 'lucide-react';

interface AiAssistantFloatingProps {
  geminiApiKey?: string;
  currentStats: {
    focus: string;
    studiedHours: number;
    activeTaskName: string;
    userLevel: number;
    userXp: number;
    gym: boolean;
    walk: boolean;
    waterLiters: number;
  };
  addToast: (text: string, type: 'success' | 'error' | 'info') => void;
}

interface ChatMessage {
  sender: 'user' | 'assistant';
  text: string;
  time: string;
}

export default function AiAssistantFloating({
  geminiApiKey,
  currentStats,
  addToast
}: AiAssistantFloatingProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    // Standard starting greetings matching custom language choices
    return [
      {
        sender: 'assistant',
        text: 'Greetings Roy & Ritik. I am fully synchronized with your daily disciplines, NEET preparation metrics, and iron workouts schedule. Let\'s optimize your current hour!',
        time: 'Now'
      }
    ];
  });
  const [inputVal, setInputVal] = useState('');
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll chat logs
  useEffect(() => {
    if (chatEndRef.current && isOpen) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleSendMessage = async (customText?: string) => {
    const textToSend = customText || inputVal.trim();
    if (!textToSend) return;

    if (!customText) setInputVal('');

    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setMessages(prev => [...prev, { sender: 'user', text: textToSend, time: timestamp }]);
    setLoading(true);

    try {
      // Proxy all requests directly through Express API endpoints for API Key security!
      const response = await fetch('/api/ai-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userMessage: textToSend,
          currentStats: {
            ...currentStats,
            activeTaskName: currentStats.activeTaskName || 'Unscheduled Period'
          },
          geminiApiKey
        })
      });

      const data = await response.json();
      
      setMessages(prev => [
        ...prev,
        {
          sender: 'assistant',
          text: data.reply || "Aadesh ritik bhai! NCERT par focus lagaye rakhein aur distractions ko isolate karein. Execution is keys.",
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } catch {
      // Smooth local fallback responses when internet is temporarily lagging on iframe preview bounds
      let mockReply = 'Aadesh bro! Study session lock karke deep concentration banaye rakhein. Mobile phone ko lock room mein silent pe dalke NCERT Physics, Chemistry aur Biology chapters read kariye!';
      if (textToSend.toLowerCase().includes('workout') || textToSend.toLowerCase().includes('gym')) {
        mockReply = 'Workout protocol updated: Back + biceps hypertrophy sets activated. Maximum intensity sets and 90s rest locks. Go kill it inside iron zone!';
      } else if (textToSend.toLowerCase().includes('motivate')) {
        mockReply = 'Ritik bhai, excuses produce failure, action produces results. NEET mock score 650+ secure karna hai toh routine block follow karna hi hoga. All India level determination lock kijiye!';
      }

      setMessages(prev => [
        ...prev,
        {
          sender: 'assistant',
          text: mockReply,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Automated smart direct preset chips for the user
  const suggestChips = [
    { text: 'I am free now. What should I do now?', title: 'What to do now?' },
    { text: 'Give me hard motivation block for NEET prep', title: 'Motivate me' },
    { text: 'Configure custom intensity workout routine focus', title: 'Hypertrophy set' },
    { text: 'Analyze low study score limits and suggest action plans', title: 'Why is my score low?' },
  ];

  return (
    <div className="fixed bottom-26 right-4 z-50 pointer-events-none">
      
      {/* 🔮 EXPANDED CHAT SHELL CARD */}
      {isOpen && (
        <div className="pointer-events-auto w-[330px] sm:w-[380px] bg-black/90 backdrop-blur-2xl border border-zinc-550/20 rounded-[28px] shadow-[0_15px_50px_rgba(0,0,0,0.95)] flex flex-col overflow-hidden mb-3 animate-slide-up relative">
          
          {/* Header */}
          <div className="p-4 bg-zinc-950 border-b border-zinc-900 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 bg-red-500 rounded-full animate-ping shrink-0" />
              <div className="text-left">
                <h3 className="text-xs font-black text-white font-mono uppercase tracking-widest flex items-center gap-1.5 leading-none">
                  <Cpu className="w-4 h-4 text-red-500" />
                  ROY CO-PILOT COMMANDS
                </h3>
                <span className="text-[9px] text-zinc-550 font-black uppercase font-mono tracking-wider block mt-1">Level {currentStats.userLevel} Combat Unit</span>
              </div>
            </div>
            
            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 hover:bg-zinc-900 text-zinc-400 hover:text-white rounded-lg cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Messages Scroll Panel */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3 max-h-[300px] min-h-[220px] font-sans text-left invisible-scrollbar">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`flex flex-col max-w-[85%] ${
                  m.sender === 'user' ? 'ml-auto items-end' : 'mr-auto items-start'
                }`}
              >
                <div
                  className={`p-3 rounded-2xl text-xs font-semibold leading-relaxed ${
                    m.sender === 'user'
                      ? 'bg-red-650 text-white rounded-br-none shadow-md'
                      : 'bg-zinc-950 border border-zinc-900 text-zinc-300 rounded-bl-none'
                  }`}
                >
                  <p className="whitespace-pre-line">{m.text}</p>
                </div>
                <span className="text-[9px] text-zinc-550 mt-1 font-mono">{m.time}</span>
              </div>
            ))}
            
            {loading && (
              <div className="flex items-center gap-1.5 mr-auto pl-2">
                <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-bounce delay-100" />
                <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-bounce delay-200" />
                <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-bounce delay-300" />
                <span className="text-[9px] text-zinc-550 uppercase font-black font-mono">Syncing core...</span>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Quick-action Suggest selection chips */}
          <div className="p-3 pt-0 flex flex-wrap gap-1.5 justify-start text-left bg-black/40">
            {suggestChips.map((chip, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSendMessage(chip.text)}
                className="px-2.5 py-1.5 bg-zinc-950 hover:bg-zinc-900 text-[9px] text-zinc-400 hover:text-white border border-zinc-900 rounded-xl cursor-pointer transition-all font-bold font-mono text-left"
              >
                ⚡ {chip.title}
              </button>
            ))}
          </div>

          {/* Interactive message composer footer */}
          <div className="p-3 bg-zinc-950/70 border-t border-zinc-900 flex items-center gap-2">
            <input
              type="text"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Deploy AI discipline advice query..."
              className="flex-1 bg-zinc-900 text-xs text-white rounded-xl px-3 py-2 border border-zinc-850 focus:border-red-500/50 focus:outline-none"
            />
            <button
              onClick={() => handleSendMessage()}
              className="p-2 bg-red-650 hover:bg-red-500 text-white rounded-xl border-0 cursor-pointer shadow"
              title="Deploy Advice"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>

        </div>
      )}

      {/* 🔮 THE ROUNDED PULSING AIR FLOATING COPILOT TRIGGER BUTTON */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="pointer-events-auto p-4 bg-gradient-to-r from-red-650 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white rounded-full border-0 cursor-pointer shadow-3xl flex items-center justify-center relative group select-none transition-transform active:scale-95"
        style={{ width: '56px', height: '56px' }}
        title="Open Roy Assistant Copilot Dashboard"
      >
        {isOpen ? (
          <X className="w-5 h-5 text-white" />
        ) : (
          <Cpu className="w-5 h-5 text-white animate-spin" style={{ animationDuration: '6s' }} />
        )}
        <div className="absolute inset-0 bg-red-500/20 rounded-full blur group-hover:scale-110 pointer-events-none -z-10 transition-transform" />
      </button>

    </div>
  );
}
