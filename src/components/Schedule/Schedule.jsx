import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';

import {
  LOGO_URL,
  CATEGORIES,
  CATEGORY_LIGHT,
  DAYS,
  DAYS_SHORT,
  HOURS,
  DESKTOP_SLOT_HEIGHT,
  SCHEDULE,
} from './Schedule.constants';

import {
  getTodayIndex,
  fmt,
  spotsInfo,
  useIsMobile,
  useSlide,
  useMobileSlotHeight,
} from './Schedule.utils';

import './Schedule.css';

// ─── SpotsBadge ───────────────────────────────────────────────────
function SpotsBadge({ spots, small }) {
  const si = spotsInfo(spots);
  return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: small ? '0.58rem' : '0.62rem', fontWeight: 600, color: si.color, marginTop: 2 }}>
        <div style={{ width: small ? 6 : 7, height: small ? 6 : 7, borderRadius: '50%', backgroundColor: si.dot, flexShrink: 0 }} />
        {spots === 0 ? 'Brak miejsc' : `${spots} miejsc`}
      </div>
  );
}

// ─── EventPopup ───────────────────────────────────────────────────
function EventPopup({ event, onClose, isMobile }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  if (!mounted) return null;

  const cat      = CATEGORIES[event.category];
  const lightCat = CATEGORY_LIGHT[event.category];
  const si       = spotsInfo(event.spots);
  const hasImage = !!event.image;

  const popupWidth  = isMobile ? 'min(430px, 96vw)' : 'min(560px, 92vw)';
  const imageHeight = isMobile ? 160 : 210;
  const titleSize   = isMobile ? '1.1rem'  : '1.25rem';
  const bodyPad     = isMobile ? '14px 18px 18px' : '18px 24px 22px';
  const headerPad   = isMobile ? '12px 18px 11px' : '14px 24px 13px';
  const metaSize    = isMobile ? '0.82rem' : '0.9rem';
  const descSize    = isMobile ? '0.88rem' : '0.95rem';

  const popup = (
      <>
        {/* Backdrop */}
        <div
            onClick={onClose}
            style={{ position: 'fixed', inset: 0, zIndex: 9998, backgroundColor: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(3px)', WebkitBackdropFilter: 'blur(3px)' }}
        />

        {/* Dialog */}
        <div
            className="sched-popup"
            role="dialog"
            aria-modal="true"
            style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 9999, width: popupWidth, backgroundColor: 'var(--sched-popup-bg)', borderRadius: 'var(--sched-radius-lg)', boxShadow: 'var(--sched-shadow-lg)', overflow: 'hidden' }}
        >
          {/* Hero */}
          <div style={{
            width: '100%', height: imageHeight,
            backgroundColor: lightCat.bg,
            backgroundImage: hasImage ? `url(${event.image})` : 'none',
            backgroundSize: 'cover', backgroundPosition: 'center',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            position: 'relative', overflow: 'hidden',
            borderBottom: `3px solid ${lightCat.color}`,
          }}>
            {hasImage && (
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0.18), rgba(0,0,0,0.28))' }} />
            )}
            {!hasImage && (
                <img src={LOGO_URL} alt="Zdjęcie zajęć" style={{ maxWidth: isMobile ? 120 : 160, maxHeight: isMobile ? 120 : 160, opacity: 0.85, userSelect: 'none' }} />
            )}
            <button
                onClick={onClose}
                aria-label="Zamknij"
                style={{ position: 'absolute', top: 10, right: 10, background: 'rgba(255,255,255,0.82)', border: 'none', borderRadius: 20, color: '#333', fontSize: '0.85rem', cursor: 'pointer', padding: '4px 10px', lineHeight: 1.4, fontWeight: 700, backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)' }}
            >✕</button>
          </div>

          {/* Category + title */}
          <div style={{ padding: headerPad, backgroundColor: lightCat.color }}>
            <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'rgba(255,255,255,0.85)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 5 }}>
              {cat.emoji} {event.category}
            </div>
            <div style={{ fontSize: titleSize, fontWeight: 700, color: '#fff', lineHeight: 1.25 }}>
              {event.name}
            </div>
          </div>

          {/* Body */}
          <div style={{ padding: bodyPad, backgroundColor: 'var(--sched-popup-bg)' }}>
            <div style={{ display: 'flex', gap: isMobile ? 14 : 24, marginBottom: 10, flexWrap: 'wrap' }}>
              <div style={{ fontSize: metaSize, color: 'var(--sched-subtext)' }}>
                🕐 <strong style={{ color: 'var(--sched-text)' }}>{fmt(event.start)} – {fmt(event.end)}</strong>
              </div>
              <div style={{ fontSize: metaSize, color: 'var(--sched-subtext)' }}>
                🏔️ <strong style={{ color: 'var(--sched-text)' }}>{event.level}</strong>
              </div>
            </div>

            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '5px 12px', borderRadius: 20, marginBottom: 14, backgroundColor: si.bg, border: '1px solid var(--sched-popup-border)' }}>
              <div style={{ width: 9, height: 9, borderRadius: '50%', backgroundColor: si.dot, flexShrink: 0, boxShadow: `0 0 0 3px ${si.dot}33` }} />
              <span style={{ fontSize: isMobile ? '0.8rem' : '0.85rem', fontWeight: 600, color: si.color }}>{si.label}</span>
            </div>

            <p style={{ margin: 0, fontSize: descSize, lineHeight: 1.65, color: 'var(--sched-text)', borderTop: '1px solid var(--sched-popup-border)', paddingTop: isMobile ? 12 : 14, marginBottom: event.spots > 0 ? 16 : 0 }}>
              {event.desc}
            </p>

            {event.spots > 0 && (
                <a
                    href="/kontakt"
                    style={{ display: 'block', width: '100%', boxSizing: 'border-box', padding: isMobile ? '12px 16px' : '13px 18px', borderRadius: 12, textAlign: 'center', backgroundColor: lightCat.color, color: '#fff', fontWeight: 700, fontSize: isMobile ? '0.95rem' : '1rem', textDecoration: 'none', transition: 'filter 0.15s, transform 0.15s' }}
                    onMouseEnter={e => { e.currentTarget.style.filter = 'brightness(1.1)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                    onMouseLeave={e => { e.currentTarget.style.filter = 'none'; e.currentTarget.style.transform = 'none'; }}
                >
                  Zapisz się →
                </a>
            )}
          </div>
        </div>
      </>
  );

  return ReactDOM.createPortal(popup, document.body);
}

