export const NOMAD_SIGNAL_CATEGORIES = [
  'Infrastructure',
  'Safety',
  'Cost of Living',
  'Food and Culture',
  'Tech and Coworking',
  'Community',
] as const;

export type NomadSignalCategory = (typeof NOMAD_SIGNAL_CATEGORIES)[number];

const CATEGORY_MAP: Record<string, NomadSignalCategory> = {
  // newsdata.io categories
  politics: 'Infrastructure',
  environment: 'Infrastructure',
  science: 'Infrastructure',
  health: 'Community',
  crime: 'Safety',
  top: 'Community',
  business: 'Cost of Living',
  entertainment: 'Food and Culture',
  food: 'Food and Culture',
  tourism: 'Food and Culture',
  sports: 'Community',
  technology: 'Tech and Coworking',
  world: 'Community',
  domestic: 'Community',
  lifestyle: 'Food and Culture',
  education: 'Community',
};

const AI_TAG_MAP: Record<string, NomadSignalCategory> = {
  // Common aiTag values from newsdata.io
  'real estate': 'Cost of Living',
  housing: 'Cost of Living',
  'cost of living': 'Cost of Living',
  rent: 'Cost of Living',
  'urban development': 'Infrastructure',
  transportation: 'Infrastructure',
  infrastructure: 'Infrastructure',
  transit: 'Infrastructure',
  construction: 'Infrastructure',
  crime: 'Safety',
  'public safety': 'Safety',
  safety: 'Safety',
  violence: 'Safety',
  theft: 'Safety',
  restaurant: 'Food and Culture',
  dining: 'Food and Culture',
  'food and drink': 'Food and Culture',
  culture: 'Food and Culture',
  arts: 'Food and Culture',
  nightlife: 'Food and Culture',
  coworking: 'Tech and Coworking',
  startup: 'Tech and Coworking',
  tech: 'Tech and Coworking',
  'remote work': 'Tech and Coworking',
  wifi: 'Tech and Coworking',
  community: 'Community',
  neighborhood: 'Community',
  local: 'Community',
};

/**
 * Classify an article into nomad signal categories based on its
 * newsdata.io category[] and aiTag[] arrays.
 * Returns deduplicated categories, defaulting to ['Community'] if none match.
 */
export function classifyArticle(
  categories: string[],
  aiTags: string[],
): NomadSignalCategory[] {
  const matched = new Set<NomadSignalCategory>();

  for (const cat of categories) {
    const signal = CATEGORY_MAP[cat.toLowerCase()];
    if (signal) matched.add(signal);
  }

  for (const tag of aiTags) {
    const signal = AI_TAG_MAP[tag.toLowerCase()];
    if (signal) matched.add(signal);
  }

  return matched.size > 0 ? Array.from(matched) : ['Community'];
}
