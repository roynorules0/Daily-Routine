import React, { useState, useEffect } from 'react';
import { 
  X, Save, FileOutput, FileInput, Send, RefreshCcw, ShieldAlert, Key, 
  Settings, Clock, Bell, Palette, Globe, ChevronRight, Lock, Unlock, Check
} from 'lucide-react';
import { AdminSettings, RoutineItem, WorkoutDay, TelegramLog } from '../types';

interface AdminPanelProps {
  settings: AdminSettings;
  updateSettings: (settings: AdminSettings) => void;
  logs: TelegramLog[];
  clearLogs: () => void;
  testTelegram: () => void;
  testingTelegram: boolean;
  routine: RoutineItem[];
  workouts: WorkoutDay[];
  onSaveRoutine: (routine: RoutineItem[]) => void;
  onSaveWorkouts: (workouts: WorkoutDay[]) => void;
  addToast: (text: string, type: 'success' | 'error' | 'info') => void;
  isOpen: boolean;
  onClose: () => void;
}

export default function AdminPanel({
  settings,
  updateSettings,
  logs,
  clearLogs,
  testTelegram,
  testingTelegram,
  routine,
  workouts,
  onSaveRoutine,
  onSaveWorkouts,
  addToast,
  isOpen,
  onClose
}: AdminPanelProps) {
  const [passcode, setPasscode] = useState('');
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<'api' | 'routine' | 'notifs' | 'theme' | 'backup'>('api');

  // Input states synchronized from props
  const [geminiKey, setGeminiKey] = useState(settings.geminiApiKey || '');
  const [youtubeKey, setYoutubeKey] = useState(settings.youtubeApiKey || '');
  const [telegramToken, setTelegramToken] = useState(settings.telegramBotToken || '');
  const [telegramChannel, setTelegramChannel] = useState(settings.telegramChannel || '');
  const [goalHours, setGoalHours] = useState(settings.studyHoursGoal || 5);
  const [customAccent, setCustomAccent] = useState(settings.customAccentColor || '#7c3aed');
  const [customBg, setCustomBg] = useState(settings.customBgColor || '#0a0a14');

  // Routine schedule state
  const [editedRoutine, setEditedRoutine] = useState<RoutineItem[]>([]);

  useEffect(() => {
    if (routine) {
      setEditedRoutine(JSON.parse(JSON.stringify(routine)));
    }
  }, [routine, isOpen]);

  // Handle panel unlock verification with code '868486'
  const handleVerifyPasscode = (e: React.FormEvent) => {
    e.preventDefault();
    if (passcode === '868486') {
      setIsUnlocked(true);
      setPasscode('');
      addToast('System Unlocked. Dynamic Configuration modules mounted.', 'success');
    } else {
      addToast('Access Denied. Invalid Passcode.', 'error');
      setPasscode('');
    }
  };

  const handleSaveApiKeys = () => {
    updateSettings({
      ...settings,
      geminiApiKey: geminiKey,
      youtubeApiKey: youtubeKey,
      telegramBotToken: telegramToken,
      telegramChannel: telegramChannel,
      studyHoursGoal: goalHours
    });
    addToast('Credentials and objectives stored successfully!', 'success');
  };

  const selectColorTheme = (themeName: string) => {
    updateSettings({
      ...settings,
      theme: themeName as any
    });
    addToast(`Theme adjusted to: ${themeName.replace('-', ' ').toUpperCase()}`, 'success');
  };

  const handleSaveCustomTheme = () => {
    updateSettings({
      ...settings,
      theme: 'custom-theme',
      customAccentColor: customAccent,
      customBgColor: customBg
    });
    addToast('Custom visual parameters saved! Check design changes.', 'success');
  };

  const handleSaveNotifs = (key: string, value: boolean) => {
    const updatedNotifications = {
      ...settings.notifications,
      [key]: value
    };
    updateSettings({
      ...settings,
      notifications: updatedNotifications
    });
    addToast('Notification channels updated.', 'success');
  };

  const handleRoutineChange = (id: string, field: 'name' | 'start' | 'end', val: string) => {
    setEditedRoutine(prev => prev.map(r => {
      if (r.id === id) {
        return { ...r, [field]: val };
      }
      return r;
    }));
  };

  const handleSaveRoutineConfigs = () => {
    onSaveRoutine(editedRoutine);
    addToast('Daily 24h category routine saved successfully!', 'success');
  };

  // State File System exporter/importer
  const handleExportData = () => {
    const backupObj = {
      workouts,
      routine,
      topics: JSON.parse(localStorage.getItem('roy_topics') || '[]'),
      streak: JSON.parse(localStorage.getItem('roy_streak') || '{}'),
      achievements: JSON.parse(localStorage.getItem('roy_achievements') || '[]'),
      beastXp: Number(localStorage.getItem('roy_beast_xp')) || 340,
    };

    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(backupObj, null, 2));
    const dlLink = document.createElement('a');
    dlLink.setAttribute('href', dataUri);
    dlLink.setAttribute('download', 'roy_discipline_database_backup.json');
    dlLink.click();
    addToast('Consolidated backup file exported!', 'success');
  };

  const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const parsed = JSON.parse(event.target?.result as string);
          if (parsed.workouts) onSaveWorkouts(parsed.workouts);
          if (parsed.routine) onSaveRoutine(parsed.routine);
          if (parsed.beastXp) localStorage.setItem('roy_beast_xp', String(parsed.beastXp));
          addToast('Full backup ledger restored! Reloading cache details...', 'success');
        } catch {
          addToast('Reading failure. Ensure valid configuration structures.', 'error');
        }
      };
      reader.readAsText(files[0]);
    }
  };

  // Immediate layout closing
  const handlePanelClose = () => {
    setIsUnlocked(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in" id="admin-panel-overlay">
      <div className="w-full max-w-2xl bg-[#09090b]/95 border border-zinc-850 rounded-[32px] overflow-hidden shadow-2xl flex flex-col max-h-[85vh] relative text-left">
        
        {/* TOP PANEL CONTROL */}
        <div className="p-5 border-b border-zinc-900 bg-black/40 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl border ${isUnlocked ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' : 'text-red-400 bg-red-500/10 border-red-500/20'}`}>
              {isUnlocked ? <Unlock className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
            </div>
            <div>
              <h2 className="text-sm font-black font-mono tracking-widest text-white uppercase leading-none">ADMIN SYSTEMS CABINET</h2>
              <span className="text-[9px] text-zinc-550 font-black uppercase font-mono tracking-wider block mt-1">Passcode restricted parameters</span>
            </div>
          </div>
          
          <button
            id="close-admin-btn"
            onClick={handlePanelClose}
            className="p-1 px-3 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
          >
            Exit Systems
          </button>
        </div>

        {/* LOCK SCREEN CHECKPOINT */}
        {!isUnlocked ? (
          <div className="p-8 flex-1 flex flex-col justify-center items-center text-center space-y-6 max-h-[500px]">
            <div className="w-16 h-16 bg-red-500/10 border border-red-500/15 rounded-3xl flex items-center justify-center text-red-505 animate-pulse">
              <Lock className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h3 className="text-md font-bold tracking-tight text-white uppercase font-mono">AUTHORIZED PERSONNEL KEY CODES</h3>
              <p className="text-[11px] text-zinc-550 max-w-xs mx-auto leading-normal">
                Credentials, timers, telemetry and themes layouts require authentication. Enter secret admin passcode below.
              </p>
            </div>

            <form onSubmit={handleVerifyPasscode} className="w-full max-w-xs space-y-3">
              <input
                id="admin-passcode-input"
                type="password"
                required
                maxLength={6}
                value={passcode}
                onChange={e => setPasscode(e.target.value)}
                placeholder="○ ○ ○ ○ ○ ○"
                className="w-full bg-black/60 border border-zinc-800 text-center text-white tracking-widest text-lg font-mono rounded-2xl py-3 focus:outline-none focus:border-red-500 duration-200"
              />
              <button
                type="submit"
                id="submit-passcode-btn"
                className="w-full bg-indigo-650 hover:bg-indigo-505 text-white font-extrabold text-xs py-3.5 rounded-2xl shadow transition-all uppercase tracking-wider font-mono cursor-pointer"
              >
                Unlock Channels
              </button>
            </form>
          </div>
        ) : (
          /* UNLOCKED MANAGEMENT HUD */
          <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
            
            {/* SUB-TAB NAVS */}
            <div className="w-full md:w-52 border-b md:border-b-0 md:border-r border-zinc-900 bg-zinc-950/20 p-4 space-y-1 shrink-0 flex flex-row md:flex-col overflow-x-auto invisible-scrollbar md:overflow-x-visible">
              {[
                { id: 'api', label: 'Keys & Servers', icon: Key },
                { id: 'routine', label: 'Routines Board', icon: Clock },
                { id: 'notifs', label: 'Notifs Channels', icon: Bell },
                { id: 'theme', label: 'Theme Studio', icon: Palette },
                { id: 'backup', label: 'Ledger Backups', icon: FileOutput }
              ].map((tab) => {
                const Icon = tab.icon;
                const active = activeSubTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    id={`admin-subtab-${tab.id}`}
                    onClick={() => setActiveSubTab(tab.id as any)}
                    className={`w-full p-2.5 px-3 rounded-xl flex items-center gap-2.5 text-xs font-bold transition-all cursor-pointer text-left shrink-0 md:shrink-1 ${
                      active 
                        ? 'bg-zinc-900 text-white border border-zinc-800 shadow'
                        : 'text-zinc-500 hover:text-zinc-300'
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* TAB SCROLL PANELS */}
            <div className="flex-1 p-6 overflow-y-auto max-h-[60vh] invisible-scrollbar bg-[#050507]">
              
              {/* API KEYS MANAGER */}
              {activeSubTab === 'api' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-xs font-black uppercase text-zinc-400 tracking-wider font-mono">CREDENTIALS SECRET MANAGER</h3>
                    <p className="text-[10px] text-zinc-550">Configure Gemini LLM vectors, Youtube video lists, and Telegram variables</p>
                  </div>

                  <div className="space-y-4 text-xs">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      
                      <div className="space-y-1">
                        <label className="text-[10px] text-zinc-500 font-bold uppercase font-mono">Gemini AI Key</label>
                        <input
                          id="admin-gemini-key-input"
                          type="password"
                          value={geminiKey}
                          onChange={e => setGeminiKey(e.target.value)}
                          placeholder="AI Studio Token..."
                          className="w-full bg-zinc-950 border border-zinc-900 text-white rounded-xl p-2.5 font-mono"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] text-zinc-500 font-bold uppercase font-mono">YouTube API Key</label>
                        <input
                          id="admin-youtube-key-input"
                          type="password"
                          value={youtubeKey}
                          onChange={e => setYoutubeKey(e.target.value)}
                          placeholder="Dev YouTube guidelines API..."
                          className="w-full bg-zinc-950 border border-zinc-900 text-white rounded-xl p-2.5 font-mono"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] text-zinc-505 font-bold uppercase font-mono">Telegram Bot Token</label>
                        <input
                          id="admin-telegram-token-input"
                          type="password"
                          value={telegramToken}
                          onChange={e => setTelegramToken(e.target.value)}
                          placeholder="Bot ID Token..."
                          className="w-full bg-zinc-950 border border-zinc-900 text-white rounded-xl p-2.5 font-mono"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] text-zinc-505 font-bold uppercase font-mono">Telegram Channel</label>
                        <input
                          id="admin-telegram-channel-input"
                          type="text"
                          value={telegramChannel}
                          onChange={e => setTelegramChannel(e.target.value)}
                          placeholder="e.g. @roy_discipline"
                          className="w-full bg-zinc-950 border border-zinc-900 text-white rounded-xl p-2.5 font-mono"
                        />
                      </div>

                      <div className="space-y-1 sm:col-span-2">
                        <label className="text-[10px] text-zinc-505 font-bold uppercase font-mono">Daily Study Target Hours</label>
                        <input
                          id="admin-goal-hours-input"
                          type="number"
                          value={goalHours}
                          onChange={e => setGoalHours(Number(e.target.value) || 5)}
                          className="w-full bg-zinc-950 border border-zinc-900 text-white rounded-xl p-2.5 font-mono"
                        />
                      </div>

                    </div>

                    <button
                      type="button"
                      id="save-api-keys-btn"
                      onClick={handleSaveApiKeys}
                      className="w-full py-3 bg-indigo-650 hover:bg-indigo-505 hover:scale-[1.01] text-white text-xs font-black uppercase rounded-2xl shadow transition-all cursor-pointer font-mono flex items-center justify-center gap-1.5"
                    >
                      <Save className="w-4 h-4" />
                      Save Server Credentials
                    </button>
                  </div>

                  {/* TELEGRAM TEST SYSTEM */}
                  <div className="border-t border-zinc-900 pt-5 space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-xs font-bold uppercase text-zinc-400 tracking-wider font-mono">AUTO TELEGRAM CONNECTION TESTER</h4>
                        <p className="text-[9px] text-zinc-550 leading-relaxed max-w-xs">Ping bot to confirm connection username status</p>
                      </div>
                      
                      <button
                        type="button"
                        id="telegram-integrity-test-btn"
                        disabled={testingTelegram}
                        onClick={testTelegram}
                        className="p-2 bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white rounded-xl hover:scale-103 duration-200 cursor-pointer text-xs font-bold font-mono flex items-center gap-1.5"
                      >
                        {testingTelegram ? <RefreshCcw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                        Ping Channel
                      </button>
                    </div>

                    {/* Outputs history logs console */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-[9px] uppercase font-bold text-zinc-500">
                        <span>Console Terminal Buffer</span>
                        <button id="clear-logs-btn" onClick={clearLogs} className="hover:text-white transition-colors cursor-pointer border-0 bg-transparent text-[9px]">Clear Terminal</button>
                      </div>

                      <div className="bg-zinc-950 border border-zinc-900 rounded-2xl p-4 font-mono text-[9px] leading-relaxed max-h-36 overflow-y-auto space-y-2 text-zinc-450">
                        {logs.length === 0 ? (
                          <span className="text-zinc-650 italic">Console idle. Ping channels above to print telemetry.</span>
                        ) : (
                          logs.map(log => (
                            <div key={log.id} className="flex gap-2 border-b border-zinc-950 pb-1.5 text-left">
                              <span className="text-zinc-650">[{log.timestamp}]</span>
                              <span className={`font-bold ${log.type === 'success' ? 'text-emerald-400' : 'text-rose-400'}`}>({log.type.toUpperCase()}):</span>
                              <span className="text-zinc-300">{log.message}</span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>

                </div>
              )}

              {/* ROUTINES CONTROLLER */}
              {activeSubTab === 'routine' && (
                <div className="space-y-5">
                  <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
                    <div>
                      <h3 className="text-xs font-black uppercase text-zinc-400 tracking-wider font-mono">ROUTINE EDITOR ENGINE</h3>
                      <p className="text-[10px] text-zinc-550">Configure categories for daily 12h AM/PM blocks</p>
                    </div>
                    
                    <button
                      type="button"
                      id="save-routine-editor-btn"
                      onClick={handleSaveRoutineConfigs}
                      className="bg-indigo-650 hover:bg-indigo-505 text-white font-bold text-xs px-3.5 py-1.5 rounded-xl cursor-pointer"
                    >
                      Save Timings
                    </button>
                  </div>

                  <div className="space-y-3">
                    {editedRoutine.map((item) => (
                      <div key={item.id} className="p-3 bg-zinc-950/60 border border-zinc-900 rounded-2xl flex flex-col sm:flex-row gap-3 items-center justify-between">
                        <input
                          id={`routine-name-input-${item.id}`}
                          type="text"
                          value={item.name}
                          onChange={e => handleRoutineChange(item.id, 'name', e.target.value)}
                          className="bg-zinc-900 text-xs font-bold text-white px-3 py-2 rounded-xl border border-zinc-850 w-full sm:w-auto flex-1 focus:outline-none"
                        />
                        <div className="flex items-center gap-2">
                          <input
                            id={`routine-start-input-${item.id}`}
                            type="text"
                            value={item.start}
                            onChange={e => handleRoutineChange(item.id, 'start', e.target.value)}
                            className="bg-zinc-900 text-center font-mono text-indigo-300 text-xs px-2.5 py-2 border border-zinc-850 rounded-xl w-22"
                          />
                          <span className="text-zinc-650 text-xs font-bold font-mono">TO</span>
                          <input
                            id={`routine-end-input-${item.id}`}
                            type="text"
                            value={item.end}
                            onChange={e => handleRoutineChange(item.id, 'end', e.target.value)}
                            className="bg-zinc-900 text-center font-mono text-indigo-300 text-xs px-2.5 py-2 border border-zinc-850 rounded-xl w-22"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* NOTIFICATION PREFERENCES */}
              {activeSubTab === 'notifs' && (
                <div className="space-y-5">
                  <div>
                    <h3 className="text-xs font-black uppercase text-zinc-400 tracking-wider font-mono">TELEGRAM BROADCAST MATRIX</h3>
                    <p className="text-[10px] text-zinc-550">Toggle automated block alerts to target handle</p>
                  </div>

                  <div className="space-y-3">
                    {[
                      { key: 'study', label: 'Study session notifications', desc: 'At 11:00 PM, locks down and flashes NCERT study start alerts' },
                      { key: 'gym', label: 'Gym Mode alerts', desc: 'At 04:30 AM, flashes custom workout day structures' },
                      { key: 'revision', label: 'Revision reminders', desc: 'At 09:00 AM, announces revision routines' },
                      { key: 'sleep', label: 'Restful Sleep blocks', desc: 'At 10:30 AM, triggers sleep reminders' },
                      { key: 'walking', label: 'Decompress schedules', desc: 'At 05:00 PM, pushes target decompress signals' },
                      { key: 'dailyReports', label: 'Scorecard summary posts', desc: 'Exports daily total discipline XP and counts' },
                      { key: 'weeklyReports', label: 'Consistency logs', desc: 'Summarizes weekly average NEET stats on Sundays' }
                    ].map((notif) => {
                      const active = settings.notifications[notif.key as keyof typeof settings.notifications];
                      return (
                        <div key={notif.key} className="p-3.5 bg-zinc-950 border border-zinc-900 rounded-2xl flex justify-between items-center text-left">
                          <div className="pr-4">
                            <h4 className="text-xs font-bold text-zinc-100">{notif.label}</h4>
                            <p className="text-[9px] text-zinc-600 mt-1">{notif.desc}</p>
                          </div>
                          
                          <button
                            type="button"
                            id={`toggle-notif-pref-${notif.key}`}
                            onClick={() => handleSaveNotifs(notif.key, !active)}
                            className={`w-11 h-6 rounded-full p-1 cursor-pointer transition-colors shrink-0 ${active ? 'bg-indigo-600' : 'bg-zinc-900 border border-zinc-800'}`}
                          >
                            <div className={`w-4 h-4 bg-white rounded-full shadow duration-300 transform ${active ? 'translate-x-5' : 'translate-x-0'}`} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* DYNAMIC THEMES & LANGUAGE MASTER */}
              {activeSubTab === 'theme' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-xs font-black uppercase text-zinc-400 tracking-wider font-mono">PREMIUM THEME CABINET</h3>
                    <p className="text-[10px] text-zinc-550">Optimize visual accents, layouts, and gradients instantly</p>
                  </div>

                  {/* Theme buttons grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {[
                      { id: 'midnight-black', name: 'Midnight Black', desc: 'Pure dark design. Carbon and titanium gray hues.', colorBg: 'bg-zinc-950', border: 'border-zinc-800' },
                      { id: 'royal-purple', name: 'Royal Purple', desc: 'Aura of royalty. Deep violet and galactic purples.', colorBg: 'bg-indigo-950/20', border: 'border-purple-500/30' },
                      { id: 'neon-blue', name: 'Neon Blue', desc: 'High-contrast cyan. Electric blue gridlines and neon glow.', colorBg: 'bg-cyan-950/20', border: 'border-cyan-500/30' },
                      { id: 'crimson-red', name: 'Crimson Red', desc: 'Iron determination blood theme. Red warning flags.', colorBg: 'bg-red-950/20', border: 'border-red-500/30' },
                      { id: 'emerald-green', name: 'Emerald Green', desc: 'Sustained focus green glow. Organic recovery tones.', colorBg: 'bg-emerald-950/20', border: 'border-emerald-500/30' },
                    ].map((themeItem) => {
                      const selected = settings.theme === themeItem.id;
                      return (
                        <button
                          key={themeItem.id}
                          type="button"
                          id={`select-theme-${themeItem.id}`}
                          onClick={() => selectColorTheme(themeItem.id)}
                          className={`p-4 rounded-2xl border text-left flex flex-col justify-between transition-all duration-300 cursor-pointer ${themeItem.colorBg} ${themeItem.border} ${
                            selected 
                              ? 'ring-2 ring-indigo-500 border-indigo-500 scale-[1.01] shadow-lg' 
                              : 'hover:border-zinc-650'
                          }`}
                        >
                          <div>
                            <div className="flex justify-between items-center mb-1">
                              <h5 className="text-xs font-bold text-white font-sans">{themeItem.name}</h5>
                              {selected && <Check className="w-3.5 h-3.5 text-indigo-400" />}
                            </div>
                            <p className="text-[9px] text-zinc-500 leading-normal font-sans">{themeItem.desc}</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* CUSTOM THEME CREATOR */}
                  <div className="p-5 bg-zinc-950 rounded-2xl border border-zinc-900 text-left space-y-4">
                    <div className="border-b border-zinc-900 pb-2 mb-1">
                      <h4 className="text-[10px] font-black text-amber-500 uppercase font-mono">Custom Theme Creator Studio</h4>
                      <p className="text-[9.5px] text-zinc-600 mt-0.5 font-sans">Pick custom colors matching your specific mental frequency</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div className="space-y-1.5 text-left">
                        <label className="text-[9.5px] text-zinc-500 font-bold uppercase block font-mono">Primary Accent Hex Code</label>
                        <div className="flex gap-2">
                          <input
                            type="color"
                            value={customAccent}
                            onChange={e => setCustomAccent(e.target.value)}
                            className="w-10 h-8 bg-transparent border border-zinc-800 rounded cursor-pointer"
                          />
                          <input
                            type="text"
                            value={customAccent}
                            onChange={e => setCustomAccent(e.target.value)}
                            className="flex-1 bg-zinc-900 border border-zinc-850 text-white rounded-lg p-1.5 text-xs font-mono"
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5 text-left">
                        <label className="text-[9.5px] text-zinc-500 font-bold uppercase block font-mono">Background Color Hex</label>
                        <div className="flex gap-2">
                          <input
                            type="color"
                            value={customBg}
                            onChange={e => setCustomBg(e.target.value)}
                            className="w-10 h-8 bg-transparent border border-zinc-800 rounded cursor-pointer"
                          />
                          <input
                            type="text"
                            value={customBg}
                            onChange={e => setCustomBg(e.target.value)}
                            className="flex-1 bg-zinc-900 border border-zinc-850 text-white rounded-lg p-1.5 text-xs font-mono"
                          />
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleSaveCustomTheme}
                      className="w-full py-2 bg-gradient-to-r from-indigo-650 to-purple-600 text-white font-extrabold text-[10.5px] uppercase rounded-xl transition-all shadow"
                    >
                      Apply Custom Vector Parameters
                    </button>
                  </div>

                </div>
              )}

              {/* BACKUPS MANAGER */}
              {activeSubTab === 'backup' && (
                <div className="space-y-5 text-left">
                  <div>
                    <h3 className="text-xs font-black uppercase text-zinc-400 tracking-wider font-mono">STATE STABILITY CENTER</h3>
                    <p className="text-[10px] text-zinc-550">Export or restore full local databases</p>
                  </div>

                  <div className="p-4 bg-zinc-950 border border-zinc-900 rounded-2xl flex flex-col items-start gap-3.5">
                    <div>
                      <h4 className="text-xs font-bold text-zinc-300">Raw Ledger Downloader</h4>
                      <p className="text-[9px] mt-1 text-zinc-550 leading-normal">Save complete workouts, NEET schedules, streaks, and achievements into a JSON format.</p>
                    </div>

                    <button
                      type="button"
                      id="export-data-btn"
                      onClick={handleExportData}
                      className="p-2 px-3.5 bg-zinc-900 hover:bg-zinc-850 text-indigo-400 hover:text-white rounded-xl text-xs font-bold border border-indigo-505/10 flex items-center gap-1 cursor-pointer"
                    >
                      <FileOutput className="w-3.5 h-3.5" />
                      Get JSON Ledger
                    </button>
                  </div>

                  <div className="p-4 bg-zinc-950 border border-zinc-900 rounded-2xl flex flex-col items-start gap-3.5">
                    <div>
                      <h4 className="text-xs font-bold text-zinc-305">Ledger Re-Uploader</h4>
                      <p className="text-[9px] mt-1 text-zinc-550 leading-normal">Recover entire progress instantly from a local file backup.</p>
                    </div>

                    <div className="relative">
                      <input
                        id="import-backup-file-input"
                        type="file"
                        accept=".json"
                        onChange={handleImportData}
                        className="opacity-0 absolute inset-0 cursor-pointer w-full"
                      />
                      <button
                        type="button"
                        className="p-2 px-3.5 bg-zinc-900 hover:bg-zinc-850 text-indigo-400 hover:text-white rounded-xl text-xs font-bold border border-indigo-505/10 flex items-center gap-1"
                      >
                        <FileInput className="w-3.5 h-3.5" />
                        Restore JSON Ledger
                      </button>
                    </div>
                  </div>

                </div>
              )}

            </div>

          </div>
        )}

      </div>
    </div>
  );
}
