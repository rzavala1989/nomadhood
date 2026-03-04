export function calculateAvgRating(reviews: { rating: number }[]): number | null {
  if (reviews.length === 0) return null;
  return reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
}

export function calculateNomadScore(
  avgRating: number | null,
  reviewCount: number,
  favoriteCount: number,
  maxReviews: number,
  maxFavorites: number,
): number {
  return Math.round(
    ((avgRating ?? 0) / 5) * 50 +
      (reviewCount / maxReviews) * 30 +
      (favoriteCount / maxFavorites) * 20,
  );
}
