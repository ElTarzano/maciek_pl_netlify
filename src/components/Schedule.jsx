import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';

// ─── Constants ────────────────────────────────────────────────────

const CATEGORIES = {
  Dzieci:       { colorVar: '--sched-dzieci',       bgVar: '--sched-dzieci-bg',       emoji: '🧒' },
  Juniorzy:     { colorVar: '--sched-juniorzy',     bgVar: '--sched-juniorzy-bg',     emoji: '🧑' },
  Dorośli:      { colorVar: '--sched-dorosli',      bgVar: '--sched-dorosli-bg',      emoji: '🧗' },
  Indywidualne: { colorVar: '--sched-indywidualne', bgVar: '--sched-indywidualne-bg', emoji: '⭐' },
};

const DAYS = ['Poniedziałek', 'Wtorek', 'Środa', 'Czwartek', 'Piątek', 'Sobota', 'Niedziela'];
const DAYS_SHORT = ['Pon', 'Wt', 'Śr', 'Czw', 'Pt', 'Sob', 'Nd'];
const HOURS = Array.from({ length: 15 }, (_, i) => i + 8); // 8–22
const DESKTOP_SLOT_HEIGHT = 60;

// JS getDay(): 0=Sun 1=Mon … 6=Sat  →  DAYS index = (jsDay + 6) % 7
function getTodayIndex() {
  return (new Date().getDay() + 6) % 7;
}

