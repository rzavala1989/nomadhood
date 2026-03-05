export const REVIEW_DIMENSIONS = ['wifi', 'safety', 'food', 'nightlife', 'walkability', 'cost_value'] as const;
export type ReviewDimensionName = typeof REVIEW_DIMENSIONS[number];
