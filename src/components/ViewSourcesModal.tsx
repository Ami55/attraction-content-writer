import React from 'react';
import { AttractionItem } from '../types/attraction';
import { ExternalLink, X, BookOpen, ShieldCheck, AlertCircle } from 'lucide-react';

interface ViewSourcesModalProps {
  item: AttractionItem | null;
  onClose: () => void;
}

export const ViewSourcesModal: React.FC<ViewSourcesModalProps> = ({ item, onClose }) => {
  if (!item) return null;

  const research = item.research;
  const sources = research?.sources || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
      <div 
        id="view-sources-dialog"
        className="relative w-full max-w-2xl max-h-[85vh] flex flex-col rounded-2xl bg-white shadow-2xl border border-stone-200 overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-200 px-6 py-4 bg-stone-50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-100 text-emerald-800 rounded-lg">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-stone-900">Research & Web Sources</h3>
              <p className="text-xs text-stone-600">
                {item.attraction_name} {item.city ? `• ${item.city}` : ''} {item.country ? `• ${item.country}` : ''}
              </p>
            </div>
          </div>
          <button
            id="close-sources-modal-btn"
            onClick={onClose}
            className="rounded-lg p-2 text-stone-400 hover:bg-stone-200 hover:text-stone-700 transition"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Research Summary Box */}
          <div className="rounded-xl bg-stone-50 border border-stone-200 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">Verified Identification</span>
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                research?.confidence === 'high' 
                  ? 'bg-emerald-100 text-emerald-800' 
                  : research?.confidence === 'medium'
                  ? 'bg-amber-100 text-amber-800'
                  : 'bg-rose-100 text-rose-800'
              }`}>
                <ShieldCheck className="w-3.5 h-3.5" />
                {research?.confidence === 'high' ? 'High Confidence' : research?.confidence === 'medium' ? 'Moderate Confidence' : 'Requires Verification'}
              </span>
            </div>
            
            {research?.significance && (
              <p className="text-sm text-stone-700 leading-relaxed">{research.significance}</p>
            )}

            {/* Standout features researched */}
            {research?.standout_features && research.standout_features.length > 0 && (
              <div>
                <span className="text-xs font-medium text-stone-500 block mb-1.5">Standout Internal Features Researched:</span>
                <div className="flex flex-wrap gap-1.5">
                  {research.standout_features.map((feat, idx) => (
                    <span key={idx} className="inline-block bg-white border border-stone-200 text-stone-800 text-xs px-2.5 py-1 rounded-md">
                      {feat}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sources List */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold text-stone-900">
                Current Sources ({sources.length})
              </h4>
              <span className="text-xs text-stone-500">
                Official, UNESCO & Tourism Databases
              </span>
            </div>

            {sources.length === 0 ? (
              <div className="rounded-xl border border-dashed border-stone-300 p-6 text-center text-sm text-stone-500">
                <AlertCircle className="w-6 h-6 mx-auto mb-2 text-stone-400" />
                No direct web links recorded. Grounded directly against verified attraction records.
              </div>
            ) : (
              <div className="space-y-3">
                {sources.map((source, index) => (
                  <div
                    key={index}
                    id={`source-item-${index}`}
                    className="rounded-xl border border-stone-200 p-4 hover:border-emerald-500/40 hover:bg-stone-50/50 transition"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="font-medium text-stone-900 text-sm">
                          {source.title || 'Attraction Reference'}
                        </div>
                        <p className="text-xs text-stone-600">
                          {source.supported_facts || 'Verified core attraction historical details and features.'}
                        </p>
                      </div>
                      {source.url && (
                        <a
                          id={`source-link-${index}`}
                          href={source.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-xs font-medium text-emerald-700 hover:text-emerald-800 hover:underline shrink-0 bg-emerald-50 px-2.5 py-1.5 rounded-md"
                        >
                          <span>Visit Source</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                    {source.url && (
                      <div className="mt-2 text-[11px] text-stone-600 truncate font-mono">
                        {source.url}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Verification Notes */}
          {research?.verification_notes && (
            <div className="text-xs text-stone-500 bg-stone-100/70 p-3 rounded-lg border border-stone-200">
              <span className="font-semibold text-stone-700">Verification note: </span>
              {research.verification_notes}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-stone-200 px-6 py-3 bg-stone-50 flex justify-end">
          <button
            id="close-sources-bottom-btn"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-200 rounded-lg transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
