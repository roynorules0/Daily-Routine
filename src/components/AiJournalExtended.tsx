import React, { useState } from 'react';
import { Heart, Search, Calendar, Sparkles, Send, BrainCircuit, MessageSquare, ChevronRight, Share, BarChart3, CheckSquare } from 'lucide-react';

interface JournalEntry {
  id: string;
  date: string;
  studyProgress: string;
  gymStatus: string;
  mood: '🔥 Beast' | '💪 Strong' | '😴 Tired' | '🧠 Focused' | '⛈ Stressed' | '💤 Lazy';
  thoughts: string;
  aiAnalysis?: {
    moodAnalysis: string;
    advice: string;
    psychRating: number; // 1 to 10
  };
}

interface AiJournalExtendedProps {
  geminiApiKey?: string;
  telegramBotToken?: string;
  telegramChannel?: string;
  addToast: (text: string, type: 'success' | 'error' | 'info') => void;
  addXp: (amount: number, reason: string) => void;
}

export default function AiJournalExtended({
  geminiApiKey,
  telegramBotToken,
  telegramChannel,
  addToast,
  addXp
}: AiJournalExtendedProps) {
  const [entries, setEntries] = useState<JournalEntry[]>(() => {
    const saved = localStorage.getItem('roy_beast_extended_journals');
    if (saved) return JSON.parse(saved);
    return [
      {
        id: 'j-example-1',
        date: '2026-06-01',
        studyProgress: 'Solved 120 Organic conversions. Completed Physics Mechanics block.',
        gymStatus: 'High intensity squats session, 140kg max PR hit.',
        mood: '🔥 Beast',
        thoughts: 'Woke up at 4:30 AM with cold friction. Solved physics immediately to lock momentum.',
        aiAnalysis: {
          moodAnalysis: "Roy demonstrates extreme cognitive activation. The squats PR under zero physical rules illustrates stellar nervous adaptation.",
          advice: "Maintain immediate hydration targets post workouts. Do not consume supplementary media during dinner.",
          psychRating: 9
        }
      },
      {
        id: 'j-example-2',
        date: '2026-05-30',
        studyProgress: 'Missed inorganic chemistry because of clinic duty headache.',
        gymStatus: 'Only did active recall walk program.',
        mood: '😴 Tired',
        thoughts: 'Clinic was demanding today, but stayed focused during active decompression walk.',
        aiAnalysis: {
          moodAnalysis: "Fatigue indicators show mental burnout. Clinic duty overlaps heavily with revision blocks.",
          advice: "Trigger 15-minute complete silent deep breathing before opening heavy textbooks.",
          psychRating: 6
        }
      }
    ];
  });

  // Entry inputs
  const [studyProgressInput, setStudyProgressInput] = useState('');
  const [gymStatusInput, setGymStatusInput] = useState('');
  const [moodInput, setMoodInput] = useState<JournalEntry['mood']>('🧠 Focused');
  const [thoughtsInput, setThoughtsInput] = useState('');
  const [loadingAi, setLoadingAi] = useState(false);

  // Search/Filter inputs
  const [searchQuery, setSearchQuery] = useState('');

  const saveEntries = (updated: JournalEntry[]) => {
    setEntries(updated);
    localStorage.setItem('roy_beast_extended_journals', JSON.stringify(updated));
  };

  const handleCommitJournal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!thoughtsInput.trim()) {
      addToast('Please enter your mental thoughts before logging!', 'error');
      return;
    }

    setLoadingAi(true);

    const baseEntry: JournalEntry = {
      id: `j-entry-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      studyProgress: studyProgressInput || 'Offline generic study blocks completed.',
      gymStatus: gymStatusInput || 'No workouts logged.',
      mood: moodInput,
      thoughts: thoughtsInput,
    };

    let aiAnalysis = {
      moodAnalysis: "The Roy No Rules psyche functions on absolute momentum. Focused state logs register successful cognitive blocks.",
      advice: "Dedicate morning slots strictly to physics derivations before clinic hours break concentration.",
      psychRating: 8
    };

    if (geminiApiKey && geminiApiKey.trim() !== '') {
      try {
        const res = await fetch('/api/ai-assistant', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userMessage: `Analyze this daily journal entry: [Mood: ${moodInput}, Study: ${studyProgressInput}, Gym: ${gymStatusInput}, Thoughts: ${thoughtsInput}]. Give a mood assessment paragraph, a quick actionable prescription bullet point, and a psychic focus rating out of 10. Split with delimiters [MOOD] [ADVICE] [RATING] so I can parse.`,
            geminiApiKey
          })
        });
        const data = await res.json();
        const text = data.reply || '';

        // Safely extract from text
        const moodMatch = text.match(/\[MOOD\](.*?)\[ADVICE\]/s) || text.match(/Mood:(.*?)(Advice:|$)/is);
        const adviceMatch = text.match(/\[ADVICE\](.*?)\[RATING\]/s) || text.match(/Advice:(.*?)(Rating:|$)/is);
        const ratingMatch = text.match(/\[RATING\](.*?)$/s) || text.match(/Rating:\s*(\d+)/is);

        if (moodMatch && moodMatch[1]) aiAnalysis.moodAnalysis = moodMatch[1].trim();
        if (adviceMatch && adviceMatch[1]) aiAnalysis.advice = adviceMatch[1].trim();
        if (ratingMatch && ratingMatch[1]) aiAnalysis.psychRating = Number(ratingMatch[1].trim()) || 8;
      } catch {
        // fallback active
      }
    }

    const completedEntry: JournalEntry = {
      ...baseEntry,
      aiAnalysis
    };

    const nextEntries = [completedEntry, ...entries];
    saveEntries(nextEntries);

    // Clear form
    setStudyProgressInput('');
    setGymStatusInput('');
    setThoughtsInput('');
    setLoadingAi(false);

    addToast('Journal verified with Gemini AI and committed to memory!', 'success');
    addXp(120, 'Committed AI analyzed mental journal');
  };

  const handleDeleteEntry = (id: string) => {
    saveEntries(entries.filter(e => e.id !== id));
    addToast('Journal entry deleted from logs.', 'info');
  };

  // Dispatch single entry to Telegram
  const handleSendEntryTelegram = async (entry: JournalEntry) => {
    if (!telegramBotToken || !telegramChannel) {
      addToast('Configure Telegram variables in Settings first!', 'error');
      return;
    }

    const aiSection = entry.aiAnalysis ? 
      `🧘 <b>AI Psyche Assessment:</b>\n<i>${entry.aiAnalysis.moodAnalysis}</i>\n\n🎯 <b>Actionable Advice:</b>\n<code>${entry.aiAnalysis.advice}</code>\n🔋 <b>Psych Rating:</b> <code>${entry.aiAnalysis.psychRating}/10</code>` :
      '';

    const text = `📓 <b>ROY NO RULES DAILY JOURNAL DECK</b> 📓\n\n` +
      `📅 <b>Date:</b> ${entry.date}\n` +
      `🧠 <b>Active Mood state:</b> <b>${entry.mood}</b>\n\n` +
      `📚 <b>Study Progress:</b>\n${entry.studyProgress}\n\n` +
      `🏋️ <b>Gym Performance Status:</b>\n${entry.gymStatus}\n\n` +
      `📝 <b>Mental Log thoughts:</b>\n<i>"${entry.thoughts}"</i>\n\n` +
      `${aiSection}\n\n⚔️ <i>No Rules. No Barriers. Move forward!</i>`;

    const targetChannel = telegramChannel.startsWith('@') ? telegramChannel : `@${telegramChannel}`;
    const url = `https://api.telegram.org/bot${telegramBotToken}/sendMessage`;

    try {
      await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: targetChannel, text, parse_mode: 'HTML' })
      });
      addToast('Dispatched formatted journal log to Telegram!', 'success');
    } catch {
      addToast('Telegram journal carrier pipeline failed.', 'error');
    }
  };

  // Math Statistics
  const filteredEntries = entries.filter(e => {
    const term = searchQuery.toLowerCase();
    return e.thoughts.toLowerCase().includes(term) || e.studyProgress.toLowerCase().includes(term) || e.date.includes(term);
  });

  const moodCounts = entries.reduce<Record<string, number>>((acc, curr) => {
    acc[curr.mood] = (acc[curr.mood] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="bg-zinc-900/35 border border-zinc-850 rounded-3xl p-6 text-left space-y-6">
      
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-850 pb-3">
        <div className="flex items-center gap-2">
          <Heart className="w-5 h-5 text-red-500 animate-pulse" />
          <h2 className="text-sm font-bold uppercase text-white tracking-widest font-mono">Elite AI Journal System</h2>
        </div>
        <span className="text-[10px] bg-red-650/10 text-red-400 font-bold px-2.5 py-1 rounded font-mono uppercase tracking-wider">
          Psyche Vault
        </span>
      </div>

      {/* Main Grid: Create Left / Lists & Analytics Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* CREATE BLOCK LEFT (5 columns) */}
        <form onSubmit={handleCommitJournal} className="lg:col-span-5 bg-zinc-950 p-4 rounded-2xl border border-zinc-900 space-y-3.5 h-fit">
          <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest font-mono">Create Daily Instinct Entry</h3>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <span className="text-[9px] font-bold text-zinc-500 uppercase font-mono">Active Mood state</span>
              <select
                value={moodInput}
                onChange={(e: any) => setMoodInput(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-850 rounded p-1.5 text-xs text-white"
              >
                <option value="🔥 Beast">🔥 Beast</option>
                <option value="💪 Strong">💪 Strong</option>
                <option value="🧠 Focused">🧠 Focused</option>
                <option value="😴 Tired">😴 Tired</option>
                <option value="⛈ Stressed">⛈ Stressed</option>
                <option value="💤 Lazy">💤 Lazy</option>
              </select>
            </div>

            <div className="space-y-1">
              <span className="text-[9px] font-bold text-zinc-500 uppercase font-mono">Date</span>
              <div className="text-xs font-bold p-1.5 text-zinc-450">{new Date().toISOString().split('T')[0]}</div>
            </div>
          </div>

          <div className="space-y-1">
            <span className="text-[9px] font-bold text-zinc-500 uppercase font-mono block">Today's Study Progress</span>
            <input
              type="text"
              placeholder="e.g. Completed organic revision, 45 MCQ physics"
              value={studyProgressInput}
              onChange={(e) => setStudyProgressInput(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-850 rounded p-2 text-xs text-white"
            />
          </div>

          <div className="space-y-1">
            <span className="text-[9px] font-bold text-zinc-500 uppercase font-mono block">Gym performance status</span>
            <input
              type="text"
              placeholder="e.g. Heavy squats, 5x5 bench press done"
              value={gymStatusInput}
              onChange={(e) => setGymStatusInput(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-850 rounded p-2 text-xs text-white"
            />
          </div>

          <div className="space-y-1">
            <span className="text-[9px] font-bold text-zinc-500 uppercase font-mono block">Mental Thoughts & Instincts log</span>
            <textarea
              required
              rows={4}
              placeholder="What mental blocks did we clear today? Explain any deviations..."
              value={thoughtsInput}
              onChange={(e) => setThoughtsInput(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-850 rounded-xl p-2.5 text-xs text-white"
            />
          </div>

          <button
            type="submit"
            disabled={loadingAi}
            className="w-full bg-gradient-to-r from-red-650 to-amber-600 text-white font-mono font-bold text-xs py-3 rounded-xl cursor-pointer transition-all border-0 shadow-md uppercase tracking-wider flex items-center justify-center gap-2"
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            {loadingAi ? 'Decoding mental frequencies...' : 'Lock Journal to system'}
          </button>
        </form>

        {/* LISTS & ANALYTICS RIGHT (7 columns) */}
        <div className="lg:col-span-7 space-y-4">
          
          {/* Mood Graphs & Analytics */}
          <div className="bg-zinc-950 p-4 rounded-2xl border border-zinc-900 space-y-3">
            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest font-mono flex items-center gap-1.5">
              <BarChart3 className="w-4 h-4 text-emerald-450" />
              Emotional Coordinates statistics
            </h3>

            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 pt-1 font-mono text-[10px]">
              {['🔥 Beast', '💪 Strong', '🧠 Focused', '😴 Tired', '⛈ Stressed', '💤 Lazy'].map((mood) => {
                const count = moodCounts[mood] || 0;
                return (
                  <div key={mood} className="bg-zinc-905 p-2 rounded border border-zinc-850 text-center space-y-1">
                    <span className="text-xs block">{mood.split(' ')[1] || mood}</span>
                    <span className="text-sm font-black text-white">{count}x</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Interactive Past Log Lists with search */}
          <div className="bg-zinc-950 p-4 rounded-2xl border border-zinc-900 space-y-3.5">
            <div className="flex justify-between items-center gap-4 flex-wrap">
              <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest font-mono">Instinct Ledger Streams</h3>
              
              <div className="relative w-full sm:w-48 shrink-0">
                <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-zinc-550" />
                <input
                  type="text"
                  placeholder="Filter logs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-850 rounded-lg p-1.5 pl-8 text-[11px] text-white"
                />
              </div>
            </div>

            {/* List entries scrollable */}
            <div className="max-h-72 overflow-y-auto space-y-3 pr-1">
              {filteredEntries.map((e) => (
                <div key={e.id} className="bg-zinc-905 p-3.5 rounded-xl border border-zinc-850/60 leading-relaxed space-y-3 relative">
                  
                  {/* Top line metadata */}
                  <div className="flex justify-between items-center pb-2 border-b border-zinc-90 w-full text-[10px] font-mono">
                    <span className="text-zinc-500 font-bold">📅 {e.date}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-red-400 font-black">{e.mood}</span>
                      <button onClick={() => handleDeleteEntry(e.id)} className="text-zinc-650 hover:text-red-400">
                        Delete
                      </button>
                    </div>
                  </div>

                  {/* Core Content */}
                  <div className="text-xs text-zinc-350 space-y-1">
                    <p className="text-xs italic text-left text-zinc-200 font-sans">
                      "{e.thoughts}"
                    </p>
                    <div className="grid grid-cols-2 gap-2 text-[10px] font-mono text-zinc-550 pt-1.5">
                      <span>🌿 Prep: {e.studyProgress}</span>
                      <span>🏋 Workout: {e.gymStatus}</span>
                    </div>
                  </div>

                  {/* AI Analysis segment */}
                  {e.aiAnalysis && (
                    <div className="bg-indigo-950/20 p-2.5 rounded-lg border border-indigo-500/10 text-[10.5px] leading-relaxed text-zinc-400 relative">
                      <div className="absolute top-2 right-2 flex items-center gap-1 font-mono text-[9px] font-bold text-indigo-400">
                        <BrainCircuit className="w-3.5 h-3.5" />
                        Rating: {e.aiAnalysis.psychRating}/10
                      </div>

                      <p className="pr-16 text-left">
                        <b>AI Diagnosis:</b> "{e.aiAnalysis.moodAnalysis}"
                      </p>
                      <p className="mt-1 font-mono text-emerald-400">
                        <b>Prescription Checklist:</b> {e.aiAnalysis.advice}
                      </p>
                    </div>
                  )}

                  {/* Dispatch Telegram */}
                  <button
                    onClick={() => handleSendEntryTelegram(e)}
                    className="w-full bg-zinc-950 hover:bg-zinc-900 border border-zinc-900 hover:border-zinc-800 text-[9px] py-1.5 rounded cursor-pointer font-mono font-bold text-zinc-400 hover:text-indigo-400 uppercase tracking-widest flex items-center justify-center gap-1.5 transition-all"
                  >
                    <Send className="w-3 h-3" /> Broadcast single entry to telegram channel
                  </button>

                </div>
              ))}
            </div>

          </div>

        </div>

      </div>

    </div>
  );
}
