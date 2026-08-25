import React, { useState, useRef, useEffect } from 'react';
import { Palette, Check } from 'lucide-react';
import { ThemeId, THEME_OPTIONS } from '../types/theme';

interface ThemeSelectorProps {
  currentTheme: ThemeId;
  onSelectTheme: (themeId: ThemeId) => void;
  variant?: 'compact' | 'full';
}

export const ThemeSelector: React.FC<ThemeSelectorProps> = ({
  currentTheme,
  onSelectTheme,
  variant = 'compact',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedTheme = THEME_OPTIONS.find((t) => t.id === currentTheme) || THEME_OPTIONS[0];

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (variant === 'full') {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {THEME_OPTIONS.map((theme) => {
          const isSelected = theme.id === currentTheme;
          return (
            <button
              key={theme.id}
              type="button"
              id={`theme-select-card-${theme.id}`}
              onClick={() => onSelectTheme(theme.id)}
              className={`p-4 rounded-xl text-left border transition-all cursor-pointer relative flex flex-col justify-between ${
                isSelected
                  ? 'border-indigo-600 bg-indigo-50/50 ring-2 ring-indigo-500/20 shadow-xs'
                  : 'border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50/60'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-xs text-slate-900">
                      {theme.name}
                    </span>
                    {isSelected && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-600 text-white">
                        Active
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                    {theme.description}
                  </p>
                </div>
              </div>

              {/* Palette dots preview */}
              <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-slate-100">
                <span
                  className="w-4 h-4 rounded-full border border-black/10 shadow-2xs"
                  style={{ backgroundColor: theme.preview.primary }}
                  title="Primary Brand"
                />
                <span
                  className="w-4 h-4 rounded-full border border-black/10 shadow-2xs"
                  style={{ backgroundColor: theme.preview.accent }}
                  title="Accent Highlight"
                />
                <span
                  className="w-4 h-4 rounded-full border border-black/10 shadow-2xs"
                  style={{ backgroundColor: theme.preview.bg }}
                  title="Canvas Background"
                />
                <span className="text-[10px] text-slate-400 font-mono ml-auto">
                  {theme.id}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      <button
        type="button"
        id="theme-dropdown-btn"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100/90 hover:bg-slate-200/80 border border-slate-200/80 rounded-xl transition cursor-pointer shadow-2xs"
        title="Change UI Colors & Theme"
      >
        <Palette className="w-3.5 h-3.5 text-indigo-600" />
        <div className="flex items-center gap-1">
          <span
            className="w-2.5 h-2.5 rounded-full border border-black/15 inline-block"
            style={{ backgroundColor: selectedTheme.preview.primary }}
          />
          <span className="hidden sm:inline">{selectedTheme.name.split(' (')[0]}</span>
        </div>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
          <div className="px-3 py-2 border-b border-slate-100">
            <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
              Select UI Color Palette
            </div>
            <div className="text-[10px] text-slate-500">
              Customize the look and feeling of the workspace
            </div>
          </div>

          <div className="p-1.5 space-y-1 max-h-80 overflow-y-auto">
            {THEME_OPTIONS.map((theme) => {
              const isSelected = theme.id === currentTheme;
              return (
                <button
                  key={theme.id}
                  type="button"
                  onClick={() => {
                    onSelectTheme(theme.id);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between p-2 rounded-xl text-left transition cursor-pointer ${
                    isSelected ? 'bg-indigo-50/80 text-indigo-950 font-semibold' : 'hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className="flex -space-x-1">
                      <span
                        className="w-3.5 h-3.5 rounded-full border border-white shadow-2xs"
                        style={{ backgroundColor: theme.preview.primary }}
                      />
                      <span
                        className="w-3.5 h-3.5 rounded-full border border-white shadow-2xs"
                        style={{ backgroundColor: theme.preview.accent }}
                      />
                    </div>
                    <div>
                      <div className="text-xs font-medium">{theme.name}</div>
                    </div>
                  </div>

                  {isSelected && <Check className="w-4 h-4 text-indigo-600" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
