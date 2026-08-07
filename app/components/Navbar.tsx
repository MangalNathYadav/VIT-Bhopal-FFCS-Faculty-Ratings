import React from 'react';
import { Search, Sparkles, Calendar, BookmarkCheck } from 'lucide-react';

export type TabType = 'ratings' | 'ai-generator' | 'manual-builder' | 'saved';

interface NavbarProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  savedCount: number;
}

export default function Navbar({ activeTab, setActiveTab, savedCount }: NavbarProps) {
  const tabs = [
    { id: 'ratings' as TabType, label: 'Faculty Ratings', icon: Search },
    { id: 'ai-generator' as TabType, label: 'AI Schedule Maker', icon: Sparkles, badge: 'Gemini AI' },
    { id: 'manual-builder' as TabType, label: 'Manual Builder', icon: Calendar },
    { id: 'saved' as TabType, label: 'Saved Schedules', icon: BookmarkCheck, count: savedCount },
  ];

  return (
    <nav className="glass-card-light rounded-2xl p-1.5 sm:p-2 mb-8 max-w-4xl mx-auto flex overflow-x-auto sm:justify-between items-center gap-1.5 sm:gap-2 border border-slate-200 shadow-sm no-scrollbar">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;

        return (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all duration-300 shrink-0 whitespace-nowrap ${
              isActive
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/30 scale-[1.02]'
                : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <Icon className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isActive ? 'text-white' : 'text-slate-500'}`} />
            <span>{tab.label}</span>
            {tab.badge && (
              <span className="text-[9px] sm:text-[10px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded-md font-extrabold uppercase tracking-wide">
                {tab.badge}
              </span>
            )}
            {tab.count !== undefined && tab.count > 0 && (
              <span className="text-[10px] sm:text-xs bg-indigo-100 text-indigo-700 px-1.5 sm:px-2 py-0.5 rounded-full font-bold">
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </nav>
  );
}
