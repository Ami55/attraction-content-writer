import React, { useState } from 'react';
import { AttractionItem, RegenerateOption } from '../types/attraction';
import { 
  Edit3, 
  Copy, 
  Check, 
  RefreshCw, 
  BookOpen, 
  CheckCircle2, 
  AlertCircle, 
  ShieldCheck, 
  ShieldAlert, 
  Clock, 
  HelpCircle, 
  Search, 
  Filter, 
  ArrowRight,
  Eye,
  CheckCheck,
  AlertTriangle,
  RotateCcw
} from 'lucide-react';

interface GeneratedContentTabProps {
  items: AttractionItem[];
  isGenerating: boolean;
  onEditItem: (item: AttractionItem) => void;
  onRegenerateItem: (item: AttractionItem) => void;
  onViewSources: (item: AttractionItem) => void;
  onToggleApprove: (id: string) => void;
  onRetryItem: (item: AttractionItem) => void;
  onRetryAllFailed: () => void;
}

export const GeneratedContentTab: React.FC<GeneratedContentTabProps> = ({
  items,
  isGenerating,
  onEditItem,
  onRegenerateItem,
  onViewSources,
  onToggleApprove,
  onRetryItem,
  onRetryAllFailed,
}) => {
  const [filter, setFilter] = useState<'all' | 'complete' | 'needs_clarification' | 'approved' | 'failed'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [openBriefs, setOpenBriefs] = useState<Record<string, boolean>>({});

  const completedCount = items.filter((i) => i.status === 'complete').length;
  const clarificationCount = items.filter((i) => i.status === 'needs_clarification').length;
  const approvedCount = items.filter((i) => i.is_approved).length;
  const failedCount = items.filter((i) => i.status === 'failed').length;

  const filteredItems = items.filter((item) => {
    // Status filter
    if (filter === 'complete' && item.status !== 'complete') return false;
    if (filter === 'needs_clarification' && item.status !== 'needs_clarification') return false;
    if (filter === 'approved' && !item.is_approved) return false;
    if (filter === 'failed' && item.status !== 'failed') return false;

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = item.attraction_name.toLowerCase().includes(q);
      const matchCity = item.city?.toLowerCase().includes(q) || false;
      const matchCountry = item.country?.toLowerCase().includes(q) || false;
      const matchContent = item.content?.toLowerCase().includes(q) || false;
      return matchName || matchCity || matchCountry || matchContent;
    }

    return true;
  });

  const handleCopy = (item: AttractionItem) => {
    if (!item.full_content) return;
    navigator.clipboard.writeText(item.full_content);
    setCopiedId(item.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const progressPercent = items.length > 0 ? Math.round((completedCount / items.length) * 100) : 0;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Progress & Batch Metric Header */}
      <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full font-semibold">
                Batch Progress
              </span>
              {isGenerating && (
                <span className="flex items-center gap-1 text-xs text-coral-600 font-medium animate-pulse">
                  <span className="w-2 h-2 rounded-full bg-coral-600 animate-ping" />
                  Generating live...
                </span>
              )}
            </div>
            <h2 className="text-xl font-serif font-bold text-stone-900 mt-1">
              {completedCount} of {items.length} attractions completed
            </h2>
          </div>

          {failedCount > 0 && (
            <button
              id="retry-failed-btn"
              type="button"
              onClick={onRetryAllFailed}
              disabled={isGenerating}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-300 rounded-xl transition shadow-2xs cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Retry All Failed ({failedCount})</span>
            </button>
          )}
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-stone-100 h-2.5 rounded-full overflow-hidden">
          <div
            className="h-full bg-emerald-700 transition-all duration-500 rounded-full"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            id="filter-all-btn"
            type="button"
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition ${
              filter === 'all'
                ? 'bg-emerald-900 text-white shadow-2xs'
                : 'bg-white text-stone-600 hover:bg-stone-100 border border-stone-200'
            }`}
          >
            All ({items.length})
          </button>
          <button
            id="filter-complete-btn"
            type="button"
            onClick={() => setFilter('complete')}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition ${
              filter === 'complete'
                ? 'bg-emerald-900 text-white shadow-2xs'
                : 'bg-white text-stone-600 hover:bg-stone-100 border border-stone-200'
            }`}
          >
            Completed ({completedCount})
          </button>
          <button
            id="filter-approved-btn"
            type="button"
            onClick={() => setFilter('approved')}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition ${
              filter === 'approved'
                ? 'bg-emerald-900 text-white shadow-2xs'
                : 'bg-white text-stone-600 hover:bg-stone-100 border border-stone-200'
            }`}
          >
            Approved ({approvedCount})
          </button>
          {clarificationCount > 0 && (
            <button
              id="filter-clarification-btn"
              type="button"
              onClick={() => setFilter('needs_clarification')}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition ${
                filter === 'needs_clarification'
                  ? 'bg-amber-800 text-white shadow-2xs'
                  : 'bg-amber-50 text-amber-900 hover:bg-amber-100 border border-amber-300'
              }`}
            >
              Needs Clarification ({clarificationCount})
            </button>
          )}
          {failedCount > 0 && (
            <button
              id="filter-failed-btn"
              type="button"
              onClick={() => setFilter('failed')}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition ${
                filter === 'failed'
                  ? 'bg-rose-800 text-white shadow-2xs'
                  : 'bg-rose-50 text-rose-900 hover:bg-rose-100 border border-rose-300'
              }`}
            >
              Failed ({failedCount})
            </button>
          )}
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            id="search-generated-content-input"
            type="text"
            placeholder="Search attractions, cities, copy..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs rounded-xl border border-stone-300 bg-white pl-9 pr-3.5 py-2 focus:border-emerald-700 outline-hidden"
          />
        </div>
      </div>

      {/* Cards List */}
      <div className="space-y-4">
        {filteredItems.length === 0 ? (
          <div className="bg-white rounded-2xl border border-stone-200 p-12 text-center text-stone-500">
            <BookOpen className="w-10 h-10 mx-auto text-stone-400 mb-3" />
            <h3 className="text-base font-semibold text-stone-800">No matching attraction results</h3>
            <p className="text-xs text-stone-600 mt-1">
              Switch filters or generate descriptions from the Attractions tab.
            </p>
          </div>
        ) : (
          filteredItems.map((item) => {
            const isCompleted = item.status === 'complete';
            const isClarification = item.status === 'needs_clarification';
            const isFailed = item.status === 'failed';
            const isProcessing =
              item.status === 'researching' ||
              item.status === 'writing' ||
              item.status === 'checking';

            return (
              <div
                key={item.id}
                id={`result-card-${item.id}`}
                className={`bg-white rounded-2xl border transition shadow-2xs overflow-hidden ${
                  item.is_approved
                    ? 'border-emerald-500/50 bg-emerald-50/10'
                    : isClarification
                    ? 'border-amber-300 bg-amber-50/20'
                    : isFailed
                    ? 'border-rose-300 bg-rose-50/20'
                    : 'border-stone-200'
                }`}
              >
                {/* Card Header */}
                <div className="p-5 border-b border-stone-200 bg-stone-50/60 flex flex-wrap items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2.5">
                      <h3 className="text-base font-bold text-stone-900 font-serif">
                        {item.attraction_name}
                      </h3>
                      {item.city && (
                        <span className="text-xs text-stone-600 bg-stone-200/80 px-2 py-0.5 rounded-md font-medium">
                          {item.city}{item.country ? `, ${item.country}` : ''}
                        </span>
                      )}
                    </div>
                    {item.notes && (
                      <p className="text-xs text-stone-500 italic">Note: {item.notes}</p>
                    )}
                  </div>

                  {/* Status Badges Group */}
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Generation Status Badge */}
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                      isCompleted
                        ? 'bg-emerald-100 text-emerald-800'
                        : isClarification
                        ? 'bg-amber-100 text-amber-800'
                        : isFailed
                        ? 'bg-rose-100 text-rose-800'
                        : isProcessing
                        ? 'bg-blue-100 text-blue-800 animate-pulse'
                        : 'bg-stone-100 text-stone-600'
                    }`}>
                      {isProcessing && <RefreshCw className="w-3 h-3 animate-spin" />}
                      {item.status === 'waiting' && 'Waiting in queue'}
                      {item.status === 'researching' && 'Researching web sources...'}
                      {item.status === 'writing' && 'Writing attraction copy...'}
                      {item.status === 'checking' && 'Running quality audit...'}
                      {item.status === 'complete' && 'Generation Complete'}
                      {item.status === 'needs_clarification' && 'Needs Clarification'}
                      {item.status === 'failed' && 'Generation Failed'}
                    </span>

                    {/* Word Count Badge */}
                    {isCompleted && item.word_count !== undefined && (
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                        item.word_count >= 180 && item.word_count <= 260
                          ? 'bg-stone-100 text-stone-700'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {item.word_count} words
                      </span>
                    )}

                    {/* Quality Check Badge */}
                    {isCompleted && item.quality_check && (
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                        item.quality_check.passed
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        <ShieldCheck className="w-3.5 h-3.5" />
                        {item.quality_check.auto_revised ? 'Auto-Revised & Passed' : 'Quality Passed'}
                      </span>
                    )}

                    {/* Approval Status Badge */}
                    {item.is_approved && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-800 text-white shadow-2xs">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Approved
                      </span>
                    )}
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-6">
                  {/* Needs Clarification Notice */}
                  {isClarification && (
                    <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 space-y-2">
                      <div className="flex items-center gap-2 text-amber-900 font-semibold text-sm">
                        <AlertTriangle className="w-4 h-4 text-amber-700" />
                        <span>Attraction identification required</span>
                      </div>
                      <p className="text-xs text-amber-800">
                        Possible Reason: <strong className="font-semibold">{item.clarification_reason || 'Insufficient attraction-specific information'}</strong>
                      </p>
                      <p className="text-xs text-amber-700">
                        To resolve, add a specific city, country, or official URL in the Attractions tab and re-run.
                      </p>
                      <div className="pt-1">
                        <button
                          type="button"
                          onClick={() => onRetryItem(item)}
                          className="text-xs font-medium text-amber-900 bg-amber-200/80 hover:bg-amber-200 px-3 py-1.5 rounded-lg transition"
                        >
                          Retry Research
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Failed Notice */}
                  {isFailed && (
                    <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 space-y-2">
                      <div className="flex items-center gap-2 text-rose-900 font-semibold text-sm">
                        <AlertCircle className="w-4 h-4 text-rose-700" />
                        <span>Generation encountered an error</span>
                      </div>
                      <p className="text-xs text-rose-800 font-mono">
                        {item.error_message || 'An unexpected error occurred during research or writing.'}
                      </p>
                      <button
                        type="button"
                        onClick={() => onRetryItem(item)}
                        className="text-xs font-medium text-rose-900 bg-rose-200/80 hover:bg-rose-200 px-3 py-1.5 rounded-lg transition"
                      >
                        Retry Generation
                      </button>
                    </div>
                  )}

                  {/* Loading State Skeleton */}
                  {isProcessing && (
                    <div className="space-y-3 animate-pulse py-4">
                      <div className="h-5 bg-stone-200 rounded w-2/3" />
                      <div className="h-4 bg-stone-100 rounded w-full" />
                      <div className="h-4 bg-stone-100 rounded w-5/6" />
                      <div className="h-4 bg-stone-100 rounded w-4/5" />
                    </div>
                  )}

                  {/* Completed Marketing Copy Content */}
                  {isCompleted && (
                    <div className="space-y-4">
                      {/* Heading Display */}
                      <div className="border-b border-stone-200 pb-2">
                        <h4 className="text-lg font-serif font-bold text-emerald-950">
                          {item.heading}
                        </h4>
                      </div>

                      {/* Rendered Paragraphs */}
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

                      {item.research?.information_guide && (
                        <div className="pt-4 border-t border-stone-200">
                          <button
                            type="button"
                            onClick={() => setOpenBriefs((previous) => ({ ...previous, [item.id]: !previous[item.id] }))}
                            className="w-full flex items-center justify-between rounded-xl border border-indigo-200 bg-indigo-50/60 px-4 py-3 text-left hover:bg-indigo-50 transition"
                          >
                            <div>
                              <p className="text-sm font-semibold text-indigo-950">Attraction Knowledge Brief</p>
                              <p className="text-xs text-indigo-700">Entities, history, features, visit planning and nearby places</p>
                            </div>
                            <span className="text-xs font-semibold text-indigo-800">{openBriefs[item.id] ? 'Hide details' : 'View details'}</span>
                          </button>

                          {openBriefs[item.id] && (
                            <div className="mt-3 space-y-4 rounded-xl border border-stone-200 bg-stone-50/60 p-4">
                              {item.research.core_entities && (
                                <div>
                                  <h5 className="text-xs font-bold uppercase tracking-wider text-stone-500 mb-2">Core entities & relationships</h5>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                    {[
                                      ['Place', item.research.core_entities.place],
                                      ['Type', item.research.core_entities.type],
                                      ['Key periods', item.research.core_entities.key_periods?.join(', ')],
                                      ['People', item.research.core_entities.people?.join(', ')],
                                      ['Defining features', item.research.core_entities.defining_features?.join(', ')],
                                      ['Religious identity', item.research.core_entities.religious_identity],
                                      ['Nearby landmarks', item.research.core_entities.nearby_landmarks?.join(', ')],
                                    ].filter(([, value]) => value).map(([label, value]) => (
                                      <div key={label} className="rounded-lg border border-stone-200 bg-white p-3">
                                        <p className="text-[10px] font-bold uppercase tracking-wider text-stone-500">{label}</p>
                                        <p className="mt-1 text-xs leading-relaxed text-stone-800">{value}</p>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              <div>
                                <h5 className="text-xs font-bold uppercase tracking-wider text-stone-500 mb-2">Recommended information</h5>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                  {[
                                    ['Introduction & significance', item.research.information_guide.introduction_and_significance],
                                    ['History', item.research.information_guide.history],
                                    ['Main features', item.research.information_guide.main_features],
                                    ['What to look for', item.research.information_guide.what_to_look_for],
                                    ['Stories & lesser-known details', item.research.information_guide.stories_and_lesser_known_details],
                                    ['Planning the visit', item.research.information_guide.planning_the_visit],
                                    ['Combining with nearby places', item.research.information_guide.combining_with_nearby_places],
                                    ['Value of a private guide', item.research.information_guide.value_of_a_private_guide],
                                  ].map(([label, value]) => (
                                    <article key={label} className="rounded-lg border border-stone-200 bg-white p-3">
                                      <h6 className="text-xs font-semibold text-emerald-950">{label}</h6>
                                      <p className="mt-1 text-xs leading-relaxed text-stone-700">{value || 'Not enough verified information was found.'}</p>
                                    </article>
                                  ))}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Card Actions Footer */}
                {isCompleted && (
                  <div className="border-t border-stone-200 px-6 py-3 bg-stone-50/80 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <button
                        id={`view-sources-btn-${item.id}`}
                        type="button"
                        onClick={() => onViewSources(item)}
                        className="inline-flex items-center gap-1.5 text-xs font-medium text-stone-700 bg-white hover:bg-stone-100 border border-stone-300 px-3 py-1.5 rounded-lg transition shadow-2xs"
                      >
                        <BookOpen className="w-3.5 h-3.5 text-emerald-700" />
                        <span>View Sources ({item.research?.sources?.length || 0})</span>
                      </button>

                      <button
                        id={`regenerate-btn-${item.id}`}
                        type="button"
                        onClick={() => onRegenerateItem(item)}
                        className="inline-flex items-center gap-1.5 text-xs font-medium text-stone-700 bg-white hover:bg-stone-100 border border-stone-300 px-3 py-1.5 rounded-lg transition shadow-2xs"
                      >
                        <RefreshCw className="w-3.5 h-3.5 text-amber-700" />
                        <span>Regenerate</span>
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        id={`copy-btn-${item.id}`}
                        type="button"
                        onClick={() => handleCopy(item)}
                        className="inline-flex items-center gap-1.5 text-xs font-medium text-stone-700 bg-white hover:bg-stone-100 border border-stone-300 px-3 py-1.5 rounded-lg transition shadow-2xs"
                      >
                        {copiedId === item.id ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5 text-stone-500" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>

                      <button
                        id={`edit-btn-${item.id}`}
                        type="button"
                        onClick={() => onEditItem(item)}
                        className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-900 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 px-3 py-1.5 rounded-lg transition"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-emerald-800" />
                        <span>Edit & Audit</span>
                      </button>

                      <button
                        id={`approve-btn-${item.id}`}
                        type="button"
                        onClick={() => onToggleApprove(item.id)}
                        className={`inline-flex items-center gap-1.5 text-xs font-semibold px-4 py-1.5 rounded-lg transition shadow-2xs cursor-pointer ${
                          item.is_approved
                            ? 'bg-emerald-800 text-white hover:bg-emerald-900'
                            : 'bg-white text-stone-700 hover:bg-stone-100 border border-stone-300'
                        }`}
                      >
                        <Check className={`w-3.5 h-3.5 ${item.is_approved ? 'text-white' : 'text-stone-400'}`} />
                        <span>{item.is_approved ? 'Approved' : 'Approve'}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
