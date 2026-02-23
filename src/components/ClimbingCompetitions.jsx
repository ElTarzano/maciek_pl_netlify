import { useState, useEffect } from 'react';

const TYPE_LABELS = {
    bouldering: { label: '🪨 Bouldering', color: '#e67e22' },
    lead:       { label: '🧗 Prowadzenie', color: '#2e86c1' },
    speed:      { label: '⚡ Szybkość',    color: '#27ae60' },
};

const LEVEL_LABELS = {
    lokalny:        { label: 'Lokalny',         bg: '#f0f0f0', color: '#555' },
    regionalny:     { label: 'Regionalny',       bg: '#dbeafe', color: '#1d4ed8' },
    ogólnopolski:   { label: 'Ogólnopolski',     bg: '#dcfce7', color: '#166534' },
    międzynarodowy: { label: 'Międzynarodowy',   bg: '#fef9c3', color: '#854d0e' },
};

const AGE_CATEGORIES = {
    DM:  { label: 'DM',  title: 'Dziecko młodsze (≥2016)',   bg: '#fce4ec', color: '#c2185b' },
    D:   { label: 'D',   title: 'Dziecko (2014–2015)',        bg: '#f3e5f5', color: '#7b1fa2' },
    'Mł':{ label: 'Mł',  title: 'Młodzik (2012–2013)',        bg: '#e8eaf6', color: '#303f9f' },
    JM:  { label: 'JM',  title: 'Junior młodszy (2010–2011)', bg: '#e3f2fd', color: '#1565c0' },
    J:   { label: 'J',   title: 'Junior (2008–2009)',         bg: '#e0f7fa', color: '#00695c' },
    M:   { label: 'M',   title: 'Młodzieżowiec (2006–2007)',  bg: '#e8f5e9', color: '#2e7d32' },
    S:   { label: 'S',   title: 'Senior (≤2005)',             bg: '#fff8e1', color: '#e65100' },
};

// Sorted longest-first so "DM"/"JM"/"Mł" are matched before "D"/"M"/"J"
const AGE_KEYS_SORTED = ['DM', 'JM', 'Mł', 'D', 'J', 'M', 'S'];

function extractCategories(name) {
    if (!name) return [];
    const found = new Set();
    AGE_KEYS_SORTED.forEach((key) => {
        // Match abbreviation surrounded by non-word characters or string boundaries
        const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(`(?:^|[^\\wŁłÓóĄąĘęŚśŹźŻżĆćŃń])${escaped}(?:$|[^\\wŁłÓóĄąĘęŚśŹźŻżĆćŃń])`, 'u');
        if (regex.test(name)) found.add(key);
    });
    return AGE_KEYS_SORTED.filter((k) => found.has(k));
}

// Normalise a value that may be a string, comma-separated string, or array → always returns an array
function toArray(value) {
    if (!value) return [];
    if (Array.isArray(value)) return value;
    return String(value).split(/[,;]+/).map((v) => v.trim()).filter(Boolean);
}

const Badge = ({ text, bg, color, title }) => (
    <span
        title={title}
        style={{
            display: 'inline-block',
            padding: '2px 8px',
            borderRadius: '12px',
            fontSize: '12px',
            fontWeight: '600',
            backgroundColor: bg,
            color: color,
            whiteSpace: 'nowrap',
            cursor: title ? 'help' : 'default',
        }}
    >
        {text}
    </span>
);

