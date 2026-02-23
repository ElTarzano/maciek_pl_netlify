import { useState, useEffect, useMemo } from 'react';

// ── Stałe ─────────────────────────────────────────────────────────────────────

const TYPE_LABELS = {
    bouldering: { label: 'Bouldering',  color: '#e67e22' },
    lead:       { label: 'Prowadzenie', color: '#2e86c1' },
    speed:      { label: 'Czasówki',    color: '#27ae60' },
};

const TYPE_ABBR = {
    B: 'bouldering',
    P: 'lead',
    C: 'speed',
};

const AGE_CATEGORIES = {
    DM: { label: 'DM', name: 'Dziecko młodsze',  years: '≥2016',    bg: '#fce4ec', color: '#c2185b' },
    D:  { label: 'D',  name: 'Dziecko',           years: '2014–2015', bg: '#f3e5f5', color: '#7b1fa2' },
    Mł: { label: 'Mł', name: 'Młodzik',           years: '2012–2013', bg: '#e8eaf6', color: '#303f9f' },
    JM: { label: 'JM', name: 'Junior młodszy',    years: '2010–2011', bg: '#e3f2fd', color: '#1565c0' },
    J:  { label: 'J',  name: 'Junior',            years: '2008–2009', bg: '#e0f7fa', color: '#00695c' },
    M:  { label: 'M',  name: 'Młodzieżowiec',     years: '2006–2007', bg: '#e8f5e9', color: '#2e7d32' },
    S:  { label: 'S',  name: 'Senior',            years: '≤2005',     bg: '#fff8e1', color: '#e65100' },
};

const AGE_KEYS = ['DM', 'JM', 'Mł', 'D', 'J', 'M', 'S'];

const TYPE_ORDER = ['bouldering', 'lead', 'speed'];

// ── Style (poza komponentem — nie redefiniowane przy każdym renderze) ──────────

const filterGroupStyle = {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    marginBottom: '10px',
};

const filterButtonsStyle = {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
};

const filterLabelStyle = {
    fontSize: '12px',
    fontWeight: '700',
    color: '#888',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
};

// ── Parsowanie typów ──────────────────────────────────────────────────────────

function extractTypes(name, apiType) {
    const found = new Set();

    if (name) {
        const groups = [...name.matchAll(/\(([^)]+)\)/g)];
        groups.forEach(([, inner]) => {
            inner.split(/[,\s]+/).forEach((token) => {
                const t = token.trim().toUpperCase();
                if (TYPE_ABBR[t]) found.add(TYPE_ABBR[t]);
            });
        });
    }

    if (found.size === 0) {
        toArray(apiType).forEach((t) => found.add(t));
    }

    return TYPE_ORDER.filter((k) => found.has(k));
}

// ── Parsowanie kategorii wiekowych ───────────────────────────────────────────

