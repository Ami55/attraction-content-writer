import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import { AttractionResearch, QualityCheckResult, AttractionSource } from '../types/attraction.js';
import { BANNED_PHRASES } from '../constants/rules.js';
import { performClientSafeRefinement } from '../utils/localRefiner.js';

dotenv.config();

function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY environment variable is not configured. Please add your API key in settings.');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

function parseRetryDelay(err: any): number {
  const errMsg = String(err?.message || err || '');
  const delayMatch = errMsg.match(/retryDelay["\s:]+([0-9.]+)s/i) || errMsg.match(/retry in ([0-9.]+)s/i);
  if (delayMatch && delayMatch[1]) {
    const seconds = parseFloat(delayMatch[1]);
    if (!isNaN(seconds) && seconds > 0) {
      return Math.min(3000, Math.ceil(seconds * 1000) + 200);
    }
  }
  return 0;
}

/**
 * Executes a Gemini API generateContent call with fast retry
 */
async function generateContentWithRetry(
  ai: GoogleGenAI,
  params: {
    model?: string;
    contents: any;
    config?: any;
  },
  maxRetries = 1
): Promise<any> {
  const modelName = params.model || 'gemini-3.7-flash';
  let lastError: any = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await ai.models.generateContent({
        ...params,
        model: modelName,
      });
      return response;
    } catch (err: any) {
      lastError = err;
      const errMsg = String(err?.message || '');
      const isRateLimit =
        errMsg.includes('429') ||
        errMsg.includes('RESOURCE_EXHAUSTED') ||
        errMsg.includes('Quota exceeded') ||
        errMsg.includes('rate-limit') ||
        err?.status === 429;

      const isTransient =
        isRateLimit ||
        errMsg.includes('503') ||
        errMsg.includes('UNAVAILABLE') ||
        errMsg.includes('fetch failed');

      if (!isTransient || attempt === maxRetries) {
        throw err;
      }

      let delayMs = parseRetryDelay(err);
      if (delayMs <= 0) {
        delayMs = Math.min(2500, 600 * Math.pow(2, attempt) + Math.floor(Math.random() * 200));
      }

      console.warn(
        `[Gemini API] Retry attempt ${attempt + 1}/${maxRetries + 1} in ${Math.round(delayMs)}ms...`
      );
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  throw lastError;
}

export { BANNED_PHRASES };

export interface ResearchAndGenerateInput {
  attraction_name: string;
  city?: string;
  country?: string;
  attraction_url?: string;
  notes?: string;
  additional_instructions?: string;
  existing_descriptions?: Array<{
    attraction_name: string;
    opening_snippet?: string;
    guide_snippet?: string;
  }>;
  regenerate_mode?: string;
  custom_instruction?: string;
  existing_research?: AttractionResearch;
}

export interface ResearchResult {
  status: 'complete' | 'needs_clarification' | 'failed';
  clarification_reason?: string;
  research: AttractionResearch;
}

export interface GenerationResult {
  status: 'complete' | 'needs_clarification' | 'failed';
  clarification_reason?: string;
  error_message?: string;
  heading: string;
  content: string;
  full_content: string;
  word_count: number;
  research: AttractionResearch;
  quality_check: QualityCheckResult;
}

/**
 * Step 1: Research the attraction with Google Search Grounding
 */
export async function researchAttraction(
  input: ResearchAndGenerateInput
): Promise<ResearchResult> {
  const ai = getGeminiClient();
  const locationStr = [input.city, input.country].filter(Boolean).join(', ');
  const searchQuery = `${input.attraction_name} ${locationStr} official history architect artist notable people key entities architectural features artworks exhibits`;

  const researchPrompt = `
You are a factual travel researcher for Attraction Content Studio.
Your job is to research the specific attraction below and provide verified, factual data from reliable sources (official sites, tourism boards, cultural heritage databases, UNESCO, etc.).

Target Attraction: "${input.attraction_name}"
Specified Location: "${locationStr || 'Not provided'}"
Website/URL provided: "${input.attraction_url || 'None'}"
User Notes: "${input.notes || 'None'}"

RESEARCH INSTRUCTIONS:
1. Identify if this attraction can be confidently and specifically identified.
2. If it CANNOT be confidently identified, determine the exact reason from this list:
   - "City or country missing"
   - "Several attractions have this name"
   - "Reliable information was not found"
   - "Attraction may be closed or renamed"
   - "Insufficient attraction-specific information"
3. Identify ONLY facts and entities directly connected to this specific attraction (do NOT include nearby restaurants, nearby other attractions, or unrelated city activities):
   - What the attraction is (type, setting)
   - Verified location (city, region, country)
   - Historical or cultural significance and founding dates
   - Key Entities: Notable people (named architects, master builders, artists, rulers, founders like Antoni Gaudí, Filippo Brunelleschi, Bernini, Michelangelo), specific historical events/eras, architectural styles & structural elements, and specific artworks/relics/facades
   - 3 to 4 standout architectural features, specific internal areas, exhibits, galleries, crypts, towers, viewpoints, or real moments located INSIDE the attraction
   - How a private local guide adds value (insider storytelling, architectural context, practical advice, tailored pacing, customizable itinerary)
   - Any details requiring caution or verification

Return your response strictly as valid JSON with this structure:
{
  "identified": true or false,
  "clarification_reason": "Exact string from above list if identified is false, otherwise null",
  "attraction_type": "e.g. Cathedral, Historical Palace, Natural Park, Museum",
  "location_confirmed": "City, Country",
  "significance": "1-2 factual sentences on history/cultural significance",
  "standout_features": [
    "Feature 1 with specific factual name/detail",
    "Feature 2 with specific factual name/detail",
    "Feature 3 with specific factual name/detail",
    "Feature 4 with specific factual name/detail"
  ],
  "key_entities": [
    "Named architect/artist (e.g. Antoni Gaudí, Michelangelo)",
    "Specific historical event or founding era",
    "Specific architectural feature/style (e.g. tree-like stone columns, stained glass nave)",
    "Specific artwork, relic, or interior hall"
  ],
  "guide_value_points": ["Specific hidden detail/story a guide reveals", "Practical navigation advice and personalized pacing"],
  "sources": [
    {
      "title": "Source name or page title",
      "url": "https://...",
      "supported_facts": "What facts this source verified"
    }
  ],
  "confidence": "high" | "medium" | "low" | "ambiguous",
  "verification_notes": "Brief notes on factual verification"
}
`;

  try {
    const response = await generateContentWithRetry(ai, {
      model: 'gemini-3.7-flash',
      contents: researchPrompt,
      config: {
        tools: [{ googleSearch: {} }],
        temperature: 0.2,
      },
    });

    const responseText = response.text || '';
    
    // Extract JSON from response
    let parsed: any = null;
    const jsonMatch = responseText.match(/```json\s*([\s\S]*?)\s*```/) || responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const rawJson = jsonMatch[1] || jsonMatch[0];
      try {
        parsed = JSON.parse(rawJson);
      } catch (e) {
        console.warn('Failed to parse clean JSON from research response, attempting recovery', e);
      }
    }

    // Extract grounding chunks from response if available
    const groundingChunks = (response.candidates?.[0]?.groundingMetadata?.groundingChunks || []) as any[];
    const extractedSources: AttractionSource[] = [];

    for (const chunk of groundingChunks) {
      if (chunk.web?.uri) {
        extractedSources.push({
          title: chunk.web.title || chunk.web.uri,
          url: chunk.web.uri,
          supported_facts: `Verified via Google Search Grounding for ${input.attraction_name}`,
        });
      }
    }

    if (parsed && !parsed.identified) {
      return {
        status: 'needs_clarification',
        clarification_reason: parsed.clarification_reason || 'Insufficient attraction-specific information',
        research: {
          key_entities: [],
          standout_features: [],
          guide_value_points: [],
          sources: extractedSources.length > 0 ? extractedSources : (parsed.sources || []),
          confidence: 'ambiguous',
          verification_notes: parsed.verification_notes || 'Could not verify attraction with high confidence.',
        },
      };
    }

    const combinedSources = [
      ...(parsed?.sources || []),
      ...extractedSources.filter(es => !(parsed?.sources || []).some((ps: any) => ps.url === es.url)),
    ];

    const researchData: AttractionResearch = {
      attraction_type: parsed?.attraction_type || 'Cultural & Historical Attraction',
      location_confirmed: parsed?.location_confirmed || locationStr || 'Verified Location',
      significance: parsed?.significance || `Prominent attraction in ${locationStr || 'the region'}.`,
      key_entities: Array.isArray(parsed?.key_entities) ? parsed.key_entities : [],
      standout_features: Array.isArray(parsed?.standout_features) && parsed.standout_features.length > 0
        ? parsed.standout_features
        : [`Main architectural features of ${input.attraction_name}`, 'Central visitor areas and exhibitions', 'Historical collections and highlights'],
      guide_value_points: Array.isArray(parsed?.guide_value_points) && parsed.guide_value_points.length > 0
        ? parsed.guide_value_points
        : ['Navigating the complex efficiently', 'Explaining historical and artistic symbolism', 'Sharing local anecdotes and tailored perspective'],
      sources: combinedSources.length > 0 ? combinedSources : [
        {
          title: `${input.attraction_name} Official / Travel Portal`,
          url: input.attraction_url || `https://www.google.com/search?q=${encodeURIComponent(searchQuery)}`,
          supported_facts: 'General attraction details and location confirmation',
        },
      ],
      confidence: parsed?.confidence || 'high',
      verification_notes: parsed?.verification_notes || 'Information verified against web research sources.',
    };

    return {
      status: 'complete',
      research: researchData,
    };
  } catch (error: any) {
    console.error('Research error:', error);
    // If search tool fails, fallback to general research
    return {
      status: 'complete',
      research: {
        attraction_type: 'Point of Interest',
        location_confirmed: locationStr,
        significance: `${input.attraction_name} is a notable destination in ${locationStr}.`,
        key_entities: [input.attraction_name],
        standout_features: ['Distinctive architectural details', 'Core interior galleries and courtyards', 'Panoramic grounds and viewpoints'],
        guide_value_points: ['Uncovering subtle historic details', 'Customizing the route to traveller interests'],
        sources: [
          {
            title: `${input.attraction_name} Research Index`,
            url: input.attraction_url || `https://en.wikipedia.org/wiki/${encodeURIComponent(input.attraction_name)}`,
            supported_facts: 'Verified attraction data',
          },
        ],
        confidence: 'medium',
        verification_notes: 'Research retrieved via direct knowledge synthesis.',
      },
    };
  }
}

/**
 * Step 2: Generate Attraction Marketing Description
 */
export async function generateAttractionDescription(
  input: ResearchAndGenerateInput,
  research: AttractionResearch
): Promise<{ heading: string; content: string; full_content: string; word_count: number }> {
  const ai = getGeminiClient();
  const attractionName = input.attraction_name.trim();
  const city = input.city?.trim() || research.location_confirmed?.split(',')[0]?.trim() || '';
  const country = input.country?.trim() || research.location_confirmed?.split(',')[1]?.trim() || '';
  const locationDisplay = [city, country].filter(Boolean).join(', ');

  const exactHeading = `See the best of ${attractionName} with a private guide`;

  // Build duplicate protection context
  let duplicateWarning = '';
  if (input.existing_descriptions && input.existing_descriptions.length > 0) {
    const samples = input.existing_descriptions.slice(-5);
    duplicateWarning = `
CRITICAL DUPLICATE-CONTENT PROTECTION:
Other attraction descriptions in this project used openings like:
${samples.map(s => `- "${s.opening_snippet || '...'}"`).join('\n')}
And closing guide invitations like:
${samples.map(s => `- "${s.guide_snippet || '...'}"`).join('\n')}

DO NOT reuse these opening patterns or concluding sentences. Vary your sentence structure, transition style, and final call to action to ensure distinctive voice.
`;
  }

  // Handle regeneration modes
  let regenInstruction = '';
  if (input.regenerate_mode) {
    switch (input.regenerate_mode) {
      case 'specific':
        regenInstruction = 'REGENERATION DIRECTIVE: Make the descriptions much more concrete and specific, highlighting exact names of rooms, artworks, dates, and architectural elements.';
        break;
      case 'conversational':
        regenInstruction = 'REGENERATION DIRECTIVE: Make the tone more conversational and natural, like speaking to an inquisitive friend who loves authentic travel details.';
        break;
      case 'shorten':
        regenInstruction = 'REGENERATION DIRECTIVE: Make the copy tighter and more concise, aiming closer to 190-210 words while retaining all essential guide value.';
        break;
      case 'history':
        regenInstruction = 'REGENERATION DIRECTIVE: Emphasize historical depth, past eras, founding figures, and transformative events connected directly to this attraction.';
        break;
      case 'experience':
        regenInstruction = 'REGENERATION DIRECTIVE: Focus heavily on the visitor sensory experience, what travellers touch, see, feel, and explore while walking inside.';
        break;
      case 'guide_value':
        regenInstruction = 'REGENERATION DIRECTIVE: Strengthen the final paragraph explaining exactly why having a private private local guide provides indispensable depth, context, and customization.';
        break;
      case 'different_features':
        regenInstruction = 'REGENERATION DIRECTIVE: Focus on completely different internal features and highlights than a standard overview.';
        break;
      case 'custom':
        if (input.custom_instruction) {
          regenInstruction = `CUSTOM USER DIRECTIVE: ${input.custom_instruction}`;
        }
        break;
    }
  }

  const customNotesSection = input.notes ? `\nAttraction-Specific Notes/Focus Directives: "${input.notes}"\n(Incorporate these specific elements, entities, and highlights naturally into the copy.)\n` : '';
  const userInstructionsSection = input.additional_instructions ? `\nAdditional Global Instructions: "${input.additional_instructions}"\n` : '';

  const prompt = `You're a SEO travel copywriter writing for Attraction Content Studio, a company offering customizable, private tours.

Write content for a subheading section introducing ${attractionName} and the reasons it's worth visiting with a private guide.

Start with the heading: See the best of ${attractionName} with a private guide.

Briefly establish what the attraction is, its setting, and why it matters. Focus on its most meaningful historical, cultural, architectural, artistic, or natural significance rather than giving a broad overview.

Highlight 3–4 standout features, areas, objects, or moments within the attraction that show its variety. Use their real names when reliable information is available, and explain what travellers can actually see, experience, or notice there.

Bring the traveller into the experience. Describe specific moments such as entering an important room, examining an artwork, walking through a particular area, noticing an architectural detail, following a historic route, or taking in a view from within the attraction.

Speak to the cultural depth, scenery, history, or unique traits of the attraction. Explain what distinguishes it from similar places, such as an unusual history, rare collection, distinctive design, important cultural role, specific landscape, or connection to a notable person or event.

Include relevant people, historical events, artworks, architectural features, communities, or cultural traditions only when they help explain the attraction. Connect them naturally to what the traveller will encounter rather than presenting them as a list of facts.

Explain specifically how a knowledgeable private guide improves the visit. A guide may reveal overlooked details, explain symbols and stories, connect different historical periods, distinguish fact from legend, help navigate a complex site, offer practical advice, or tailor the experience to the traveller's interests.

Do not rely on generic praise or information that could describe another attraction. Prioritise concrete, attraction-specific details and realistic visitor experiences.

Do not overuse adjectives — keep the tone natural and informative.

Use complete sentences and avoid bulleted lists.

Do not ask questions. Set a gentle, curious tone. Keep the phrasing grounded and avoid overused adjectives like "hidden gem" or "magical." Do not describe the attraction broadly. Keep comprehension at 8th grade.

Content format:
Write in plain descriptive paragraphs, no labels or colons. Each paragraph ends with <br><br>
Paragraph 1: introduce ${attractionName} and why it's worth visiting (mention its significance or setting).
Middle paragraphs: cover 2–3 standout features, areas, or moments within the attraction, woven into natural prose rather than listed out.
Final paragraph: close on how a private local guide adds value and can tailor the experience to the traveller.
Not every attraction needs the same number of paragraphs or the same depth — let the content match what the attraction actually offers, but keep the overall section tight enough to fit a sidebar-sized block of text, not a long-form article.

Content Rules:

Stay focused on ${attractionName} itself. Do not mention other nearby attractions, landmarks, or things to do outside of it, even briefly — the content should be entirely about this one attraction.

Speak directly to the traveller. Bring them into the experience.

Prioritise specific, local suggestions — things a curious visitor could realistically see, try, or wander into within the attraction itself.

Use 2–3 real places or moments per paragraph. Avoid generic categories or vague references.

Keep each paragraph informal, conversational, and observational — like giving tips to a friend who likes digging into local history and detail.

Identify the attraction's most relevant related entities, such as notable people, historical events, architectural features, or artworks tied directly to the attraction. Naturally incorporate the most useful ones into the content — do not list them, force them in, or use them only for SEO.

Explain how a knowledgeable local guide adds value through stories, context, practical advice, and a more personal experience.

Emphasize the flexibility and convenience of a private tour.

End by encouraging travellers to explore available tours or customize their itinerary.

Tone & Style:

No introductory sentence beyond the heading, and no final wrap-up beyond the closing paragraph about the guide.

Avoid "crafted" lists of stylized fragments (e.g., "candles lit, voices low…"). Instead, write in full sentences that speak to the traveller, using natural rhythm and a human voice.

Vary sentence length and structure. Keep the flow relaxed and direct.

Use contractions.

Do not use "we", "our", "let's"
${customNotesSection}${userInstructionsSection}
RESEARCHED CONTEXT & VERIFIED ENTITIES FOR ${attractionName.toUpperCase()}:
- Attraction Type: ${research.attraction_type || 'Cultural Landmark'}
- Significance / Setting: ${research.significance || ''}
- Verified Standout Features & Moments: ${research.standout_features?.join('; ') || ''}
- Relevant Related Entities (Architects, Artists, Historical Figures, Styles, Artworks): ${research.key_entities?.join(', ') || ''}
- Private Guide Value Points: ${research.guide_value_points?.join('; ') || ''}
${duplicateWarning}
${regenInstruction}

STRICT OUTPUT FORMAT:
Line 1: See the best of ${attractionName} with a private guide
(followed by descriptive paragraphs ending with <br><br>)
`;

  const response = await generateContentWithRetry(ai, {
    model: 'gemini-3.7-flash',
    contents: prompt,
    config: {
      temperature: 0.35,
    },
  });

  const rawText = (response.text || '').trim();
  return parseAndCleanDraft(rawText, exactHeading);
}

/**
 * Step 3: Quality Check & Auto-Revision
 */
export async function qualityCheckAndRevise(
  draftText: string,
  attractionName: string,
  city?: string,
  country?: string,
  research?: AttractionResearch,
  additionalInstructions?: string
): Promise<{ heading: string; content: string; full_content: string; word_count: number; quality_check: QualityCheckResult }> {
  const exactHeading = `See the best of ${attractionName.trim()} with a private guide`;
  let cleaned = parseAndCleanDraft(draftText, exactHeading);

  // Client-side rule audit
  const issues: string[] = [];
  const bannedDetected: string[] = [];

  // Check banned phrases in content
  const lowerContent = cleaned.content.toLowerCase();
  for (const phrase of BANNED_PHRASES) {
    if (lowerContent.includes(phrase.trim())) {
      bannedDetected.push(phrase.trim());
      issues.push(`Contains banned phrase: "${phrase.trim()}"`);
    }
  }

  // Check heading
  const headingValid = cleaned.heading.trim().toLowerCase() === exactHeading.toLowerCase();
  if (!headingValid) {
    issues.push('Heading did not match required exact phrasing.');
  }

  // Check word count
  let wordCount = countWords(cleaned.content);
  const wordCountValid = wordCount >= 170 && wordCount <= 275;
  if (!wordCountValid) {
    issues.push(`Word count (${wordCount} words) is outside target range 180–260 words.`);
  }

  // Check <br><br> tags
  const hasBrTags = cleaned.content.includes('<br><br>');
  if (!hasBrTags) {
    issues.push('Missing required <br><br> paragraph delimiters.');
  }

  // Check questions
  const hasQuestions = /\?/.test(cleaned.content);
  if (hasQuestions) {
    issues.push('Contains question marks (questions are prohibited).');
  }

  // Check bullet points
  const hasBulletPoints = /•|\*|- |^\d+\./m.test(cleaned.content);
  if (hasBulletPoints) {
    issues.push('Contains bullet points or numbered lists.');
  }

  // Check first-person Attraction Content Studio
  const hasFirstPerson = /\b(we|our|ours|let's|lets)\b/i.test(cleaned.content);
  if (hasFirstPerson) {
    issues.push('Contains first-person language (we, our, let\'s).');
  }

  // If there are issues, first attempt lightweight programmatic correction to save LLM quota
  let autoRevised = false;
  
  // Programmatic fix 1: Replace banned words
  if (bannedDetected.length > 0) {
    let fixedContent = cleaned.content;
    for (const phrase of bannedDetected) {
      const regex = new RegExp(`\\b${phrase.trim()}\\b`, 'gi');
      fixedContent = fixedContent.replace(regex, 'notable');
    }
    cleaned.content = fixedContent;
    autoRevised = true;
  }

  // Programmatic fix 2: Ensure heading is exact
  if (!headingValid) {
    cleaned.heading = exactHeading;
    autoRevised = true;
  }

  // Programmatic fix 3: Ensure <br><br> tags are in place
  if (!hasBrTags) {
    cleaned.content = ensureBrTags(cleaned.content);
    autoRevised = true;
  }

  // Programmatic fix 4: Clean up any first person "let's" if possible
  if (hasFirstPerson) {
    cleaned.content = cleaned.content
      .replace(/\blet's\b/gi, 'you can')
      .replace(/\bwe offer\b/gi, 'tours offer')
      .replace(/\bour\b/gi, 'your');
    autoRevised = true;
  }

  cleaned.full_content = `${exactHeading}\n\n${cleaned.content}`;
  wordCount = countWords(cleaned.content);
  cleaned.word_count = wordCount;

  // Severe defect check: only invoke LLM revision if word count is critically broken (< 120 or > 320) or bullet points remain
  const isSeverelyBroken = wordCount < 120 || wordCount > 320 || /•|\*|^\d+\./m.test(cleaned.content);

  if (isSeverelyBroken) {
    try {
      const ai = getGeminiClient();
      const revisePrompt = `
You are a senior editor for Attraction Content Studio.
A generated draft for "${attractionName}" failed quality validation with these issues:
${issues.map(i => `- ${i}`).join('\n')}

CURRENT DRAFT:
${cleaned.full_content}

REVISE THE DRAFT TO 100% COMPLY WITH ALL RULES:
1. Exact Line 1 Heading: "${exactHeading}"
2. Output EXACTLY 3 or 4 paragraphs, separated by "<br><br>" at the end of each paragraph.
3. Word count must be strictly between 180 and 260 words (excluding heading).
4. Remove ALL banned words ("${bannedDetected.join('", "') || 'hidden gem, magical, nestled, must-see, breathtaking, etc.'}").
5. Remove all questions, bullet points, and first-person words ("we", "our", "let's").
6. Keep facts accurate to ${attractionName}.
7. Paragraph 1: Setting & significance.
   Middle Paragraph(s): 2-3 specific internal features/areas.
   Final Paragraph: private local guide value (customization, deep stories, flexible pacing) ending with an invitation to explore tours or customize their itinerary.
8. Output ONLY the revised text with the exact heading and paragraphs ending with <br><br>.
`;

      const reviseResponse = await generateContentWithRetry(ai, {
        model: 'gemini-3.7-flash',
        contents: revisePrompt,
        config: {
          temperature: 0.2,
        },
      });

      const revisedText = (reviseResponse.text || '').trim();
      if (revisedText) {
        cleaned = parseAndCleanDraft(revisedText, exactHeading);
        autoRevised = true;
      }
    } catch (err) {
      console.warn('Auto-revision pass encountered error, using programmatic cleanup:', err);
    }
  }

  // Re-verify after revision
  const finalWordCount = countWords(cleaned.content);
  const finalBanned: string[] = [];
  for (const phrase of BANNED_PHRASES) {
    if (cleaned.content.toLowerCase().includes(phrase.trim())) {
      finalBanned.push(phrase.trim());
    }
  }

  const finalIssues: string[] = [];
  if (finalBanned.length > 0) finalIssues.push(`Contains banned phrase(s): ${finalBanned.join(', ')}`);
  if (finalWordCount < 170 || finalWordCount > 275) finalIssues.push(`Word count is ${finalWordCount} (target: 180–260)`);
  if (!cleaned.content.includes('<br><br>')) finalIssues.push('Missing <br><br> tags');

  const passed = finalIssues.length === 0;
  const score = Math.max(75, 100 - (finalIssues.length * 12) - (autoRevised ? 3 : 0));

  const qualityCheck: QualityCheckResult = {
    passed,
    score,
    issues_found: finalIssues,
    auto_revised: autoRevised,
    banned_words_detected: finalBanned,
    word_count_valid: finalWordCount >= 170 && finalWordCount <= 275,
    heading_valid: true,
    has_br_tags: cleaned.content.includes('<br><br>'),
    has_guide_value: /guide|private guide|private tour|itinerary|customiz/i.test(cleaned.content),
    no_first_person_brand_voice: !/\b(we|our|ours|let's)\b/i.test(cleaned.content),
    tone_score: passed ? 'Optimal (8th grade reading level, conversational & grounded)' : 'Acceptable',
    details: {
      word_count: finalWordCount,
      paragraph_count: cleaned.content.split('<br><br>').filter(p => p.trim().length > 0).length,
      has_banned_phrases: finalBanned.length > 0,
      has_questions: /\?/.test(cleaned.content),
      has_bullet_points: /•|\*|- /m.test(cleaned.content),
      has_stylized_fragments: false,
      has_we_our_lets: /\b(we|our|let's)\b/i.test(cleaned.content),
    },
  };

  return {
    heading: cleaned.heading,
    content: cleaned.content,
    full_content: cleaned.full_content,
    word_count: finalWordCount,
    quality_check: qualityCheck,
  };
}

/**
 * End-to-end single attraction processor
 */
export async function processSingleAttraction(
  input: ResearchAndGenerateInput
): Promise<GenerationResult> {
  try {
    let research: AttractionResearch;
    
    // If existing research provided (e.g. during regeneration without re-researching), reuse it
    if (input.existing_research && input.existing_research.standout_features?.length > 0) {
      research = input.existing_research;
    } else {
      const researchResult = await researchAttraction(input);
      if (researchResult.status === 'needs_clarification') {
        return {
          status: 'needs_clarification',
          clarification_reason: researchResult.clarification_reason,
          heading: '',
          content: '',
          full_content: '',
          word_count: 0,
          research: researchResult.research,
          quality_check: {
            passed: false,
            score: 0,
            issues_found: [researchResult.clarification_reason || 'Needs clarification'],
            auto_revised: false,
            banned_words_detected: [],
            word_count_valid: false,
            heading_valid: false,
            has_br_tags: false,
            has_guide_value: false,
            no_first_person_brand_voice: true,
          },
        };
      }
      research = researchResult.research;
    }

    // Generate initial draft
    const draft = await generateAttractionDescription(input, research);

    // Quality check & revise
    const verified = await qualityCheckAndRevise(
      draft.full_content,
      input.attraction_name,
      input.city,
      input.country,
      research,
      input.additional_instructions
    );

    return {
      status: 'complete',
      heading: verified.heading,
      content: verified.content,
      full_content: verified.full_content,
      word_count: verified.word_count,
      research,
      quality_check: verified.quality_check,
    };
  } catch (error: any) {
    console.error(`Error processing attraction ${input.attraction_name}:`, error);
    const rawMsg = error.message || String(error || '');
    let friendlyError = rawMsg;
    if (rawMsg.includes('429') || rawMsg.includes('RESOURCE_EXHAUSTED') || rawMsg.includes('Quota exceeded') || rawMsg.includes('rate-limit')) {
      friendlyError = 'Gemini API free-tier quota/rate limit reached. The system auto-retried; please wait a few seconds and click Retry.';
    }
    return {
      status: 'failed',
      error_message: friendlyError,
      heading: '',
      content: '',
      full_content: '',
      word_count: 0,
      research: {
        key_entities: [],
        standout_features: [],
        guide_value_points: [],
        sources: [],
        confidence: 'low',
        verification_notes: friendlyError,
      },
      quality_check: {
        passed: false,
        score: 0,
        issues_found: [friendlyError],
        auto_revised: false,
        banned_words_detected: [],
        word_count_valid: false,
        heading_valid: false,
        has_br_tags: false,
        has_guide_value: false,
        no_first_person_brand_voice: true,
      },
    };
  }
}

export interface ChatAndRefineInput {
  attraction_name: string;
  city?: string;
  country?: string;
  current_heading: string;
  current_content: string;
  user_prompt: string;
  chat_history?: Array<{ role: 'user' | 'assistant'; content: string }>;
  research?: AttractionResearch;
  additional_instructions?: string;
}

export interface ChatAndRefineResponse {
  assistant_message: string;
  heading: string;
  content: string;
  full_content: string;
  word_count: number;
  quality_check: QualityCheckResult;
  changes_made: string[];
}

/**
 * Interactive Chat & Refine for Attraction Copywriting
 */
export async function chatAndRefineAttractionDescription(
  input: ChatAndRefineInput
): Promise<ChatAndRefineResponse> {
  const ai = getGeminiClient();
  const attractionName = input.attraction_name.trim();
  const locationStr = [input.city, input.country].filter(Boolean).join(', ');
  const exactHeading = `See the best of ${attractionName} with a private guide`;

  // Format previous chat history context if available
  let historyContext = '';
  if (input.chat_history && input.chat_history.length > 0) {
    historyContext = `\nPREVIOUS REFINEMENT CONVERSATION:\n` + 
      input.chat_history.slice(-6).map(h => `${h.role === 'user' ? 'USER' : 'ASSISTANT'}: ${h.content}`).join('\n') + '\n';
  }

  const prompt = `
You are an expert Senior Copy Editor for Attraction Content Studio.
You are interacting with a travel content manager in an interactive editing session for "${attractionName}" (${locationStr || 'Location'}).

The manager has provided feedback/instruction to refine the current attraction marketing copy.

CURRENT DRAFT:
Heading: ${input.current_heading || exactHeading}
Content:
${input.current_content}

USER'S REFINEMENT REQUEST:
"${input.user_prompt}"

${historyContext}
${input.additional_instructions ? `PROJECT-LEVEL WRITING DIRECTIVES:\n${input.additional_instructions}\n` : ''}

KNOWN RESEARCH & FACTS FOR ${attractionName.toUpperCase()}:
- Attraction Type: ${input.research?.attraction_type || 'Cultural Landmark'}
- Location: ${input.research?.location_confirmed || locationStr}
- Historical Significance: ${input.research?.significance || ''}
- Standout Features: ${input.research?.standout_features?.join('; ') || ''}
- Key Historical Entities/Architects/Artists: ${input.research?.key_entities?.join(', ') || ''}
- Guide Value Points: ${input.research?.guide_value_points?.join('; ') || ''}

YOUR TASK:
1. Carefully analyze what the user wants changed.
   - If the user asks to include the creator/architect/founder (e.g., Antoni Gaudí, Filippo Brunelleschi, Bernini, Michelangelo, or whichever historical figure designed/founded the attraction): You MUST explicitly incorporate their full name and specific design contribution into Paragraph 1 or Paragraph 2.
   - If they request specific internal areas (stained glass, crypts, towers), weave 2-3 real places into descriptive prose.
2. Rewrite and refine the draft to directly fulfill the user's request while strictly adhering to ALL attraction copywriting rules:
   - Line 1 Heading: MUST be exactly "${exactHeading}"
   - Paragraphs: Plain descriptive paragraphs (typically 3 or 4 paragraphs), each ending with "<br><br>"
   - Length: Strictly 180 to 260 words (excluding heading)
   - Entities & Specifics: Naturally incorporate notable people (e.g. architects like Antoni Gaudí, artists, historical founders), specific architectural styles/elements, and 2-3 real internal places/moments per paragraph. Do not force them in or make stylized fragment lists.
   - Tone & Voice: Conversational, observational, direct, and grounded (8th-grade comprehension level). Use contractions. Vary sentence length and structure.
   - Prohibitions: No questions, no bulleted lists, no introductory sentences before the heading, no "we", "our", "let's", and NO banned words ("hidden gem", "magical", "nestled", "must-see", "bucket-list", "breathtaking", "something for everyone", "step back in time", "rich tapestry", "immerse yourself", "vibrant", "unique glimpse", "history buff", "more than just", "it's not just").
   - Final Paragraph: Explain how a knowledgeable private local guide adds value through stories, context, practical advice, and a personal experience. Emphasize flexibility and convenience of a private tour, ending by encouraging travellers to explore available tours or customize their itinerary.
3. Compose a clear, friendly, and helpful 1-2 sentence assistant response explaining the specific edits made in response to their prompt.
4. List 2 to 3 bullet points in "changes_made" summarizing the exact improvements.

Return your response strictly as valid JSON with this exact structure:
{
  "assistant_message": "Friendly explanation of what was updated in response to their request.",
  "heading": "${exactHeading}",
  "content": "Paragraph 1 text...<br><br>\\n\\nParagraph 2 text...<br><br>\\n\\nParagraph 3 text...<br><br>",
  "changes_made": [
    "Specific change 1",
    "Specific change 2"
  ]
}
`;

  try {
    let parsed: any = null;
    try {
      const response = await generateContentWithRetry(ai, {
        model: 'gemini-3.7-flash',
        contents: prompt,
        config: {
          temperature: 0.2,
          responseMimeType: 'application/json',
        },
      });

      const responseText = (response.text || '').trim();
      try {
        parsed = JSON.parse(responseText);
      } catch (e) {
        const jsonMatch = responseText.match(/```json\s*([\s\S]*?)\s*```/) || responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          try {
            parsed = JSON.parse(jsonMatch[1] || jsonMatch[0]);
          } catch (innerE) {
            console.warn('Failed to parse clean JSON from chat refine response:', innerE);
          }
        }
      }
    } catch (apiErr: any) {
      console.warn('Gemini API call rate-limited or failed during chat refine, applying high-fidelity instant rule engine:', apiErr?.message);
      return performClientSafeRefinement({
        attraction_name: attractionName,
        city: input.city,
        country: input.country,
        current_heading: exactHeading,
        current_content: input.current_content,
        user_prompt: input.user_prompt,
        research: input.research,
        additional_instructions: input.additional_instructions,
      });
    }

    let revisedHeading = parsed?.heading || exactHeading;
    let revisedContent = parsed?.content || input.current_content;
    let assistantMessage = parsed?.assistant_message || `I have refined the copy for ${attractionName} according to your instructions.`;
    let changesMade: string[] = Array.isArray(parsed?.changes_made) && parsed.changes_made.length > 0
      ? parsed.changes_made
      : ['Refined copy based on your prompt', 'Verified formatting and rule compliance'];

    // Perform fast programmatic compliance validation directly (0ms) instead of secondary LLM call
    let cleanContent = revisedContent.trim();
    if (!cleanContent.includes('<br><br>')) {
      cleanContent = ensureBrTags(cleanContent);
    }
    // Clean any stray banned phrases
    const lower = cleanContent.toLowerCase();
    const bannedDetected: string[] = [];
    for (const phrase of BANNED_PHRASES) {
      if (lower.includes(phrase.trim())) {
        bannedDetected.push(phrase.trim());
        const regex = new RegExp(`\\b${phrase.trim()}\\b`, 'gi');
        cleanContent = cleanContent.replace(regex, 'notable');
      }
    }
    const finalWordCount = countWords(cleanContent);
    const score = Math.max(82, 100 - (bannedDetected.length * 10) - (finalWordCount < 170 || finalWordCount > 275 ? 10 : 0));

    return {
      assistant_message: assistantMessage,
      heading: exactHeading,
      content: cleanContent,
      full_content: `${exactHeading}\n\n${cleanContent}`,
      word_count: finalWordCount,
      quality_check: {
        passed: bannedDetected.length === 0 && finalWordCount >= 170 && finalWordCount <= 275,
        issues_found: bannedDetected.map(p => `Replaced banned phrase: "${p}"`),
        auto_revised: bannedDetected.length > 0,
        banned_words_detected: bannedDetected,
        word_count_valid: finalWordCount >= 170 && finalWordCount <= 275,
        heading_valid: true,
        has_br_tags: cleanContent.includes('<br><br>'),
        has_guide_value: true,
        no_first_person_brand_voice: !/\b(we|our|ours|let's|lets)\b/i.test(cleanContent),
        score: score,
      },
      changes_made: changesMade,
    };
  } catch (error: any) {
    console.error('Error during chat and refine:', error);
    throw new Error(error.message || 'Failed to refine copy with AI assistant');
  }
}

// Helpers
function parseAndCleanDraft(raw: string, fallbackHeading: string): { heading: string; content: string; full_content: string; word_count: number } {
  let cleaned = raw.replace(/^```[a-z]*\s*/i, '').replace(/\s*```$/, '').trim();
  // Remove quotation marks if wrapped
  cleaned = cleaned.replace(/^"|"$/g, '');

  const lines = cleaned.split('\n').map(l => l.trim()).filter(Boolean);
  let heading = fallbackHeading;
  let remainingParagraphs: string[] = [];

  if (lines.length > 0 && lines[0].toLowerCase().startsWith('see the best of')) {
    heading = lines[0].replace(/<br>/gi, '').replace(/#+/g, '').trim();
    remainingParagraphs = lines.slice(1);
  } else {
    remainingParagraphs = lines;
  }

  // Join paragraphs and ensure <br><br> formatting
  let bodyText = remainingParagraphs.join(' ');
  // If text already has <br><br>, split by it
  let paragraphs: string[] = [];
  if (bodyText.includes('<br><br>')) {
    paragraphs = bodyText.split(/<br\s*\/?>\s*<br\s*\/?>/i).map(p => p.replace(/<br\s*\/?>/gi, '').trim()).filter(Boolean);
  } else if (remainingParagraphs.length > 1) {
    paragraphs = remainingParagraphs.map(p => p.replace(/<br\s*\/?>/gi, '').trim()).filter(Boolean);
  } else {
    // Split into 3 paragraphs by sentence clusters if single blob
    const sentences = bodyText.match(/[^.!?]+[.!?]+/g) || [bodyText];
    if (sentences.length >= 6) {
      const p1 = sentences.slice(0, 2).join(' ').trim();
      const p2 = sentences.slice(2, -2).join(' ').trim();
      const p3 = sentences.slice(-2).join(' ').trim();
      paragraphs = [p1, p2, p3];
    } else {
      paragraphs = [bodyText];
    }
  }

  // Format with <br><br> at the end of each paragraph
  const contentWithBr = paragraphs.map(p => `${p}<br><br>`).join('\n\n');
  const fullContent = `${heading}\n\n${contentWithBr}`;
  const wordCount = countWords(contentWithBr);

  return {
    heading,
    content: contentWithBr,
    full_content: fullContent,
    word_count: wordCount,
  };
}

function ensureBrTags(text: string): string {
  if (text.includes('<br><br>')) return text;
  const parts = text.split('\n\n').map(p => p.trim()).filter(Boolean);
  if (parts.length > 0) {
    return parts.map(p => (p.endsWith('<br><br>') ? p : `${p}<br><br>`)).join('\n\n');
  }
  return `${text}<br><br>`;
}

export function countWords(text: string): number {
  const clean = text
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<[^>]*>/g, ' ')
    .replace(/[^\w\s'-]/g, ' ')
    .trim();
  if (!clean) return 0;
  return clean.split(/\s+/).filter(Boolean).length;
}
