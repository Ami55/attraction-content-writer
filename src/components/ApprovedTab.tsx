import React, { useState } from 'react';
import { AttractionItem } from '../types/attraction';
import { exportToCSV, exportToJSON } from '../utils/csvHelper';
import { 
  CheckCircle2, 
  Copy, 
  Check, 
  Download, 
  FileText, 
  Layers, 
  Edit3, 
  ExternalLink,
  BookOpen,
  ArrowRight
} from 'lucide-react';

interface ApprovedTabProps {
  items: AttractionItem[];
  onEditItem: (item: AttractionItem) => void;
  onToggleApprove: (id: string) => void;
  onNavigateToAttractions: () => void;
}

export const ApprovedTab: React.FC<ApprovedTabProps> = ({
  items,
  onEditItem,
  onToggleApprove,
  onNavigateToAttractions,
}) => {
  const approvedItems = items.filter((i) => i.is_approved);
  const [copiedAll, setCopiedAll] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const totalWords = approvedItems.reduce((acc, curr) => acc + (curr.word_count || 0), 0);
  const avgWords = approvedItems.length > 0 ? Math.round(totalWords / approvedItems.length) : 0;

  const handleCopyAll = () => {
    if (approvedItems.length === 0) return;
    const allFormatted = approvedItems
      .map((i) => `=== ${i.attraction_name} ===\n${i.full_content}`)
      .join('\n\n------------------------------------\n\n');

    navigator.clipboard.writeText(allFormatted);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2500);
  };

  const handleCopySingle = (item: AttractionItem) => {
    if (!item.full_content) return;
    navigator.clipboard.writeText(item.full_content);
    setCopiedId(item.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Top Banner */}
      <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-700" />
              <h2 className="text-xl font-serif font-bold text-stone-900">
                Approved Attraction Copy
              </h2>
            </div>
            <p className="text-xs text-stone-600">
              Verified, quality-audited descriptions ready for publishing on ToursByLocals attraction pages.
            </p>
          </div>

          {/* Export Actions */}
          <div className="flex items-center gap-2">
            <button
              id="copy-all-approved-btn"
              type="button"
              onClick={handleCopyAll}
              disabled={approvedItems.length === 0}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-emerald-950 bg-emerald-100 hover:bg-emerald-200 rounded-xl transition shadow-2xs disabled:opacity-40 cursor-pointer"
            >
              {copiedAll ? <Check className="w-3.5 h-3.5 text-emerald-800" /> : <Copy className="w-3.5 h-3.5 text-emerald-800" />}
              <span>{copiedAll ? 'All Copied to Clipboard!' : `Copy All (${approvedItems.length})`}</span>
            </button>

            <button
              id="download-approved-csv-btn"
              type="button"
              onClick={() => exportToCSV(approvedItems, 'toursbylocals_approved_content.csv')}
              disabled={approvedItems.length === 0}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-emerald-800 hover:bg-emerald-900 rounded-xl transition shadow-xs disabled:opacity-40 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download CSV</span>
            </button>
          </div>
        </div>

        {/* Stats Summary Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-stone-100">
          <div className="bg-stone-50 rounded-xl p-3 border border-stone-200">
            <div className="text-[11px] font-medium text-stone-500 uppercase tracking-wider">Approved Content</div>
            <div className="text-lg font-bold text-stone-900 mt-0.5">{approvedItems.length} descriptions</div>
          </div>
          <div className="bg-stone-50 rounded-xl p-3 border border-stone-200">
            <div className="text-[11px] font-medium text-stone-500 uppercase tracking-wider">Avg Word Count</div>
            <div className="text-lg font-bold text-emerald-800 mt-0.5">{avgWords} words</div>
          </div>
          <div className="bg-stone-50 rounded-xl p-3 border border-stone-200">
            <div className="text-[11px] font-medium text-stone-500 uppercase tracking-wider">Reading Level</div>
            <div className="text-lg font-bold text-stone-900 mt-0.5">~8th Grade</div>
          </div>
          <div className="bg-stone-50 rounded-xl p-3 border border-stone-200">
            <div className="text-[11px] font-medium text-stone-500 uppercase tracking-wider">Format Standard</div>
            <div className="text-lg font-bold text-stone-900 mt-0.5">100% &lt;br&gt;&lt;br&gt;</div>
          </div>
        </div>
      </div>

      {/* Approved Items List */}
      <div className="space-y-4">
        {approvedItems.length === 0 ? (
          <div className="bg-white rounded-2xl border border-stone-200 p-12 text-center text-stone-500">
            <CheckCircle2 className="w-10 h-10 mx-auto text-stone-400 mb-3" />
            <h3 className="text-base font-semibold text-stone-800">No approved descriptions yet</h3>
            <p className="text-xs text-stone-600 mt-1 max-w-md mx-auto">
              Review completed descriptions in the Generated Content tab and click "Approve" to collect them here.
            </p>
            <div className="mt-4">
              <button
                type="button"
                onClick={onNavigateToAttractions}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-coral-600 hover:text-coral-700 transition bg-coral-50 hover:bg-coral-100 px-4 py-2 rounded-xl"
              >
                <span>Go to Attractions Queue</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ) : (
          approvedItems.map((item) => (
            <div
              key={item.id}
              id={`approved-card-${item.id}`}
              className="bg-white rounded-2xl border border-emerald-300/60 p-6 shadow-2xs hover:shadow-xs transition space-y-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-200 pb-3">
                <div>
                  <h3 className="text-lg font-serif font-bold text-stone-900">
                    {item.attraction_name}
                  </h3>
                  <span className="text-xs text-stone-600">
                    {item.city}{item.country ? `, ${item.country}` : ''}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                    {item.word_count} words
                  </span>

                  <button
                    type="button"
                    onClick={() => handleCopySingle(item)}
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-stone-700 bg-stone-100 hover:bg-stone-200 px-3 py-1.5 rounded-lg transition"
                  >
                    {copiedId === item.id ? <Check className="w-3.5 h-3.5 text-emerald-700" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedId === item.id ? 'Copied!' : 'Copy'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onEditItem(item)}
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-900 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-lg transition"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Edit</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onToggleApprove(item.id)}
                    className="text-xs text-stone-400 hover:text-stone-700 px-2 py-1 transition"
                  >
                    Unapprove
                  </button>
                </div>
              </div>

              {/* Exact Heading */}
              <div className="text-base font-serif font-bold text-emerald-950">
                {item.heading}
              </div>

              {/* Body Content with Paragraphs */}
              <div 
                className="text-stone-800 text-sm leading-relaxed space-y-3 font-sans"
                dangerouslySetInnerHTML={{
                  __html: (item.content || '')
                    .split(/<br\s*\/?>\s*<br\s*\/?>/i)
                    .filter(Boolean)
                    .map(p => `<p class="mb-3">${p.replace(/<br\s*\/?>/gi, '')}</p>`)
                    .join(''),
                }}
              />
            </div>
          ))
        )}
      </div>
    </div>
  );
};
