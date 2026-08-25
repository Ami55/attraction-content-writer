import React from 'react';
import { 
  Compass, 
  Layers, 
  FileText, 
  CheckCircle2, 
  Download, 
  Settings, 
  RefreshCw,
  HelpCircle
} from 'lucide-react';
import { ThemeId } from '../types/theme';

export type NavTab = 'attractions' | 'generated' | 'approved' | 'export' | 'settings';

interface NavbarProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  attractionsCount: number;
  completedCount: number;
  approvedCount: number;
  isGenerating: boolean;
  hasCustomInstructions: boolean;
  onOpenHowItWorks: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onSelectTab,
  attractionsCount,
  completedCount,
  approvedCount,
  isGenerating,
  hasCustomInstructions,
  onOpenHowItWorks,
}) => {
  const navItems = [
    {
      id: 'attractions' as NavTab,
      label: 'Attractions Queue',
      icon: Layers,
      badge: attractionsCount > 0 ? attractionsCount : undefined,
    },
    {
      id: 'generated' as NavTab,
      label: 'Generated Content',
      icon: FileText,
      badge: completedCount > 0 ? completedCount : undefined,
    },
    {
      id: 'approved' as NavTab,
      label: 'Approved',
      icon: CheckCircle2,
      badge: approvedCount > 0 ? approvedCount : undefined,
      badgeColor: 'bg-emerald-600 text-white',
    },
    {
      id: 'export' as NavTab,
      label: 'Export Hub',
      icon: Download,
    },
    {
      id: 'settings' as NavTab,
      label: 'Settings',
      icon: Settings,
      dot: hasCustomInstructions,
    },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-2xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-3">
          {/* Logo / Title */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-xs">
              <Compass className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-serif font-bold text-slate-900 leading-tight">
                  Attraction Content Writer
                </h1>
                <span className="text-[10px] font-mono font-semibold bg-indigo-50 text-indigo-800 border border-indigo-200/60 px-2 py-0.5 rounded-full">
                  ToursByLocals
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium">
                Research &amp; Verified Marketing Copy Engine
              </p>
            </div>
          </div>

          {/* Tab Navigation */}
          <nav className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  id={`nav-tab-${item.id}`}
                  type="button"
                  onClick={() => onSelectTab(item.id)}
                  className={`relative flex items-center gap-2 px-3.5 py-2 text-xs font-medium rounded-xl transition cursor-pointer ${
                    isActive
                      ? 'text-indigo-950 bg-indigo-50/80 shadow-2xs font-semibold border border-indigo-200/60'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
                  <span>{item.label}</span>

                  {item.badge !== undefined && (
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                        item.badgeColor || 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}

                  {item.dot && (
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right Header Actions: How it works & Generation Indicator */}
          <div className="flex items-center gap-2.5">
            {isGenerating && (
              <div className="flex items-center gap-1.5 text-xs font-medium text-amber-800 bg-amber-50 border border-amber-200/80 px-3 py-1.5 rounded-xl animate-pulse">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-600" />
                <span className="hidden sm:inline">Processing batch...</span>
              </div>
            )}

            {/* How It Works Button */}
            <button
              id="how-it-works-btn"
              type="button"
              onClick={onOpenHowItWorks}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-indigo-900 bg-slate-100/80 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 rounded-xl transition-colors cursor-pointer shadow-2xs"
            >
              <HelpCircle className="w-4 h-4 text-indigo-600" />
              <span>How It Works</span>
            </button>
          </div>
        </div>

        {/* Mobile Tab bar */}
        <div className="flex md:hidden overflow-x-auto space-x-1 py-2 border-t border-slate-100">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectTab(item.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium whitespace-nowrap rounded-lg cursor-pointer ${
                  isActive ? 'bg-indigo-900 text-white font-semibold' : 'text-slate-600'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
                {item.badge !== undefined && (
                  <span className="text-[10px] bg-white/20 text-white px-1.5 rounded-full">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
