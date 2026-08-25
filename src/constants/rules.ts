export const BANNED_PHRASES = [
  'hidden gem',
  'magical',
  'nestled',
  'must-see',
  'must see',
  'bucket-list',
  'bucket list',
  'breathtaking',
  'something for everyone',
  'step back in time',
  'rich tapestry',
  'immerse yourself',
  'vibrant',
  'offers a unique glimpse',
  'unique glimpse',
  'whether you’re a history buff',
  "whether you're a history buff",
  'history buff',
  'more than just',
  'it’s not just',
  "it's not just",
  'let’s',
  "let's",
  ' we ',
  ' our ',
  ' ours ',
];

export const TBL_RULES = {
  SUBHEADING_PREFIX: 'See the best of ',
  SUBHEADING_SUFFIX: ' with a private guide',
  MIN_WORDS: 180,
  MAX_WORDS: 260,
  TARGET_READING_LEVEL: '~8th Grade',
  DELIMITER: '<br><br>',
};

export const ORIGINAL_PROMPT_TEMPLATE = `You're a SEO travel copywriter writing for ToursByLocals, a company offering customizable, private tours.

Write content for a subheading section introducing [Attraction Name] and the reasons it's worth visiting with a private guide.

Start with the heading: See the best of [Attraction Name] with a private guide.

Highlight 3–4 standout features, areas, or moments within the attraction that show its variety

Speak to cultural depth, scenery, or unique traits of the attraction

Do not overuse adjectives — keep the tone natural and informative

Use complete sentences and avoid bulleted lists

Do not ask questions. Set a gentle, curious tone. Keep the phrasing grounded and avoid overused adjectives like "hidden gem" or "magical." Do not describe the attraction broadly. Keep comprehension at 8th grade.

Content format:
Write in plain descriptive paragraphs, no labels or colons. Each paragraph ends with <br><br>
Paragraph 1: introduce [Attraction Name] and why it's worth visiting (mention its significance or setting).
Middle paragraphs: cover 2–3 standout features, areas, or moments within the attraction, woven into natural prose rather than listed out.
Final paragraph: close on how a ToursByLocals guide adds value and can tailor the experience to the traveller.
Not every attraction needs the same number of paragraphs or the same depth — let the content match what the attraction actually offers, but keep the overall section tight enough to fit a sidebar-sized block of text, not a long-form article.

Content Rules:

Stay focused on [Attraction Name] itself. Do not mention other nearby attractions, landmarks, or things to do outside of it, even briefly — the content should be entirely about this one attraction.

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

Do not use "we", "our", "let's"`;
