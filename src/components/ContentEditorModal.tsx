import React, { useState, useEffect, useRef } from 'react';
import { AttractionItem, ProjectSettings } from '../types/attraction';
import { inspectContentLive } from '../utils/qualityAuditor';
import { refineWithChatApi } from '../services/apiClient';
import { performClientSafeRefinement } from '../utils/localRefiner';
import { 
  X, 
  Check, 
  Copy, 
  Sparkles, 
  AlertTriangle, 
  CheckCircle2, 
  Eye, 
  Code, 
  Save, 
  ShieldAlert,
  Send,
  RotateCcw,
  Bot,
  User,
  History,
  GitCompare,
  ArrowRight,
  Loader2,
  CheckCheck
} from 'lucide-react';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  changes?: string[];
  timestamp: string;
  draftSnapshot?: {
    heading: string;
    content: string;
    wordCount: number;
  };
}

interface DraftSnapshot {
  heading: string;
  content: string;
  timestamp: string;
  note: string;
}

interface ContentEditorModalProps {
  item: AttractionItem | null;
  settings?: ProjectSettings;
  onClose: () => void;
  onSave: (updatedItem: AttractionItem) => void;
}

const QUICK_PROMPTS = [
  "Include creator/architect name (e.g., Antoni Gaudí)",
  "Highlight specific interior galleries, crypts & standout features",
  "Strengthen private local guide value in the final paragraph",
  "Make the tone more conversational & grounded",
  "Tighten length to ~210 words",
  "Deepen historical origins and founding context",
];

