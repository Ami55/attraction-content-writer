import React from 'react';
import { 
  X, 
  Search, 
  Sparkles, 
  ShieldCheck, 
  MessageSquare, 
  FileSpreadsheet, 
  CheckCircle2, 
  HelpCircle,
  Users,
  Compass
} from 'lucide-react';

interface HowItWorksModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HowItWorksModal: React.FC<HowItWorksModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div 
      id="how-it-works-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-100 text-indigo-700 rounded-lg">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-serif font-bold text-slate-900">How It Works</h2>
              <p className="text-xs text-slate-500">Attraction Content Studio Attraction Marketing &amp; Copy Engine</p>
            </div>
          </div>
          <button
            id="close-how-it-works-btn"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Step-by-Step Flow */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4">
              4-Step Production Pipeline
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
                <div className="flex items-center gap-2 text-indigo-900 font-semibold text-sm">
                  <div className="w-6 h-6 rounded-full bg-indigo-200 text-indigo-900 flex items-center justify-center text-xs font-bold">1</div>
                  <span>Input &amp; Custom Directives</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Add attractions manually or upload CSV/Excel files. You can enter specific notes or key angles (such as architects, founding eras, or highlights to emphasize).
                </p>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
                <div className="flex items-center gap-2 text-indigo-900 font-semibold text-sm">
                  <div className="w-6 h-6 rounded-full bg-indigo-200 text-indigo-900 flex items-center justify-center text-xs font-bold">2</div>
                  <span>Deep Fact Research</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  The engine identifies verified historical figures (like Antoni Gaudí), standout internal rooms, artistic features, and authentic guide angles.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
                <div className="flex items-center gap-2 text-indigo-900 font-semibold text-sm">
                  <div className="w-6 h-6 rounded-full bg-indigo-200 text-indigo-900 flex items-center justify-center text-xs font-bold">3</div>
                  <span>Brand Formula Generation</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Drafts follow strict brand rules: required heading structure, 180–260 word limit, <code>&lt;br&gt;&lt;br&gt;</code> HTML breaks, zero clichés, and guide value closure.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
                <div className="flex items-center gap-2 text-indigo-900 font-semibold text-sm">
                  <div className="w-6 h-6 rounded-full bg-indigo-200 text-indigo-900 flex items-center justify-center text-xs font-bold">4</div>
                  <span>Live Auditor &amp; AI Refinement</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Click any attraction to inspect real-time brand rule compliance, edit text directly, or chat with the AI assistant to refine specific details.
                </p>
              </div>
            </div>
          </div>

          {/* Key Guidelines Checked */}
          <div className="border-t border-slate-100 pt-5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
              Automated Brand Compliance Audits
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Exact Heading: <code>See the best of [Name] with a private guide</code></span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Strict Word Count (180–260 words)</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Zero Banned Clichés (no "hidden gem", "magical", etc.)</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Explicit Named Architects &amp; Specific Areas</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Mandatory closing private guide value proposition</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Standardized HTML <code>&lt;br&gt;&lt;br&gt;</code> paragraph breaks</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-100 bg-slate-50/50 flex justify-end">
          <button
            id="got-it-how-it-works-btn"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            Got it, thanks!
          </button>
        </div>
      </div>
    </div>
  );
};
