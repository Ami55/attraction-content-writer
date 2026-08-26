import React, { useState } from 'react';
import { CopywritingRule, ProjectSettings } from '../types/attraction';
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
  ShieldCheck,
  Plus,
  Pencil,
  Trash2,
  Save,
  ArrowUp,
  ArrowDown
} from 'lucide-react';

interface SettingsTabProps {
  settings: ProjectSettings;
  onUpdateSettings: (settings: ProjectSettings) => void;
}

export const SettingsTab: React.FC<SettingsTabProps> = ({
  settings,
  onUpdateSettings,
}) => {
  const [instructionDraft, setInstructionDraft] = useState('');
  const [isEditingInstructions, setIsEditingInstructions] = useState(!settings.additional_instructions.trim());
  const [instructionsSaved, setInstructionsSaved] = useState(false);
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);
  const [viewingRule, setViewingRule] = useState<CopywritingRule | null>(null);
  const [ruleDraft, setRuleDraft] = useState({ title: '', description: '' });

  const handleInstructionChange = (text: string) => {
    setInstructionDraft(text);
    setInstructionsSaved(false);
  };

  const applyInstructions = () => {
    onUpdateSettings({ ...settings, additional_instructions: instructionDraft.trim() });
    setInstructionDraft('');
    setIsEditingInstructions(false);
    setInstructionsSaved(true);
  };

  const editInstructions = () => {
    setInstructionDraft(settings.additional_instructions);
    setIsEditingInstructions(true);
    setInstructionsSaved(false);
  };

  const clearInstructions = () => {
    onUpdateSettings({ ...settings, additional_instructions: '' });
    setInstructionDraft('');
    setIsEditingInstructions(true);
    setInstructionsSaved(false);
  };

  const saveRule = () => {
    const title = ruleDraft.title.trim();
    const description = ruleDraft.description.trim();
    if (!title || !description) return;
    const rules = editingRuleId
      ? settings.custom_rules.map((rule) => rule.id === editingRuleId ? { ...rule, title, description } : rule)
      : [...settings.custom_rules, { id: crypto.randomUUID(), title, description }];
    onUpdateSettings({ ...settings, custom_rules: rules });
    setEditingRuleId(null);
    setRuleDraft({ title: '', description: '' });
  };

  const editRule = (rule: CopywritingRule) => {
    setEditingRuleId(rule.id);
    setRuleDraft({ title: rule.title, description: rule.description });
  };

  const removeRule = (id: string) => {
    onUpdateSettings({ ...settings, custom_rules: settings.custom_rules.filter((rule) => rule.id !== id) });
    if (editingRuleId === id) {
      setEditingRuleId(null);
      setRuleDraft({ title: '', description: '' });
    }
  };

  const moveRule = (index: number, direction: -1 | 1) => {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= settings.custom_rules.length) return;
    const rules = [...settings.custom_rules];
    [rules[index], rules[nextIndex]] = [rules[nextIndex], rules[index]];
    onUpdateSettings({ ...settings, custom_rules: rules });
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

        {isEditingInstructions ? <div className="space-y-2">
          <textarea
            id="settings-additional-instructions-textarea"
            rows={4}
            value={instructionDraft}
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
                  const curr = instructionDraft.trim();
                  if (!curr) handleInstructionChange(p.text);
                  else if (!curr.includes(p.text)) handleInstructionChange(`${curr}\n- ${p.text}`);
                }}
                className="text-xs bg-slate-100 hover:bg-indigo-50 hover:text-indigo-900 border border-slate-200 text-slate-700 px-3 py-1.5 rounded-lg transition cursor-pointer"
              >
                + {p.label}
              </button>
            ))}
          </div>
          <div className="flex items-center justify-end gap-3 pt-2">
            {instructionsSaved && <span className="text-xs font-semibold text-emerald-700 flex items-center gap-1"><CheckCircle2 className="w-4 h-4" /> Saved and applied to every AI request</span>}
            <button type="button" onClick={applyInstructions} className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700">
              <Save className="w-4 h-4" /> Save &amp; Apply Instructions
            </button>
          </div>
        </div> : (
          <div className="flex items-center justify-between gap-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-sm font-semibold text-emerald-900"><CheckCircle2 className="h-4 w-4" /> Instructions saved and active</div>
              <p className="mt-1 truncate text-xs text-emerald-800">{settings.additional_instructions}</p>
            </div>
            <div className="flex shrink-0 gap-2">
              <button type="button" onClick={editInstructions} className="rounded-lg border border-emerald-300 bg-white px-3 py-1.5 text-xs font-semibold text-emerald-900">Edit</button>
              <button type="button" onClick={clearInstructions} className="rounded-lg border border-rose-200 bg-white px-3 py-1.5 text-xs font-semibold text-rose-700">Clear</button>
            </div>
          </div>
        )}
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

      {/* Attraction Copywriting Standard Reference */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-6">
        <div className="border-b border-slate-200 pb-4">
          <h3 className="text-base font-semibold text-slate-900 flex items-center gap-2">
            <FileCheck className="w-5 h-5 text-indigo-600" />
            <span>Attraction Copywriting Standard Rules</span>
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Rules automatically enforced during generation and the secondary quality-control check.
          </p>
        </div>

        <div className="grid grid-cols-1 items-start gap-4 text-xs md:grid-cols-2 lg:grid-cols-3">
          {settings.custom_rules.map((rule, index) => (
            <div key={rule.id} className="flex h-40 flex-col rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="font-bold text-slate-900">{index + 1}. {rule.title}</div>
                <div className="flex items-center gap-1">
                  <button type="button" title="Move up" onClick={() => moveRule(index, -1)} disabled={index === 0} className="p-1 rounded hover:bg-white disabled:opacity-30"><ArrowUp className="w-3.5 h-3.5" /></button>
                  <button type="button" title="Move down" onClick={() => moveRule(index, 1)} disabled={index === settings.custom_rules.length - 1} className="p-1 rounded hover:bg-white disabled:opacity-30"><ArrowDown className="w-3.5 h-3.5" /></button>
                  <button type="button" title="Edit rule" onClick={() => editRule(rule)} className="p-1 rounded text-indigo-700 hover:bg-indigo-100"><Pencil className="w-3.5 h-3.5" /></button>
                  <button type="button" title="Remove rule" onClick={() => removeRule(rule.id)} className="p-1 rounded text-rose-700 hover:bg-rose-100"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>
              <p className="mt-2 line-clamp-3 whitespace-pre-wrap text-slate-600">{rule.description}</p>
              {rule.description.length > 150 && <button type="button" onClick={() => setViewingRule(rule)} className="mt-auto self-start text-xs font-semibold text-indigo-700 hover:text-indigo-900">See more</button>}
            </div>
          ))}
        </div>

        <div className="rounded-xl border border-dashed border-indigo-300 bg-indigo-50/40 p-4 space-y-3">
          <div className="font-semibold text-sm text-slate-900">{editingRuleId ? 'Edit rule' : 'Add a new rule'}</div>
          <div className="grid gap-3 md:grid-cols-[1fr_2fr_auto]">
            <input value={ruleDraft.title} onChange={(e) => setRuleDraft({ ...ruleDraft, title: e.target.value })} placeholder="Rule title" className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm" />
            <textarea value={ruleDraft.description} onChange={(e) => setRuleDraft({ ...ruleDraft, description: e.target.value })} placeholder="Instruction the AI must follow" rows={2} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm resize-none" />
            <div className="flex items-start gap-2">
              <button type="button" onClick={saveRule} disabled={!ruleDraft.title.trim() || !ruleDraft.description.trim()} className="inline-flex items-center gap-1 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white disabled:opacity-40"><Plus className="w-4 h-4" /> {editingRuleId ? 'Update' : 'Add'}</button>
              {editingRuleId && <button type="button" onClick={() => { setEditingRuleId(null); setRuleDraft({ title: '', description: '' }); }} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm">Cancel</button>}
            </div>
          </div>
          <p className="text-xs text-indigo-800">These saved rules are sent to Gemini for generation, regeneration, chat editing, and quality checks.</p>
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

      {viewingRule && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4" onMouseDown={() => setViewingRule(null)}>
          <div className="max-h-[80vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl" onMouseDown={(event) => event.stopPropagation()}>
            <div className="flex items-start justify-between gap-4">
              <h3 className="text-lg font-bold text-slate-900">{viewingRule.title}</h3>
              <button type="button" onClick={() => setViewingRule(null)} className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm">Close</button>
            </div>
            <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-slate-700">{viewingRule.description}</p>
          </div>
        </div>
      )}
    </div>
  );
};