// ─── DesktopTimeColumn ────────────────────────────────────────────
function DesktopTimeColumn() {
  return (
      <div style={{ position: 'relative', height: HOURS.length * DESKTOP_SLOT_HEIGHT, borderRight: '1px solid var(--sched-border)', backgroundColor: 'var(--sched-timecol-bg)' }}>
        {HOURS.map((h, i) => (
            <div key={h}>
              {i > 0 && <div style={{ position: 'absolute', top: i * DESKTOP_SLOT_HEIGHT, left: 0, right: 0, borderTop: '1px solid var(--sched-line)' }} />}
              <div style={{ position: 'absolute', top: i * DESKTOP_SLOT_HEIGHT + 3, left: 0, right: 0, textAlign: 'center', fontSize: '0.68rem', color: 'var(--sched-time-label)' }}>
                {h}:00
              </div>
            </div>
        ))}
      </div>
  );
}

// ─── DesktopDayColumn ─────────────────────────────────────────────
function DesktopDayColumn({ day, filter, isToday, isMobile }) {
  const [popup, setPopup] = useState(null);
  const isVisible = (e) => filter === 'Wszystkie' || e.category === filter;
  const events = (SCHEDULE[day] || []).filter(isVisible);

  return (
      <>
        {popup && <EventPopup event={popup} onClose={() => setPopup(null)} isMobile={isMobile} />}
        <div style={{ position: 'relative', height: HOURS.length * DESKTOP_SLOT_HEIGHT, borderLeft: '1px solid var(--sched-border)', backgroundColor: isToday ? 'var(--sched-today-col-bg)' : 'transparent' }}>
          {HOURS.map((_, i) => i > 0 && (
              <div key={i} style={{ position: 'absolute', top: i * DESKTOP_SLOT_HEIGHT, left: 0, right: 0, borderTop: '1px solid var(--sched-line)', pointerEvents: 'none' }} />
          ))}
          {events.map((ev, idx) => {
            const cat    = CATEGORIES[ev.category];
            const top    = (ev.start - 8) * DESKTOP_SLOT_HEIGHT;
            const height = (ev.end - ev.start) * DESKTOP_SLOT_HEIGHT - 4;
            return (
                <div
                    key={idx}
                    onClick={() => setPopup(ev)}
                    style={{ position: 'absolute', top, height, left: 3, right: 3, backgroundColor: `var(${cat.bgVar})`, borderLeft: `3px solid var(${cat.colorVar})`, borderRadius: 'var(--sched-radius-md)', padding: '3px 6px', overflow: 'hidden', boxShadow: 'var(--sched-shadow)', cursor: 'pointer', zIndex: 1, transition: 'box-shadow 0.15s, transform 0.15s' }}
                    onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 4px 14px rgba(0,0,0,0.18)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                    onMouseLeave={e => { e.currentTarget.style.boxShadow = 'var(--sched-shadow)'; e.currentTarget.style.transform = 'none'; }}
                >
                  <div style={{ fontSize: '0.72rem', fontWeight: 700, color: `var(${cat.colorVar})`, lineHeight: 1.2 }}>
                    {fmt(ev.start)}–{fmt(ev.end)}
                  </div>
                  <div style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--sched-event-text)', lineHeight: 1.3, overflow: 'hidden' }}>
                    {ev.name}
                  </div>
                  {height >= 48 && <div style={{ fontSize: '0.68rem', color: 'var(--sched-subtext)', marginTop: 1 }}>🏔️ {ev.level}</div>}
                  {height >= 64 && <SpotsBadge spots={ev.spots} small />}
                </div>
            );
          })}
        </div>
      </>
  );
}

