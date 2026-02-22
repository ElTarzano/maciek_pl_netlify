export default async (req) => {
    try {
        const response = await fetch('https://pza.org.pl/sport/kalendarz-imprez-2024', {
            headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; ClimbingBot/1.0)',
                'Accept': 'text/html,application/xhtml+xml',
                'Accept-Language': 'pl-PL,pl;q=0.9',
            },
        });

        if (!response.ok) {
            throw new Error(`PZA fetch failed: ${response.status}`);
        }

        const html = await response.text();
        const competitions = [];
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const SEPARATOR = '|||';

        // Zamień <br> na separator PRZED usunięciem tagów
        const prepareCell = (str) =>
            str
                .replace(/<br\s*\/?>/gi, SEPARATOR)
                .replace(/<[^>]+>/g, '')
                .replace(/&nbsp;/g, ' ')
                .replace(/\s+/g, ' ')
                .trim();

        // Wyciągnij href z komórki
        const getHref = (str) => {
            const m = /href="([^"]+)"/i.exec(str);
            if (!m) return null;
            const href = m[1];
            if (href.startsWith('http')) return href;
            if (href.startsWith('/')) return `https://pza.org.pl${href}`;
            return null;
        };

        const rowRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
        let rowMatch;

        while ((rowMatch = rowRegex.exec(html)) !== null) {
            const rowHtml = rowMatch[1];
            const cells = [];
            const cellRe = /<td[^>]*>([\s\S]*?)<\/td>/gi;
            let cellMatch;
            while ((cellMatch = cellRe.exec(rowHtml)) !== null) {
                cells.push(cellMatch[1]);
            }

            if (cells.length < 3) continue;

            const nameRaw = cells[1];
            const dateRaw = prepareCell(cells[2]).split(SEPARATOR)[0].trim();

            if (!/^\d{4}-\d{2}-\d{2}/.test(dateRaw)) continue;

            // Parsuj datę
            const startStr = dateRaw.split('/')[0].trim();
            const [year, month, day] = startStr.split('-').map(Number);
            const startDate = new Date(year, month - 1, day);
            if (startDate < today) continue;

            // Parsuj nazwę i lokalizację — oddzielone przez <br>
            const parts = prepareCell(nameRaw)
                .split(SEPARATOR)
                .map(s => s.replace(/\|\s*informacje.*$/i, '').trim())
                .filter(Boolean);

            const name = parts[0] || '';
            const location = parts[1] || 'Polska';

            if (!name) continue;

            // Link do informacji
            const url = getHref(nameRaw);

            // Typ zawodów
            let type = 'combined';
            if (/\(B\)/i.test(name)) type = 'bouldering';
            else if (/\(P\)/i.test(name)) type = 'lead';
            else if (/\(C\)/i.test(name)) type = 'speed';

            // Poziom
            let level = 'ogólnopolski';
            if (/mistrzostwa europy|puchar świata|world cup/i.test(name)) level = 'międzynarodowy';

            // Format daty po polsku: DD-DD.MM.YYYY lub DD.MM.YYYY
            const endDay = dateRaw.includes('/') ? dateRaw.split('/')[1] : null;
            const formattedDate = endDay
                ? `${day}–${endDay}.${String(month).padStart(2, '0')}.${year}`
                : `${String(day).padStart(2, '0')}.${String(month).padStart(2, '0')}.${year}`;

            competitions.push({ name, date: formattedDate, location, type, level, url });
        }

        return new Response(JSON.stringify({
            competitions: competitions.slice(0, 20),
            updated_at: new Date().toLocaleDateString('pl-PL'),
            source: 'pza.org.pl',
        }), {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'public, s-maxage=3600',
            },
        });

    } catch (err) {
        return new Response(
            JSON.stringify({ error: err.message, competitions: [] }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
    }
};

export const config = {
    path: '/api/climbing-competitions',
};