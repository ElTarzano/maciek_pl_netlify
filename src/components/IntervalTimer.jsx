import React, {
    useState,
    useEffect,
    useRef,
    useCallback,
    useMemo,
} from "react";

// ─── Sound generation via Web Audio API ───────────────────────────────────────
const SOUNDS = {
    beep: (ctx) => {
        const o = ctx.createOscillator(); const g = ctx.createGain();
        o.connect(g); g.connect(ctx.destination);
        o.frequency.value = 880; o.type = "sine";
        g.gain.setValueAtTime(0.3, ctx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
        o.start(ctx.currentTime); o.stop(ctx.currentTime + 0.3);
    },
    ding: (ctx) => {
        const o = ctx.createOscillator(); const g = ctx.createGain();
        o.connect(g); g.connect(ctx.destination);
        o.frequency.value = 1200; o.type = "triangle";
        g.gain.setValueAtTime(0.4, ctx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
        o.start(ctx.currentTime); o.stop(ctx.currentTime + 0.6);
    },
    whistle: (ctx) => {
        const o = ctx.createOscillator(); const g = ctx.createGain();
        o.connect(g); g.connect(ctx.destination);
        o.frequency.setValueAtTime(600, ctx.currentTime);
        o.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.1);
        o.type = "sine";
        g.gain.setValueAtTime(0.4, ctx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
        o.start(ctx.currentTime); o.stop(ctx.currentTime + 0.4);
    },
    horn: (ctx) => {
        [220, 330, 440].forEach((freq, i) => {
            const o = ctx.createOscillator(); const g = ctx.createGain();
            o.connect(g); g.connect(ctx.destination);
            o.frequency.value = freq; o.type = "sawtooth";
            g.gain.setValueAtTime(0.15, ctx.currentTime + i * 0.05);
            g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
            o.start(ctx.currentTime + i * 0.05); o.stop(ctx.currentTime + 0.5);
        });
    },
};

const defaultExercises = [
    { id: 1, name: "Burpees",           sets: 4, workTime: 40, restTime: 20, load: 0  },
    { id: 2, name: "Kettlebell Swings", sets: 3, workTime: 30, restTime: 30, load: 24 },
    { id: 3, name: "Push-ups",          sets: 3, workTime: 45, restTime: 15, load: 0  },
];

let nextId = 10;
const generateId = () => nextId++;

/** Format raw seconds (float) → { whole: "0:42", ms: "07" } */
function formatTime(rawSeconds) {
    const safe    = Math.max(0, rawSeconds);
    const totalSec = Math.floor(safe);
    const m  = Math.floor(totalSec / 60);
    const s  = totalSec % 60;
    const ms = Math.floor((safe % 1) * 100);
    return {
        whole: `${m}:${String(s).padStart(2, "0")}`,
        ms:    String(ms).padStart(2, "0"),
    };
}

// ─── Component ─────────────────────────────────────────────────────────────────
export default function IntervalTimer() {
    const [isDark, setIsDark] = useState(
        () => typeof document !== "undefined" && document.documentElement.getAttribute("data-theme") === "dark"
    );

    useEffect(() => {
        const update = () =>
            setIsDark(document.documentElement.getAttribute("data-theme") === "dark");
        update();
        const obs = new MutationObserver(update);
        obs.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
        return () => obs.disconnect();
    }, []);

    const [exercises,     setExercises]     = useState(defaultExercises);
    const [currentExIdx,  setCurrentExIdx]  = useState(0);
    const [currentSet,    setCurrentSet]    = useState(1);
    const [phase,         setPhase]         = useState("idle"); // idle|work|rest|done
    const [timeLeftRaw,   setTimeLeftRaw]   = useState(0);      // float seconds
    const [isRunning,     setIsRunning]     = useState(false);
    const [isFullscreen,  setIsFullscreen]  = useState(false);
    const [showSettings,  setShowSettings]  = useState(false);
    const [soundEnabled,  setSoundEnabled]  = useState(true);
    const [selectedSound, setSelectedSound] = useState("beep");
    const [showExList,    setShowExList]    = useState(false);
    const [editingEx,     setEditingEx]     = useState(null);

    const audioCtxRef       = useRef(null);
    const startTimestampRef = useRef(null); // { t: performance.now(), dur: number, rem: number }
    const animFrameRef      = useRef(null);
    const wakeLockRef       = useRef(null);
    const containerRef      = useRef(null);
    const touchStartRef     = useRef(null);

    // Live refs — avoid stale closures inside rAF callbacks
    const currentExIdxRef  = useRef(currentExIdx);
    const currentSetRef    = useRef(currentSet);
    const phaseRef         = useRef(phase);
    const exercisesRef     = useRef(exercises);
    const soundEnabledRef  = useRef(soundEnabled);
    const selectedSoundRef = useRef(selectedSound);

    useEffect(() => { currentExIdxRef.current  = currentExIdx;  }, [currentExIdx]);
    useEffect(() => { currentSetRef.current    = currentSet;    }, [currentSet]);
    useEffect(() => { phaseRef.current         = phase;         }, [phase]);
    useEffect(() => { exercisesRef.current     = exercises;     }, [exercises]);
    useEffect(() => { soundEnabledRef.current  = soundEnabled;  }, [soundEnabled]);
    useEffect(() => { selectedSoundRef.current = selectedSound; }, [selectedSound]);

    const currentEx = exercises[currentExIdx] || exercises[0];

    // ─── Progress bar ──────────────────────────────────────────────────────────
    const totalDuration = useMemo(() => {
        if (!currentEx) return 1;
        return phase === "work" ? currentEx.workTime : currentEx.restTime;
    }, [currentEx, phase]);

    const progress = (phase === "idle" || phase === "done")
        ? 0
        : totalDuration > 0 ? ((totalDuration - timeLeftRaw) / totalDuration) * 100 : 0;

    // ─── Audio ─────────────────────────────────────────────────────────────────
    const playSound = useCallback(() => {
        if (!soundEnabledRef.current) return;
        try {
            if (!audioCtxRef.current)
                audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
            SOUNDS[selectedSoundRef.current]?.(audioCtxRef.current);
        } catch (_) {}
    }, []);

    // ─── Wake Lock ─────────────────────────────────────────────────────────────
    const acquireWakeLock = useCallback(async () => {
        if ("wakeLock" in navigator) {
            try { wakeLockRef.current = await navigator.wakeLock.request("screen"); } catch (_) {}
        }
    }, []);

    const releaseWakeLock = useCallback(() => {
        if (wakeLockRef.current) { wakeLockRef.current.release(); wakeLockRef.current = null; }
    }, []);

    useEffect(() => {
        const fn = () => { if (document.visibilityState === "visible" && isRunning) acquireWakeLock(); };
        document.addEventListener("visibilitychange", fn);
        return () => document.removeEventListener("visibilitychange", fn);
    }, [isRunning, acquireWakeLock]);

    // ─── Core timer helpers (pure ref ops, no React deps) ─────────────────────
    const tickRef = useRef(null);

    // Starts a new rAF countdown for `duration` seconds. Updates ref immediately.
    const startTickFn = useCallback((duration) => {
        cancelAnimationFrame(animFrameRef.current);
        startTimestampRef.current = { t: performance.now(), dur: duration };
        setTimeLeftRaw(duration);
        animFrameRef.current = requestAnimationFrame(() => tickRef.current?.());
    }, []);

    // Assign tick each render (always has fresh closure over playSound / startTickFn)
    // Advance logic is inlined so refs are updated synchronously before next rAF.
    tickRef.current = () => {
        const ts = startTimestampRef.current;
        if (!ts) return;
        const elapsed   = (performance.now() - ts.t) / 1000;
        const remaining = Math.max(0, ts.dur - elapsed);
        setTimeLeftRaw(remaining);

        if (remaining > 0) {
            animFrameRef.current = requestAnimationFrame(() => tickRef.current?.());
            return;
        }

        // ── Phase ended — advance synchronously via refs ──
        playSound();

        const exs = exercisesRef.current;
        const idx = currentExIdxRef.current;
        const set = currentSetRef.current;
        const ph  = phaseRef.current;
        const ex  = exs[idx];

        // Helper: update ref immediately so next tick reads correct phase
        const switchPhase = (newPhase) => { phaseRef.current = newPhase; setPhase(newPhase); };
        const switchIdx   = (i)        => { currentExIdxRef.current = i; setCurrentExIdx(i); };
        const switchSet   = (s)        => { currentSetRef.current = s;   setCurrentSet(s);   };

        if (ph === "work") {
            if (ex.restTime > 0) {
                switchPhase("rest");
                startTickFn(ex.restTime);
            } else if (set < ex.sets) {
                switchSet(set + 1);
                switchPhase("work");
                startTickFn(ex.workTime);
            } else if (idx + 1 < exs.length) {
                const nex = exs[idx + 1];
                switchIdx(idx + 1); switchSet(1); switchPhase("work");
                startTickFn(nex.workTime);
            } else {
                setPhase("done"); setIsRunning(false);
                if (wakeLockRef.current) { wakeLockRef.current.release(); wakeLockRef.current = null; }
            }
        } else {
            // rest done
            if (set < ex.sets) {
                switchSet(set + 1); switchPhase("work");
                startTickFn(ex.workTime);
            } else if (idx + 1 < exs.length) {
                const nex = exs[idx + 1];
                switchIdx(idx + 1); switchSet(1); switchPhase("work");
                startTickFn(nex.workTime);
            } else {
                setPhase("done"); setIsRunning(false);
                if (wakeLockRef.current) { wakeLockRef.current.release(); wakeLockRef.current = null; }
            }
        }
    };

    // ─── Controls ──────────────────────────────────────────────────────────────
    const handleStart = useCallback(() => {
        const ph = phaseRef.current;
        const ex = exercisesRef.current[currentExIdxRef.current];
        if (ph === "idle" || ph === "done") {
            if (ph === "done") {
                setCurrentExIdx(0); setCurrentSet(1);
                setPhase("work");
                const firstEx = exercisesRef.current[0];
                startTickFn(firstEx.workTime);
            } else {
                setPhase("work");
                startTickFn(ex.workTime);
            }
        } else {
            // Resume: reconstruct timestamp using saved remaining
            const rem = startTimestampRef.current?._paused ?? timeLeftRaw;
            cancelAnimationFrame(animFrameRef.current);
            startTimestampRef.current = { t: performance.now(), dur: rem };
            animFrameRef.current = requestAnimationFrame(() => tickRef.current?.());
        }
        setIsRunning(true);
        acquireWakeLock();
    }, [startTickFn, acquireWakeLock, timeLeftRaw]);

    const handleStop = useCallback(() => {
        cancelAnimationFrame(animFrameRef.current);
        // Save paused remaining for resume
        if (startTimestampRef.current) {
            const elapsed = (performance.now() - startTimestampRef.current.t) / 1000;
            const rem = Math.max(0, startTimestampRef.current.dur - elapsed);
            startTimestampRef.current = { ...startTimestampRef.current, _paused: rem };
        }
        setIsRunning(false);
        releaseWakeLock();
    }, [releaseWakeLock]);

    const handleReset = useCallback(() => {
        cancelAnimationFrame(animFrameRef.current);
        startTimestampRef.current = null;
        setIsRunning(false); setPhase("idle");
        setCurrentExIdx(0); setCurrentSet(1); setTimeLeftRaw(0);
        releaseWakeLock();
    }, [releaseWakeLock]);

    const stopAndReset = useCallback(() => {
        cancelAnimationFrame(animFrameRef.current);
        startTimestampRef.current = null;
        setIsRunning(false); setPhase("idle"); setTimeLeftRaw(0);
    }, []);

    // Navigate by one set at a time, crossing exercise boundaries
    const goNext = useCallback(() => {
        const exs = exercisesRef.current;
        const idx = currentExIdxRef.current;
        const set = currentSetRef.current;
        const ex  = exs[idx];

        let newIdx = idx;
        let newSet = set;

        if (set < ex.sets) {
            newSet = set + 1;
        } else if (idx + 1 < exs.length) {
            newIdx = idx + 1;
            newSet = 1;
        } else {
            return; // already at last set of last exercise
        }

        cancelAnimationFrame(animFrameRef.current);
        startTimestampRef.current = null;
        currentExIdxRef.current = newIdx;
        currentSetRef.current   = newSet;
        setCurrentExIdx(newIdx);
        setCurrentSet(newSet);

        if (isRunning) {
            const newEx = exs[newIdx];
            phaseRef.current = "work"; setPhase("work");
            startTickFn(newEx.workTime);
        } else {
            phaseRef.current = "idle"; setPhase("idle"); setTimeLeftRaw(0);
        }
    }, [isRunning, startTickFn]);

    const goPrev = useCallback(() => {
        const exs = exercisesRef.current;
        const idx = currentExIdxRef.current;
        const set = currentSetRef.current;

        let newIdx = idx;
        let newSet = set;

        if (set > 1) {
            newSet = set - 1;
        } else if (idx > 0) {
            newIdx = idx - 1;
            newSet = exs[newIdx].sets; // last set of previous exercise
        } else {
            return; // already at first set of first exercise
        }

        cancelAnimationFrame(animFrameRef.current);
        startTimestampRef.current = null;
        currentExIdxRef.current = newIdx;
        currentSetRef.current   = newSet;
        setCurrentExIdx(newIdx);
        setCurrentSet(newSet);

        if (isRunning) {
            const newEx = exs[newIdx];
            phaseRef.current = "work"; setPhase("work");
            startTickFn(newEx.workTime);
        } else {
            phaseRef.current = "idle"; setPhase("idle"); setTimeLeftRaw(0);
        }
    }, [isRunning, startTickFn]);

    const jumpToExercise = useCallback((idx) => {
        stopAndReset();
        setCurrentExIdx(idx); setCurrentSet(1); setShowExList(false);
    }, [stopAndReset]);

    // ─── Fullscreen ────────────────────────────────────────────────────────────
    const toggleFullscreen = useCallback(async () => {
        if (!document.fullscreenElement) {
            await containerRef.current?.requestFullscreen?.();
            setIsFullscreen(true);
        } else {
            await document.exitFullscreen?.();
            setIsFullscreen(false);
        }
    }, []);

    useEffect(() => {
        const fn = () => setIsFullscreen(!!document.fullscreenElement);
        document.addEventListener("fullscreenchange", fn);
        return () => document.removeEventListener("fullscreenchange", fn);
    }, []);

    // ─── Keyboard shortcuts ────────────────────────────────────────────────────
    useEffect(() => {
        const fn = (e) => {
            if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;
            switch (e.key) {
                case " ":       e.preventDefault(); isRunning ? handleStop() : handleStart(); break;
                case "ArrowRight": goNext(); break;
                case "ArrowLeft":  goPrev(); break;
                case "r": case "R": handleReset(); break;
                case "f": case "F": toggleFullscreen(); break;
                case "m": case "M": setSoundEnabled((s) => !s); break;
                case "Escape": setShowSettings(false); setShowExList(false); break;
            }
        };
        window.addEventListener("keydown", fn);
        return () => window.removeEventListener("keydown", fn);
    }, [isRunning, handleStart, handleStop, goPrev, goNext, handleReset, toggleFullscreen]);

    // ─── Touch gestures ────────────────────────────────────────────────────────
    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;
        const onStart = (e) => { touchStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }; };
        const onEnd   = (e) => {
            if (!touchStartRef.current) return;
            const dx = e.changedTouches[0].clientX - touchStartRef.current.x;
            const dy = e.changedTouches[0].clientY - touchStartRef.current.y;
            if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 60) dx < 0 ? goNext() : goPrev();
            touchStartRef.current = null;
        };
        el.addEventListener("touchstart", onStart, { passive: true });
        el.addEventListener("touchend",   onEnd,   { passive: true });
        return () => { el.removeEventListener("touchstart", onStart); el.removeEventListener("touchend", onEnd); };
    }, [goNext, goPrev]);

    // ─── Exercise CRUD ─────────────────────────────────────────────────────────
    const addExercise = () => {
        const ex = { id: generateId(), name: "Nowe ćwiczenie", sets: 3, workTime: 30, restTime: 30, load: 0 };
        setExercises((p) => [...p, ex]);
        setEditingEx(ex.id);
    };
    const removeExercise = (id) => {
        setExercises((p) => p.filter((e) => e.id !== id));
        if (editingEx === id) setEditingEx(null);
    };
    const updateExercise = (id, field, value) =>
        setExercises((p) => p.map((e) => (e.id === id ? { ...e, [field]: value } : e)));

    // ─── Remaining queue ───────────────────────────────────────────────────────
    const remainingSeries = useMemo(() => {
        const items = [];
        exercises.forEach((ex, eIdx) => {
            if (eIdx < currentExIdx) return;
            const startSet = eIdx === currentExIdx ? currentSet : 1;
            for (let s = startSet; s <= ex.sets; s++) {
                if (eIdx === currentExIdx && s === currentSet && phase !== "idle") continue;
                items.push({ ex, setNum: s, eIdx });
            }
        });
        return items;
    }, [exercises, currentExIdx, currentSet, phase]);

    // ─── Display ───────────────────────────────────────────────────────────────
    const displayRaw    = phase === "idle" ? (currentEx?.workTime ?? 0) : phase === "done" ? 0 : timeLeftRaw;
    const { whole, ms } = formatTime(displayRaw);

    const phaseAccent =
        phase === "work" ? "var(--it-work)"
            : phase === "rest" ? "var(--it-rest)"
                : "var(--ifm-color-primary, #2e8540)";

    const phaseLabel =
        phase === "work" ? "PRACA"
            : phase === "rest" ? "ODPOCZYNEK"
                : phase === "done" ? "KONIEC!"
                    : "GOTOWY";

    // ─── Styles ────────────────────────────────────────────────────────────────
    // Uses --ifm-* variables → automatically adapts to Docusaurus light/dark theme
    const css = `
    @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&display=swap');

    .it-root {
      /* Map to Docusaurus theme tokens */
      --it-bg:      var(--ifm-background-color, #fff);
      --it-surface: var(--ifm-background-surface-color, #f6f7f8);
      --it-surf2:   var(--ifm-color-emphasis-100, #efefef);
      --it-border:  var(--ifm-color-emphasis-300, #c8c8c8);
      --it-text:    var(--ifm-font-color-base, #1c1e21);
      --it-muted:   var(--ifm-color-emphasis-600, #72767d);
      --it-primary: var(--ifm-color-primary, #2e8540);

      /* Phase accent colours */
      --it-work:    #f97316;
      --it-rest:    #0ea5e9;

      /* Active accent driven by phase */
      --it-accent:  ${phaseAccent};

      font-family: var(--ifm-font-family-base, system-ui, sans-serif);
      background: var(--it-bg);
      color: var(--it-text);
      min-height: 100vh;
      user-select: none;
      position: relative;
    }
    .it-root * { box-sizing: border-box; }

    /* ── Main ── */
    .it-main {
      display: flex; flex-direction: column;
      align-items: center; min-height: 100vh;
      padding: 16px; gap: 14px; position: relative;
      background: var(--ifm-color-white);
    }

    /* ── Top bar ── */
    .it-topbar {
      width: 100%; max-width: 560px;
      display: flex; justify-content: space-between; align-items: center; gap: 8px;
    }
    .it-icon-btn {
      width: 40px; height: 40px; border-radius: 10px;
      border: 1px solid var(--it-border); background: var(--it-surface);
      color: var(--it-muted); display: flex; align-items: center; justify-content: center;
      cursor: pointer; font-size: 18px; transition: color .15s, border-color .15s, background .15s;
    }
    .it-icon-btn:hover { color: var(--it-text); border-color: var(--it-accent); }
    .it-icon-btn.active { background: var(--it-accent); color: #fff; border-color: var(--it-accent); }
    .it-phase-badge {
      font-size: 11px; font-weight: 700;
      letter-spacing: 3px; padding: 4px 12px; border-radius: 20px;
      border: 1px solid var(--it-accent); color: var(--it-accent);
      transition: color .4s, border-color .4s;
    }

    /* ── Exercise info ── */
    .it-ex-info { width: 100%; max-width: 560px; text-align: center; }
    .it-ex-name {
      font-size: clamp(24px, 7vw, 44px); font-weight: 700; letter-spacing: 0.5px; line-height: 1.1;
    }
    .it-ex-meta {
      display: flex; gap: 14px; justify-content: center; flex-wrap: wrap;
      margin-top: 6px; color: var(--it-muted); font-size: 13px;
    }
    .it-ex-meta span { display: flex; align-items: center; gap: 4px; }
    .it-load-badge {
      background: var(--it-surf2); border: 1px solid var(--it-border);
      border-radius: 8px; padding: 2px 10px; font-size: 12px;
    }

    /* ── Timer digits ── */
    .it-timer-wrap {
      display: flex; flex-direction: column; align-items: center;
      gap: 10px; width: 100%; max-width: 560px;
    }
    .it-timer-digits {
      display: flex; align-items: baseline; gap: 0;
      color: var(--it-accent); transition: color .4s;
      filter: drop-shadow(0 0 24px color-mix(in srgb, var(--it-accent) 30%, transparent));
      line-height: 1;
    }
    .it-timer-whole {
      font-family: 'Bebas Neue', sans-serif;
      font-size: clamp(80px, 22vw, 140px); letter-spacing: -2px;
    }
    .it-timer-dot {
      font-family: 'Bebas Neue', sans-serif;
      font-size: clamp(40px, 11vw, 70px);
      opacity: 0.55; margin: 0 1px 4px;
    }
    .it-timer-ms {
      font-family: 'Bebas Neue', sans-serif;
      font-size: clamp(50px, 13vw, 88px);
      opacity: 0.65; margin-bottom: 6px; min-width: 2ch; letter-spacing: -1px;
    }

    /* ── Progress ── */
    .it-progress-track {
      width: 100%; height: 6px; background: var(--it-surf2);
      border-radius: 99px; overflow: hidden;
    }
    .it-progress-fill {
      height: 100%; border-radius: 99px; background: var(--it-accent);
      transition: width .06s linear, background .4s;
      box-shadow: 0 0 8px color-mix(in srgb, var(--it-accent) 55%, transparent);
    }

    /* ── Set dots ── */
    .it-sets { display: flex; gap: 8px; justify-content: center; flex-wrap: wrap; }
    .it-set-dot {
      width: 28px; height: 8px; border-radius: 4px;
      background: var(--it-surf2); border: 1px solid var(--it-border);
      transition: background .2s, border-color .2s;
    }
    .it-set-dot.done   { background: var(--it-work); border-color: var(--it-work); }
    .it-set-dot.active {
      background: var(--it-accent); border-color: var(--it-accent);
      box-shadow: 0 0 8px color-mix(in srgb, var(--it-accent) 50%, transparent);
    }

    /* ── Controls ── */
    .it-controls {
      width: 100%; max-width: 560px;
      display: flex; align-items: center; gap: 10px; justify-content: center;
    }
    .it-nav-btn {
      width: 48px; height: 48px; border-radius: 12px;
      border: 1px solid var(--it-border); background: var(--it-surface);
      color: var(--it-muted); cursor: pointer; font-size: 20px;
      display: flex; align-items: center; justify-content: center;
      transition: background .15s, color .15s; flex-shrink: 0;
    }
    .it-nav-btn:hover:not(:disabled) { color: var(--it-text); background: var(--it-surf2); }
    .it-nav-btn:disabled { opacity: 0.28; cursor: default; }
    .it-btn-main {
      flex: 1; height: 56px; border-radius: 14px; border: none;
      cursor: pointer; font-family: 'JetBrains Mono', monospace;
      font-size: 15px; font-weight: 700; letter-spacing: 2px;
      transition: filter .15s, transform .1s, background .15s, color .15s, border .15s, box-shadow .15s;
    }
    .it-btn-main.play {
      background: var(--it-accent); color: #fff;
      box-shadow: 0 4px 18px color-mix(in srgb, var(--it-accent) 40%, transparent);
    }
    .it-btn-main.play:hover  { filter: brightness(1.1); transform: translateY(-1px); }
    .it-btn-main.play:active { transform: translateY(1px); }
    .it-btn-main.pause {
      background: var(--it-surf2); color: #ef4444; border: 1px solid #ef4444;
      box-shadow: none;
    }
    .it-btn-main.pause:hover { background: color-mix(in srgb, #ef4444 8%, var(--it-surf2)); }
    .it-btn-reset {
      width: 48px; height: 48px; border-radius: 12px;
      border: 1px solid var(--it-border); background: var(--it-surface);
      color: var(--it-muted); cursor: pointer; font-size: 18px;
      display: flex; align-items: center; justify-content: center;
      transition: color .15s; flex-shrink: 0;
    }
    .it-btn-reset:hover { color: var(--it-text); }

    /* ── Done ── */
    .it-done { text-align: center; padding: 24px 0; }
    .it-done-emoji { font-size: 60px; }
    .it-done-text {
      font-size: 40px; font-weight: 800;
      letter-spacing: 1px; color: var(--it-primary); margin: 8px 0;
    }

    /* ── Exercise list sheet ── */
    .it-ex-list-overlay {
      position: fixed; inset: 0; z-index: 50;
      background: rgba(0,0,0,.5); backdrop-filter: blur(4px);
      display: flex; align-items: flex-end;
    }
    .it-ex-list-panel {
      width: 100%; max-height: 70vh; background: var(--it-surface);
      border-radius: 20px 20px 0 0; padding: 20px; overflow-y: auto;
      display: flex; flex-direction: column; gap: 10px;
      border-top: 1px solid var(--it-border);
    }
    .it-ex-list-panel h3 {
      font-size: 18px; font-weight: 700;
      letter-spacing: 0; margin: 0 0 4px;
    }
    .it-ex-list-item {
      display: flex; align-items: center; gap: 12px; padding: 12px;
      border-radius: 12px; border: 1px solid var(--it-border);
      background: var(--it-surf2); cursor: pointer; transition: border-color .15s;
    }
    .it-ex-list-item:hover { border-color: var(--it-accent); }
    .it-ex-list-item.current {
      border-color: var(--it-accent);
      background: color-mix(in srgb, var(--it-accent) 8%, var(--it-surf2));
    }
    .it-ex-list-num {
      width: 28px; height: 28px; border-radius: 8px; background: var(--it-border);
      flex-shrink: 0; display: flex; align-items: center; justify-content: center;
      font-size: 12px; font-weight: 700; color: var(--it-muted);
    }
    .it-ex-list-item.current .it-ex-list-num { background: var(--it-accent); color: #fff; }
    .it-ex-list-info .name { font-weight: 600; font-size: 14px; }
    .it-ex-list-info .meta { font-size: 12px; color: var(--it-muted); margin-top: 2px; }

    /* ── Settings overlay ── */
    .it-settings-overlay {
      position: fixed; inset: 0; z-index: 60;
      background: rgba(0,0,0,.5); backdrop-filter: blur(6px);
      display: flex; align-items: center; justify-content: center; padding: 16px;
    }
    .it-settings-panel {
      width: 100%; max-width: 600px; max-height: 90vh;
      background: var(--it-surface); border-radius: 20px;
      border: 1px solid var(--it-border); overflow-y: auto;
      display: flex; flex-direction: column;
    }
    .it-settings-header {
      padding: 18px 20px 14px; display: flex; justify-content: space-between;
      align-items: center; position: sticky; top: 0;
      background: var(--it-surface); border-bottom: 1px solid var(--it-border); z-index: 1;
    }
    .it-settings-header h2 {
      font-size: 22px; font-weight: 700; letter-spacing: 0; margin: 0;
    }
    .it-close-btn {
      background: none; border: 1px solid var(--it-border); color: var(--it-muted);
      border-radius: 8px; width: 32px; height: 32px; cursor: pointer; font-size: 18px;
      display: flex; align-items: center; justify-content: center;
      transition: border-color .15s, color .15s;
    }
    .it-close-btn:hover { color: var(--it-text); border-color: var(--it-text); }
    .it-settings-body { padding: 20px; display: flex; flex-direction: column; gap: 24px; }
    .it-section-title {
      font-size: 11px; font-weight: 700;
      letter-spacing: 2px; color: var(--it-muted); margin-bottom: 10px; text-transform: uppercase;
    }

    /* ── Sound block ── */
    .it-sound-toggle-row {
      display: flex; align-items: center; justify-content: space-between;
      padding: 10px 0; border-bottom: 1px solid var(--it-border);
    }
    .it-sound-toggle-row label { font-size: 14px; font-weight: 600; cursor: default; }
    .it-toggle {
      width: 44px; height: 24px; background: var(--it-surf2); border-radius: 12px;
      border: 1px solid var(--it-border); cursor: pointer; position: relative;
      transition: background .2s, border-color .2s; flex-shrink: 0;
    }
    .it-toggle.on { background: var(--it-primary); border-color: var(--it-primary); }
    .it-toggle::after {
      content: ''; position: absolute; top: 2px; left: 2px;
      width: 18px; height: 18px; border-radius: 50%; background: #fff;
      transition: transform .2s; box-shadow: 0 1px 3px rgba(0,0,0,.25);
    }
    .it-toggle.on::after { transform: translateX(20px); }
    .it-sound-label { margin-top: 12px; margin-bottom: 6px; font-size: 13px; color: var(--it-muted); }
    .it-sound-grid  { display: grid; grid-template-columns: repeat(2,1fr); gap: 8px; }
    .it-sound-option {
      padding: 8px 12px; border-radius: 10px; border: 1px solid var(--it-border);
      background: var(--it-surf2); color: var(--it-muted); cursor: pointer;
      font-size: 13px; text-align: center;
      transition: color .15s, border-color .15s, background .15s;
    }
    .it-sound-option.selected {
      border-color: var(--it-primary); color: var(--it-primary);
      background: color-mix(in srgb, var(--it-primary) 8%, var(--it-surf2));
    }
    .it-sound-option:hover { color: var(--it-text); }

    /* ── Exercise editor ── */
    .it-ex-card {
      border: 1px solid var(--it-border); border-radius: 14px;
      background: var(--it-surf2); overflow: hidden;
    }
    .it-ex-card-header {
      display: flex; align-items: center; gap: 10px; padding: 12px 14px;
      cursor: pointer; transition: background .15s;
    }
    .it-ex-card-header:hover {
      background: color-mix(in srgb, var(--it-border) 25%, transparent);
    }
    .it-ex-card-title { flex: 1; font-weight: 600; font-size: 14px; }
    .it-ex-card-body  { padding: 0 14px 14px; }
    .it-field-row { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 10px; }
    .it-field { display: flex; flex-direction: column; gap: 4px; }
    .it-field label {
      font-size: 10px; font-weight: 700; letter-spacing: 1px;
      color: var(--it-muted); text-transform: uppercase;
    }
    .it-field input {
      background: var(--it-bg); border: 1px solid var(--it-border); border-radius: 8px;
      color: var(--it-text); padding: 8px 10px; font-size: 14px;
      font-family: inherit; width: 100%; outline: none;
      transition: border-color .15s;
    }
    .it-field input:focus { border-color: var(--it-primary); }
    .it-field input[type="text"] { font-family: var(--ifm-font-family-base, system-ui); }
    .it-field input::-webkit-inner-spin-button,
    .it-field input::-webkit-outer-spin-button { -webkit-appearance: none; }
    .it-field input[type="number"] { -moz-appearance: textfield; }
    .it-full-field { grid-column: 1 / -1; }
    .it-del-btn {
      width: 28px; height: 28px; border-radius: 8px;
      border: 1px solid var(--it-border); background: transparent;
      color: var(--it-muted); cursor: pointer; font-size: 16px;
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0; transition: background .15s, border-color .15s, color .15s;
    }
    .it-del-btn:hover { background: rgba(239,68,68,.1); border-color: #ef4444; color: #ef4444; }
    .it-add-btn {
      width: 100%; padding: 12px; border-radius: 12px;
      border: 1px dashed var(--it-border); background: transparent;
      color: var(--it-muted); cursor: pointer; font-size: 14px;
      transition: border-color .15s, color .15s;
    }
    .it-add-btn:hover { border-color: var(--it-primary); color: var(--it-primary); }

    /* ── Keyboard shortcuts ── */
    .it-shortcuts { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; }
    .it-shortcut  { display: flex; align-items: center; gap: 8px; font-size: 12px; color: var(--it-muted); }
    .it-key {
      background: var(--it-surf2); border: 1px solid var(--it-border);
      border-radius: 5px; padding: 2px 7px;
      font-size: 11px; color: var(--it-text); white-space: nowrap;
    }

    /* ── Inline fullscreen queue (below controls) ── */
    .it-fs-queue {
      width: 100%; max-width: 560px;
      max-height: calc(100vh - 510px);
      overflow-y: auto;
      display: flex; flex-direction: column; gap: 6px;
    }
    .it-fs-queue-title {
      font-size: 11px; font-weight: 700; letter-spacing: 2px;
      text-transform: uppercase; color: var(--it-muted); margin-bottom: 2px;
    }
    .it-queue-item {
      padding: 8px 12px; border-radius: 10px; cursor: pointer;
      border: 1px solid var(--it-border); background: var(--it-surf2); font-size: 12px;
      transition: border-color .15s; flex-shrink: 0;
    }
    .it-queue-item:hover { border-color: var(--it-accent); }
    .it-queue-item .ex-n { font-weight: 600; font-size: 13px; }
    .it-queue-item .ex-d { color: var(--it-muted); margin-top: 2px; }

    /* ── Inline exercise list (normal mode, below controls) ── */
    .it-ex-inline-list {
      width: 100%; max-width: 560px;
      display: flex; flex-direction: column; gap: 6px;
    }
    .it-ex-inline-title {
      font-size: 11px; font-weight: 700; letter-spacing: 2px;
      text-transform: uppercase; color: var(--it-muted); margin-bottom: 2px;
    }
    .it-ex-inline-item {
      display: flex; align-items: center; gap: 10px;
      padding: 10px 12px; border-radius: 10px;
      border: 1px solid var(--it-border); background: var(--it-surf2);
      cursor: pointer; transition: border-color .15s;
    }
    .it-ex-inline-item:hover     { border-color: var(--it-accent); }
    .it-ex-inline-item.current   {
      border-color: var(--it-accent);
      background: color-mix(in srgb, var(--it-accent) 7%, var(--it-surf2));
    }
    .it-ex-inline-num {
      width: 24px; height: 24px; border-radius: 6px;
      background: var(--it-border); flex-shrink: 0;
      display: flex; align-items: center; justify-content: center;
      font-size: 11px; font-weight: 700; color: var(--it-muted);
    }
    .it-ex-inline-item.current .it-ex-inline-num { background: var(--it-accent); color: #fff; }
    .it-ex-inline-info { flex: 1; min-width: 0; }
    .it-ex-inline-info .name { font-weight: 600; font-size: 13px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .it-ex-inline-info .meta { font-size: 11px; color: var(--it-muted); margin-top: 1px; }
    .it-ex-inline-sets { display: flex; gap: 3px; flex-shrink: 0; }
    .it-ex-inline-dot {
      width: 18px; height: 5px; border-radius: 3px;
      background: var(--it-border); border: 1px solid var(--it-border);
    }
    .it-ex-inline-dot.done   { background: var(--it-work); border-color: var(--it-work); }
    .it-ex-inline-dot.active { background: var(--it-accent); border-color: var(--it-accent); }

    /* ── Fullscreen: re-declare all tokens explicitly so top-layer inherits them ── */
    .it-root:fullscreen,
    .it-root:-webkit-full-screen,
    .it-root:-moz-full-screen {
      ${isDark ? `
      --it-bg:      #1b1b1d;
      --it-surface: #242526;
      --it-surf2:   #2e2e30;
      --it-border:  #444446;
      --it-text:    #e3e3e3;
      --it-muted:   #909096;
      --it-primary: #4ade80;
      background: #1b1b1d !important;
      ` : `
      --it-bg:      #ffffff;
      --it-surface: #f6f7f8;
      --it-surf2:   #efefef;
      --it-border:  #c8c8c8;
      --it-text:    #1c1e21;
      --it-muted:   #72767d;
      --it-primary: #2e8540;
      background: #ffffff !important;
      `}
    }

    /* ── Fullscreen layout: centered, scaled up ── */
    :fullscreen .it-main,
    :-webkit-full-screen .it-main,
    :-moz-full-screen .it-main {
      justify-content: center;
      gap: 20px;
      padding: 24px 32px;
    }

    :fullscreen .it-topbar,
    :-webkit-full-screen .it-topbar,
    :-moz-full-screen .it-topbar {
      max-width: 780px;
    }

    :fullscreen .it-icon-btn,
    :-webkit-full-screen .it-icon-btn,
    :-moz-full-screen .it-icon-btn {
      width: 52px; height: 52px; border-radius: 14px; font-size: 22px;
    }

    :fullscreen .it-phase-badge,
    :-webkit-full-screen .it-phase-badge,
    :-moz-full-screen .it-phase-badge {
      font-size: 14px; letter-spacing: 4px; padding: 6px 18px;
    }

    :fullscreen .it-ex-info,
    :-webkit-full-screen .it-ex-info,
    :-moz-full-screen .it-ex-info {
      max-width: 780px;
    }

    :fullscreen .it-ex-name,
    :-webkit-full-screen .it-ex-name,
    :-moz-full-screen .it-ex-name {
      font-size: clamp(36px, 5vw, 64px);
    }

    :fullscreen .it-ex-meta,
    :-webkit-full-screen .it-ex-meta,
    :-moz-full-screen .it-ex-meta {
      font-size: 16px; gap: 20px;
    }

    :fullscreen .it-timer-wrap,
    :-webkit-full-screen .it-timer-wrap,
    :-moz-full-screen .it-timer-wrap {
      max-width: 780px; gap: 14px;
    }

    :fullscreen .it-timer-whole,
    :-webkit-full-screen .it-timer-whole,
    :-moz-full-screen .it-timer-whole {
      font-size: clamp(140px, 22vw, 220px);
    }

    :fullscreen .it-timer-dot,
    :-webkit-full-screen .it-timer-dot,
    :-moz-full-screen .it-timer-dot {
      font-size: clamp(70px, 11vw, 110px);
    }

    :fullscreen .it-timer-ms,
    :-webkit-full-screen .it-timer-ms,
    :-moz-full-screen .it-timer-ms {
      font-size: clamp(90px, 14vw, 150px);
    }

    :fullscreen .it-progress-track,
    :-webkit-full-screen .it-progress-track,
    :-moz-full-screen .it-progress-track {
      height: 10px;
    }

    :fullscreen .it-sets,
    :-webkit-full-screen .it-sets,
    :-moz-full-screen .it-sets {
      gap: 10px;
    }

    :fullscreen .it-set-dot,
    :-webkit-full-screen .it-set-dot,
    :-moz-full-screen .it-set-dot {
      width: 40px; height: 10px;
    }

    :fullscreen .it-controls,
    :-webkit-full-screen .it-controls,
    :-moz-full-screen .it-controls {
      max-width: 780px; gap: 14px;
    }

    :fullscreen .it-nav-btn,
    :-webkit-full-screen .it-nav-btn,
    :-moz-full-screen .it-nav-btn {
      width: 68px; height: 68px; border-radius: 16px; font-size: 26px;
    }

    :fullscreen .it-btn-main,
    :-webkit-full-screen .it-btn-main,
    :-moz-full-screen .it-btn-main {
      height: 68px; font-size: 20px; border-radius: 18px;
    }

    :fullscreen .it-btn-reset,
    :-webkit-full-screen .it-btn-reset,
    :-moz-full-screen .it-btn-reset {
      width: 68px; height: 68px; border-radius: 16px; font-size: 22px;
    }

    :fullscreen .it-fs-queue,
    :-webkit-full-screen .it-fs-queue,
    :-moz-full-screen .it-fs-queue {
      max-width: 780px; max-height: 22vh; gap: 8px;
    }

    :fullscreen .it-fs-queue-title,
    :-webkit-full-screen .it-fs-queue-title,
    :-moz-full-screen .it-fs-queue-title {
      font-size: 13px;
    }

    :fullscreen .it-queue-item,
    :-webkit-full-screen .it-queue-item,
    :-moz-full-screen .it-queue-item {
      padding: 12px 16px; font-size: 14px; border-radius: 12px;
    }

    :fullscreen .it-queue-item .ex-n,
    :-webkit-full-screen .it-queue-item .ex-n,
    :-moz-full-screen .it-queue-item .ex-n {
      font-size: 15px;
    }

    /* ── Responsive ── */
    @media (max-width: 480px) {
      .it-main { padding: 10px; gap: 10px; }
    }

    /* ── Scrollbar ── */
    .it-root ::-webkit-scrollbar { width: 4px; }
    .it-root ::-webkit-scrollbar-track { background: var(--it-bg); }
    .it-root ::-webkit-scrollbar-thumb { background: var(--it-border); border-radius: 2px; }
  `;

    // ─── Render ────────────────────────────────────────────────────────────────
    return (
        <div className="it-root" ref={containerRef}>
            <style>{css}</style>

            <div className="it-main">

                {/* ── Top bar ── */}
                <div className="it-topbar">
                    <button
                        className={`it-icon-btn ${isFullscreen ? "active" : ""}`}
                        onClick={toggleFullscreen}
                        title="Pełny ekran (F)"
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            {isFullscreen
                                ? <><path d="M8 3v3a2 2 0 0 1-2 2H3"/><path d="M21 8h-3a2 2 0 0 1-2-2V3"/><path d="M3 16h3a2 2 0 0 1 2 2v3"/><path d="M16 21v-3a2 2 0 0 1 2-2h3"/></>
                                : <><path d="M8 3H5a2 2 0 0 0-2 2v3"/><path d="M21 8V5a2 2 0 0 0-2-2h-3"/><path d="M3 16v3a2 2 0 0 0 2 2h3"/><path d="M16 21h3a2 2 0 0 0 2-2v-3"/></>
                            }
                        </svg>
                    </button>

                    <div className="it-phase-badge">{phaseLabel}</div>

                    <div style={{ display: "flex", gap: 8 }}>
                        <button className="it-icon-btn" onClick={() => setShowSettings(true)} title="Ustawienia">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="3"/>
                                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
                            </svg>
                        </button>
                    </div>
                </div>

                {/* ── Exercise info ── */}
                <div className="it-ex-info">
                    {currentEx && (
                        <>
                            <div className="it-ex-name">{currentEx.name}</div>
                            <div className="it-ex-meta">
                <span>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M6 4v6a6 6 0 0 0 12 0V4"/>
                    <line x1="4" y1="20" x2="20" y2="20"/>
                  </svg>
                    {currentEx.workTime}s praca&nbsp;/&nbsp;{currentEx.restTime}s odpoczynek
                </span>
                                {currentEx.load > 0 && (
                                    <span className="it-load-badge">{currentEx.load} kg</span>
                                )}
                            </div>
                        </>
                    )}
                </div>

                {/* ── Timer ── */}
                <div className="it-timer-wrap">
                    {phase === "done" ? (
                        <div className="it-done">
                            <div className="it-done-emoji">🏆</div>
                            <div className="it-done-text">Świetna Robota!</div>
                        </div>
                    ) : (
                        <div className="it-timer-digits">
                            <span className="it-timer-whole">{whole}</span>
                            <span className="it-timer-dot">.</span>
                            <span className="it-timer-ms">{ms}</span>
                        </div>
                    )}

                    <div className="it-progress-track">
                        <div className="it-progress-fill" style={{ width: `${progress}%` }} />
                    </div>
                </div>

                {/* ── Set dots ── */}
                {currentEx && (
                    <div className="it-sets">
                        {Array.from({ length: currentEx.sets }).map((_, i) => (
                            <div
                                key={i}
                                className={`it-set-dot ${
                                    i + 1 < currentSet ? "done" : i + 1 === currentSet ? "active" : ""
                                }`}
                            />
                        ))}
                    </div>
                )}

                {/* ── Counter ── */}
                <div style={{
                    fontSize: 12, color: "var(--it-muted)", letterSpacing: 1
                }}>
                    SERIA {currentSet}&nbsp;/&nbsp;{currentEx?.sets}
                    &nbsp;·&nbsp;
                    ĆWICZENIE {currentExIdx + 1}&nbsp;/&nbsp;{exercises.length}
                </div>

                {/* ── Controls ── */}
                <div className="it-controls">
                    <button
                        className="it-nav-btn" onClick={goPrev}
                        disabled={currentExIdx === 0 && currentSet === 1} title="Poprzednie (←)"
                    >◀</button>

                    <button
                        className={`it-btn-main ${isRunning ? "pause" : "play"}`}
                        onClick={isRunning ? handleStop : handleStart}
                    >
                        {isRunning       ? "⏸ PAUZA"
                            : phase === "idle" ? "▶ START"
                                : phase === "done" ? "↺ PONÓW"
                                    : "▶ WZNÓW"}
                    </button>

                    <button className="it-btn-reset" onClick={handleReset} title="Reset (R)">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="1 4 1 10 7 10"/>
                            <path d="M3.51 15a9 9 0 1 0 .49-4.5"/>
                        </svg>
                    </button>

                    <button
                        className="it-nav-btn" onClick={goNext}
                        disabled={currentExIdx === exercises.length - 1 && currentSet === (exercises[currentExIdx]?.sets ?? 1)} title="Następne (→)"
                    >▶</button>
                </div>

                {/* ── Exercise list: inline in normal mode, queue in fullscreen ── */}
                {isFullscreen ? (
                    remainingSeries.length > 0 && (
                        <div className="it-fs-queue">
                            <div className="it-fs-queue-title">Kolejne serie</div>
                            {remainingSeries.map(({ ex, setNum, eIdx }, i) => (
                                <div
                                    key={`${ex.id}-${setNum}`}
                                    className="it-queue-item"
                                    style={{ opacity: i === 0 ? 1 : 0.65 }}
                                    onClick={() => jumpToExercise(eIdx)}
                                >
                                    <div className="ex-n">{ex.name}</div>
                                    <div className="ex-d">
                                        Seria {setNum}/{ex.sets}&nbsp;·&nbsp;{ex.workTime}s
                                        {ex.load > 0 ? ` · ${ex.load}kg` : ""}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )
                ) : (
                    <div className="it-ex-inline-list">
                        <div className="it-ex-inline-title">Ćwiczenia</div>
                        {exercises.map((ex, idx) => {
                            const isCurrent = idx === currentExIdx;
                            return (
                                <div
                                    key={ex.id}
                                    className={`it-ex-inline-item ${isCurrent ? "current" : ""}`}
                                    onClick={() => jumpToExercise(idx)}
                                >
                                    <div className="it-ex-inline-num">{idx + 1}</div>
                                    <div className="it-ex-inline-info">
                                        <div className="name">{ex.name}</div>
                                        <div className="meta">
                                            {ex.workTime}s&nbsp;/&nbsp;{ex.restTime}s odpoczynku
                                            {ex.load > 0 ? ` · ${ex.load}kg` : ""}
                                        </div>
                                    </div>
                                    <div className="it-ex-inline-sets">
                                        {Array.from({ length: ex.sets }).map((_, s) => (
                                            <div
                                                key={s}
                                                className={`it-ex-inline-dot ${
                                                    isCurrent
                                                        ? s + 1 < currentSet ? "done"
                                                            : s + 1 === currentSet ? "active"
                                                                : ""
                                                        : ""
                                                }`}
                                            />
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

            </div>{/* /it-main */}

            {/* ── Settings overlay ── */}
            {showSettings && (
                <div className="it-settings-overlay" onClick={() => setShowSettings(false)}>
                    <div className="it-settings-panel" onClick={(e) => e.stopPropagation()}>
                        <div className="it-settings-header">
                            <h2>USTAWIENIA</h2>
                            <button className="it-close-btn" onClick={() => setShowSettings(false)}>×</button>
                        </div>

                        <div className="it-settings-body">

                            {/* ── Sound — toggle + picker integrated ── */}
                            <div>
                                <div className="it-section-title">🔊 Dźwięk</div>

                                <div className="it-sound-toggle-row">
                                    <label>Dźwięk zmiany ćwiczenia</label>
                                    <div
                                        className={`it-toggle ${soundEnabled ? "on" : ""}`}
                                        onClick={() => setSoundEnabled((s) => !s)}
                                        title="Wycisz / Dźwięk (M)"
                                    />
                                </div>

                                {soundEnabled && (
                                    <>
                                        <p className="it-sound-label">Wybierz dźwięk:</p>
                                        <div className="it-sound-grid">
                                            {Object.keys(SOUNDS).map((s) => (
                                                <button
                                                    key={s}
                                                    className={`it-sound-option ${selectedSound === s ? "selected" : ""}`}
                                                    onClick={() => {
                                                        setSelectedSound(s);
                                                        if (!audioCtxRef.current)
                                                            audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
                                                        SOUNDS[s](audioCtxRef.current);
                                                    }}
                                                >
                                                    {s.charAt(0).toUpperCase() + s.slice(1)}
                                                </button>
                                            ))}
                                        </div>
                                    </>
                                )}
                            </div>

                            {/* ── Exercises ── */}
                            <div>
                                <div className="it-section-title">🏋️ Ćwiczenia</div>
                                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                                    {exercises.map((ex, idx) => (
                                        <div key={ex.id} className="it-ex-card">
                                            <div
                                                className="it-ex-card-header"
                                                onClick={() => setEditingEx(editingEx === ex.id ? null : ex.id)}
                                            >
                        <span style={{ color: "var(--it-muted)", fontSize: 12, fontFamily: "'JetBrains Mono'", width: 20 }}>
                          {idx + 1}
                        </span>
                                                <span className="it-ex-card-title">{ex.name}</span>
                                                <span style={{ color: "var(--it-muted)", fontSize: 11 }}>
                          {ex.sets}×{ex.workTime}s
                        </span>
                                                <button
                                                    className="it-del-btn"
                                                    onClick={(e) => { e.stopPropagation(); removeExercise(ex.id); }}
                                                >×</button>
                                                <span style={{ color: "var(--it-muted)", fontSize: 12 }}>
                          {editingEx === ex.id ? "▲" : "▼"}
                        </span>
                                            </div>
                                            {editingEx === ex.id && (
                                                <div className="it-ex-card-body">
                                                    <div className="it-field-row">
                                                        <div className="it-field it-full-field">
                                                            <label>Nazwa</label>
                                                            <input
                                                                type="text" value={ex.name}
                                                                onChange={(e) => updateExercise(ex.id, "name", e.target.value)}
                                                            />
                                                        </div>
                                                        <div className="it-field">
                                                            <label>Serie</label>
                                                            <input
                                                                type="number" min="1" max="20" value={ex.sets}
                                                                onChange={(e) => updateExercise(ex.id, "sets", parseInt(e.target.value) || 1)}
                                                            />
                                                        </div>
                                                        <div className="it-field">
                                                            <label>Obciążenie (kg)</label>
                                                            <input
                                                                type="number" min="0" step="0.5" value={ex.load}
                                                                onChange={(e) => updateExercise(ex.id, "load", parseFloat(e.target.value) || 0)}
                                                            />
                                                        </div>
                                                        <div className="it-field">
                                                            <label>Czas pracy (s)</label>
                                                            <input
                                                                type="number" min="1" max="600" value={ex.workTime}
                                                                onChange={(e) => updateExercise(ex.id, "workTime", parseInt(e.target.value) || 1)}
                                                            />
                                                        </div>
                                                        <div className="it-field">
                                                            <label>Czas przerwy (s)</label>
                                                            <input
                                                                type="number" min="0" max="600" value={ex.restTime}
                                                                onChange={(e) => updateExercise(ex.id, "restTime", parseInt(e.target.value) || 0)}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                    <button className="it-add-btn" onClick={addExercise}>
                                        + Dodaj ćwiczenie
                                    </button>
                                </div>
                            </div>

                            {/* ── Keyboard shortcuts ── */}
                            <div>
                                <div className="it-section-title">⌨️ Skróty klawiaturowe</div>
                                <div className="it-shortcuts">
                                    {[
                                        ["Spacja", "Start / Pauza"],
                                        ["R",      "Reset"],
                                        ["F",      "Pełny ekran"],
                                        ["M",      "Wycisz / Dźwięk"],
                                        ["←",     "Poprzednie ćwiczenie"],
                                        ["→",     "Następne ćwiczenie"],
                                        ["Esc",   "Zamknij panel"],
                                    ].map(([key, desc]) => (
                                        <div key={key} className="it-shortcut">
                                            <span className="it-key">{key}</span>
                                            <span>{desc}</span>
                                        </div>
                                    ))}
                                    <div className="it-shortcut" style={{ gridColumn: "1/-1" }}>
                                        <span className="it-key">👆 Swipe ←→</span>
                                        <span>Zmiana ćwiczenia (dotyk)</span>
                                    </div>
                                </div>
                            </div>

                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}