// ─── MobileTimeColumn ─────────────────────────────────────────────
function MobileTimeColumn({ slotH }) {
  return (
      <div style={{ position: 'relative', height: HOURS.length * slotH, borderRight: '1px solid var(--sched-border)', backgroundColor: 'var(--sched-timecol-bg)' }}>
        {HOURS.map((h, i) => (
            <div key={h}>
              {i > 0 && <div style={{ position: 'absolute', top: i * slotH, left: 0, right: 0, borderTop: '1px solid var(--sched-line)' }} />}
              <div style={{ position: 'absolute', top: i * slotH + 2, left: 0, right: 0, textAlign: 'center', fontSize: '0.6rem', color: 'var(--sched-time-label)' }}>
                {h}:00
              </div>
            </div>
        ))}
      </div>
  );
}

// ─── MobileDayColumn ──────────────────────────────────────────────
function MobileDayColumn({ day, filter, slotH }) {
  const [popup, setPopup] = useState(null);
  const isVisible = (e) => filter === 'Wszystkie' || e.category === filter;
  const events = (SCHEDULE[day] || []).filter(isVisible);

  return (
      <>
        {popup && <EventPopup event={popup} onClose={() => setPopup(null)} isMobile={true} />}
        <div style={{ position: 'relative', height: HOURS.length * slotH, borderLeft: '1px solid var(--sched-border)' }}>
          {HOURS.map((_, i) => i > 0 && (
              <div key={i} style={{ position: 'absolute', top: i * slotH, left: 0, right: 0, borderTop: '1px solid var(--sched-line)', pointerEvents: 'none' }} />
          ))}
          {events.map((ev, idx) => {
            const cat    = CATEGORIES[ev.category];
            const top    = (ev.start - 8) * slotH;
            const height = (ev.end - ev.start) * slotH - 3;
            return (
                <div
                    key={idx}
                    className="sched-event-pop"
                    onClick={() => setPopup(ev)}
                    style={{ position: 'absolute', top, height, left: 3, right: 3, backgroundColor: `var(${cat.bgVar})`, borderLeft: `3px solid var(${cat.colorVar})`, borderRadius: 'var(--sched-radius-sm)', padding: '2px 5px', overflow: 'hidden', boxShadow: 'var(--sched-shadow)', cursor: 'pointer', zIndex: 1, animationDelay: `${idx * 25}ms` }}
                >
                  <div style={{ fontSize: '0.67rem', fontWeight: 700, color: `var(${cat.colorVar})`, lineHeight: 1.2 }}>
                    {fmt(ev.start)}–{fmt(ev.end)}
                  </div>
                  {height >= 28 && (
                      <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--sched-event-text)', lineHeight: 1.2, overflow: 'hidden' }}>
                        {ev.name}
                      </div>
                  )}
                  {height >= 52 && <div style={{ fontSize: '0.63rem', color: 'var(--sched-subtext)', marginTop: 1 }}>🏔️ {ev.level}</div>}
                  {height >= 64 && <SpotsBadge spots={ev.spots} small />}
                </div>
            );
          })}
        </div>
      </>
  );
}

