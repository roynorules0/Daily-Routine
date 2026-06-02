import React, { useState } from 'react';
import { DollarSign, Trash2, TrendingUp, TrendingDown, Shield, Send, PiggyBank, PlusCircle } from 'lucide-react';

interface Transaction {
  id: string;
  description: string;
  type: 'income' | 'expense';
  amount: number;
  date: string;
  category: string;
}

interface FinancialGoal {
  id: string;
  title: string;
  targetAmount: number;
  savedAmount: number;
}

interface MoneyTrackerProps {
  telegramBotToken?: string;
  telegramChannel?: string;
  addToast: (text: string, type: 'success' | 'error' | 'info') => void;
  addXp: (amount: number, reason: string) => void;
}

export default function MoneyTracker({
  telegramBotToken,
  telegramChannel,
  addToast,
  addXp
}: MoneyTrackerProps) {
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem('roy_beast_transactions');
    if (saved) return JSON.parse(saved);
    return [
      { id: '1', description: 'Clinic Duty Honorarium', type: 'income', amount: 35000, date: '2026-06-01', category: 'Stipend' },
      { id: '2', description: 'NEET Practice Books Combo', type: 'expense', amount: 2400, date: '2026-06-01', category: 'Education' },
      { id: '3', description: 'Raw Soya & Muscle Whey Supplement', type: 'expense', amount: 6200, date: '2026-06-02', category: 'Diet' }
    ];
  });

  const [goals, setGoals] = useState<FinancialGoal[]>(() => {
    const saved = localStorage.getItem('roy_beast_fin_goals');
    if (saved) return JSON.parse(saved);
    return [
      { id: 'f1', title: 'Royal Enfield Spare Performance exhaust kit', targetAmount: 18000, savedAmount: 12000 },
      { id: 'f2', title: 'NEET Premium Mock Series Tier-1', targetAmount: 8000, savedAmount: 4500 }
    ];
  });

  // Inputs
  const [descInput, setDescInput] = useState('');
  const [typeInput, setTypeInput] = useState<'income' | 'expense'>('expense');
  const [amountInput, setAmountInput] = useState<number>(0);
  const [catInput, setCatInput] = useState('General');

  // Goal Inputs
  const [goalTitleInput, setGoalTitleInput] = useState('');
  const [goalTargetInput, setGoalTargetInput] = useState<number>(0);

  const saveTransactions = (nextTr: Transaction[]) => {
    setTransactions(nextTr);
    localStorage.setItem('roy_beast_transactions', JSON.stringify(nextTr));
  };

  const saveGoals = (nextGoals: FinancialGoal[]) => {
    setGoals(nextGoals);
    localStorage.setItem('roy_beast_fin_goals', JSON.stringify(nextGoals));
  };

  const handleAddTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!descInput.trim() || amountInput <= 0) {
      addToast('Please enter an authentic transaction description and valid amount.', 'error');
      return;
    }
    const newTr: Transaction = {
      id: `tr-${Date.now()}`,
      description: descInput.trim(),
      type: typeInput,
      amount: amountInput,
      date: new Date().toISOString().split('T')[0],
      category: catInput
    };
    const updated = [...transactions, newTr];
    saveTransactions(updated);
    setDescInput('');
    setAmountInput(0);
    addToast(`Successfully logged ${typeInput} entry!`, 'success');
    addXp(40, `Logged financial transaction: ${typeInput}`);
  };

  const handleDeleteTransaction = (id: string) => {
    const filtered = transactions.filter(t => t.id !== id);
    saveTransactions(filtered);
    addToast('Transaction entry deleted.', 'info');
  };

  const handleCreateGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!goalTitleInput.trim() || goalTargetInput <= 0) return;
    const newG: FinancialGoal = {
      id: `fgoal-${Date.now()}`,
      title: goalTitleInput,
      targetAmount: goalTargetInput,
      savedAmount: 0
    };
    const nextG = [...goals, newG];
    saveGoals(nextG);
    setGoalTitleInput('');
    setGoalTargetInput(0);
    addToast('Successfully configured new Savings target goal!', 'success');
  };

  const handleUpdateSavedAmount = (id: string, amount: number) => {
    const updated = goals.map((g) => {
      if (g.id === id) {
        return { ...g, savedAmount: Math.max(0, Number(amount) || 0) };
      }
      return g;
    });
    saveGoals(updated);
  };

  const handleDeleteGoal = (id: string) => {
    saveGoals(goals.filter(g => g.id !== id));
  };

  // Math Statistics
  const totalIncome = transactions.filter(t => t.type === 'income').reduce((acc, c) => acc + c.amount, 0);
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((acc, c) => acc + c.amount, 0);
  const totalSavings = totalIncome - totalExpense;
  const savingsRate = totalIncome > 0 ? Math.round((totalSavings / totalIncome) * 100) : 0;

  // Monthly Spending
  const currentMonthStr = new Date().toISOString().split('T')[0].substring(0, 7);
  const monthlySpending = transactions
    .filter(t => t.type === 'expense' && t.date.startsWith(currentMonthStr))
    .reduce((acc, c) => acc + c.amount, 0);

  // Telegram report dispatcher
  const handleSendTelegramSummary = async () => {
    if (!telegramBotToken || !telegramChannel) {
      addToast('Please set your Bot Token & Chat details in Settings first!', 'error');
      return;
    }

    const payload = transactions.slice(-5).map(t => {
      const icon = t.type === 'income' ? '🟢' : '🔴';
      return `${icon} <b>${t.description}</b>: <code>₹${t.amount.toLocaleString()}</code> [${t.category}]`;
    }).join('\n');

    const text = `💰 <b>ROY'S COMBAT MONEY tracker REPORT</b> 💰\n\n` +
      `🟢 Total Earned: ₹${totalIncome.toLocaleString()}\n` +
      `🔴 Outflow Total: ₹${totalExpense.toLocaleString()}\n` +
      `📊 Active Reserves: ₹${totalSavings.toLocaleString()}\n` +
      `🎯 Savings Safety Ratio: <code>${savingsRate}%</code>\n` +
      `📦 This Month's Expenses: <b>₹${monthlySpending.toLocaleString()}</b>\n\n` +
      `📝 <b>LAST 5 TRANSACTIONS:</b>\n${payload || 'No entries cataloged.'}\n\n` +
      `⚡ <i>Financial autonomy means zero leverage. Grind hard, spend only on biomechanics & NEET preparation!</i>`;

    const targetChannel = telegramChannel.startsWith('@') ? telegramChannel : `@${telegramChannel}`;
    const url = `https://api.telegram.org/bot${telegramBotToken}/sendMessage`;

    try {
      await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: targetChannel, text, parse_mode: 'HTML' })
      });
      addToast('Dispatched Financial statements to Telegram channel!', 'success');
    } catch {
      addToast('Telegram financial broadcast failed.', 'error');
    }
  };

  return (
    <div className="bg-zinc-900/35 border border-zinc-850 rounded-3xl p-6 text-left space-y-5">
      <div className="flex items-center justify-between border-b border-zinc-850 pb-3">
        <div className="flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-emerald-450" />
          <h2 className="text-sm font-bold uppercase text-white tracking-widest font-mono">Military Capital Money Ledger</h2>
        </div>
        <button
          onClick={handleSendTelegramSummary}
          className="px-3 py-1.5 bg-zinc-950 hover:bg-zinc-900 text-zinc-300 font-mono text-[10px] rounded-lg border border-zinc-850 cursor-pointer flex items-center gap-1.5 transition-all"
        >
          <Send className="w-3.5 h-3.5" /> Telegram Broadcast
        </button>
      </div>

      {/* Grid of basic stats card */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-900 text-left">
          <span className="text-[9px] font-semibold text-zinc-500 uppercase tracking-wider block font-mono">Total Capital In</span>
          <p className="text-lg font-mono font-bold text-emerald-450 mt-1">₹{totalIncome.toLocaleString()}</p>
        </div>
        <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-900 text-left">
          <span className="text-[9px] font-semibold text-zinc-500 uppercase tracking-wider block font-mono">Capital Deficit Out</span>
          <p className="text-lg font-mono font-bold text-red-400 mt-1">₹{totalExpense.toLocaleString()}</p>
        </div>
        <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-900 text-left">
          <span className="text-[9px] font-semibold text-zinc-500 uppercase tracking-wider block font-mono">Net Fluid Surplus</span>
          <p className="text-lg font-mono font-bold text-blue-400 mt-1">₹{totalSavings.toLocaleString()}</p>
        </div>
        <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-900 text-left">
          <span className="text-[9px] font-semibold text-zinc-500 uppercase tracking-wider block font-mono">Savings Ratio</span>
          <p className="text-lg font-mono font-bold text-amber-500 mt-1">{savingsRate}%</p>
        </div>
      </div>

      {/* Core split section: Add transaction vs Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* 1. Transaction form left */}
        <div className="space-y-4 col-span-1">
          <form onSubmit={handleAddTransaction} className="bg-zinc-950 p-4 rounded-2xl border border-zinc-900 space-y-3.5">
            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest font-mono">Record Ledger Outflow/Inflow</h3>
            
            <div className="space-y-1">
              <span className="text-[9px] font-bold text-zinc-500 uppercase font-mono">Description</span>
              <input
                type="text"
                required
                placeholder="e.g. Soya chunks / clinic bonus"
                value={descInput}
                onChange={(e) => setDescInput(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-850 rounded-lg p-2 text-xs text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <span className="text-[9px] font-bold text-zinc-500 uppercase font-mono">Category</span>
                <select
                  value={catInput}
                  onChange={(e) => setCatInput(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-850 rounded-lg p-2 text-xs text-white"
                >
                  <option value="Diet">🥤 Diet & Supps</option>
                  <option value="Education">📚 NEET Prep</option>
                  <option value="Clinic">🏥 Clinic / Stipend</option>
                  <option value="RE Hunter 350">🏍 Royal Enfield</option>
                  <option value="Custom">📦 General</option>
                </select>
              </div>

              <div className="space-y-1">
                <span className="text-[9px] font-bold text-zinc-500 uppercase font-mono">Flow Style</span>
                <select
                  value={typeInput}
                  onChange={(e: any) => setTypeInput(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-850 rounded-lg p-2 text-xs text-white"
                >
                  <option value="expense">🔴 Expense Out</option>
                  <option value="income">🟢 Income In</option>
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-[9px] font-bold text-zinc-500 uppercase font-mono">Amount (INR)</span>
              <input
                type="number"
                required
                placeholder="₹ Amount"
                value={amountInput || ''}
                onChange={(e) => setAmountInput(Math.max(0, Number(e.target.value) || 0))}
                className="w-full bg-zinc-900 border border-zinc-850 rounded-lg p-2 text-xs text-white"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-zinc-900 hover:bg-zinc-850 text-white font-mono font-bold text-xs py-2.5 rounded-xl border border-zinc-805 cursor-pointer flex items-center justify-center gap-1.5 transition-all uppercase"
            >
              <PlusCircle className="w-4 h-4 text-emerald-400" />
              Commit Transaction to Vault
            </button>
          </form>
        </div>

        {/* 2. Lists & Visual Charts middle/right */}
        <div className="col-span-1 lg:col-span-2 space-y-4">
          <div className="bg-zinc-950 p-4 rounded-2xl border border-zinc-900">
            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest font-mono mb-3">Ledger Transaction Stream</h3>
            
            <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
              {transactions.length === 0 ? (
                <p className="text-xs text-zinc-600 font-mono italic">Ledger empty. No records generated.</p>
              ) : (
                transactions.slice().reverse().map((t) => (
                  <div key={t.id} className="flex items-center justify-between p-2 bg-zinc-900/40 rounded-xl border border-zinc-850/30 text-xs font-mono">
                    <div className="flex items-center gap-2">
                      <span className={`w-1.5 h-1.5 rounded-full ${t.type === 'income' ? 'bg-emerald-500' : 'bg-red-500'}`} />
                      <div className="text-left">
                        <p className="font-bold text-white text-[11px] font-sans">{t.description}</p>
                        <span className="text-[8.5px] text-zinc-500 block">📅 {t.date} • {t.category}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`font-bold ${t.type === 'income' ? 'text-emerald-450' : 'text-red-400'}`}>
                        {t.type === 'income' ? '+' : '-'}₹{t.amount.toLocaleString()}
                      </span>
                      <button
                        onClick={() => handleDeleteTransaction(t.id)}
                        className="text-zinc-500 hover:text-red-500 cursor-pointer"
                        title="Delete ledger entry"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Savings Goals Block */}
          <div className="bg-zinc-950 p-4 rounded-2xl border border-zinc-900 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest font-mono">Savings Goals Index</h3>
              <span className="text-[9px] font-mono text-zinc-500 uppercase font-bold">Goal-based reserves</span>
            </div>

            <div className="space-y-3">
              {goals.map((g) => {
                const ratio = Math.max(0, Math.min(100, Math.round((g.savedAmount / g.targetAmount) * 100)));
                return (
                  <div key={g.id} className="p-3 bg-zinc-900/60 rounded-xl border border-zinc-850/40 text-xs text-left space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-white font-sans">{g.title}</span>
                      <button onClick={() => handleDeleteGoal(g.id)} className="text-zinc-500 hover:text-red-400">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="w-full bg-zinc-950 h-1.5 rounded-full overflow-hidden border border-zinc-900">
                      <div className="h-full bg-gradient-to-r from-blue-500 to-indigo-500" style={{ width: `${ratio}%` }} />
                    </div>

                    <div className="flex justify-between items-center text-[10px] font-mono text-zinc-500">
                      <span>Saved: ₹{g.savedAmount.toLocaleString()} / ₹{g.targetAmount.toLocaleString()}</span>
                      <span className="font-bold text-indigo-400">{ratio}%</span>
                    </div>

                    {/* Adjust state slider directly */}
                    <div className="flex items-center gap-2 pt-1">
                      <span className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest">Adjust Allocation:</span>
                      <input
                        type="range"
                        min="0"
                        max={g.targetAmount}
                        step="100"
                        value={g.savedAmount}
                        onChange={(e) => handleUpdateSavedAmount(g.id, Number(e.target.value))}
                        className="flex-1 accent-indigo-500 bg-zinc-950 rounded"
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Quick Create Goal Form */}
            <form onSubmit={handleCreateGoal} className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 text-xs border-t border-zinc-900">
              <input
                type="text"
                required
                placeholder="e.g. New iPad for Notes"
                value={goalTitleInput}
                onChange={(e) => setGoalTitleInput(e.target.value)}
                className="bg-zinc-900 border border-zinc-850 rounded p-1.5 text-[11px] text-white"
              />
              <input
                type="number"
                required
                placeholder="₹ Target amount"
                value={goalTargetInput || ''}
                onChange={(e) => setGoalTargetInput(Math.max(0, Number(e.target.value) || 0))}
                className="bg-zinc-900 border border-zinc-850 rounded p-1.5 text-[11px] text-white"
              />
              <button
                type="submit"
                className="w-full bg-zinc-900 hover:bg-zinc-850 text-white font-bold font-mono py-1 rounded cursor-pointer uppercase text-[9px] border border-zinc-800"
              >
                Create Target
              </button>
            </form>
          </div>

        </div>

      </div>

    </div>
  );
}
