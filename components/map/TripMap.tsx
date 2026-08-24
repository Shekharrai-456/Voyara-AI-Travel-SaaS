'use client';

import React, { useEffect, useState } from 'react';
import { Activity } from '@/types/trip';
import { useTheme } from '@/context/ThemeContext';
import { Compass } from 'lucide-react';

interface TripMapProps {
  activities: Activity[];
  centerCoordinates?: { lat: number; lng: number };
  selectedActivityId?: string | null;
  onSelectActivity?: (act: Activity) => void;
}

// Map Recenter Helper Component declared outside of parent render
function MapAutoFitter({ L, useMap, coords }: { L: any; useMap: any; coords: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (coords.length > 0 && map && L) {
      const bounds = L.latLngBounds(coords);
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [coords, map, L]);
  return null;
}

export default function TripMap({
  activities,
  centerCoordinates,
  selectedActivityId,
  onSelectActivity
}: TripMapProps) {
  const { isDark } = useTheme();
  const [LeafletMapComponents, setLeafletMapComponents] = useState<any>(null);

  useEffect(() => {
    let isMounted = true;
    Promise.all([
      import('leaflet'),
      import('react-leaflet')
    ]).then(([L, ReactLeaflet]) => {
      if (!isMounted) return;
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
      });

      setLeafletMapComponents({
        L,
        MapContainer: ReactLeaflet.MapContainer,
        TileLayer: ReactLeaflet.TileLayer,
        Marker: ReactLeaflet.Marker,
        Popup: ReactLeaflet.Popup,
        Polyline: ReactLeaflet.Polyline,
        useMap: ReactLeaflet.useMap
      });
    }).catch(err => {
      console.error('Failed to load Leaflet:', err);
    });

    return () => {
      isMounted = false;
    };
  }, []);

  if (!LeafletMapComponents) {
    return (
      <div className="w-full h-[450px] md:h-full min-h-[400px] rounded-3xl bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 flex flex-col items-center justify-center p-6 text-center">
        <Compass className="w-10 h-10 text-indigo-500 animate-spin mb-3" />
        <p className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">
          Loading Interactive Map...
        </p>
        <p className="text-xs text-neutral-500 mt-1">
          Rendering Mapbox / Leaflet coordinates
        </p>
      </div>
    );
  }

  const { L, MapContainer, TileLayer, Marker, Popup, Polyline, useMap } = LeafletMapComponents;

  const validActivities = activities.filter(a => typeof a.lat === 'number' && typeof a.lng === 'number');

  const defaultCenter = centerCoordinates || (validActivities.length > 0 
    ? { lat: validActivities[0].lat!, lng: validActivities[0].lng! }
    : { lat: 28.2096, lng: 83.9856 }
  );

  const polylinePositions = validActivities.map(a => [a.lat!, a.lng!]);

  const getCustomIcon = (category: string, isSelected: boolean) => {
    let colorClass = '#6366f1';
    if (category === 'Hotel') colorClass = '#3b82f6';
    if (category === 'Food') colorClass = '#f59e0b';
    if (category === 'Sightseeing') colorClass = '#8b5cf6';
    if (category === 'Activity') colorClass = '#10b981';
    if (category === 'Transport') colorClass = '#06b6d4';

    const size = isSelected ? 36 : 28;

    const svgHtml = `
      <div style="
        width: ${size}px;
        height: ${size}px;
        background-color: ${colorClass};
        border: 3px solid white;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        transform: translate(-50%, -50%);
        cursor: pointer;
      ">
        <div style="width: 8px; height: 8px; background-color: white; border-radius: 50%;"></div>
      </div>
    `;

    return L.divIcon({
      className: 'custom-leaflet-marker',
      html: svgHtml,
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2],
    });
  };

  const tileUrl = isDark
    ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
    : 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';

  return (
    <div className="relative w-full h-[450px] md:h-full min-h-[400px] rounded-3xl overflow-hidden border border-neutral-200/80 dark:border-neutral-800 shadow-xl z-0">
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.7.1/dist/leaflet.css" />

      <MapContainer
        center={[defaultCenter.lat, defaultCenter.lng]}
        zoom={12}
        style={{ width: '100%', height: '100%', zIndex: 0 }}
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://carto.com/">CARTO</a> &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>'
          url={tileUrl}
        />

        {polylinePositions.length > 1 && (
          <Polyline
            positions={polylinePositions as [number, number][]}
            color={isDark ? '#38bdf8' : '#4338ca'}
            weight={3}
            dashArray="6, 8"
            opacity={0.8}
          />
        )}

        {validActivities.map((act) => {
          const isSelected = act.id === selectedActivityId;
          return (
            <Marker
              key={act.id}
              position={[act.lat!, act.lng!]}
              icon={getCustomIcon(act.category, isSelected)}
              eventHandlers={{
                click: () => onSelectActivity && onSelectActivity(act)
              }}
            >
              <Popup className="custom-leaflet-popup">
                <div className="p-1 space-y-1 max-w-[200px]">
                  <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-indigo-600">
                    <span>{act.category}</span>
                    <span>{act.time}</span>
                  </div>
                  <h4 className="font-bold text-sm text-neutral-900 leading-tight">
                    {act.title}
                  </h4>
                  <p className="text-xs text-neutral-600 line-clamp-2">
                    {act.locationName}
                  </p>
                  {act.estimatedCost > 0 && (
                    <p className="text-xs font-semibold text-emerald-600 pt-1">
                      Est. Cost: {act.estimatedCost}
                    </p>
                  )}
                </div>
              </Popup>
            </Marker>
          );
        })}

        {polylinePositions.length > 0 && (
          <MapAutoFitter L={L} useMap={useMap} coords={polylinePositions as [number, number][]} />
        )}
      </MapContainer>

      <div className="absolute bottom-4 left-4 bg-white/90 dark:bg-neutral-900/90 backdrop-blur-md px-3 py-2 rounded-xl border border-neutral-200/80 dark:border-neutral-800 shadow-md text-[10px] font-medium flex items-center gap-3 z-[1000]">
        <div className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span> Hotel
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> Food
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Activity
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-indigo-500"></span> Sight
        </div>
      </div>
    </div>
  );
}
