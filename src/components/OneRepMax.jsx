import React, { useMemo, useState } from 'react';

export default function OneRepMax() {
    // Stan wejść
    const [weight, setWeight] = useState(100); // kg
    const [reps, setReps] = useState(5);      // powtórzenia
    const [pct, setPct] = useState(80);       // %1RM
    const [roundPlates, setRoundPlates] = useState(false);

    // Pomocnicze
    const round2 = (x) => Math.round(x * 100) / 100;
    const clamp = (v, min, max) => Math.min(Math.max(v, min), max);
    const roundToPlate = (x) => Math.round(x / 2.5) * 2.5; // tylko kg

    // Formuły 1RM (liczymy w kg)
    const epley    = (w, r) => w * (1 + r / 30);
    const brzycki  = (w, r) => (37 - r) <= 0 ? NaN : (w * 36) / (37 - r);
    const oconner  = (w, r) => w * (1 + 0.025 * r);
    const lander   = (w, r) => (101.3 - 2.67123 * r) === 0 ? NaN : (100 * w) / (101.3 - 2.67123 * r);
    const lombardi = (w, r) => w * Math.pow(r, 0.10);
    const wathan   = (w, r) => {
        const denom = 48.8 + 53.8 * Math.exp(-0.075 * r);
        return denom === 0 ? NaN : (100 * w) / denom;
    };

    // Linki (zewnętrzne) do metod – wszystkie na sekcję "Estimation formulas"
    const formulaLinks = {
        epley:   'https://en.wikipedia.org/wiki/One-repetition_maximum#Estimation_formulas',
        brzycki: 'https://en.wikipedia.org/wiki/One-repetition_maximum#Estimation_formulas',
        oconner: 'https://en.wikipedia.org/wiki/One-repetition_maximum#Estimation_formulas',
        lander:  'https://en.wikipedia.org/wiki/One-repetition_maximum#Estimation_formulas',
        lombardi:'https://en.wikipedia.org/wiki/One-repetition_maximum#Estimation_formulas',
        wathan:  'https://en.wikipedia.org/wiki/One-repetition_maximum#Estimation_formulas',
    };

    // Obliczenia główne
    const results = useMemo(() => {
        if (!(weight > 0) || !(reps >= 1 && reps <= 20)) return null;

        const perKg = {
            epley: epley(weight, reps),
            brzycki: brzycki(weight, reps),
            oconner: oconner(weight, reps),
            lander: lander(weight, reps),
            lombardi: lombardi(weight, reps),
            wathan: wathan(weight, reps),
        };

        const vals = Object.values(perKg).filter((v) => Number.isFinite(v));
        const avgKg = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : NaN;

        const formatOut = (kg) => {
            let v = round2(kg);
            if (roundPlates) v = roundToPlate(v);
            return round2(v);
        };

        return {
            perKg,
            perFormula: Object.fromEntries(
                Object.entries(perKg).map(([k, v]) => [k, Number.isFinite(v) ? formatOut(v) : NaN])
            ),
            average: Number.isFinite(avgKg) ? formatOut(avgKg) : NaN,
        };
    }, [weight, reps, roundPlates]);

    // Odwrotny Epley: r ≈ 30 * (1RM / w - 1); min. 1 powtórzenie.
    const estimateRepsAtWeight = (oneRM, w) => {
        if (!(oneRM > 0) || !(w > 0)) return NaN;
        const r = 30 * (oneRM / w - 1);
        return Math.max(1, Math.round(r));
    };

    // Tabela %1RM — z 100% oraz kolumną szac. powtórzeń
    const percentRows = useMemo(() => {
        if (!results || !Number.isFinite(results.average)) return [];
        const pcts = [100, 95, 90, 85, 80, 75, 70, 65, 60];
        return pcts.map((p) => {
            const rawW = results.average * (p / 100);
            const w = roundPlates ? roundToPlate(rawW) : rawW;
            const wOut = round2(w);
            const rEst = estimateRepsAtWeight(results.average, w);
            return { p, w: wOut, reps: rEst };
        });
    }, [results, roundPlates]);

    // Suwak %1RM – aktualny ciężar
    const sliderWeight = useMemo(() => {
        if (!results || !Number.isFinite(results.average)) return NaN;
        const raw = results.average * (pct / 100);
        const v = roundPlates ? roundToPlate(raw) : raw;
        return round2(v);
    }, [results, pct, roundPlates]);

    const isWeightInvalid = !(weight > 0);
    const isRepsInvalid = !(reps >= 1 && reps <= 20);

    return (
        <div style={{
            border: '1px solid var(--ifm-color-emphasis-300)',
            borderRadius: 12,
            padding: 16,
            margin: '16px 0',
            background: 'var(--ifm-background-surface-color)'
        }}>
            {/* === STYLE (suwaki + przełącznik + pola z sufiksem "kg") === */}
            <style>{`
        :root { --orm-primary: var(--ifm-color-success, #2e8540); }

        /* Slider – wariant "win10-thumb" (ShadowShahriar), kolor zielony */
        .orm-range {
          font-size: 1rem;
          width: min(520px, 100%);
          color: var(--orm-primary);
          --thumb-height: 1.375em;
          --thumb-width: 0.5em;
          --track-height: 0.125em;
          --track-color: rgba(0,0,0,.2);
          --brightness-hover: 180%;
          --brightness-down: 80%;
          --clip-edges: 0.0125em;
          position: relative; background: transparent; overflow: hidden;
        }
        .orm-range, .orm-range::-webkit-slider-runnable-track, .orm-range::-webkit-slider-thumb {
          -webkit-appearance: none; transition: all ease 100ms; height: var(--thumb-height);
        }
        .orm-range::-webkit-slider-thumb {
          --thumb-radius: calc((var(--thumb-height) * 0.5) - 1px);
          --clip-top: calc((var(--thumb-height) - var(--track-height)) * 0.5 - 0.5px);
          --clip-bottom: calc(var(--thumb-height) - var(--clip-top));
          --clip-further: calc(100% + 1px);
          --box-fill: calc(-100vmax - var(--thumb-width, var(--thumb-height))) 0 0 100vmax currentColor;
          width: var(--thumb-width, var(--thumb-height));
          background: linear-gradient(currentColor 0 0) scroll no-repeat left center / 50% var(--track-height);
          border-radius: var(--thumb-radius);
          box-shadow: var(--box-fill), 0 0 0 1px rgba(0,0,0,.1);
          clip-path: polygon(100% -1px, var(--clip-edges) -1px, 0 var(--clip-top),
            -100vmax var(--clip-top), -100vmax var(--clip-bottom), 0 var(--clip-bottom),
            var(--clip-edges) 100%, var(--clip-further) 100%);
        }
        .orm-range::-webkit-slider-runnable-track {
          background: linear-gradient(var(--track-color) 0 0) center / 100% var(--track-height) no-repeat;
          border-radius: 999px;
        }
        .orm-range::-moz-range-thumb {
          width: var(--thumb-width, var(--thumb-height)); height: var(--thumb-height);
          background: currentColor; border: none; border-radius: calc((var(--thumb-height) * 0.5) - 1px);
        }
        .orm-range::-moz-range-track { height: var(--track-height); background: var(--track-color); border-radius: 999px; }
        .orm-range::-moz-range-progress { height: var(--track-height); background: currentColor; border-radius: 999px; }

        /* Przełącznik (estetyczny) */
        .orm-switch { position: relative; display: inline-block; width: 48px; height: 28px; }
        .orm-switch input { opacity: 0; width: 0; height: 0; }
        .orm-slider { position: absolute; inset: 0; cursor: pointer; background: var(--ifm-color-emphasis-200);
          border-radius: 999px; transition: background .2s ease; }
        .orm-slider::before { content: ""; position: absolute; height: 22px; width: 22px; left: 3px; top: 3px;
          background: #fff; border-radius: 50%; transition: transform .2s ease, box-shadow .2s ease;
          box-shadow: 0 1px 3px rgba(0,0,0,.25); }
        .orm-switch input:checked + .orm-slider { background: var(--orm-primary); }
        .orm-switch input:checked + .orm-slider::before { transform: translateX(20px); }
        .orm-switch-label { margin-left: 10px; user-select: none; }

        /* Układ: suwak + pole liczby po prawej */
        .orm-row { display: flex; gap: 12px; align-items: center; flex-wrap: wrap; }
        .orm-spacer { flex: 1 1 auto; }

        /* Kontener z sufiksem w polu (np. "kg") */
        .orm-input-suffix { position: relative; display: inline-block; }
        .orm-number {
          width: 120px; min-width: 100px;
          padding: 8px 10px 8px 10px; /* miejsce na sufiks po prawej */
          border-radius: 8px;
          border: 1px solid var(--ifm-color-emphasis-300);
          background: var(--ifm-background-color);
        }
        .orm-number:focus { outline: 2px solid color-mix(in srgb, var(--orm-primary) 35%, transparent); }
        .orm-suffix {
          position: absolute;
          right: 8px; top: 50%; transform: translateY(-50%);
          color: var(--ifm-font-color-secondary);
          pointer-events: none;
          font-weight: 600;
        }
        label.orm-label { display: block; font-weight: 600; }
      `}</style>

            <h3 style={{marginTop: 0}}>Kalkulator 1RM (One‑Rep Max)</h3>

            {/* SUWAK: Ciężar (kg)  — min 1 kg + pole liczby z sufiksem "kg" wewnątrz okna */}
            <div style={{marginBottom: 14}}>
                <label htmlFor="orm-weight" className="orm-label">
                    Ciężar: <span>{weight} kg</span>
                </label>
                <div className="orm-row">
                    <input
                        id="orm-weight"
                        className="orm-range win10-thumb"
                        type="range"
                        min={1}
                        max={300}
                        step={0.5}
                        value={weight}
                        onChange={(e) => setWeight(Number(e.target.value))}
                    />
                    <div className="orm-spacer" />
                    <div className="orm-input-suffix">
                        <input
                            type="number"
                            inputMode="decimal"
                            min={1}
                            max={300}
                            step={0.5}
                            className="orm-number"
                            aria-label="Ciężar (kg)"
                            value={weight}
                            onChange={(e) => setWeight(Number(e.target.value))}
                            onBlur={(e) => setWeight(clamp(Number(e.target.value) || 1, 1, 300))}
                        />
                        <span className="orm-suffix"></span>
                    </div>
                </div>
                {isWeightInvalid && <div style={{color: 'var(--ifm-color-danger)'}}>Podaj dodatni ciężar.</div>}
            </div>

            {/* SUWAK: Powtórzenia — pole liczby po prawej (bez sufiksu) */}
            <div style={{marginBottom: 14}}>
                <label htmlFor="orm-reps" className="orm-label">
                    Powtórzenia: <span>{reps}</span>
                </label>
                <div className="orm-row">
                    <input
                        id="orm-reps"
                        className="orm-range win10-thumb"
                        type="range"
                        min={1}
                        max={20}
                        step={1}
                        value={reps}
                        onChange={(e) => setReps(Number(e.target.value))}
                    />
                    <div className="orm-spacer" />
                    <input
                        type="number"
                        min={1}
                        max={20}
                        step={1}
                        className="orm-number"
                        aria-label="Powtórzenia"
                        value={reps}
                        onChange={(e) => setReps(Number(e.target.value))}
                        onBlur={(e) => setReps(clamp(Math.round(Number(e.target.value) || 1), 1, 20))}
                    />
                </div>
                {isRepsInvalid && <div style={{color: 'var(--ifm-color-danger)'}}>Zakres 1–20 powtórzeń.</div>}
            </div>

            {/* Przełącznik: zaokrąglanie do talerzy (estetyczny) */}
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

            {/* SUWAK: %1RM — pole liczby po prawej (bez sufiksu w polu) */}
            <div style={{marginBottom: 12}}>
                <label htmlFor="orm-pct" className="orm-label">
                    Wybrany poziom: <strong>{pct}% 1RM</strong>
                </label>
                <div className="orm-row">
                    <input
                        id="orm-pct"
                        className="orm-range win10-thumb"
                        type="range"
                        min={50}
                        max={100}
                        step={1}
                        value={pct}
                        onChange={(e) => setPct(Number(e.target.value))}
                    />
                    <div className="orm-spacer" />
                    <input
                        type="number"
                        min={50}
                        max={100}
                        step={1}
                        className="orm-number"
                        aria-label="Procent 1RM"
                        value={pct}
                        onChange={(e) => setPct(Number(e.target.value))}
                        onBlur={(e) => setPct(clamp(Math.round(Number(e.target.value) || 50), 50, 100))}
                    />
                </div>

                <div style={{marginTop: 8, fontWeight: 700, fontSize: 18}}>
                    Ciężar dla {pct}% 1RM: {Number.isFinite(sliderWeight) ? `${sliderWeight} kg` : '—'}
                </div>
                <div style={{fontSize: 13, opacity: .85, marginTop: 4}}>
                    Porada: 60–80% 1RM zwykle na objętość; 85–95% 1RM pod maksymalną siłę.
                </div>
            </div>

            {/* Wyniki */}
            {!results && <p>Ustaw ciężar i powtórzenia, aby zobaczyć szacunek 1RM.</p>}

            {results && (
                <>
                    <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 12}}>
                        <Card label={<LinkLabel href={formulaLinks.epley}   text="Epley"    />} value={results.perFormula.epley}   unit="kg" />
                        <Card label={<LinkLabel href={formulaLinks.brzycki} text="Brzycki"  />} value={results.perFormula.brzycki} unit="kg" />
                        <Card label={<LinkLabel href={formulaLinks.oconner} text="O’Conner" />} value={results.perFormula.oconner} unit="kg" />
                        <Card label={<LinkLabel href={formulaLinks.lander}  text="Lander"   />} value={results.perFormula.lander}  unit="kg" />
                        <Card label={<LinkLabel href={formulaLinks.lombardi} text="Lombardi" />} value={results.perFormula.lombardi} unit="kg" />
                        <Card label={<LinkLabel href={formulaLinks.wathan}  text="Wathan"   />} value={results.perFormula.wathan}  unit="kg" />
                    </div>

                    <div style={{marginTop: 12, padding: 12, background: 'var(--ifm-color-emphasis-100)', borderRadius: 8}}>
                        <strong>Średnia (z kilku formuł):</strong> {results.average} kg
                    </div>

                    {/* Tabela %1RM – z kolumną "Szac. max powt." i wierszem 100% */}
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

/* --- Dodatkowe elementy UI --- */
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
            borderRadius: 8,
            padding: 10,
            background: 'var(--ifm-background-color)'
        }}>
            <div style={{fontSize: 13, opacity: 0.8}}>{label}</div>
            <div style={{fontWeight: 700, fontSize: 18}}>
                {bad ? '—' : `${value} ${unit}`}
            </div>
        </div>
    );
}