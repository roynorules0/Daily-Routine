import React from 'react';
import { LayoutDashboard, Dumbbell, BookOpen, Flame, Compass } from 'lucide-react';

interface BottomNavProps {
  activeTab: 'dashboard' | 'gym' | 'neet' | 'beast';
  setActiveTab: (tab: 'dashboard' | 'gym' | 'neet' | 'beast') => void;
}

export default function BottomNav({ activeTab, setActiveTab }: BottomNavProps) {
  const tabs = [
    { id: 'dashboard', label: 'Command Center', icon: Compass },
    { id: 'gym', label: 'Gym Pro', icon: Dumbbell },
    { id: 'neet', label: 'NEET Prep', icon: BookOpen },
    { id: 'beast', label: 'Beast Suite', icon: Flame }
  ] as const;

  return (
    <div className="fixed bottom-3 left-1/2 -translate-x-1/2 w-[92%] max-w-lg z-45 animate-fade-in pointer-events-none">
      <nav className="pointer-events-auto bg-black/75 backdrop-blur-2xl border border-zinc-550/15 p-2 rounded-[24px] shadow-[0_12px_45px_rgba(0,0,0,0.8)] pb-safe">
        <div className="flex items-center justify-around h-13 relative">
          
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                id={`nav-tab-${tab.id}`}
                onClick={() => setActiveTab(tab.id)}
                className="flex flex-col items-center justify-center flex-1 py-1 transition-all duration-300 relative select-none cursor-pointer group"
              >
                {/* Active back glow behind individual icon */}
                <div 
                  className={`p-1.5 rounded-xl transition-all duration-300 flex items-center justify-center relative ${
                    isActive 
                      ? 'bg-[var(--theme-primary-alpha,rgba(99,102,241,0.15))] text-[var(--theme-primary,#6366f1)] scale-110' 
                      : 'bg-transparent text-zinc-500 group-hover:text-zinc-300 group-hover:scale-105'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                
                <span className={`text-[8px] sm:text-[9.5px] mt-1 tracking-widest uppercase font-black font-mono transition-colors ${
                  isActive ? 'text-white' : 'text-zinc-500'
                }`}>
                  {tab.label}
                </span>

                {isActive && (
                  <div className="absolute -bottom-1.5 w-6 h-1 bg-[var(--theme-primary,#6366f1)] rounded-full animate-pulse shadow-[0_0_8px_var(--theme-primary)]" />
                )}
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
