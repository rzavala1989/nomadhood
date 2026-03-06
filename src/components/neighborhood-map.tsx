import { useCallback, useMemo, useRef, useState } from 'react';
import Map, {
  Popup,
  NavigationControl,
  Source,
  Layer,
  type MapRef,
  type MapLayerMouseEvent,
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
  avgRating?: number | null;
  nomadScore?: number;
  _count: { reviews: number; favorites: number };
};

type ImageMapEntry = {
  thumbUrl: string | null;
  imageUrl: string;
  altText?: string | null;
};

export default function NeighborhoodMap({
  neighborhoods,
  selectedId,
  onSelect,
  minScore = 0,
  imageMap,
}: {
  neighborhoods: Neighborhood[];
  selectedId?: string | null;
  onSelect?: (id: string | null) => void;
  minScore?: number;
  imageMap?: Record<string, ImageMapEntry[]>;
}) {
  const mapRef = useRef<MapRef>(null);
  const [popupId, setPopupId] = useState<string | null>(null);

  /* ---------- GeoJSON data ---------- */

  const pointsCollection = useMemo(
    () => ({
      type: 'FeatureCollection' as const,
      features: neighborhoods
        .filter((n) => n.latitude != null && n.longitude != null)
        .map((n) => ({
          type: 'Feature' as const,
          properties: {
            id: n.id,
            name: n.name,
            city: n.city,
            state: n.state,
            reviewCount: n._count.reviews,
            favoriteCount: n._count.favorites,
            nomadScore: n.nomadScore ?? 0,
            avgRating: n.avgRating ?? 0,
          },
          geometry: {
            type: 'Point' as const,
            coordinates: [n.longitude!, n.latitude!],
          },
        })),
    }),
    [neighborhoods],
  );

  const filteredCollection = useMemo(() => {
    if (minScore <= 0) return pointsCollection;
    return {
      ...pointsCollection,
      features: pointsCollection.features.filter(
        (f) => (f.properties?.nomadScore ?? 0) >= minScore,
      ),
    };
  }, [pointsCollection, minScore]);

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

  /* ---------- Fit bounds ---------- */

  const validPoints = useMemo(
    () => neighborhoods.filter((n) => n.latitude != null && n.longitude != null),
    [neighborhoods],
  );

  const bounds = useMemo(() => {
    if (validPoints.length === 0) return null;
    const lngs = validPoints.map((n) => n.longitude!);
    const lats = validPoints.map((n) => n.latitude!);
    return new maplibregl.LngLatBounds(
      [Math.min(...lngs) - 1, Math.min(...lats) - 1],
      [Math.max(...lngs) + 1, Math.max(...lats) + 1],
    );
  }, [validPoints]);

  const onMapLoad = useCallback(() => {
    if (!mapRef.current) return;
    // Single point: center and zoom in tight instead of fitting a wide bounding box
    if (validPoints.length === 1) {
      mapRef.current.jumpTo({
        center: [validPoints[0].longitude!, validPoints[0].latitude!],
        zoom: 14,
      });
    } else if (bounds) {
      mapRef.current.fitBounds(bounds, { padding: 40, maxZoom: 14 });
    }
  }, [bounds, validPoints]);

  /* ---------- Click handlers ---------- */

  const onClick = useCallback(
    (e: MapLayerMouseEvent) => {
      const map = mapRef.current?.getMap();
      if (!map) return;

      // Check cluster click first
      const clusterFeatures = map.queryRenderedFeatures(e.point, {
        layers: ['cluster-circles'],
      });
      if (clusterFeatures.length > 0) {
        const feature = clusterFeatures[0];
        const clusterId = feature.properties?.cluster_id;
        // eslint-disable-next-line @typescript-eslint/non-nullable-type-assertion-style
        const source = map.getSource('neighborhoods') as maplibregl.GeoJSONSource;
        if (source && clusterId != null) {
          source.getClusterExpansionZoom(clusterId).then((zoom) => {
            const geom = feature.geometry as GeoJSON.Point;
            map.easeTo({
              center: geom.coordinates as [number, number],
              zoom: zoom + 0.5,
              duration: 500,
            });
          });
        }
        return;
      }

      // Check unclustered point click
      const pointFeatures = map.queryRenderedFeatures(e.point, {
        layers: ['unclustered-point'],
      });
      if (pointFeatures.length > 0) {
        const id = pointFeatures[0].properties?.id;
        if (id) {
          setPopupId(id);
          onSelect?.(id);
        }
        return;
      }

      // Click on empty space
      setPopupId(null);
      onSelect?.(null);
    },
    [onSelect],
  );

  const onMouseEnter = useCallback(() => {
    const map = mapRef.current?.getMap();
    if (map) map.getCanvas().style.cursor = 'pointer';
  }, []);

  const onMouseLeave = useCallback(() => {
    const map = mapRef.current?.getMap();
    if (map) map.getCanvas().style.cursor = '';
  }, []);

  /* ---------- Popup data ---------- */

  const popupFeature = useMemo(
    () => filteredCollection.features.find((f) => f.properties.id === popupId),
    [filteredCollection, popupId],
  );

  /* ---------- Selected marker expression ---------- */

  const currentSelectedId = selectedId ?? '';

  /* ---------- Render ---------- */

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
        onClick={onClick}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        interactiveLayerIds={['unclustered-point', 'cluster-circles']}
        initialViewState={{
          longitude: -98.5,
          latitude: 39.8,
          zoom: 3.5,
        }}
        style={{ width: '100%', height: '100%' }}
        attributionControl={false}
      >
        <NavigationControl position="top-right" showCompass={false} />

        {/* Boundary polygons */}
        {boundaryCollection.features.length > 0 && (
          <Source id="boundaries" type="geojson" data={boundaryCollection}>
            <Layer
              id="boundary-fill"
              type="fill"
              paint={{
                'fill-color': '#e4a4bd',
                'fill-opacity': 0.12,
              }}
            />
            <Layer
              id="boundary-line"
              type="line"
              paint={{
                'line-color': '#e4a4bd',
                'line-opacity': 0.3,
                'line-width': 1.5,
              }}
            />
          </Source>
        )}

        {/* Clustered neighborhood points */}
        <Source
          id="neighborhoods"
          type="geojson"
          data={filteredCollection}
          cluster={true}
          clusterMaxZoom={12}
          clusterRadius={50}
        >
          {/* Cluster circles */}
          <Layer
            id="cluster-circles"
            type="circle"
            filter={['has', 'point_count']}
            paint={{
              'circle-color': '#e4a4bd',
              'circle-radius': [
                'step',
                ['get', 'point_count'],
                14,
                5, 18,
                10, 22,
              ],
              'circle-stroke-width': 1.5,
              'circle-stroke-color': '#e4a4bd',
            }}
          />

          {/* Cluster count labels */}
          <Layer
            id="cluster-count"
            type="symbol"
            filter={['has', 'point_count']}
            layout={{
              'text-field': '{point_count_abbreviated}',
              'text-size': 11,
            }}
            paint={{
              'text-color': '#ffffff',
            }}
          />

          {/* Unclustered individual points */}
          <Layer
            id="unclustered-point"
            type="circle"
            filter={['!', ['has', 'point_count']]}
            paint={{
              'circle-radius': [
                'interpolate', ['linear'], ['get', 'nomadScore'],
                0, 5,
                50, 9,
                100, 14,
              ],
              'circle-opacity': [
                'interpolate', ['linear'], ['get', 'reviewCount'],
                0, 0.45,
                3, 0.65,
                10, 0.85,
                20, 1.0,
              ],
              'circle-color': '#e4a4bd',
              'circle-stroke-width': [
                'case',
                ['==', ['get', 'id'], currentSelectedId],
                2.5,
                1.5,
              ],
              'circle-stroke-color': [
                'case',
                ['==', ['get', 'id'], currentSelectedId],
                '#e4a4bd',
                'rgba(255, 255, 255, 0.9)',
              ],
              'circle-stroke-opacity': [
                'case',
                ['==', ['get', 'id'], currentSelectedId],
                1,
                0.7,
              ],
            }}
          />
        </Source>

        {/* Popup */}
        {popupFeature && (
          <Popup
            longitude={popupFeature.geometry.coordinates[0]}
            latitude={popupFeature.geometry.coordinates[1]}
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
              {imageMap?.[popupFeature.properties.id]?.[0] && (
                <img
                  src={
                    imageMap[popupFeature.properties.id][0].thumbUrl ??
                    imageMap[popupFeature.properties.id][0].imageUrl
                  }
                  alt={imageMap[popupFeature.properties.id][0].altText ?? popupFeature.properties.name}
                  className="h-[60px] w-full object-cover mb-[var(--space-2)]"
                  style={{
                    opacity: 0.85,
                  }}
                />
              )}
              <div className="flex items-start justify-between gap-[var(--space-2)]">
                <Link
                  href={`/neighborhoods/${popupFeature.properties.id}`}
                  className="text-body font-medium text-[--text-primary] hover:text-[--text-secondary] transition-colors"
                >
                  {popupFeature.properties.name}
                </Link>
                {popupFeature.properties.nomadScore > 0 && (
                  <span className="shrink-0 bg-vapor text-white px-[var(--space-1)] py-px text-[8px] tracking-[0.15em] uppercase">
                    {popupFeature.properties.nomadScore}
                  </span>
                )}
              </div>
              <p className="text-micro text-[--text-ghost] mt-[var(--space-1)]">
                {popupFeature.properties.city}, {popupFeature.properties.state}
              </p>
              <div className="flex gap-[var(--space-3)] mt-[var(--space-2)]">
                <span className="text-micro text-[--text-tertiary]">
                  {popupFeature.properties.reviewCount} reviews
                </span>
                <span className="text-micro text-[--text-tertiary]">
                  {popupFeature.properties.favoriteCount} favorites
                </span>
              </div>
            </div>
          </Popup>
        )}
      </Map>
    </div>
  );
}
