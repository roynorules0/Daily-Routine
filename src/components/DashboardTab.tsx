import React, { useState, useEffect } from 'react';
import { 
  Clock, Calendar, Sparkles, BookOpen, Dumbbell, Stethoscope, 
  Moon, CheckCircle, RefreshCcw, Trophy, ArrowRight, ShieldAlert,
  Flame, Target, AlertCircle, TrendingUp, Compass, Heart, Zap, Play, Plus, Trash
} from 'lucide-react';
import { RoutineItem, Streak, Achievement } from '../types';

interface DashboardTabProps {
  currentTime: string;
  currentDate: string;
  currentDay: string;
  activeTask: RoutineItem | null;
  nextTask: RoutineItem | null;
  disciplineScore: number;
  streak: Streak;
  achievements: Achievement[];
  studyHoursCompleted: number;
  dailyTrack: {
    studyCompleted: boolean;
    gymCompleted: boolean;
    revisionCompleted: boolean;
    walkingCompleted: boolean;
    sleepCompleted: boolean;
    clinicCompleted: boolean;
  };
  toggleDailyTask: (taskType: 'studyCompleted' | 'gymCompleted' | 'revisionCompleted' | 'walkingCompleted' | 'sleepCompleted' | 'clinicCompleted') => void;
  openaiMotivation: string;
  loadingMotivation: boolean;
  refreshMotivation: () => void;
  getPlannerAdvice: () => void;
  plannerAdvice: string;
  loadingPlanner: boolean;
  routine: RoutineItem[];
}

