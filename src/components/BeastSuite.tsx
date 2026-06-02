import React, { useState, useEffect } from 'react';
import { 
  Sparkles, ShieldAlert, Trophy, Flame, Trophy as BadgeIcon, Calendar, CheckCircle, 
  RotateCcw, Trash2, Clipboard, Save, Plus, HelpCircle, AlertTriangle, 
  Activity, Clock, ChevronRight, Eye, Video, Download, Play, 
  Volume2, Shield, Flame as AlertIcon, Droplet, Moon, User, Image as ImageIcon, 
  TrendingUp, Award, Layers, Timer, FileText, ChevronLeft, Send, Sparkle, LogIn, Heart
} from 'lucide-react';
import { RoutineItem, WorkoutDay, Streak, Achievement } from '../types';

// Advanced Modular subcomponents
import AiDietPlanner from './AiDietPlanner';
import GoalCountdownSystem from './GoalCountdownSystem';
import MoneyTracker from './MoneyTracker';
import BikeMaintenanceTracker from './BikeMaintenanceTracker';
import ChallengeAndBossBattles from './ChallengeAndBossBattles';
import DisciplineAndDetox from './DisciplineAndDetox';
import MotivationAndHabits from './MotivationAndHabits';
import AiJournalExtended from './AiJournalExtended';
import VoiceAndUniverse from './VoiceAndUniverse';

interface BeastSuiteProps {
  addToast: (text: string, type: 'success' | 'error' | 'info') => void;
  geminiApiKey?: string;
  telegramBotToken?: string;
  telegramChannel?: string;
  routine: RoutineItem[];
  workouts: WorkoutDay[];
  dailyTrack: {
    studyCompleted: boolean;
    gymCompleted: boolean;
    revisionCompleted: boolean;
    walkingCompleted: boolean;
    sleepCompleted: boolean;
    clinicCompleted: boolean;
  };
  studyHoursCompleted: number;
  onEnterBeastFocus: (active: boolean) => void;
  isBeastFocusActive: boolean;
}

interface BiometricLog {
  date: string;
  weight: number;
  chest: number;
  arms: number;
  waist: number;
  shoulders: number;
}

interface Mission {
  id: string;
  title: string;
  rewardXp: number;
  isCompleted: boolean;
}

interface SleepLog {
  date: string;
  hours: number;
  wakeTime: string;
  score: number;
  recovery: number;
}

interface PhotoLog {
  id: string;
  date: string;
  note: string;
  imgUrl: string;
}

interface JournalLog {
  date: string;
  mood: '🔥 Beast' | '💪 Strong' | '😴 Tired' | '🧠 Focused' | '⛈ Stressed';
  journal: string;
  notes: string;
}

