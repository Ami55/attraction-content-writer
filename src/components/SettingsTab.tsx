import React from 'react';
import { ProjectSettings } from '../types/attraction';
import { BANNED_PHRASES } from '../constants/rules';
import { 
  Settings, 
  Sparkles, 
  ShieldAlert, 
  BookOpen, 
  CheckCircle2, 
  AlertCircle,
  HelpCircle,
  FileCheck,
  ShieldCheck
} from 'lucide-react';

interface SettingsTabProps {
  settings: ProjectSettings;
  onUpdateSettings: (settings: ProjectSettings) => void;
}

export const SettingsTab: React.FC<SettingsTabProps> = ({
  settings,
  onUpdateSettings,
}) => {
  const handleInstructionChange = (text: string) => {
    onUpdateSettings({
      ...settings,
      additional_instructions: text,
    });
  };

  const samplePresets = [
    { label: 'Accessibility', text: 'Mention accessibility details and wheelchair navigation inside the attraction.' },
    { label: 'Historical Focus', text: 'Focus heavily on historical background, founding figures, and past architectural eras.' },
    { label: 'No Ticket Prices', text: 'Avoid mentioning admission ticket prices, queue times, or opening hours.' },
    { label: 'Canadian Spelling', text: 'Use Canadian/Commonwealth spelling (e.g. colour, flavour, centre, traveller).' },
    { label: 'Family Angle', text: 'Highlight sensory exhibits and visual features suitable for travellers of all ages.' },
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      {/* Writing Instructions Section */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-amber-100 text-amber-800 rounded-xl">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-serif font-bold text-slate-900">
              Project Writing Instructions
            </h2>
            <p className="text-xs text-slate-500">
              Applied automatically across all research and copywriting requests in this project.
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <textarea
            id="settings-additional-instructions-textarea"
            rows={4}
            value={settings.additional_instructions}
            onChange={(e) => handleInstructionChange(e.target.value)}
            placeholder="e.g. Mention accessibility. Focus more on history. Avoid mentioning ticket prices. Use Canadian spelling."
            className="w-full text-sm rounded-xl border border-slate-300 p-4 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20 outline-hidden bg-slate-50/50 resize-none font-sans"
          />

          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="text-xs font-semibold text-slate-600">Click to append preset:</span>
            {samplePresets.map((p) => (
              <button
                key={p.label}
                type="button"
                onClick={() => {
                  const curr = settings.additional_instructions.trim();
                  if (!curr) handleInstructionChange(p.text);
                  else if (!curr.includes(p.text)) handleInstructionChange(`${curr}\n- ${p.text}`);
                }}
                className="text-xs bg-slate-100 hover:bg-indigo-50 hover:text-indigo-900 border border-slate-200 text-slate-700 px-3 py-1.5 rounded-lg transition cursor-pointer"
              >
                + {p.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Duplicate Content Protection */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-100 text-emerald-800 rounded-xl">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900">Duplicate-Content Protection</h3>
              <p className="text-xs text-slate-500">
                Maintains cross-attraction variety in sentence openings, transitions, and guide call-to-actions.
              </p>
            </div>
          </div>

          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={settings.duplicate_protection}
              onChange={(e) => onUpdateSettings({ ...settings, duplicate_protection: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
          </label>
        </div>
      </div>

      {/* ToursByLocals Copywriting Standard Reference */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-6">
        <div className="border-b border-slate-200 pb-4">
          <h3 className="text-base font-semibold text-slate-900 flex items-center gap-2">
            <FileCheck className="w-5 h-5 text-indigo-600" />
            <span>ToursByLocals Copywriting Standard Rules</span>
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Rules automatically enforced during generation and the secondary quality-control check.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
            <div className="font-bold text-slate-900">1. Exact Subheading Format</div>
            <p className="text-slate-600">
              Must begin on line 1 with <code className="font-mono bg-white px-1.5 py-0.5 rounded border border-slate-200 text-indigo-900">See the best of [Attraction Name] with a private guide</code>. No &lt;br&gt; tags after heading.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
            <div className="font-bold text-slate-900">2. Relevant Entities &amp; Real Details</div>
            <p className="text-slate-600">
              Naturally incorporate notable people (architects like Antoni Gaudí, artists, historical founders), architectural features, artworks, and 2–3 real places/moments per paragraph.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
            <div className="font-bold text-slate-900">3. Paragraphs &amp; &lt;br&gt;&lt;br&gt;</div>
            <p className="text-slate-600">
              Plain descriptive paragraphs ending strictly with <code className="font-mono bg-white px-1.5 py-0.5 rounded border border-slate-200 text-indigo-900">&lt;br&gt;&lt;br&gt;</code>. Paragraph 1 introduces significance/setting; middle paragraphs weave 2-3 specific features; final paragraph explains guide value and tour customization.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
            <div className="font-bold text-slate-900">4. Word Count Target</div>
            <p className="text-slate-600">
              Approximately 180–260 words (excluding heading). Sidebar-sized content block, not a long-form article.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
            <div className="font-bold text-slate-900">5. Tone, Contractions &amp; Voice</div>
            <p className="text-slate-600">
              Gentle, curious, conversational &amp; observational (~8th grade reading level). Use contractions. No questions, no bullet points, no stylized sentence fragments, no "we/our/let's".
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
            <div className="font-bold text-slate-900">6. Private Guide Value</div>
            <p className="text-slate-600">
              Explain how a local guide adds value through storytelling, context, practical advice, and a personal experience. Emphasize flexibility and end by encouraging travellers to explore tours or customize their itinerary.
            </p>
          </div>
        </div>

        {/* Prohibited Phrases Reference Table */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-rose-600" />
            <h4 className="text-xs font-semibold uppercase tracking-wider text-rose-900">
              Prohibited Words &amp; Marketing Cliches (Auto-Banned)
            </h4>
          </div>

          <div className="flex flex-wrap gap-2">
            {BANNED_PHRASES.map((phrase, idx) => (
              <span
                key={idx}
                className="bg-rose-50 border border-rose-200 text-rose-900 text-xs px-2.5 py-1 rounded-lg font-medium"
              >
                "{phrase.trim()}"
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
