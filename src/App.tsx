import React, { useState, useEffect, useRef } from 'react';
import { 
  AttractionItem, 
  ProjectSettings, 
  RegenerateOption, 
  GenerationStatus 
} from './types/attraction';
import { processAttractionApi } from './services/apiClient';
import { SAMPLE_ATTRACTIONS } from './utils/sampleData';
import { Navbar, NavTab } from './components/Navbar';
import { AttractionsTab } from './components/AttractionsTab';
import { GeneratedContentTab } from './components/GeneratedContentTab';
import { ApprovedTab } from './components/ApprovedTab';
import { ExportTab } from './components/ExportTab';
import { SettingsTab } from './components/SettingsTab';
import { ContentEditorModal } from './components/ContentEditorModal';
import { ViewSourcesModal } from './components/ViewSourcesModal';
import { RegenerateModal } from './components/RegenerateModal';
import { HowItWorksModal } from './components/HowItWorksModal';
import { Footer } from './components/Footer';

const STORAGE_KEY_ITEMS = 'tbl_attractions_items_v2';
const STORAGE_KEY_SETTINGS = 'tbl_attractions_settings_v2';

const DEFAULT_SETTINGS: ProjectSettings = {
  additional_instructions: '',
  tone_preference: 'grounded',
  duplicate_protection: true,
  target_word_min: 180,
  target_word_max: 260,
  theme_id: 'indigo-slate',
};

