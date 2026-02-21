export default async (req) => {
    const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

    if (!ANTHROPIC_API_KEY) {
        return new Response(JSON.stringify({ error: 'Brak klucza API' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }

    try {
        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': ANTHROPIC_API_KEY,
                'anthropic-version': '2023-06-01',
                'anthropic-beta': 'web-search-2025-03-05',
            },
            body: JSON.stringify({
                model: 'claude-opus-4-6',
                max_tokens: 2000,
                tools: [{ type: 'web_search_20250305', name: 'web_search' }],
                system: `Jesteś asystentem który wyszukuje zawody wspinaczkowe w Polsce.
Zawsze odpowiadaj TYLKO w formacie JSON, bez żadnego dodatkowego tekstu.
Format odpowiedzi:
{
  "competitions": [
    {
      "name": "Nazwa zawodów",
      "date": "DD.MM.YYYY lub zakres DD-DD.MM.YYYY",
      "location": "Miasto, Ścieżka/Sala",
      "type": "bouldering" | "lead" | "speed" | "combined",
      "level": "lokalny" | "regionalny" | "ogólnopolski" | "międzynarodowy",
      "url": "link do strony lub null"
    }
  ],
  "updated_at": "data wyszukiwania"
}
Typy zawodów: bouldering = bouldering, lead = prowadzenie, speed = szybkość, combined = wielobój.
Szukaj zawodów w Polsce w najbliższych 3 miesiącach.`,
                messages: [
                    {
                        role: 'user',
                        content: `Wyszukaj najbliższe zawody wspinaczkowe w Polsce w ${new Date().toLocaleDateString('pl-PL', { month: 'long', year: 'numeric' })}. 
Szukaj na stronach: Polski Związek Alpinizmu (pza.org.pl), wspinanie.pl, 8a.nu, eventbrite, Facebook events.
Uwzględnij zawody boulderingowe, na prowadzenie i szybkościowe.
Odpowiedz TYLKO w formacie JSON.`,
                    },
                ],
            }),
        });

        const data = await response.json();

        // Wyciągnij tekst z odpowiedzi (może być po użyciu web_search)
        const textContent = data.content?.find((block) => block.type === 'text');

        if (!textContent) {
            return new Response(
                JSON.stringify({ error: 'Brak odpowiedzi od modelu', competitions: [] }),
                { status: 200, headers: { 'Content-Type': 'application/json' } }
            );
        }

        // Wyczyść JSON z potencjalnych markdown code blocks
        const cleaned = textContent.text
            .replace(/```json\n?/g, '')
            .replace(/```\n?/g, '')
            .trim();

        const parsed = JSON.parse(cleaned);

        return new Response(JSON.stringify(parsed), {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'public, s-maxage=3600', // cache na 1h
            },
        });
    } catch (err) {
        return new Response(
            JSON.stringify({ error: err.message, competitions: [] }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
    }
};

export const config = {
    path: '/api/climbing-competitions',
};