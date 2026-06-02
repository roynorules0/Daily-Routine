import React, { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, X, ShieldAlert, CheckCircle, Flame, Clock, Award } from 'lucide-react';
import { RoutineItem } from '../types';

interface BeastFocusOverlayProps {
  onCheckCompletion: (taskType: 'studyCompleted' | 'gymCompleted' | 'revisionCompleted') => void;
  activeTask: RoutineItem | null;
  addToast: (text: string, type: 'success' | 'error' | 'info') => void;
  onClose: () => void;
  addXp: (amount: number, reason: string) => void;
}

export default function BeastFocusOverlay({
  onCheckCompletion,
  activeTask,
  addToast,
  onClose,
  addXp
}: BeastFocusOverlayProps) {
  const [seconds, setSeconds] = useState(0);
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    let interval: any = null;
    if (isActive) {
      interval = setInterval(() => {
        setSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isActive]);

  const formatSecs = (totalSecs: number) => {
    const hrs = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;
    return [
      hrs.toString().padStart(2, '0'),
      mins.toString().padStart(2, '0'),
      secs.toString().padStart(2, '0')
    ].join(':');
  };

  const handleMarkCompleted = () => {
    if (activeTask) {
      if (activeTask.category === 'study') {
        onCheckCompletion('studyCompleted');
        addXp(150, 'Master Study Focus block completed');
      } else if (activeTask.category === 'gym') {
        onCheckCompletion('gymCompleted');
        addXp(120, 'Heavy Gym core session completed');
      } else if (activeTask.category === 'revision') {
        onCheckCompletion('revisionCompleted');
        addXp(100, 'Formula recall revision block completed');
      } else {
        addXp(80, 'Beast Routine block mark check');
      }
      addToast(`Superb! Marked ${activeTask.name} as Completed in Beast Focus.`, 'success');
    } else {
      addToast('Marked custom interval blocks completed.', 'success');
      addXp(50, 'Custom focus block check');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/98 flex flex-col justify-between p-6 overflow-hidden animate-fade-in text-left">
      
      {/* Top Banner Alert Row */}
      <div className="flex items-center justify-between border-b border-zinc-900 pb-4">
        <div className="flex items-center gap-2">
          <Flame className="w-5 h-5 text-red-500 animate-pulse shrink-0" />
          <div>
            <h1 className="text-xs font-black tracking-widest text-red-500 font-mono uppercase">
              BEAST INTENSITY FOCUS BLOCK ACTIVE
            </h1>
            <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider font-mono">
              All browser notifications & secondary UI assets suspended
            </p>
          </div>
        </div>
        
        <button
          onClick={onClose}
          className="p-1.5 bg-red-650 hover:bg-red-500 text-white font-bold rounded-xl border-0 cursor-pointer text-xs uppercase font-mono tracking-wider px-3.5"
        >
          Disable focus
        </button>
      </div>

      {/* Main Focus Core (Active Task, Timer, Progress Indicators) */}
      <div className="max-w-md mx-auto w-full text-center space-y-10 my-auto">
        
        {/* Active Block HUD */}
        <div className="space-y-2">
          <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500 font-mono">
            CURRENT TARGET BLOCK
          </span>
          <div className="bg-zinc-950 p-5 rounded-2xl border border-zinc-900">
            <h2 className="text-2xl font-black text-white tracking-tight leading-snug">
              {activeTask ? activeTask.name : 'Focus Expansion Interval'}
            </h2>
            <p className="text-xs text-zinc-400 font-medium font-mono mt-1">
              Time: {activeTask ? `${activeTask.start} - ${activeTask.end}` : 'Open Block Strategy'}
            </p>
          </div>
        </div>

        {/* Stopwatch Timer Display */}
        <div className="space-y-3">
          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest font-mono block">
            SESSION ELAPSED TIME
          </span>
          <div className="text-6xl md:text-7xl font-mono tracking-tight font-black text-red-550 selection:bg-red-500/20">
            {formatSecs(seconds)}
          </div>
          
          <div className="flex justify-center items-center gap-3 pt-2">
            <button
              onClick={() => setIsActive(!isActive)}
              className={`px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-wider border-0 cursor-pointer ${
                isActive 
                  ? 'bg-zinc-900 text-amber-500 border border-zinc-800' 
                  : 'bg-red-650 hover:bg-red-600 text-white shadow-lg shadow-red-500/10'
              }`}
            >
              {isActive ? 'Pause Interval' : 'Start Focus'}
            </button>
            <button
              onClick={() => {
                setIsActive(false);
                setSeconds(0);
                addToast('Focus stopwatch timer reset.', 'info');
              }}
              className="p-3 bg-zinc-950 hover:bg-zinc-900 text-zinc-405 hover:text-white rounded-2xl cursor-pointer border border-zinc-850"
              title="Reset Timer"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Core Checklist Buttons */}
        <div className="space-y-3">
          <button
            onClick={handleMarkCompleted}
            className="w-full bg-gradient-to-r from-red-650 to-amber-600 text-white font-black text-xs py-4 px-4 rounded-2xl cursor-pointer border-0 shadow-lg uppercase tracking-wider flex items-center justify-center gap-2"
          >
            <CheckCircle className="w-4 h-4" />
            Mark Current routine Block Done
          </button>
          <p className="text-[10px] text-zinc-550 italic font-mono">
            Completing targets inside Beast Focus awards premium XP bonuses. Maintain study integrity!
          </p>
        </div>

      </div>

      {/* Footer military-alert details */}
      <div className="max-w-md mx-auto w-full border-t border-zinc-90 w-full pt-4 flex items-center justify-between text-[11px] text-zinc-500 font-mono">
        <span className="flex items-center gap-1">
          <Clock className="w-3.5 h-3.5 text-zinc-600" />
          Offline Combat State Active
        </span>
        <span>Roy No Rules © 2026</span>
      </div>

    </div>
  );
}
