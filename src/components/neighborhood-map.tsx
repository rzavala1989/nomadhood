import { useCallback, useMemo, useRef, useState } from 'react';
import Map, {
  Marker,
  Popup,
  NavigationControl,
  Source,
  Layer,
  type MapRef,
} from 'react-map-gl/maplibre';
import maplibregl from 'maplibre-gl';
import Link from 'next/link';
import type { Geometry } from 'geojson';

import 'maplibre-gl/dist/maplibre-gl.css';

type Neighborhood = {
  id: string;
  name: string;
  city: string;
  state: string;
  latitude: number | null;
  longitude: number | null;
  boundary?: unknown;
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

  const boundaryCollection = useMemo(
    () => ({
      type: 'FeatureCollection' as const,
      features: neighborhoods
        .filter((n) => n.boundary)
        .map((n) => ({
          type: 'Feature' as const,
          id: n.id,
          properties: { id: n.id, name: n.name },
          geometry: n.boundary as Geometry,
        })),
    }),
    [neighborhoods],
  );

  const bounds = useMemo(() => {
    if (markers.length === 0) return null;
    const lngs = markers.map((n) => n.longitude!);
    const lats = markers.map((n) => n.latitude!);
    return new maplibregl.LngLatBounds(
      [Math.min(...lngs) - 1, Math.min(...lats) - 1],
      [Math.max(...lngs) + 1, Math.max(...lats) + 1],
    );
  }, [markers]);

  const onMapLoad = useCallback(() => {
    if (bounds && mapRef.current) {
      mapRef.current.fitBounds(bounds, { padding: 40, maxZoom: 14 });
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

        {boundaryCollection.features.length > 0 && (
          <Source id="boundaries" type="geojson" data={boundaryCollection}>
            <Layer
              id="boundary-fill"
              type="fill"
              paint={{
                'fill-color': '#050505',
                'fill-opacity': 0.06,
              }}
            />
            <Layer
              id="boundary-line"
              type="line"
              paint={{
                'line-color': '#050505',
                'line-opacity': 0.4,
                'line-width': 1.5,
              }}
            />
          </Source>
        )}

        {markers.map((n) => {
          const isActive = selectedId === n.id || popupId === n.id;
          return (
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
                className="group cursor-pointer"
                style={{ transition: 'transform 300ms cubic-bezier(0.34, 1.56, 0.64, 1)' }}
              >
                {/* Outer pulse ring on active */}
                <div
                  className={`absolute inset-0 rounded-full transition-opacity duration-300 ${
                    isActive ? 'opacity-100' : 'opacity-0'
                  }`}
                  style={{
                    width: 20,
                    height: 20,
                    marginLeft: -4,
                    marginTop: -4,
                    background: 'rgba(255, 255, 255, 0.12)',
                  }}
                />
                {/* Dot */}
                <div
                  className="rounded-full transition-all duration-200 ease-out group-hover:scale-150"
                  style={{
                    width: isActive ? 10 : 7,
                    height: isActive ? 10 : 7,
                    background: isActive ? '#ffffff' : 'rgba(0, 0, 0, 0.7)',
                    boxShadow: isActive
                      ? '0 0 0 3px rgba(255,255,255,0.25), 0 0 8px rgba(255,255,255,0.15)'
                      : '0 0 0 2px rgba(255,255,255,0.9), 0 1px 3px rgba(0,0,0,0.3)',
                  }}
                />
              </div>
            </Marker>
          );
        })}

        {popupNeighborhood && (
          <Popup
            longitude={popupNeighborhood.longitude!}
            latitude={popupNeighborhood.latitude!}
            anchor="bottom"
            offset={10}
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
