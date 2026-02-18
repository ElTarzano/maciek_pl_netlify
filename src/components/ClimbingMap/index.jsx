import React, { useEffect, useRef, useState } from 'react';
import styles from './styles.module.css';

const MAPTILER_API_KEY = 'ZBiHCUN9GyfuBsHAGJST ';

const climbingWalls = [
  {
    id: 1,
    name: 'MOOD Bouldering',
    address: 'Stanisława Klimeckiego 14B',
    lat: 50.0491838,
    lng: 19.9702138,
    type: 'Bouldering',
    hours: 'Wt–Pt: 7:00–23:00 | Sob–Nd: 9:00–23:00 | Pon: 15:00–23:00',
    description: 'Przytulna ścianka boulderowa z własną piekarnią i kawiarnią. Przyjazna atmosfera, różnorodne drogi.',
    website: 'https://mood.climbing',
  },
  {
    id: 2,
    name: 'Avatar Climbing',
    address: 'Sikorki 21A',
    lat: 50.061538,
    lng: 20.0170731,
    type: 'Lead + Boulder',
    hours: 'Pon–Pt: 7:00–23:00 | Sob–Nd: 9:00–22:00',
    description: 'Największa ścianka wspinaczkowa w Krakowie. Prowadzenie, toprópe, bouldering, trampoliny i akrobatyka.',
    website: 'https://avatarclimbing.pl',
  },
  {
    id: 3,
    name: 'CUBE Baldy',
    address: 'Centralna 41A',
    lat: 50.0681472,
    lng: 20.0148863,
    type: 'Bouldering',
    hours: 'Wt–Pt: 10:00–23:00 | Sob–Nd: 9:00–22:00 | Pon: 15:00–23:00',
    description: 'Techniczna ścianka boulderowa z unikalną atmosferą i świetnymi trasami. Często organizowane imprezy z DJ-em.',
    website: 'https://cubebaldy.pl',
  },
  {
    id: 4,
    name: 'Slab Bouldering',
    address: 'Zakopiańska 105 (Galeria Solvay Park)',
    lat: 50.0141271,
    lng: 19.927616,
    type: 'Bouldering',
    hours: 'Pon–Pt: 10:00–23:00 | Sob: 9:00–23:00 | Nd: 9:00–22:00',
    description: 'Klimatyczna ścianka boulderowa w galerii handlowej. Dobra kawa, trasy przyjazne dla psów.',
    website: null,
  },
  {
    id: 5,
    name: 'Centrum Wspinaczkowe Forteca (Ludowa)',
    address: 'Ludowa 6',
    lat: 50.038785,
    lng: 19.963562,
    type: 'Lead + Boulder',
    hours: 'Pon–Pt: 10:00–23:00 | Sob–Nd: 10:00–22:00',
    description: 'Centrum wspinaczkowe z prowadzeniem i boulderingiem. Organizacja kursów i szkoleń.',
    website: 'https://forteca.krakow.pl',
  },
  {
    id: 6,
    name: 'Fortress Climbing Centre (Racławicka)',
    address: 'Racławicka 60',
    lat: 50.0810419,
    lng: 19.9209679,
    type: 'Lead + Boulder',
    hours: 'Pon–Pt: 10:00–23:00 | Sob–Nd: 10:00–22:00',
    description: 'Centrum wspinaczkowe z prowadzeniem i boulderingiem. Organizacja zajęć dla dzieci.',
    website: null,
  },
  {
    id: 7,
    name: 'BRONX BOULDERING',
    address: 'Ojcowska 166A',
    lat: 50.1048548,
    lng: 19.8823456,
    type: 'Bouldering',
    hours: 'Wt–Pt: 7:00–23:00 | Sob–Nd: 9:00–23:00 | Pon: 14:00–23:00',
    description: 'Najlepsze wyznaczanie tras w Krakowie według wielu wspinaczy. Świetna kawa i przyjazna społeczność.',
    website: null,
  },
  {
    id: 8,
    name: 'Reni-Sport',
    address: 'Szymona Szymonowica 83',
    lat: 50.008493,
    lng: 19.8786039,
    type: 'Lead + Boulder',
    hours: 'Pon: 14:00–22:30 | Wt–Czw: 12:00–22:30 | Pt: 12:00–22:00 | Sob–Nd: 10:00–21:00',
    description: 'Centrum wspinaczkowe z trasami dla każdego poziomu. Znakomite miejsce na urodziny i grupowe zajęcia.',
    website: null,
  },
  {
    id: 9,
    name: 'Centrum Wspinaczkowe Forteca (Rydlówka)',
    address: 'Rydlówka 32',
    lat: 50.0351323,
    lng: 19.9325671,
    type: 'Lead + Boulder',
    hours: 'Pon–Pt: 10:00–23:00 | Sob–Nd: 10:00–20:00',
    description: 'Duże centrum wspinaczkowe z sekcją dla dzieci, boulderingiem, campus rungs i prowadzeniem.',
    website: 'https://forteca.krakow.pl',
  },
];

