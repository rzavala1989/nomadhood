import {
  pctDiff,
  getRiskLevel,
  formatDollars,
  formatRate,
} from '@/components/neighborhood-data-utils';

describe('pctDiff', () => {
  it('returns 100 when value doubles the baseline', () => {
    expect(pctDiff(100, 50)).toBe(100);
  });

  it('returns -50 when value is half the baseline', () => {
    expect(pctDiff(50, 100)).toBe(-50);
  });

  it('returns 0 for equal values', () => {
    expect(pctDiff(75, 75)).toBe(0);
  });

  it('returns a rounded integer', () => {
    const result = pctDiff(123, 100);
    expect(Number.isInteger(result)).toBe(true);
    expect(result).toBe(23);
  });
});

describe('getRiskLevel', () => {
  it('returns LOW RISK for low violent and low property crime', () => {
    expect(getRiskLevel(100, 1000)).toBe('LOW RISK');
  });

  it('returns MODERATE for moderate values', () => {
    expect(getRiskLevel(300, 2000)).toBe('MODERATE');
  });

  it('returns HIGH RISK for high values', () => {
    expect(getRiskLevel(500, 3000)).toBe('HIGH RISK');
  });

  it('returns null when both inputs are null', () => {
    expect(getRiskLevel(null, null)).toBeNull();
  });

  it('treats a null violent rate as 0', () => {
    expect(getRiskLevel(null, 1000)).toBe('LOW RISK');
  });

  it('treats a null property rate as 0', () => {
    expect(getRiskLevel(100, null)).toBe('LOW RISK');
  });

  it('returns MODERATE at the boundary violent=200 and property=1500', () => {
    expect(getRiskLevel(200, 1500)).toBe('MODERATE');
  });

  it('returns HIGH RISK at the boundary violent=400 and property=2500', () => {
    expect(getRiskLevel(400, 2500)).toBe('HIGH RISK');
  });
});

describe('formatDollars', () => {
  it('formats 1500 as $1,500', () => {
    expect(formatDollars(1500)).toBe('$1,500');
  });

  it('formats 0 as $0', () => {
    expect(formatDollars(0)).toBe('$0');
  });

  it('formats large numbers with thousands separators', () => {
    expect(formatDollars(1234567)).toBe('$1,234,567');
  });
});

describe('formatRate', () => {
  it('formats 380.7 as 381 (no decimals)', () => {
    expect(formatRate(380.7)).toBe('381');
  });

  it('formats 1000 as 1,000', () => {
    expect(formatRate(1000)).toBe('1,000');
  });
});
