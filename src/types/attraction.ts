import { ThemeId } from './theme.js';

export type GenerationStatus =
  | 'waiting'
  | 'researching'
  | 'writing'
  | 'checking'
  | 'complete'
  | 'needs_clarification'
  | 'failed';

export type QualityStatus = 'passed' | 'revised' | 'warning' | 'pending' | 'failed';

export interface AttractionSource {
  title: string;
  url: string;
  supported_facts: string;
}

export interface AttractionResearch {
  attraction_type?: string;
  location_confirmed?: string;
  significance?: string;
  core_entities?: {
    place: string;
    type: string;
    key_periods: string[];
    people: string[];
    defining_features: string[];
    religious_identity: string;
    related_civilizations_movements_events_landscape: string[];
    nearby_landmarks: string[];
  };
  information_guide?: {
    introduction_and_significance: string;
    history: string;
    main_features: string;
    what_to_look_for: string;
    stories_and_lesser_known_details: string;
    what_the_experience_is_like: string;
    planning_the_visit: string;
    combining_with_nearby_places: string;
    value_of_a_private_guide: string;
  };
  key_entities: string[];
  standout_features: string[];
  guide_value_points: string[];
  sources: AttractionSource[];
  confidence: 'high' | 'medium' | 'low' | 'ambiguous';
  verification_notes?: string;
}

export interface QualityCheckResult {
  passed: boolean;
  score: number; // 0 to 100
  issues_found: string[];
  auto_revised: boolean;
  banned_words_detected: string[];
  word_count_valid: boolean;
  heading_valid: boolean;
  has_br_tags: boolean;
  has_guide_value: boolean;
  no_first_person_brand_voice: boolean;
  tone_score?: string;
  details?: {
    word_count: number;
    paragraph_count: number;
    has_banned_phrases: boolean;
    has_questions: boolean;
    has_bullet_points: boolean;
    has_stylized_fragments: boolean;
    has_we_our_lets: boolean;
  };
}

export interface AttractionItem {
  id: string;
  attraction_name: string;
  city?: string;
  country?: string;
  attraction_url?: string;
  notes?: string;
  
  // Generation state
  status: GenerationStatus;
  clarification_reason?: string;
  error_message?: string;
  
  // Output fields
  heading?: string;
  content?: string; // Paragraphs with <br><br>
  full_content?: string; // Heading + Paragraphs
  plan_your_visit?: string;
  nearby_attractions?: string;
  word_count?: number;
  
  // Research & Quality
  research?: AttractionResearch;
  quality_status?: QualityStatus;
  quality_check?: QualityCheckResult;
  rule_compliance?: Array<{ rule_title: string; passed: boolean; evidence: string }>;
  applied_rules?: Array<{ title: string; description: string }>;
  active_word_range?: { min: number; max: number } | null;
  rules_fingerprint?: string;
  proxy_version?: string;
  
  // Review & Approval state
  is_approved?: boolean;
  is_edited?: boolean;
  last_updated_at?: string;
  
  // Selection state
  selected?: boolean;
}

export interface ProjectSettings {
  additional_instructions: string;
  custom_rules: CopywritingRule[];
  tone_preference: string;
  duplicate_protection: boolean;
  target_word_min: number;
  target_word_max: number;
  theme_id?: ThemeId;
}

export interface CopywritingRule {
  id: string;
  title: string;
  description: string;
}

export type RegenerateOption =
  | 'full'
  | 'specific'
  | 'conversational'
  | 'shorten'
  | 'history'
  | 'experience'
  | 'guide_value'
  | 'different_features'
  | 'custom';

export interface RegenerationPayload {
  option: RegenerateOption;
  custom_instruction?: string;
}