// ─── Schedule data  (spots = remaining seats) ─────────────────────
const SCHEDULE = {
  Poniedziałek: [
    { start: 9,    end: 10.5, category: 'Dzieci',       name: 'Wspinaczka dla dzieci',  level: 'Początkujący',       spots: 5,  desc: 'Zajęcia wprowadzające dla dzieci w wieku 6–10 lat. Nauka podstawowych technik wspinania, bezpiecznego upadania i pracy w zespole. Wymagany strój sportowy.' },
    { start: 11,   end: 12.5, category: 'Juniorzy',     name: 'Trening juniorów',       level: 'Średniozaawansowany', spots: 2,  desc: 'Intensywny trening dla juniorów (11–17 lat) z naciskiem na siłę palców, technikę nóg i czytanie dróg. Wymagane wcześniejsze doświadczenie.' },
    { start: 16,   end: 17.5, category: 'Dzieci',       name: 'Zajęcia podstawowe',     level: 'Początkujący',       spots: 7,  desc: 'Grupowe zajęcia dla dzieci stawiających pierwsze kroki na ścianie. Elementy zabawy, gry i ćwiczenia koordynacyjne w bezpiecznym środowisku.' },
    { start: 18,   end: 19.5, category: 'Dorośli',      name: 'Technika prowadzenia',   level: 'Zaawansowany',       spots: 0,  desc: 'Warsztaty dla dorosłych skupione na technice prowadzenia — wkładanie ekspresów, asekuracja lidera, psychologia trudnych sektorów.' },
    { start: 20,   end: 21,   category: 'Indywidualne', name: 'Trening indywidualny',   level: 'Średniozaawansowany', spots: 1,  desc: 'Zajęcia 1:1 dostosowane do Twoich celów i poziomu. Analiza techniki, plan treningowy i praca nad słabymi stronami. Rezerwacja wymagana.' },
  ],
  Wtorek: [
    { start: 10,   end: 11.5, category: 'Indywidualne', name: 'Trening indywidualny',   level: 'Zaawansowany',       spots: 3,  desc: 'Prywatna sesja z trenerem. Idealny dla osób chcących szybko przejść na wyższy poziom lub pracować nad konkretnym problemem technicznym.' },
    { start: 15,   end: 16.5, category: 'Juniorzy',     name: 'Bouldering juniorów',    level: 'Średniozaawansowany', spots: 6,  desc: 'Trening boulderingowy dla młodzieży — rozwiązywanie problemów, kreatywność ruchowa i przygotowanie do zawodów boulderingowych.' },
    { start: 17,   end: 18.5, category: 'Dorośli',      name: 'Wspinaczka skałkowa',    level: 'Początkujący',       spots: 4,  desc: 'Przygotowanie do wspinaczki na naturalnym terenie: praca z liną, czytanie skały, techniki asekuracji i planowanie wyjazdu na skały.' },
    { start: 19,   end: 20.5, category: 'Dorośli',      name: 'Siła i kondycja',        level: 'Zaawansowany',       spots: 0,  desc: 'Trening ogólnorozwojowy dla wspinaczy — siła palców, antagoniści, core i wytrzymałość. Uzupełnienie typowych zajęć na ścianie.' },
  ],
  Środa: [
    { start: 9,    end: 10.5, category: 'Dzieci',       name: 'Zabawa na ścianie',      level: 'Początkujący',       spots: 8,  desc: 'Luźne zajęcia tematyczne dla dzieci — każde spotkanie to inna przygoda! Bajkowe trasy, konkursy i wspólna zabawa na ścianie.' },
    { start: 11,   end: 12,   category: 'Indywidualne', name: 'Trening indywidualny',   level: 'Średniozaawansowany', spots: 2,  desc: 'Godzinna sesja indywidualna skoncentrowana na jednym wybranym aspekcie technicznym. Szybkie i efektywne poprawki.' },
    { start: 16,   end: 17.5, category: 'Dzieci',       name: 'Wspinaczka dla dzieci',  level: 'Początkujący',       spots: 3,  desc: 'Regularne zajęcia grupy dziecięcej z podziałem na poziomy. Praca nad techniką nóg, siłą chwytu i odwagą na ścianie.' },
    { start: 18,   end: 19.5, category: 'Juniorzy',     name: 'Zaawansowany trening',   level: 'Zaawansowany',       spots: 1,  desc: 'Trening dla juniorów z ambicjami startowymi. Wyczynowe podejście do treningu, przygotowanie mentalne i analiza błędów.' },
    { start: 20,   end: 21.5, category: 'Dorośli',      name: 'Bouldering',             level: 'Średniozaawansowany', spots: 5,  desc: 'Otwarty trening boulderingowy dla dorosłych. Praca nad dynamiką, równowagą i kreatywnością ruchową na problemach różnych poziomów.' },
  ],
  Czwartek: [
    { start: 10,   end: 11.5, category: 'Dorośli',      name: 'Technika wspinania',     level: 'Zaawansowany',       spots: 0,  desc: 'Zajęcia skupione wyłącznie na technice — praca nad pozycją ciała, precyzją stóp i efektywnym użyciem nóg zamiast siły ramion.' },
    { start: 15,   end: 16.5, category: 'Juniorzy',     name: 'Trening juniorów',       level: 'Początkujący',       spots: 6,  desc: 'Czwartkowa sesja juniorów łącząca pracę na ścianie prowadzonej i boulderingu. Indywidualne podejście do każdego zawodnika.' },
    { start: 17,   end: 18,   category: 'Indywidualne', name: 'Trening indywidualny',   level: 'Zaawansowany',       spots: 1,  desc: 'Sesja 1:1 z video-analizą wspinania. Nagranie, omówienie i plan korekcji na kolejne tygodnie.' },
    { start: 18.5, end: 20,   category: 'Dorośli',      name: 'Droga klasyczna',        level: 'Średniozaawansowany', spots: 4,  desc: 'Warsztaty skupione na wspinaniu klasycznym — zakładanie przelotów, asekuracja wierzchołkowa i techniki zjazdu na linie.' },
  ],
  Piątek: [
    { start: 9,    end: 10.5, category: 'Dzieci',       name: 'Wspinaczka dla dzieci',  level: 'Początkujący',       spots: 7,  desc: 'Piątkowe zajęcia dla dzieci — podsumowanie tygodnia na ścianie. Testy postępów i małe wyzwania dla każdego uczestnika.' },
    { start: 16,   end: 17.5, category: 'Dzieci',       name: 'Zajęcia weekendowe',     level: 'Początkujący',       spots: 5,  desc: 'Grupowe zajęcia na początku weekendu — idealne dla dzieci szkolnych. Aktywna forma spędzenia wolnego czasu po tygodniu nauki.' },
    { start: 17,   end: 18.5, category: 'Juniorzy',     name: 'Bouldering juniorów',    level: 'Średniozaawansowany', spots: 2,  desc: 'Wolna sesja boulderingowa z opcjonalną asystą trenera. Juniorzy samodzielnie eksplorują ścianę i pracują nad wyznaczonymi celami.' },
    { start: 19,   end: 20.5, category: 'Dorośli',      name: 'Wieczór wspinaczkowy',   level: 'Zaawansowany',       spots: 3,  desc: 'Relaksacyjny wieczór na ścianie dla dorosłych. Mix wspinania towarzyskiego i technicznego w luźnej atmosferze końca tygodnia.' },
    { start: 20.5, end: 22,   category: 'Indywidualne', name: 'Trening indywidualny',   level: 'Średniozaawansowany', spots: 0,  desc: 'Wieczorna sesja indywidualna dla osób z napiętym harmonogramem. Elastyczny program dopasowany do potrzeb klienta.' },
  ],
  Sobota: [
    { start: 9,    end: 11,   category: 'Dzieci',       name: 'Wspinaczka weekendowa',  level: 'Początkujący',       spots: 6,  desc: 'Dwugodzinne sobotnie zajęcia dla dzieci — dłuższy format pozwala na więcej zabaw tematycznych i gruntowną pracę techniczną.' },
    { start: 10,   end: 12,   category: 'Juniorzy',     name: 'Zawody treningowe',      level: 'Zaawansowany',       spots: 0,  desc: 'Wewnętrzne zawody treningowe dla juniorów. Symulacja prawdziwych zawodów — czas, flash, on-sight. Doskonale przygotowuje do startów.' },
    { start: 13,   end: 15,   category: 'Dorośli',      name: 'Technika i siła',        level: 'Średniozaawansowany', spots: 4,  desc: 'Kompleksowy trening łączący pracę techniczną na ścianie z ćwiczeniami siłowymi. Idealne połączenie dla wszechstronnego rozwoju.' },
    { start: 15,   end: 16,   category: 'Indywidualne', name: 'Trening indywidualny',   level: 'Początkujący',       spots: 1,  desc: 'Weekendowa sesja indywidualna — czas na szczegółową pracę nad techniką bez pośpiechu, z pełnym skupieniem trenera.' },
    { start: 16,   end: 18,   category: 'Dorośli',      name: 'Bouldering otwarty',     level: 'Zaawansowany',       spots: 8,  desc: 'Otwarty popołudniowy bouldering dla dorosłych w każdym poziomie. Trener dostępny do konsultacji, luźna atmosfera weekendowa.' },
  ],
  Niedziela: [
    { start: 10,   end: 12,   category: 'Dzieci',       name: 'Rodzinne wspinanie',     level: 'Początkujący',       spots: 5,  desc: 'Wyjątkowe zajęcia dla całych rodzin — rodzice i dzieci wspinają się razem! Trener prowadzi obie grupy równolegle. Brak wymagań wstępnych.' },
    { start: 12,   end: 14,   category: 'Juniorzy',     name: 'Trening niedzielny',     level: 'Średniozaawansowany', spots: 3,  desc: 'Niedzielna sesja dla juniorów z naciskiem na regenerację i technikę. Mniej intensywna, bardziej eksploracyjna forma treningu.' },
    { start: 14,   end: 16,   category: 'Dorośli',      name: 'Wspinaczka rekreacyjna', level: 'Zaawansowany',       spots: 7,  desc: 'Rekreacyjna wspinaczka dla dorosłych — bez presji, bez intensywności. Idealne zakończenie weekendu dla miłośników aktywnego relaksu.' },
    { start: 16,   end: 17,   category: 'Indywidualne', name: 'Trening indywidualny',   level: 'Początkujący',       spots: 0,  desc: 'Ostatnia niedzielna sesja tygodnia. Idealna na podsumowanie postępów i zaplanowanie celów na nadchodzący tydzień treningowy.' },
  ],
};

