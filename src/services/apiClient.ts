import { AttractionItem, AttractionResearch, CopywritingRule, QualityCheckResult } from '../types/attraction';

const PROXY_URL = 'https://gemini-proxy-2-pearl.vercel.app/api/attraction-writer';

export interface ProcessAttractionParams {
  attraction_name: string;
  city?: string;
  country?: string;
  attraction_url?: string;
  notes?: string;
  additional_instructions?: string;
  custom_rules?: CopywritingRule[];
  existing_descriptions?: Array<{
    attraction_name: string;
    opening_snippet?: string;
    guide_snippet?: string;
  }>;
  regenerate_mode?: string;
  custom_instruction?: string;
  existing_research?: AttractionResearch;
}

export interface ProcessAttractionResponse {
  status: 'complete' | 'needs_clarification' | 'failed';
  clarification_reason?: string;
  error_message?: string;
  heading: string;
  content: string;
  full_content: string;
  word_count: number;
  research: AttractionResearch;
  quality_check: QualityCheckResult;
  rule_compliance?: Array<{ rule_title: string; passed: boolean; evidence: string }>;
  applied_rules?: Array<{ title: string; description: string }>;
  active_word_range?: { min: number; max: number } | null;
  rules_fingerprint?: string;
  proxy_version?: string;
}

async function parseErrorMessage(response: Response): Promise<string> {
  let errMsg = `HTTP Error ${response.status}: ${response.statusText}`;
  try {
    const text = await response.text();
    if (!text || text.trim() === '') {
      return errMsg;
    }
    // Try to parse JSON error message
    try {
      const errData = JSON.parse(text);
      return errData.error || errData.error_message || errData.message || errMsg;
    } catch {
      // If it returned HTML (like <!doctype html>...), return a clean human-readable error
      if (text.includes('<!DOCTYPE') || text.includes('<!doctype') || text.includes('<html')) {
        return `Server returned status ${response.status} (${response.statusText}). Please check server logs.`;
      }
      return text.length < 200 ? text : errMsg;
    }
  } catch {
    return errMsg;
  }
}

async function safeFetchJson<T>(url: string, options: RequestInit): Promise<T> {
  const externalSignal = options.signal;
  const maxAttempts = 2;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    if (externalSignal?.aborted) throw new DOMException('Generation stopped', 'AbortError');

    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort('Request timed out'), 55000);
    const abortFromExternal = () => controller.abort(externalSignal?.reason);
    if (externalSignal) externalSignal.addEventListener('abort', abortFromExternal, { once: true });

    let response: Response;
    try {
      response = await fetch(url, { ...options, signal: controller.signal });
    } catch (error: any) {
      if (externalSignal?.aborted) throw new DOMException('Generation stopped', 'AbortError');
      if (attempt < maxAttempts) {
        await new Promise((resolve) => window.setTimeout(resolve, 1800));
        continue;
      }
      if (controller.signal.aborted) {
        throw new Error('This attraction did not respond after two attempts. Retry it separately in a moment.');
      }
      throw new Error('The proxy connection failed twice. Check your connection and retry this attraction.');
    } finally {
      window.clearTimeout(timeoutId);
      externalSignal?.removeEventListener('abort', abortFromExternal);
    }

    const retriableStatus = response.status === 429 || response.status >= 500;
    if (!response.ok && retriableStatus && attempt < maxAttempts) {
      await new Promise((resolve) => window.setTimeout(resolve, response.status === 429 ? 4000 : 1800));
      continue;
    }

    if (!response.ok) {
      const msg = await parseErrorMessage(response);
      throw new Error(msg);
    }

    const text = await response.text();
    try {
      return JSON.parse(text) as T;
    } catch {
      throw new Error(`Invalid JSON response received from ${url}`);
    }
  }

  throw new Error('Request failed after retrying.');
}

export async function processAttractionApi(
  params: ProcessAttractionParams,
  signal?: AbortSignal
): Promise<ProcessAttractionResponse> {
  return safeFetchJson<ProcessAttractionResponse>(PROXY_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'process', ...params }),
    signal,
  });
}

export async function auditContentApi(
  content: string,
  attraction_name: string,
  city?: string,
  country?: string,
  additional_instructions?: string,
  custom_rules?: CopywritingRule[]
): Promise<{ heading: string; content: string; full_content: string; word_count: number; quality_check: QualityCheckResult }> {
  return safeFetchJson<{ heading: string; content: string; full_content: string; word_count: number; quality_check: QualityCheckResult }>(
    PROXY_URL,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'quality-check', content, attraction_name, city, country, additional_instructions, custom_rules }),
    }
  );
}

export interface RefineWithChatParams {
  attraction_name: string;
  city?: string;
  country?: string;
  current_heading: string;
  current_content: string;
  user_prompt: string;
  chat_history?: Array<{ role: 'user' | 'assistant'; content: string }>;
  research?: AttractionResearch;
  additional_instructions?: string;
  custom_rules?: CopywritingRule[];
}

export interface RefineWithChatResponse {
  assistant_message: string;
  heading: string;
  content: string;
  full_content: string;
  word_count: number;
  quality_check: QualityCheckResult;
  changes_made: string[];
}

export async function refineWithChatApi(
  params: RefineWithChatParams,
  signal?: AbortSignal
): Promise<RefineWithChatResponse> {
  return safeFetchJson<RefineWithChatResponse>(PROXY_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'refine-chat', ...params }),
    signal,
  });
}

export async function testApiConnection(): Promise<{ status: string; apiKeyConfigured: boolean; proxyVersion?: string; dynamicRules?: boolean }> {
  try {
    return await safeFetchJson<{ status: string; apiKeyConfigured: boolean; proxyVersion?: string; dynamicRules?: boolean }>(PROXY_URL, {
      method: 'GET',
    });
  } catch {
    return { status: 'offline', apiKeyConfigured: false };
  }
}
