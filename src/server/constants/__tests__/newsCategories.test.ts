import { classifyArticle } from '@/server/constants/newsCategories';

describe('classifyArticle', () => {
  it('maps category "crime" to Safety', () => {
    expect(classifyArticle(['crime'], [])).toEqual(['Safety']);
  });

  it('maps category "business" to Cost of Living', () => {
    expect(classifyArticle(['business'], [])).toEqual(['Cost of Living']);
  });

  it('maps category "technology" to Tech and Coworking', () => {
    expect(classifyArticle(['technology'], [])).toEqual(['Tech and Coworking']);
  });

  it('maps category "food" to Food and Culture', () => {
    expect(classifyArticle(['food'], [])).toEqual(['Food and Culture']);
  });

  it('maps category "politics" to Infrastructure', () => {
    expect(classifyArticle(['politics'], [])).toEqual(['Infrastructure']);
  });

  it('maps AI tag "real estate" to Cost of Living', () => {
    expect(classifyArticle([], ['real estate'])).toEqual(['Cost of Living']);
  });

  it('maps AI tag "coworking" to Tech and Coworking', () => {
    expect(classifyArticle([], ['coworking'])).toEqual(['Tech and Coworking']);
  });

  it('maps AI tag "public safety" to Safety', () => {
    expect(classifyArticle([], ['public safety'])).toEqual(['Safety']);
  });

  it('returns deduplicated signals across multiple categories', () => {
    const result = classifyArticle(['crime'], ['theft']);
    expect(result).toEqual(['Safety']);
  });

  it('returns the union when category and AI tag map to different signals', () => {
    const result = classifyArticle(['crime'], ['coworking']);
    expect(result.sort()).toEqual(['Safety', 'Tech and Coworking']);
  });

  it('deduplicates when category and AI tag overlap', () => {
    expect(classifyArticle(['crime'], ['crime'])).toEqual(['Safety']);
  });

  it('ignores unknown categories', () => {
    expect(classifyArticle(['nonsense-category'], [])).toEqual(['Community']);
  });

  it('ignores unknown AI tags', () => {
    expect(classifyArticle([], ['totally-fake-tag'])).toEqual(['Community']);
  });

  it('returns ["Community"] when both inputs are empty', () => {
    expect(classifyArticle([], [])).toEqual(['Community']);
  });

  it('matches case-insensitively for both categories and AI tags', () => {
    expect(classifyArticle(['CRIME'], [])).toEqual(['Safety']);
    expect(classifyArticle(['Crime'], [])).toEqual(['Safety']);
    expect(classifyArticle([], ['Real Estate'])).toEqual(['Cost of Living']);
    expect(classifyArticle([], ['REAL ESTATE'])).toEqual(['Cost of Living']);
  });

  it('returns only known matches when mixed with unknown inputs', () => {
    const result = classifyArticle(['crime', 'fake-cat'], ['unknown-tag', 'coworking']);
    expect(result.sort()).toEqual(['Safety', 'Tech and Coworking']);
  });
});