// ─── CSS ──────────────────────────────────────────────────────────
const CSS_VARS = `
  :root {
    --sched-dzieci: #c53030;
    --sched-dzieci-bg: #fff5f5;
    --sched-juniorzy: #2b6cb0;
    --sched-juniorzy-bg: #ebf8ff;
    --sched-dorosli: #276749;
    --sched-dorosli-bg: #f0fff4;
    --sched-indywidualne: #b7791f;
    --sched-indywidualne-bg: #fffff0;
    --sched-header-bg: #4a4a4a;
    --sched-header-border: #666666;
    --sched-today-header-bg: #2b6cb0;
    --sched-today-col-bg: #f0f7ff;
    --sched-border: #e2e8f0;
    --sched-line: #edf2f7;
    --sched-timecol-bg: #f5f5f5;
    --sched-time-label: #a0aec0;
    --sched-legend-bg: #f5f5f5;
    --sched-text: #3a3a3a;
    --sched-subtext: #718096;
    --sched-btn-border: #e2e8f0;
    --sched-event-text: #3a3a3a;
    --sched-popup-bg: #ffffff;
    --sched-popup-border: #e2e8f0;
  }
  [data-theme='dark'] {
    --sched-dzieci: #fc8181;
    --sched-dzieci-bg: #2d1515;
    --sched-juniorzy: #63b3ed;
    --sched-juniorzy-bg: #1a2a3d;
    --sched-dorosli: #68d391;
    --sched-dorosli-bg: #1a2d1f;
    --sched-indywidualne: #f6e05e;
    --sched-indywidualne-bg: #2d2710;
    --sched-header-bg: #2a2a2a;
    --sched-header-border: #444444;
    --sched-today-header-bg: #2a4a7a;
    --sched-today-col-bg: #141e2d;
    --sched-border: #3a3a3a;
    --sched-line: #333333;
    --sched-timecol-bg: #1a1a1a;
    --sched-time-label: #666666;
    --sched-legend-bg: #1a1a1a;
    --sched-text: #e2e8f0;
    --sched-subtext: #909090;
    --sched-btn-border: #3a3a3a;
    --sched-event-text: #e2e8f0;
    --sched-popup-bg: #242424;
    --sched-popup-border: #3a3a3a;
  }

  .sched-fullwidth {
    width: 100vw;
    position: relative;
    left: 50%;
    right: 50%;
    margin-left: -50vw;
    margin-right: -50vw;
    padding-left: max(24px, calc((100vw - 1400px) / 2));
    padding-right: max(24px, calc((100vw - 1400px) / 2));
    box-sizing: border-box;
  }

  @keyframes sched-event-pop {
    from { opacity: 0; transform: scaleY(0.85); }
    to   { opacity: 1; transform: scaleY(1); }
  }
  .sched-event-pop { animation: sched-event-pop 0.18s ease both; transform-origin: top center; }

  @keyframes sched-popup-in {
    from { opacity: 0; transform: translate(-50%, -48%) scale(0.93); }
    to   { opacity: 1; transform: translate(-50%, -50%) scale(1); }
  }
  .sched-popup {
    animation: sched-popup-in 0.22s cubic-bezier(0.34, 1.3, 0.64, 1) both;
  }
`;

