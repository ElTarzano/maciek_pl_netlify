import { useState, useEffect } from 'react';

const TYPE_LABELS = {
    bouldering: { label: '🪨 Bouldering', color: '#e67e22' },
    lead: { label: '🧗 Prowadzenie', color: '#2e86c1' },
    speed: { label: '⚡ Szybkość', color: '#27ae60' },
    combined: { label: '🏆 Wielobój', color: '#8e44ad' },
};

const LEVEL_LABELS = {
    lokalny: { label: 'Lokalny', bg: '#f0f0f0', color: '#555' },
    regionalny: { label: 'Regionalny', bg: '#dbeafe', color: '#1d4ed8' },
    ogólnopolski: { label: 'Ogólnopolski', bg: '#dcfce7', color: '#166534' },
    międzynarodowy: { label: 'Międzynarodowy', bg: '#fef9c3', color: '#854d0e' },
};

const Badge = ({ text, bg, color }) => (
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

const FilterButton = ({ active, onClick, children, color }) => (
    <button
        onClick={onClick}
        style={{
            padding: '6px 14px',
            borderRadius: '20px',
            border: `2px solid ${active ? color : '#ddd'}`,
            backgroundColor: active ? color : 'transparent',
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
            : data.competitions.filter((c) => c.type === activeFilter);

    const filters = [
        { key: 'all', label: '🗓 Wszystkie', color: '#555' },
        { key: 'bouldering', ...TYPE_LABELS.bouldering },
        { key: 'lead', ...TYPE_LABELS.lead },
        { key: 'speed', ...TYPE_LABELS.speed },
        { key: 'combined', ...TYPE_LABELS.combined },
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
                            {['Data', 'Nazwa', 'Miejsce', 'Rodzaj', 'Poziom', 'Link'].map((h) => (
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
                            const typeInfo = TYPE_LABELS[comp.type] || { label: comp.type, color: '#999' };
                            const levelInfo = LEVEL_LABELS[comp.level] || { label: comp.level, bg: '#eee', color: '#555' };
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
                                    <td style={{ padding: '10px 14px' }}>
                                        <Badge text={typeInfo.label} bg={typeInfo.color + '22'} color={typeInfo.color} />
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