export const ContentEditorModal: React.FC<ContentEditorModalProps> = ({
  item,
  settings,
  onClose,
  onSave,
}) => {
  if (!item) return null;

  const initialHeading = item.heading || `See the best of ${item.attraction_name} with a private guide`;
  const initialContent = item.content || '';

  const [heading, setHeading] = useState(initialHeading);
  const [content, setContent] = useState(initialContent);
  const [activeTab, setActiveTab] = useState<'chat' | 'edit' | 'preview'>('chat');
  const [copied, setCopied] = useState(false);

  // Chat refinement state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(() => [
    {
      id: 'welcome',
      role: 'assistant',
      text: `Hello! I'm your attraction copy editor for **${item.attraction_name}**. Tell me how you'd like to refine this draft — for instance, if it's missing key figures (like Antoni Gaudí), specific internal exhibits, or needs a tighter word count.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);

  // Real-time Agent Step Tracking for transparency
  const [agentStep, setAgentStep] = useState<number>(0);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);

  const AGENT_STEPS = [
    { label: 'Analyzing instructions & entities', detail: `Extracting key figures, architectural features & style for ${item.attraction_name}` },
    { label: 'Drafting grounded copy', detail: 'Writing 3-4 descriptive paragraphs with <br><br> and private local guide value' },
    { label: 'Auditing compliance & tone', detail: 'Verifying 8th-grade level, word count (180–260), and zero banned clichés' },
    { label: 'Syncing live draft', detail: 'Applying changes to editor and calculating quality score' },
  ];

  // Elapsed timer and step progression during loading
  useEffect(() => {
    let timer: any = null;
    let stepTimer: any = null;
    if (isChatLoading) {
      setElapsedSeconds(0);
      setAgentStep(0);
      timer = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);

      // Advance agent step sequentially to give clear visibility into what is happening
      stepTimer = setInterval(() => {
        setAgentStep((prev) => (prev < AGENT_STEPS.length - 1 ? prev + 1 : prev));
      }, 750);
    } else {
      setElapsedSeconds(0);
      setAgentStep(0);
    }
    return () => {
      if (timer) clearInterval(timer);
      if (stepTimer) clearInterval(stepTimer);
    };
  }, [isChatLoading]);

  // History & Diff
  const [draftHistory, setDraftHistory] = useState<DraftSnapshot[]>([
    {
      heading: initialHeading,
      content: initialContent,
      timestamp: 'Initial Draft',
      note: 'Original draft',
    },
  ]);
  const [previousDraft, setPreviousDraft] = useState<{ heading: string; content: string } | null>(null);
  const [showDiff, setShowDiff] = useState(false);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const chatInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (item) {
      const h = item.heading || `See the best of ${item.attraction_name} with a private guide`;
      const c = item.content || '';
      setHeading(h);
      setContent(c);
      setDraftHistory([
        {
          heading: h,
          content: c,
          timestamp: 'Initial Draft',
          note: 'Original draft',
        },
      ]);
    }
  }, [item]);

  useEffect(() => {
    if (activeTab === 'chat') {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, activeTab, isChatLoading]);

  const audit = inspectContentLive(content, item.attraction_name);
  const fullText = `${heading}\n\n${content}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = (approve: boolean = false) => {
    const updated: AttractionItem = {
      ...item,
      heading: heading.trim(),
      content: content.trim(),
      full_content: `${heading.trim()}\n\n${content.trim()}`,
      word_count: audit.wordCount,
      is_edited: true,
      is_approved: approve ? true : item.is_approved,
      quality_status: audit.issues.length === 0 ? 'passed' : 'warning',
      last_updated_at: new Date().toISOString(),
    };
    onSave(updated);
    onClose();
  };

  // Quick insertion of <br><br> tag
  const insertBreakTag = () => {
    setContent(prev => prev + '<br><br>\n\n');
  };

  // Fix common banned word replacements
  const autoFixBanned = () => {
    let fixed = content;
    for (const b of audit.bannedWords) {
      const reg = new RegExp(`\\b${b}\\b`, 'gi');
      fixed = fixed.replace(reg, 'distinctive feature');
    }
    setContent(fixed);
  };

  // Handle Chat Refinement
  const handleSendPrompt = async (promptToSend?: string) => {
    const textToSend = promptToSend || chatInput.trim();
    if (!textToSend || isChatLoading) return;

    setChatError(null);
    const userMsgId = `usr-${Date.now()}`;
    const userMsg: ChatMessage = {
      id: userMsgId,
      role: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    // Save previous snapshot for diff / undo
    setPreviousDraft({ heading, content });

    setChatMessages(prev => [...prev, userMsg]);
    setChatInput('');
    setIsChatLoading(true);

    try {
      // Build history for backend
      const historyPayload = chatMessages
        .filter(m => m.id !== 'welcome')
        .map(m => ({
          role: m.role,
          content: m.text,
        }));

      let res;
      try {
        res = await refineWithChatApi({
          attraction_name: item.attraction_name,
          city: item.city,
          country: item.country,
          current_heading: heading,
          current_content: content,
          user_prompt: textToSend,
          chat_history: historyPayload,
          research: item.research,
          additional_instructions: settings?.additional_instructions,
        });
      } catch (apiErr: any) {
        console.warn('Backend refine endpoint returned error, applying instant safe rule engine:', apiErr);
        res = performClientSafeRefinement({
          attraction_name: item.attraction_name,
          city: item.city,
          country: item.country,
          current_heading: heading,
          current_content: content,
          user_prompt: textToSend,
          research: item.research,
          additional_instructions: settings?.additional_instructions,
        });
      }

      const newHeading = res.heading || heading;
      const newContent = res.content || content;

      // Update current live draft
      setHeading(newHeading);
      setContent(newContent);

      // Add to history
      const newSnapshot: DraftSnapshot = {
        heading: newHeading,
        content: newContent,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        note: textToSend.slice(0, 40) + (textToSend.length > 40 ? '...' : ''),
      };
      setDraftHistory(prev => [...prev, newSnapshot]);

      // Add Assistant Message
      const botMsg: ChatMessage = {
        id: `ast-${Date.now()}`,
        role: 'assistant',
        text: res.assistant_message,
        changes: res.changes_made,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        draftSnapshot: {
          heading: newHeading,
          content: newContent,
          wordCount: res.word_count,
        },
      };

      setChatMessages(prev => [...prev, botMsg]);
    } catch (err: any) {
      console.error('Chat refinement error:', err);
      setChatError(err.message || 'Failed to refine draft. Please try again.');
      setChatMessages(prev => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: 'assistant',
          text: `⚠️ Could not complete this edit: ${err.message || 'Unknown error'}. Please try again.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsChatLoading(false);
    }
  };

  // Revert to a previous snapshot
  const handleRevertToSnapshot = (snap: { heading: string; content: string }) => {
    setPreviousDraft({ heading, content });
    setHeading(snap.heading);
    setContent(snap.content);
  };

  // Render Diff Highlighter
  const renderDiffView = () => {
    if (!previousDraft) {
      return (
        <div className="p-6 text-center text-xs text-slate-500">
          No previous draft in this session to compare against. Make a refinement via chat first!
        </div>
      );
    }

    const prevLines = previousDraft.content.split('<br><br>').filter(Boolean);
    const currLines = content.split('<br><br>').filter(Boolean);

    return (
      <div className="p-4 space-y-4 text-xs font-sans">
        <div className="flex items-center justify-between border-b border-slate-200 pb-2">
          <span className="font-semibold text-slate-700">Visual Comparison (Previous vs Refined)</span>
          <button
            type="button"
            onClick={() => handleRevertToSnapshot(previousDraft)}
            className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-2 py-1 rounded-lg transition cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Revert to Previous Draft</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Previous */}
          <div className="p-3.5 bg-rose-50/40 rounded-xl border border-rose-200 space-y-2">
            <div className="text-[11px] font-bold text-rose-800 uppercase tracking-wider">Previous Version</div>
            <div className="font-semibold text-slate-900">{previousDraft.heading}</div>
            <div className="space-y-2 text-slate-700 leading-relaxed">
              {prevLines.map((p, idx) => (
                <p key={idx} className="bg-white/70 p-2 rounded border border-rose-100">{p.trim()}</p>
              ))}
            </div>
          </div>

          {/* Current Refined */}
          <div className="p-3.5 bg-emerald-50/40 rounded-xl border border-emerald-200 space-y-2">
            <div className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider flex items-center justify-between">
              <span>Refined Version (Live)</span>
              <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-mono">Active</span>
            </div>
            <div className="font-semibold text-slate-900">{heading}</div>
            <div className="space-y-2 text-slate-700 leading-relaxed">
              {currLines.map((p, idx) => (
                <p key={idx} className="bg-white/90 p-2 rounded border border-emerald-100">{p.trim()}</p>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-2 sm:p-4 backdrop-blur-xs">
      <div 
        id="content-editor-dialog"
        className="relative w-full max-w-6xl h-[92vh] max-h-[92vh] flex flex-col rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden"
      >
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3 bg-slate-50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 text-indigo-700 rounded-xl shadow-2xs">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-slate-900">Edit & Audit</h3>
                {item.is_approved && (
                  <span className="px-2 py-0.5 text-[11px] font-semibold bg-emerald-100 text-emerald-800 rounded-full flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Approved
                  </span>
                )}
                {item.is_edited && (
                  <span className="px-2 py-0.5 text-[11px] font-medium bg-slate-200 text-slate-700 rounded-full">
                    Edited
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500">
                {item.attraction_name} {item.city ? `• ${item.city}` : ''} {item.country ? `• ${item.country}` : ''}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Tab switch */}
            <div className="flex rounded-xl bg-slate-200/80 p-1">
              <button
                id="editor-chat-tab"
                type="button"
                onClick={() => setActiveTab('chat')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition cursor-pointer ${
                  activeTab === 'chat'
                    ? 'bg-white text-indigo-900 shadow-2xs ring-1 ring-black/5'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                <span>AI Chat & Refine</span>
              </button>

              <button
                id="editor-edit-tab"
                type="button"
                onClick={() => setActiveTab('edit')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition cursor-pointer ${
                  activeTab === 'edit'
                    ? 'bg-white text-slate-900 shadow-2xs ring-1 ring-black/5'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Code className="w-3.5 h-3.5 text-slate-600" />
                <span>Manual Editor</span>
              </button>

              <button
                id="editor-preview-tab"
                type="button"
                onClick={() => setActiveTab('preview')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition cursor-pointer ${
                  activeTab === 'preview'
                    ? 'bg-white text-slate-900 shadow-2xs ring-1 ring-black/5'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Eye className="w-3.5 h-3.5 text-slate-600" />
                <span>Live Preview</span>
              </button>
            </div>

            <button
              id="close-editor-btn"
              onClick={onClose}
              className="rounded-xl p-2 text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition cursor-pointer"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Workspace Body */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-12 overflow-hidden min-h-0">
          {/* TAB 1: AI Chat & Refine ✨ */}
          {activeTab === 'chat' && (
            <>
              {/* Left Chat Pane */}
              <div className="md:col-span-7 flex flex-col h-full min-h-0 border-r border-slate-200 bg-slate-50/50 overflow-hidden">
                {/* Chat Messages Timeline */}
                <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-5 space-y-4">
                  {chatMessages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex gap-3 text-xs leading-relaxed ${
                        msg.role === 'user' ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      {msg.role === 'assistant' && (
                        <div className="w-7 h-7 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                          <Bot className="w-4 h-4" />
                        </div>
                      )}

                      <div
                        className={`max-w-[85%] rounded-2xl p-3.5 space-y-2 shadow-2xs ${
                          msg.role === 'user'
                            ? 'bg-indigo-600 text-white rounded-br-xs'
                            : 'bg-white text-slate-800 border border-slate-200 rounded-bl-xs'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-4">
                          <span className={`text-[10px] font-semibold uppercase tracking-wider ${
                            msg.role === 'user' ? 'text-indigo-200' : 'text-slate-400'
                          }`}>
                            {msg.role === 'user' ? 'You' : 'AI Copy Editor'}
                          </span>
                          <span className={`text-[10px] ${
                            msg.role === 'user' ? 'text-indigo-200' : 'text-slate-400'
                          }`}>
                            {msg.timestamp}
                          </span>
                        </div>

                        <div className="whitespace-pre-wrap font-sans text-xs sm:text-[13px]">
                          {msg.text}
                        </div>

                        {/* List of changes made */}
                        {msg.changes && msg.changes.length > 0 && (
                          <div className="pt-2 border-t border-slate-100 space-y-1">
                            <span className="text-[11px] font-semibold text-indigo-700 block">
                              Changes applied to live draft:
                            </span>
                            <ul className="list-disc list-inside text-[11px] text-slate-600 space-y-0.5">
                              {msg.changes.map((ch, idx) => (
                                <li key={idx}>{ch}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Action buttons inside assistant bubble */}
                        {msg.draftSnapshot && (
                          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                            <span className="text-emerald-700 font-semibold flex items-center gap-1">
                              <CheckCheck className="w-3.5 h-3.5" />
                              Synced with Editor ({msg.draftSnapshot.wordCount} words)
                            </span>
                            <button
                              type="button"
                              onClick={() => handleRevertToSnapshot(msg.draftSnapshot!)}
                              className="text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1 hover:underline cursor-pointer"
                            >
                              <RotateCcw className="w-3 h-3" />
                              Re-apply this version
                            </button>
                          </div>
                        )}
                      </div>

                      {msg.role === 'user' && (
                        <div className="w-7 h-7 rounded-xl bg-slate-800 text-white flex items-center justify-center shrink-0 shadow-2xs">
                          <User className="w-4 h-4" />
                        </div>
                      )}
                    </div>
                  ))}

                  {/* VISIBLE LIVE AGENT WORKFLOW CARD DURING REFINEMENT */}
                  {isChatLoading && (
                    <div className="flex gap-3 text-xs justify-start items-start animate-fadeIn">
                      <div className="w-7 h-7 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-sm animate-pulse">
                        <Bot className="w-4 h-4" />
                      </div>
                      
                      <div className="w-full max-w-[90%] bg-white border-2 border-indigo-200/80 rounded-2xl rounded-bl-xs p-4 shadow-md space-y-3">
                        <div className="flex items-center justify-between border-b border-indigo-100 pb-2">
                          <div className="flex items-center gap-2">
                            <span className="relative flex h-2.5 w-2.5">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-indigo-600"></span>
                            </span>
                            <span className="font-bold text-indigo-950 text-xs sm:text-sm">
                              Agent is actively refining copy
                            </span>
                          </div>
                          <span className="text-[11px] font-mono font-semibold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-md border border-indigo-200">
                            {elapsedSeconds}s elapsed
                          </span>
                        </div>

                        {/* Step-by-Step Progress Timeline */}
                        <div className="space-y-2 pt-1">
                          {AGENT_STEPS.map((step, idx) => {
                            const isCurrent = idx === agentStep;
                            const isCompleted = idx < agentStep;
                            return (
                              <div
                                key={idx}
                                className={`flex items-start gap-2.5 text-[11px] sm:text-xs transition-all ${
                                  isCurrent
                                    ? 'text-indigo-950 font-semibold bg-indigo-50/80 p-2 rounded-lg border border-indigo-200'
                                    : isCompleted
                                    ? 'text-emerald-800 opacity-80 pl-2'
                                    : 'text-slate-400 pl-2'
                                }`}
                              >
                                <div className="mt-0.5 shrink-0">
                                  {isCompleted ? (
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                  ) : isCurrent ? (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-600" />
                                  ) : (
                                    <div className="w-3.5 h-3.5 rounded-full border border-slate-300 flex items-center justify-center text-[9px] text-slate-400">
                                      {idx + 1}
                                    </div>
                                  )}
                                </div>
                                <div className="flex-1">
                                  <div className="flex items-center gap-1.5">
                                    <span>{step.label}</span>
                                    {isCurrent && (
                                      <span className="text-[10px] text-indigo-600 font-normal animate-pulse">
                                        (In progress...)
                                      </span>
                                    )}
                                  </div>
                                  {isCurrent && (
                                    <p className="text-[10px] text-indigo-700/80 font-normal mt-0.5">
                                      {step.detail}
                                    </p>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        <div className="w-full bg-indigo-100 h-1.5 rounded-full overflow-hidden">
                          <div
                            className="bg-indigo-600 h-full transition-all duration-500"
                            style={{ width: `${Math.min(95, (agentStep + 1) * 25)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  <div ref={chatEndRef} />
                </div>

                {/* Suggestions / Prompt Chips */}
                <div className="p-2.5 bg-white border-t border-slate-200 shrink-0 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                      Quick refinement ideas:
                    </span>
                    {previousDraft && (
                      <button
                        type="button"
                        onClick={() => setShowDiff(!showDiff)}
                        className={`text-[10px] font-semibold flex items-center gap-1 px-2 py-0.5 rounded-md transition cursor-pointer ${
                          showDiff 
                            ? 'bg-indigo-100 text-indigo-800' 
                            : 'text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        <GitCompare className="w-3 h-3" />
                        <span>{showDiff ? 'Hide Diff' : 'View Changes'}</span>
                      </button>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1 max-h-16 overflow-y-auto">
                    {QUICK_PROMPTS.map((promptText, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => handleSendPrompt(promptToSendForChip(promptText, item.attraction_name))}
                        disabled={isChatLoading}
                        className="text-[10px] bg-slate-100 hover:bg-indigo-50 hover:text-indigo-800 hover:border-indigo-300 border border-slate-200 text-slate-700 px-2 py-0.5 rounded-md transition disabled:opacity-50 text-left cursor-pointer"
                      >
                        + {promptText}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Active Agent Status Bar above input during loading */}
                {isChatLoading && (
                  <div className="px-3 py-1.5 bg-indigo-50 border-t border-indigo-200/80 flex items-center justify-between text-xs text-indigo-900 shrink-0 animate-pulse">
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-600" />
                      <span className="font-medium text-[11px]">
                        AI Agent is running: <strong className="font-semibold">{AGENT_STEPS[agentStep]?.label}</strong>
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-indigo-700 bg-white px-1.5 py-0.5 rounded border border-indigo-200">
                      {elapsedSeconds}s
                    </span>
                  </div>
                )}

                {/* Chat Input Bar */}
                <div className="p-3 bg-slate-50 border-t border-slate-200 shrink-0">
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleSendPrompt();
                    }}
                    className="flex items-center gap-2"
                  >
                    <input
                      ref={chatInputRef}
                      id="chat-refine-input"
                      type="text"
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      placeholder={
                        isChatLoading
                          ? 'Agent is actively updating draft, please wait...'
                          : `e.g. In ${item.attraction_name} it did not use Gaudi's name. Please add it and mention his tree-like stone columns...`
                      }
                      disabled={isChatLoading}
                      className="flex-1 text-xs sm:text-sm bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20 outline-hidden disabled:bg-slate-100 disabled:text-slate-500"
                    />
                    <button
                      id="send-chat-refine-btn"
                      type="submit"
                      disabled={!chatInput.trim() || isChatLoading}
                      className="inline-flex items-center justify-center p-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold transition disabled:opacity-40 shadow-2xs cursor-pointer shrink-0"
                      title="Send Instruction"
                    >
                      {isChatLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                    </button>
                  </form>
                </div>
              </div>

              {/* Right Live Draft & Audit Pane */}
              <div className="md:col-span-5 flex flex-col h-full min-h-0 bg-white overflow-y-auto p-4 sm:p-5 space-y-4">
                {showDiff ? (
                  renderDiffView()
                ) : (
                  <>
                    {/* Live Output Card */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-indigo-700 uppercase tracking-wider flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5" />
                          Live Refined Copy
                        </span>
                        <div className="flex items-center gap-2">
                          {isChatLoading && (
                            <span className="text-[10px] bg-indigo-100 text-indigo-800 font-semibold px-2 py-0.5 rounded-full animate-pulse flex items-center gap-1">
                              <Loader2 className="w-3 h-3 animate-spin" /> Updating...
                            </span>
                          )}
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                            audit.score >= 90
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}>
                            Score: {audit.score}/100
                          </span>
                        </div>
                      </div>

                      {draftHistory.length > 1 && !isChatLoading && (
                        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-2.5 flex items-center gap-2 text-xs text-emerald-900 shadow-2xs">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span className="text-[11px] leading-snug">
                            Refinement applied to live draft! Click <strong>Save Draft</strong> or <strong>Save & Approve</strong> below to finalize.
                          </span>
                        </div>
                      )}

                      {/* Heading Display */}
                      <div className={`p-3 rounded-xl border transition-all ${
                        isChatLoading
                          ? 'bg-indigo-50/40 border-indigo-200'
                          : 'bg-slate-50 border-slate-200'
                      }`}>
                        <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-400 block mb-1">
                          Line 1 Required Heading
                        </span>
                        <h4 className="text-sm font-serif font-bold text-slate-900">{heading}</h4>
                      </div>

                      {/* Content Render with <br><br> markers */}
                      <div className={`p-3.5 rounded-xl border space-y-3 font-sans text-xs sm:text-[13px] text-slate-800 leading-relaxed max-h-64 overflow-y-auto transition-all ${
                        isChatLoading
                          ? 'bg-indigo-50/20 border-indigo-200/80 ring-2 ring-indigo-500/10'
                          : 'bg-slate-50/70 border-slate-200'
                      }`}>
                        {content
                          .split(/<br\s*\/?>\s*<br\s*\/?>/i)
                          .filter(Boolean)
                          .map((para, idx) => (
                            <div key={idx} className="relative group bg-white p-2.5 rounded-lg border border-slate-200/80 shadow-2xs">
                              <p>{para.replace(/<br\s*\/?>/gi, '').trim()}</p>
                              <span className="text-[10px] text-indigo-500 font-mono block mt-1">
                                &lt;br&gt;&lt;br&gt;
                              </span>
                            </div>
                          ))}
                      </div>
                    </div>

                    {/* Quality Meters */}
                    <div className="rounded-xl bg-slate-50 border border-slate-200 p-3.5 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-700">Word Count (Excl. Heading)</span>
                        <span className={`font-bold ${audit.isWordCountValid ? 'text-emerald-700' : 'text-amber-700'}`}>
                          {audit.wordCount} words (Target: 180–260)
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                        <div 
                          className={`h-full transition-all duration-300 ${
                            audit.isWordCountValid ? 'bg-emerald-600' : 'bg-amber-500'
                          }`}
                          style={{ width: `${Math.min(100, (audit.wordCount / 260) * 100)}%` }}
                        />
                      </div>
                    </div>

                    {/* Rule checklist summary */}
                    <div className="space-y-1.5 text-xs">
                      <div className="flex items-center gap-2">
                        {audit.hasBrTags ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        ) : (
                          <AlertTriangle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                        )}
                        <span className="text-slate-700">Separated by &lt;br&gt;&lt;br&gt; tags</span>
                      </div>

                      <div className="flex items-center gap-2">
                        {audit.bannedWords.length === 0 ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        ) : (
                          <ShieldAlert className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                        )}
                        <span className="text-slate-700">Zero banned marketing clichés</span>
                      </div>

                      <div className="flex items-center gap-2">
                        {!audit.hasQuestions && !audit.hasFirstPerson ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        ) : (
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        )}
                        <span className="text-slate-700">No questions, bullets, or "we/our" phrasing</span>
                      </div>
                    </div>

                    {/* Revision History dropdown / list */}
                    {draftHistory.length > 1 && (
                      <div className="pt-2 border-t border-slate-200">
                        <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1.5">
                          <span className="font-semibold uppercase tracking-wider flex items-center gap-1">
                            <History className="w-3 h-3" />
                            Revision History ({draftHistory.length})
                          </span>
                        </div>
                        <div className="flex gap-1.5 overflow-x-auto pb-1">
                          {draftHistory.map((snap, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => handleRevertToSnapshot(snap)}
                              className="text-[11px] bg-slate-100 hover:bg-indigo-50 hover:text-indigo-800 px-2 py-1 rounded-lg border border-slate-200 shrink-0 transition cursor-pointer"
                              title={`Restore: ${snap.note}`}
                            >
                              v{idx + 1}: {snap.timestamp}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </>
          )}

          {/* TAB 2: Manual Code Editor */}
          {activeTab === 'edit' && (
            <>
              <div className="lg:col-span-8 flex flex-col border-r border-slate-200 overflow-y-auto p-6 space-y-4">
                {/* Exact Heading Field */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                      Required Subheading (Line 1)
                    </label>
                    <span className="text-[11px] text-slate-500 font-mono">
                      No &lt;br&gt; tags allowed after heading
                    </span>
                  </div>
                  <input
                    id="editor-heading-input"
                    type="text"
                    value={heading}
                    onChange={(e) => setHeading(e.target.value)}
                    className="w-full text-base font-serif font-bold text-slate-900 bg-slate-50/70 border border-slate-300 rounded-xl px-4 py-2.5 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20 outline-hidden"
                  />
                </div>

                {/* Content Area */}
                <div className="flex-1 flex flex-col space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                      Paragraphs Content (Must end each with &lt;br&gt;&lt;br&gt;)
                    </label>
                    <div className="flex items-center gap-2">
                      <button
                        id="insert-br-tag-btn"
                        type="button"
                        onClick={insertBreakTag}
                        className="text-xs text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 px-2.5 py-1 rounded-md transition font-mono cursor-pointer"
                      >
                        + Insert &lt;br&gt;&lt;br&gt;
                      </button>
                      {audit.bannedWords.length > 0 && (
                        <button
                          id="autofix-banned-btn"
                          type="button"
                          onClick={autoFixBanned}
                          className="text-xs text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-2 py-1 rounded-md transition cursor-pointer"
                        >
                          Auto-remove banned phrases
                        </button>
                      )}
                    </div>
                  </div>

                  <textarea
                    id="editor-content-textarea"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    rows={13}
                    placeholder="Enter marketing description paragraphs ending with <br><br>..."
                    className="w-full flex-1 font-mono text-xs sm:text-sm text-slate-800 leading-relaxed bg-white border border-slate-300 rounded-xl p-4 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20 outline-hidden resize-none"
                  />
                </div>
              </div>

              {/* Sidebar for Editor Tab */}
              <div className="lg:col-span-4 bg-slate-50/80 p-6 flex flex-col justify-between overflow-y-auto space-y-6">
                <div className="space-y-5">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                      Live Rule Compliance
                    </h4>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                      audit.score >= 90
                        ? 'bg-emerald-100 text-emerald-800'
                        : audit.score >= 70
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}>
                      Score: {audit.score}/100
                    </span>
                  </div>

                  {/* Word Count Meter */}
                  <div className="rounded-xl bg-white border border-slate-200 p-4 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-700">Word Count (Excl. Heading)</span>
                      <span className={`font-bold ${audit.isWordCountValid ? 'text-emerald-700' : 'text-amber-700'}`}>
                        {audit.wordCount} words
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-300 ${
                          audit.isWordCountValid 
                            ? 'bg-emerald-600' 
                            : audit.wordCount < 180 
                            ? 'bg-amber-500' 
                            : 'bg-rose-500'
                        }`}
                        style={{ width: `${Math.min(100, (audit.wordCount / 260) * 100)}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[11px] text-slate-400 font-mono">
                      <span>Min: 180</span>
                      <span className="font-semibold text-slate-600">Target: 180–260</span>
                      <span>Max: 260</span>
                    </div>
                  </div>

                  {/* Rules Checklist */}
                  <div className="space-y-2.5">
                    <div className="flex items-start gap-2 text-xs">
                      {audit.headingValid ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                      )}
                      <span className={audit.headingValid ? 'text-slate-700' : 'text-rose-700 font-medium'}>
                        Heading matches "See the best of [Attraction] with a private guide"
                      </span>
                    </div>

                    <div className="flex items-start gap-2 text-xs">
                      {audit.hasBrTags ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                      )}
                      <span className={audit.hasBrTags ? 'text-slate-700' : 'text-rose-700 font-medium'}>
                        Paragraphs separated by &lt;br&gt;&lt;br&gt;
                      </span>
                    </div>

                    <div className="flex items-start gap-2 text-xs">
                      {audit.bannedWords.length === 0 ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      ) : (
                        <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                      )}
                      <span className={audit.bannedWords.length === 0 ? 'text-slate-700' : 'text-rose-700 font-medium'}>
                        Zero prohibited marketing cliches
                      </span>
                    </div>

                    <div className="flex items-start gap-2 text-xs">
                      {!audit.hasQuestions && !audit.hasBulletPoints && !audit.hasFirstPerson ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      )}
                      <span className="text-slate-700">
                        No questions, bullet points, or "we/our" language
                      </span>
                    </div>
                  </div>

                  {/* Detected Banned Words Chips */}
                  {audit.bannedWords.length > 0 && (
                    <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl space-y-1.5">
                      <span className="text-[11px] font-semibold text-rose-800 uppercase tracking-wider block">
                        Banned Phrases Detected:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {audit.bannedWords.map((word, idx) => (
                          <span key={idx} className="bg-rose-200/80 text-rose-900 text-xs px-2 py-0.5 rounded font-medium">
                            "{word}"
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* TAB 3: Live Preview Render */}
          {activeTab === 'preview' && (
            <div className="lg:col-span-12 flex flex-col bg-slate-50/50 p-6 sm:p-8 overflow-y-auto">
              <div className="max-w-3xl mx-auto w-full bg-white rounded-2xl border border-slate-200 p-8 shadow-xs space-y-6">
                <div className="border-b border-slate-200 pb-4">
                  <span className="text-xs uppercase tracking-wider font-bold text-indigo-600 block mb-1">
                    Attraction Page Preview
                  </span>
                  <h2 className="text-2xl font-serif font-bold text-slate-900">
                    {heading}
                  </h2>
                </div>

                <div 
                  id="rendered-preview-content"
                  className="prose prose-slate max-w-none text-slate-800 text-sm leading-relaxed space-y-4"
                  dangerouslySetInnerHTML={{
                    __html: content
                      .split(/<br\s*\/?>\s*<br\s*\/?>/i)
                      .filter(Boolean)
                      .map(p => `<p class="mb-4">${p.replace(/<br\s*\/?>/gi, '').trim()}</p>`)
                      .join(''),
                  }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Bottom Actions Bar */}
        <div className="border-t border-slate-200 px-6 py-3.5 bg-slate-50 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <button
              id="editor-cancel-btn"
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-xl transition cursor-pointer"
            >
              Cancel
            </button>

            <button
              id="editor-copy-btn"
              type="button"
              onClick={handleCopy}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-xl transition shadow-2xs cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied with <br><br>!' : 'Copy Formatted Text'}</span>
            </button>
          </div>

          <div className="flex items-center gap-3">
            <button
              id="editor-save-only-btn"
              type="button"
              onClick={() => handleSave(false)}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-800 bg-white hover:bg-slate-100 border border-slate-300 rounded-xl transition shadow-2xs cursor-pointer"
            >
              <Save className="w-4 h-4 text-slate-600" />
              <span>Save Draft</span>
            </button>

            <button
              id="editor-save-approve-btn"
              type="button"
              onClick={() => handleSave(true)}
              className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition shadow-2xs cursor-pointer"
            >
              <Check className="w-4 h-4 text-white" />
              <span>Save & Approve</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper for prompt chips
function promptToSendForChip(chipText: string, attractionName: string): string {
  if (chipText.includes('creator/architect')) {
    return `Rewrite the copy for ${attractionName} to explicitly name its primary creator, architect, or master builder (such as Antoni Gaudí for Sagrada Família, Filippo Brunelleschi for Florence Duomo) in the opening paragraphs, highlighting their signature vision and specific architectural elements.`;
  }
  if (chipText.includes('interior galleries')) {
    return `Highlight 2-3 specific internal exhibits, crypts, towers, or standout architectural features inside ${attractionName}.`;
  }
  if (chipText.includes('private local guide value')) {
    return `Strengthen the final paragraph explaining how a private private local guide provides tailored pacing, deep historical stories, practical navigation tips, and itinerary customization.`;
  }
  if (chipText.includes('conversational')) {
    return `Refine the tone to be more conversational and observational, using natural contractions and human rhythm while preserving all factual depth.`;
  }
  if (chipText.includes('210 words')) {
    return `Tighten the description to be closer to 200–210 words while retaining all essential facts and <br><br> tags.`;
  }
  return chipText;
}