// ─── Helpers ──────────────────────────────────────────────────────
function fmt(h) {
  const hh = Math.floor(h);
  const mm = Math.round((h % 1) * 60);
  return `${String(hh).padStart(2,'0')}:${String(mm).padStart(2,'0')}`;
}

/** Returns { color, bg, label } for the spots counter */
function spotsInfo(spots) {
  if (spots === 0) return { color: '#c53030', bg: '#fff5f5', dot: '#c53030', label: 'Brak miejsc' };
  if (spots <= 2)  return { color: '#c05621', bg: '#fffaf0', dot: '#dd6b20', label: `${spots} ${spots === 1 ? 'wolne miejsce' : 'wolne miejsca'}` };
  if (spots <= 4)  return { color: '#b7791f', bg: '#fffff0', dot: '#d69e2e', label: `${spots} wolnych miejsc` };
  return              { color: '#276749', bg: '#f0fff4', dot: '#38a169', label: `${spots} wolnych miejsc` };
}

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);
  return isMobile;
}

function useSlide() {
  const [offset, setOffset] = useState(0);
  const [transitioning, setTransitioning] = useState(false);
  const slide = (direction) => {
    const startX = direction === 'left' ? 100 : -100;
    setTransitioning(false);
    setOffset(startX);
    requestAnimationFrame(() => requestAnimationFrame(() => {
      setTransitioning(true);
      setOffset(0);
    }));
  };
  return [offset, transitioning, slide];
}

