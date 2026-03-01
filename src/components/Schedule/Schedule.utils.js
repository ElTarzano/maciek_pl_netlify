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

// ─── Hook z zablokowaną wysokością po pierwszym renderze ──────────────────────
// Pasek przeglądarki (Chrome Android, iOS Safari) zmienia window.innerHeight
// i visualViewport.height przy scroll — blokujemy wysokość po montowaniu
// i przeliczamy TYLKO przy obrocie ekranu.
export function useMobileSlotHeight(navRef, dotsRef) {
    const [slotH, setSlotH] = useState(40);
    // Zapamiętujemy orientację żeby odróżnić obrót od pojawienia się paska
    const orientationRef = useRef(null);

    useEffect(() => {
        const calc = () => {
            const navH  = navRef.current  ? navRef.current.offsetHeight  : 56;
            const dotsH = dotsRef.current ? dotsRef.current.offsetHeight : 22;
            const reserved = 52 + 42 + 42 + navH + dotsH + 64;
            // Używamy screen.height — stała, nie zmienia się przy pasku przeglądarki
            const viewH = window.screen?.height ?? window.innerHeight;
            const h = Math.max(22, Math.floor((viewH - reserved) / HOURS.length));
            setSlotH(h);
        };

        // Tylko przy obrocie ekranu
        const onOrientationChange = () => {
            const newOrientation = window.screen?.orientation?.angle ?? window.orientation ?? 0;
            if (newOrientation !== orientationRef.current) {
                orientationRef.current = newOrientation;
                // Małe opóźnienie — przeglądarka potrzebuje chwili po obrocie
                setTimeout(calc, 300);
            }
        };

        // Zapisz startową orientację
        orientationRef.current = window.screen?.orientation?.angle ?? window.orientation ?? 0;

        // Oblicz raz przy montowaniu
        calc();

        window.addEventListener('orientationchange', onOrientationChange);
        screen.orientation?.addEventListener('change', onOrientationChange);

        return () => {
            window.removeEventListener('orientationchange', onOrientationChange);
            screen.orientation?.removeEventListener('change', onOrientationChange);
        };
    }, [navRef, dotsRef]);

    return slotH;
}