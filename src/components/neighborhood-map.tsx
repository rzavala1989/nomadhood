import { useCallback, useMemo, useRef, useState } from 'react';
import Map, {
  Marker,
  Popup,
  NavigationControl,
  type MapRef,
} from 'react-map-gl/maplibre';
import maplibregl from 'maplibre-gl';
import { MapPinIcon } from 'lucide-react';
import Link from 'next/link';

import 'maplibre-gl/dist/maplibre-gl.css';

type Neighborhood = {
  id: string;
  name: string;
  city: string;
  state: string;
  latitude: number | null;
  longitude: number | null;
  _count: { reviews: number; favorites: number };
};

export default function NeighborhoodMap({
  neighborhoods,
  selectedId,
  onSelect,
}: {
  neighborhoods: Neighborhood[];
  selectedId?: string | null;
  onSelect?: (id: string | null) => void;
}) {
  const mapRef = useRef<MapRef>(null);
  const [popupId, setPopupId] = useState<string | null>(null);

  const markers = useMemo(
    () => neighborhoods.filter((n) => n.latitude != null && n.longitude != null),
    [neighborhoods],
  );

  const bounds = useMemo(() => {
    if (markers.length === 0) return null;
    const lngs = markers.map((n) => n.longitude!);
    const lats = markers.map((n) => n.latitude!);
    return new maplibregl.LngLatBounds(
      [Math.min(...lngs) - 0.5, Math.min(...lats) - 0.5],
      [Math.max(...lngs) + 0.5, Math.max(...lats) + 0.5],
    );
  }, [markers]);

  const onMapLoad = useCallback(() => {
    if (bounds && mapRef.current) {
      mapRef.current.fitBounds(bounds, { padding: 60, maxZoom: 12 });
    }
  }, [bounds]);

  const popupNeighborhood = markers.find((n) => n.id === popupId);

  const maptilerKey = process.env.NEXT_PUBLIC_MAPTILER_KEY;
  const mapStyle = maptilerKey
    ? `https://api.maptiler.com/maps/dataviz-light/style.json?key=${maptilerKey}`
    : `https://basemaps.cartocdn.com/gl/positron-gl-style/style.json`;

  return (
    <div className="relative h-full w-full [box-shadow:inset_0_0_0_1px_var(--border-default)]">
      <Map
        ref={mapRef}
        mapLib={maplibregl}
        mapStyle={mapStyle}
        onLoad={onMapLoad}
        initialViewState={{
          longitude: -98.5,
          latitude: 39.8,
          zoom: 3.5,
        }}
        style={{ width: '100%', height: '100%' }}
        attributionControl={false}
      >
        <NavigationControl position="top-right" showCompass={false} />

        {markers.map((n) => (
          <Marker
            key={n.id}
            longitude={n.longitude!}
            latitude={n.latitude!}
            anchor="center"
            onClick={(e) => {
              e.originalEvent.stopPropagation();
              setPopupId(n.id);
              onSelect?.(n.id);
            }}
          >
            <div
              className={`flex h-6 w-6 items-center justify-center transition-all ${
                selectedId === n.id || popupId === n.id
                  ? 'scale-125 bg-[--bg-inverse]'
                  : 'bg-[--bg-inverse]/80 hover:scale-110'
              }`}
            >
              <MapPinIcon className="h-3 w-3 text-[--text-inverse]" />
            </div>
          </Marker>
        ))}

        {popupNeighborhood && (
          <Popup
            longitude={popupNeighborhood.longitude!}
            latitude={popupNeighborhood.latitude!}
            anchor="bottom"
            offset={16}
            closeOnClick={false}
            onClose={() => {
              setPopupId(null);
              onSelect?.(null);
            }}
            className="nomad-popup"
          >
            <div className="min-w-[180px] bg-[--bg-root] p-[var(--space-3)]">
              <Link
                href={`/neighborhoods/${popupNeighborhood.id}`}
                className="text-body font-medium text-[--text-primary] hover:text-[--text-secondary] transition-colors"
              >
                {popupNeighborhood.name}
              </Link>
              <p className="text-micro text-[--text-ghost] mt-[var(--space-1)]">
                {popupNeighborhood.city}, {popupNeighborhood.state}
              </p>
              <div className="flex gap-[var(--space-3)] mt-[var(--space-2)]">
                <span className="text-micro text-[--text-tertiary]">
                  {popupNeighborhood._count.reviews} reviews
                </span>
                <span className="text-micro text-[--text-tertiary]">
                  {popupNeighborhood._count.favorites} favorites
                </span>
              </div>
            </div>
          </Popup>
        )}
      </Map>
    </div>
  );
}