const FilterButton = ({ active, onClick, children, color }) => (
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

const BadgeCell = ({ items, fallback }) => (
    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
        {items.length > 0 ? items : <span style={{ color: '#bbb' }}>{fallback ?? '—'}</span>}
    </div>
);

export default function ClimbingCompetitions() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeFilter, setActiveFilter] = useState('all');

    useEffect(() => {
        fetch('/api/climbing-competitions')
            .then((res) => res.json())
            .then((json) => {
                setData(json);
                setLoading(false);
            })
            .catch((err) => {
                setError(err.message);
                setLoading(false);
            });
    }, []);

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
                ❌ Nie udało się pobrać danych: {error || 'Nieznany błąd'}
            </div>
        );
    }

    const filtered =
        activeFilter === 'all'
            ? data.competitions
            : data.competitions.filter((c) => toArray(c.type).includes(activeFilter));

    const filters = [
        { key: 'all',        label: '🗓 Wszystkie',   color: '#555' },
        { key: 'bouldering', ...TYPE_LABELS.bouldering },
        { key: 'lead',       ...TYPE_LABELS.lead },
        { key: 'speed',      ...TYPE_LABELS.speed },
    ];

    return (
        <div style={{ margin: '24px 0' }}>
            {/* Filtry */}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '20px' }}>
                {filters.map((f) => (
                    <FilterButton
                        key={f.key}
                        active={activeFilter === f.key}
                        onClick={() => setActiveFilter(f.key)}
                        color={f.color}
                    >
                        {f.label}
                    </FilterButton>
                ))}
            </div>

            {/* Tabela */}
            {filtered.length === 0 ? (
                <p style={{ color: '#888', fontStyle: 'italic' }}>
                    Brak zawodów dla wybranego filtra.
                </p>
            ) : (
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                        <thead>
                        <tr style={{ backgroundColor: 'var(--ifm-color-emphasis-100)' }}>
                            {['Data', 'Nazwa', 'Miejsce', 'Kategorie wiekowe', 'Rodzaj', 'Poziom', 'Link'].map((h) => (
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
                        {filtered.map((comp, i) => {
                            const types      = toArray(comp.type);
                            const levelInfo  = LEVEL_LABELS[comp.level] || { label: comp.level, bg: '#eee', color: '#555' };
                            const categories = extractCategories(comp.name);

                            return (
                                <tr
                                    key={i}
                                    style={{
                                        borderBottom: '1px solid var(--ifm-color-emphasis-200)',
                                        transition: 'background 0.15s',
                                    }}
                                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--ifm-color-emphasis-50)')}
                                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                                >
                                    <td style={{ padding: '10px 14px', whiteSpace: 'nowrap', fontWeight: '600' }}>
                                        {comp.date}
                                    </td>
                                    <td style={{ padding: '10px 14px' }}>{comp.name}</td>
                                    <td style={{ padding: '10px 14px' }}>{comp.location}</td>

                                    {/* Kategorie wiekowe */}
                                    <td style={{ padding: '10px 14px' }}>
                                        <BadgeCell
                                            items={categories.map((cat) => {
                                                const info = AGE_CATEGORIES[cat];
                                                return (
                                                    <Badge
                                                        key={cat}
                                                        text={info.label}
                                                        bg={info.bg}
                                                        color={info.color}
                                                        title={info.title}
                                                    />
                                                );
                                            })}
                                        />
                                    </td>

                                    {/* Rodzaj (może być wiele) */}
                                    <td style={{ padding: '10px 14px' }}>
                                        <BadgeCell
                                            items={types.map((t) => {
                                                const info = TYPE_LABELS[t] || { label: t, color: '#999' };
                                                return (
                                                    <Badge
                                                        key={t}
                                                        text={info.label}
                                                        bg={info.color + '22'}
                                                        color={info.color}
                                                    />
                                                );
                                            })}
                                        />
                                    </td>

                                    <td style={{ padding: '10px 14px' }}>
                                        <Badge text={levelInfo.label} bg={levelInfo.bg} color={levelInfo.color} />
                                    </td>
                                    <td style={{ padding: '10px 14px' }}>
                                        {comp.url ? (
                                            <a href={comp.url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--ifm-color-primary)' }}>
                                                🔗 Więcej
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

            {/* Stopka */}
            {data.updated_at && (
                <p style={{ marginTop: '12px', fontSize: '12px', color: '#aaa', textAlign: 'right' }}>
                    Dane pobrane: {data.updated_at}
                </p>
            )}
        </div>
    );
}