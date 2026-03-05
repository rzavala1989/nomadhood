import { format } from 'date-fns';

/* ── National benchmarks ── */
export const NATIONAL = {
  walkScore: 48,
  transitScore: 39,
  bikeScore: 50,
  medianRent: 1850,
  violentCrime: 380, // per 100k
  propertyCrime: 1958, // per 100k
  cpi: 313.2, // CPI-U all urban avg
  medianHourlyWage: 23.11,
};

export function formatUpdatedAt(date: Date) {
  return format(new Date(date), 'MMM d, yyyy').toUpperCase();
}

export function pctDiff(value: number, baseline: number) {
  return Math.round(((value - baseline) / baseline) * 100);
}

export function getRiskLevel(violentRate: number | null, propertyRate: number | null) {
  if (violentRate == null && propertyRate == null) return null;
  const v = violentRate ?? 0;
  const p = propertyRate ?? 0;
  if (v < 200 && p < 1500) return 'LOW RISK';
  if (v < 400 && p < 2500) return 'MODERATE';
  return 'HIGH RISK';
}

export function formatDollars(value: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatRate(rate: number) {
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(rate);
}