export default function DashboardTab({
  currentTime,
  currentDate,
  currentDay,
  activeTask,
  nextTask,
  disciplineScore,
  streak,
  achievements,
  studyHoursCompleted,
  dailyTrack,
  toggleDailyTask,
  openaiMotivation,
  loadingMotivation,
  refreshMotivation,
  getPlannerAdvice,
  plannerAdvice,
  loadingPlanner,
  routine
}: DashboardTabProps) {
  const [activeSegment, setActiveSegment] = useState<'now' | 'pending' | 'priority' | 'improve'>('now');
  
  // Discipline OS Real-time Goals Tracker
  const [goals, setGoals] = useState<{ id: string; name: string; targetDate: string }[]>(() => {
    const saved = localStorage.getItem('roy_countdown_goals');
    return saved ? JSON.parse(saved) : [
      { id: 'g1', name: 'NEET Main Exam Countdown', targetDate: '2026-07-25' },
      { id: 'g2', name: 'Physical Transformation Target', targetDate: '2026-08-15' }
    ];
  });
  const [newGoalName, setNewGoalName] = useState('');
  const [newGoalDate, setNewGoalDate] = useState('2026-07-25');
  const [showAddGoal, setShowAddGoal] = useState(false);

  // Sync back local countdown goals
  useEffect(() => {
    localStorage.setItem('roy_countdown_goals', JSON.stringify(goals));
  }, [goals]);

  // Handle dynamic greetings
  const getGreeting = () => {
    const hrs = new Date().getHours();
    if (hrs < 12) return "Good Morning";
    if (hrs < 17) return "Good Afternoon";
    return "Good Evening";
  };

  // XP & Level calculations
  const xpValue = Number(localStorage.getItem('roy_beast_xp')) || 340;
  const currLevel = Math.max(1, Math.floor(Math.sqrt(xpValue / 10)));
  const xpForNextLevel = Math.pow(currLevel + 1, 2) * 10;
  const xpCurrentBase = Math.pow(currLevel, 2) * 10;
  const xpProgressPercent = Math.round(((xpValue - xpCurrentBase) / (xpForNextLevel - xpCurrentBase)) * 100) || 0;

  // Calculates percentage of routine tasks completed today (out of 6 blocks)
  const calculateDailyCompletionPercent = () => {
    const items = ['studyCompleted', 'gymCompleted', 'revisionCompleted', 'walkingCompleted', 'sleepCompleted', 'clinicCompleted'];
    const completed = items.filter(k => dailyTrack[k as keyof typeof dailyTrack]).length;
    return Math.round((completed / items.length) * 100);
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'study': return <BookOpen className="w-4 h-4 text-amber-400" />;
      case 'gym': return <Dumbbell className="w-4 h-4 text-rose-455" />;
      case 'clinic': return <Stethoscope className="w-4 h-4 text-emerald-400" />;
      case 'revision': return <RefreshCcw className="w-4 h-4 text-violet-400" />;
      case 'sleep': return <Moon className="w-4 h-4 text-sky-455" />;
      default: return <Clock className="w-4 h-4 text-zinc-400" />;
    }
  };

  const getCategoryThemeClass = (category: string) => {
    switch (category) {
      case 'study': return 'text-amber-400 bg-amber-500/10 border-amber-500/15';
      case 'gym': return 'text-rose-455 bg-rose-500/10 border-rose-500/15';
      case 'clinic': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/15';
      case 'revision': return 'text-violet-400 bg-violet-500/10 border-violet-500/15';
      case 'sleep': return 'text-sky-500 bg-sky-500/10 border-sky-500/15';
      default: return 'text-zinc-405 bg-zinc-500/10 border-zinc-805';
    }
  };

  // Countdown goal timer logic
  const calculateDaysRemaining = (targetStr: string) => {
    const diff = new Date(targetStr).getTime() - new Date().getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return days > 0 ? `${days} Days Left` : 'Target Achieved';
  };

  // Add countdown goal
  const handleAddGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGoalName.trim()) return;
    const newG = { id: 'g-' + Date.now(), name: newGoalName, targetDate: newGoalDate };
    setGoals(prev => [newG, ...prev]);
    setNewGoalName('');
    setShowAddGoal(false);
  };

  const handleDeleteGoal = (id: string) => {
    setGoals(prev => prev.filter(g => g.id !== id));
  };

  // Smart AI Home Local Inference logic
  const getSmartAIAdvice = () => {
    let whatNowAdvice = "Resting State";
    let priority = "Revise Physics weak chapters";
    let improvementHint = "Consistent water & sleep routines need focus";

    if (activeTask) {
      if (activeTask.category === 'study') {
        whatNowAdvice = `Start your continuous deep study block. Open Biology NEET chapter and lock your focus. No phone notifications!`;
        priority = `Read: ${activeTask.name}`;
        improvementHint = studyHoursCompleted < 5 ? `You have completed ${studyHoursCompleted}h study. Complete remaining study blocks to maintain 100/100.` : `Awesome! Study goal fully secured today!`;
      } else if (activeTask.category === 'gym') {
        whatNowAdvice = `Focus time: Hardcore Gym Session is active! Turn on High Intensity music, complete all configured workout sets, and track form.`;
        priority = `Lifting Session`;
        improvementHint = `Form and control under heavy weight stimulates muscle fibers. Try to limit rest to 90s.`;
      } else if (activeTask.category === 'clinic') {
        whatNowAdvice = `At Morning/Evening Clinic. Observe practical cases closely. Think like an experienced professional.`;
        priority = `Patient Diagnosis`;
        improvementHint = `Focus of medical practice builds real diagnostic reflexes. Make notes.`;
      } else if (activeTask.category === 'revision') {
        whatNowAdvice = `Rapid 30-minute revision. Check weak subjects list in chemistry and biology study boards immediately!`;
        priority = `Revision run`;
        improvementHint = `Spaced repetition accelerates conceptual memory. Don't skip today's revision.`;
      } else {
        whatNowAdvice = `Active Block: "${activeTask.name}". This is essential for recovering neural synapses and maintaining biometrics.`;
        priority = `Physical Recovery`;
        improvementHint = `Proper hydration & nutrition intake are core variables of this phase.`;
      }
    }

    const pendingList: string[] = [];
    if (!dailyTrack.studyCompleted) pendingList.push("Study Core Session (5 Hours)");
    if (!dailyTrack.gymCompleted) pendingList.push("Hardcore Gym Workout");
    if (!dailyTrack.clinicCompleted) pendingList.push("Clinic Internship Training");
    if (!dailyTrack.revisionCompleted) pendingList.push("Rapid Concept Revision");
    if (!dailyTrack.walkingCompleted) pendingList.push("Mental Decompress Walk");

    return { whatNowAdvice, pendingList, priority, improvementHint };
  };

  const aiHome = getSmartAIAdvice();

  return (
    <div className="space-y-6 pb-26 animate-fade-in" id="personal-command-center">
      
      {/* 🚀 TOP HERO: Glassmorphic Personal Header */}
      <div className="relative overflow-hidden rounded-3xl premium-glass p-6 border-zinc-800/80">
        {/* Decorative dynamic neon fluid glowing background sphere */}
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-44 h-44 rounded-full blur-3xl pointer-events-none opacity-40 bg-[radial-gradient(ellipse_at_center,_var(--theme-primary,_#6366f1)_0%,_transparent_70%)] animate-breathe-glow" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1 text-left">
            <span className="text-[10px] sm:text-xs uppercase tracking-widest text-[var(--theme-primary,#6366f1)] font-black flex items-center gap-1.5 font-mono">
              <Compass className="w-3.5 h-3.5" />
              ROY DISCIPLINE OPERATING SYSTEM V3
            </span>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white font-sans">
              {getGreeting()}, <span className="bg-gradient-to-r from-white via-zinc-100 to-zinc-400 bg-clip-text text-transparent underline decoration-[var(--theme-primary,#6366f1)] decoration-2">Ritik</span>
            </h1>
            <p className="text-xs text-zinc-400 leading-normal font-sans">
              System Sync Status: <span className="text-emerald-400 font-bold font-mono">● ONLINE (PWA Cached)</span> • 12-Hour AM/PM Format Active
            </p>
          </div>

          {/* Real-time elegant Clock & HUD metrics */}
          <div className="flex items-center gap-4 bg-black/40 border border-zinc-900 p-3 rounded-2xl shrink-0">
            <div className="text-left font-mono">
              <span className="text-[10px] text-zinc-500 uppercase font-sans tracking-wide block">{currentDay}</span>
              <span className="text-xl font-bold text-white tracking-tight">{currentTime}</span>
              <span className="text-[9px] text-zinc-400 block font-sans">{currentDate}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 📊 BENTO GRID CORE METRICS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* 1. DISCIPLINE SCORE INNER CIRCULAR RING */}
        <div className="premium-glass rounded-3xl p-5 border-zinc-800/80 flex flex-col justify-between relative group/card min-h-48">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest font-mono">Discipline Score</span>
            <Target className="w-4 h-4 text-zinc-500" />
          </div>

          <div className="my-3 flex items-center gap-4">
            <div className="relative flex items-center justify-center shrink-0">
              <svg className="w-20 h-20 transform -rotate-90">
                <circle cx="40" cy="40" r="32" className="stroke-zinc-900" strokeWidth="6" fill="transparent" />
                <circle 
                  cx="40" 
                  cy="40" 
                  r="32" 
                  className="stroke-[var(--theme-primary,#6366f1)] premium-ring" 
                  strokeWidth="6" 
                  fill="transparent"
                  strokeDashoffset={251.2 - (251.2 * disciplineScore) / 100}
                />
              </svg>
              <span className="absolute text-base font-bold font-mono text-white text-shadow-sm">{disciplineScore}</span>
            </div>
            <div className="text-left space-y-0.5">
              <p className="text-xs text-zinc-300 font-bold">Rating: {disciplineScore >= 80 ? '👑 Elite Elite' : disciplineScore >= 50 ? '⚡ Standard' : '⚠️ Danger Zone'}</p>
              <p className="text-[11px] text-zinc-500 leading-normal">Keep routine intact daily to lock in 100/100 rating.</p>
            </div>
          </div>

          <div className="text-left border-t border-zinc-900 pt-3 flex items-center gap-1.5 text-[10px] text-zinc-400 font-sans">
            <ShieldAlert className="w-3.5 h-3.5 text-[var(--theme-primary,#6366f1)] shrink-0" />
            <span>Automated Telegram notifications linked</span>
          </div>
        </div>

        {/* 2. DYNAMIC LEVEL & XP SYSTEM */}
        <div className="premium-glass rounded-3xl p-5 border-zinc-800/80 flex flex-col justify-between min-h-48">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest font-mono">Roy Beast XP Level</span>
            <Flame className="w-4 h-4 text-orange-500" />
          </div>

          <div className="my-2 text-left">
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-black font-mono tracking-tight text-white">Lvl {currLevel}</span>
              <span className="text-xs font-bold text-zinc-400">{xpValue} total XP</span>
            </div>

            {/* Level XP Progress Bar */}
            <div className="mt-3.5">
              <div className="flex justify-between text-[10px] font-mono text-zinc-500 mb-1">
                <span>XP Progress</span>
                <span>{xpProgressPercent}% Completed</span>
              </div>
              <div className="w-full h-2 bg-zinc-950 border border-zinc-900 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-[var(--theme-primary,#6366f1)] to-orange-500 duration-500" 
                  style={{ width: `${xpProgressPercent}%` }}
                />
              </div>
            </div>
          </div>

          <div className="text-left border-t border-zinc-900 pt-3 text-[10px] font-medium text-zinc-400 flex items-center gap-1">
            <Zap className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            <span>Completed study and exercises boost levels</span>
          </div>
        </div>

        {/* 3. CORE ACTIVE STATUS BLOCK */}
        <div className="premium-glass rounded-3xl p-5 border-zinc-800/80 flex flex-col justify-between min-h-48 relative overflow-hidden">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold text-zinc-455 uppercase tracking-widest font-mono">Current Focus Window</span>
            <span className="text-[9px] uppercase font-black px-2 py-0.5 bg-red-500/10 text-rose-400 rounded-full border border-red-500/20">
              ACTIVE NOW
            </span>
          </div>

          <div className="my-2 text-left flex items-start gap-3">
            <div className={`p-2.5 rounded-xl shrink-0 border ${activeTask ? getCategoryThemeClass(activeTask.category) : 'bg-zinc-900 border-zinc-800 text-zinc-400'}`}>
              {activeTask ? getCategoryIcon(activeTask.category) : <Clock className="w-5 h-5 text-zinc-500" />}
            </div>
            <div className="min-w-0">
              <h2 className="text-base font-extrabold text-white tracking-tight leading-snug truncate">
                {activeTask ? activeTask.name : 'Routine Transition State'}
              </h2>
              <p className="text-[11px] font-semibold text-zinc-450 mt-1 font-mono">
                {activeTask ? `${activeTask.start} - ${activeTask.end}` : '--:--'}
              </p>
            </div>
          </div>

          {nextTask && (
            <div className="border-t border-zinc-900 pt-3 flex items-center justify-between text-[11px] text-zinc-450 font-medium">
              <span className="flex items-center gap-1 shrink truncate">
                <ArrowRight className="w-3 h-3 text-[var(--theme-primary,#6366f1)] shrink-0" />
                Up Next: <strong className="text-zinc-200 font-bold leading-none truncate">{nextTask.name}</strong>
              </span>
              <span className="font-mono text-zinc-500 shrink-0">{nextTask.start}</span>
            </div>
          )}
        </div>

      </div>

      {/* 💡 SMART AI HOME EXPERIENCE SECTION */}
      <div className="premium-glass rounded-3xl p-6 border-zinc-800/80 relative text-left">
        <div className="flex items-center justify-between border-b border-zinc-900 pb-4 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[var(--theme-primary-alpha,rgba(99,102,241,0.15))] text-[var(--theme-primary,#6366f1)]">
              <Sparkles className="w-4 h-4 text-[var(--theme-primary,#6366f1)]" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-zinc-100 uppercase tracking-wider font-sans">SMART AI AUTOPILOT COACH</h3>
              <p className="text-[10px] text-zinc-550 mt-0.5">Automated algorithmic analysis of daily variables - No manual searching</p>
            </div>
          </div>
          
          <button 
            type="button" 
            onClick={getPlannerAdvice} 
            className="p-1 px-3 rounded-lg text-xs font-bold border border-zinc-800 bg-zinc-950 hover:bg-zinc-900 hover:border-zinc-700 transition-all text-zinc-400 cursor-pointer flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Advise Now
          </button>
        </div>

        {/* SMART EXECUTIVE TAB DIRECTIVES LINK */}
        <div className="grid grid-cols-4 gap-1.5 bg-black/60 p-1.5 rounded-2xl border border-zinc-900 mb-5 text-center">
          {[
            { id: 'now', label: 'What to do now?', icon: Compass },
            { id: 'pending', label: 'What is pending?', icon: Clock },
            { id: 'priority', label: 'Today\'s priority?', icon: Target },
            { id: 'improve', label: 'What to improve?', icon: TrendingUp }
          ].map((seg) => {
            const Icon = seg.icon;
            const active = activeSegment === seg.id;
            return (
              <button
                key={seg.id}
                onClick={() => setActiveSegment(seg.id as any)}
                className={`py-2 px-1 rounded-xl text-[9px] sm:text-xs font-extrabold uppercase transition-all tracking-wider flex flex-col sm:flex-row items-center justify-center gap-1.5 cursor-pointer select-none ${
                  active 
                    ? 'bg-zinc-900 text-white shadow font-black border border-zinc-800'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${active ? 'text-[var(--theme-primary,#6366f1)]' : 'text-zinc-500'}`} />
                <span>{seg.label}</span>
              </button>
            );
          })}
        </div>

        {/* DIRECT EFFECT RENDERS */}
        <div className="bg-black/35 rounded-2xl p-4.5 border border-zinc-900/60 min-h-24 flex flex-col justify-center">
          {activeSegment === 'now' && (
            <div className="space-y-2 animate-fade-in text-left">
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase tracking-widest font-bold text-amber-500 font-mono">Direct Directive</span>
              </div>
              <p className="text-xs sm:text-sm text-zinc-200 leading-relaxed font-sans">{aiHome.whatNowAdvice}</p>
              {plannerAdvice && (
                <div className="mt-3 p-3 bg-[var(--theme-primary-alpha,rgba(99,102,241,0.1))] border border-dashed border-[var(--theme-primary,#6366f1)]/30 rounded-xl">
                  <p className="text-xs text-zinc-300 italic"><strong className="text-[var(--theme-primary,#6366f1)] not-italic font-bold">AI Coach advice:</strong> "{plannerAdvice}"</p>
                </div>
              )}
            </div>
          )}

          {activeSegment === 'pending' && (
            <div className="space-y-3.5 animate-fade-in text-left">
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase tracking-widest font-bold text-rose-500 font-mono">Uncompleted Tasks</span>
              </div>
              {aiHome.pendingList.length === 0 ? (
                <div className="flex items-center gap-2 text-emerald-400">
                  <CheckCircle className="w-4 h-4" />
                  <span className="text-xs font-bold font-sans">Phenomenal! All core task blocks checked for today!</span>
                </div>
              ) : (
                <div className="space-y-2">
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {aiHome.pendingList.map((item, idx) => (
                      <li key={idx} className="flex items-center gap-2 bg-zinc-950 p-2.5 rounded-lg border border-zinc-900">
                        <div className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-pulse" />
                        <span className="text-[11px] text-zinc-400 font-bold font-mono">{item}</span>
                      </li>
                    ))}
                  </ul>
                  <p className="text-[10px] text-zinc-550 pt-1 leading-normal font-sans">Ensure you toggle complete as you execute. Every missing block affects cumulative score ratios.</p>
                </div>
              )}
            </div>
          )}

          {activeSegment === 'priority' && (
            <div className="space-y-2.5 animate-fade-in text-left">
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase tracking-widest font-bold text-indigo-400 font-mono">Highest Leverage Objective</span>
              </div>
              <p className="text-xs sm:text-sm text-zinc-200 leading-relaxed font-sans font-medium">
                Today's absolute priority lock: <strong className="text-white bg-[var(--theme-primary-alpha,rgba(99,102,241,0.15))] px-2 py-1 rounded border border-[var(--theme-primary,#6366f1)]/20 text-shadow">{aiHome.priority}</strong>
              </p>
              <p className="text-[11px] text-zinc-550 leading-relaxed font-sans">
                Concentrate and finish this objective first. Postpone low-leverage entertainment, social feeds, and casual chats. Strict discipline is the rules.
              </p>
            </div>
          )}

          {activeSegment === 'improve' && (
            <div className="space-y-2.5 animate-fade-in text-left">
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase tracking-widest font-bold text-emerald-400 font-mono">Consistency Engineering Guide</span>
              </div>
              <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed font-sans">{aiHome.improvementHint}</p>
              <div className="pt-2 text-[11px] text-zinc-500 leading-normal flex items-start gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 text-zinc-550 mt-0.5 shrink-0" />
                <span>Accumulating consistency triggers milestone XP achievements, unlocking customized theme creators and aesthetic medals.</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ⚡ DISCIPLINE OPERATING SYSTEM CHECKLIST CHECKLIST */}
      <div className="premium-glass rounded-3xl p-6 border-zinc-800/80 relative text-left">
        <div className="flex justify-between items-center mb-4 border-b border-zinc-900 pb-3">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 font-mono">Discipline OS Quick-Action Hub</h3>
            <p className="text-[10px] text-zinc-550 mt-0.5">Execution logs sync automatically to local database</p>
          </div>
          
          <span className="text-[10px] font-black font-mono px-2.5 py-1 text-emerald-455 bg-emerald-500/10 border border-emerald-500/15 rounded-lg">
            {calculateDailyCompletionPercent()}% Done Today
          </span>
        </div>

        {/* Progress horizontal status tracker bar */}
        <div className="w-full h-3 bg-zinc-950 rounded-full overflow-hidden border border-zinc-900 mb-6 relative">
          <div 
            className="h-full bg-gradient-to-r from-[var(--theme-primary,#6366f1)] to-emerald-500 ease-out duration-1000 shadow-md" 
            style={{ width: `${calculateDailyCompletionPercent()}%` }}
          />
        </div>

        {/* Master checklist trackers layout */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { key: 'studyCompleted', label: 'Study session completed (5 Hours)', icon: <BookOpen className="w-4 h-4" /> },
            { key: 'gymCompleted', label: 'Physical workout sets executed', icon: <Dumbbell className="w-4 h-4" /> },
            { key: 'clinicCompleted', label: 'Clinic duty training completed', icon: <Stethoscope className="w-4 h-4" /> },
            { key: 'revisionCompleted', label: 'Biology/Chemistry revision done', icon: <RefreshCcw className="w-4 h-4" /> },
            { key: 'sleepCompleted', label: 'Sufficient sleep (6-7h recovery)', icon: <Moon className="w-4 h-4" /> },
            { key: 'walkingCompleted', label: 'Decompression walking (Step count)', icon: <Clock className="w-4 h-4" /> },
          ].map((item) => {
            const checked = dailyTrack[item.key as keyof typeof dailyTrack];
            return (
              <button
                key={item.key}
                id={`toggle-task-${item.key}`}
                onClick={() => toggleDailyTask(item.key as any)}
                className={`flex items-center gap-3 p-3.5 rounded-2xl text-left border cursor-pointer select-none transition-all duration-300 relative ${
                  checked 
                    ? 'bg-zinc-900/60 border-zinc-800 text-white shadow-inner scale-[0.98]' 
                    : 'bg-black/35 border-zinc-900 text-zinc-400 hover:border-zinc-800/80 hover:bg-black/50'
                }`}
              >
                {/* Checkbox indicator */}
                <div className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center shrink-0 transition-all ${
                  checked 
                    ? 'bg-[var(--theme-primary,#6366f1)] border-[var(--theme-primary,#6366f1)] text-white shadow-shadow' 
                    : 'border-zinc-700 bg-zinc-950'
                }`}>
                  {checked && <CheckCircle className="w-3.5 h-3.5 stroke-[3.5]" />}
                </div>

                <div className="min-w-0 flex-1 leading-none text-left">
                  <p className={`text-xs font-bold leading-tight ${checked ? 'line-through text-zinc-550' : 'text-zinc-200'}`}>
                    {item.label}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ⏳ COUNTDOWN GOALS SYSTEM */}
      <div className="premium-glass rounded-3xl p-6 border-zinc-800/80 relative text-left">
        <div className="flex justify-between items-center border-b border-zinc-900 pb-3 mb-4">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 font-mono">COUNTDOWN GOALS & EXAM CRUCIBLES</h3>
            <p className="text-[10px] text-zinc-550 mt-0.5 font-sans">Ticking down in real-time. Block study schedule accordingly.</p>
          </div>
          
          <button
            type="button"
            onClick={() => setShowAddGoal(!showAddGoal)}
            className="p-1 px-3 text-xs bg-[var(--theme-primary-alpha,rgba(99,102,241,0.1))] hover:bg-[var(--theme-primary-alpha,rgba(99,102,241,0.2))] text-[var(--theme-primary,#6366f1)] border border-[var(--theme-primary,#6366f1)]/20 rounded-xl cursor-pointer transition-all font-bold"
          >
            {showAddGoal ? 'Minimize' : 'Add Goal'}
          </button>
        </div>

        {showAddGoal && (
          <form onSubmit={handleAddGoal} className="p-4 bg-black/55 rounded-2xl border border-zinc-900 space-y-3 mb-4 text-left">
            <span className="text-[9px] font-bold text-[var(--theme-primary,#6366f1)] uppercase tracking-wider font-mono">Create Countdown Goal</span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                type="text"
                required
                value={newGoalName}
                onChange={(e) => setNewGoalName(e.target.value)}
                placeholder="e.g. NEET Biology Mock Exam"
                className="bg-zinc-950 border border-zinc-900 text-xs text-white rounded-xl p-2.5 focus:border-[var(--theme-primary,#6366f1)] focus:outline-none placeholder-zinc-700"
              />
              <input
                type="date"
                required
                value={newGoalDate}
                onChange={(e) => setNewGoalDate(e.target.value)}
                className="bg-zinc-950 border border-zinc-900 text-xs text-white rounded-xl p-2.5 focus:border-[var(--theme-primary,#6366f1)] focus:outline-none text-zinc-400 cursor-pointer"
              />
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowAddGoal(false)}
                className="px-3 py-1.5 text-xs text-zinc-500 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 text-xs bg-[var(--theme-primary,#6366f1)] text-white font-bold rounded-xl cursor-pointer"
              >
                Assemble Countdown
              </button>
            </div>
          </form>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {goals.map((goal) => (
            <div 
              key={goal.id} 
              className="p-4 bg-black/45 border border-zinc-900 rounded-2xl flex items-center justify-between group hover:border-[var(--theme-primary,#6366f1)]/30 transition-all duration-300"
            >
              <div className="space-y-1 text-left">
                <span className="text-[9px] uppercase tracking-widest text-[#ef4444] font-black font-mono">ACTIVE TARGET</span>
                <h4 className="text-xs font-bold text-zinc-200 tracking-tight leading-tight">{goal.name}</h4>
                <p className="text-[10px] text-zinc-500 font-mono font-medium">{goal.targetDate}</p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black font-mono text-[var(--theme-primary,#6366f1)] uppercase tracking-wide bg-[var(--theme-primary-alpha,rgba(99,102,241,0.1))] border border-[var(--theme-primary,#6366f1)]/20 px-2.5 py-1 rounded-lg">
                  {calculateDaysRemaining(goal.targetDate)}
                </span>
                
                <button
                  type="button"
                  onClick={() => handleDeleteGoal(goal.id)}
                  className="p-1 px-1.5 bg-zinc-950 hover:bg-rose-950/20 text-zinc-600 hover:text-rose-400 rounded-lg opacity-40 group-hover:opacity-100 transition-all cursor-pointer"
                >
                  <Trash className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 🏆 ACHIEVEMENT SYSTEM PRO SECTION */}
      <div className="premium-glass rounded-3xl p-6 border-zinc-800/80 text-left">
        <div className="flex items-center justify-between border-b border-zinc-900 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-amber-450" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 font-mono">SYSTEM MEDAL CRYPTS</h3>
          </div>
          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest font-mono">
            {achievements.filter(a => a.unlocked).length} / {achievements.length} UNLOCKED
          </span>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {achievements.map((ach) => (
            <div 
              key={ach.id}
              className={`p-4 rounded-2xl border flex items-start gap-3.5 transition-all duration-300 ${
                ach.unlocked 
                  ? 'bg-zinc-900/60 border-zinc-800 text-zinc-200 shadow-md' 
                  : 'bg-black/30 border-zinc-950 text-zinc-500 opacity-60'
              }`}
            >
              <div className={`p-2 rounded-xl border shrink-0 ${
                ach.unlocked ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' : 'bg-zinc-950 border-zinc-900 text-zinc-700'
              }`}>
                <Trophy className="w-5 h-5 shrink-0" />
              </div>
              <div className="text-left space-y-0.5">
                <h4 className="text-xs font-bold tracking-tight leading-snug">{ach.title}</h4>
                <p className="text-[11px] text-zinc-400/80 leading-normal">{ach.description}</p>
                {ach.unlocked && ach.unlockedAt && (
                  <span className="inline-block bg-amber-500/10 text-[8px] text-amber-300 font-bold uppercase tracking-wider mt-2 px-1.5 py-0.5 rounded border border-amber-500/25 font-mono">
                    PRO SECURED ON {ach.unlockedAt.toUpperCase()}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ☠️ BRUTAL COACH DAILY REMARKS */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-zinc-950 via-zinc-900 to-zinc-950 border border-zinc-800 p-6 shadow-xl text-left">
        <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-indigo-600/10 to-transparent rounded-full blur-2xl opacity-75 pointer-events-none" />
        
        <div className="flex items-center justify-between mb-3 border-b border-zinc-900 pb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-violet-400 shrink-0" />
            <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-300 font-mono">Daily Hinglish Motivation</h3>
          </div>
          <button
            id="refresh-motivation-btn"
            onClick={refreshMotivation}
            disabled={loadingMotivation}
            className="p-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white transition-all disabled:opacity-50 cursor-pointer"
          >
            <RefreshCcw className={`w-3.5 h-3.5 ${loadingMotivation ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {loadingMotivation ? (
          <div className="py-4 space-y-1.5">
            <div className="h-4 bg-zinc-900 rounded animate-pulse w-3/4" />
            <div className="h-4 bg-zinc-900 rounded animate-pulse w-5/6" />
          </div>
        ) : (
          <p className="text-xs sm:text-sm font-medium tracking-wide text-zinc-200 leading-relaxed italic pr-2">
            "{openaiMotivation || 'Bhai Roy! NEET mein top rank tabhi aayega jab focus continuous high intensity par maintenance hoga. Stop scrolling social media feeds and study!'}"
          </p>
        )}
      </div>

    </div>
  );
}
