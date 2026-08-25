import { BANNED_PHRASES } from '../constants/rules';
import { QualityCheckResult } from '../types/attraction';

export function countWordsClient(text: string): number {
  const clean = text
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<[^>]*>/g, ' ')
    .replace(/[^\w\s'-]/g, ' ')
    .trim();
  if (!clean) return 0;
  return clean.split(/\s+/).filter(Boolean).length;
}

export function inspectContentLive(
  content: string,
  attractionName: string
): {
  wordCount: number;
  isWordCountValid: boolean;
  headingValid: boolean;
  hasBrTags: boolean;
  bannedWords: string[];
  hasQuestions: boolean;
  hasBulletPoints: boolean;
  hasFirstPerson: boolean;
  issues: string[];
  score: number;
} {
  const expectedHeading = `See the best of ${attractionName.trim()} with a private guide`.toLowerCase();
  const wordCount = countWordsClient(content);
  const isWordCountValid = wordCount >= 180 && wordCount <= 260;
  const hasBrTags = content.includes('<br><br>');
  const lower = content.toLowerCase();

  // Heading check
  const firstLine = content.split('\n')[0]?.trim().toLowerCase() || '';
  const headingValid = firstLine.includes(expectedHeading) || lower.startsWith(expectedHeading);

  // Banned phrases check
  const bannedWords: string[] = [];
  for (const phrase of BANNED_PHRASES) {
    if (lower.includes(phrase.trim())) {
      bannedWords.push(phrase.trim());
    }
  }

  // Formatting checks
  const hasQuestions = /\?/.test(content);
  const hasBulletPoints = /•|\*|- |^\d+\./m.test(content);
  const hasFirstPerson = /\b(we|our|ours|let's|lets)\b/i.test(content);

  const issues: string[] = [];
  if (!isWordCountValid) {
    if (wordCount < 180) issues.push(`Too short: ${wordCount} words (Target: 180–260 words)`);
    else issues.push(`Too long: ${wordCount} words (Target: 180–260 words)`);
  }
  if (!hasBrTags) issues.push('Missing <br><br> tags at paragraph ends');
  if (bannedWords.length > 0) issues.push(`Banned phrases: ${bannedWords.join(', ')}`);
  if (hasQuestions) issues.push('Contains questions (prohibited in Attraction Content Studio tone)');
  if (hasBulletPoints) issues.push('Contains bullet points (plain paragraphs required)');
  if (hasFirstPerson) issues.push('Contains first-person language (we, our, let\'s)');

  const score = Math.max(0, 100 - (issues.length * 18));

  return {
    wordCount,
    isWordCountValid,
    headingValid,
    hasBrTags,
    bannedWords,
    hasQuestions,
    hasBulletPoints,
    hasFirstPerson,
    issues,
    score,
  };
}
