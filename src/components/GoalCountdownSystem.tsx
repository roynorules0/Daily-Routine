import React, { useState, useEffect } from 'react';
import { Calendar, Trash2, Plus, Clock, Percent, Send, Trophy } from 'lucide-react';

interface CountdownGoal {
  id: string;
  name: string;
  targetDate: string;
  category: 'NEET Exam' | 'Fitness' | 'Weight Goal' | 'Custom';
  startingProgress: number; // e.g., current weight or study progress
  targetProgress: number;   // e.g., targeted weight or complete study %
  currentProgressCount: number;
}

interface GoalCountdownSystemProps {
  telegramBotToken?: string;
  telegramChannel?: string;
  addToast: (text: string, type: 'success' | 'error' | 'info') => void;
  addXp: (amount: number, reason: string) => void;
}

export default function GoalCountdownSystem({
  telegramBotToken,
  telegramChannel,
  addToast,
  addXp
}: GoalCountdownSystemProps) {
  const [goals, setGoals] = useState<CountdownGoal[]>(() => {
    const saved = localStorage.getItem('roy_beast_countdown_goals');
    if (saved) return JSON.parse(saved);
    return [
      {
        id: 'g1',
        name: 'NEET Main Examination Grind',
        targetDate: '2026-07-15T09:00:00',
        category: 'NEET Exam',
        startingProgress: 0,
        targetProgress: 100,
        currentProgressCount: 65
      },
      {
        id: 'g2',
        name: 'Cut weight down to 72kg limit',
        targetDate: '2026-06-30T18:00:00',
        category: 'Weight Goal',
        startingProgress: 78.5,
        targetProgress: 72.0,
        currentProgressCount: 75.8
      }
    ];
  });

  const [inputName, setInputName] = useState('');
  const [inputCategory, setInputCategory] = useState<CountdownGoal['category']>('NEET Exam');
  const [inputDate, setInputDate] = useState('');
  const [inputValStart, setInputValStart] = useState<number>(0);
  const [inputValTarget, setInputValTarget] = useState<number>(100);
  const [inputValCurrent, setInputValCurrent] = useState<number>(50);

  const [timeOverrides, setTimeOverrides] = useState<Record<string, { days: number; hours: number }>>({});

  useEffect(() => {
    const interval = setInterval(() => {
      const overrides: Record<string, { days: number; hours: number }> = {};
      goals.forEach((g) => {
        const dest = new Date(g.targetDate).getTime();
        const diff = dest - Date.now();
        if (diff > 0) {
          const days = Math.floor(diff / (1000 * 60 * 60 * 24));
          const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
          overrides[g.id] = { days, hours };
        } else {
          overrides[g.id] = { days: 0, hours: 0 };
        }
      });
      setTimeOverrides(overrides);
    }, 1000);
    return () => clearInterval(interval);
  }, [goals]);

  // Save changes
  const saveAndSync = (updatedGoals: CountdownGoal[]) => {
    setGoals(updatedGoals);
    localStorage.setItem('roy_beast_countdown_goals', JSON.stringify(updatedGoals));
  };

  const handleAddGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputName.trim() || !inputDate) {
      addToast('Please enter a goal description and complete target date.', 'error');
      return;
    }
    const newG: CountdownGoal = {
      id: `goal-${Date.now()}`,
      name: inputName.trim(),
      category: inputCategory,
      targetDate: inputDate,
      startingProgress: Number(inputValStart) || 0,
      targetProgress: Number(inputValTarget) || 100,
      currentProgressCount: Number(inputValCurrent) || 0
    };
    const nextGoals = [...goals, newG];
    saveAndSync(nextGoals);
    setInputName('');
    setInputDate('');
    addToast('Successfully added customized countdown goal target!', 'success');
    addXp(80, 'Custom Countdown Goal Initialized');
  };

  const handleDeleteGoal = (id: string) => {
    const filtered = goals.filter(g => g.id !== id);
    saveAndSync(filtered);
    addToast('Countdown goal deleted.', 'info');
  };

  const handleUpdateProgress = (id: string, nextProgress: number) => {
    const updated = goals.map((g) => {
      if (g.id === id) {
        return { ...g, currentProgressCount: Number(nextProgress) || 0 };
      }
      return g;
    });
    saveAndSync(updated);
  };

  const handleSendTelegramSummary = async () => {
    if (!telegramBotToken || !telegramChannel) {
      addToast('Input matching bot details in Settings first!', 'error');
      return;
    }

    const payload = goals.map((g) => {
      const rem = timeOverrides[g.id] || { days: 0, hours: 0 };
      const range = Math.abs(g.targetProgress - g.startingProgress) || 1;
      const progressRatio = Math.max(0, Math.min(100, Math.round((Math.abs(g.currentProgressCount - g.startingProgress) / range) * 100)));
      return `🏁 <b>${g.name}</b> (${g.category})\n📅 Date: ${g.targetDate.split('T')[0]}\n⌛ <b>${rem.days} Days & ${rem.hours} Hours</b> remaining.\n📊 Complete Progress: <code>${progressRatio}%</code> (${g.currentProgressCount}/${g.targetProgress})`;
    }).join('\n\n');

    const text = `🚨 <b>ROY COUNTDOWN TARGET SUMMARY</b> 🚨\n\n${payload}\n\n⚡ <i>Execution is the only currency of the warrior! Let's conquer all goals!</i>`;
    const targetChannel = telegramChannel.startsWith('@') ? telegramChannel : `@${telegramChannel}`;
    const url = `https://api.telegram.org/bot${telegramBotToken}/sendMessage`;

    try {
      await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: targetChannel, text, parse_mode: 'HTML' })
      });
      addToast('Dispatched real-time Goal Countdowns to Telegram!', 'success');
    } catch {
      addToast('Telegram countdown broadcast pipeline failed.', 'error');
    }
  };

  return (
    <div className="bg-zinc-900/35 border border-zinc-850 rounded-3xl p-6 text-left space-y-5">
      <div className="flex items-center justify-between border-b border-zinc-850 pb-3">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-amber-500" />
          <h2 className="text-sm font-bold uppercase text-white tracking-widest font-mono">Goal Countdown System</h2>
        </div>
        <button
          onClick={handleSendTelegramSummary}
          className="px-3 py-1.5 bg-zinc-950 hover:bg-zinc-900 text-zinc-300 font-mono text-[10px] rounded-lg border border-zinc-850 cursor-pointer flex items-center gap-1.5 transition-all text-xs"
        >
          <Send className="w-3.5 h-3.5" /> Telegram Sync
        </button>
      </div>

      {/* Grid of existing Countdowns */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {goals.map((g) => {
          const rem = timeOverrides[g.id] || { days: 0, hours: 0 };
          const range = Math.abs(g.targetProgress - g.startingProgress) || 1;
          const progressRatio = Math.max(0, Math.min(100, Math.round((Math.abs(g.currentProgressCount - g.startingProgress) / range) * 100)));

          return (
            <div key={g.id} className="bg-zinc-950 p-4 rounded-2xl border border-zinc-900 space-y-4 flex flex-col justify-between">
              
              {/* Header */}
              <div className="flex justify-between items-start gap-4">
                <div className="space-y-1">
                  <span className="text-[8px] uppercase tracking-widest text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 font-mono font-bold">
                    {g.category}
                  </span>
                  <h3 className="text-sm font-black text-white tracking-tight leading-snug">{g.name}</h3>
                </div>
                <button
                  type="button"
                  onClick={() => handleDeleteGoal(g.id)}
                  className="p-1.5 bg-zinc-900 hover:bg-zinc-850 text-zinc-500 hover:text-red-500 rounded-lg cursor-pointer border border-zinc-850"
                  title="Delete Target Goal"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Time Remaining Counter */}
              <div className="py-2.5 px-3 bg-zinc-900 border border-zinc-850 rounded-xl flex items-center justify-between text-left">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-zinc-500" />
                  <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider font-mono">Timer Remaining:</span>
                </div>
                <div className="font-mono text-xs font-black text-white">
                  <span className="text-rose-400 text-sm font-black">{rem.days}d</span> : <span className="text-zinc-300 font-bold">{rem.hours}h</span>
                </div>
              </div>

              {/* Progress Tracker Slider & Meter */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-[10px] font-mono text-zinc-500 font-bold">
                  <span>Start: {g.startingProgress}</span>
                  <span className="text-zinc-300 font-black">Progress: {progressRatio}%</span>
                  <span>Target: {g.targetProgress}</span>
                </div>

                <div className="w-full bg-zinc-900 h-1.5 rounded-full overflow-hidden border border-zinc-850">
                  <div 
                    className="h-full bg-gradient-to-r from-red-500 to-amber-500 transition-all duration-300"
                    style={{ width: `${progressRatio}%` }}
                  />
                </div>

                {/* Direct Manual Slider adjustment */}
                <div className="flex items-center gap-3 pt-1">
                  <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest font-mono">Current Val:</span>
                  <input
                    type="range"
                    min={Math.min(g.startingProgress, g.targetProgress)}
                    max={Math.max(g.startingProgress, g.targetProgress)}
                    step="0.1"
                    value={g.currentProgressCount}
                    onChange={(e) => handleUpdateProgress(g.id, Number(e.target.value))}
                    className="flex-1 accent-red-655 bg-zinc-90 w-full"
                  />
                  <span className="text-xs font-mono font-bold text-white">{g.currentProgressCount}</span>
                </div>
              </div>

            </div>
          );
        })}
      </div>

      {/* Expand/Create Block */}
      <form onSubmit={handleAddGoal} className="bg-zinc-950 p-4 rounded-2xl border border-zinc-900 space-y-4">
        <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest font-mono">Initialize Premium Countdown Goal</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          
          <div className="space-y-1">
            <span className="text-[9px] font-bold text-zinc-500 uppercase font-mono">Goal Name</span>
            <input
              type="text"
              required
              placeholder="e.g., Royal Enfield Run or Biology Revise"
              value={inputName}
              onChange={(e) => setInputName(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-850 rounded-lg p-2 text-xs text-white"
            />
          </div>

          <div className="space-y-1">
            <span className="text-[9px] font-bold text-zinc-500 uppercase font-mono">Goal Category</span>
            <select
              value={inputCategory}
              onChange={(e: any) => setInputCategory(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-850 rounded-lg p-2 text-xs text-white"
            >
              <option value="NEET Exam">🌿 NEET Preparation Exam Goal</option>
              <option value="Fitness">🏋️ Fitness Performance Goal</option>
              <option value="Weight Goal">⚖ Weight Cut/Gain Goal</option>
              <option value="Custom">🥊 Custom Target Directive</option>
            </select>
          </div>

          <div className="space-y-1">
            <span className="text-[9px] font-bold text-zinc-500 uppercase font-mono">Target Date & Time</span>
            <input
              type="datetime-local"
              required
              value={inputDate}
              onChange={(e) => setInputDate(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-850 rounded-lg p-2 text-xs text-white"
            />
          </div>

        </div>

        {/* Starting, Target range inputs */}
        <div className="grid grid-cols-3 gap-3 pt-1">
          <div className="space-y-1">
            <span className="text-[9px] font-bold text-zinc-500 uppercase font-mono">Starting Position</span>
            <input
              type="number"
              step="0.1"
              value={inputValStart}
              onChange={(e) => setInputValStart(Number(e.target.value))}
              className="w-full bg-zinc-900 border border-zinc-850 rounded-lg p-1.5 text-xs text-white"
            />
          </div>
          <div className="space-y-1">
            <span className="text-[9px] font-bold text-zinc-500 uppercase font-mono">Target Threshold</span>
            <input
              type="number"
              step="0.1"
              value={inputValTarget}
              onChange={(e) => setInputValTarget(Number(e.target.value))}
              className="w-full bg-zinc-900 border border-zinc-850 rounded-lg p-1.5 text-xs text-white"
            />
          </div>
          <div className="space-y-1">
            <span className="text-[9px] font-bold text-zinc-500 uppercase font-mono">Active (Current) Status</span>
            <input
              type="number"
              step="0.1"
              value={inputValCurrent}
              onChange={(e) => setInputValCurrent(Number(e.target.value))}
              className="w-full bg-zinc-900 border border-zinc-850 rounded-lg p-1.5 text-xs text-white"
            />
          </div>
        </div>

        <button
          type="submit"
          className="w-full bg-zinc-900 hover:bg-zinc-850 text-white font-mono font-bold text-xs py-2.5 rounded-xl border border-zinc-805 cursor-pointer flex items-center justify-center gap-1.5 text-center transition-all uppercase"
        >
          <Plus className="w-4 h-4 text-amber-500" />
          Lock Down customized Countdown Target
        </button>
      </form>
    </div>
  );
}
