import { REVIEW_DIMENSIONS, type ReviewDimensionName } from '@/server/constants/dimensions';

describe('REVIEW_DIMENSIONS', () => {
  it('has exactly 6 entries', () => {
    expect(REVIEW_DIMENSIONS.length).toBe(6);
  });

  it('contains the expected dimension names', () => {
    expect([...REVIEW_DIMENSIONS].sort()).toEqual(
      ['cost_value', 'food', 'nightlife', 'safety', 'walkability', 'wifi'].sort(),
    );
  });

  it('ReviewDimensionName is a union of the 6 values (compile-time check)', () => {
    const names: ReviewDimensionName[] = [
      'wifi',
      'safety',
      'food',
      'nightlife',
      'walkability',
      'cost_value',
    ];
    expect(names.length).toBe(6);
  });
});
