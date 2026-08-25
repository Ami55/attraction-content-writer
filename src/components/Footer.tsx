import React from 'react';
import { Compass, Sparkles, ShieldCheck, Heart } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer id="app-footer" className="mt-auto border-t border-slate-200/80 bg-white/80 backdrop-blur-xs py-8 text-slate-600">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Brand & Purpose */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center shadow-xs shrink-0">
              <Compass className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-serif font-bold text-slate-900">
                  Attraction Content Studio
                </span>
                <span className="text-[10px] font-mono font-semibold bg-indigo-50 text-indigo-800 border border-indigo-200/60 px-1.5 py-0.2 rounded-md">
                  ToursByLocals Edition
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                Automated SEO Travel Copywriting &amp; Brand Compliance Engine
              </p>
            </div>
          </div>

          {/* Quick Badges / Feature Tags */}
          <div className="flex flex-wrap items-center justify-center gap-2 text-[11px] text-slate-500">
            <span className="inline-flex items-center gap-1 bg-slate-100/80 px-2.5 py-1 rounded-full border border-slate-200/60">
              <Sparkles className="w-3 h-3 text-indigo-600" />
              <span>SEO Optimized</span>
            </span>
            <span className="inline-flex items-center gap-1 bg-slate-100/80 px-2.5 py-1 rounded-full border border-slate-200/60">
              <ShieldCheck className="w-3 h-3 text-emerald-600" />
              <span>Brand Rule Audited</span>
            </span>
          </div>

          {/* Copyright & Creator Attribution */}
          <div className="text-center md:text-right text-xs text-slate-500 space-y-0.5">
            <p className="font-medium text-slate-700">
              &copy; 2026 ToursByLocals Attraction Studio. Developed by <span className="font-semibold text-indigo-900">Ami - SEO Girl</span>. All rights reserved.
            </p>
            <p className="text-[11px] text-slate-400">
              Crafted for private tour attraction marketing &amp; verified SEO storytelling.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};
