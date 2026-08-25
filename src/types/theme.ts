export type ThemeId = 
  | 'indigo-slate' 
  | 'alpine-evergreen' 
  | 'ocean-cyan' 
  | 'obsidian-violet' 
  | 'sunset-terracotta';

export interface ThemeOption {
  id: ThemeId;
  name: string;
  description: string;
  preview: {
    primary: string;
    accent: string;
    bg: string;
    card: string;
  };
}

export const THEME_OPTIONS: ThemeOption[] = [
  {
    id: 'indigo-slate',
    name: 'Indigo & Sunset Amber (Modern)',
    description: 'Crisp slate canvas with deep royal indigo and warm amber highlights',
    preview: {
      primary: '#4338ca',
      accent: '#f59e0b',
      bg: '#f8fafc',
      card: '#ffffff',
    },
  },
  {
    id: 'alpine-evergreen',
    name: 'Alpine Evergreen & Terracotta',
    description: 'Heritage forest emerald with warm linen and terracotta badges',
    preview: {
      primary: '#047857',
      accent: '#ea580c',
      bg: '#faf9f6',
      card: '#ffffff',
    },
  },
  {
    id: 'ocean-cyan',
    name: 'Pacific Ocean & Coral',
    description: 'Deep marine cobalt with vibrant coral and sky slate accents',
    preview: {
      primary: '#0284c7',
      accent: '#f43f5e',
      bg: '#f0f9ff',
      card: '#ffffff',
    },
  },
  {
    id: 'obsidian-violet',
    name: 'Obsidian & Electric Violet',
    description: 'Minimalist charcoal & pearl with electric violet & rose badges',
    preview: {
      primary: '#7c3aed',
      accent: '#ec4899',
      bg: '#fafafa',
      card: '#ffffff',
    },
  },
  {
    id: 'sunset-terracotta',
    name: 'Warm Terracotta & Espresso',
    description: 'Rich Mediterranean terracotta with espresso and golden sand',
    preview: {
      primary: '#c2410c',
      accent: '#d97706',
      bg: '#faf8f5',
      card: '#ffffff',
    },
  },
];