// ─── MobileView ───────────────────────────────────────────────────
function MobileView({ filter }) {
  const todayIdx = getTodayIndex();
  const [dayIndex, setDayIndex] = useState(todayIdx);
  const [offset, transitioning, slide] = useSlide();
  const navRef  = useRef(null);
  const dotsRef = useRef(null);
  const touchStartX = useRef(null);
  const touchStartY = useRef(null);

  // ← naprawiony hook: visualViewport zamiast window.innerHeight
  const slotH = useMobileSlotHeight(navRef, dotsRef);

  const goTo = (newIndex, direction) => { slide(direction); setDayIndex(newIndex); };

  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };
  const handleTouchEnd = (e) => {
    if (touchStartX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    const dy = Math.abs(e.changedTouches[0].clientY - touchStartY.current);
    if (Math.abs(dx) > 50 && dy < 60) {
      if (dx < 0 && dayIndex < DAYS.length - 1) goTo(dayIndex + 1, 'left');
      else if (dx > 0 && dayIndex > 0)          goTo(dayIndex - 1, 'right');
    }
    touchStartX.current = null;
  };

  const day        = DAYS[dayIndex];
  const isToday    = dayIndex === todayIdx;
  const slideStyle = {
    transform: `translateX(${offset}%)`,
    transition: transitioning ? 'transform 0.35s cubic-bezier(0.4,0,0.2,1), opacity 0.35s ease' : 'none',
    opacity: transitioning ? 1 : (offset === 0 ? 1 : 0),
  };

  return (
      <div>
        {/* Nawigacja dni */}
        <div ref={navRef} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
          <button
              onClick={() => dayIndex > 0 && goTo(dayIndex - 1, 'right')}
              disabled={dayIndex === 0}
              style={{ padding: '5px 13px', borderRadius: 8, border: '1px solid var(--sched-btn-border)', backgroundColor: 'transparent', color: dayIndex === 0 ? 'var(--sched-btn-border)' : 'var(--sched-text)', cursor: dayIndex === 0 ? 'default' : 'pointer', fontSize: '1.1rem' }}
          >‹</button>

          <div style={{ textAlign: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center' }}>
              <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--sched-text)' }}>{day}</span>
              {isToday && (
                  <span style={{ fontSize: '0.62rem', fontWeight: 700, color: '#fff', backgroundColor: 'var(--sched-accent)', borderRadius: 10, padding: '1px 7px' }}>DZIŚ</span>
              )}
            </div>
            <div style={{ fontSize: '0.65rem', color: 'var(--sched-subtext)' }}>{dayIndex + 1} / {DAYS.length} · przesuń aby zmienić</div>
          </div>

          <button
              onClick={() => dayIndex < DAYS.length - 1 && goTo(dayIndex + 1, 'left')}
              disabled={dayIndex === DAYS.length - 1}
              style={{ padding: '5px 13px', borderRadius: 8, border: '1px solid var(--sched-btn-border)', backgroundColor: 'transparent', color: dayIndex === DAYS.length - 1 ? 'var(--sched-btn-border)' : 'var(--sched-text)', cursor: dayIndex === DAYS.length - 1 ? 'default' : 'pointer', fontSize: '1.1rem' }}
          >›</button>
        </div>

        {/* Dots */}
        <div ref={dotsRef} style={{ display: 'flex', justifyContent: 'center', gap: 5, marginBottom: 6 }}>
          {DAYS.map((_, i) => (
              <div
                  key={i}
                  onClick={() => i !== dayIndex && goTo(i, i > dayIndex ? 'left' : 'right')}
                  style={{ width: i === dayIndex ? 18 : 7, height: 7, borderRadius: 4, backgroundColor: i === dayIndex ? (i === todayIdx ? 'var(--sched-accent)' : 'var(--sched-header-bg)') : (i === todayIdx ? 'var(--sched-accent-weak)' : 'var(--sched-btn-border)'), cursor: 'pointer', transition: 'all 0.3s cubic-bezier(0.4,0,0.2,1)' }}
              />
          ))}
        </div>

        {/* Siatka */}
        <div
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            style={{ overflow: 'hidden', touchAction: 'pan-y', borderRadius: 10, border: '1px solid var(--sched-border)' }}
        >
          <div style={slideStyle}>
            <div style={{ display: 'grid', gridTemplateColumns: '44px 1fr' }}>
              <div style={{ backgroundColor: 'var(--sched-header-bg)', color: '#fff', padding: '6px 2px', textAlign: 'center', fontSize: '0.65rem', fontWeight: 600 }}>Godz.</div>
              <div style={{ backgroundColor: isToday ? 'var(--sched-today-header-bg)' : 'var(--sched-header-bg)', color: '#fff', padding: '6px 4px', textAlign: 'center', fontSize: '0.78rem', fontWeight: 700, borderLeft: '1px solid var(--sched-header-border)' }}>
                {day}{isToday && ' ✦'}
              </div>
              <MobileTimeColumn slotH={slotH} />
              <MobileDayColumn key={`${day}-${filter}`} day={day} filter={filter} slotH={slotH} />
            </div>
          </div>
        </div>
      </div>
  );
}

// ─── DesktopView ──────────────────────────────────────────────────
function DesktopView({ filter, selectedDay, setSelectedDay, isMobile }) {
  const todayIdx    = getTodayIndex();
  const displayDays = selectedDay !== null ? [DAYS[selectedDay]] : DAYS;

  return (
      <div>
        {/* Przyciski dni */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 12 }}>
          <button
              onClick={() => setSelectedDay(null)}
              style={{ padding: '5px 12px', borderRadius: 8, border: '1px solid var(--sched-btn-border)', backgroundColor: selectedDay === null ? 'var(--sched-header-bg)' : 'transparent', color: selectedDay === null ? '#fff' : 'var(--sched-subtext)', fontSize: '0.78rem', fontWeight: selectedDay === null ? 700 : 400, cursor: 'pointer', transition: 'all 0.2s' }}
          >Cały tydzień</button>
          {DAYS.map((d, i) => (
              <button
                  key={d}
                  onClick={() => setSelectedDay(selectedDay === i ? null : i)}
                  style={{ padding: '5px 12px', borderRadius: 8, border: `1px solid ${i === todayIdx && selectedDay !== i ? 'var(--sched-accent-weak)' : 'var(--sched-btn-border)'}`, backgroundColor: selectedDay === i ? 'var(--sched-header-bg)' : 'transparent', color: selectedDay === i ? '#fff' : 'var(--sched-subtext)', fontSize: '0.78rem', fontWeight: selectedDay === i ? 700 : 400, cursor: 'pointer', transition: 'all 0.2s', position: 'relative' }}
              >
                {DAYS_SHORT[i]}
                {i === todayIdx && (
                    <span style={{ position: 'absolute', top: -5, right: -4, width: 7, height: 7, borderRadius: '50%', backgroundColor: 'var(--sched-accent)', border: '1.5px solid var(--sched-popup-bg)' }} />
                )}
              </button>
          ))}
        </div>

        {/* Siatka */}
        <div style={{ display: 'grid', gridTemplateColumns: `52px repeat(${displayDays.length}, 1fr)`, border: '1px solid var(--sched-border)', borderRadius: 12, overflow: 'hidden' }}>
          <div style={{ backgroundColor: 'var(--sched-header-bg)', color: '#fff', padding: '8px 4px', textAlign: 'center', fontSize: '0.72rem', fontWeight: 600 }}>Godz.</div>
          {displayDays.map((day) => {
            const idx     = DAYS.indexOf(day);
            const isToday = idx === todayIdx;
            return (
                <div key={day} style={{ backgroundColor: isToday ? 'var(--sched-today-header-bg)' : 'var(--sched-header-bg)', color: '#fff', padding: '8px 4px', textAlign: 'center', fontSize: '0.78rem', fontWeight: 600, borderLeft: '1px solid var(--sched-header-border)' }}>
                  {day}{isToday && ' ✦'}
                </div>
            );
          })}
          <DesktopTimeColumn />
          {displayDays.map((day) => (
              <DesktopDayColumn key={`${day}-${filter}`} day={day} filter={filter} isToday={DAYS.indexOf(day) === todayIdx} isMobile={isMobile} />
          ))}
        </div>
      </div>
  );
}

