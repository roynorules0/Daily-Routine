import React, { useState, useEffect, useRef } from 'react';
import { 
  Dumbbell, BookOpen, Clock, Settings, Sparkles, Trophy, 
  MoreVertical, ShieldAlert, CheckCircle, RefreshCcw, Menu
} from 'lucide-react';

import { 
  DEFAULT_ROUTINE_ITEMS, DEFAULT_WORKOUT_PLANS, 
  DEFAULT_NEET_TOPICS, DEFAULT_ACHIEVEMENTS 
} from './data';
import { RoutineItem, WorkoutDay, NeetTopic, NeetDailyTarget, Streak, Achievement, AdminSettings, TelegramLog } from './types';
import { Language, translations } from './utils/translations';

import BottomNav from './components/BottomNav';
import Toasts, { ToastMessage } from './components/Toast';
import DashboardTab from './components/DashboardTab';
import GymTab from './components/GymTab';
import NeetTab from './components/NeetTab';
import AdminPanel from './components/AdminPanel';

import BeastSuite from './components/BeastSuite';
import BeastFocusOverlay from './components/BeastFocusOverlay';
import AiAssistantFloating from './components/AiAssistantFloating';

export default function App() {
  // Navigation & UI state
  const [activeTab, setActiveTab] = useState<'dashboard' | 'gym' | 'neet' | 'beast'>('dashboard');
  const [isBeastFocusActive, setIsBeastFocusActive] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Core structured Language
  const [currentLanguage, setCurrentLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem('roy_language') as Language;
    return saved || 'hinglish';
  });

  useEffect(() => {
    localStorage.setItem('roy_language', currentLanguage);
  }, [currentLanguage]);

  const handleLanguageChange = (lang: Language) => {
    setCurrentLanguage(lang);
    addToast(`Language updated to: ${lang === 'hindi' ? 'हिन्दी 🇮🇳' : lang === 'hinglish' ? 'Hinglish 🔥' : 'English 🇺🇸'}`, 'success');
  };

  // Time HUD details
  const [currentTime, setCurrentTime] = useState('11:00:00 PM');
  const [currentDate, setCurrentDate] = useState('Jun 2, 2026');
  const [currentDay, setCurrentDay] = useState('Tuesday');

  // Core structured data loaders from Local Storage (fallback to defaults)
  const [settings, setSettings] = useState<AdminSettings>(() => {
    const saved = localStorage.getItem('roy_settings');
    if (saved) return JSON.parse(saved);
    return {
      geminiApiKey: '',
      youtubeApiKey: '',
      telegramBotToken: '',
      telegramChannel: '',
      notifications: {
        study: true,
        gym: true,
        revision: true,
        sleep: true,
        walking: true,
        dailyReports: true,
        weeklyReports: true,
        aiMotivation: true
      },
      theme: 'dark',
      studyHoursGoal: 5
    };
  });

  const [routine, setRoutine] = useState<RoutineItem[]>(() => {
    const saved = localStorage.getItem('roy_routine');
    return saved ? JSON.parse(saved) : DEFAULT_ROUTINE_ITEMS;
  });

  const [workouts, setWorkouts] = useState<WorkoutDay[]>(() => {
    const saved = localStorage.getItem('roy_workouts');
    return saved ? JSON.parse(saved) : DEFAULT_WORKOUT_PLANS;
  });

  const [topics, setTopics] = useState<NeetTopic[]>(() => {
    const saved = localStorage.getItem('roy_topics');
    return saved ? JSON.parse(saved) : DEFAULT_NEET_TOPICS;
  });

  const [dailyTargets, setDailyTargets] = useState<NeetDailyTarget[]>(() => {
    const saved = localStorage.getItem('roy_daily_targets');
    return saved ? JSON.parse(saved) : [];
  });

  const [streak, setStreak] = useState<Streak>(() => {
    const saved = localStorage.getItem('roy_streak');
    return saved ? JSON.parse(saved) : { study: 3, gym: 5, revision: 2, routine: 4, lastUpdated: '2026-06-01' };
  });

  const [achievements, setAchievements] = useState<Achievement[]>(() => {
    const saved = localStorage.getItem('roy_achievements');
    return saved ? JSON.parse(saved) : DEFAULT_ACHIEVEMENTS;
  });

  const [telegramLogs, setTelegramLogs] = useState<TelegramLog[]>(() => {
    const saved = localStorage.getItem('roy_telegram_logs');
    return saved ? JSON.parse(saved) : [];
  });

  // Daily Tasks Completion Tracker States
  const [dailyTrack, setDailyTrack] = useState({
    studyCompleted: false,
    gymCompleted: false,
    revisionCompleted: false,
    walkingCompleted: false,
    sleepCompleted: false,
    clinicCompleted: false
  });

  const [studyHoursCompleted, setStudyHoursCompleted] = useState(() => {
    const saved = localStorage.getItem('roy_study_hours');
    return saved ? Number(saved) : 4;
  });

  // API State handlers
  const [openaiMotivation, setOpenaiMotivation] = useState('');
  const [loadingMotivation, setLoadingMotivation] = useState(false);
  const [plannerAdvice, setPlannerAdvice] = useState('');
  const [loadingPlanner, setLoadingPlanner] = useState(false);
  const [testingTelegram, setTestingTelegram] = useState(false);

  // Keep tracking active block changes to fire auto Telegram notices
  const lastActiveBlockIdRef = useRef<string | null>(null);

  // Sync state mutations directly to local Cache
  useEffect(() => {
    localStorage.setItem('roy_settings', JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    localStorage.setItem('roy_routine', JSON.stringify(routine));
  }, [routine]);

  useEffect(() => {
    localStorage.setItem('roy_workouts', JSON.stringify(workouts));
  }, [workouts]);

  useEffect(() => {
    localStorage.setItem('roy_topics', JSON.stringify(topics));
  }, [topics]);

  useEffect(() => {
    localStorage.setItem('roy_daily_targets', JSON.stringify(dailyTargets));
  }, [dailyTargets]);

  useEffect(() => {
    localStorage.setItem('roy_streak', JSON.stringify(streak));
  }, [streak]);

  useEffect(() => {
    localStorage.setItem('roy_achievements', JSON.stringify(achievements));
  }, [achievements]);

  useEffect(() => {
    localStorage.setItem('roy_telegram_logs', JSON.stringify(telegramLogs));
  }, [telegramLogs]);

  useEffect(() => {
    localStorage.setItem('roy_study_hours', studyHoursCompleted.toString());
  }, [studyHoursCompleted]);

  // Synchronize state with the Express backend so that the Roy AI Telegram Bot matches real-time progress
  useEffect(() => {
    const syncStateWithServer = async () => {
      try {
        const xp = Number(localStorage.getItem('roy_beast_xp')) || 340;
        const level = Math.max(1, Math.floor(Math.sqrt(xp / 10)));
        const water = Number(localStorage.getItem('roy_beast_water')) || 1500;
        const activeChallenges = localStorage.getItem('roy_active_challenges');
        const boss = localStorage.getItem('roy_beast_active_boss');
        const playerHp = localStorage.getItem('roy_beast_player_hp');
        const goals = localStorage.getItem('roy_countdown_goals');
        const budget = localStorage.getItem('roy_capital_ledger');
        const bike = localStorage.getItem('roy_bike_logs');

        const statePayload = {
          settings,
          routine,
          workouts,
          topics,
          dailyTrack,
          studyHoursCompleted,
          streak,
          achievements,
          xp,
          level,
          water,
          activeChallenges: activeChallenges ? JSON.parse(activeChallenges) : [],
          boss: boss ? JSON.parse(boss) : null,
          playerHp: playerHp ? Number(playerHp) : 100,
          goals: goals ? JSON.parse(goals) : [],
          budget: budget ? JSON.parse(budget) : null,
          bike: bike ? JSON.parse(bike) : null
        };

        await fetch('/api/sync-state', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(statePayload)
        });
      } catch (err) {
        // Silent error catch
      }
    };
    syncStateWithServer();
  }, [settings, routine, workouts, topics, dailyTrack, studyHoursCompleted, streak, achievements, activeTab]);

  // Toast dispatching helpers
  const addToast = (text: string, type: 'success' | 'error' | 'info') => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts((prev) => [...prev, { id, text, type }]);
    setTimeout(() => {
      removeToast(id);
    }, 4500);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Helper to format 12-Hour format with optional seconds
  const formatTimeTo12HourStr = (date: Date, showSeconds = true) => {
    let hours = date.getHours();
    const minutes = date.getMinutes();
    const seconds = date.getSeconds();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // 0 should be 12
    const hStr = hours.toString().padStart(2, '0');
    const mStr = minutes.toString().padStart(2, '0');
    const sStr = seconds.toString().padStart(2, '0');
    
    if (showSeconds) {
      return `${hStr}:${mStr}:${sStr} ${ampm}`;
    }
    return `${hStr}:${mStr} ${ampm}`;
  };

  // Parse 12-hour AM/PM string to minutes from midnight (0 to 1439)
  const parseTimeToMinutes = (timeStr: string): number => {
    if (!timeStr) return 0;
    const match = timeStr.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
    if (!match) return 0;
    let hours = parseInt(match[1], 10);
    const minutes = parseInt(match[2], 10);
    const ampm = match[3].toUpperCase();

    if (ampm === 'PM' && hours < 12) {
      hours += 12;
    } else if (ampm === 'AM' && hours === 12) {
      hours = 0;
    }
    return hours * 60 + minutes;
  };

  // Check if a given minutes-since-midnight falls in a window, spanning midnight
  const isMinutesInBlock = (currentMin: number, startStr: string, endStr: string) => {
    const startMin = parseTimeToMinutes(startStr);
    const endMin = parseTimeToMinutes(endStr);
    
    if (startMin < endMin) {
      return currentMin >= startMin && currentMin < endMin;
    } else {
      // Spans midnight, e.g. 11:00 PM (1380m) to 04:00 AM (240m)
      return currentMin >= startMin || currentMin < endMin;
    }
  };

  // Live Timer Interval Engine
  useEffect(() => {
    const d = new Date();
    // Warm initialize
    setCurrentTime(formatTimeTo12HourStr(d));
    const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric' };
    setCurrentDate(d.toLocaleDateString('en-US', options));
    setCurrentDay(d.toLocaleDateString('en-US', { weekday: 'long' }));

    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(formatTimeTo12HourStr(now));
      setCurrentDate(now.toLocaleDateString('en-US', options));
      setCurrentDay(now.toLocaleDateString('en-US', { weekday: 'long' }));
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Dynamic theme pre-calculations
  const themePresets = {
    'midnight-black': {
      primary: '#f4f4f5',
      primaryHover: '#e4e4e7',
      glassBg: 'rgba(10, 10, 10, 0.75)',
      glassBorder: 'rgba(255, 255, 255, 0.08)',
      gradientBg: 'radial-gradient(ellipse at bottom, #111, #000)',
      alpha: 'rgba(255, 255, 255, 0.12)'
    },
    'royal-purple': {
      primary: '#a855f7',
      primaryHover: '#c084fc',
      glassBg: 'rgba(12, 10, 24, 0.75)',
      glassBorder: 'rgba(168, 85, 247, 0.15)',
      gradientBg: 'radial-gradient(ellipse at bottom, #120924, #000000)',
      alpha: 'rgba(168, 85, 247, 0.2)'
    },
    'neon-blue': {
      primary: '#06b6d4',
      primaryHover: '#22d3ee',
      glassBg: 'rgba(6, 12, 20, 0.75)',
      glassBorder: 'rgba(6, 182, 212, 0.15)',
      gradientBg: 'radial-gradient(ellipse at bottom, #011424, #000000)',
      alpha: 'rgba(6, 182, 212, 0.2)'
    },
    'crimson-red': {
      primary: '#ef4444',
      primaryHover: '#f87171',
      glassBg: 'rgba(18, 8, 8, 0.75)',
      glassBorder: 'rgba(239, 68, 68, 0.15)',
      gradientBg: 'radial-gradient(ellipse at bottom, #1b0404, #000000)',
      alpha: 'rgba(239, 68, 68, 0.2)'
    },
    'emerald-green': {
      primary: '#10b981',
      primaryHover: '#34d399',
      glassBg: 'rgba(6, 18, 14, 0.75)',
      glassBorder: 'rgba(16, 185, 129, 0.15)',
      gradientBg: 'radial-gradient(ellipse at bottom, #031c12, #000000)',
      alpha: 'rgba(16, 185, 129, 0.18)'
    }
  };

  const activeThemeKey = settings.theme || 'midnight-black';
  const themeConfig = activeThemeKey === 'custom-theme' 
    ? {
        primary: settings.customAccentColor || '#6366f1',
        primaryHover: settings.customAccentColor || '#818cf8',
        glassBg: settings.customBgColor ? `${settings.customBgColor}cc` : 'rgba(10, 10, 10, 0.75)',
        glassBorder: `${settings.customAccentColor || '#6366f1'}30`,
        gradientBg: `radial-gradient(ellipse at bottom, ${settings.customBgColor || '#0a0a14'}, #000000)`,
        alpha: `${settings.customAccentColor || '#6366f1'}20`
      }
    : themePresets[activeThemeKey as keyof typeof themePresets] || themePresets['midnight-black'];

  const themeStyle = {
    '--theme-primary': themeConfig.primary,
    '--theme-primary-hover': themeConfig.primaryHover,
    '--glass-bg': themeConfig.glassBg,
    '--glass-border': themeConfig.glassBorder,
    '--theme-primary-alpha': themeConfig.alpha,
    background: themeConfig.gradientBg
  } as React.CSSProperties;

  // Derived Values: Identify Active Tasks & upcoming tasks
  const getActiveAndUpcomingTasks = () => {
    const now = new Date();
    const currentMin = now.getHours() * 60 + now.getMinutes();
    
    let active: RoutineItem | null = null;
    let activeIdx = -1;
    
    for (let i = 0; i < routine.length; i++) {
      const r = routine[i];
      if (isMinutesInBlock(currentMin, r.start, r.end)) {
        active = r;
        activeIdx = i;
        break;
      }
    }
    
    let upcoming: RoutineItem | null = null;
    if (activeIdx !== -1) {
      const nextIdx = (activeIdx + 1) % routine.length;
      upcoming = routine[nextIdx];
    } else {
      upcoming = routine[0];
    }
    
    return { active, upcoming };
  };

  const { active: activeTask, upcoming: nextTask } = getActiveAndUpcomingTasks();

  // Auto gym mode checker (between 4:30 AM & 6:30 AM)
  const isGymTimeAuto = activeTask?.category === 'gym';

  // Automatically execute automatic Telegram postings on block mutations
  useEffect(() => {
    if (activeTask && activeTask.id !== lastActiveBlockIdRef.current) {
      lastActiveBlockIdRef.current = activeTask.id;
      handleBlockAlertAndPostings(activeTask);
    }
  }, [activeTask]);

  // Triggers Telegram posting for various system block shifts
  const handleBlockAlertAndPostings = async (block: RoutineItem) => {
    let messageText = '';
    let shouldNotify = false;

    // Check notifications settings inside Admin settings
    if (block.start === '11:00 PM' && settings.notifications.study) {
      messageText = `☠️ <b>ROY NO RULES • STUDY BLOCK TRIGGERED</b>\nTime: 11:00 PM - 04:00 AM\nNo phone. No chats. Pure grind begins right now Roy! Focus on those NEET biology files.`;
      shouldNotify = true;
    } else if (block.start === '04:30 AM' && settings.notifications.gym) {
      messageText = `🔥 <b>GYM MODE ACTIVATED • GET UP</b>\nTime: 04:30 AM - 06:30 AM\nStudy blocks minimized. Open Gymnasium guidelines. Let's lift some iron, Roy! No excuses!`;
      shouldNotify = true;
    } else if (block.start === '07:00 AM' && settings.notifications.study) {
      messageText = `🏥 <b>CLINIC DUTY STARTED</b>\nTime: 07:00 AM - 09:00 AM\nFocus and learn physically. You are a doctor under assembly. Accuracy is life or death.`;
      shouldNotify = true;
    } else if (block.start === '09:00 AM' && settings.notifications.revision) {
      messageText = `⚡ <b>RAPID REVISION RUN</b>\nTime: 09:00 AM - 09:30 AM\n30 minutes sprint to solidify concepts revised today. Let's go!`;
      shouldNotify = true;
    } else if (block.start === '10:30 AM' && settings.notifications.sleep) {
      messageText = `💤 <b>REST & SLEEP WIND-DOWN</b>\nTime: 10:30 AM - 01:00 PM\nGo dark. Recover those synapses. Sleep is key to neural consolidation and muscular growth.`;
      shouldNotify = true;
    } else if (block.start === '05:00 PM' && settings.notifications.walking) {
      messageText = `🚶 <b>DECOMPRESS WALKING PHASE</b>\nTime: 05:00 PM - 11:00 PM\nStep outside and walk to refresh. Think about target reactions and clear your mind!`;
      shouldNotify = true;
    }

    if (shouldNotify && settings.telegramBotToken && settings.telegramChannel) {
      try {
        const response = await fetch('/api/telegram-test', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            botToken: settings.telegramBotToken,
            channelUsername: settings.telegramChannel,
            message: messageText
          })
        });
        const resData = await response.json();
        if (resData.success) {
          setTelegramLogs(prev => [resData.log, ...prev].slice(0, 50));
          addToast(`Auto Telegram Alert: ${block.category.toUpperCase()} posted.`, 'success');
        } else {
          setTelegramLogs(prev => [resData.log, ...prev].slice(0, 50));
        }
      } catch (err) {
        // error logged silently
      }
    }
  };

  // Calculate dynamic discipline scores based on today's logs
  const calculateDisciplineScore = () => {
    let score = 0;
    if (dailyTrack.studyCompleted) score += 20;
    if (dailyTrack.gymCompleted) score += 20;
    if (dailyTrack.revisionCompleted) score += 20;
    if (dailyTrack.sleepCompleted) score += 20;
    if (dailyTrack.walkingCompleted) score += 20;
    return score;
  };

  // Toggles the daily task block completions, recalculating achievements
  const toggleDailyTask = (taskType: 'studyCompleted' | 'gymCompleted' | 'revisionCompleted' | 'walkingCompleted' | 'sleepCompleted' | 'clinicCompleted') => {
    setDailyTrack(prev => {
      const updated = { ...prev, [taskType]: !prev[taskType] };
      
      // Post-toggle score audits for Achievements
      const rawScore = (updated.studyCompleted ? 20 : 0) +
                       (updated.gymCompleted ? 20 : 0) +
                       (updated.revisionCompleted ? 20 : 0) +
                       (updated.sleepCompleted ? 20 : 0) +
                       (updated.walkingCompleted ? 20 : 0);

      // Trigger unlock of PERFECT SCORE ACHIEVEMENT if 100 hit
      if (rawScore === 100) {
        unlockAchievement('ach-5');
      }

      return updated;
    });

    // Update study counts
    if (taskType === 'studyCompleted') {
      setStudyHoursCompleted(prev => {
        const updated = prev === 5 ? 0 : 5;
        if (updated >= 5) {
          addToast('🔥 Study block goal achieved! +20 points.', 'success');
        }
        return updated;
      });
    } else {
      addToast(`Action checklist status updated!`, 'info');
    }
  };

  // Standard interactive gym exercise checkbox completions
  const [gymProgress, setGymProgress] = useState<{ [exerciseId: string]: boolean }>({});
  const toggleGymExercise = (exerciseId: string) => {
    setGymProgress(prev => {
      const updated = { ...prev, [exerciseId]: !prev[exerciseId] };
      addToast('Workout progress state synchronized.', 'success');
      return updated;
    });
  };

  // Unlocks achievements if conditions hold
  const unlockAchievement = (id: string) => {
    setAchievements((prev) => 
      prev.map((ach) => {
        if (ach.id === id && !ach.unlocked) {
          addToast(`🏆 ACHIEVEMENT UNLOCKED: "${ach.title}"!`, 'success');
          return {
            ...ach,
            unlocked: true,
            unlockedAt: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
          };
        }
        return ach;
      })
    );
  };

  // Triggering simulated alert failures to Telegram to double down on discipline score reduction limits
  const handleSimulateMissedTask = async (taskName: string) => {
    const alertMsg = `⚠️ <b>ALERT: TASK MISSED BY ROY</b>\nTime Track: ${currentTime}\nMissed Block: "${taskName}"\nDiscipline score affected. Let's step up consistency, Roy!`;
    
    addToast(`Missed Task Triggered: "${taskName}". Score decreased!`, 'error');

    if (settings.telegramBotToken && settings.telegramChannel) {
      try {
        const response = await fetch('/api/telegram-test', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            botToken: settings.telegramBotToken,
            channelUsername: settings.telegramChannel,
            message: alertMsg
          })
        });
        const logging = await response.json();
        setTelegramLogs(prev => [logging.log, ...prev].slice(0, 50));
      } catch (err) {
        // logged silently
      }
    }
  };

  // NEET syllabus study Board status toggle
  const toggleTopicStatus = (topicId: string, type: 'completed' | 'revised' | 'weak') => {
    setTopics((prev) => 
      prev.map((t) => {
        if (t.id === topicId) {
          let updated = { ...t };
          if (type === 'completed') updated.isCompleted = !t.isCompleted;
          if (type === 'revised') updated.isRevised = !t.isRevised;
          if (type === 'weak') updated.isWeak = !t.isWeak;
          return updated;
        }
        return t;
      })
    );
    addToast('NEET prep topic updated!', 'info');
  };

  const handleAddDailyTarget = (title: string, subject: 'Biology' | 'Physics' | 'Chemistry') => {
    const newTarget: NeetDailyTarget = {
      id: Math.random().toString(36).substr(2, 9),
      title,
      subject,
      isCompleted: false,
      date: new Date().toISOString().substring(0, 10)
    };
    setDailyTargets(prev => [newTarget, ...prev]);
  };

  const handleToggleDailyTarget = (id: string) => {
    setDailyTargets((prev) => 
      prev.map((t) => {
        if (t.id === id) {
          const updated = { ...t, isCompleted: !t.isCompleted };
          if (updated.isCompleted) {
            addToast('🎯 Target completed! Focus continues.', 'success');
          }
          return updated;
        }
        return t;
      })
    );
  };

  const handleDeleteDailyTarget = (id: string) => {
    setDailyTargets(prev => prev.filter(t => t.id !== id));
    addToast('Target deleted.', 'info');
  };

  // AI HINGLISH MOTIVATION QUERY
  const fetchAiMotivation = async () => {
    setLoadingMotivation(true);
    try {
      const response = await fetch('/api/ai-motivation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ geminiApiKey: settings.geminiApiKey })
      });
      const data = await response.json();
      setOpenaiMotivation(data.motivation);
    } catch (err) {
      addToast('Fail to fetch motivatonal advice from coach.', 'error');
    } finally {
      setLoadingMotivation(false);
    }
  };

  // Run AI Motivation on mount safely
  useEffect(() => {
    fetchAiMotivation();
  }, []);

  // AI PLANNER RECOMMENDATIONS
  const fetchPlannerAdviceNow = async () => {
    setLoadingPlanner(true);
    try {
      const response = await fetch('/api/ai-planner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentTask: activeTask ? activeTask.name : 'Routine transition state',
          nextTask: nextTask ? nextTask.name : '--:--',
          currentTime: currentTime,
          geminiApiKey: settings.geminiApiKey
        })
      });
      const data = await response.json();
      setPlannerAdvice(data.advice);
    } catch (err) {
      setPlannerAdvice("Failed to link with Advisor. Stop waiting, stay alert and proceed with current block requirements!");
    } finally {
      setLoadingPlanner(false);
    }
  };

  // MANUAL TESTING DISPATCH TELEGRAM PANEL
  const handleManualTestTelegram = async () => {
    if (!settings.telegramBotToken || !settings.telegramChannel) {
      addToast('Error: Complete Telegram Configuration credentials first.', 'error');
      return;
    }
    setTestingTelegram(true);
    try {
      const response = await fetch('/api/telegram-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          botToken: settings.telegramBotToken,
          channelUsername: settings.telegramChannel
        })
      });
      const res = await response.json();
      if (res.success) {
        addToast('Connection established! Test post dispatched.', 'success');
        setTelegramLogs(prev => [res.log, ...prev].slice(0, 50));
      } else {
        addToast(`Connection failed: ${res.error}`, 'error');
        setTelegramLogs(prev => [res.log, ...prev].slice(0, 50));
      }
    } catch (err) {
      addToast('Fatal failure testing integration linking.', 'error');
    } finally {
      setTestingTelegram(false);
    }
  };

  return (
    <div style={themeStyle} className="min-h-screen bg-black text-zinc-100 flex flex-col font-sans select-none antialiased transition-all duration-500">
      {/* Top Header Navigation bar */}
      <header className="sticky top-0 z-30 bg-zinc-950/80 backdrop-blur-xl border-b border-zinc-900 px-6 py-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-gradient-to-r from-violet-600 to-indigo-600 rounded-xl text-white shadow shadow-indigo-600/10">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-sm font-black tracking-widest text-white uppercase leading-none">ROY NO RULES</h1>
              <p className="text-[9px] text-zinc-500 uppercase tracking-widest font-extrabold mt-1">Study • Gym • Discipline • No Excuses</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Quick missed task trigger button */}
            {activeTask && activeTask.isTask && (
              <button
                id="missed-task-alert-btn"
                onClick={() => handleSimulateMissedTask(activeTask.name)}
                className="text-[10px] uppercase font-black px-2.5 py-1.5 bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500/20 rounded-lg transition-colors cursor-pointer mr-1"
                title="Send warning alert to Telegram to simulate task failures"
              >
                ⚠ Fail Task
              </button>
            )}

            {/* Global Language Switcher Dropdown */}
            <div className="relative group/lang z-40">
              <button
                id="language-select-dropdown-btn"
                className="flex items-center gap-1.5 px-3 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-850 hover:text-white text-zinc-400 text-xs font-bold rounded-xl transition duration-200 cursor-pointer"
              >
                🌐 {currentLanguage === 'hindi' ? 'Hindi' : currentLanguage === 'hinglish' ? 'Hinglish' : 'English'}
              </button>
              <div className="absolute right-0 top-full mt-1.5 w-32 bg-[#09090b]/95 border border-zinc-850 rounded-2xl overflow-hidden shadow-2xl opacity-0 group-hover/lang:opacity-100 pointer-events-none group-hover/lang:pointer-events-auto transition duration-200 z-55">
                {(['hindi', 'hinglish', 'english'] as Language[]).map((lang) => (
                  <button
                    key={lang}
                    type="button"
                    onClick={() => handleLanguageChange(lang)}
                    className={`w-full px-3 py-2.5 text-left text-xs font-bold font-mono transition duration-150 hover:bg-zinc-900 cursor-pointer text-zinc-400 hover:text-white outline-none ${currentLanguage === lang ? 'bg-zinc-900 text-white font-extrabold border-l-2 border-[var(--theme-primary,#6366f1)]' : ''}`}
                  >
                    {lang === 'hindi' ? '🇮🇳 Hindi' : lang === 'hinglish' ? '🔥 Hinglish' : '🇺🇸 English'}
                  </button>
                ))}
              </div>
            </div>

            {/* Passcode Settings menu trigger */}
            <button
              id="admin-settings-trigger-btn"
              onClick={() => setIsAdminOpen(true)}
              className="p-2 hover:bg-zinc-900 rounded-xl text-zinc-400 hover:text-white transition-colors border border-zinc-900 cursor-pointer"
              title="Open Settings passcode locker"
            >
              <MoreVertical className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main View scroll container */}
      <main className="flex-1 w-full max-w-2xl mx-auto px-4 pt-6 pb-24">
        {activeTab === 'dashboard' && (
          <DashboardTab
            currentTime={currentTime}
            currentDate={currentDate}
            currentDay={currentDay}
            activeTask={activeTask}
            nextTask={nextTask}
            disciplineScore={calculateDisciplineScore()}
            streak={streak}
            achievements={achievements}
            studyHoursCompleted={studyHoursCompleted}
            dailyTrack={dailyTrack}
            toggleDailyTask={toggleDailyTask}
            openaiMotivation={openaiMotivation}
            loadingMotivation={loadingMotivation}
            refreshMotivation={fetchAiMotivation}
            getPlannerAdvice={fetchPlannerAdviceNow}
            plannerAdvice={plannerAdvice}
            loadingPlanner={loadingPlanner}
            routine={routine}
          />
        )}

        {activeTab === 'gym' && (
          <GymTab
            currentDay={currentDay}
            workouts={workouts}
            onSaveWorkouts={setWorkouts}
            youtubeApiKey={settings.youtubeApiKey}
            addToast={addToast}
            gymProgress={gymProgress}
            toggleGymExercise={toggleGymExercise}
            isGymTimeAuto={isGymTimeAuto}
            geminiApiKey={settings.geminiApiKey}
          />
        )}

        {activeTab === 'neet' && (
          <NeetTab
            topics={topics}
            toggleTopicStatus={toggleTopicStatus}
            dailyTargets={dailyTargets}
            addDailyTarget={handleAddDailyTarget}
            toggleDailyTarget={handleToggleDailyTarget}
            deleteDailyTarget={handleDeleteDailyTarget}
            addToast={addToast}
          />
        )}

        {activeTab === 'beast' && (
          <BeastSuite
            addToast={addToast}
            geminiApiKey={settings.geminiApiKey}
            telegramBotToken={settings.telegramBotToken}
            telegramChannel={settings.telegramChannel}
            routine={routine}
            workouts={workouts}
            dailyTrack={dailyTrack}
            studyHoursCompleted={studyHoursCompleted}
            onEnterBeastFocus={setIsBeastFocusActive}
            isBeastFocusActive={isBeastFocusActive}
          />
        )}
      </main>

      {/* Embedded Passcode Settings Panel */}
      <AdminPanel
        settings={settings}
        updateSettings={setSettings}
        logs={telegramLogs}
        clearLogs={() => setTelegramLogs([])}
        testTelegram={handleManualTestTelegram}
        testingTelegram={testingTelegram}
        routine={routine}
        workouts={workouts}
        onSaveRoutine={setRoutine}
        onSaveWorkouts={setWorkouts}
        addToast={addToast}
        isOpen={isAdminOpen}
        onClose={() => setIsAdminOpen(false)}
      />

      {/* Bottom Sticky bar selectors */}
      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Persistent AI Assistant */}
      <AiAssistantFloating
        geminiApiKey={settings.geminiApiKey}
        addToast={addToast}
        currentStats={{
          focus: activeTask ? activeTask.name : 'General NEET Prep',
          studiedHours: studyHoursCompleted,
          activeTaskName: activeTask ? activeTask.name : 'Transition block',
          userLevel: Math.max(1, Math.floor(Math.sqrt((Number(localStorage.getItem('roy_beast_xp')) || 340) / 10))),
          userXp: Number(localStorage.getItem('roy_beast_xp')) || 340,
          gym: dailyTrack.gymCompleted,
          walk: dailyTrack.walkingCompleted,
          waterLiters: (Number(localStorage.getItem('roy_beast_water')) || 1000) / 1000
        }}
      />

      {/* Beast Focus Mode Overlay */}
      {isBeastFocusActive && (
        <BeastFocusOverlay
          onCheckCompletion={toggleDailyTask}
          activeTask={activeTask}
          addToast={addToast}
          onClose={() => {
            setIsBeastFocusActive(false);
            addToast('Focus Block deactivated.', 'info');
          }}
          addXp={(amount, reason) => {
            const savedXp = Number(localStorage.getItem('roy_beast_xp')) || 340;
            const nextXp = savedXp + amount;
            localStorage.setItem('roy_beast_xp', String(nextXp));
          }}
        />
      )}

      {/* Screen slider Toasts */}
      <Toasts toasts={toasts} removeToast={removeToast} />
    </div>
  );
}
