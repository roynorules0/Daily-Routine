import React, { useState } from 'react';
import { Calendar, CheckSquare, Settings, Wrench, AlertTriangle, Send, ShieldAlert, BadgeInfo } from 'lucide-react';

interface MaintenanceTask {
  id: string;
  name: string;
  recommendedOdoInterval: string;
  lastDoneOdo: number;
  isCustomAlarm?: boolean;
  status: 'Critical' | 'Healthy' | 'Service Impending';
}

interface BikeMaintenanceTrackerProps {
  telegramBotToken?: string;
  telegramChannel?: string;
  addToast: (text: string, type: 'success' | 'error' | 'info') => void;
  addXp: (amount: number, reason: string) => void;
}

export default function BikeMaintenanceTracker({
  telegramBotToken,
  telegramChannel,
  addToast,
  addXp
}: BikeMaintenanceTrackerProps) {
  const [odoReading, setOdoReading] = useState<number>(() => {
    const saved = localStorage.getItem('re_hunter_odo');
    return saved ? Number(saved) : 5280;
  });

  const [tasks, setTasks] = useState<MaintenanceTask[]>(() => {
    const saved = localStorage.getItem('re_hunter_tasks');
    if (saved) return JSON.parse(saved);
    return [
      { id: 't1', name: 'Engine Oil Change (Liquid Gun 15W50)', recommendedOdoInterval: 'every 10,000 km', lastDoneOdo: 4800, status: 'Healthy' },
      { id: 't2', name: 'Chain Cleaning & Degreasing', recommendedOdoInterval: 'every 500 km', lastDoneOdo: 5100, status: 'Service Impending' },
      { id: 't3', name: 'Chain Lubrication (Motul C2)', recommendedOdoInterval: 'every 500 km', lastDoneOdo: 5100, status: 'Service Impending' },
      { id: 't4', name: 'Air Filter Cleaning/Replacement', recommendedOdoInterval: 'every 5,000 km', lastDoneOdo: 4000, status: 'Healthy' },
      { id: 't5', name: 'Brake Pads Checkup (Front/Rear)', recommendedOdoInterval: 'every 3,000 km', lastDoneOdo: 4800, status: 'Healthy' },
      { id: 't6', name: 'Battery health & Voltage inspection', recommendedOdoInterval: 'every 12 months', lastDoneOdo: 1200, status: 'Healthy' }
    ];
  });

  const [frontTyrePsi, setFrontTyrePsi] = useState(() => localStorage.getItem('re_hunter_tyre_f') || '29');
  const [rearTyrePsi, setRearTyrePsi] = useState(() => localStorage.getItem('re_hunter_tyre_r') || '32');
  const [pollutionExpiry, setPollutionExpiry] = useState(() => localStorage.getItem('re_hunter_puc') || '2026-12-15');
  const [insuranceExpiry, setInsuranceExpiry] = useState(() => localStorage.getItem('re_hunter_ins') || '2026-10-30');

  // Input fields for custom task creation
  const [customTaskName, setCustomTaskName] = useState('');
  const [customInterval, setCustomInterval] = useState('');

  const saveOdo = (nextVal: number) => {
    const validVal = Math.max(0, nextVal);
    setOdoReading(validVal);
    localStorage.setItem('re_hunter_odo', validVal.toString());
  };

  const saveTasksAndChecks = (nextTasks: MaintenanceTask[]) => {
    setTasks(nextTasks);
    localStorage.setItem('re_hunter_tasks', JSON.stringify(nextTasks));
  };

  const handleUpdateOdo = (val: number) => {
    saveOdo(val);
    addToast('Royal Enfield Odo reading synchronized!', 'info');
  };

  const handleMarkDone = (id: string) => {
    const updated = tasks.map((t) => {
      if (t.id === id) {
        return { ...t, lastDoneOdo: odoReading, status: 'Healthy' as const };
      }
      return t;
    });
    saveTasksAndChecks(updated);
    addToast(`Successfully registered maintenance completion at ${odoReading} km!`, 'success');
    addXp(60, 'Hunter 350 Maintenance execution recorded');
  };

  const handleStatusSkew = (id: string, st: MaintenanceTask['status']) => {
    const updated = tasks.map((t) => {
      if (t.id === id) return { ...t, status: st };
      return t;
    });
    saveTasksAndChecks(updated);
  };

  const handleAddCustomTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customTaskName.trim()) return;
    const newTask: MaintenanceTask = {
      id: `task-${Date.now()}`,
      name: customTaskName.trim(),
      recommendedOdoInterval: customInterval.trim() || 'every 1,000 km',
      lastDoneOdo: odoReading,
      status: 'Healthy',
      isCustomAlarm: true
    };
    saveTasksAndChecks([...tasks, newTask]);
    setCustomTaskName('');
    setCustomInterval('');
    addToast('Custom vehicle alert log initialized.', 'success');
  };

  const handleDeleteCustomTask = (id: string) => {
    saveTasksAndChecks(tasks.filter(t => t.id !== id));
    addToast('Task deleted.', 'info');
  };

  const handleSendTelegramCheck = async () => {
    if (!telegramBotToken || !telegramChannel) {
      addToast('Set Telegram connection credential variables first!', 'error');
      return;
    }

    const taskLines = tasks.map(t => {
      const icon = t.status === 'Critical' ? '🚨' : t.status === 'Service Impending' ? '⚠️' : '⚡';
      return `${icon} <b>${t.name}</b> (<i>Last: ${t.lastDoneOdo} km</i>)\n   -> Interval: ${t.recommendedOdoInterval} | Status: <b>${t.status}</b>`;
    }).join('\n\n');

    const text = `🏍 <b>ROYAL ENFIELD HUNTER 350 MAINTENANCE STATS</b> 🏍\n\n` +
      `<b>Odometer Index:</b> <code>${odoReading} km</code>\n` +
      `<b>Tyre Pressures [F/R]:</b> <code>${frontTyrePsi} / ${rearTyrePsi} PSI</code>\n` +
      `🛡 <b>PUC Validation:</b> <code>${pollutionExpiry}</code>\n` +
      `📜 <b>Insurance Renewal:</b> <code>${insuranceExpiry}</code>\n\n` +
      `💼 <b>MAINTENANCE RADAR:</b>\n${taskLines || 'No active metrics scheduled.'}\n\n` +
      `✨ <i>Take care of the bike that carries you through the clinic shifts and back. Keep her roaring clean, Roy!</i>`;

    const targetChannel = telegramChannel.startsWith('@') ? telegramChannel : `@${telegramChannel}`;
    const url = `https://api.telegram.org/bot${telegramBotToken}/sendMessage`;

    try {
      await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: targetChannel, text, parse_mode: 'HTML' })
      });
      addToast('Royal Enfield Stats pushed to Telegram successfully!', 'success');
    } catch {
      addToast('Telegram machine report delivery failed.', 'error');
    }
  };

  const saveStaticVars = (val: string, type: 'tyre_f' | 'tyre_r' | 'puc' | 'ins') => {
    localStorage.setItem(`re_hunter_${type}`, val);
  };

  return (
    <div className="bg-zinc-900/35 border border-zinc-850 rounded-3xl p-6 text-left space-y-5">
      <div className="flex items-center justify-between border-b border-zinc-850 pb-3">
        <div className="flex items-center gap-2">
          <Wrench className="w-5 h-5 text-indigo-400" />
          <h2 className="text-sm font-bold uppercase text-white tracking-widest font-mono">Hunter 350 Maintenance Deck</h2>
        </div>
        <button
          onClick={handleSendTelegramCheck}
          className="px-3 py-1.5 bg-zinc-950 hover:bg-zinc-900 text-zinc-300 font-mono text-[10px] rounded-lg border border-zinc-850 cursor-pointer flex items-center gap-1.5 transition-all"
        >
          <Send className="w-3.5 h-3.5" /> Telegram Moto Alert
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* ODOMETER CONTROLLER */}
        <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-900 space-y-2">
          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest font-mono block">Odo Mileage Metric</span>
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={odoReading || ''}
              onChange={(e) => saveOdo(Number(e.target.value))}
              className="bg-zinc-900 border border-zinc-850 rounded-lg p-2 font-mono text-sm font-black text-indigo-400 w-full"
            />
            <span className="text-xs font-bold text-zinc-400 uppercase font-mono">KM</span>
          </div>
          <button
            onClick={() => handleUpdateOdo(odoReading)}
            className="w-full text-center bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-[10px] text-zinc-450 rounded py-1 cursor-pointer font-bold font-mono tracking-wider"
          >
            CONFIRM KM INDEX
          </button>
        </div>

        {/* TYRE PRESSURE */}
        <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-900 space-y-2">
          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest font-mono block">Tyre Pressures (PSI)</span>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <span className="text-[8px] font-bold text-zinc-500 font-mono">FRONT (std 29)</span>
              <input
                type="text"
                value={frontTyrePsi}
                onChange={(e) => {
                  setFrontTyrePsi(e.target.value);
                  saveStaticVars(e.target.value, 'tyre_f');
                }}
                className="bg-zinc-900 border border-zinc-850 rounded p-1 text-xs font-mono font-bold text-right text-white w-full"
              />
            </div>
            <div>
              <span className="text-[8px] font-bold text-zinc-500 font-mono">REAR (std 32)</span>
              <input
                type="text"
                value={rearTyrePsi}
                onChange={(e) => {
                  setRearTyrePsi(e.target.value);
                  saveStaticVars(e.target.value, 'tyre_r');
                }}
                className="bg-zinc-900 border border-zinc-850 rounded p-1 text-xs font-mono font-bold text-right text-white w-full"
              />
            </div>
          </div>
        </div>

        {/* COMPLIANCE RENEWAL dates */}
        <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-900 space-y-2">
          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest font-mono block">Compliance Radar Dates</span>
          <div className="grid grid-cols-2 gap-2 text-[10px]">
            <div>
              <span className="text-[8px] font-bold text-zinc-500 font-mono">PUC CERT</span>
              <input
                type="date"
                value={pollutionExpiry}
                onChange={(e) => {
                  setPollutionExpiry(e.target.value);
                  saveStaticVars(e.target.value, 'puc');
                }}
                className="bg-zinc-900 border border-zinc-850 text-white rounded p-1 w-full font-mono text-[9px]"
              />
            </div>
            <div>
              <span className="text-[8px] font-bold text-zinc-500 font-mono">INSURANCE</span>
              <input
                type="date"
                value={insuranceExpiry}
                onChange={(e) => {
                  setInsuranceExpiry(e.target.value);
                  saveStaticVars(e.target.value, 'ins');
                }}
                className="bg-zinc-900 border border-zinc-850 text-white rounded p-1 w-full font-mono text-[9px]"
              />
            </div>
          </div>
        </div>
      </div>

      {/* RURAL ROAD TASKING DECK */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest font-mono">Automotive Inspection Checkpoints</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {tasks.map((t) => {
            const diff = odoReading - t.lastDoneOdo;
            return (
              <div key={t.id} className="bg-zinc-950 p-3.5 rounded-2xl border border-zinc-900 flex justify-between items-center gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    {t.status === 'Critical' ? (
                      <AlertTriangle className="w-4 h-4 text-red-500" />
                    ) : t.status === 'Service Impending' ? (
                      <BadgeInfo className="w-4 h-4 text-amber-500 animate-pulse" />
                    ) : (
                      <CheckSquare className="w-4 h-4 text-emerald-400" />
                    )}
                    <h4 className="text-xs font-bold text-white font-sans">{t.name}</h4>
                  </div>
                  <div className="text-[10px] text-zinc-500 font-mono flex flex-wrap gap-x-2">
                    <span>Task Interval: {t.recommendedOdoInterval}</span>
                    <span className="text-zinc-650">•</span>
                    <span>Done: {t.lastDoneOdo} km</span>
                    <span className="text-zinc-650">•</span>
                    <span className="font-bold text-indigo-400">Run: {diff} km ago</span>
                  </div>
                </div>

                <div className="flex flex-col gap-1 shrink-0">
                  <button
                    onClick={() => handleMarkDone(t.id)}
                    className="px-2.5 py-1 bg-zinc-900 hover:bg-zinc-850 text-white border border-zinc-800 rounded font-mono text-[9px] font-bold cursor-pointer uppercase tracking-wider"
                  >
                    🛠 Reset Done
                  </button>
                  <select
                    value={t.status}
                    onChange={(e: any) => handleStatusSkew(t.id, e.target.value)}
                    className="bg-zinc-900 text-zinc-400 text-[8px] font-mono rounded border border-zinc-850 h-5 px-1 focus:border-indigo-500"
                  >
                    <option value="Healthy">Healthy</option>
                    <option value="Service Impending">Impending</option>
                    <option value="Critical">🚨 Critical</option>
                  </select>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Create Custom Machine alarm tasks */}
      <form onSubmit={handleAddCustomTask} className="bg-zinc-950 p-4 rounded-2xl border border-zinc-900 grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
        <div>
          <span className="text-[8px] font-bold text-zinc-500 uppercase font-mono block mb-1">Add Custom machine alert</span>
          <input
            type="text"
            required
            placeholder="e.g. Clean Carburettor Spark plug"
            value={customTaskName}
            onChange={(e) => setCustomTaskName(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-850 rounded p-2 text-xs text-white"
          />
        </div>
        <div>
          <span className="text-[8px] font-bold text-zinc-500 uppercase font-mono block mb-1">Alert Recommended Interval</span>
          <input
            type="text"
            required
            placeholder="e.g. every 2,500 km"
            value={customInterval}
            onChange={(e) => setCustomInterval(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-850 rounded p-2 text-xs text-white"
          />
        </div>
        <div>
          <button
            type="submit"
            className="w-full text-center bg-zinc-900 hover:bg-zinc-850 text-white font-mono font-bold text-xs py-2 rounded border border-zinc-800 cursor-pointer uppercase truncate"
          >
            Create Alert Log
          </button>
        </div>
      </form>
    </div>
  );
}
