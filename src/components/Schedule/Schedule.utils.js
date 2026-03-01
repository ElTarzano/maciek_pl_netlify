import { useState, useEffect, useRef } from 'react';
import { HOURS } from './Schedule.constants';

// JS getDay(): 0=Sun 1=Mon … 6=Sat  →  DAYS index = (jsDay + 6) % 7
export function getTodayIndex() {
    return (new Date().getDay() + 6) % 7;
}

export function fmt(h) {
    const hh = Math.floor(h);
    const mm = Math.round((h % 1) * 60);
    return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
}

export function spotsInfo(spots) {
    if (spots === 0) return { color: '#c53030', bg: '#fff5f5', dot: '#c53030', label: 'Brak miejsc' };
    if (spots <= 2)  return { color: '#c05621', bg: '#fffaf0', dot: '#dd6b20', label: `${spots} ${spots === 1 ? 'wolne miejsce' : 'wolne miejsca'}` };
    if (spots <= 4)  return { color: '#b7791f', bg: '#fffff0', dot: '#d69e2e', label: `${spots} wolnych miejsc` };
    return               { color: '#276749', bg: '#f0fff4', dot: '#38a169', label: `${spots} wolnych miejsc` };
}

export function useIsMobile() {
    const [isMobile, setIsMobile] = useState(false);
    useEffect(() => {
        const check = () => setIsMobile(window.innerWidth < 640);
        check();
        window.addEventListener('resize', check);
        return () => window.removeEventListener('resize', check);
    }, []);
    return isMobile;
}

export function useSlide() {
    const [offset, setOffset] = useState(0);
    const [transitioning, setTransitioning] = useState(false);
    const slide = (direction) => {
        const startX = direction === 'left' ? 100 : -100;
        setTransitioning(false);
        setOffset(startX);
        requestAnimationFrame(() =>
            requestAnimationFrame(() => {
                setTransitioning(true);
                setOffset(0);
            })
        );
    };
    return [offset, transitioning, slide];
}

// ─── Naprawiony hook: używa visualViewport zamiast window.innerHeight ─────────
// Zapobiega skakaniu grafiku gdy pasek przeglądarki pojawia się/znika na mobile
export function useMobileSlotHeight(navRef, dotsRef) {
    const [slotH, setSlotH] = useState(40);

    useEffect(() => {
        const calc = () => {
            const navH  = navRef.current  ? navRef.current.offsetHeight  : 56;
            const dotsH = dotsRef.current ? dotsRef.current.offsetHeight : 22;
            const reserved = 52 + 42 + 42 + navH + dotsH + 64;

            // visualViewport.height jest stabilne — nie zmienia się gdy przeglądarka
            // chowa/pokazuje swój pasek nawigacyjny (iOS Safari, Chrome Android)
            const viewH = window.visualViewport?.height ?? window.innerHeight;
            const h = Math.max(22, Math.floor((viewH - reserved) / HOURS.length));
            setSlotH(h);
        };

        calc();

        // Reaguj na prawdziwy resize (np. obrót ekranu, otwarcie klawiatury)
        window.visualViewport?.addEventListener('resize', calc);
        // Fallback dla przeglądarek bez visualViewport + obsługa obrotu
        window.addEventListener('orientationchange', calc);

        return () => {
            window.visualViewport?.removeEventListener('resize', calc);
            window.removeEventListener('orientationchange', calc);
        };
    }, [navRef, dotsRef]);

    return slotH;
}