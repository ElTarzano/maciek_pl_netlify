// ─── Logo placówki (pokazywane tylko, gdy event nie ma własnego zdjęcia) ──
export const LOGO_URL = '/img/logo.svg';

export const CATEGORIES = {
    Dzieci:       { colorVar: '--sched-dzieci',       bgVar: '--sched-dzieci-bg',       emoji: '🧒' },
    Juniorzy:     { colorVar: '--sched-juniorzy',     bgVar: '--sched-juniorzy-bg',     emoji: '🧑' },
    Dorośli:      { colorVar: '--sched-dorosli',      bgVar: '--sched-dorosli-bg',      emoji: '🧗' },
    Indywidualne: { colorVar: '--sched-indywidualne', bgVar: '--sched-indywidualne-bg', emoji: '⭐' },
};

export const DAYS = ['Poniedziałek', 'Wtorek', 'Środa', 'Czwartek', 'Piątek', 'Sobota', 'Niedziela'];
export const DAYS_SHORT = ['Pon', 'Wt', 'Śr', 'Czw', 'Pt', 'Sob', 'Nd'];
export const HOURS = Array.from({ length: 15 }, (_, i) => i + 8); // 8–22
export const DESKTOP_SLOT_HEIGHT = 60;

export const CATEGORY_LIGHT = {
    Dzieci:       { bg: '#fff5f5', color: '#c53030' },
    Juniorzy:     { bg: '#ebf8ff', color: '#2b6cb0' },
    Dorośli:      { bg: '#f0fff4', color: '#276749' },
    Indywidualne: { bg: '#fffff0', color: '#b7791f' },
};