// FIX: pętla do momentu braku zmian, by obsłużyć np. "JiMiS" → "J M S"
function expandJoined(name) {
    if (!name) return name;
    const alt = AGE_KEYS.map((k) => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
    const joinedRe = new RegExp(`(${alt})i(${alt})`, 'gu');
    let prev;
    let result = name;
    do {
        prev = result;
        result = prev.replace(joinedRe, '$1 $2');
    } while (result !== prev);
    return result;
}

function extractCategories(name) {
    if (!name) return [];
    const expanded = expandJoined(name);
    const found = new Set();
    AGE_KEYS.forEach((key) => {
        const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const boundary = '[^\\wŁłÓóĄąĘęŚśŹźŻżĆćŃń]';
        const re = new RegExp(`(?:^|${boundary})${escaped}(?:$|${boundary})`, 'u');
        if (re.test(expanded)) found.add(key);
    });
    return AGE_KEYS.filter((k) => found.has(k));
}

function toArray(value) {
    if (!value) return [];
    if (Array.isArray(value)) return value;
    return String(value).split(/[,;]+/).map((v) => v.trim()).filter(Boolean);
}

// ── Komponenty ────────────────────────────────────────────────────────────────

function Badge({ text, bg, color }) {
    return (
        <span
            style={{
                display: 'inline-block',
                padding: '2px 8px',
                borderRadius: '12px',
                fontSize: '12px',
                fontWeight: '600',
                backgroundColor: bg,
                color: color,
                whiteSpace: 'nowrap',
            }}
        >
            {text}
        </span>
    );
}

function BadgeCell({ items }) {
    return (
        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
            {items.length > 0 ? items : <span style={{ color: '#bbb' }}>—</span>}
        </div>
    );
}

function FilterButton({ active, onClick, children, color }) {
    return (
        <button
            onClick={onClick}
            style={{
                padding: '6px 14px',
                borderRadius: '20px',
                border: 'none',
                backgroundColor: active ? color : '#e0e0e0',
                color: active ? '#fff' : '#555',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: '600',
                transition: 'all 0.2s',
            }}
        >
            {children}
        </button>
    );
}

// ── Główny komponent ──────────────────────────────────────────────────────────

export default function ClimbingCompetitions() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [typeFilter, setTypeFilter] = useState('all');
    const [ageFilter, setAgeFilter] = useState('all');

    useEffect(() => {
        fetch('/api/climbing-competitions')
            .then((res) => {
                // FIX: jawne sprawdzenie statusu HTTP
                if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
                return res.json();
            })
            .then((json) => { setData(json); setLoading(false); })
            .catch((err) => { setError(err.message); setLoading(false); });
    }, []);

    // FIX: parsowanie raz per zawody, zapamiętane przez useMemo
    const enriched = useMemo(() => {
        if (!data?.competitions) return [];
        return data.competitions.map((comp) => ({
            ...comp,
            _types: extractTypes(comp.name, comp.type),
            _categories: extractCategories(comp.name),
        }));
    }, [data]);

    if (loading) {
        return (
            <div style={{ padding: '40px', textAlign: 'center', color: '#888' }}>
                <div style={{ fontSize: '32px', marginBottom: '12px' }}>🔍</div>
                <p>Wyszukuję najbliższe zawody wspinaczkowe...</p>
            </div>
        );
    }

    if (error || !data?.competitions) {
        return (
            <div style={{ padding: '20px', color: '#e74c3c', border: '1px solid #fadbd8', borderRadius: '8px' }}>
                Nie udało się pobrać danych: {error || 'Nieznany błąd'}
            </div>
        );
    }

    const filtered = enriched.filter((c) => {
        const matchType = typeFilter === 'all' || c._types.includes(typeFilter);
        const matchAge  = ageFilter  === 'all' || c._categories.includes(ageFilter);
        return matchType && matchAge;
    });

    const typeFilters = [
        { key: 'all',        label: 'Wszystkie',  color: '#555' },
        { key: 'bouldering', ...TYPE_LABELS.bouldering },
        { key: 'lead',       ...TYPE_LABELS.lead },
        { key: 'speed',      ...TYPE_LABELS.speed },
    ];

    const ageFilters = [
        { key: 'all', label: 'Wszystkie', color: '#555' },
        ...AGE_KEYS.map((k) => ({
            key: k,
            label: AGE_CATEGORIES[k].label,
            color: AGE_CATEGORIES[k].color,
        })),
    ];

    return (
        <div style={{ margin: '24px 0' }}>

            {/* Filtry – Rodzaj */}
            <div style={filterGroupStyle}>
                <span style={filterLabelStyle}>Rodzaj</span>
                <div style={filterButtonsStyle}>
                    {typeFilters.map((f) => (
                        <FilterButton key={f.key} active={typeFilter === f.key} onClick={() => setTypeFilter(f.key)} color={f.color}>
                            {f.label}
                        </FilterButton>
                    ))}
                </div>
            </div>

            {/* Filtry – Kategoria wiekowa */}
            <div style={{ ...filterGroupStyle, marginBottom: '20px' }}>
                <span style={filterLabelStyle}>Kategoria</span>
                <div style={filterButtonsStyle}>
                    {ageFilters.map((f) => (
                        <FilterButton key={f.key} active={ageFilter === f.key} onClick={() => setAgeFilter(f.key)} color={f.color}>
                            {f.label}
                        </FilterButton>
                    ))}
                </div>
            </div>

            {/* Tabela */}
            {filtered.length === 0 ? (
                <p style={{ color: '#888', fontStyle: 'italic' }}>Brak zawodów dla wybranego filtra.</p>
            ) : (
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                        <thead>
                        <tr style={{ backgroundColor: 'var(--ifm-color-emphasis-100)' }}>
                            {['Data', 'Nazwa', 'Miejsce', 'Kategorie wiekowe', 'Rodzaj', 'Link'].map((h) => (
                                <th
                                    key={h}
                                    style={{
                                        padding: '10px 14px',
                                        textAlign: 'left',
                                        fontWeight: '700',
                                        borderBottom: '2px solid var(--ifm-color-emphasis-300)',
                                        whiteSpace: 'nowrap',
                                    }}
                                >
                                    {h}
                                </th>
                            ))}
                        </tr>
                        </thead>
                        <tbody>
                        {filtered.map((comp) => {
                            // FIX: stabilny klucz zamiast indeksu tablicy
                            const rowKey = `${comp.date}-${comp.name}`;
                            return (
                                <tr
                                    key={rowKey}
                                    style={{
                                        borderBottom: '1px solid var(--ifm-color-emphasis-200)',
                                    }}
                                >
                                    <td style={{ padding: '10px 14px', whiteSpace: 'nowrap', fontWeight: '600' }}>{comp.date}</td>
                                    <td style={{ padding: '10px 14px' }}>{comp.name}</td>
                                    <td style={{ padding: '10px 14px' }}>
                                        {comp.location ? (
                                            <a
                                                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(comp.location)}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                style={{ color: 'inherit', textDecoration: 'underline', textDecorationStyle: 'dotted', textUnderlineOffset: '3px' }}
                                            >
                                                {comp.location}
                                            </a>
                                        ) : '—'}
                                    </td>

                                    <td style={{ padding: '10px 14px' }}>
                                        <BadgeCell
                                            items={comp._categories.map((cat) => {
                                                const info = AGE_CATEGORIES[cat];
                                                return <Badge key={cat} text={info.label} bg={info.bg} color={info.color} />;
                                            })}
                                        />
                                    </td>

                                    <td style={{ padding: '10px 14px' }}>
                                        <BadgeCell
                                            items={comp._types.map((t) => {
                                                const info = TYPE_LABELS[t] || { label: t, color: '#999' };
                                                return <Badge key={t} text={info.label} bg={info.color + '22'} color={info.color} />;
                                            })}
                                        />
                                    </td>

                                    <td style={{ padding: '10px 14px' }}>
                                        {comp.url ? (
                                            <a href={comp.url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--ifm-color-primary)' }}>
                                                Więcej
                                            </a>
                                        ) : (
                                            <span style={{ color: '#bbb' }}>—</span>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Legenda kategorii wiekowych */}
            <div style={{ marginTop: '20px', padding: '12px 16px', backgroundColor: 'var(--ifm-color-emphasis-100)', borderRadius: '8px' }}>
                <p style={{ margin: '0 0 8px 0', fontSize: '12px', fontWeight: '700', color: '#888', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Legenda kategorii wiekowych
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {AGE_KEYS.map((key) => {
                        const info = AGE_CATEGORIES[key];
                        return (
                            <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <Badge text={info.label} bg={info.bg} color={info.color} />
                                <span style={{ fontSize: '12px', color: '#666' }}>
                                    {info.name} <span style={{ color: '#aaa' }}>({info.years})</span>
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Stopka */}
            {data.updated_at && (
                <p style={{ marginTop: '12px', fontSize: '12px', color: '#aaa', textAlign: 'right' }}>
                    Dane pobrane z{' '}
                    <a href="https://www.pza.org.pl/kalendarz" target="_blank" rel="noopener noreferrer" style={{ color: '#aaa', textDecoration: 'underline' }}>
                        kalendarza PZA
                    </a>
                    {' '}· {data.updated_at}
                </p>
            )}
        </div>
    );
}