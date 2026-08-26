import React, { useState, useRef } from 'react';
import { AttractionItem, ProjectSettings } from '../types/attraction';
import { parseCSV, normalizeCSVRows, parsePastedText } from '../utils/csvHelper';
import { SAMPLE_ATTRACTIONS } from '../utils/sampleData';
import { 
  Plus, 
  Trash2, 
  Upload, 
  Clipboard, 
  AlertTriangle, 
  Play, 
  Square, 
  Sparkles, 
  FileSpreadsheet, 
  HelpCircle, 
  CheckSquare, 
  Square as SquareIcon,
  RefreshCw,
  Info,
  Layers,
  ArrowRight
} from 'lucide-react';

interface AttractionsTabProps {
  items: AttractionItem[];
  settings: ProjectSettings;
  isGenerating: boolean;
  onUpdateItems: (items: AttractionItem[]) => void;
  onUpdateSettings: (settings: ProjectSettings) => void;
  onGenerateAll: () => void;
  onGenerateSelected: () => void;
  onGenerateItem: (item: AttractionItem) => void;
  onStopGeneration: () => void;
  onNavigateToGenerated: () => void;
}

export const AttractionsTab: React.FC<AttractionsTabProps> = ({
  items,
  settings,
  isGenerating,
  onUpdateItems,
  onUpdateSettings,
  onGenerateAll,
  onGenerateSelected,
  onGenerateItem,
  onStopGeneration,
  onNavigateToGenerated,
}) => {
  const [importMode, setImportMode] = useState<'paste' | 'csv'>('paste');
  const [pasteInput, setPasteInput] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [editingRowId, setEditingRowId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // New row input state
  const [newRow, setNewRow] = useState({
    attraction_name: '',
    city: '',
    country: '',
    attraction_url: '',
    notes: '',
  });

  const selectedCount = items.filter((i) => i.selected).length;
  const completedCount = items.filter((i) => i.status === 'complete').length;

  const handleAddSingleRow = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRow.attraction_name.trim()) return;

    const newItem: AttractionItem = {
      id: crypto.randomUUID(),
      attraction_name: newRow.attraction_name.trim(),
      city: newRow.city.trim() || undefined,
      country: newRow.country.trim() || undefined,
      attraction_url: newRow.attraction_url.trim() || undefined,
      notes: newRow.notes.trim() || undefined,
      status: 'waiting',
      selected: true,
    };

    onUpdateItems([newItem, ...items]);
    setNewRow({
      attraction_name: '',
      city: '',
      country: '',
      attraction_url: '',
      notes: '',
    });
  };

  const handlePasteSubmit = () => {
    if (!pasteInput.trim()) return;
    const parsed = parsePastedText(pasteInput);
    if (parsed.length === 0) return;

    const newItems: AttractionItem[] = parsed.map((p) => ({
      id: crypto.randomUUID(),
      attraction_name: p.attraction_name || 'Unnamed Attraction',
      city: p.city || undefined,
      country: p.country || undefined,
      attraction_url: p.attraction_url || undefined,
      notes: p.notes || undefined,
      status: 'waiting',
      selected: true,
    }));

    onUpdateItems([...items, ...newItems]);
    setPasteInput('');
  };

  const handleFileUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (!text) return;
      try {
        const rawRows = parseCSV(text);
        const normalized = normalizeCSVRows(rawRows);
        if (normalized.length === 0) {
          alert('Could not detect valid attraction rows from CSV. Please ensure you have an attraction_name column.');
          return;
        }

        const newItems: AttractionItem[] = normalized.map((p) => ({
          id: crypto.randomUUID(),
          attraction_name: p.attraction_name || 'Unnamed Attraction',
          city: p.city || undefined,
          country: p.country || undefined,
          attraction_url: p.attraction_url || undefined,
          notes: p.notes || undefined,
          status: 'waiting',
          selected: true,
        }));

        onUpdateItems([...items, ...newItems]);
      } catch (err) {
        console.error('CSV parse error:', err);
        alert('Failed to parse CSV file. Please check file format.');
      }
    };
    reader.readAsText(file);
  };

  const handleLoadSample = () => {
    const sampleItems: AttractionItem[] = SAMPLE_ATTRACTIONS.map((s) => ({
      id: crypto.randomUUID(),
      attraction_name: s.attraction_name || '',
      city: s.city,
      country: s.country,
      attraction_url: s.attraction_url,
      notes: s.notes,
      status: 'waiting',
      selected: true,
    }));
    onUpdateItems([...sampleItems]);
  };

  const handleDeleteItem = (id: string) => {
    onUpdateItems(items.filter((i) => i.id !== id));
  };

  const handleClearAll = () => {
    if (items.length === 0) return;
    if (window.confirm('Clear all attractions from the list?')) {
      onUpdateItems([]);
    }
  };

  const handleToggleSelectAll = () => {
    const allSelected = items.every((i) => i.selected);
    onUpdateItems(items.map((i) => ({ ...i, selected: !allSelected })));
  };

  const handleToggleSelect = (id: string) => {
    onUpdateItems(
      items.map((i) => (i.id === id ? { ...i, selected: !i.selected } : i))
    );
  };

  const handleRowChange = (id: string, field: keyof AttractionItem, value: string) => {
    onUpdateItems(
      items.map((i) => (i.id === id ? { ...i, [field]: value } : i))
    );
  };

  const presetInstructions = [
    'Mention accessibility',
    'Focus more on history',
    'Avoid mentioning ticket prices',
    'Use Canadian spelling',
  ];

  const handleAddPresetInstruction = (preset: string) => {
    const current = settings.additional_instructions.trim();
    if (!current) {
      onUpdateSettings({ ...settings, additional_instructions: preset });
    } else if (!current.includes(preset)) {
      onUpdateSettings({ ...settings, additional_instructions: `${current}\n- ${preset}` });
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      {/* Top Banner: Workflow overview & Project Instructions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Additional writing instructions */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-600" />
              <h2 className="text-base font-semibold text-slate-900">
                Additional Writing Instructions (Project-level)
              </h2>
            </div>
            <span className="text-xs text-slate-600 bg-slate-100 px-2.5 py-1 rounded-full font-medium">
              Optional
            </span>
          </div>

          <p className="text-xs text-slate-500">
            Directives added here will apply to all attraction descriptions generated in this project:
          </p>

          <textarea
            id="project-additional-instructions-input"
            rows={3}
            value={settings.additional_instructions}
            onChange={(e) => onUpdateSettings({ ...settings, additional_instructions: e.target.value })}
            placeholder="e.g. Mention accessibility and wheelchair navigation. Focus heavily on architectural history. Avoid mentioning admission prices. Use Canadian spelling."
            className="w-full text-sm rounded-xl border border-slate-300 px-3.5 py-2.5 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20 outline-hidden bg-slate-50/50 resize-none font-sans"
          />

          {/* Quick preset chips */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="text-xs font-medium text-slate-600">Quick presets:</span>
            {presetInstructions.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => handleAddPresetInstruction(preset)}
                className="text-xs bg-slate-100 hover:bg-indigo-50 hover:text-indigo-800 hover:border-indigo-300 border border-slate-200 text-slate-700 px-2.5 py-1 rounded-lg transition cursor-pointer"
              >
                + {preset}
              </button>
            ))}
          </div>
        </div>

        {/* Right: Quick Action / Summary Box */}
        <div className="lg:col-span-4 bg-slate-900 text-white rounded-2xl p-6 shadow-xs flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-300 font-mono uppercase tracking-wider">
              <span>Workflow Engine</span>
              <span>Attraction Content Studio Copy</span>
            </div>
            <h3 className="text-lg font-serif font-bold text-white">
              {items.length} Attraction{items.length === 1 ? '' : 's'} in Queue
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Researches reliable web sources, formats verified internal highlights, applies strict Attraction Content Studio tone standards, and validates compliance.
            </p>
          </div>

          <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
            <div className="text-xs text-slate-300">
              {completedCount} of {items.length} completed
            </div>
            {completedCount > 0 && (
              <button
                type="button"
                onClick={onNavigateToGenerated}
                className="inline-flex items-center gap-1 text-xs font-semibold text-amber-400 hover:text-amber-300 transition cursor-pointer"
              >
                <span>View Results</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Import Attractions Section */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
          <div>
            <h3 className="text-base font-semibold text-slate-900">Import Attractions</h3>
            <p className="text-xs text-slate-500">
              Add attractions by pasting a list or uploading a CSV file.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="tab-import-paste-btn"
              type="button"
              onClick={() => setImportMode('paste')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium rounded-lg transition cursor-pointer ${
                importMode === 'paste'
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <Clipboard className="w-3.5 h-3.5" />
              <span>Paste List</span>
            </button>

            <button
              id="tab-import-csv-btn"
              type="button"
              onClick={() => setImportMode('csv')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium rounded-lg transition cursor-pointer ${
                importMode === 'csv'
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Upload CSV</span>
            </button>

            <button
              id="load-sample-attractions-btn"
              type="button"
              onClick={handleLoadSample}
              className="text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-3 py-1.5 rounded-lg transition cursor-pointer"
            >
              Load Sample Data
            </button>
          </div>
        </div>

        {/* Import Mode 1: Paste a List */}
        {importMode === 'paste' ? (
          <div className="space-y-4">
            <div className="rounded-xl bg-amber-50/70 border border-amber-200/80 p-3.5 flex items-start gap-2.5 text-xs text-amber-900">
              <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold">Helpful Tip: </span>
                Only <code className="font-mono font-bold bg-amber-100 px-1 py-0.5 rounded">attraction_name</code> is strictly required, but adding <code className="font-mono bg-amber-100 px-1 py-0.5 rounded">city</code> and <code className="font-mono bg-amber-100 px-1 py-0.5 rounded">country</code> helps prevent research about the wrong attraction.
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Paste Spreadsheet Rows (Tab, Comma, or Newline separated)
              </label>
              <textarea
                id="paste-attractions-textarea"
                rows={4}
                value={pasteInput}
                onChange={(e) => setPasteInput(e.target.value)}
                placeholder="Sagrada Família	Barcelona	Spain
Kiyomizu-dera	Kyoto	Japan
CN Tower	Toronto	Canada"
                className="w-full text-xs font-mono rounded-xl border border-slate-300 p-3.5 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20 outline-hidden bg-slate-50/30 resize-none"
              />
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>Supports columns: Attraction Name, City, Country, URL, Notes</span>
                <button
                  id="submit-pasted-list-btn"
                  type="button"
                  onClick={handlePasteSubmit}
                  disabled={!pasteInput.trim()}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl transition shadow-2xs disabled:opacity-40 cursor-pointer"
                >
                  Import Pasted Rows
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Import Mode 2: CSV Upload */
          <div className="space-y-4">
            <div
              id="csv-drag-drop-zone"
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                  handleFileUpload(e.dataTransfer.files[0]);
                }
              }}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition ${
                isDragging
                  ? 'border-indigo-600 bg-indigo-50/50'
                  : 'border-slate-300 hover:border-indigo-600 hover:bg-slate-50/50'
              }`}
            >
              <input
                type="file"
                ref={fileInputRef}
                accept=".csv,text/csv"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFileUpload(e.target.files[0]);
                  }
                }}
              />
              <FileSpreadsheet className="w-10 h-10 mx-auto text-indigo-600 mb-2" />
              <div className="text-sm font-semibold text-slate-800">
                Drag and drop your CSV file here, or click to browse
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Supported columns: <code className="bg-slate-100 px-1 py-0.5 rounded font-mono">attraction_name</code>, <code className="bg-slate-100 px-1 py-0.5 rounded font-mono">city</code>, <code className="bg-slate-100 px-1 py-0.5 rounded font-mono">country</code>, <code className="bg-slate-100 px-1 py-0.5 rounded font-mono">attraction_url</code>, <code className="bg-slate-100 px-1 py-0.5 rounded font-mono">notes</code>
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Attractions Table & Batch Action Controls */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        {/* Controls Toolbar */}
        <div className="p-5 border-b border-slate-200 bg-slate-50/80 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              id="toggle-select-all-btn"
              type="button"
              onClick={handleToggleSelectAll}
              disabled={items.length === 0}
              className="flex items-center gap-1.5 text-xs font-medium text-slate-700 hover:text-slate-900 bg-white border border-slate-300 px-3 py-1.5 rounded-lg shadow-2xs transition disabled:opacity-40 cursor-pointer"
            >
              {items.length > 0 && items.every((i) => i.selected) ? (
                <CheckSquare className="w-4 h-4 text-indigo-600" />
              ) : (
                <SquareIcon className="w-4 h-4 text-slate-400" />
              )}
              <span>Select All ({selectedCount}/{items.length})</span>
            </button>

            {items.length > 0 && (
              <button
                id="clear-all-attractions-btn"
                type="button"
                onClick={handleClearAll}
                disabled={isGenerating}
                className="text-xs text-rose-600 hover:bg-rose-50 px-2.5 py-1.5 rounded-lg transition cursor-pointer"
              >
                Clear list
              </button>
            )}
          </div>

          {/* Primary Batch Generation Controls */}
          <div className="flex items-center gap-3">
            {isGenerating ? (
              <button
                id="stop-generation-btn"
                type="button"
                onClick={onStopGeneration}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition shadow-xs cursor-pointer animate-pulse"
              >
                <Square className="w-3.5 h-3.5 fill-current" />
                <span>Stop Generation</span>
              </button>
            ) : (
              <>
                <button
                  id="generate-selected-btn"
                  type="button"
                  onClick={onGenerateSelected}
                  disabled={selectedCount === 0}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-indigo-900 bg-indigo-50 hover:bg-indigo-100 border border-indigo-300 rounded-xl transition disabled:opacity-40 cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Generate Selected ({selectedCount})</span>
                </button>
                <button
                  id="generate-all-btn"
                  type="button"
                  onClick={onGenerateAll}
                  disabled={items.length === 0}
                  className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition shadow-xs disabled:opacity-40 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>Generate All ({items.length})</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Quick Add Inline Form */}
        <form onSubmit={handleAddSingleRow} className="p-4 bg-slate-50 border-b border-slate-200 grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
          <div className="sm:col-span-4">
            <input
              id="new-attraction-name-input"
              type="text"
              placeholder="Attraction Name (Required) *"
              value={newRow.attraction_name}
              onChange={(e) => setNewRow({ ...newRow, attraction_name: e.target.value })}
              className="w-full text-xs rounded-lg border border-slate-300 bg-white px-3 py-2 focus:border-indigo-600 outline-hidden"
              required
            />
          </div>
          <div className="sm:col-span-2">
            <input
              id="new-attraction-city-input"
              type="text"
              placeholder="City"
              value={newRow.city}
              onChange={(e) => setNewRow({ ...newRow, city: e.target.value })}
              className="w-full text-xs rounded-lg border border-slate-300 bg-white px-3 py-2 focus:border-indigo-600 outline-hidden"
            />
          </div>
          <div className="sm:col-span-2">
            <input
              id="new-attraction-country-input"
              type="text"
              placeholder="Country"
              value={newRow.country}
              onChange={(e) => setNewRow({ ...newRow, country: e.target.value })}
              className="w-full text-xs rounded-lg border border-slate-300 bg-white px-3 py-2 focus:border-indigo-600 outline-hidden"
            />
          </div>
          <div className="sm:col-span-3">
            <input
              id="new-attraction-notes-input"
              type="text"
              placeholder="Notes or URL"
              value={newRow.notes}
              onChange={(e) => setNewRow({ ...newRow, notes: e.target.value })}
              className="w-full text-xs rounded-lg border border-slate-300 bg-white px-3 py-2 focus:border-indigo-600 outline-hidden"
            />
          </div>
          <div className="sm:col-span-1">
            <button
              id="add-attraction-row-btn"
              type="submit"
              disabled={!newRow.attraction_name.trim()}
              className="w-full flex items-center justify-center p-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg transition disabled:opacity-40 cursor-pointer"
              title="Add Row"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </form>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-100/70 border-b border-slate-200 text-slate-600 uppercase font-semibold tracking-wider text-[11px]">
              <tr>
                <th className="p-3.5 w-10 text-center"></th>
                <th className="p-3.5">Attraction Name</th>
                <th className="p-3.5">City</th>
                <th className="p-3.5">Country</th>
                <th className="p-3.5">Notes / URL</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 w-16 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {items.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-slate-500">
                    <Layers className="w-8 h-8 mx-auto text-slate-400 mb-2" />
                    <p className="font-medium text-slate-700">No attractions in list</p>
                    <p className="text-slate-500 text-xs mt-1">
                      Paste a list above, upload a CSV, or click "Load Sample Data" to begin.
                    </p>
                  </td>
                </tr>
              ) : (
                items.map((item) => {
                  const hasMissingLocation = !item.city || !item.country;

                  return (
                    <tr 
                      key={item.id} 
                      id={`attraction-row-${item.id}`}
                      className={`hover:bg-slate-50/80 transition ${item.selected ? 'bg-indigo-50/30' : ''}`}
                    >
                      {/* Checkbox */}
                      <td className="p-3.5 text-center">
                        <input
                          type="checkbox"
                          checked={Boolean(item.selected)}
                          onChange={() => handleToggleSelect(item.id)}
                          className="rounded text-indigo-600 focus:ring-indigo-600 accent-indigo-600 cursor-pointer"
                        />
                      </td>

                      {/* Attraction Name */}
                      <td className="p-3.5 font-medium text-slate-900">
                        <input
                          type="text"
                          value={item.attraction_name}
                          onChange={(e) => handleRowChange(item.id, 'attraction_name', e.target.value)}
                          className="w-full bg-transparent hover:bg-white focus:bg-white rounded px-2 py-1 border border-transparent hover:border-slate-300 focus:border-indigo-600 outline-hidden font-medium"
                        />
                      </td>

                      {/* City */}
                      <td className="p-3.5 text-slate-700">
                        <div className="relative flex items-center">
                          <input
                            type="text"
                            value={item.city || ''}
                            placeholder="City"
                            onChange={(e) => handleRowChange(item.id, 'city', e.target.value)}
                            className="w-full bg-transparent hover:bg-white focus:bg-white rounded px-2 py-1 border border-transparent hover:border-slate-300 focus:border-indigo-600 outline-hidden"
                          />
                        </div>
                      </td>

                      {/* Country */}
                      <td className="p-3.5 text-slate-700">
                        <input
                          type="text"
                          value={item.country || ''}
                          placeholder="Country"
                          onChange={(e) => handleRowChange(item.id, 'country', e.target.value)}
                          className="w-full bg-transparent hover:bg-white focus:bg-white rounded px-2 py-1 border border-transparent hover:border-slate-300 focus:border-indigo-600 outline-hidden"
                        />
                      </td>

                      {/* Notes / URL */}
                      <td className="p-3.5 text-slate-500 max-w-xs truncate">
                        <input
                          type="text"
                          value={item.notes || item.attraction_url || ''}
                          placeholder="Optional notes or URL"
                          onChange={(e) => handleRowChange(item.id, 'notes', e.target.value)}
                          className="w-full bg-transparent hover:bg-white focus:bg-white rounded px-2 py-1 border border-transparent hover:border-slate-300 focus:border-indigo-600 outline-hidden text-xs truncate"
                        />
                      </td>

                      {/* Status / Warning */}
                      <td className="p-3.5">
                        {hasMissingLocation && (
                          <span 
                            className="inline-flex items-center gap-1 text-[10px] font-medium text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full mr-2"
                            title="City or country missing: adding location helps avoid research errors."
                          >
                            <AlertTriangle className="w-3 h-3 text-amber-700" />
                            Location missing
                          </span>
                        )}
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${
                          item.status === 'complete'
                            ? 'bg-emerald-100 text-emerald-800'
                            : item.status === 'needs_clarification'
                            ? 'bg-amber-100 text-amber-800'
                            : item.status === 'failed'
                            ? 'bg-rose-100 text-rose-800'
                            : item.status === 'researching' || item.status === 'writing' || item.status === 'checking'
                            ? 'bg-blue-100 text-blue-800 animate-pulse'
                            : 'bg-slate-100 text-slate-600'
                        }`}>
                          {item.status === 'waiting' && 'Waiting'}
                          {item.status === 'researching' && 'Researching...'}
                          {item.status === 'writing' && 'Writing...'}
                          {item.status === 'checking' && 'Checking...'}
                          {item.status === 'complete' && 'Complete'}
                          {item.status === 'needs_clarification' && 'Clarification needed'}
                          {item.status === 'failed' && 'Failed'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="p-3.5 text-center">
                        <button
                          type="button"
                          onClick={() => onGenerateItem(item)}
                          disabled={isGenerating || ['researching', 'writing', 'checking'].includes(item.status)}
                          className="mr-1 p-1 text-indigo-600 hover:text-indigo-900 rounded transition disabled:opacity-30"
                          title={item.status === 'complete' ? 'Regenerate this attraction using current rules' : 'Generate this attraction only'}
                        >
                          {item.status === 'complete' ? <RefreshCw className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                        </button>
                        <button
                          id={`delete-row-${item.id}`}
                          type="button"
                          onClick={() => handleDeleteItem(item.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded transition cursor-pointer"
                          title="Delete Attraction"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
