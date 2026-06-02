import React, { useState, useEffect } from 'react';
import { Bookmark, Sparkles, Plus, CheckCircle, Flame, MessageSquare, HelpCircle, Activity, ChevronRight, Search, Trash2 } from 'lucide-react';

interface CustomHabit {
  id: string;
  title: string;
  streak: number;
  isTodayDone: boolean;
  category: 'Study' | 'Gym' | 'General';
}

interface MotivationQuote {
  text: string;
  author: string;
  category: 'Brutal Hinglish' | 'Navy Seal' | 'Goggins' | 'NEET Focus';
}

interface WeaknessAnalysis {
  weaknessAnalysis: string;
  improvementPlan: string;
  recuperationFrictionScore: number;
  actionableDirectives: string[];
}

interface MotivationAndHabitsProps {
  geminiApiKey?: string;
  addToast: (text: string, type: 'success' | 'error' | 'info') => void;
  addXp: (amount: number, reason: string) => void;
}

export default function MotivationAndHabits({
  geminiApiKey,
  addToast,
  addXp
}: MotivationAndHabitsProps) {
  // --- 1. GLOBAL MOTIVATION WALL STATE ---
  const initialQuotes: MotivationQuote[] = [
    { text: "Physics padhi nhi, biomechanics ki samjh nahi pr sapne NEET aur absolute power ke? Sharam karo aur book kholo abhi!", author: "Roy Brutal Coach", category: 'Brutal Hinglish' },
    { text: "When you are tired, your mind begins to look for endpoints. Your job is to ignore the endpoint and find your active focus.", author: "David Goggins", category: 'Goggins' },
    { text: "Discipline is doing what you hate to do, but doing it like you love it.", author: "Mike Tyson", category: 'Goggins' },
    { text: "If you break discipline, you compromise the safety of the entire operational unit. Stand up, reset your desk, execute.", author: "Seal Master", category: 'Navy Seal' },
    { text: "Biology NCERT line-by-line is your only armor. If you haven't revised it today, you are walking unarmed into battle.", author: "NEET Expert", category: 'NEET Focus' }
  ];

  const [searchQuote, setSearchQuote] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [bookmarkedQuotes, setBookmarkedQuotes] = useState<string[]>(() => {
    const saved = localStorage.getItem('roy_bookmarked_quotes');
    return saved ? JSON.parse(saved) : [];
  });

  const handleToggleBookmark = (quoteText: string) => {
    let next;
    if (bookmarkedQuotes.includes(quoteText)) {
      next = bookmarkedQuotes.filter(q => q !== quoteText);
      addToast('Removed quote from Motivation wall bookmarks.', 'info');
    } else {
      next = [...bookmarkedQuotes, quoteText];
      addToast('Added quote to bookmarks shelf!', 'success');
    }
    setBookmarkedQuotes(next);
    localStorage.setItem('roy_bookmarked_quotes', JSON.stringify(next));
  };

  const filteredQuotes = initialQuotes.filter(q => {
    const matchSearch = q.text.toLowerCase().includes(searchQuote.toLowerCase()) || q.author.toLowerCase().includes(searchQuote.toLowerCase());
    const matchCat = activeCategory === 'All' || q.category === activeCategory;
    return matchSearch && matchCat;
  });

  // --- 2. AI HABIT BUILDER STATE ---
  const [habits, setHabits] = useState<CustomHabit[]>(() => {
    const saved = localStorage.getItem('roy_custom_habits');
    if (saved) return JSON.parse(saved);
    return [
      { id: 'h1', title: 'Biology NCERT Chapter Active Recall', streak: 4, isTodayDone: false, category: 'Study' },
      { id: 'h2', title: 'Royal Enfield Chain Lubrication check', streak: 2, isTodayDone: false, category: 'General' },
      { id: 'h3', title: 'Morning Gym Squats Workout session', streak: 7, isTodayDone: true, category: 'Gym' }
    ];
  });

  const [inputHabitTitle, setInputHabitTitle] = useState('');
  const [inputHabitCat, setInputHabitCat] = useState<CustomHabit['category']>('Study');

  const saveHabits = (nextH: CustomHabit[]) => {
    setHabits(nextH);
    localStorage.setItem('roy_custom_habits', JSON.stringify(nextH));
  };

  const handleAddHabit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputHabitTitle.trim()) return;
    const nextH: CustomHabit = {
      id: `hb-${Date.now()}`,
      title: inputHabitTitle.trim(),
      streak: 0,
      isTodayDone: false,
      category: inputHabitCat
    };
    saveHabits([...habits, nextH]);
    setInputHabitTitle('');
    addToast('Initialized custom disciplined habit profile!', 'success');
  };

  const handleToggleHabitDone = (id: string, isChecked: boolean) => {
    const updated = habits.map((h) => {
      if (h.id === id) {
        const nextStreak = isChecked ? h.streak + 1 : Math.max(0, h.streak - 1);
        if (isChecked) {
          addXp(40, `Habit completed: ${h.title}`);
        }
        return { ...h, isTodayDone: isChecked, streak: nextStreak };
      }
      return h;
    });
    saveHabits(updated);
    addToast(isChecked ? 'Habit completed today! Streak registered.' : 'Habit status unchecked.', 'info');
  };

  const handleDeleteHabit = (id: string) => {
    saveHabits(habits.filter(h => h.id !== id));
    addToast('Habit profile deleted.', 'info');
  };

  // --- 3. WEAKNESS DETECTOR STATE ---
  const [loadingWeakness, setLoadingWeakness] = useState(false);
  const [weaknessResult, setWeaknessResult] = useState<WeaknessAnalysis | null>(() => {
    const saved = localStorage.getItem('roy_weakness_detector_stats');
    return saved ? JSON.parse(saved) : null;
  });

  const handleRunWeaknessDiagnostic = async () => {
    setLoadingWeakness(true);
    // Assemble mock/actual performance indices for analysis
    const dummyStats = {
      missedTaskRatio: habits.filter(h => !h.isTodayDone).length / (habits.length || 1),
      studyHours: 4.5,
      gymCompleted: true,
      sleepHours: 6.5,
      waterLogged: 2250
    };

    try {
      const res = await fetch('/api/ai-weakness-detector', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stats: dummyStats, geminiApiKey })
      });
      const data = await res.json();
      setWeaknessResult(data);
      localStorage.setItem('roy_weakness_detector_stats', JSON.stringify(data));
      addToast('Discipline loophole analysis compiled beautifully!', 'success');
      addXp(100, 'Compiled AI Weakness Diagnostic Assessment');
    } catch {
      addToast('Friction assessment server failed. Loaded fallback analytics.', 'error');
    } finally {
      setLoadingWeakness(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-left">

      {/* --- 🎁 A. MOTIVATION WALL COLUMN (left) --- */}
      <div className="bg-zinc-900/35 border border-zinc-850 rounded-3xl p-6 col-span-1 space-y-4">
        <div className="flex items-center justify-between border-b border-zinc-850 pb-3">
          <div className="flex items-center gap-2">
            <Bookmark className="w-5 h-5 text-amber-500" />
            <h2 className="text-sm font-bold uppercase text-white tracking-widest font-mono">Discipline Inspiration Board</h2>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-zinc-550" />
          <input
            type="text"
            placeholder="Search core quotes..."
            value={searchQuote}
            onChange={(e) => setSearchQuote(e.target.value)}
            className="w-full bg-zinc-950 border border-zinc-850 rounded-xl pl-9 pr-3 py-2 text-xs text-white"
          />
        </div>

        {/* Category Filter Pills */}
        <div className="flex flex-wrap gap-1.5 pt-1">
          {['All', 'Brutal Hinglish', 'Navy Seal', 'Goggins', 'NEET Focus'].map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-2 py-1 text-[9px] font-mono font-bold rounded-md border ${
                activeCategory === cat 
                  ? 'bg-amber-500 border-amber-500 text-black' 
                  : 'bg-zinc-950 border-zinc-850 text-zinc-400 hover:text-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Quotes list */}
        <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
          {filteredQuotes.map((q, idx) => {
            const bookmarked = bookmarkedQuotes.includes(q.text);
            return (
              <div key={idx} className="bg-zinc-950 p-3 rounded-xl border border-zinc-900 text-left space-y-2 relative">
                <button
                  onClick={() => handleToggleBookmark(q.text)}
                  className="absolute top-2.5 right-2 text-zinc-500 hover:text-amber-500"
                  title="Bookmark Quote"
                >
                  <Bookmark className={`w-3.5 h-3.5 ${bookmarked ? 'fill-amber-500 text-amber-500' : ''}`} />
                </button>
                <p className="text-xs text-zinc-350 italic pr-6 leading-relaxed">"{q.text}"</p>
                <span className="text-[9px] font-mono font-black text-zinc-550 block">- {q.author}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* --- 🧠 B. AI HABIT BUILDER COLUMN (middle) --- */}
      <div className="bg-zinc-900/35 border border-zinc-850 rounded-3xl p-6 col-span-1 space-y-4">
        <div className="flex items-center justify-between border-b border-zinc-850 pb-3">
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-red-500 animate-pulse" />
            <h2 className="text-sm font-bold uppercase text-white tracking-widest font-mono">AI Habit Builder</h2>
          </div>
          <span className="text-[10px] font-bold text-red-500 font-mono">Streaking active</span>
        </div>

        {/* Habits Checklist */}
        <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
          {habits.map((h) => (
            <div key={h.id} className="bg-zinc-950 p-3 rounded-xl border border-zinc-900 flex justify-between items-center text-xs">
              <div className="flex items-center gap-2.5">
                <input
                  type="checkbox"
                  checked={h.isTodayDone}
                  onChange={(e) => handleToggleHabitDone(h.id, e.target.checked)}
                  className="w-4 h-4 accent-red-650 cursor-pointer rounded border-zinc-800"
                />
                <div className="text-left">
                  <p className={`font-bold font-sans ${h.isTodayDone ? 'line-through text-zinc-500' : 'text-zinc-200'}`}>
                    {h.title}
                  </p>
                  <span className="text-[9px] font-mono text-zinc-550 uppercase font-bold">{h.category} Category</span>
                </div>
              </div>

              <div className="flex items-center gap-2.5 shrink-0">
                <span className="text-[10px] font-mono font-black text-red-400 bg-red-500/10 px-2 py-0.5 rounded border border-red-500/10 flex items-center gap-0.5">
                  🔥 {h.streak}d
                </span>
                <button onClick={() => handleDeleteHabit(h.id)} className="text-zinc-650 hover:text-red-400">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Form add habit */}
        <form onSubmit={handleAddHabit} className="bg-zinc-950 p-3.5 rounded-xl border border-zinc-900 space-y-3">
          <div className="space-y-1">
            <span className="text-[9px] font-bold text-zinc-500 uppercase font-mono">New Habit profile</span>
            <input
              type="text"
              required
              placeholder="e.g. 50 pushups or Revise Bio"
              value={inputHabitTitle}
              onChange={(e) => setInputHabitTitle(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-850 rounded p-1.5 text-xs text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-[8px] font-bold text-zinc-500 uppercase font-mono block mb-1">Bucket</span>
              <select
                value={inputHabitCat}
                onChange={(e: any) => setInputHabitCat(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-850 p-1 rounded text-white font-mono"
              >
                <option value="Study">Study</option>
                <option value="Gym">Gym</option>
                <option value="General">Life/RE</option>
              </select>
            </div>
            <div className="flex items-end">
              <button
                type="submit"
                className="w-full bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-white font-mono font-bold py-1.5 rounded uppercase text-[10px] cursor-pointer"
              >
                Create Habit
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* --- 🥋 C. WEAKNESS DETECTOR COLUMN (right) --- */}
      <div className="bg-zinc-900/35 border border-zinc-850 rounded-3xl p-6 col-span-1 space-y-4">
        <div className="flex items-center justify-between border-b border-zinc-850 pb-3">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-indigo-400 animate-pulse" />
            <h2 className="text-sm font-bold uppercase text-white tracking-widest font-mono">Discipline Loophole diagnostic</h2>
          </div>
        </div>

        {!weaknessResult ? (
          <div className="text-center py-6 space-y-3 bg-zinc-950 p-4 rounded-xl border border-zinc-900">
            <span className="text-xs text-zinc-555 italic block font-mono text-center">Diagnostics pending evaluation...</span>
            <p className="text-[11px] text-zinc-400 font-medium">Click the evaluative diagnostic mechanism down below to query Gemini AI analytics on current tracker slips.</p>
            <button
              onClick={handleRunWeaknessDiagnostic}
              disabled={loadingWeakness}
              className="w-full bg-indigo-650 hover:bg-indigo-500 font-mono font-black text-xs text-white py-2.5 rounded-lg cursor-pointer uppercase tracking-wider"
            >
              {loadingWeakness ? 'Interrogating micro-logs...' : '🔬 Force evaluation diagnostic'}
            </button>
          </div>
        ) : (
          <div className="space-y-3 bg-zinc-950 p-4 rounded-xl border border-zinc-900 text-left text-xs animate-fade-in relative max-h-[350px] overflow-y-auto">
            <div className="flex justify-between items-center pb-2 border-b border-zinc-900 font-mono">
              <span className="text-[9px] font-bold text-red-500 uppercase tracking-widest">Loopholes Analysis Report</span>
              <span className="text-[10px] text-zinc-550 font-bold">Friction Index: {weaknessResult.recuperationFrictionScore}/10</span>
            </div>

            <p className="text-zinc-350 leading-relaxed text-[11.5px] italic">
              <b>Identified Friction:</b> "{weaknessResult.weaknessAnalysis}"
            </p>

            <p className="text-zinc-350 leading-relaxed text-[11.5px]">
              <b>Prescribed Remediation:</b> {weaknessResult.improvementPlan}
            </p>

            <div className="space-y-1.5 pt-2 border-t border-zinc-900">
              <span className="text-[8.5px] font-black text-zinc-500 uppercase font-mono tracking-widest block">Actionable Corrective Directives:</span>
              <ul className="space-y-1">
                {weaknessResult.actionableDirectives?.map((item, idx) => (
                  <li key={idx} className="text-[11px] text-zinc-400 flex items-start gap-1">
                    <ChevronRight className="w-3.5 h-3.5 text-zinc-550 shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <button
              onClick={handleRunWeaknessDiagnostic}
              disabled={loadingWeakness}
              className="w-full bg-zinc-900 hover:bg-zinc-850 hover:border-zinc-700 border border-zinc-805 text-zinc-300 font-mono uppercase text-[9px] font-bold tracking-wider py-2 rounded mt-2 cursor-pointer"
            >
              {loadingWeakness ? 'Re-Evaluating stats...' : 'Recalibrate diagnostics'}
            </button>
          </div>
        )}
      </div>

    </div>
  );
}
