import { useState, useEffect, useRef } from 'react';

const TYPE_LABELS = {
    bouldering: { label: '🪨 Bouldering', color: '#e67e22' },
    lead:       { label: '🧗 Prowadzenie', color: '#2e86c1' },
    speed:      { label: '⚡ Szybkość',    color: '#27ae60' },
};

const LEVEL_LABELS = {
    lokalny:        { label: 'Lokalny',       bg: '#f0f0f0', color: '#555' },
    regionalny:     { label: 'Regionalny',     bg: '#dbeafe', color: '#1d4ed8' },
    ogólnopolski:   { label: 'Ogólnopolski',   bg: '#dcfce7', color: '#166534' },
    międzynarodowy: { label: 'Międzynarodowy', bg: '#fef9c3', color: '#854d0e' },
};

const AGE_CATEGORIES = {
    DM: { label: 'DM', tooltip: 'Dziecko młodsze (≥2016)',   bg: '#fce4ec', color: '#c2185b' },
    D:  { label: 'D',  tooltip: 'Dziecko (2014–2015)',        bg: '#f3e5f5', color: '#7b1fa2' },
    Mł: { label: 'Mł', tooltip: 'Młodzik (2012–2013)',        bg: '#e8eaf6', color: '#303f9f' },
    JM: { label: 'JM', tooltip: 'Junior młodszy (2010–2011)', bg: '#e3f2fd', color: '#1565c0' },
    J:  { label: 'J',  tooltip: 'Junior (2008–2009)',         bg: '#e0f7fa', color: '#00695c' },
    M:  { label: 'M',  tooltip: 'Młodzieżowiec (2006–2007)',  bg: '#e8f5e9', color: '#2e7d32' },
    S:  { label: 'S',  tooltip: 'Senior (≤2005)',             bg: '#fff8e1', color: '#e65100' },
};

// Ordered longest-first so two-letter codes match before single-letter ones
const AGE_KEYS = ['DM', 'JM', 'Mł', 'D', 'J', 'M', 'S'];

// Patterns like "SiM", "DiMł", "JiS" → expand to individual tokens separated by space
function expandJoined(name) {
    if (!name) return name;
    // Build alternation: longest keys first
    const alt = AGE_KEYS.map((k) => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
    const joinedRe = new RegExp(`(${alt})i(${alt})`, 'gu');
    return name.replace(joinedRe, '$1 $2');
}

function extractCategories(name) {
    if (!name) return [];
    const expanded = expandJoined(name);
    const found = new Set();
    AGE_KEYS.forEach((key) => {
        const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        // Must be surrounded by non-word / non-Polish-letter chars or string boundaries
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

// ── Custom tooltip ────────────────────────────────────────────────────────────

function Tooltip({ text, children }) {
    const [visible, setVisible] = useState(false);
    const [pos, setPos] = useState({ top: 0, left: 0 });
    const ref = useRef(null);

    const show = () => {
        if (!ref.current) return;
        const rect = ref.current.getBoundingClientRect();
        setPos({
            top: rect.top + window.scrollY - 8,
            left: rect.left + window.scrollX + rect.width / 2,
        });
        setVisible(true);
    };

    return (
        <>
            <span
                ref={ref}
                onMouseEnter={show}
                onMouseLeave={() => setVisible(false)}
                style={{ display: 'inline-block' }}
            >
                {children}
            </span>
            {visible && (
                <span
                    style={{
                        position: 'absolute',
                        top: pos.top,
                        left: pos.left,
                        transform: 'translate(-50%, -100%)',
                        backgroundColor: '#1e1e1e',
                        color: '#fff',
                        padding: '4px 10px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: '500',
                        whiteSpace: 'nowrap',
                        pointerEvents: 'none',
                        zIndex: 9999,
                        boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
                    }}
                >
                    {text}
                    <span
                        style={{
                            position: 'absolute',
                            bottom: '-5px',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            width: 0,
                            height: 0,
                            borderLeft: '5px solid transparent',
                            borderRight: '5px solid transparent',
                            borderTop: '5px solid #1e1e1e',
                        }}
                    />
                </span>
            )}
        </>
    );
}

// ── Badges ────────────────────────────────────────────────────────────────────

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

function AgeBadge({ cat }) {
    const info = AGE_CATEGORIES[cat];
    return (
        <Tooltip text={info.tooltip}>
            <Badge text={info.label} bg={info.bg} color={info.color} />
        </Tooltip>
    );
}

function BadgeCell({ items }) {
    return (
        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
            {items.length > 0 ? items : <span style={{ color: '#bbb' }}>—</span>}
        </div>
    );
}

// ── Filter button ─────────────────────────────────────────────────────────────

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

// ── Main component ────────────────────────────────────────────────────────────

export default function ClimbingCompetitions() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [typeFilter, setTypeFilter] = useState('all');
    const [ageFilter, setAgeFilter] = useState('all');

    useEffect(() => {
        fetch('/api/climbing-competitions')
            .then((res) => res.json())
            .then((json) => { setData(json); setLoading(false); })
            .catch((err) => { setError(err.message); setLoading(false); });
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

    const filtered = data.competitions.filter((c) => {
        const matchType = typeFilter === 'all' || toArray(c.type).includes(typeFilter);
        const matchAge  = ageFilter === 'all'  || extractCategories(c.name).includes(ageFilter);
        return matchType && matchAge;
    });

    const typeFilters = [
        { key: 'all',        label: '🗓 Wszystkie',   color: '#555' },
        { key: 'bouldering', ...TYPE_LABELS.bouldering },
        { key: 'lead',       ...TYPE_LABELS.lead },
        { key: 'speed',      ...TYPE_LABELS.speed },
    ];

    const ageFilters = [
        { key: 'all', label: 'Wszystkie',         color: '#555' },
        ...AGE_KEYS.map((k) => ({
            key: k,
            label: AGE_CATEGORIES[k].label,
            color: AGE_CATEGORIES[k].color,
        })),
    ];

    const filterGroupStyle = {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        flexWrap: 'wrap',
        marginBottom: '10px',
    };

    const filterLabelStyle = {
        fontSize: '12px',
        fontWeight: '700',
        color: '#888',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        minWidth: '120px',
    };

    return (
        <div style={{ margin: '24px 0', position: 'relative' }}>

            {/* Filtry – Rodzaj */}
            <div style={filterGroupStyle}>
                <span style={filterLabelStyle}>Rodzaj</span>
                {typeFilters.map((f) => (
                    <FilterButton
                        key={f.key}
                        active={typeFilter === f.key}
                        onClick={() => setTypeFilter(f.key)}
                        color={f.color}
                    >
                        {f.label}
                    </FilterButton>
                ))}
            </div>

            {/* Filtry – Kategoria wiekowa */}
            <div style={{ ...filterGroupStyle, marginBottom: '20px' }}>
                <span style={filterLabelStyle}>Kategoria</span>
                {ageFilters.map((f) => (
                    <FilterButton
                        key={f.key}
                        active={ageFilter === f.key}
                        onClick={() => setAgeFilter(f.key)}
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
                                            items={categories.map((cat) => (
                                                <AgeBadge key={cat} cat={cat} />
                                            ))}
                                        />
                                    </td>

                                    {/* Rodzaj */}
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