export const SCHEDULE = {
    Poniedziałek: [
        { start: 16, end: 18,   category: 'Indywidualne', name: 'Michały',            level: 'Zaawansowany',        spots: 0, image: '/img/hero-image.png', desc: 'Trening indywidualny dla osób wymagających większej uwagi i specjalnego podejścia.' },
        { start: 18, end: 20,   category: 'Juniorzy',     name: 'Zwinne Tygrysy',     level: 'Zaawansowany',        spots: 1, image: '/img/hero-image.png', desc: 'Treningi dla dzieci w wieku 13-16 lat. Zajęcia odbywają się na Koronie, Moodzie i Avatarze (Sikorki). Grupa dla zaawansowanych zawodników, startujących w zawodach pucharowych, lub aspirujących do kadry skałkowej.' },
        { start: 20, end: 22,   category: 'Dorośli',      name: 'Mistrzowie Wydymy',  level: 'Średniozaawansowany', spots: 1, desc: 'Trening nastawiony na budowanie wytrzymałości w skałki. Na treningu skupiamy się na tym, żeby atmosfera była przyjemnia i miła, a wspinanie wymagające. Poziom wspinaczkowy grupy jest w okolicach 6b do 7b. Zajęcia odbywają się tylko raz w tygodniu ale, poza sekcją, grupa regularnie umawia się na wspólne treningi na Koronie i innych krakowskich ściankach.' },
    ],
    Wtorek: [
        { start: 10, end: 11.5, category: 'Indywidualne', name: 'Trening indywidualny',  level: 'Zaawansowany',        spots: 3, desc: 'Prywatna sesja z trenerem. Idealny dla osób chcących szybko przejść na wyższy poziom lub pracować nad konkretnym problemem technicznym.' },
        { start: 15, end: 16.5, category: 'Juniorzy',     name: 'Bouldering juniorów',   level: 'Średniozaawansowany', spots: 6, desc: 'Trening boulderingowy dla młodzieży — rozwiązywanie problemów, kreatywność ruchowa i przygotowanie do zawodów boulderingowych.' },
        { start: 17, end: 18.5, category: 'Dorośli',      name: 'Wspinaczka skałkowa',   level: 'Początkujący',        spots: 4, desc: 'Przygotowanie do wspinaczki na naturalnym terenie: praca z liną, czytanie skały, techniki asekuracji i planowanie wyjazdu na skały.' },
        { start: 19, end: 20.5, category: 'Dorośli',      name: 'Siła i kondycja',       level: 'Zaawansowany',        spots: 0, desc: 'Trening ogólnorozwojowy dla wspinaczy — siła palców, antagoniści, core i wytrzymałość. Uzupełnienie typowych zajęć na ścianie.' },
    ],
    Środa: [
        { start: 9,  end: 10.5, category: 'Dzieci',       name: 'Zabawa na ścianie',       level: 'Początkujący',        spots: 8, desc: 'Luźne zajęcia tematyczne dla dzieci — każde spotkanie to inna przygoda! Bajkowe trasy, konkursy i wspólna zabawa na ścianie.' },
        { start: 11, end: 12,   category: 'Indywidualne', name: 'Trening indywidualny',    level: 'Średniozaawansowany', spots: 2, desc: 'Godzinna sesja indywidualna skoncentrowana na jednym wybranym aspekcie technicznym. Szybkie i efektywne poprawki.' },
        { start: 16, end: 17.5, category: 'Dzieci',       name: 'Wspinaczka dla dzieci',   level: 'Początkujący',        spots: 3, desc: 'Regularne zajęcia grupy dziecięcej z podziałem na poziomy. Praca nad techniką nóg, siłą chwytu i odwagą na ścianie.' },
        { start: 18, end: 19.5, category: 'Juniorzy',     name: 'Zaawansowany trening',    level: 'Zaawansowany',        spots: 1, desc: 'Trening dla juniorów z ambicjami startowymi. Wyczynowe podejście do treningu, przygotowanie mentalne i analiza błędów.' },
        { start: 20, end: 21.5, category: 'Dorośli',      name: 'Bouldering',              level: 'Średniozaawansowany', spots: 5, desc: 'Otwarty trening boulderingowy dla dorosłych. Praca nad dynamiką, równowagą i kreatywnością ruchową na problemach różnych poziomów.' },
    ],
    Czwartek: [
        { start: 10,   end: 11.5, category: 'Dorośli',      name: 'Technika wspinania',   level: 'Zaawansowany',        spots: 0, desc: 'Zajęcia skupione wyłącznie na technice — praca nad pozycją ciała, precyzją stóp i efektywnym użyciem nóg zamiast siły ramion.' },
        { start: 15,   end: 16.5, category: 'Juniorzy',     name: 'Trening juniorów',     level: 'Początkujący',        spots: 6, desc: 'Czwartkowa sesja juniorów łącząca pracę na ścianie prowadzonej i boulderingu. Indywidualne podejście do każdego zawodnika.' },
        { start: 17,   end: 18,   category: 'Indywidualne', name: 'Trening indywidualny', level: 'Zaawansowany',        spots: 1, desc: 'Sesja 1:1 z video-analizą wspinania. Nagranie, omówienie i plan korekcji na kolejne tygodnie.' },
        { start: 18.5, end: 20,   category: 'Dorośli',      name: 'Droga klasyczna',      level: 'Średniozaawansowany', spots: 4, desc: 'Warsztaty skupione na wspinaniu klasycznym — zakładanie przelotów, asekuracja wierzchołkowa i techniki zjazdu na linie.' },
    ],
    Piątek: [
        { start: 9,    end: 10.5, category: 'Dzieci',       name: 'Wspinaczka dla dzieci',  level: 'Początkujący',        spots: 7, desc: 'Piątkowe zajęcia dla dzieci — podsumowanie tygodnia na ścianie. Testy postępów i małe wyzwania dla każdego uczestnika.' },
        { start: 16,   end: 17.5, category: 'Dzieci',       name: 'Zajęcia weekendowe',     level: 'Początkujący',        spots: 5, desc: 'Grupowe zajęcia na początku weekendu — idealne dla dzieci szkolnych. Aktywna forma spędzenia wolnego czasu po tygodniu nauki.' },
        { start: 17,   end: 18.5, category: 'Juniorzy',     name: 'Bouldering juniorów',    level: 'Średniozaawansowany', spots: 2, desc: 'Wolna sesja boulderingowa z opcjonalną asystą trenera. Juniorzy samodzielnie eksplorują ścianę i pracują nad wyznaczonymi celami.' },
        { start: 19,   end: 20.5, category: 'Dorośli',      name: 'Wieczór wspinaczkowy',   level: 'Zaawansowany',        spots: 3, desc: 'Relaksacyjny wieczór na ścianie dla dorosłych. Mix wspinania towarzyskiego i technicznego w luźnej atmosferze końca tygodnia.' },
        { start: 20.5, end: 22,   category: 'Indywidualne', name: 'Trening indywidualny',   level: 'Średniozaawansowany', spots: 0, desc: 'Wieczorna sesja indywidualna dla osób z napiętym harmonogramem. Elastyczny program dopasowany do potrzeb klienta.' },
    ],
    Sobota: [
        { start: 9,  end: 11,   category: 'Dzieci',       name: 'Wspinaczka weekendowa',  level: 'Początkujący',        spots: 6, desc: 'Dwugodzinne sobotnie zajęcia dla dzieci — dłuższy format pozwala na więcej zabaw tematycznych i gruntowną pracę techniczną.' },
        { start: 10, end: 12,   category: 'Juniorzy',     name: 'Zawody treningowe',      level: 'Zaawansowany',        spots: 0, desc: 'Wewnętrzne zawody treningowe dla juniorów. Symulacja prawdziwych zawodów — czas, flash, on-sight. Doskonale przygotowuje do startów.' },
        { start: 13, end: 15,   category: 'Dorośli',      name: 'Technika i siła',        level: 'Średniozaawansowany', spots: 4, desc: 'Kompleksowy trening łączący pracę techniczną na ścianie z ćwiczeniami siłowymi. Idealne połączenie dla wszechstronnego rozwoju.' },
        { start: 15, end: 16,   category: 'Indywidualne', name: 'Trening indywidualny',   level: 'Początkujący',        spots: 1, desc: 'Weekendowa sesja indywidualna — czas na szczegółową pracę nad techniką bez pośpiechu, z pełnym skupieniem trenera.' },
        { start: 16, end: 18,   category: 'Dorośli',      name: 'Bouldering otwarty',     level: 'Zaawansowany',        spots: 8, desc: 'Otwarty popołudniowy bouldering dla dorosłych w każdym poziomie. Trener dostępny do konsultacji, luźna atmosfera weekendowa.' },
    ],
    Niedziela: [
        { start: 10, end: 12,   category: 'Dzieci',       name: 'Rodzinne wspinanie',      level: 'Początkujący',        spots: 5, desc: 'Wyjątkowe zajęcia dla całych rodzin — rodzice i dzieci wspinają się razem! Trener prowadzi obie grupy równolegle. Brak wymagań wstępnych.' },
        { start: 12, end: 14,   category: 'Juniorzy',     name: 'Trening niedzielny',      level: 'Średniozaawansowany', spots: 3, desc: 'Niedzielna sesja dla juniorów z naciskiem na regenerację i technikę. Mniej intensywna, bardziej eksploracyjna forma treningu.' },
        { start: 14, end: 16,   category: 'Dorośli',      name: 'Wspinaczka rekreacyjna',  level: 'Zaawansowany',        spots: 7, desc: 'Rekreacyjna wspinaczka dla dorosłych — bez presji, bez intensywności. Idealne zakończenie weekendu dla miłośników aktywnego relaksu.' },
        { start: 16, end: 17,   category: 'Indywidualne', name: 'Trening indywidualny',    level: 'Początkujący',        spots: 0, desc: 'Ostatnia niedzielna sesja tygodnia. Idealna na podsumowanie postępów i zaplanowanie celów na nadchodzący tydzień treningowy.' },
    ],
};