// ─── FilterBar ────────────────────────────────────────────────────
function FilterBar({ filter, setFilter, isMobile }) {
  return (
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: isMobile ? 6 : 8, marginBottom: 10, padding: isMobile ? '8px 12px' : '10px 14px', backgroundColor: 'var(--sched-legend-bg)', borderRadius: 8, border: '1px solid var(--sched-border)' }}>
        <span style={{ fontSize: '0.78rem', color: 'var(--sched-subtext)', fontWeight: 600, marginRight: 2 }}>Kategorie:</span>
        {['Wszystkie', ...Object.keys(CATEGORIES)].map((key) => {
          const cat    = CATEGORIES[key];
          const active = filter === key;
          return (
              <button
                  key={key}
                  onClick={() => setFilter(key)}
                  style={{ padding: isMobile ? '4px 11px' : '5px 14px', borderRadius: 20, border: 'none', outline: 'none', cursor: 'pointer', transition: 'all 0.18s', whiteSpace: 'nowrap', fontSize: isMobile ? '0.75rem' : '0.82rem', fontWeight: active ? 700 : 400, backgroundColor: active ? (cat ? `var(${cat.colorVar})` : 'var(--sched-header-bg)') : 'var(--sched-btn-border)', color: active ? '#ffffff' : 'var(--sched-subtext)', boxShadow: active ? '0 2px 8px rgba(0,0,0,0.15)' : 'none' }}
              >
                {cat ? `${cat.emoji} ` : ''}{key}
              </button>
          );
        })}
      </div>
  );
}

