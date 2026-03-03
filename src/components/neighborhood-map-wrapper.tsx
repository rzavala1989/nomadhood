import dynamic from 'next/dynamic';

export const NeighborhoodMap = dynamic(
  () => import('./neighborhood-map'),
  { ssr: false },
);