const CATEGORY_LIGHT = {
  Dzieci:       { bg: '#fff5f5', color: '#c53030' },
  Juniorzy:     { bg: '#ebf8ff', color: '#2b6cb0' },
  Dorośli:      { bg: '#f0fff4', color: '#276749' },
  Indywidualne: { bg: '#fffff0', color: '#b7791f' },
};

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

  // Larger sizes, especially on mobile
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
        <div onClick={onClose} style={{
          position: 'fixed', inset: 0, zIndex: 9998,
          backgroundColor: 'rgba(0,0,0,0.45)',
          backdropFilter: 'blur(3px)', WebkitBackdropFilter: 'blur(3px)',
        }} />

        {/* Dialog */}
        <div className="sched-popup" role="dialog" aria-modal="true" style={{
          position: 'fixed', top: '50%', left: '50%',
          zIndex: 9999, width: popupWidth,
          backgroundColor: 'var(--sched-popup-bg)',
          borderRadius: 20,
          boxShadow: '0 28px 72px rgba(0,0,0,0.3), 0 4px 16px rgba(0,0,0,0.1)',
          overflow: 'hidden',
        }}>

          {/* Hero */}
          <div style={{
            width: '100%', height: imageHeight,
            backgroundColor: lightCat.bg,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            position: 'relative', overflow: 'hidden',
            borderBottom: `3px solid ${lightCat.color}`,
          }}>
            <div style={{ fontSize: isMobile ? '5rem' : '6.5rem', opacity: 0.2, userSelect: 'none' }}>🧗</div>
            <div style={{ position: 'absolute', bottom: 8, right: 12, fontSize: '0.65rem', color: lightCat.color, opacity: 0.5, fontStyle: 'italic' }}>
              zdjęcie zajęć
            </div>
            <button onClick={onClose} aria-label="Zamknij" style={{
              position: 'absolute', top: 10, right: 10,
              background: 'rgba(255,255,255,0.82)', border: 'none', borderRadius: 20,
              color: '#333', fontSize: '0.85rem', cursor: 'pointer',
              padding: '4px 10px', lineHeight: 1.4, fontWeight: 700,
              backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)',
            }}>✕</button>
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

            {/* Meta row: time + level */}
            <div style={{ display: 'flex', gap: isMobile ? 14 : 24, marginBottom: 10, flexWrap: 'wrap' }}>
              <div style={{ fontSize: metaSize, color: 'var(--sched-subtext)' }}>
                🕐 <strong style={{ color: 'var(--sched-text)' }}>{fmt(event.start)} – {fmt(event.end)}</strong>
              </div>
              <div style={{ fontSize: metaSize, color: 'var(--sched-subtext)' }}>
                🏔️ <strong style={{ color: 'var(--sched-text)' }}>{event.level}</strong>
              </div>
            </div>

            {/* Spots indicator */}
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 7,
              padding: '5px 12px', borderRadius: 20, marginBottom: 14,
              backgroundColor: si.bg,
              border: `1px solid ${si.dot}22`,
            }}>
              <div style={{
                width: 9, height: 9, borderRadius: '50%',
                backgroundColor: si.dot, flexShrink: 0,
                boxShadow: `0 0 0 3px ${si.dot}33`,
              }} />
              <span style={{ fontSize: isMobile ? '0.8rem' : '0.85rem', fontWeight: 600, color: si.color }}>
              {si.label}
            </span>
            </div>

            {/* Description */}
            <p style={{
              margin: 0, fontSize: descSize, lineHeight: 1.65, color: 'var(--sched-text)',
              borderTop: '1px solid var(--sched-popup-border)',
              paddingTop: isMobile ? 12 : 14, marginBottom: event.spots > 0 ? 16 : 0,
            }}>
              {event.desc}
            </p>

            {/* CTA button — only when spots available */}
            {event.spots > 0 && (
                <a
                    href="/kontakt"
                    style={{
                      display: 'block', width: '100%', boxSizing: 'border-box',
                      padding: isMobile ? '12px 16px' : '13px 18px',
                      borderRadius: 12, textAlign: 'center',
                      backgroundColor: lightCat.color,
                      color: '#fff', fontWeight: 700,
                      fontSize: isMobile ? '0.95rem' : '1rem',
                      textDecoration: 'none',
                      transition: 'filter 0.15s, transform 0.15s',
                    }}
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

// ─── Spots badge for calendar cards ──────────────────────────────
function SpotsBadge({ spots, small }) {
  const si = spotsInfo(spots);
  return (
      <div style={{
        display: 'flex', alignItems: 'center', gap: 4,
        fontSize: small ? '0.58rem' : '0.62rem',
        fontWeight: 600, color: si.color,
        marginTop: 2,
      }}>
        <div style={{ width: small ? 6 : 7, height: small ? 6 : 7, borderRadius: '50%', backgroundColor: si.dot, flexShrink: 0 }} />
        {spots === 0 ? 'Brak miejsc' : `${spots} miejsc`}
      </div>
  );
}

// ─── Desktop column ───────────────────────────────────────────────
function DesktopDayColumn({ day, filter, isToday, isMobile }) {
  const [popup, setPopup] = useState(null);
  const isVisible = (e) => filter === 'Wszystkie' || e.category === filter;
  const events = (SCHEDULE[day] || []).filter(isVisible);

  return (
      <>
        {popup && <EventPopup event={popup} onClose={() => setPopup(null)} isMobile={isMobile} />}
        <div style={{
          position: 'relative',
          height: HOURS.length * DESKTOP_SLOT_HEIGHT,
          borderLeft: '1px solid var(--sched-border)',
          backgroundColor: isToday ? 'var(--sched-today-col-bg)' : 'transparent',
        }}>
          {HOURS.map((_, i) => i > 0 && (
              <div key={i} style={{ position: 'absolute', top: i * DESKTOP_SLOT_HEIGHT, left: 0, right: 0, borderTop: '1px solid var(--sched-line)', pointerEvents: 'none' }} />
          ))}
          {events.map((ev, idx) => {
            const cat    = CATEGORIES[ev.category];
            const top    = (ev.start - 8) * DESKTOP_SLOT_HEIGHT;
            const height = (ev.end - ev.start) * DESKTOP_SLOT_HEIGHT - 4;
            return (
                <div key={idx} onClick={() => setPopup(ev)}
                     style={{
                       position: 'absolute', top, height, left: 3, right: 3,
                       backgroundColor: `var(${cat.bgVar})`,
                       borderLeft: `3px solid var(${cat.colorVar})`,
                       borderRadius: 6, padding: '3px 6px', overflow: 'hidden',
                       boxShadow: '0 1px 3px rgba(0,0,0,0.12)', cursor: 'pointer', zIndex: 1,
                       transition: 'box-shadow 0.15s, transform 0.15s',
                     }}
                     onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 4px 14px rgba(0,0,0,0.18)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                     onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.12)'; e.currentTarget.style.transform = 'none'; }}
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

// ─── Mobile column ────────────────────────────────────────────────
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
                <div key={idx} className="sched-event-pop" onClick={() => setPopup(ev)}
                     style={{
                       position: 'absolute', top, height, left: 3, right: 3,
                       backgroundColor: `var(${cat.bgVar})`,
                       borderLeft: `3px solid var(${cat.colorVar})`,
                       borderRadius: 5, padding: '2px 5px', overflow: 'hidden',
                       boxShadow: '0 1px 3px rgba(0,0,0,0.12)', cursor: 'pointer', zIndex: 1,
                       animationDelay: `${idx * 25}ms`,
                     }}
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

// ─── Mobile view ──────────────────────────────────────────────────
function MobileView({ filter }) {
  const todayIdx = getTodayIndex();
  const [dayIndex, setDayIndex] = useState(todayIdx);
  const [offset, transitioning, slide] = useSlide();
  const [slotH, setSlotH] = useState(40);
  const touchStartX = useRef(null);
  const touchStartY = useRef(null);
  const navRef  = useRef(null);
  const dotsRef = useRef(null);

  useEffect(() => {
    const calc = () => {
      const navH    = navRef.current  ? navRef.current.offsetHeight  : 56;
      const dotsH   = dotsRef.current ? dotsRef.current.offsetHeight : 22;
      const reserved = 52 + 42 + 42 + navH + dotsH + 32 + 32; // filters×2 + nav + dots + header + margins
      const h = Math.max(22, Math.floor((window.innerHeight - reserved) / HOURS.length));
      setSlotH(h);
    };
    calc();
    window.addEventListener('resize', calc);
    return () => window.removeEventListener('resize', calc);
  }, []);

  const goTo = (newIndex, direction) => { slide(direction); setDayIndex(newIndex); };

  const handleTouchStart = (e) => { touchStartX.current = e.touches[0].clientX; touchStartY.current = e.touches[0].clientY; };
  const handleTouchEnd   = (e) => {
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
        {/* Day navigation */}
        <div ref={navRef} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
          <button onClick={() => dayIndex > 0 && goTo(dayIndex - 1, 'right')} disabled={dayIndex === 0}
                  style={{ padding: '5px 13px', borderRadius: 8, border: '1px solid var(--sched-btn-border)', backgroundColor: 'transparent', color: dayIndex === 0 ? 'var(--sched-btn-border)' : 'var(--sched-text)', cursor: dayIndex === 0 ? 'default' : 'pointer', fontSize: '1.1rem' }}>‹</button>

          <div style={{ textAlign: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center' }}>
              <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--sched-text)' }}>{day}</span>
              {isToday && (
                  <span style={{ fontSize: '0.62rem', fontWeight: 700, color: '#fff', backgroundColor: '#2b6cb0', borderRadius: 10, padding: '1px 7px' }}>DZIŚ</span>
              )}
            </div>
            <div style={{ fontSize: '0.65rem', color: 'var(--sched-subtext)' }}>{dayIndex + 1} / {DAYS.length} · przesuń aby zmienić</div>
          </div>

          <button onClick={() => dayIndex < DAYS.length - 1 && goTo(dayIndex + 1, 'left')} disabled={dayIndex === DAYS.length - 1}
                  style={{ padding: '5px 13px', borderRadius: 8, border: '1px solid var(--sched-btn-border)', backgroundColor: 'transparent', color: dayIndex === DAYS.length - 1 ? 'var(--sched-btn-border)' : 'var(--sched-text)', cursor: dayIndex === DAYS.length - 1 ? 'default' : 'pointer', fontSize: '1.1rem' }}>›</button>
        </div>

        {/* Dot indicators */}
        <div ref={dotsRef} style={{ display: 'flex', justifyContent: 'center', gap: 5, marginBottom: 6 }}>
          {DAYS.map((_, i) => (
              <div key={i} onClick={() => i !== dayIndex && goTo(i, i > dayIndex ? 'left' : 'right')}
                   style={{
                     width: i === dayIndex ? 18 : 7, height: 7, borderRadius: 4,
                     backgroundColor: i === dayIndex
                         ? (i === todayIdx ? '#2b6cb0' : 'var(--sched-header-bg)')
                         : (i === todayIdx ? '#90cdf4' : 'var(--sched-btn-border)'),
                     cursor: 'pointer', transition: 'all 0.3s cubic-bezier(0.4,0,0.2,1)',
                   }}
              />
          ))}
        </div>

        {/* Calendar grid */}
        <div onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}
             style={{ overflow: 'hidden', touchAction: 'pan-y', borderRadius: 10, border: '1px solid var(--sched-border)' }}>
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

// ─── Desktop view ─────────────────────────────────────────────────
function DesktopView({ filter, selectedDay, setSelectedDay, isMobile }) {
  const todayIdx   = getTodayIndex();
  const displayDays = selectedDay !== null ? [DAYS[selectedDay]] : DAYS;

  return (
      <div>
        {/* Day selector */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 12 }}>
          <button onClick={() => setSelectedDay(null)}
                  style={{ padding: '5px 12px', borderRadius: 8, border: '1px solid var(--sched-btn-border)', backgroundColor: selectedDay === null ? 'var(--sched-header-bg)' : 'transparent', color: selectedDay === null ? '#fff' : 'var(--sched-subtext)', fontSize: '0.78rem', fontWeight: selectedDay === null ? 700 : 400, cursor: 'pointer', transition: 'all 0.2s' }}>
            Cały tydzień
          </button>
          {DAYS.map((d, i) => (
              <button key={d} onClick={() => setSelectedDay(selectedDay === i ? null : i)}
                      style={{
                        padding: '5px 12px', borderRadius: 8,
                        border: `1px solid ${i === todayIdx && selectedDay !== i ? '#90cdf4' : 'var(--sched-btn-border)'}`,
                        backgroundColor: selectedDay === i ? 'var(--sched-header-bg)' : 'transparent',
                        color: selectedDay === i ? '#fff' : 'var(--sched-subtext)',
                        fontSize: '0.78rem', fontWeight: selectedDay === i ? 700 : 400,
                        cursor: 'pointer', transition: 'all 0.2s',
                        position: 'relative',
                      }}>
                {DAYS_SHORT[i]}
                {i === todayIdx && (
                    <span style={{ position: 'absolute', top: -5, right: -4, width: 7, height: 7, borderRadius: '50%', backgroundColor: '#2b6cb0', border: '1.5px solid var(--sched-popup-bg)' }} />
                )}
              </button>
          ))}
        </div>

        {/* Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: `52px repeat(${displayDays.length}, 1fr)`,
          border: '1px solid var(--sched-border)',
          borderRadius: 12, overflow: 'hidden',
        }}>
          <div style={{ backgroundColor: 'var(--sched-header-bg)', color: '#fff', padding: '8px 4px', textAlign: 'center', fontSize: '0.72rem', fontWeight: 600 }}>Godz.</div>
          {displayDays.map((day) => {
            const idx     = DAYS.indexOf(day);
            const isToday = idx === todayIdx;
            return (
                <div key={day} style={{
                  backgroundColor: isToday ? 'var(--sched-today-header-bg)' : 'var(--sched-header-bg)',
                  color: '#fff', padding: '8px 4px', textAlign: 'center',
                  fontSize: '0.78rem', fontWeight: 600,
                  borderLeft: '1px solid var(--sched-header-border)',
                }}>
                  {day}{isToday && ' ✦'}
                </div>
            );
          })}
          <DesktopTimeColumn />
          {displayDays.map((day) => (
              <DesktopDayColumn
                  key={`${day}-${filter}`}
                  day={day} filter={filter}
                  isToday={DAYS.indexOf(day) === todayIdx}
                  isMobile={isMobile}
              />
          ))}
        </div>
      </div>
  );
}

// ─── Filter bar ───────────────────────────────────────────────────
function FilterBar({ filter, setFilter, isMobile }) {
  return (
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: isMobile ? 6 : 8,
        marginBottom: 10,
        padding: isMobile ? '8px 12px' : '10px 14px',
        backgroundColor: 'var(--sched-legend-bg)',
        borderRadius: 8,
        border: '1px solid var(--sched-border)',
      }}>
      <span style={{ fontSize: '0.78rem', color: 'var(--sched-subtext)', fontWeight: 600, marginRight: 2 }}>
        Kategorie:
      </span>
        {['Wszystkie', ...Object.keys(CATEGORIES)].map((key) => {
          const cat    = CATEGORIES[key];
          const active = filter === key;
          return (
              <button key={key} onClick={() => setFilter(key)} style={{
                padding: isMobile ? '4px 11px' : '5px 14px',
                borderRadius: 20,
                border: 'none',
                outline: 'none',
                cursor: 'pointer',
                transition: 'all 0.18s',
                whiteSpace: 'nowrap',
                fontSize: isMobile ? '0.75rem' : '0.82rem',
                fontWeight: active ? 700 : 400,
                backgroundColor: active
                    ? (cat ? `var(${cat.colorVar})` : 'var(--sched-header-bg)')
                    : 'var(--sched-btn-border)',
                color: active ? '#ffffff' : 'var(--sched-subtext)',
                boxShadow: active ? '0 2px 8px rgba(0,0,0,0.15)' : 'none',
              }}>
                {cat ? `${cat.emoji} ` : ''}{key}
              </button>
          );
        })}
      </div>
  );
}

// ─── Root component ───────────────────────────────────────────────
export default function Schedule() {
  const [filter, setFilter] = useState('Wszystkie');
  const [selectedDay, setSelectedDay] = useState(null);
  const isMobile = useIsMobile();

  useEffect(() => {
    const id = 'schedule-css-vars';
    if (!document.getElementById(id)) {
      const style = document.createElement('style');
      style.id = id; style.textContent = CSS_VARS;
      document.head.appendChild(style);
    }
  }, []);

  return (
      <div className="sched-fullwidth" style={{ fontFamily: 'inherit' }}>

        <FilterBar
            filter={filter} setFilter={setFilter}
            isMobile={isMobile}
        />

        {isMobile
            ? <MobileView  filter={filter} />
            : <DesktopView filter={filter}
                           selectedDay={selectedDay} setSelectedDay={setSelectedDay}
                           isMobile={isMobile} />
        }

        {/* Legend */}
        <div style={{
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          flexWrap: isMobile ? 'nowrap' : 'wrap',
          gap: isMobile ? 8 : 20,
          marginTop: 10,
          padding: isMobile ? '8px 12px' : '10px 14px',
          backgroundColor: 'var(--sched-legend-bg)',
          borderRadius: 8, border: '1px solid var(--sched-border)',
        }}>
          <span style={{ fontSize: '0.78rem', color: 'var(--sched-subtext)', fontWeight: 600 }}>Kategorie:</span>
          {Object.entries(CATEGORIES).map(([key, cat]) => (
              <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: '0.8rem', color: `var(${cat.colorVar})`, fontWeight: 500 }}>
                <div style={{ width: 9, height: 9, borderRadius: '50%', backgroundColor: `var(${cat.colorVar})`, flexShrink: 0 }} />
                {cat.emoji} {key}
              </div>
          ))}
        </div>
      </div>
  );
}