// ─── Legend ───────────────────────────────────────────────────────
function Legend({ isMobile }) {
  return (
      <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', flexWrap: isMobile ? 'nowrap' : 'wrap', gap: isMobile ? 8 : 20, marginTop: 10, padding: isMobile ? '8px 12px' : '10px 14px', backgroundColor: 'var(--sched-legend-bg)', borderRadius: 8, border: '1px solid var(--sched-border)' }}>
        <span style={{ fontSize: '0.78rem', color: 'var(--sched-subtext)', fontWeight: 600 }}>Kategorie:</span>
        {Object.entries(CATEGORIES).map(([key, cat]) => (
            <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: '0.8rem', color: `var(${cat.colorVar})`, fontWeight: 500 }}>
              <div style={{ width: 9, height: 9, borderRadius: '50%', backgroundColor: `var(${cat.colorVar})`, flexShrink: 0 }} />
              {cat.emoji} {key}
            </div>
        ))}
      </div>
  );
}

// ─── Schedule (główny eksport) ────────────────────────────────────
export default function Schedule() {
  const [filter, setFilter]       = useState('Wszystkie');
  const [selectedDay, setSelectedDay] = useState(null);
  const isMobile = useIsMobile();

  return (
      <div className="sched-fullwidth" style={{ fontFamily: 'inherit' }}>
        <FilterBar filter={filter} setFilter={setFilter} isMobile={isMobile} />
        {isMobile
            ? <MobileView  filter={filter} />
            : <DesktopView filter={filter} selectedDay={selectedDay} setSelectedDay={setSelectedDay} isMobile={isMobile} />
        }
        <Legend isMobile={isMobile} />
      </div>
  );
}