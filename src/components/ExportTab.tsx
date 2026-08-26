import React, { useState } from 'react';
import { AttractionItem } from '../types/attraction';
import { exportToCSV, exportToJSON } from '../utils/csvHelper';
import { 
  Download, 
  Copy, 
  Check, 
  FileSpreadsheet, 
  Code, 
  FileText, 
  HelpCircle,
  Table as TableIcon,
  CheckCircle2,
  Filter
} from 'lucide-react';

interface ExportTabProps {
  items: AttractionItem[];
}

export const ExportTab: React.FC<ExportTabProps> = ({ items }) => {
  const [scope, setScope] = useState<'all' | 'complete' | 'approved'>('all');
  const [copiedAll, setCopiedAll] = useState(false);

  const completeItems = items.filter((i) => i.status === 'complete');
  const approvedItems = items.filter((i) => i.is_approved);

  const exportItems =
    scope === 'approved'
      ? approvedItems
      : scope === 'complete'
      ? completeItems
      : items;

  const handleCopyApproved = () => {
    if (approvedItems.length === 0) {
      alert('No approved items to copy. Please approve descriptions first.');
      return;
    }
    const text = approvedItems
      .map((i) => `${i.heading}\n\n${i.content}`)
      .join('\n\n------------------------------------\n\n');

    navigator.clipboard.writeText(text);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Header Box */}
      <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-xl font-serif font-bold text-stone-900">
              Export Results & Data
            </h2>
            <p className="text-xs text-stone-600">
              Export verified attraction marketing copy and source records formatted with required &lt;br&gt;&lt;br&gt; delimiters.
            </p>
          </div>

          {/* Export Buttons Group */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              id="export-copy-approved-btn"
              type="button"
              onClick={handleCopyApproved}
              disabled={approvedItems.length === 0}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-emerald-950 bg-emerald-100 hover:bg-emerald-200 rounded-xl transition shadow-2xs disabled:opacity-40 cursor-pointer"
            >
              {copiedAll ? <Check className="w-3.5 h-3.5 text-emerald-800" /> : <Copy className="w-3.5 h-3.5 text-emerald-800" />}
              <span>{copiedAll ? 'Copied to Clipboard!' : `Copy All Approved (${approvedItems.length})`}</span>
            </button>

            <button
              id="export-download-json-btn"
              type="button"
              onClick={() => exportToJSON(exportItems, `attractions_${scope}.json`)}
              disabled={exportItems.length === 0}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-stone-800 bg-stone-100 hover:bg-stone-200 border border-stone-300 rounded-xl transition shadow-2xs disabled:opacity-40 cursor-pointer"
            >
              <Code className="w-3.5 h-3.5 text-stone-600" />
              <span>Download JSON</span>
            </button>

            <button
              id="export-download-csv-btn"
              type="button"
              onClick={() => exportToCSV(exportItems, `attractions_${scope}.csv`)}
              disabled={exportItems.length === 0}
              className="inline-flex items-center gap-2 px-5 py-2 text-xs font-semibold text-white bg-emerald-800 hover:bg-emerald-900 rounded-xl transition shadow-xs disabled:opacity-40 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download CSV ({exportItems.length})</span>
            </button>
          </div>
        </div>

        {/* Scope Selector */}
        <div className="flex items-center gap-3 pt-3 border-t border-stone-200">
          <span className="text-xs font-semibold uppercase tracking-wider text-stone-600">Export Scope:</span>
          <div className="flex rounded-lg bg-stone-100 p-1">
            <button
              type="button"
              onClick={() => setScope('all')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition ${
                scope === 'all' ? 'bg-white text-stone-900 shadow-2xs' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              All Items ({items.length})
            </button>
            <button
              type="button"
              onClick={() => setScope('complete')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition ${
                scope === 'complete' ? 'bg-white text-stone-900 shadow-2xs' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Only Complete ({completeItems.length})
            </button>
            <button
              type="button"
              onClick={() => setScope('approved')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition ${
                scope === 'approved' ? 'bg-white text-stone-900 shadow-2xs' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Only Approved ({approvedItems.length})
            </button>
          </div>
        </div>
      </div>

      {/* CSV Schema & Field Guide */}
      <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-2xs space-y-4">
        <h3 className="text-sm font-semibold text-stone-900 flex items-center gap-2">
          <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
          <span>CSV Export Column Definitions</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
          <div className="bg-stone-50 p-3 rounded-xl border border-stone-200">
            <code className="font-mono font-bold text-emerald-900">attraction_name</code>
            <p className="text-stone-600 mt-1">Name of the attraction.</p>
          </div>
          <div className="bg-stone-50 p-3 rounded-xl border border-stone-200">
            <code className="font-mono font-bold text-emerald-900">city / country</code>
            <p className="text-stone-600 mt-1">Geographic location of the attraction.</p>
          </div>
          <div className="bg-stone-50 p-3 rounded-xl border border-stone-200">
            <code className="font-mono font-bold text-emerald-900">heading</code>
            <p className="text-stone-600 mt-1">Only the generated heading string.</p>
          </div>
          <div className="bg-stone-50 p-3 rounded-xl border border-stone-200">
            <code className="font-mono font-bold text-emerald-900">content</code>
            <p className="text-stone-600 mt-1">Paragraphs without heading (preserves &lt;br&gt;&lt;br&gt;).</p>
          </div>
          <div className="bg-stone-50 p-3 rounded-xl border border-stone-200">
            <code className="font-mono font-bold text-emerald-900">plan_your_visit</code>
            <p className="text-stone-600 mt-1">Standalone evergreen visit-planning copy.</p>
          </div>
          <div className="bg-stone-50 p-3 rounded-xl border border-stone-200">
            <code className="font-mono font-bold text-emerald-900">nearby_attractions</code>
            <p className="text-stone-600 mt-1">Standalone nearby itinerary recommendations.</p>
          </div>
          <div className="bg-stone-50 p-3 rounded-xl border border-stone-200">
            <code className="font-mono font-bold text-emerald-900">full_content</code>
            <p className="text-stone-600 mt-1">Main description, Plan Your Visit and Nearby Attractions combined.</p>
          </div>
          <div className="bg-stone-50 p-3 rounded-xl border border-stone-200">
            <code className="font-mono font-bold text-emerald-900">source_urls</code>
            <p className="text-stone-600 mt-1">Semicolon-separated list of researched source URLs.</p>
          </div>
        </div>
      </div>

      {/* Export Preview Table */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-2xs overflow-hidden">
        <div className="p-4 bg-stone-50 border-b border-stone-200 flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-stone-700">
            Export Preview Data ({exportItems.length} rows)
          </span>
        </div>

        <div className="overflow-x-auto max-h-[500px]">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-stone-100 border-b border-stone-200 text-stone-700 uppercase font-semibold text-[11px] sticky top-0">
              <tr>
                <th className="p-3">Attraction</th>
                <th className="p-3">City / Country</th>
                <th className="p-3">Heading</th>
                <th className="p-3">Words</th>
                <th className="p-3">Status</th>
                <th className="p-3">Quality</th>
                <th className="p-3">Sources</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200 font-sans">
              {exportItems.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-stone-500">
                    No rows to preview in this scope.
                  </td>
                </tr>
              ) : (
                exportItems.map((item) => (
                  <tr key={item.id} className="hover:bg-stone-50/80 transition">
                    <td className="p-3 font-medium text-stone-900">{item.attraction_name}</td>
                    <td className="p-3 text-stone-600">{[item.city, item.country].filter(Boolean).join(', ') || '—'}</td>
                    <td className="p-3 text-stone-700 max-w-xs truncate">{item.heading || '—'}</td>
                    <td className="p-3 text-stone-600 font-mono">{item.word_count || 0}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-stone-100 text-stone-700">
                        {item.status}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-100 text-emerald-800">
                        {item.quality_status || 'pending'}
                      </span>
                    </td>
                    <td className="p-3 text-stone-500 font-mono text-[11px]">
                      {item.research?.sources?.length || 0} source(s)
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
