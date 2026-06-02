import React, { useState } from 'react';
import { ShieldCheck, AlertOctagon, Flame, LayoutGrid, EyeOff, CheckSquare, Sparkles, Zap, Minimize2, Trash } from 'lucide-react';

interface DisciplineAndDetoxProps {
  geminiApiKey?: string;
  addToast: (text: string, type: 'success' | 'error' | 'info') => void;
  addXp: (amount: number, reason: string) => void;
  isDetoxActive: boolean;
  setDetoxActive: (val: boolean) => void;
}

export default function DisciplineAndDetox({
  geminiApiKey,
  addToast,
  addXp,
  isDetoxActive,
  setDetoxActive
}: DisciplineAndDetoxProps) {
  // DISCIPLINE RECOVERY STATE
  const [loadingRecovery, setLoadingRecovery] = useState(false);
  const [recoveryDuration, setRecoveryDuration] = useState<'3-Day Protocol' | '7-Day Protocol' | '14-Day Protocol'>('7-Day Protocol');
  const [missedRoutines, setMissedRoutines] = useState('');
  const [recoveryPlan, setRecoveryPlan] = useState<any>(() => {
    const saved = localStorage.getItem('roy_active_recovery_plan');
    return saved ? JSON.parse(saved) : null;
  });

  const [activePlanChecked, setActivePlanChecked] = useState<Record<number, boolean>>({});

  const initiateRebootProtocol = async () => {
    setLoadingRecovery(true);
    try {
      const res = await fetch('/api/ai-discipline-recovery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recoveryDuration,
          missedRoutines: missedRoutines || 'General distraction and missed morning study sessions',
          geminiApiKey
        })
      });
      const data = await res.json();
      setRecoveryPlan(data);
      localStorage.setItem('roy_active_recovery_plan', JSON.stringify(data));
      addToast(`Discipline protocol initialized! ${recoveryDuration} active reboot.`, 'success');
      addXp(150, `Started Recovery protocol: ${recoveryDuration}`);
    } catch {
      addToast('Online AI protocol initialization failed. Loaded local recovery guidelines.', 'error');
    } finally {
      setLoadingRecovery(false);
    }
  };

  const handleToggleRecoveryItem = (idx: number, isChecked: boolean) => {
    const nextStates = { ...activePlanChecked, [idx]: isChecked };
    setActivePlanChecked(nextStates);

    if (isChecked) {
      addToast('Discipline checkpoint complete!', 'success');
      addXp(30, 'Completed recovery item milestone');
    }
  };

  const clearRecoveryProtocol = () => {
    setRecoveryPlan(null);
    setActivePlanChecked({});
    localStorage.removeItem('roy_active_recovery_plan');
    addToast('Discipline Recovery Protocol Completed & Cleared successfully.', 'info');
  };

  // DETOX STATE FOR FOCUS
  const [detoxTimerHours, setDetoxTimerHours] = useState(4);
  const [isDetoxTimerRunning, setIsDetoxTimerRunning] = useState(false);
  const [detoxTimeRemaining, setDetoxTimeRemaining] = useState(0);

  const startDetoxTimer = () => {
    setDetoxActive(true);
    setIsDetoxTimerRunning(true);
    setDetoxTimeRemaining(detoxTimerHours * 3600);
    addToast(`Dopamine Detox initialized! Blocking out unessential panels for ${detoxTimerHours} hours.`, 'info');
    
    // Decrement handler in client
    const interval = setInterval(() => {
      setDetoxTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setDetoxActive(false);
          setIsDetoxTimerRunning(false);
          addToast('🎉 Immersive Dopamine Detox Complete! Your mental receptors are restored.', 'success');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const formatDetoxTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

      {/* 🛡 1. DISCIPLINE RECOVERY PROTOCOL */}
      <div className="bg-zinc-900/35 border border-zinc-850 rounded-3xl p-6 text-left space-y-4">
        <div className="flex items-center justify-between border-b border-zinc-850 pb-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-indigo-400" />
            <h2 className="text-sm font-bold uppercase text-white tracking-widest font-mono">Discipline Recovery Mode</h2>
          </div>
          <span className="text-xs font-bold font-mono text-zinc-400">Reset Alignment</span>
        </div>

        {!recoveryPlan ? (
          <div className="space-y-3.5">
            <p className="text-xs text-zinc-400 leading-relaxed font-sans">
              Missed a biology mock exam or stayed awake staring at cellular boards? Trigger the AI Combat Reset to bypass friction blocks.
            </p>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block font-mono">Select protocol speed</label>
              <select
                value={recoveryDuration}
                onChange={(e: any) => setRecoveryDuration(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-850 rounded-xl px-3 py-2 text-xs text-white"
              >
                <option value="3-Day Protocol">⚡ 3-Day Rapid Blast Protocol</option>
                <option value="7-Day Protocol">🥊 7-Day Hard-Reset Sync Protocol</option>
                <option value="14-Day Protocol">🌋 14-Day Beast Mode Reconstruction</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block font-mono">What did we fail today?</label>
              <textarea
                value={missedRoutines}
                onChange={(e) => setMissedRoutines(e.target.value)}
                placeholder="e.g. Skipped gym compound lifting, slept till 2:00 PM, procrastinated organic conversion tests"
                rows={2}
                className="w-full bg-zinc-950 border border-zinc-850 rounded-xl p-2.5 text-xs text-white"
              />
            </div>

            <button
              onClick={initiateRebootProtocol}
              disabled={loadingRecovery}
              className="w-full bg-indigo-650 hover:bg-indigo-500 text-white font-mono font-bold text-xs py-3 rounded-xl cursor-pointer transition-all border-0 shadow-md uppercase tracking-wider flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              {loadingRecovery ? 'Pinging AI Reset Vectors...' : 'Lock Initial Reboot Protocol'}
            </button>
          </div>
        ) : (
          <div className="space-y-4 animate-fade-in">
            {/* Active Plan Dashboard */}
            <div className="bg-zinc-950 p-4 rounded-xl border border-indigo-500/10 space-y-3">
              <div className="flex justify-between items-center pb-2.5 border-b border-indigo-900/10">
                <span className="text-[10px] font-black text-indigo-400 uppercase font-mono tracking-widest">
                  🚨 ACTIVE {recoveryPlan.dailyTargetXpBonus ? 'BOOST' : 'RECOVER'} METRICS
                </span>
                <span className="text-[9px] bg-emerald-650/15 text-emerald-400 px-2 py-0.5 rounded font-bold font-mono">
                  +{recoveryPlan.dailyTargetXpBonus || 150} XP Bonus Allocation
                </span>
              </div>

              <p className="text-[11.5px] italic text-zinc-400 leading-relaxed text-left">
                "{recoveryPlan.philosophy}"
              </p>

              {/* Steps */}
              <div className="space-y-2.5 pt-2">
                <span className="text-[10px] uppercase font-bold text-zinc-500 font-mono tracking-wider block">Reboot task checklists:</span>
                
                <div className="space-y-2">
                  {recoveryPlan.recoveryPlan?.map((step: string, idx: number) => {
                    const isChecked = !!activePlanChecked[idx];
                    return (
                      <label key={idx} className="flex items-start gap-2.5 text-xs text-zinc-300 select-none cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => handleToggleRecoveryItem(idx, e.target.checked)}
                          className="w-3.5 h-3.5 accent-indigo-505 rounded bg-zinc-950 border border-zinc-800 shrink-0 mt-0.5"
                        />
                        <span className={isChecked ? 'line-through text-zinc-500' : ''}>{step}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>

            <button
              onClick={clearRecoveryProtocol}
              className="w-full bg-zinc-950 hover:bg-zinc-900 border border-zinc-850 hover:border-zinc-700 font-mono text-[10px] tracking-wider uppercase font-bold text-zinc-400 py-2.5 rounded-xl cursor-pointer"
            >
              Conclude Recovery protocol
            </button>
          </div>
        )}
      </div>

      {/* 🧠 2. DOPAMINE DETOX FOCUS OVERLAY CONTROLLER */}
      <div className="bg-zinc-900/35 border border-zinc-850 rounded-3xl p-6 text-left space-y-4">
        <div className="flex items-center justify-between border-b border-zinc-850 pb-3">
          <div className="flex items-center gap-2">
            <AlertOctagon className="w-5 h-5 text-red-500 animate-pulse" />
            <h2 className="text-sm font-bold uppercase text-white tracking-widest font-mono">Dopamine Detox Mode</h2>
          </div>
          <span className="text-xs font-bold font-mono text-red-500">MIND SHIELD</span>
        </div>

        <p className="text-xs text-zinc-400 leading-relaxed text-left">
          Silence external chat variables, Telegram dispatchings, financial records, and charts. Re-sensitize your receptors by displaying only clean study timers.
        </p>

        {!isDetoxTimerRunning ? (
          <div className="space-y-3.5 bg-zinc-950 p-4 rounded-xl border border-zinc-900">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block font-mono">Detox duration limit</span>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="1"
                  max="12"
                  value={detoxTimerHours}
                  onChange={(e) => setDetoxTimerHours(Number(e.target.value))}
                  className="flex-1 accent-red-550 bg-zinc-90 w-full"
                />
                <span className="font-mono text-xs font-black text-white w-14 text-right">
                  {detoxTimerHours} Hours
                </span>
              </div>
            </div>

            <button
              onClick={startDetoxTimer}
              className="w-full bg-gradient-to-r from-red-650 to-orange-600 hover:from-red-600 hover:to-orange-550 text-white font-mono font-bold text-xs py-3 rounded-xl cursor-pointer transition-all border-0 shadow-md uppercase tracking-wider flex items-center justify-center gap-2"
            >
              <EyeOff className="w-4 h-4" />
              Engage Immersive Dopamine Detox
            </button>
          </div>
        ) : (
          <div className="p-4 bg-zinc-950 rounded-xl border border-red-500/25 space-y-4 animate-pulse">
            <div className="text-center space-y-1">
              <span className="text-[9px] uppercase tracking-widest text-red-400 font-mono font-black block">IMMERSIVE MIND DEFENSE ACTIVATED</span>
              <p className="text-3xl font-mono font-black tracking-widest text-white">
                {formatDetoxTime(detoxTimeRemaining)}
              </p>
              <span className="text-[10px] text-zinc-500 font-mono block">DO NOT CLOSE APP • NO OTHER CHANNELS ACCESSIBLE</span>
            </div>

            <button
              onClick={() => {
                setDetoxActive(false);
                setIsDetoxTimerRunning(false);
                addToast('Dopamine Detox manually disengaged.', 'info');
              }}
              className="w-full bg-zinc-900 border border-zinc-805 text-zinc-400 hover:text-white hover:bg-zinc-850 font-mono text-[9px] font-bold tracking-widest py-2 rounded-lg cursor-pointer uppercase text-center"
            >
              Escape Immersive Shield
            </button>
          </div>
        )}
      </div>

    </div>
  );
}
