// Shared return types for external API services.
// "fetch" functions write to DB and return these types.
// "get" functions read from DB and return these types (or null).

export type WalkScoreData = {
  walkScore: number | null;
  transitScore: number | null;
  bikeScore: number | null;
  walkDescription: string | null;
  transitDescription: string | null;
  bikeDescription: string | null;
  fetchedAt: Date;
};

export type RentData = {
  zip: string;
  medianRent: number | null;
  medianRentSqft: number | null;
  medianSalePrice: number | null;
  medianSaleSqft: number | null;
  fetchedAt: Date;
};

export type CrimeData = {
  city: string;
  state: string;
  oriCode: string | null;
  violentCrimeRate: number | null;
  propertyCrimeRate: number | null;
  population: number | null;
  dataYear: number | null;
  dataQuality: 'complete' | 'partial' | 'unavailable';
  fetchedAt: Date;
};

export type BlsData = {
  seriesId: string;
  city: string;
  state: string;
  seriesType: 'cpi' | 'wage';
  value: number | null;
  period: string | null;
  year: number | null;
  fetchedAt: Date;
};

export type EventbriteData = {
  city: string;
  state: string;
  upcomingEventCount: number;
  events: EventbriteListing[];
  fetchedAt: Date;
};

export type EventbriteListing = {
  name: string;
  date: string;
  url: string;
  isFree: boolean;
};

// Aggregated result returned by data.getAll
export type NeighborhoodExternalData = {
  walkScore: WalkScoreData | null;
  rentData: RentData | null;
  crimeData: CrimeData | null;
  costOfLiving: {
    cpi: BlsData | null;
    wage: BlsData | null;
  };
  events: EventbriteData | null;
};

// Rate limit tracker info for admin UI
export type RateLimitInfo = {
  apiName: string;
  callCount: number;
  periodStart: Date;
  periodEnd: Date;
  lastCalledAt: Date | null;
};