export default function App() {
  const [activeTab, setActiveTab] = useState<NavTab>('attractions');
  
  // State loaded from localStorage or initialized with realistic samples
  const [items, setItems] = useState<AttractionItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_ITEMS);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.warn('Failed to load saved items from localStorage', e);
    }
    // Initial default samples
    return SAMPLE_ATTRACTIONS.map((s) => ({
      id: crypto.randomUUID(),
      attraction_name: s.attraction_name || '',
      city: s.city,
      country: s.country,
      attraction_url: s.attraction_url,
      notes: s.notes,
      status: 'waiting' as GenerationStatus,
      selected: true,
    }));
  });

  const [settings, setSettings] = useState<ProjectSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SETTINGS);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.warn('Failed to load saved settings from localStorage', e);
    }
    return DEFAULT_SETTINGS;
  });

  // Batch generation & AbortController state
  const [isGenerating, setIsGenerating] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Modals state
  const [editingItem, setEditingItem] = useState<AttractionItem | null>(null);
  const [viewSourcesItem, setViewSourcesItem] = useState<AttractionItem | null>(null);
  const [regeneratingItem, setRegeneratingItem] = useState<AttractionItem | null>(null);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [isHowItWorksOpen, setIsHowItWorksOpen] = useState(false);

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_ITEMS, JSON.stringify(items));
    } catch (e) {
      console.error('Failed to save items to localStorage', e);
    }
  }, [items]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(settings));
    } catch (e) {
      console.error('Failed to save settings to localStorage', e);
    }
  }, [settings]);

  // Counts
  const completedCount = items.filter((i) => i.status === 'complete').length;
  const approvedCount = items.filter((i) => i.is_approved).length;

  // Single Item Processor
  const processItemAsync = async (
    targetItem: AttractionItem,
    signal?: AbortSignal,
    regenerateOption?: RegenerateOption,
    customInstruction?: string
  ): Promise<AttractionItem> => {
    // 1. Set researching status
    setItems((prev) =>
      prev.map((i) => (i.id === targetItem.id ? { ...i, status: 'researching' } : i))
    );

    // Build duplicate context
    const existingDesc = settings.duplicate_protection
      ? items
          .filter((i) => i.status === 'complete' && i.id !== targetItem.id && i.content)
          .map((i) => ({
            attraction_name: i.attraction_name,
            opening_snippet: i.content?.split('<br><br>')[0]?.slice(0, 100),
            guide_snippet: i.content?.split('<br><br>').filter(Boolean).pop()?.slice(0, 100),
          }))
      : [];

    try {
      // 2. Set writing status
      setTimeout(() => {
        setItems((prev) =>
          prev.map((i) => (i.id === targetItem.id ? { ...i, status: 'writing' } : i))
        );
      }, 1000);

      const response = await processAttractionApi(
        {
          attraction_name: targetItem.attraction_name,
          city: targetItem.city,
          country: targetItem.country,
          attraction_url: targetItem.attraction_url,
          notes: targetItem.notes,
          additional_instructions: settings.additional_instructions,
          existing_descriptions: existingDesc,
          regenerate_mode: regenerateOption,
          custom_instruction: customInstruction,
          existing_research: targetItem.research,
        },
        signal
      );

      // 3. Set checking status
      setItems((prev) =>
        prev.map((i) => (i.id === targetItem.id ? { ...i, status: 'checking' } : i))
      );

      const updated: AttractionItem = {
        ...targetItem,
        status: response.status,
        clarification_reason: response.clarification_reason,
        error_message: response.error_message,
        heading: response.heading,
        content: response.content,
        full_content: response.full_content,
        word_count: response.word_count,
        research: response.research,
        quality_status: response.quality_check?.passed ? 'passed' : 'warning',
        quality_check: response.quality_check,
        last_updated_at: new Date().toISOString(),
      };

      setItems((prev) => prev.map((i) => (i.id === targetItem.id ? updated : i)));
      return updated;
    } catch (err: any) {
      if (err.name === 'AbortError') {
        throw err;
      }
      console.error(`Processing error for ${targetItem.attraction_name}:`, err);
      const failedItem: AttractionItem = {
        ...targetItem,
        status: 'failed',
        error_message: err.message || 'Processing failed',
      };
      setItems((prev) => prev.map((i) => (i.id === targetItem.id ? failedItem : i)));
      return failedItem;
    }
  };

  // Batch Generation Engine
  const runBatchGeneration = async (targets: AttractionItem[]) => {
    if (targets.length === 0) return;
    setIsGenerating(true);
    const controller = new AbortController();
    abortControllerRef.current = controller;

    // Automatically navigate to Generated Content to watch live progress
    setActiveTab('generated');

    for (let i = 0; i < targets.length; i++) {
      const item = targets[i];
      if (controller.signal.aborted) break;
      try {
        await processItemAsync(item, controller.signal);
        // Small delay between batch items to respect free-tier rate limits
        if (i < targets.length - 1 && !controller.signal.aborted) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      } catch (err: any) {
        if (err.name === 'AbortError') {
          console.log('Batch generation was halted by user.');
          break;
        }
      }
    }

    setIsGenerating(false);
    abortControllerRef.current = null;
  };

  const handleGenerateAll = () => {
    const targets = items.filter((i) => i.status !== 'complete');
    runBatchGeneration(targets.length > 0 ? targets : items);
  };

  const handleGenerateSelected = () => {
    const targets = items.filter((i) => i.selected);
    runBatchGeneration(targets);
  };

  const handleStopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setIsGenerating(false);
  };

  const handleRetryItem = (item: AttractionItem) => {
    processItemAsync(item);
  };

  const handleRetryAllFailed = () => {
    const failedItems = items.filter((i) => i.status === 'failed' || i.status === 'needs_clarification');
    runBatchGeneration(failedItems);
  };

  const handleToggleApprove = (id: string) => {
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, is_approved: !i.is_approved } : i))
    );
  };

  const handleSaveEditedItem = (updated: AttractionItem) => {
    setItems((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
  };

  const handleRegenerateSubmit = async (
    item: AttractionItem,
    option: RegenerateOption,
    customInstruction?: string
  ) => {
    setIsRegenerating(true);
    try {
      await processItemAsync(item, undefined, option, customInstruction);
      setRegeneratingItem(null);
    } catch (e) {
      console.error('Regeneration error', e);
    } finally {
      setIsRegenerating(false);
    }
  };

  const currentTheme = settings.theme_id || 'indigo-slate';

  const handleSelectTheme = (themeId: any) => {
    setSettings((prev) => ({ ...prev, theme_id: themeId }));
  };

  return (
    <div className={`min-h-screen theme-${currentTheme} bg-[var(--bg-app)] text-[var(--text-main)] flex flex-col font-sans transition-colors duration-200`}>
      {/* Top Navigation */}
      <Navbar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        attractionsCount={items.length}
        completedCount={completedCount}
        approvedCount={approvedCount}
        isGenerating={isGenerating}
        hasCustomInstructions={Boolean(settings.additional_instructions.trim())}
        onOpenHowItWorks={() => setIsHowItWorksOpen(true)}
      />

      {/* Main Content Body */}
      <main className="flex-1 px-4 sm:px-6 lg:px-8 pt-8">
        {activeTab === 'attractions' && (
          <AttractionsTab
            items={items}
            settings={settings}
            isGenerating={isGenerating}
            onUpdateItems={setItems}
            onUpdateSettings={setSettings}
            onGenerateAll={handleGenerateAll}
            onGenerateSelected={handleGenerateSelected}
            onStopGeneration={handleStopGeneration}
            onNavigateToGenerated={() => setActiveTab('generated')}
          />
        )}

        {activeTab === 'generated' && (
          <GeneratedContentTab
            items={items}
            isGenerating={isGenerating}
            onEditItem={setEditingItem}
            onRegenerateItem={setRegeneratingItem}
            onViewSources={setViewSourcesItem}
            onToggleApprove={handleToggleApprove}
            onRetryItem={handleRetryItem}
            onRetryAllFailed={handleRetryAllFailed}
          />
        )}

        {activeTab === 'approved' && (
          <ApprovedTab
            items={items}
            onEditItem={setEditingItem}
            onToggleApprove={handleToggleApprove}
            onNavigateToAttractions={() => setActiveTab('attractions')}
          />
        )}

        {activeTab === 'export' && <ExportTab items={items} />}

        {activeTab === 'settings' && (
          <SettingsTab settings={settings} onUpdateSettings={setSettings} />
        )}
      </main>

      {/* Footer */}
      <Footer />

      {/* Modals & Dialogs */}
      <HowItWorksModal
        isOpen={isHowItWorksOpen}
        onClose={() => setIsHowItWorksOpen(false)}
      />

      {editingItem && (
        <ContentEditorModal
          item={editingItem}
          settings={settings}
          onClose={() => setEditingItem(null)}
          onSave={handleSaveEditedItem}
        />
      )}

      {viewSourcesItem && (
        <ViewSourcesModal
          item={viewSourcesItem}
          onClose={() => setViewSourcesItem(null)}
        />
      )}

      {regeneratingItem && (
        <RegenerateModal
          item={regeneratingItem}
          onClose={() => setRegeneratingItem(null)}
          onRegenerate={handleRegenerateSubmit}
          isProcessing={isRegenerating}
        />
      )}
    </div>
  );
}