const TYPE_COLOR = {
  'Bouldering':     '#4ade80',
  'Lead + Boulder': '#60a5fa',
};

const TYPE_ICON = {
  'Bouldering':     '🧗',
  'Lead + Boulder': '🪢',
};

export default function ClimbingMapMinimal() {
  const mapRef        = useRef(null);
  const mapInstanceRef = useRef(null);
  const [selectedWall, setSelectedWall] = useState(null);
  const [leafletLoaded, setLeafletLoaded] = useState(false);

  /* ── Load Leaflet dynamically (SSR-safe) ── */
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const load = async () => {
      if (!window.L) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(link);

        await new Promise((res, rej) => {
          const s = document.createElement('script');
          s.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
          s.onload = res;
          s.onerror = rej;
          document.head.appendChild(s);
        });
      }
      setLeafletLoaded(true);
    };

    load();
  }, []);

  /* ── Init map ── */
  useEffect(() => {
    if (!leafletLoaded || !mapRef.current || mapInstanceRef.current) return;

    const L = window.L;

    const map = L.map(mapRef.current, {
      center: [50.0647, 19.945],
      zoom: 12,
      zoomControl: false,
    });

    mapInstanceRef.current = map;

    L.tileLayer(
      `https://api.maptiler.com/maps/streets-v2/{z}/{x}/{y}.png?key=${MAPTILER_API_KEY}`,
      {
        tileSize: 512,
        zoomOffset: -1,
        minZoom: 1,
        crossOrigin: true,
      }
    ).addTo(map);

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    /* ── Markers ── */
    climbingWalls.forEach((wall) => {
      const color = TYPE_COLOR[wall.type] ?? '#f59e0b';
      const icon  = L.divIcon({
        className: '',
        html: `
          <div style="
            width: 36px;
            height: 36px;
            background: ${color};
            border-radius: 50% 50% 50% 0;
            transform: rotate(-45deg);
            box-shadow: 0 3px 12px rgba(0,0,0,0.35);
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
          ">
            <span style="transform: rotate(45deg); font-size: 15px; display: block; margin-left: -1px; margin-top: -3px;">
              ${TYPE_ICON[wall.type] ?? '📍'}
            </span>
          </div>`,
        iconSize:   [36, 36],
        iconAnchor: [18, 36],
      });

      L.marker([wall.lat, wall.lng], { icon })
        .addTo(map)
        .on('click', () => {
          setSelectedWall(wall);
          map.flyTo([wall.lat, wall.lng], 15, { duration: 0.7 });
        });
    });
  }, [leafletLoaded]);

  return (
    <div className={styles.wrapper}>
      {/* Map */}
      <div ref={mapRef} className={styles.map} />

      {!leafletLoaded && (
        <div className={styles.loader}>
          <div className={styles.spinner} />
          <p>Ładowanie mapy…</p>
        </div>
      )}

      {/* Popup */}
      {selectedWall && (
        <div className={styles.popup}>
          <button className={styles.close} onClick={() => setSelectedWall(null)}>✕</button>

          <div className={styles.popupHeader}>
            <span className={styles.popupIcon}>{TYPE_ICON[selectedWall.type]}</span>
            <div>
              <h3 className={styles.popupName}>{selectedWall.name}</h3>
              <span
                className={styles.popupBadge}
                style={{ background: TYPE_COLOR[selectedWall.type] + '22', color: TYPE_COLOR[selectedWall.type] }}
              >
                {selectedWall.type}
              </span>
            </div>
          </div>

          <p className={styles.popupDesc}>{selectedWall.description}</p>

          <div className={styles.popupMeta}>
            <div className={styles.popupMetaRow}>
              <span className={styles.popupMetaIcon}>📍</span>
              <span>{selectedWall.address}</span>
            </div>
            <div className={styles.popupMetaRow}>
              <span className={styles.popupMetaIcon}>🕐</span>
              <span>{selectedWall.hours}</span>
            </div>
          </div>

          {selectedWall.website && (
            <a href={selectedWall.website} target="_blank" rel="noopener noreferrer" className={styles.popupLink}>
              Odwiedź stronę →
            </a>
          )}
        </div>
      )}

      {/* Compact legend */}
      <div className={styles.legend}>
        {Object.entries(TYPE_COLOR).map(([type, color]) => (
          <span key={type} className={styles.legendItem}>
            <span className={styles.legendDot} style={{ background: color }} />
            {type}
          </span>
        ))}
      </div>
    </div>
  );
}
