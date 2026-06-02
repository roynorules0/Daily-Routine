import React, { useState, useEffect } from 'react';
import { Sword, Trophy, Shield, Heart, Zap, Sparkles, CheckCircle2, Skull } from 'lucide-react';

interface ActiveChallenge {
  id: string;
  name: string;
  daysDuration: number;
  currentDay: number;
  streak: number;
  requirementChecklist: string[];
  xpPerDayCompleted: number;
}

interface BossState {
  name: string;
  maxHp: number;
  currentHp: number;
  level: number;
  subTitle: string;
  bossLootXp: number;
  shieldValue: number;
}

interface ChallengeAndBossBattlesProps {
  totalXp: number;
  addXp: (amount: number, reason: string) => void;
  addToast: (text: string, type: 'success' | 'error' | 'info') => void;
}

export default function ChallengeAndBossBattles({
  totalXp,
  addXp,
  addToast
}: ChallengeAndBossBattlesProps) {
  // CHALLENGES STATE
  const [challenges, setChallenges] = useState<ActiveChallenge[]>(() => {
    const saved = localStorage.getItem('roy_active_challenges');
    if (saved) return JSON.parse(saved);
    return [
      {
        id: 'c1',
        name: '🔥 75-Hard Discipline Grind',
        daysDuration: 75,
        currentDay: 18,
        streak: 18,
        requirementChecklist: ['4.5L Water logged', 'Clean diet (No fast foods)', '2x Study blocks done', '1x Gym Lift session'],
        xpPerDayCompleted: 200
      },
      {
        id: 'c2',
        name: '🧬 NEET Biology 30-Day Active Recall Blast',
        daysDuration: 30,
        currentDay: 8,
        streak: 8,
        requirementChecklist: ['150 Past Year Questions solved', '2 hours active flashcards', 'Weak topics revised'],
        xpPerDayCompleted: 150
      }
    ];
  });

  const [checklistCompletions, setChecklistCompletions] = useState<Record<string, boolean>>({});

  // BOSS STATE
  const [boss, setBoss] = useState<BossState>(() => {
    const saved = localStorage.getItem('roy_beast_active_boss');
    if (saved) return JSON.parse(saved);
    return {
      name: '⚔️ The Organic Chemistry Molecular Titan',
      maxHp: 1000,
      currentHp: 750,
      level: 12,
      subTitle: 'NEET Physical-Chemistry Threshold Core Guard',
      bossLootXp: 1800,
      shieldValue: 200
    };
  });

  // PLAYER STATE inside boss mode
  const [playerHp, setPlayerHp] = useState<number>(() => {
    const saved = localStorage.getItem('roy_beast_player_hp');
    return saved ? Number(saved) : 100;
  });

  const saveChallenges = (nextCh: ActiveChallenge[]) => {
    setChallenges(nextCh);
    localStorage.setItem('roy_active_challenges', JSON.stringify(nextCh));
  };

  const saveBossAndPlayer = (nextBoss: BossState, nextHp: number) => {
    setBoss(nextBoss);
    setPlayerHp(nextHp);
    localStorage.setItem('roy_beast_active_boss', JSON.stringify(nextBoss));
    localStorage.setItem('roy_beast_player_hp', nextHp.toString());
  };

  const handleCompleteCheckItem = (challengeId: string, itemIdx: number, isChecked: boolean) => {
    const key = `${challengeId}-${itemIdx}`;
    const nextComps = { ...checklistCompletions, [key]: isChecked };
    setChecklistCompletions(nextComps);

    // If matches everything checked
    const chal = challenges.find(c => c.id === challengeId);
    if (!chal) return;
    const allChecked = chal.requirementChecklist.every((_, idx) => nextComps[`${challengeId}-${idx}`] === true);

    if (allChecked && isChecked) {
      // Completed day!
      const updated = challenges.map((c) => {
        if (c.id === challengeId) {
          const nextDay = Math.min(c.daysDuration, c.currentDay + 1);
          return { ...c, currentDay: nextDay, streak: c.streak + 1 };
        }
        return c;
      });
      saveChallenges(updated);
      addXp(chal.xpPerDayCompleted, `Completed challenge check-in for: ${chal.name}`);
      addToast(`Superb! Day check-in locked for ${chal.name}. Earned +${chal.xpPerDayCompleted} XP!`, 'success');

      // Clear checklist
      const cleared = { ...checklistCompletions };
      chal.requirementChecklist.forEach((_, idx) => {
        delete cleared[`${challengeId}-${idx}`];
      });
      setChecklistCompletions(cleared);
    }
  };

  // Boss Combat interactions
  const triggerAttackOnBoss = (damageType: 'study' | 'gym' | 'clinical' | 'water') => {
    let rawDamage = 50;
    let desc = 'Thrust Study Blade';

    if (damageType === 'study') {
      rawDamage = 130;
      desc = '🧠 NEET Syllabus active recall barrage';
    } else if (damageType === 'gym') {
      rawDamage = 110;
      desc = '🏋️ Heavy Lift Hypertrophy Smash';
    } else if (damageType === 'clinical') {
      rawDamage = 90;
      desc = '🏥 Clinical diagnostic stethoscope slice';
    } else if (damageType === 'water') {
      rawDamage = 60;
      desc = '💧 Pure Hydration recovery shield replenishment';
    }

    let nextShield = boss.shieldValue;
    let nextHp = boss.currentHp;

    if (nextShield > 0) {
      const remainingShield = Math.max(0, nextShield - rawDamage);
      const leftovers = Math.max(0, rawDamage - nextShield);
      nextShield = remainingShield;
      nextHp = Math.max(0, nextHp - leftovers);
    } else {
      nextHp = Math.max(0, nextHp - rawDamage);
    }

    const nextBoss = { ...boss, currentHp: nextHp, shieldValue: nextShield };

    if (nextHp <= 0) {
      addToast(`👑 DEFIEATED ${boss.name}! Massive loot +${boss.bossLootXp} XP granted.`, 'success');
      addXp(boss.bossLootXp, `Slain Boss: ${boss.name}`);
      
      // Respawn next level boss
      const respawned: BossState = {
        name: boss.level % 2 === 0 ? '🌋 The NEET Mechanics Physics Colossus' : '⚔️ The Organic Chemistry Molecular Titan',
        maxHp: boss.maxHp + 250,
        currentHp: boss.maxHp + 250,
        level: boss.level + 1,
        subTitle: `Tier-${boss.level + 1} Spaced Recall discipline boss`,
        bossLootXp: boss.bossLootXp + 400,
        shieldValue: 150 + (boss.level * 30)
      };
      saveBossAndPlayer(respawned, 100);
    } else {
      saveBossAndPlayer(nextBoss, playerHp);
      addToast(`Executed ${desc}! Damage logged: ${rawDamage} points.`, 'success');
    }
  };

  const receiveBossCounterStrike = () => {
    const rawDamage = 15;
    const nextPlayerHp = Math.max(0, playerHp - rawDamage);
    if (nextPlayerHp <= 0) {
      addToast('⚠️ DEFEAT! Boss countered Roy No Rules discipline. Sleep is critical.', 'error');
      saveBossAndPlayer(boss, 100); // Reset player HP
    } else {
      saveBossAndPlayer(boss, nextPlayerHp);
      addToast(`The Boss strikes back with laziness spikes! Health down by ${rawDamage}%.`, 'error');
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

      {/* 💥 1. BOSS BATTLE ARENA MODE */}
      <div className="bg-zinc-900/35 border border-zinc-850 rounded-3xl p-6 text-left space-y-4">
        <div className="flex items-center justify-between border-b border-zinc-850 pb-3">
          <div className="flex items-center gap-2">
            <Sword className="w-5 h-5 text-rose-500 animate-bounce" />
            <h2 className="text-sm font-bold uppercase text-white tracking-widest font-mono">Discipline Boss Arena</h2>
          </div>
          <span className="text-xs font-bold font-mono text-rose-500">Tier {boss.level} Boss</span>
        </div>

        {/* BOSS HEALTH CARD */}
        <div className="bg-zinc-950 p-4 rounded-2xl border border-zinc-900 relative overflow-hidden space-y-3.5">
          <div>
            <span className="text-[9px] uppercase tracking-wider text-rose-400 bg-rose-500/15 p-1 rounded font-mono font-bold">
              {boss.subTitle}
            </span>
            <h3 className="text-base font-black text-white mt-1.5 flex items-center gap-2">
              <Skull className="w-4 h-4 text-red-500 animate-pulse" />
              {boss.name}
            </h3>
          </div>

          {/* Boss HP Bar */}
          <div className="space-y-1">
            <div className="flex justify-between items-center text-[10px] font-mono text-zinc-500 font-bold">
              <span>HP SHIELD: {boss.shieldValue}</span>
              <span className="text-red-400 font-black">HP: {boss.currentHp}/{boss.maxHp}</span>
            </div>
            
            <div className="relative w-full h-3.5 bg-zinc-905 rounded-md overflow-hidden border border-zinc-850/60">
              {/* Shield Fill layer */}
              {boss.shieldValue > 0 && (
                <div 
                  className="absolute top-0 left-0 h-full bg-blue-500/80 transition-all duration-300 z-10"
                  style={{ width: `${Math.round((boss.shieldValue / 250) * 100)}%` }}
                />
              )}
              {/* HP Fill layer */}
              <div 
                className="absolute top-0 left-0 h-full bg-gradient-to-r from-red-600 to-rose-500 transition-all duration-300"
                style={{ width: `${Math.round((boss.currentHp / boss.maxHp) * 100)}%` }}
              />
            </div>
          </div>

          {/* Player HP */}
          <div className="flex justify-between items-center bg-zinc-900 p-2 rounded-xl border border-zinc-800">
            <span className="text-[10px] uppercase font-mono text-zinc-400 font-bold flex items-center gap-1">
              <Heart className="w-3.5 h-3.5 text-emerald-500 fill-emerald-500" />
              Roy HP Status:
            </span>
            <span className="text-xs font-mono font-black text-emerald-450">{playerHp}%</span>
          </div>
        </div>

        {/* COMBAT TRIGGERS INLINE COMPLIANT */}
        <p className="text-[10.5px] text-zinc-500 leading-snug">
          Complete actual logs inside other tabs to justify damage output. Click these combat tactics to update boss indicators manually:
        </p>

        <div className="grid grid-cols-2 gap-2 text-xs font-mono font-bold">
          <button
            onClick={() => triggerAttackOnBoss('study')}
            className="p-2.5 bg-zinc-950 hover:bg-zinc-900 border border-zinc-850 hover:border-amber-500 rounded-xl cursor-pointer text-white flex items-center gap-1.5 transition-colors"
          >
            🧠 Pyro NEET Quiz Strike (-130)
          </button>
          <button
            onClick={() => triggerAttackOnBoss('gym')}
            className="p-2.5 bg-zinc-950 hover:bg-zinc-900 border border-zinc-850 hover:border-red-500 rounded-xl cursor-pointer text-white flex items-center gap-1.5 transition-colors"
          >
            🏋️ Heavy Lifting Slam (-110)
          </button>
          <button
            onClick={() => triggerAttackOnBoss('clinical')}
            className="p-2.5 bg-zinc-950 hover:bg-zinc-900 border border-zinc-850 hover:border-teal-500 rounded-xl cursor-pointer text-white flex items-center gap-1.5 transition-colors"
          >
            🏥 Clinic Doctor Strike (-90)
          </button>
          <button
            onClick={() => triggerAttackOnBoss('water')}
            className="p-2.5 bg-zinc-950 hover:bg-zinc-900 border border-zinc-850 hover:border-blue-500 rounded-xl cursor-pointer text-white flex items-center gap-1.5 transition-colors"
          >
            🛡 Pure Hydration Block (-60)
          </button>
        </div>

        <button
          onClick={receiveBossCounterStrike}
          className="w-full bg-red-950/25 border border-red-900 hover:bg-red-950/40 py-2.5 rounded-xl cursor-pointer font-mono font-bold text-xs text-red-400 uppercase tracking-widest flex items-center justify-center gap-2"
        >
          <Zap className="w-3.5 h-3.5 animate-pulse" /> Trigger Procrastination Strike Back (Inflict Damage)
        </button>
      </div>

      {/* 🚀 2. CHALLENGE MODE TRACKS */}
      <div className="bg-zinc-900/35 border border-zinc-850 rounded-3xl p-6 text-left space-y-4">
        <div className="flex items-center justify-between border-b border-zinc-850 pb-3">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-500" />
            <h2 className="text-sm font-bold uppercase text-white tracking-widest font-mono">Discipline Challenge logs</h2>
          </div>
          <span className="text-xs font-bold font-mono text-amber-500">XP SPRINT ACTIVE</span>
        </div>

        <div className="space-y-4">
          {challenges.map((c) => (
            <div key={c.id} className="bg-zinc-950 p-4 rounded-xl border border-zinc-900 space-y-3.5">
              <div className="flex justify-between items-start gap-4">
                <div>
                  <h3 className="text-sm font-black text-white">{c.name}</h3>
                  <span className="text-[9px] text-zinc-500 font-mono">Streak: {c.streak} days • Goal: {c.daysDuration} days</span>
                </div>
                <span className="text-[10px] font-mono font-bold bg-amber-500/15 text-amber-400 px-2 py-0.5 rounded border border-amber-500/10">
                  +{c.xpPerDayCompleted} XP/Day
                </span>
              </div>

              {/* Day Progress visual indicator */}
              <div className="w-full bg-zinc-900 h-1.5 rounded-full overflow-hidden border border-zinc-850">
                <div 
                  className="h-full bg-amber-500 transition-all duration-300"
                  style={{ width: `${Math.round((c.currentDay / c.daysDuration) * 100)}%` }}
                />
              </div>

              {/* Requirement Checkbox Block */}
              <div className="p-3 bg-zinc-900/60 rounded-xl border border-zinc-850/40 space-y-2">
                <span className="text-[9px] font-extrabold text-zinc-500 uppercase tracking-widest block font-mono">Daily Check-In requirements:</span>
                
                <div className="space-y-1.5">
                  {c.requirementChecklist.map((req, idx) => {
                    const chKey = `${c.id}-${idx}`;
                    const isChecked = !!checklistCompletions[chKey];

                    return (
                      <label key={idx} className="flex items-start gap-2.5 text-xs text-zinc-300 select-none cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => handleCompleteCheckItem(c.id, idx, e.target.checked)}
                          className="w-3.5 h-3.5 accent-amber-500 rounded bg-zinc-950 border border-zinc-800 shrink-0 mt-0.5"
                        />
                        <span className={isChecked ? 'line-through text-zinc-500 text-left' : 'text-left'}>{req}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
