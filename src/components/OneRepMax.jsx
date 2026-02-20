import React, { useMemo, useState, useEffect } from 'react';

/* ── Pomocniczy komponent: pole liczby edytowalne jako string ── */
function NumericInput({ value, min, max, step, ariaLabel, onCommit, className }) {
    const [local, setLocal] = useState(String(value));

    useEffect(() => {
        setLocal(String(value));
    }, [value]);

    const handleChange = (e) => {
        setLocal(e.target.value);
    };

    const handleBlur = () => {
        const parsed = parseFloat(local);
        const clamped = Number.isFinite(parsed)
            ? Math.min(Math.max(parsed, min), max)
            : value;
        onCommit(clamped);
        setLocal(String(clamped));
    };

    return (
        <input
            type="number"
            inputMode="decimal"
            min={min}
            max={max}
            step={step}
            className={className}
            aria-label={ariaLabel}
            value={local}
            onChange={handleChange}
            onBlur={handleBlur}
        />
    );
}

/* ── Główny komponent ── */
export default function OneRepMax() {
    const [weight, setWeight] = useState(100);
    const [reps, setReps]     = useState(5);
    const [pct, setPct]       = useState(80);
    const [roundPlates, setRoundPlates] = useState(false);

    const round2      = (x) => Math.round(x * 100) / 100;
    const roundToPlate = (x) => Math.round(x / 2.5) * 2.5;

    /* Helper: styl inline z --fill dla suwaka (cross-browser Chrome) */
    const fillStyle = (val, min, max) => ({
        '--fill': `${((val - min) / (max - min)) * 100}%`,
    });

    /* ── Formuły 1RM ── */
    const epley    = (w, r) => w * (1 + r / 30);
    const brzycki  = (w, r) => (37 - r) <= 0 ? NaN : (w * 36) / (37 - r);
    const oconner  = (w, r) => w * (1 + 0.025 * r);
    const lander   = (w, r) => (101.3 - 2.67123 * r) === 0 ? NaN : (100 * w) / (101.3 - 2.67123 * r);
    const lombardi = (w, r) => w * Math.pow(r, 0.10);
    const wathan   = (w, r) => {
        const d = 48.8 + 53.8 * Math.exp(-0.075 * r);
        return d === 0 ? NaN : (100 * w) / d;
    };

    const formulaLinks = {
        epley:    'https://en.wikipedia.org/wiki/One-repetition_maximum#Estimation_formulas',
        brzycki:  'https://en.wikipedia.org/wiki/One-repetition_maximum#Estimation_formulas',
        oconner:  'https://en.wikipedia.org/wiki/One-repetition_maximum#Estimation_formulas',
        lander:   'https://en.wikipedia.org/wiki/One-repetition_maximum#Estimation_formulas',
        lombardi: 'https://en.wikipedia.org/wiki/One-repetition_maximum#Estimation_formulas',
        wathan:   'https://en.wikipedia.org/wiki/One-repetition_maximum#Estimation_formulas',
    };

    /* ── Obliczenia główne ── */
    const results = useMemo(() => {
        if (!(weight > 0) || !(reps >= 1 && reps <= 20)) return null;

        const perKg = {
            epley:    epley(weight, reps),
            brzycki:  brzycki(weight, reps),
            oconner:  oconner(weight, reps),
            lander:   lander(weight, reps),
            lombardi: lombardi(weight, reps),
            wathan:   wathan(weight, reps),
        };

        const vals   = Object.values(perKg).filter((v) => Number.isFinite(v));
        const avgKg  = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : NaN;

        const fmt = (kg) => {
            let v = round2(kg);
            if (roundPlates) v = roundToPlate(v);
            return round2(v);
        };

        return {
            perKg,
            perFormula: Object.fromEntries(
                Object.entries(perKg).map(([k, v]) => [k, Number.isFinite(v) ? fmt(v) : NaN])
            ),
            average: Number.isFinite(avgKg) ? fmt(avgKg) : NaN,
        };
    }, [weight, reps, roundPlates]);

    const estimateRepsAtWeight = (oneRM, w) => {
        if (!(oneRM > 0) || !(w > 0)) return NaN;
        return Math.max(1, Math.round(30 * (oneRM / w - 1)));
    };

    const percentRows = useMemo(() => {
        if (!results || !Number.isFinite(results.average)) return [];
        return [100, 95, 90, 85, 80, 75, 70, 65, 60].map((p) => {
            const rawW = results.average * (p / 100);
            const w    = roundPlates ? roundToPlate(rawW) : rawW;
            const wOut = round2(w);
            return { p, w: wOut, reps: estimateRepsAtWeight(results.average, w) };
        });
    }, [results, roundPlates]);

    const sliderWeight = useMemo(() => {
        if (!results || !Number.isFinite(results.average)) return NaN;
        const raw = results.average * (pct / 100);
        const v   = roundPlates ? roundToPlate(raw) : raw;
        return round2(v);
    }, [results, pct, roundPlates]);

    const isWeightInvalid = !(weight > 0);
    const isRepsInvalid   = !(reps >= 1 && reps <= 20);

    return (
        <div style={{
            border: '1px solid var(--ifm-color-emphasis-300)',
            borderRadius: 12,
            padding: 16,
            margin: '16px 0',
            background: 'var(--ifm-background-surface-color)',
        }}>
            <style>{`
        :root { --orm-primary: var(--ifm-color-success, #2e8540); }

        /* ── Suwak – cross-browser, bez Win10 clip-path hack ── */
        .orm-range {
          -webkit-appearance: none;
          appearance: none;
          width: min(520px, 100%);
          height: 6px;
          border-radius: 3px;
          cursor: pointer;
          outline: none;
          align-self: center;
          /* Wypełnienie przez gradient + CSS-zmienną --fill ustawianą inline */
          background: linear-gradient(
            to right,
            var(--orm-primary) 0%,
            var(--orm-primary) var(--fill, 0%),
            color-mix(in srgb, currentColor 20%, transparent) var(--fill, 0%),
            color-mix(in srgb, currentColor 20%, transparent) 100%
          );
        }
        /* Kciuk – WebKit (Chrome / Edge / Safari) */
        .orm-range::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 18px; height: 18px;
          border-radius: 50%;
          background: var(--orm-primary);
          box-shadow: 0 1px 4px rgba(0,0,0,.30);
          transition: transform .1s ease, box-shadow .1s ease;
        }
        .orm-range::-webkit-slider-thumb:hover {
          transform: scale(1.15);
          box-shadow: 0 2px 8px rgba(0,0,0,.35);
        }
        /* Kciuk – Firefox */
        .orm-range::-moz-range-thumb {
          width: 18px; height: 18px;
          border: none; border-radius: 50%;
          background: var(--orm-primary);
          box-shadow: 0 1px 4px rgba(0,0,0,.30);
          cursor: pointer;
        }
        .orm-range::-moz-range-track {
          height: 6px; border-radius: 3px;
          background: color-mix(in srgb, currentColor 20%, transparent);
        }
        .orm-range::-moz-range-progress {
          height: 6px; border-radius: 3px;
          background: var(--orm-primary);
        }

        /* ── Przełącznik ── */
        .orm-switch { position: relative; display: inline-block; width: 48px; height: 28px; }
        .orm-switch input { opacity: 0; width: 0; height: 0; }
        .orm-slider {
          position: absolute; inset: 0; cursor: pointer;
          background: var(--ifm-color-emphasis-200);
          border-radius: 999px; transition: background .2s ease;
        }
        .orm-slider::before {
          content: ""; position: absolute;
          height: 22px; width: 22px; left: 3px; top: 3px;
          background: #fff; border-radius: 50%;
          transition: transform .2s ease, box-shadow .2s ease;
          box-shadow: 0 1px 3px rgba(0,0,0,.25);
        }
        .orm-switch input:checked + .orm-slider { background: var(--orm-primary); }
        .orm-switch input:checked + .orm-slider::before { transform: translateX(20px); }
        .orm-switch-label { margin-left: 10px; user-select: none; }

        /* ── Układ wiersza ── */
        .orm-row { display: flex; gap: 12px; align-items: center; flex-wrap: wrap; }
        .orm-spacer { flex: 1 1 auto; }

        /* ── Pole liczby z opcjonalnym sufiksem ── */
        .orm-input-suffix { position: relative; display: inline-block; }
        .orm-number {
          width: 120px; min-width: 100px;
          padding: 8px 10px;
          border-radius: 8px;
          border: 1px solid var(--ifm-color-emphasis-300);
          background: var(--ifm-background-color);
        }
        .orm-number:focus {
          outline: 2px solid color-mix(in srgb, var(--orm-primary) 35%, transparent);
        }
        /* Ukryj spinners w Chrome/Edge/Safari */
        .orm-number::-webkit-inner-spin-button,
        .orm-number::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
        /* Ukryj spinners w Firefox */
        .orm-number[type=number] { -moz-appearance: textfield; }
        .orm-suffix {
          position: absolute; right: 8px; top: 50%; transform: translateY(-50%);
          color: var(--ifm-font-color-secondary);
          pointer-events: none; font-weight: 600;
        }
        label.orm-label { display: block; font-weight: 600; }
      `}</style>

            <h3 style={{marginTop: 0}}>Kalkulator 1RM (One‑Rep Max)</h3>

            {/* ── Ciężar ── */}
            <div style={{marginBottom: 14}}>
                <label htmlFor="orm-weight" className="orm-label">
                    Ciężar: <span>{weight} kg</span>
                </label>
                <div className="orm-row">
                    <input
                        id="orm-weight"
                        className="orm-range"
                        type="range"
                        min={1} max={300} step={0.5}
                        value={weight}
                        style={fillStyle(weight, 1, 300)}
                        onChange={(e) => setWeight(Number(e.target.value))}
                    />
                    <div className="orm-spacer" />
                    <div className="orm-input-suffix">
                        <NumericInput
                            value={weight}
                            min={1} max={300} step={0.5}
                            ariaLabel="Ciężar (kg)"
                            className="orm-number"
                            onCommit={setWeight}
                        />
                        <span className="orm-suffix">kg</span>
                    </div>
                </div>
                {isWeightInvalid && (
                    <div style={{color: 'var(--ifm-color-danger)'}}>Podaj dodatni ciężar.</div>
                )}
            </div>

            {/* ── Powtórzenia ── */}
            <div style={{marginBottom: 14}}>
                <label htmlFor="orm-reps" className="orm-label">
                    Powtórzenia: <span>{reps}</span>
                </label>
                <div className="orm-row">
                    <input
                        id="orm-reps"
                        className="orm-range"
                        type="range"
                        min={1} max={20} step={1}
                        value={reps}
                        style={fillStyle(reps, 1, 20)}
                        onChange={(e) => setReps(Number(e.target.value))}
                    />
                    <div className="orm-spacer" />
                    <NumericInput
                        value={reps}
                        min={1} max={20} step={1}
                        ariaLabel="Powtórzenia"
                        className="orm-number"
                        onCommit={(v) => setReps(Math.round(v))}
                    />
                </div>
                {isRepsInvalid && (
                    <div style={{color: 'var(--ifm-color-danger)'}}>Zakres 1–20 powtórzeń.</div>
                )}
            </div>

            {/* ── Przełącznik: zaokrąglanie do talerzy ── */}
            <div style={{display: 'flex', alignItems: 'center', gap: 12, margin: '6px 0 12px'}}>
                <label className="orm-switch">
                    <input
                        type="checkbox"
                        checked={roundPlates}
                        onChange={(e) => setRoundPlates(e.target.checked)}
                        aria-label="Zaokrąglij do talerzy"
                    />
                    <span className="orm-slider"></span>
                </label>
                <span className="orm-switch-label">Zaokrąglij do talerzy (2,5 kg)</span>
            </div>

            <hr style={{margin: '16px 0'}} />

            {/* ── Suwak %1RM ── */}
            <div style={{marginBottom: 12}}>
                <label htmlFor="orm-pct" className="orm-label">
                    Wybrany poziom: <strong>{pct}% 1RM</strong>
                </label>
                <div className="orm-row">
                    <input
                        id="orm-pct"
                        className="orm-range"
                        type="range"
                        min={50} max={100} step={1}
                        value={pct}
                        style={fillStyle(pct, 50, 100)}
                        onChange={(e) => setPct(Number(e.target.value))}
                    />
                    <div className="orm-spacer" />
                    <NumericInput
                        value={pct}
                        min={50} max={100} step={1}
                        ariaLabel="Procent 1RM"
                        className="orm-number"
                        onCommit={(v) => setPct(Math.round(v))}
                    />
                </div>
                <div style={{marginTop: 8, fontWeight: 700, fontSize: 18}}>
                    Ciężar dla {pct}% 1RM:{' '}
                    {Number.isFinite(sliderWeight) ? `${sliderWeight} kg` : '—'}
                </div>
                <div style={{fontSize: 13, opacity: .85, marginTop: 4}}>
                    Porada: 60–80% 1RM zwykle na objętość; 85–95% 1RM pod maksymalną siłę.
                </div>
            </div>

            {/* ── Wyniki ── */}
            {!results && <p>Ustaw ciężar i powtórzenia, aby zobaczyć szacunek 1RM.</p>}

            {results && (
                <>
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
                        gap: 12,
                    }}>
                        <Card label={<LinkLabel href={formulaLinks.epley}    text="Epley"    />} value={results.perFormula.epley}    unit="kg" />
                        <Card label={<LinkLabel href={formulaLinks.brzycki}  text="Brzycki"  />} value={results.perFormula.brzycki}  unit="kg" />
                        <Card label={<LinkLabel href={formulaLinks.oconner}  text="O'Conner" />} value={results.perFormula.oconner}  unit="kg" />
                        <Card label={<LinkLabel href={formulaLinks.lander}   text="Lander"   />} value={results.perFormula.lander}   unit="kg" />
                        <Card label={<LinkLabel href={formulaLinks.lombardi} text="Lombardi" />} value={results.perFormula.lombardi} unit="kg" />
                        <Card label={<LinkLabel href={formulaLinks.wathan}   text="Wathan"   />} value={results.perFormula.wathan}   unit="kg" />
                    </div>

                    <div style={{
                        marginTop: 12, padding: 12,
                        background: 'var(--ifm-color-emphasis-100)',
                        borderRadius: 8,
                    }}>
                        <strong>Średnia (z kilku formuł):</strong> {results.average} kg
                    </div>

                    {percentRows.length > 0 && (
                        <div style={{marginTop: 16}}>
                            <h4>Proponowane ciężary na podstawie %1RM</h4>
                            <div style={{overflowX: 'auto'}}>
                                <table className="table">
                                    <thead>
                                    <tr>
                                        <th>% 1RM</th>
                                        <th>Ciężar (kg)</th>
                                        <th>Szac. max powt.</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {percentRows.map((row) => (
                                        <tr key={row.p}>
                                            <td>{row.p}%</td>
                                            <td>{row.w} kg</td>
                                            <td>{Number.isFinite(row.reps) ? row.reps : '—'}</td>
                                        </tr>
                                    ))}
                                    </tbody>
                                </table>
                            </div>
                            <p style={{fontSize: 13, opacity: .85, marginTop: 8}}>
                                Liczba powtórzeń szacowana wg odwróconego wzoru Epleya; traktuj jako punkt wyjścia.
                            </p>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

/* ── Elementy UI ── */
function LinkLabel({ href, text }) {
    if (!href || href === '#') return <>{text}</>;
    return (
        <a href={href} target="_blank" rel="noopener noreferrer" style={{textDecoration: 'none'}}>
            {text} <span aria-hidden style={{opacity: .7}}>↗</span>
        </a>
    );
}

function Card({ label, value, unit }) {
    const bad = !Number.isFinite(value);
    return (
        <div style={{
            border: '1px solid var(--ifm-color-emphasis-300)',
            borderRadius: 8, padding: 10,
            background: 'var(--ifm-background-color)',
        }}>
            <div style={{fontSize: 13, opacity: 0.8}}>{label}</div>
            <div style={{fontWeight: 700, fontSize: 18}}>
                {bad ? '—' : `${value} ${unit}`}
            </div>
        </div>
    );
}