export default function BeastSuite({
  addToast,
  geminiApiKey,
  telegramBotToken,
  telegramChannel,
  routine,
  workouts,
  dailyTrack,
  studyHoursCompleted,
  onEnterBeastFocus,
  isBeastFocusActive
}: BeastSuiteProps) {
  
  // 1. XP & LEVEL STATE
  const [xp, setXp] = useState<number>(() => {
    const saved = localStorage.getItem('roy_beast_xp');
    return saved ? Number(saved) : 340;
  });

  const [subTab, setSubTab] = useState<'hub' | 'nutrition' | 'goals' | 'budget' | 'motor' | 'arena' | 'diary' | 'loop' | 'quantum'>('hub');

  const getLevelInfo = (currentXp: number) => {
    // Level 1 = 0-100 XP
    // Level 10 = 2000 XP
    // Level 25 = 6000 XP
    // Level 50 = 15000 XP (Roy No Rules Legend)
    const levelVal = Math.max(1, Math.floor(Math.sqrt(currentXp / 10)));
    let title = 'Beginner';
    let nextThreshold = (levelVal + 1) * (levelVal + 1) * 10;
    let prevThreshold = levelVal * levelVal * 10;
    let progress = Math.min(100, Math.round(((currentXp - prevThreshold) / (nextThreshold - prevThreshold)) * 100));

    if (levelVal >= 50) title = 'Roy No Rules Legend 👑';
    else if (levelVal >= 25) title = 'Beast Mode ⚡️';
    else if (levelVal >= 10) title = 'Disciplined 🥋';
    else title = 'Beginner';

    return { level: levelVal, title, progress, nextXp: nextThreshold, nextLeft: nextThreshold - currentXp };
  };

  const addXpPoints = (amount: number, reason: string) => {
    const saved = localStorage.getItem('roy_beast_xp');
    const prevVal = saved ? Number(saved) : 340;
    const updated = prevVal + amount;
    localStorage.setItem('roy_beast_xp', String(updated));
    setXp(updated);
    addToast(`+${amount} XP: ${reason}!`, 'success');
  };

  const levelDetails = getLevelInfo(xp);

  // 2. DAILY MISSIONS (State & Persistence)
  const [missions, setMissions] = useState<Mission[]>(() => {
    const saved = localStorage.getItem('roy_beast_missions');
    if (saved) return JSON.parse(saved);
    return [
      { id: 'm-init-1', title: 'Complete high-tension NEET Biology MCQ series (30 Questions)', rewardXp: 120, isCompleted: false },
      { id: 'm-init-2', title: 'Execute full workout routine plus peak intensity cardio finisher', rewardXp: 100, isCompleted: false },
      { id: 'm-init-3', title: 'Revise weak topics formula logbook & drink 4L pure water', rewardXp: 80, isCompleted: false }
    ];
  });

  const [loadingCoach, setLoadingCoach] = useState(false);
  const [coachFeedback, setCoachFeedback] = useState<string>(() => {
    return localStorage.getItem('roy_beast_coach_feedback') || "Abe Roy! Let's conquer. Track your schedule and don't skip your Chemistry. Iron makes the warrior!";
  });
  const [activePunishment, setActivePunishment] = useState<string>(() => {
    return localStorage.getItem('roy_beast_punishment') || "No active punishment. Keep dominating your goals to maintain zero rules!";
  });

  // 3. WATER TRACKER
  const [waterGoal, setWaterGoal] = useState<number>(3500); // 3.5 Liters in ml
  const [waterLogged, setWaterLogged] = useState<number>(() => {
    const saved = localStorage.getItem('roy_beast_water');
    return saved ? Number(saved) : 1000;
  });

  const logWaterMl = (amount: number) => {
    const saved = localStorage.getItem('roy_beast_water');
    const prev = saved ? Number(saved) : 1000;
    const val = Math.min(6000, prev + amount);
    localStorage.setItem('roy_beast_water', String(val));
    setWaterLogged(val);
    addToast(`Logged ${amount}ml Hydration Matrix`, 'info');
    if (val >= waterGoal && prev < waterGoal) {
      addXpPoints(100, 'Hydration Goal Completed');
    }
  };

  const handleSendWaterTelegram = async () => {
    if (!telegramBotToken || !telegramChannel) {
      addToast('Please input Telegram Bot details in Settings first!', 'error');
      return;
    }
    const targetChannel = telegramChannel.startsWith('@') ? telegramChannel : `@${telegramChannel}`;
    const url = `https://api.telegram.org/bot${telegramBotToken}/sendMessage`;
    const message = `💧 <b>ROY HYDRATION NOTIFIER</b> 💧\n\nRoy's real-time water state: <b>${waterLogged} ml</b> / ${waterGoal} ml is logged.\n⚡️ <i>Let's keep hydrated to clear brain fog. Drink up right now!</i>`;
    try {
      await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: targetChannel, text: message, parse_mode: 'HTML' })
      });
      addToast('Water reminder dispatched to Telegram!', 'success');
    } catch {
      addToast('Telegram pipeline failed.', 'error');
    }
  };

  // 4. SLEEP QUALITY TRACKER
  const [sleepLogs, setSleepLogs] = useState<SleepLog[]>(() => {
    const saved = localStorage.getItem('roy_beast_sleep_logs');
    if (saved) return JSON.parse(saved);
    return [
      { date: '2026-05-30', hours: 7.2, wakeTime: '06:15 AM', score: 85, recovery: 90 },
      { date: '2026-05-31', hours: 6.8, wakeTime: '06:30 AM', score: 78, recovery: 82 },
      { date: '2026-06-01', hours: 7.5, wakeTime: '06:00 AM', score: 92, recovery: 95 }
    ];
  });
  const [inputSleep, setInputSleep] = useState({ hours: 7, wake: '06:00 AM' });

  const logSleepMetric = () => {
    const calculatedScore = Math.min(100, Math.round(inputSleep.hours * 12 + 10)); // simple scale
    const calculatedRecovery = Math.min(100, Math.round(inputSleep.hours * 11 + 15));
    const newEntry: SleepLog = {
      date: new Date().toISOString().split('T')[0],
      hours: inputSleep.hours,
      wakeTime: inputSleep.wake,
      score: calculatedScore,
      recovery: calculatedRecovery
    };

    setSleepLogs(prev => {
      const updated = [newEntry, ...prev.filter(l => l.date !== newEntry.date)];
      localStorage.setItem('roy_beast_sleep_logs', JSON.stringify(updated));
      return updated;
    });
    addXpPoints(80, 'Sleep Quality Logged');
  };

  // 5. AI BODY TRACKER & TRANSFORMATION VAULT
  const [biometrics, setBiometrics] = useState<BiometricLog[]>(() => {
    const saved = localStorage.getItem('roy_beast_biometrics');
    if (saved) return JSON.parse(saved);
    return [
      { date: '2026-04-01', weight: 78.5, chest: 104, arms: 37, waist: 88, shoulders: 122 },
      { date: '2026-05-01', weight: 77.2, chest: 106, arms: 38.2, waist: 84, shoulders: 124 },
      { date: '2026-06-01', weight: 76.5, chest: 107.5, arms: 39, waist: 81.5, shoulders: 126 }
    ];
  });

  const [inputBio, setInputBio] = useState({ weight: 76.5, chest: 107, arms: 39, waist: 81, shoulders: 126 });

  const logBiometrics = () => {
    const newEntry: BiometricLog = {
      date: new Date().toISOString().split('T')[0],
      weight: Number(inputBio.weight),
      chest: Number(inputBio.chest),
      arms: Number(inputBio.arms),
      waist: Number(inputBio.waist),
      shoulders: Number(inputBio.shoulders)
    };

    setBiometrics(prev => {
      const updated = [newEntry, ...prev.filter(b => b.date !== newEntry.date)];
      localStorage.setItem('roy_beast_biometrics', JSON.stringify(updated));
      return updated;
    });
    addXpPoints(120, 'Biometrics Logs & Growth Indexed');
  };

  // Transformation Vault Photos list
  const [photos, setPhotos] = useState<PhotoLog[]>(() => {
    const saved = localStorage.getItem('roy_beast_photos');
    if (saved) return JSON.parse(saved);
    return [
      { id: 'p1', date: '2026-04-01', note: 'Initial dry physique cut base', imgUrl: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=400&auto=format&fit=crop&q=80' },
      { id: 'p2', date: '2026-05-01', note: 'Hypertrophy development chest wide growth', imgUrl: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=400&auto=format&fit=crop&q=80' },
      { id: 'p3', date: '2026-06-01', note: 'Active vascular beast mode outline', imgUrl: 'https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?w=400&auto=format&fit=crop&q=80' }
    ];
  });

  const [newPhotoNote, setNewPhotoNote] = useState('');
  const [uploadedImgUrl, setUploadedImgUrl] = useState<string>('');

  const handleSimulatePhotoUpload = () => {
    // Generate a beautiful fit model photo randomly as secure simulated transformation asset
    const randomBeastPics = [
      'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=400&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=400&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?w=400&auto=format&fit=crop&q=80'
    ];
    const pickedUrl = randomBeastPics[Math.floor(Math.random() * randomBeastPics.length)];
    const newPhoto: PhotoLog = {
      id: `photo-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      note: newPhotoNote.trim() || 'Biometric Growth Capture',
      imgUrl: pickedUrl
    };

    setPhotos(prev => {
      const updated = [newPhoto, ...prev];
      localStorage.setItem('roy_beast_photos', JSON.stringify(updated));
      return updated;
    });
    setNewPhotoNote('');
    addXpPoints(150, 'Transformation Vault Capture Logged');
  };

  // 6. EMERGENCY MOTIVATION
  const [emergencyText, setEmergencyText] = useState('');
  const [loadingMotivate, setLoadingMotivate] = useState(false);

  const triggerEmergencyMotivation = async (mode: 'hinglish' | 'standard') => {
    setLoadingMotivate(true);
    try {
      const res = await fetch('/api/ai-emergency-motivation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode,
          geminiApiKey,
          botToken: telegramBotToken,
          channelUsername: telegramChannel
        })
      });
      const data = await res.json();
      setEmergencyText(data.motivationText);
      addToast('AI Emergency Motivation Triggered!', 'success');

      // Trigger TTS Voice Synthesis instantly!
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(data.voicePayload || data.motivationText);
        utterance.rate = 1.05;
        // Try to pick a crisp energetic voice
        const voices = window.speechSynthesis.getVoices();
        const preferredVoice = voices.find(v => v.lang.startsWith('en') || v.lang.startsWith('hi'));
        if (preferredVoice) utterance.voice = preferredVoice;
        window.speechSynthesis.speak(utterance);
      }
    } catch {
      const fallback = `Roy! Comfort is an illusion. You are on this earth to dominate NEET preparation and forge iron health! Step up right now, turn on Beast Focus, and do 20 wide grip pushups! Zero rules! Let's go!`;
      setEmergencyText(fallback);
      if (window.speechSynthesis) {
        window.speechSynthesis.speak(new SpeechSynthesisUtterance(fallback));
      }
    } finally {
      setLoadingMotivate(false);
    }
  };

  // 7. CALENDAR HEATMAP DATA
  // Generate simulated historical completions representing consistency over the active month
  const heatmapDays = Array.from({ length: 30 }, (_, i) => {
    const dayNum = i + 1;
    // Highlight days completed
    const dayStr = dayNum < 10 ? `0${dayNum}` : `${dayNum}`;
    let status: 'completed' | 'missed' | 'inactive' = 'inactive';
    if (dayNum < 2) status = 'completed'; // today is June 2nd
    else if (dayNum === 2) status = (dailyTrack.studyCompleted && dailyTrack.gymCompleted) ? 'completed' : 'missed';
    else if (dayNum > 2) status = 'inactive'; // future
    else {
      status = dayNum % 4 === 0 ? 'missed' : 'completed'; // historic simulated
    }
    return { day: dayNum, status };
  });

  // 8. DAILY JOURNAL / MOOD & HABIT LOGS
  const [moodLogs, setMoodLogs] = useState<JournalLog[]>(() => {
    const saved = localStorage.getItem('roy_beast_moods');
    if (saved) return JSON.parse(saved);
    return [
      { date: '2026-06-01', mood: '🧠 Focused', journal: 'Solved full Chemistry hydrocarbon chapter questions. Felt dynamic mental power.', notes: 'NEET Bio requires detailed review.' }
    ];
  });
  const [journalInput, setJournalInput] = useState('');
  const [moodInput, setMoodInput] = useState<'🔥 Beast' | '💪 Strong' | '😴 Tired' | '🧠 Focused' | '⛈ Stressed'>('🧠 Focused');

  const logJournal = () => {
    const entry: JournalLog = {
      date: new Date().toISOString().split('T')[0],
      mood: moodInput,
      journal: journalInput.trim() || 'Maintained iron focus and executed routine targets.',
      notes: 'Logged on Beast Suite Dashboard'
    };
    setMoodLogs(prev => {
      const updated = [entry, ...prev.filter(m => m.date !== entry.date)];
      localStorage.setItem('roy_beast_moods', JSON.stringify(updated));
      return updated;
    });
    setJournalInput('');
    addXpPoints(50, 'Daily Instinct Logged');
  };

  // 9. AI STUDY PLAN PREPARATION ROUTE (NEET Focus)
  const [studySubject, setStudySubject] = useState<'Biology' | 'Physics' | 'Chemistry'>('Chemistry');
  const [weakTopic, setWeakTopic] = useState('Hydrocarbons Nomenclature');
  const [studyPlanResult, setStudyPlanResult] = useState<any>(null);
  const [loadingPlanner, setLoadingPlanner] = useState(false);

  const generateAIStudyPlan = async () => {
    setLoadingPlanner(true);
    try {
      const res = await fetch('/api/ai-study-planner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          geminiApiKey,
          focusAreaSection: studySubject,
          weakTopicName: weakTopic,
          studyGoalHours: 6
        })
      });
      const data = await res.json();
      setStudyPlanResult(data.plannerResult);
      addToast('NEET Focused Study Plan Generated!', 'success');
    } catch {
      addToast('Study plan failure. Showing optimized blueprint.', 'error');
    } finally {
      setLoadingPlanner(false);
    }
  };

  // 10. AI COACH DISCIPLINE TRIGGER
  const handleCheckDisciplineCoach = async () => {
    setLoadingCoach(true);
    try {
      const res = await fetch('/api/ai-discipline-coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dailyTrack,
          studyHours: studyHoursCompleted,
          geminiApiKey,
          botToken: telegramBotToken,
          channelUsername: telegramChannel
        })
      });
      const data = await res.json();
      if (data.coachResult) {
        setCoachFeedback(data.coachResult.feedback);
        setActivePunishment(data.coachResult.punishment);
        setMissions(data.coachResult.missions);
        localStorage.setItem('roy_beast_coach_feedback', data.coachResult.feedback);
        localStorage.setItem('roy_beast_punishment', data.coachResult.punishment);
        localStorage.setItem('roy_beast_missions', JSON.stringify(data.coachResult.missions));
        addToast('AI Discipline Report compiled & dispatched to Telegram!', 'success');
      }
    } catch {
      addToast('Coach call failed', 'error');
    } finally {
      setLoadingCoach(false);
    }
  };

  // 11. MONTHLY REPORT & EXPORT / PDF EXPORT SIMULATOR
  const handlePrintPdfReport = () => {
    window.print();
  };

  return (
    <div className="space-y-6 pb-26 animate-fade-in" id="beast-suite-container">
      
      {/* ⚠️ BEAST MODE PANEL BANNER HEADER */}
      <div className="relative overflow-hidden rounded-3xl bg-zinc-950 border border-zinc-900 p-6 md:p-8 shadow-2xl">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-44 h-44 bg-red-650/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="text-left space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-black tracking-widest text-red-500 bg-red-500/10 px-2.5 py-1 rounded-md border border-red-500/20">
                BEAST SUITE ENABLED
              </span>
              <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Roy No Rules v3.5</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight font-sans">
              ROY ELITE COMMAND CENTER
            </h1>
            <p className="text-xs text-zinc-400 font-medium">
              A high-intensity, no-cheat discipline sandbox linking routines, biomechanics, Telegram metrics, and AI analysis.
            </p>
          </div>

          {/* BEAST MODE OVERLAY SELECTOR */}
          <button
            type="button"
            onClick={() => {
              onEnterBeastFocus(!isBeastFocusActive);
              addToast(isBeastFocusActive ? 'Beast Mode Focus Disengaged.' : 'TRIGGERED! Beast Focus engaged. Zero distraction overlay active.', isBeastFocusActive ? 'info' : 'success');
            }}
            className={`px-6 py-3.5 rounded-2xl text-xs font-black uppercase tracking-wider flex items-center gap-2 border-0 cursor-pointer shadow-lg transition-all ${
              isBeastFocusActive 
                ? 'bg-red-600 hover:bg-red-500 text-white animate-pulse ring-4 ring-red-500/20' 
                : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white'
            }`}
          >
            <Shield className="w-4 h-4" />
            {isBeastFocusActive ? 'Active Beast Focus ON' : 'Trigger Beast Mode Focus'}
          </button>
        </div>
      </div>

      {/* 👑 XP & LEVEL PROGRESS HUD */}
      <div className="bg-zinc-900/35 border border-zinc-850/80 rounded-3xl p-6 text-left">
        <div className="flex justify-between items-baseline mb-4">
          <div>
            <span className="text-[9px] uppercase font-bold text-zinc-500 tracking-widest block font-mono">Discipline Rank Level</span>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-2xl font-black text-white font-mono bg-zinc-950 px-3 py-1 rounded-xl border border-zinc-800">
                LV {levelDetails.level}
              </span>
              <span className="text-sm font-bold text-red-500 uppercase tracking-widest font-mono">
                {levelDetails.title}
              </span>
            </div>
          </div>
          <div className="text-right font-mono">
            <span className="text-xs font-bold text-zinc-400">{xp} / {levelDetails.nextXp} XP</span>
            <p className="text-[10px] text-zinc-500">{levelDetails.nextLeft} XP remaining for rank up</p>
          </div>
        </div>

        {/* Level Horizontal Progress Bar */}
        <div className="w-full h-2.5 bg-zinc-950 rounded-full border border-zinc-850 overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-red-650 to-amber-500 transition-all duration-500"
            style={{ width: `${levelDetails.progress}%` }}
          />
        </div>

        {/* Quick actions that earn XP instantly */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
          <button
            type="button"
            onClick={() => addXpPoints(50, 'Completed Study Block Session')}
            className="p-2 py-2.5 bg-zinc-950 hover:bg-zinc-900 text-[10.5px] font-bold text-zinc-300 rounded-lg text-center cursor-pointer border border-zinc-900 transition-all font-mono"
          >
            📚 Study Session (+50 XP)
          </button>
          <button
            type="button"
            onClick={() => addXpPoints(60, 'Logged Completed Gym Workout')}
            className="p-2 py-2.5 bg-zinc-950 hover:bg-zinc-900 text-[10.5px] font-bold text-zinc-300 rounded-lg text-center cursor-pointer border border-zinc-900 transition-all font-mono"
          >
            🏋️‍♂️ Heavy Gym (+60 XP)
          </button>
          <button
            type="button"
            onClick={() => addXpPoints(30, 'Completed Cardiac Walk Check')}
            className="p-2 py-2.5 bg-zinc-950 hover:bg-zinc-900 text-[10.5px] font-bold text-zinc-300 rounded-lg text-center cursor-pointer border border-zinc-900 transition-all font-mono"
          >
            🚶‍♂️ Active Walk (+30 XP)
          </button>
          <button
            type="button"
            onClick={() => addXpPoints(40, 'Executed Formula Revision Drill')}
            className="p-2 py-2.5 bg-zinc-950 hover:bg-zinc-900 text-[10.5px] font-bold text-zinc-300 rounded-lg text-center cursor-pointer border border-zinc-900 transition-all font-mono"
          >
            🧠 Quick Revise (+40 XP)
          </button>
        </div>
      </div>

      {/* horizontal sub-tabs category bar */}
      <div className="flex items-center gap-1.5 border-b border-zinc-850 pb-3 overflow-x-auto scroller-hidden">
        <button
          type="button"
          onClick={() => setSubTab('hub')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold font-mono uppercase tracking-wider whitespace-nowrap transition-all cursor-pointer border ${
            subTab === 'hub' 
              ? 'bg-red-650 text-white border-red-500' 
              : 'bg-zinc-950 text-zinc-400 border-zinc-900 hover:text-white'
          }`}
        >
          🛡 Command Hub
        </button>
        <button
          type="button"
          onClick={() => setSubTab('nutrition')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold font-mono uppercase tracking-wider whitespace-nowrap transition-all cursor-pointer border ${
            subTab === 'nutrition' 
              ? 'bg-red-650 text-white border-red-500' 
              : 'bg-zinc-950 text-zinc-400 border-zinc-900 hover:text-white'
          }`}
        >
          🍳 Nutrition AI
        </button>
        <button
          type="button"
          onClick={() => setSubTab('goals')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold font-mono uppercase tracking-wider whitespace-nowrap transition-all cursor-pointer border ${
            subTab === 'goals' 
              ? 'bg-red-650 text-white border-red-500' 
              : 'bg-zinc-950 text-zinc-400 border-zinc-900 hover:text-white'
          }`}
        >
          🏁 Countdown Goals
        </button>
        <button
          type="button"
          onClick={() => setSubTab('budget')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold font-mono uppercase tracking-wider whitespace-nowrap transition-all cursor-pointer border ${
            subTab === 'budget' 
              ? 'bg-red-650 text-white border-red-500' 
              : 'bg-zinc-955 text-zinc-400 border-zinc-900 hover:text-white'
          }`}
        >
          💰 Capital Ledger
        </button>
        <button
          type="button"
          onClick={() => setSubTab('motor')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold font-mono uppercase tracking-wider whitespace-nowrap transition-all cursor-pointer border ${
            subTab === 'motor' 
              ? 'bg-red-650 text-white border-red-500' 
              : 'bg-zinc-955 text-zinc-400 border-zinc-900 hover:text-white'
          }`}
        >
          🏍 RE Hunter 350
        </button>
        <button
          type="button"
          onClick={() => setSubTab('arena')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold font-mono uppercase tracking-wider whitespace-nowrap transition-all cursor-pointer border ${
            subTab === 'arena' 
              ? 'bg-red-650 text-white border-red-500' 
              : 'bg-zinc-955 text-zinc-400 border-zinc-900 hover:text-white'
          }`}
        >
          ⚔️ Arenas & Challenges
        </button>
        <button
          type="button"
          onClick={() => setSubTab('diary')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold font-mono uppercase tracking-wider whitespace-nowrap transition-all cursor-pointer border ${
            subTab === 'diary' 
              ? 'bg-red-650 text-white border-red-500' 
              : 'bg-zinc-955 text-zinc-400 border-zinc-900 hover:text-white'
          }`}
        >
          📓 AI Journal
        </button>
        <button
          type="button"
          onClick={() => setSubTab('loop')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold font-mono uppercase tracking-wider whitespace-nowrap transition-all cursor-pointer border ${
            subTab === 'loop' 
              ? 'bg-red-650 text-white border-red-500' 
              : 'bg-zinc-955 text-zinc-400 border-zinc-900 hover:text-white'
          }`}
        >
          🔬 Habits & Loop
        </button>
        <button
          type="button"
          onClick={() => setSubTab('quantum')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold font-mono uppercase tracking-wider whitespace-nowrap transition-all cursor-pointer border ${
            subTab === 'quantum' 
              ? 'bg-red-650 text-white border-red-500' 
              : 'bg-zinc-955 text-zinc-400 border-zinc-900 hover:text-white'
          }`}
        >
          🌌 Supreme Cosmos
        </button>
      </div>

      {subTab === 'hub' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-left">
        
        {/* 🤖 1. AI DISCIPLINE COACH & NIGHTLY REPORTING */}
        <div className="bg-zinc-900/35 border border-zinc-850 rounded-3xl p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-850 pb-3">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-red-500 animate-pulse" />
              <h2 className="text-sm font-bold uppercase text-white tracking-widest font-mono">Discipline Coach Console</h2>
            </div>
            <button
              type="button"
              onClick={handleCheckDisciplineCoach}
              disabled={loadingCoach}
              className="px-3.5 py-1.5 bg-red-650 hover:bg-red-500 disabled:opacity-50 text-white font-bold text-[10.5px] rounded-lg transition-all border-0 cursor-pointer uppercase flex items-center gap-1.5 font-mono"
            >
              {loadingCoach ? 'Analyzing...' : 'Run Analysis'}
              <Sparkles className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="bg-zinc-950 p-4 rounded-2xl border border-zinc-900 space-y-2 relative">
            <span className="text-[8px] uppercase tracking-wider text-red-500 absolute top-3 right-3 font-bold font-mono">Live Coach Roast</span>
            <span className="text-xs font-semibold text-zinc-500 font-mono">COACH INSIGHTS:</span>
            <p className="text-xs text-zinc-300 italic font-medium leading-relaxed">
              "{coachFeedback}"
            </p>
          </div>

          <div className="p-4 bg-zinc-950 border border-zinc-900 rounded-2xl space-y-2">
            <div className="flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
              <span className="text-[10px] font-semibold text-zinc-500 font-mono uppercase tracking-widest">Active Metaphysical Punishment</span>
            </div>
            <p className="text-xs font-bold text-red-400 font-mono">{activePunishment}</p>
          </div>
        </div>

        {/* 🎯 2. DAILY ELITE MISSIONS (3 OF Them) */}
        <div className="bg-zinc-900/35 border border-zinc-850 rounded-3xl p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-850 pb-3">
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-500" />
              <h2 className="text-sm font-bold uppercase text-white tracking-widest font-mono">Daily Elite Missions</h2>
            </div>
            <span className="text-[9px] uppercase font-bold text-zinc-400 font-mono bg-zinc-950 px-2 py-0.5 rounded-lg border border-zinc-850">
              3 Daily Matrix
            </span>
          </div>

          <div className="space-y-2.5">
            {missions.map((mission, idx) => (
              <div 
                key={mission.id || idx}
                className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                  mission.isCompleted 
                    ? 'bg-zinc-950/20 border-emerald-950/30 text-zinc-500 opacity-60 line-through' 
                    : 'bg-zinc-950 border-zinc-900 text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      const updated = [...missions];
                      updated[idx].isCompleted = !updated[idx].isCompleted;
                      setMissions(updated);
                      localStorage.setItem('roy_beast_missions', JSON.stringify(updated));
                      if (updated[idx].isCompleted) {
                        addXpPoints(mission.rewardXp, 'Mission Cleared');
                      } else {
                        setXp(p => Math.max(0, p - mission.rewardXp));
                        addToast('Mission uncompleted. Deducted XP.', 'info');
                      }
                    }}
                    className={`w-5 h-5 rounded-md flex items-center justify-center cursor-pointer border ${
                      mission.isCompleted 
                        ? 'bg-emerald-650/20 border-emerald-500 text-emerald-450' 
                        : 'border-zinc-800 bg-zinc-900 hover:border-zinc-700'
                    }`}
                  >
                    {mission.isCompleted && <CheckCircle className="w-3.5 h-3.5 text-emerald-450" />}
                  </button>
                  <span className="text-xs font-semibold leading-relaxed text-left">{mission.title}</span>
                </div>
                <span className="text-[10px] bg-red-650/10 text-red-400 font-bold px-2 py-0.5 rounded font-mono shrink-0">
                  +{mission.rewardXp} XP
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* 💧 3. WATER MATRIX TRACKER */}
        <div className="bg-zinc-900/35 border border-zinc-850 rounded-3xl p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-850 pb-3">
            <div className="flex items-center gap-2">
              <Droplet className="w-5 h-5 text-indigo-400" />
              <h2 className="text-sm font-bold uppercase text-white tracking-widest font-mono">Bio Hydration Tracker</h2>
            </div>
            <span className="text-xs font-bold font-mono text-indigo-400">
              {waterLogged} / {waterGoal} ml
            </span>
          </div>

          <div className="bg-zinc-950 p-4 rounded-2xl border border-zinc-900 flex flex-col items-center justify-between gap-4">
            {/* Visual hydration circular fill index */}
            <div className="w-full bg-zinc-900 h-3 rounded-full overflow-hidden border border-zinc-850 relative">
              <div 
                className="h-full bg-gradient-to-r from-teal-500 to-indigo-500 transition-all duration-300"
                style={{ width: `${Math.min(100, Math.round((waterLogged / waterGoal) * 100))}%` }}
              />
            </div>

            <div className="flex flex-wrap items-center justify-center gap-2 w-full">
              <button
                type="button"
                onClick={() => logWaterMl(250)}
                className="px-3 py-2 bg-zinc-900 hover:bg-zinc-850 text-xs font-bold text-white rounded-xl border border-zinc-805 cursor-pointer flex items-center gap-1.5 transition-all"
              >
                🥛 Glass (+250ml)
              </button>
              <button
                type="button"
                onClick={() => logWaterMl(500)}
                className="px-3 py-2 bg-zinc-900 hover:bg-zinc-850 text-xs font-bold text-white rounded-xl border border-zinc-805 cursor-pointer flex items-center gap-1.5 transition-all"
              >
                🧪 Flask (+500ml)
              </button>
              <button
                type="button"
                onClick={() => logWaterMl(1000)}
                className="px-3 py-2 bg-zinc-900 hover:bg-zinc-850 text-xs font-bold text-white rounded-xl border border-zinc-805 cursor-pointer flex items-center gap-1.5 transition-all"
              >
                🧴 Jug (+1.0L)
              </button>
              <button
                type="button"
                onClick={() => {
                  setWaterLogged(0);
                  localStorage.setItem('roy_beast_water', '0');
                  addToast('Reset absolute hydration logs.', 'info');
                }}
                className="p-2 bg-zinc-950 hover:bg-zinc-900 text-zinc-650 hover:text-zinc-400 rounded-xl cursor-pointer border border-zinc-900"
                title="Reset water logged log"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={handleSendWaterTelegram}
            className="w-full bg-indigo-950/40 text-indigo-400 border border-indigo-900 hover:bg-indigo-900/10 text-xs font-bold py-3.5 rounded-xl cursor-pointer transition-all flex items-center justify-center gap-2 uppercase tracking-wider"
          >
            <Send className="w-3.5 h-3.5" />
            Dispatch Water Alert To Telegram Channel
          </button>
        </div>

        {/* 😴 4. SLEEP ARCHITECT & CONSISTENCY */}
        <div className="bg-zinc-900/35 border border-zinc-850 rounded-3xl p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-850 pb-3">
            <div className="flex items-center gap-2">
              <Moon className="w-5 h-5 text-indigo-400" />
              <h2 className="text-sm font-bold uppercase text-white tracking-widest font-mono">Sleep Quality tracker</h2>
            </div>
            <span className="text-xs font-bold font-mono text-zinc-400">Rest Architecture</span>
          </div>

          <div className="p-4 bg-zinc-950 rounded-2xl border border-zinc-900 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Sleep Hours Taken</label>
                <input
                  type="number"
                  step="0.1"
                  value={inputSleep.hours}
                  onChange={(e) => setInputSleep({ ...inputSleep, hours: Number(e.target.value) })}
                  className="w-full bg-zinc-900 border border-zinc-850 rounded-xl px-3 py-2 text-xs text-white focus:border-indigo-500/50"
                  placeholder="e.g. 7.5"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Wake Up Time</label>
                <input
                  type="text"
                  value={inputSleep.wake}
                  onChange={(e) => setInputSleep({ ...inputSleep, wake: e.target.value })}
                  className="w-full bg-zinc-900 border border-zinc-850 rounded-xl px-3 py-2 text-xs text-white focus:border-indigo-500/50"
                  placeholder="e.g. 06:00 AM"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={logSleepMetric}
              className="w-full bg-zinc-900 hover:bg-zinc-850 text-white font-bold text-xs py-2.5 rounded-xl border border-zinc-805 cursor-pointer transition-colors font-mono"
            >
              📊 Record Rest Architecture Matrix
            </button>
          </div>

          {/* Render past sleep averages */}
          {sleepLogs.length > 0 && (
            <div className="space-y-2">
              <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest block font-mono">Sleep Records Timeline</span>
              <div className="max-h-28 overflow-y-auto space-y-1.5 pr-2">
                {sleepLogs.map((log, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2.5 bg-zinc-950/40 rounded-xl border border-zinc-900/60 font-mono text-[11px] text-zinc-400">
                    <span>📅 {log.date}</span>
                    <span>⏰ {log.hours}h</span>
                    <span>🚪 Awake: {log.wakeTime}</span>
                    <span className="font-bold text-emerald-450">Score: {log.score}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 🏋️‍♂️ 5. AI BODY PROGRESS TRACKER & GROWTH ANALYTICS */}
        <div className="bg-zinc-900/35 border border-zinc-850 rounded-3xl p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-850 pb-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-red-400" />
              <h2 className="text-sm font-bold uppercase text-white tracking-widest font-mono">Biomechanics Body Tracker</h2>
            </div>
            <span className="text-xs text-zinc-400 font-mono">Biometrics Database</span>
          </div>

          <div className="bg-zinc-950 p-4 rounded-2xl border border-zinc-900 space-y-3">
            <div className="grid grid-cols-3 gap-2">
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-zinc-500 uppercase font-mono">Weight (kg)</label>
                <input
                  type="number"
                  value={inputBio.weight}
                  onChange={(e) => setInputBio({ ...inputBio, weight: Number(e.target.value) })}
                  className="w-full bg-zinc-900 border border-zinc-850 rounded-lg p-1.5 text-xs text-white"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-zinc-500 uppercase font-mono">Chest (cm)</label>
                <input
                  type="number"
                  value={inputBio.chest}
                  onChange={(e) => setInputBio({ ...inputBio, chest: Number(e.target.value) })}
                  className="w-full bg-zinc-900 border border-zinc-850 rounded-lg p-1.5 text-xs text-white"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-zinc-500 uppercase font-mono">Arms (cm)</label>
                <input
                  type="number"
                  value={inputBio.arms}
                  onChange={(e) => setInputBio({ ...inputBio, arms: Number(e.target.value) })}
                  className="w-full bg-zinc-900 border border-zinc-850 rounded-lg p-1.5 text-xs text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-zinc-500 uppercase font-mono">Waist (cm)</label>
                <input
                  type="number"
                  value={inputBio.waist}
                  onChange={(e) => setInputBio({ ...inputBio, waist: Number(e.target.value) })}
                  className="w-full bg-zinc-900 border border-zinc-850 rounded-lg p-1.5 text-xs text-white"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-zinc-500 uppercase font-mono">Shoulders (cm)</label>
                <input
                  type="number"
                  value={inputBio.shoulders}
                  onChange={(e) => setInputBio({ ...inputBio, shoulders: Number(e.target.value) })}
                  className="w-full bg-zinc-900 border border-zinc-850 rounded-lg p-1.5 text-xs text-white"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={logBiometrics}
              className="w-full bg-zinc-900 hover:bg-zinc-850 text-white font-bold text-xs py-2.5 rounded-xl border border-zinc-805 cursor-pointer transition-colors font-mono"
            >
              📈 Save Biometric Coordinates
            </button>
          </div>

          {/* Historical progression indicators */}
          {biometrics.length > 0 && (
            <div className="space-y-2">
              <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest block font-mono">Biometrics History Logs</span>
              <div className="max-h-24 overflow-y-auto space-y-1 pr-2">
                {biometrics.map((data, idx) => (
                  <div key={idx} className="flex flex-wrap items-center justify-between p-2 bg-zinc-950/40 rounded-lg border border-zinc-900/60 font-mono text-[10px] text-zinc-400 gap-x-3 text-left">
                    <span>📅 {data.date}</span>
                    <span>⚖️ {data.weight}kg</span>
                    <span>💪 Arms: {data.arms}cm</span>
                    <span>📏 Waist: {data.waist}cm</span>
                    <span>🥋 Shoulders: {data.shoulders}cm</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 🖼 6. PHYSIC TRANSFORMATION VAULT */}
        <div className="bg-zinc-900/35 border border-zinc-850 rounded-3xl p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-850 pb-3">
            <div className="flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-amber-500" />
              <h2 className="text-sm font-bold uppercase text-white tracking-widest font-mono">Transformation Vault</h2>
            </div>
            <span className="text-xs text-zinc-400 font-mono">Visual Index</span>
          </div>

          <div className="p-4 bg-zinc-950 rounded-2xl border border-zinc-900 space-y-3">
            <div className="space-y-1">
              <label className="text-[9px] font-bold text-zinc-500 uppercase font-mono block">Progression Stage Note</label>
              <input
                type="text"
                value={newPhotoNote}
                onChange={(e) => setNewPhotoNote(e.target.value)}
                placeholder="e.g. Mid Cut vascularity check chest fibers visible"
                className="w-full bg-zinc-900 border border-zinc-850 rounded-lg p-2 text-xs text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handleSimulatePhotoUpload}
                className="w-full bg-zinc-905 hover:bg-zinc-900 border border-zinc-850 text-zinc-300 font-bold text-[11px] py-2.5 rounded-xl cursor-pointer"
              >
                📸 Capture Visual Stage
              </button>
              <div className="text-[10px] text-zinc-500 italic flex items-center justify-center border border-zinc-900 border-dashed rounded-lg bg-zinc-950/20 px-2 font-mono">
                Asset camera synced
              </div>
            </div>
          </div>

          {/* Transformation Album Grid */}
          <div className="grid grid-cols-3 gap-2.5">
            {photos.slice(0, 3).map((item) => (
              <div key={item.id} className="bg-zinc-950 rounded-xl overflow-hidden border border-zinc-900 group relative">
                <img 
                  src={item.imgUrl} 
                  alt="Transformation" 
                  className="w-full h-18 object-cover group-hover:scale-105 transition-all"
                  referrerPolicy="no-referrer"
                />
                <div className="p-1 px-1.5 bg-black/80 text-[8px] font-mono text-zinc-400 absolute bottom-0 left-0 right-0 truncate text-center">
                  📅 {item.date}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ⚡️ 7. EMERGENCY MOTIVATION POD */}
        <div className="bg-zinc-900/35 border border-zinc-850 rounded-3xl p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-850 pb-3">
            <div className="flex items-center gap-2">
              <AlertIcon className="w-5 h-5 text-red-500 animate-pulse" />
              <h2 className="text-sm font-bold uppercase text-white tracking-widest font-mono">Emergency Motivation Deck</h2>
            </div>
          </div>

          <p className="text-xs text-zinc-400 font-medium text-left">
            Stuck in lethargy? Struggling to solve Chemistry? Click are trigger dual dynamic motivational engines below.
          </p>

          <div className="grid grid-cols-2 gap-3 pb-2">
            <button
              type="button"
              onClick={() => triggerEmergencyMotivation('hinglish')}
              disabled={loadingMotivate}
              className="py-3 bg-gradient-to-r from-amber-650 to-orange-600 font-black text-xs text-white uppercase tracking-wider rounded-xl cursor-pointer transition-all border-0 shadow-md flex items-center justify-center gap-1.5"
            >
              🗣 Raw Hinglish Roast
            </button>
            <button
              type="button"
              onClick={() => triggerEmergencyMotivation('standard')}
              disabled={loadingMotivate}
              className="py-3 bg-zinc-950 hover:bg-zinc-900 border border-zinc-850 text-xs font-black text-white uppercase tracking-wider rounded-xl cursor-pointer transition-all flex items-center justify-center gap-1.5"
            >
              🛡 Navy Seal Order
            </button>
          </div>

          {emergencyText && (
            <div className="p-4 bg-zinc-950 rounded-2xl border border-red-500/20 text-left relative animate-fade-in">
              <div className="absolute top-3.5 right-3.5 flex items-center gap-1.5">
                <Volume2 className="w-4 h-4 text-red-500 animate-ping" />
                <span className="text-[8px] font-bold text-red-500 font-mono">AI VOICE BROADCASTACTIVE</span>
              </div>
              <p className="text-xs text-red-400 leading-relaxed italic pr-8">
                "{emergencyText}"
              </p>
            </div>
          )}
        </div>

        {/* 📅 8. CALENDAR CONSISTENCY HEATMAP */}
        <div className="bg-zinc-900/35 border border-zinc-850 rounded-3xl p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-850 pb-3">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-emerald-400" />
              <h2 className="text-sm font-bold uppercase text-white tracking-widest font-mono">Discipline Heatmap Grid</h2>
            </div>
            <span className="text-[10px] text-zinc-500 font-mono">Last 30 Days</span>
          </div>

          <div className="p-4 bg-zinc-950 rounded-2xl border border-zinc-900 space-y-3">
            {/* Horizontal GitHub Style grid layout */}
            <div className="flex flex-wrap gap-1.5 items-center justify-start">
              {heatmapDays.map((d) => (
                <div 
                  key={d.day}
                  className={`w-6.5 h-6.5 rounded-md flex items-center justify-center text-[9px] font-bold font-mono transition-colors ${
                    d.status === 'completed' ? 'bg-emerald-600 text-white' :
                    d.status === 'missed' ? 'bg-red-600/80 text-white' :
                    'bg-zinc-900 text-zinc-6 / border border-zinc-850/40 text-zinc-600'
                  }`}
                  title={`Day ${d.day}: ${d.status}`}
                >
                  {d.day}
                </div>
              ))}
            </div>

            <div className="flex items-center gap-4 text-[10px] text-zinc-500 font-mono pt-1">
              <span className="flex items-center gap-1"><div className="w-2.5 h-2.5 bg-emerald-600 rounded" /> Completed ({heatmapDays.filter(h => h.status === 'completed').length})</span>
              <span className="flex items-center gap-1"><div className="w-2.5 h-2.5 bg-red-650 rounded" /> Missed ({heatmapDays.filter(h => h.status === 'missed').length})</span>
              <span className="flex items-center gap-1"><div className="w-2.5 h-2.5 bg-zinc-900 border border-zinc-850 rounded" /> Inactive</span>
            </div>
          </div>
        </div>

        {/* 🧠 9. NEET Focused AI Study Planner Module */}
        <div className="bg-zinc-900/35 border border-zinc-850 rounded-3xl p-6 space-y-4 md:col-span-1 lg:col-span-2">
          <div className="flex items-center justify-between border-b border-zinc-850 pb-3">
            <div className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-amber-500" />
              <h2 className="text-sm font-bold uppercase text-white tracking-widest font-mono">NEET Focused AI Study Planner</h2>
            </div>
            <span className="text-xs text-zinc-400 font-mono">Subject & Weak Topic Analysis</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Target Subject</label>
              <select
                value={studySubject}
                onChange={(e) => setStudySubject(e.target.value as any)}
                className="w-full bg-zinc-950 border border-zinc-850 rounded-xl px-3 py-2 text-xs text-white"
              >
                <option value="Biology">🌿 Biology (Botany & Zoology)</option>
                <option value="Physics">⚡️ Physics (Mechanics, Optics, Modern)</option>
                <option value="Chemistry">🧪 Chemistry (Organic, Inorganic, Physical)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Identified Weak Topic</label>
              <input
                type="text"
                value={weakTopic}
                onChange={(e) => setWeakTopic(e.target.value)}
                placeholder="e.g. Kinetic Theory of Gases"
                className="w-full bg-zinc-950 border border-zinc-850 rounded-xl px-3 py-2 text-xs text-white focus:border-amber-500"
              />
            </div>

            <div className="flex items-end">
              <button
                type="button"
                onClick={generateAIStudyPlan}
                disabled={loadingPlanner}
                className="w-full bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs py-3.5 rounded-xl cursor-pointer transition-all border-0 shadow-md uppercase tracking-wider"
              >
                {loadingPlanner ? 'Compiling NEET Vectors...' : 'Construct AI Syllabus Plan'}
              </button>
            </div>
          </div>

          {studyPlanResult && (
            <div className="bg-zinc-950 p-5 rounded-2xl border border-zinc-900 space-y-4 text-left animate-fade-in mt-4">
              <div className="border-b border-zinc-900 pb-3 flex justify-between items-center">
                <span className="text-xs font-bold text-amber-500 uppercase font-mono tracking-wider">📋 Verified Study Plan Blueprint</span>
                <span className="text-[9px] bg-zinc-900 text-zinc-500 px-2.5 py-1 rounded-md uppercase font-bold">NEET Target Spec</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block font-mono">Today's Hourly Allocations</span>
                  <ul className="space-y-1">
                    {studyPlanResult.dailyPlan?.map((item: string, i: number) => (
                      <li key={i} className="text-xs text-zinc-300 flex items-start gap-1.5">
                        <CheckCircle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block font-mono">7-Day Master Directives</span>
                  <ul className="space-y-1">
                    {studyPlanResult.weeklyDirectives?.map((item: string, i: number) => (
                      <li key={i} className="text-xs text-zinc-300 flex items-start gap-1.5">
                        <ChevronRight className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.1" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-zinc-900/60">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-rose-450 uppercase tracking-wider block font-mono">Deficit Master Plan</span>
                  <p className="text-xs text-zinc-400 leading-relaxed font-sans">{studyPlanResult.weakTopicAction}</p>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-emerald-450 uppercase tracking-wider block font-mono">Active Recall Spaced Focus Checks</span>
                  <div className="flex flex-wrap gap-2.5 pt-1">
                    {studyPlanResult.revisionDrill?.map((item: string, i: number) => (
                      <span key={i} className="text-[10.5px] bg-zinc-900 text-zinc-300 px-2.5 py-1 rounded-md border border-zinc-850 font-medium font-mono">{item}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 🪵 10. DAILY INSTINCT LOGGER (Habit & Daily Journal / Mood Diary) */}
        <div className="bg-zinc-900/35 border border-zinc-850 rounded-3xl p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-850 pb-3">
            <div className="flex items-center gap-2">
              <Heart className="w-5 h-5 text-red-500" />
              <h2 className="text-sm font-bold uppercase text-white tracking-widest font-mono">Elite Journal & Mood Tracking</h2>
            </div>
            <span className="text-xs text-zinc-455 font-mono">Daily instincts</span>
          </div>

          <div className="p-4 bg-zinc-950 rounded-2xl border border-zinc-900 space-y-3">
            <div className="grid grid-cols-2 gap-3 mb-2">
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest font-mono block">Instinct Mood</label>
                <select
                  value={moodInput}
                  onChange={(e) => setMoodInput(e.target.value as any)}
                  className="w-full bg-zinc-900 border border-zinc-850 rounded-lg p-1.5 text-xs text-white"
                >
                  <option value="🔥 Beast">🔥 Beast</option>
                  <option value="💪 Strong">💪 Strong</option>
                  <option value="😴 Tired">😴 Tired</option>
                  <option value="🧠 Focused">🧠 Focused</option>
                  <option value="⛈ Stressed">⛈ Stressed</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest font-mono block">Station</label>
                <div className="text-xs text-zinc-500 font-bold p-1.5">Offline Matrix</div>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest block font-mono">Today's Journal Entry</label>
              <textarea
                value={journalInput}
                onChange={(e) => setJournalInput(e.target.value)}
                placeholder="What limits did we pass today? How was NEET study progress?"
                rows={2}
                className="w-full bg-zinc-900 border border-zinc-850 rounded-xl p-2.5 text-xs text-white"
              />
            </div>

            <button
              type="button"
              onClick={logJournal}
              className="w-full bg-zinc-900 hover:bg-zinc-850 border border-zinc-805 text-white font-bold text-xs py-2.5 rounded-xl cursor-pointer font-mono"
            >
              🔒 Commit Journal Matrix to Vault
            </button>
          </div>

          {/* Past logs list */}
          {moodLogs.length > 0 && (
            <div className="space-y-2 text-left">
              <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest block font-mono">Historic Instinct Indices</span>
              <div className="max-h-24 overflow-y-auto space-y-1.5 pr-2">
                {moodLogs.map((log, idx) => (
                  <div key={idx} className="p-2.5 bg-zinc-950/40 border border-zinc-900/60 rounded-xl text-[11px] space-y-0.5">
                    <div className="flex justify-between font-mono text-zinc-500 text-[10px]">
                      <span>📅 {log.date}</span>
                      <span className="text-red-400 font-bold">{log.mood}</span>
                    </div>
                    <p className="text-zinc-300 font-sans italic">"{log.journal}"</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 👑 11. MONTHLY ELITE REPORT & EXPORTERS */}
        <div className="bg-zinc-900/35 border border-zinc-850 rounded-3xl p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-850 pb-3">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-indigo-400" />
              <h2 className="text-sm font-bold uppercase text-white tracking-widest font-mono">Monthly printable Report</h2>
            </div>
          </div>

          <p className="text-xs text-zinc-400 leading-relaxed">
            Generate and export a high-impact, formatted document indexing total studied hours, discipline performance, biometrics growth charts, and level achievements logs.
          </p>

          <button
            type="button"
            onClick={handlePrintPdfReport}
            className="w-full bg-indigo-650 hover:bg-indigo-500 text-white font-black text-xs py-3.5 rounded-xl border-0 shadow-md cursor-pointer uppercase tracking-wider flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4" />
            Download & Print Full Monthly PDF Report
          </button>
        </div>
      </div>
    )}

      {/* Conditional Sub-tabs for Advanced Modules */}
      {subTab === 'nutrition' && (
        <AiDietPlanner geminiApiKey={geminiApiKey} addToast={addToast} addXp={addXpPoints} />
      )}

      {subTab === 'goals' && (
        <GoalCountdownSystem telegramBotToken={telegramBotToken} telegramChannel={telegramChannel} addToast={addToast} addXp={addXpPoints} />
      )}

      {subTab === 'budget' && (
        <MoneyTracker telegramBotToken={telegramBotToken} telegramChannel={telegramChannel} addToast={addToast} addXp={addXpPoints} />
      )}

      {subTab === 'motor' && (
        <BikeMaintenanceTracker telegramBotToken={telegramBotToken} telegramChannel={telegramChannel} addToast={addToast} addXp={addXpPoints} />
      )}

      {subTab === 'arena' && (
        <ChallengeAndBossBattles totalXp={xp} addXp={addXpPoints} addToast={addToast} />
      )}

      {subTab === 'diary' && (
        <AiJournalExtended geminiApiKey={geminiApiKey} telegramBotToken={telegramBotToken} telegramChannel={telegramChannel} addToast={addToast} addXp={addXpPoints} />
      )}

      {subTab === 'loop' && (
        <div className="space-y-6">
          <DisciplineAndDetox geminiApiKey={geminiApiKey} addToast={addToast} addXp={addXpPoints} isDetoxActive={isBeastFocusActive} setDetoxActive={onEnterBeastFocus} />
          <MotivationAndHabits geminiApiKey={geminiApiKey} addToast={addToast} addXp={addXpPoints} />
        </div>
      )}

      {subTab === 'quantum' && (
        <VoiceAndUniverse 
          geminiApiKey={geminiApiKey} 
          addToast={addToast} 
          addXp={addXpPoints} 
          onVoiceTriggerAction={(actionCode) => {
            if (actionCode === 'beast_focus') {
              onEnterBeastFocus(true);
              setSubTab('hub');
            } else if (actionCode === 'motivation') {
              setSubTab('loop');
            } else if (actionCode === 'gym') {
              addToast('Directing focus back to Gym & workouts dashboard...', 'info');
            } else if (actionCode === 'money') {
              setSubTab('budget');
            }
          }} 
          userLevel={levelDetails.level} 
          userXp={xp} 
        />
      )}

    </div>
  );
}
