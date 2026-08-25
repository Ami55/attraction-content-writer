import React, { useState } from 'react';
import { AttractionItem, RegenerateOption } from '../types/attraction';
import { RefreshCw, X, Sparkles, Sliders, CheckCircle2 } from 'lucide-react';

interface RegenerateModalProps {
  item: AttractionItem | null;
  onClose: () => void;
  onRegenerate: (item: AttractionItem, option: RegenerateOption, customInstruction?: string) => void;
  isProcessing?: boolean;
}

interface OptionItem {
  id: RegenerateOption;
  label: string;
  desc: string;
  badge?: string;
}

const OPTIONS: OptionItem[] = [
  {
    id: 'specific',
    label: 'Make it more specific',
    desc: 'Incorporate concrete names of specific rooms, artworks, dates, and architectural elements.',
  },
  {
    id: 'conversational',
    label: 'Make it more conversational',
    desc: 'Enhance the natural, grounded flow, like advice given to a friend interested in local culture.',
  },
  {
    id: 'shorten',
    label: 'Shorten it',
    desc: 'Tighten sentence structures towards the lower end of the 180–260 word range.',
  },
  {
    id: 'history',
    label: 'Add more historical context',
    desc: 'Deepen the background on founding figures, past eras, and notable events.',
  },
  {
    id: 'experience',
    label: 'Focus more on visitor experience',
    desc: 'Emphasize sensory details, vantage points, and what travellers feel while walking inside.',
  },
  {
    id: 'guide_value',
    label: 'Improve the guide-value paragraph',
    desc: 'Strengthen how a ToursByLocals private guide provides tailored pacing, storytelling, and local depth.',
  },
  {
    id: 'different_features',
    label: 'Use different attraction features',
    desc: 'Rotate highlights to showcase different internal galleries, architectural facets, or traditions.',
  },
  {
    id: 'custom',
    label: 'Custom instruction',
    desc: 'Provide your own precise copywriting directives for this specific attraction.',
  },
];

export const RegenerateModal: React.FC<RegenerateModalProps> = ({
  item,
  onClose,
  onRegenerate,
  isProcessing = false,
}) => {
  const [selectedOption, setSelectedOption] = useState<RegenerateOption>('specific');
  const [customText, setCustomText] = useState('');

  if (!item) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onRegenerate(
      item,
      selectedOption,
      selectedOption === 'custom' ? customText.trim() : undefined
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
      <div 
        id="regenerate-dialog"
        className="relative w-full max-w-xl max-h-[90vh] flex flex-col rounded-2xl bg-white shadow-2xl border border-stone-200 overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-200 px-6 py-4 bg-stone-50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 text-amber-800 rounded-lg">
              <RefreshCw className={`w-5 h-5 ${isProcessing ? 'animate-spin' : ''}`} />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-stone-900">Regenerate Description</h3>
              <p className="text-xs text-stone-600">
                {item.attraction_name} {item.city ? `(${item.city})` : ''}
              </p>
            </div>
          </div>
          <button
            id="close-regen-modal-btn"
            onClick={onClose}
            disabled={isProcessing}
            className="rounded-lg p-2 text-stone-400 hover:bg-stone-200 hover:text-stone-700 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          <div className="text-xs text-stone-500 bg-stone-50 p-3 rounded-lg border border-stone-200">
            <span className="font-semibold text-stone-700">Note: </span>
            Regeneration re-synthesizes the copy using existing verified research without changing the attraction subject.
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600">
              Select Adjustment Directive
            </label>
            <div className="space-y-2">
              {OPTIONS.map((opt) => {
                const isSelected = selectedOption === opt.id;
                return (
                  <label
                    key={opt.id}
                    id={`regen-opt-${opt.id}`}
                    className={`flex items-start gap-3 p-3 rounded-xl border transition cursor-pointer ${
                      isSelected
                        ? 'border-emerald-700 bg-emerald-50/50 ring-1 ring-emerald-700/20'
                        : 'border-stone-200 hover:border-stone-300 hover:bg-stone-50/40'
                    }`}
                  >
                    <input
                      type="radio"
                      name="regen_option"
                      value={opt.id}
                      checked={isSelected}
                      onChange={() => setSelectedOption(opt.id)}
                      className="mt-1 text-emerald-700 focus:ring-emerald-700 accent-emerald-700"
                    />
                    <div className="flex-1">
                      <div className="text-sm font-medium text-stone-900 flex items-center justify-between">
                        <span>{opt.label}</span>
                        {isSelected && <CheckCircle2 className="w-4 h-4 text-emerald-700" />}
                      </div>
                      <p className="text-xs text-stone-600 mt-0.5">{opt.desc}</p>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          {selectedOption === 'custom' && (
            <div className="space-y-1.5 pt-2">
              <label className="block text-xs font-semibold text-stone-700">
                Custom Copywriting Instruction
              </label>
              <textarea
                id="custom-regen-instruction-input"
                rows={3}
                value={customText}
                onChange={(e) => setCustomText(e.target.value)}
                placeholder="e.g., Focus more on the nighttime illumination and mention that audio guides miss subtle architectural humor."
                className="w-full text-sm rounded-xl border border-stone-300 px-3.5 py-2.5 focus:border-emerald-700 focus:ring-1 focus:ring-emerald-700 outline-hidden resize-none"
                required
              />
            </div>
          )}
        </form>

        {/* Footer */}
        <div className="border-t border-stone-200 px-6 py-4 bg-stone-50 flex items-center justify-between">
          <button
            id="cancel-regen-btn"
            type="button"
            onClick={onClose}
            disabled={isProcessing}
            className="px-4 py-2 text-sm font-medium text-stone-600 hover:bg-stone-200 rounded-lg transition"
          >
            Cancel
          </button>
          <button
            id="apply-regenerate-btn"
            type="submit"
            onClick={handleSubmit}
            disabled={isProcessing || (selectedOption === 'custom' && !customText.trim())}
            className="inline-flex items-center gap-2 px-5 py-2 text-sm font-medium text-white bg-emerald-800 hover:bg-emerald-900 rounded-xl transition shadow-xs disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${isProcessing ? 'animate-spin' : ''}`} />
            <span>{isProcessing ? 'Regenerating...' : 'Regenerate Now'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
