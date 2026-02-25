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

// ─── Helper: create AudioContext with webkit fallback ─────────────────────────
function createAudioContext() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const AudioCtx = window.AudioContext || (window).webkitAudioContext;
    return new AudioCtx();
}

const defaultExercises = [
    { id: 1, name: "Burpees",           sets: 4, workTime: 40, restTime: 20, load: 0  },
    { id: 2, name: "Kettlebell Swings", sets: 3, workTime: 30, restTime: 30, load: 24 },
    { id: 3, name: "Push-ups",          sets: 3, workTime: 45, restTime: 15, load: 0  },
];

let nextId = 10;
const generateId = () => nextId++;

function formatTime(rawSeconds) {
    const safe     = Math.max(0, rawSeconds);
    const totalSec = Math.floor(safe);
    const m        = Math.floor(totalSec / 60);
    const s        = totalSec % 60;
    const ms       = Math.floor((safe % 1) * 100);
    return {
        whole: `${m}:${String(s).padStart(2, "0")}`,
        ms:    String(ms).padStart(2, "0"),
    };
}

// ─── Named export so the module is never "unused" from bundler perspective ────
export function IntervalTimerWidget() {
    return <IntervalTimer />;
}

function IntervalTimer() {

    const [exercises,     setExercises]     = useState(defaultExercises);
    const [currentExIdx,  setCurrentExIdx]  = useState(0);
    const [currentSet,    setCurrentSet]    = useState(1);
    const [phase,         setPhase]         = useState("idle");
    const [timeLeftRaw,   setTimeLeftRaw]   = useState(0);
    const [isRunning,     setIsRunning]     = useState(false);
    const [isFullscreen,  setIsFullscreen]  = useState(false);
    const [bgColor,       setBgColor]       = useState("");
    const [showSettings,  setShowSettings]  = useState(false);
    const [soundEnabled,  setSoundEnabled]  = useState(true);
    const [selectedSound, setSelectedSound] = useState("beep");
    const [editingEx,     setEditingEx]     = useState(null);
    const [openSections,  setOpenSections]  = useState({ sound: true, exercises: true, shortcuts: false });
    const toggleSection = (key) => setOpenSections((s) => ({ ...s, [key]: !s[key] }));

    const audioCtxRef       = useRef(null);
    const startTimestampRef = useRef(null);
    const animFrameRef      = useRef(null);
    const wakeLockRef       = useRef(null);
    const containerRef      = useRef(null);
    const touchStartRef     = useRef(null);

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

    const totalDuration = useMemo(() => {
        if (!currentEx) return 1;
        return phase === "work" ? currentEx.workTime : currentEx.restTime;
    }, [currentEx, phase]);

    const progress = (phase === "idle" || phase === "done")
        ? 0
        : totalDuration > 0 ? ((totalDuration - timeLeftRaw) / totalDuration) * 100 : 0;

    const playSound = useCallback(() => {
        if (!soundEnabledRef.current) return;
        try {
            if (!audioCtxRef.current) audioCtxRef.current = createAudioContext();
            SOUNDS[selectedSoundRef.current]?.(audioCtxRef.current);
        } catch (_) {}
    }, []);

    // ─── Wake Lock ────────────────────────────────────────────────────────────
    const acquireWakeLock = useCallback(() => {
        if ("wakeLock" in navigator) {
            navigator.wakeLock.request("screen")
                .then((lock) => { wakeLockRef.current = lock; })
                .catch(() => {});
        }
    }, []);

    const releaseWakeLock = useCallback(() => {
        if (wakeLockRef.current) {
            wakeLockRef.current.release().catch(() => {});
            wakeLockRef.current = null;
        }
    }, []);

    useEffect(() => {
        const fn = () => { if (document.visibilityState === "visible" && isRunning) acquireWakeLock(); };
        document.addEventListener("visibilitychange", fn);
        return () => document.removeEventListener("visibilitychange", fn);
    }, [isRunning, acquireWakeLock]);

    const tickRef = useRef(null);
    const startTickFn = useCallback((duration) => {
        cancelAnimationFrame(animFrameRef.current);
        startTimestampRef.current = { t: performance.now(), dur: duration };
        setTimeLeftRaw(duration);
        animFrameRef.current = requestAnimationFrame(() => tickRef.current?.());
    }, []);

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
        playSound();
        const exs = exercisesRef.current;
        const idx = currentExIdxRef.current;
        const set = currentSetRef.current;
        const ph  = phaseRef.current;
        const ex  = exs[idx];
        const switchPhase = (p) => { phaseRef.current = p; setPhase(p); };
        const switchIdx   = (i) => { currentExIdxRef.current = i; setCurrentExIdx(i); };
        const switchSet   = (s) => { currentSetRef.current = s; setCurrentSet(s); };
        const finish = () => {
            setPhase("done");
            setIsRunning(false);
            releaseWakeLock();
        };
        const nextEx = () => {
            const nex = exs[idx + 1];
            switchIdx(idx + 1); switchSet(1); switchPhase("work"); startTickFn(nex.workTime);
        };
        if (ph === "work") {
            if (ex.restTime > 0)           { switchPhase("rest"); startTickFn(ex.restTime); }
            else if (set < ex.sets)        { switchSet(set + 1); switchPhase("work"); startTickFn(ex.workTime); }
            else if (idx + 1 < exs.length) { nextEx(); }
            else                           { finish(); }
        } else {
            if (set < ex.sets)             { switchSet(set + 1); switchPhase("work"); startTickFn(ex.workTime); }
            else if (idx + 1 < exs.length) { nextEx(); }
            else                           { finish(); }
        }
    };

    const handleStart = useCallback(() => {
        const ph = phaseRef.current;
        const ex = exercisesRef.current[currentExIdxRef.current];
        if (ph === "idle" || ph === "done") {
            if (ph === "done") {
                setCurrentExIdx(0); setCurrentSet(1); setPhase("work");
                startTickFn(exercisesRef.current[0].workTime);
            } else {
                setPhase("work");
                startTickFn(ex.workTime);
            }
        } else {
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
        const ex = exercisesRef.current[currentExIdxRef.current];
        currentSetRef.current = 1;   setCurrentSet(1);
        phaseRef.current = "idle";   setPhase("idle");
        setTimeLeftRaw(ex ? ex.workTime : 0);
        setIsRunning(false);
        releaseWakeLock();
    }, [releaseWakeLock]);

    const stopAndReset = useCallback(() => {
        cancelAnimationFrame(animFrameRef.current);
        startTimestampRef.current = null;
        setIsRunning(false);
        phaseRef.current = "idle"; setPhase("idle");
        setTimeLeftRaw(0);
    }, []);

    const navigateTo = useCallback((newIdx, newSet) => {
        cancelAnimationFrame(animFrameRef.current);
        startTimestampRef.current = null;
        currentExIdxRef.current = newIdx; currentSetRef.current = newSet;
        setCurrentExIdx(newIdx); setCurrentSet(newSet);
        if (isRunning) {
            phaseRef.current = "work"; setPhase("work");
            startTickFn(exercisesRef.current[newIdx].workTime);
        } else {
            phaseRef.current = "idle"; setPhase("idle"); setTimeLeftRaw(0);
        }
    }, [isRunning, startTickFn]);

    const goNext = useCallback(() => {
        const exs = exercisesRef.current;
        const idx = currentExIdxRef.current;
        const set = currentSetRef.current;
        const ex  = exs[idx];
        if (set < ex.sets)             navigateTo(idx, set + 1);
        else if (idx + 1 < exs.length) navigateTo(idx + 1, 1);
    }, [navigateTo]);

    const goPrev = useCallback(() => {
        const exs = exercisesRef.current;
        const idx = currentExIdxRef.current;
        const set = currentSetRef.current;
        if (set > 1)      navigateTo(idx, set - 1);
        else if (idx > 0) navigateTo(idx - 1, exs[idx - 1].sets);
    }, [navigateTo]);

    const jumpToExercise = useCallback((idx) => {
        stopAndReset();
        setCurrentExIdx(idx); setCurrentSet(1);
    }, [stopAndReset]);

    // ─── Fullscreen ───────────────────────────────────────────────────────────
    const toggleFullscreen = useCallback(() => {
        if (!document.fullscreenElement) {
            const theme = document.documentElement.getAttribute("data-theme");
            setBgColor(theme === "dark" ? "#1b1b1d" : "#ffffff");
            containerRef.current?.requestFullscreen?.().catch(() => {});
            setIsFullscreen(true);
        } else {
            document.exitFullscreen?.().catch(() => {});
            setIsFullscreen(false);
        }
    }, []);

    useEffect(() => {
        const fn = () => setIsFullscreen(!!document.fullscreenElement);
        document.addEventListener("fullscreenchange", fn);
        return () => document.removeEventListener("fullscreenchange", fn);
    }, []);

    useEffect(() => {
        const fn = (e) => {
            if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;
            switch (e.key) {
                case " ":           e.preventDefault(); isRunning ? handleStop() : handleStart(); break;
                case "ArrowRight":  goNext(); break;
                case "ArrowLeft":   goPrev(); break;
                case "r": case "R": handleReset(); break;
                case "f": case "F": toggleFullscreen(); break;
                case "m": case "M": setSoundEnabled((s) => !s); break;
                case "Escape":      setShowSettings(false); break;
                default: break;
            }
        };
        window.addEventListener("keydown", fn);
        return () => window.removeEventListener("keydown", fn);
    }, [isRunning, handleStart, handleStop, goPrev, goNext, handleReset, toggleFullscreen]);

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

    const css = `
    @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&display=swap');

    .it-root {
      --it-bg:      var(--ifm-background-color, #fff);
      --it-surface: var(--ifm-background-surface-color, #f6f7f8);
      --it-surf2:   var(--ifm-color-emphasis-100, #efefef);
      --it-border:  var(--ifm-color-emphasis-300, #c8c8c8);
      --it-text:    var(--ifm-font-color-base, #1c1e21);
      --it-muted:   var(--ifm-color-emphasis-600, #72767d);
      --it-primary: var(--ifm-color-primary, #2e8540);
      --it-work:    #f97316;
      --it-rest:    #0ea5e9;
      --it-accent:  ${phaseAccent};
      font-family: var(--ifm-font-family-base, system-ui, sans-serif);
      background: var(--it-bg);
      color: var(--it-text);
      min-height: 100vh;
      user-select: none;
      position: relative;
    }
    .it-root * { box-sizing: border-box; }

    .it-main {
      display: flex; flex-direction: column;
      align-items: center; min-height: 100vh;
      padding: 16px; gap: 14px; position: relative;
      background: var(--ifm-background-color);
    }

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

    .it-ex-info { width: 100%; max-width: 560px; text-align: center; }
    .it-ex-name { font-size: clamp(24px, 7vw, 44px); font-weight: 700; letter-spacing: 0.5px; line-height: 1.1; }
    .it-ex-meta {
      display: flex; gap: 14px; justify-content: center; flex-wrap: wrap;
      margin-top: 6px; color: var(--it-text); font-size: 13px;
    }
    .it-ex-meta span { display: flex; align-items: center; gap: 4px; }
    .it-load-badge {
      background: var(--it-surf2); border: 1px solid var(--it-border);
      border-radius: 8px; padding: 2px 10px; font-size: 12px;
    }

    .it-timer-wrap {
      display: flex; flex-direction: column; align-items: center;
      gap: 10px; width: 100%; max-width: 560px;
    }
    .it-timer-digits {
      display: flex; align-items: baseline;
      color: var(--it-accent); transition: color .4s;
      filter: drop-shadow(0 0 24px color-mix(in srgb, var(--it-accent) 30%, transparent));
      line-height: 1;
    }
    .it-timer-whole { font-family: 'Bebas Neue', sans-serif; font-size: clamp(80px, 22vw, 140px); letter-spacing: -2px; }
    .it-timer-dot   { font-family: 'Bebas Neue', sans-serif; font-size: clamp(40px, 11vw, 70px); opacity: 0.55; margin: 0 1px 4px; }
    .it-timer-ms    { font-family: 'Bebas Neue', sans-serif; font-size: clamp(50px, 13vw, 88px); opacity: 0.65; margin-bottom: 6px; min-width: 2ch; letter-spacing: -1px; }
    .it-progress-track { width: 100%; height: 10px; background: var(--it-surf2); border-radius: 99px; overflow: hidden; }
    .it-progress-fill {
      height: 100%; border-radius: 99px; background: var(--it-accent);
      transition: width .06s linear, background .4s;
      box-shadow: 0 0 8px color-mix(in srgb, var(--it-accent) 55%, transparent);
    }
    .it-phase-label {
      font-size: clamp(22px, 4vw, 36px); font-weight: 700;
      letter-spacing: 4px; text-transform: uppercase;
      color: var(--it-accent); transition: color .4s;
      margin-top: 6px; text-align: center;
    }

    .it-sets { display: flex; gap: 8px; justify-content: center; flex-wrap: wrap; }
    .it-set-dot {
      width: 28px; height: 8px; border-radius: 4px;
      background: var(--it-surf2); border: 1px solid var(--it-border);
      transition: background .2s, border-color .2s;
    }
    .it-set-dot.done   { background: var(--it-work); border-color: var(--it-work); }
    .it-set-dot.active { background: var(--it-accent); border-color: var(--it-accent); box-shadow: 0 0 8px color-mix(in srgb, var(--it-accent) 50%, transparent); }

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
      background: var(--it-surf2); color: #ef4444; border: 1px solid #ef4444; box-shadow: none;
    }
    .it-btn-main.pause:hover { background: color-mix(in srgb, #ef4444 8%, var(--it-surf2)); }

    .it-btn-reset {
      width: 56px; height: 56px; border-radius: 14px; flex-shrink: 0;
      border: 1px solid #d97706; background: var(--it-surf2); color: #d97706;
      cursor: pointer; display: flex; align-items: center; justify-content: center;
      transition: background .15s, box-shadow .15s, transform .1s;
    }
    .it-btn-reset:hover {
      background: color-mix(in srgb, #d97706 10%, var(--it-surf2));
      box-shadow: 0 4px 14px color-mix(in srgb, #d97706 30%, transparent);
      transform: translateY(-1px);
    }
    .it-btn-reset:active { transform: translateY(1px); }

    .it-done { text-align: center; padding: 24px 0; }
    .it-done-emoji { font-size: 60px; }
    .it-done-text { font-size: 40px; font-weight: 800; letter-spacing: 1px; color: var(--it-primary); margin: 8px 0; }

    .it-ex-inline-list { width: 100%; max-width: 560px; display: flex; flex-direction: column; gap: 6px; }
    .it-ex-inline-title {
      font-size: 11px; font-weight: 700; letter-spacing: 2px;
      text-transform: uppercase; color: var(--it-muted); margin-bottom: 2px;
    }
    .it-ex-inline-item {
      display: flex; align-items: center; gap: 10px; padding: 10px 12px; border-radius: 10px;
      border: 1px solid var(--it-border); background: var(--it-surf2);
      cursor: pointer; transition: border-color .15s;
    }
    .it-ex-inline-item:hover   { border-color: var(--it-accent); }
    .it-ex-inline-item.current {
      border-color: var(--it-accent);
      background: color-mix(in srgb, var(--it-accent) 7%, var(--it-surf2));
    }
    .it-ex-inline-num {
      width: 24px; height: 24px; border-radius: 6px; background: var(--it-border); flex-shrink: 0;
      display: flex; align-items: center; justify-content: center;
      font-size: 11px; font-weight: 700; color: var(--it-muted);
    }
    .it-ex-inline-item.current .it-ex-inline-num { background: var(--it-accent); color: #fff; }
    .it-ex-inline-info { flex: 1; min-width: 0; }
    .it-ex-inline-info .name { font-weight: 600; font-size: 13px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .it-ex-inline-info .meta { font-size: 11px; color: var(--it-muted); margin-top: 1px; }
    .it-ex-inline-sets { display: flex; gap: 3px; flex-shrink: 0; }
    .it-ex-inline-dot { width: 18px; height: 5px; border-radius: 3px; background: var(--it-border); border: 1px solid var(--it-border); }
    .it-ex-inline-dot.done   { background: var(--it-work); border-color: var(--it-work); }
    .it-ex-inline-dot.active { background: var(--it-accent); border-color: var(--it-accent); }

    .it-settings-overlay {
      position: fixed; inset: 0; z-index: 60;
      background: rgba(0,0,0,.5); backdrop-filter: blur(6px);
      display: flex; align-items: center; justify-content: center; padding: 16px;
    }
    .it-settings-panel {
      width: 100%; max-width: 600px;
      max-height: 90vh; max-height: 90svh; max-height: 90dvh;
      background: var(--it-surface); border-radius: 20px;
      border: 1px solid var(--it-border);
      overflow-y: auto; display: flex; flex-direction: column;
      scrollbar-width: none; -ms-overflow-style: none;
    }
    .it-settings-panel::-webkit-scrollbar { display: none; }
    .it-settings-header {
      padding: 18px 20px 14px; display: flex; justify-content: space-between; align-items: center;
      position: sticky; top: 0; background: var(--it-surface); border-bottom: 1px solid var(--it-border); z-index: 1;
    }
    .it-settings-header h2 { font-size: 22px; font-weight: 700; letter-spacing: 0; margin: 0; }
    .it-close-btn {
      background: none; border: 1px solid var(--it-border); color: var(--it-muted);
      border-radius: 8px; width: 32px; height: 32px; cursor: pointer; font-size: 18px;
      display: flex; align-items: center; justify-content: center; transition: border-color .15s, color .15s;
    }
    .it-close-btn:hover { color: var(--it-text); border-color: var(--it-text); }
    .it-settings-body { padding: 20px; display: flex; flex-direction: column; gap: 24px; }
    .it-section-title { font-size: 11px; font-weight: 700; letter-spacing: 2px; color: var(--it-muted); margin-bottom: 10px; text-transform: uppercase; border-bottom: 1px solid var(--it-border); display: flex; justify-content: space-between; align-items: center; padding-bottom: 6px; cursor: pointer; user-select: none; }
    .it-section-title:hover { color: var(--it-text); }
    .it-sound-toggle-row { display: flex; align-items: center; justify-content: space-between; padding: 10px 0; }
    .it-sound-toggle-row label { font-size: 14px; font-weight: 600; cursor: default; }
    .it-toggle { width: 44px; height: 24px; background: var(--it-surf2); border-radius: 12px; border: 1px solid var(--it-border); cursor: pointer; position: relative; transition: background .2s, border-color .2s; flex-shrink: 0; }
    .it-toggle.on { background: var(--it-primary); border-color: var(--it-primary); }
    .it-toggle::after { content: ''; position: absolute; top: 2px; left: 2px; width: 18px; height: 18px; border-radius: 50%; background: #fff; transition: transform .2s; box-shadow: 0 1px 3px rgba(0,0,0,.25); }
    .it-toggle.on::after { transform: translateX(20px); }
    .it-sound-label { margin-top: 12px; margin-bottom: 6px; font-size: 13px; color: var(--it-muted); }
    .it-sound-grid  { display: grid; grid-template-columns: repeat(2,1fr); gap: 8px; }
    .it-sound-option { padding: 8px 12px; border-radius: 10px; border: 1px solid var(--it-border); background: var(--it-surf2); color: var(--it-muted); cursor: pointer; font-size: 13px; text-align: center; transition: color .15s, border-color .15s, background .15s; }
    .it-sound-option.selected { border-color: var(--it-primary); color: var(--it-primary); background: color-mix(in srgb, var(--it-primary) 8%, var(--it-surf2)); }
    .it-sound-option:hover { color: var(--it-text); }
    .it-ex-card { border: 1px solid var(--it-border); border-radius: 14px; background: var(--it-surf2); overflow: hidden; }
    .it-ex-card-header { display: flex; align-items: center; gap: 10px; padding: 12px 14px; cursor: pointer; transition: background .15s; }
    .it-ex-card-header:hover { background: color-mix(in srgb, var(--it-border) 25%, transparent); }
    .it-ex-card-title { flex: 1; font-weight: 600; font-size: 14px; }
    .it-ex-card-body  { padding: 0 14px 14px; }
    .it-field-row { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 10px; }
    .it-field { display: flex; flex-direction: column; gap: 4px; }
    .it-field label { font-size: 10px; font-weight: 700; letter-spacing: 1px; color: var(--it-muted); text-transform: uppercase; }
    .it-field input { background: var(--it-bg); border: 1px solid var(--it-border); border-radius: 8px; color: var(--it-text); padding: 8px 10px; font-size: 14px; font-family: inherit; width: 100%; outline: none; transition: border-color .15s; }
    .it-field input:focus { border-color: var(--it-primary); }
    .it-field input[type="text"] { font-family: var(--ifm-font-family-base, system-ui); }
    .it-field input::-webkit-inner-spin-button, .it-field input::-webkit-outer-spin-button { -webkit-appearance: none; }
    .it-field input[type="number"] { -moz-appearance: textfield; }
    .it-full-field { grid-column: 1 / -1; }
    .it-del-btn { width: 28px; height: 28px; border-radius: 8px; border: 1px solid var(--it-border); background: transparent; color: var(--it-muted); cursor: pointer; font-size: 16px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; transition: background .15s, border-color .15s, color .15s; }
    .it-del-btn:hover { background: rgba(239,68,68,.1); border-color: #ef4444; color: #ef4444; }
    .it-add-btn { width: 100%; padding: 12px; border-radius: 12px; border: 1px dashed var(--it-border); background: transparent; color: var(--it-muted); cursor: pointer; font-size: 14px; transition: border-color .15s, color .15s; }
    .it-add-btn:hover { border-color: var(--it-primary); color: var(--it-primary); }
    .it-shortcuts { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; }
    .it-shortcut  { display: flex; align-items: center; gap: 8px; font-size: 12px; color: var(--it-muted); }
    .it-key { background: var(--it-surf2); border: 1px solid var(--it-border); border-radius: 5px; padding: 2px 7px; font-size: 11px; color: var(--it-text); white-space: nowrap; }

    .it-root.is-fs {
      overflow: auto;
      -webkit-overflow-scrolling: touch;
    }
    .it-root.is-fs .it-main {
      min-height: 100vh; padding: 0;
      background: var(--ifm-background-color, #ffffff);
      display: flex; flex-direction: column;
    }
    .it-root.is-fs .it-topbar {
      position: absolute; top: 16px; left: 0; right: 0;
      max-width: unset; z-index: 20; padding: 0 24px;
    }
    .it-root.is-fs .it-topbar .it-icon-btn {
      width: 52px; height: 52px; border-radius: 14px; font-size: 22px; flex-shrink: 0;
    }
    .it-center-block { display: contents; }
    .it-root.is-fs .it-center-block {
      display: flex; flex-direction: column;
      align-items: center; justify-content: center;
      gap: 20px; flex: 1; width: 100%;
      padding: 80px 32px 16px;
    }
    .it-root.is-fs .it-ex-inline-list { max-width: 780px; }
    .it-root.is-fs .it-ex-info { max-width: 780px; }
    .it-root.is-fs .it-ex-name { font-size: clamp(36px, 5vw, 64px); }
    .it-root.is-fs .it-ex-meta { font-size: 16px; gap: 20px; }
    .it-root.is-fs .it-timer-wrap { max-width: 780px; gap: 14px; }
    .it-root.is-fs .it-timer-whole { font-size: clamp(140px, 22vw, 220px); }
    .it-root.is-fs .it-timer-dot   { font-size: clamp(70px, 11vw, 110px); }
    .it-root.is-fs .it-timer-ms    { font-size: clamp(90px, 14vw, 150px); }
    .it-root.is-fs .it-sets { gap: 10px; }
    .it-root.is-fs .it-set-dot { width: 40px; height: 10px; }
    .it-root.is-fs .it-controls { max-width: 780px; gap: 14px; }
    .it-root.is-fs .it-nav-btn { width: 68px; height: 68px; border-radius: 16px; font-size: 26px; }
    .it-root.is-fs .it-btn-main { height: 68px; font-size: 20px; border-radius: 18px; }
    .it-root.is-fs .it-btn-reset { width: 68px; height: 68px; border-radius: 16px; }

    @media (max-width: 480px) { .it-main { padding: 10px; gap: 10px; } }
    .it-root ::-webkit-scrollbar { width: 4px; }
    .it-root ::-webkit-scrollbar-track { background: var(--it-bg); }
    .it-root ::-webkit-scrollbar-thumb { background: var(--it-border); border-radius: 2px; }
    .it-root.is-fs ::-webkit-scrollbar { display: none; }
    .it-root.is-fs { scrollbar-width: none; }
  `;

    const svgFS = isFullscreen
        ? <><path d="M8 3v3a2 2 0 0 1-2 2H3"/><path d="M21 8h-3a2 2 0 0 1-2-2V3"/><path d="M3 16h3a2 2 0 0 1 2 2v3"/><path d="M16 21v-3a2 2 0 0 1 2-2h3"/></>
        : <><path d="M8 3H5a2 2 0 0 0-2 2v3"/><path d="M21 8V5a2 2 0 0 0-2-2h-3"/><path d="M3 16v3a2 2 0 0 0 2 2h3"/><path d="M16 21h3a2 2 0 0 0 2-2v-3"/></>;

    const svgGear = (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="3"/>
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
        </svg>
    );

    return (
        <div className={`it-root ${isFullscreen ? "is-fs" : "no-fs"}`} ref={containerRef}>
            <style>{css}</style>

            <div className="it-main" style={isFullscreen && bgColor ? { background: bgColor } : undefined}>

                <div className="it-topbar">
                    <button className="it-icon-btn" onClick={toggleFullscreen} title="Pełny ekran (F)">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">{svgFS}</svg>
                    </button>
                    <div style={{ flex: 1 }} />
                    <button className="it-icon-btn" onClick={() => setShowSettings(true)} title="Ustawienia">
                        {svgGear}
                    </button>
                </div>

                <div className="it-center-block">

                    <div className="it-ex-info">
                        {currentEx && (
                            <>
                                <div className="it-ex-name">{currentEx.name}</div>
                                <div className="it-ex-meta">
                                    <span>{currentEx.workTime}s praca&nbsp;/&nbsp;{currentEx.restTime}s odpoczynek</span>
                                    {currentEx.load > 0 && <span className="it-load-badge">{currentEx.load} kg</span>}
                                </div>
                            </>
                        )}
                    </div>

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
                        <div className="it-phase-label">{phaseLabel}</div>
                    </div>

                    {currentEx && (
                        <div className="it-sets">
                            {Array.from({ length: currentEx.sets }).map((_, i) => (
                                <div key={i} className={`it-set-dot ${i+1 < currentSet ? "done" : i+1 === currentSet ? "active" : ""}`} />
                            ))}
                        </div>
                    )}

                    <div style={{ fontSize: 12, color: "var(--it-text)", letterSpacing: 1 }}>
                        SERIA {currentSet}&nbsp;/&nbsp;{currentEx?.sets}
                        &nbsp;·&nbsp;
                        ĆWICZENIE {currentExIdx + 1}&nbsp;/&nbsp;{exercises.length}
                    </div>

                    <div className="it-controls">
                        <button className="it-nav-btn" onClick={goPrev}
                                disabled={currentExIdx === 0 && currentSet === 1} title="Poprzednie (←)">◀</button>

                        <button className={`it-btn-main ${isRunning ? "pause" : "play"}`}
                                onClick={isRunning ? handleStop : handleStart}>
                            {isRunning ? "⏸ PAUZA" : phase === "idle" ? "▶ START" : phase === "done" ? "↺ PONÓW" : "▶ WZNÓW"}
                        </button>

                        <button className="it-btn-reset" onClick={handleReset} title="Restart ćwiczenia (R)">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <polyline points="1 4 1 10 7 10"/>
                                <path d="M3.51 15a9 9 0 1 0 .49-4.5"/>
                            </svg>
                        </button>

                        <button className="it-nav-btn" onClick={goNext}
                                disabled={currentExIdx === exercises.length - 1 && currentSet === (exercises[currentExIdx]?.sets ?? 1)}
                                title="Następne (→)">▶</button>
                    </div>

                    <div className="it-ex-inline-list">
                        <div className="it-ex-inline-title">Ćwiczenia</div>
                        {exercises.map((ex, idx) => {
                            const isCurrent = idx === currentExIdx;
                            return (
                                <div key={ex.id}
                                     className={`it-ex-inline-item ${isCurrent ? "current" : ""}`}
                                     onClick={() => jumpToExercise(idx)}>
                                    <div className="it-ex-inline-num">{idx + 1}</div>
                                    <div className="it-ex-inline-info">
                                        <div className="name">{ex.name}</div>
                                        <div className="meta">{ex.workTime}s&nbsp;/&nbsp;{ex.restTime}s odpoczynku{ex.load > 0 ? ` · ${ex.load}kg` : ""}</div>
                                    </div>
                                    <div className="it-ex-inline-sets">
                                        {Array.from({ length: ex.sets }).map((_, s) => (
                                            <div key={s} className={`it-ex-inline-dot ${isCurrent ? s+1 < currentSet ? "done" : s+1 === currentSet ? "active" : "" : ""}`} />
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                </div>
            </div>

            {showSettings && (
                <div className="it-settings-overlay" onClick={() => setShowSettings(false)}>
                    <div className="it-settings-panel" onClick={(e) => e.stopPropagation()}>
                        <div className="it-settings-header">
                            <h2>USTAWIENIA</h2>
                            <button className="it-close-btn" onClick={() => setShowSettings(false)}>×</button>
                        </div>
                        <div className="it-settings-body">

                            <div>
                                <div className="it-section-title" onClick={() => toggleSection("sound")}>
                                    <span>🔊 Dźwięk</span>
                                    <span>{openSections.sound ? "▲" : "▼"}</span>
                                </div>
                                {openSections.sound && (
                                    <>
                                        <div className="it-sound-toggle-row">
                                            <label>Dźwięk zmiany ćwiczenia</label>
                                            <div className={`it-toggle ${soundEnabled ? "on" : ""}`}
                                                 onClick={() => setSoundEnabled((s) => !s)} title="Wycisz / Dźwięk (M)" />
                                        </div>
                                        {soundEnabled && (
                                            <>
                                                <p className="it-sound-label">Wybierz dźwięk:</p>
                                                <div className="it-sound-grid">
                                                    {Object.keys(SOUNDS).map((s) => (
                                                        <button key={s}
                                                                className={`it-sound-option ${selectedSound === s ? "selected" : ""}`}
                                                                onClick={() => {
                                                                    setSelectedSound(s);
                                                                    if (!audioCtxRef.current)
                                                                        audioCtxRef.current = createAudioContext();
                                                                    SOUNDS[s](audioCtxRef.current);
                                                                }}>
                                                            {s.charAt(0).toUpperCase() + s.slice(1)}
                                                        </button>
                                                    ))}
                                                </div>
                                            </>
                                        )}
                                    </>
                                )}
                            </div>

                            <div>
                                <div className="it-section-title" onClick={() => toggleSection("exercises")}>
                                    <span>🏋️ Ćwiczenia</span>
                                    <span>{openSections.exercises ? "▲" : "▼"}</span>
                                </div>
                                {openSections.exercises && (
                                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                                        {exercises.map((ex, idx) => (
                                            <div key={ex.id} className="it-ex-card">
                                                <div className="it-ex-card-header"
                                                     onClick={() => setEditingEx(editingEx === ex.id ? null : ex.id)}>
                                                    <span style={{ color: "var(--it-muted)", fontSize: 12, fontFamily: "'JetBrains Mono'", width: 20 }}>{idx + 1}</span>
                                                    <span className="it-ex-card-title">{ex.name}</span>
                                                    <span style={{ color: "var(--it-muted)", fontSize: 11 }}>{ex.sets}×{ex.workTime}s</span>
                                                    <button className="it-del-btn"
                                                            onClick={(e) => { e.stopPropagation(); removeExercise(ex.id); }}>×</button>
                                                    <span style={{ color: "var(--it-muted)", fontSize: 12 }}>{editingEx === ex.id ? "▲" : "▼"}</span>
                                                </div>
                                                {editingEx === ex.id && (
                                                    <div className="it-ex-card-body">
                                                        <div className="it-field-row">
                                                            <div className="it-field it-full-field">
                                                                <label>Nazwa</label>
                                                                <input type="text" value={ex.name} onChange={(e) => updateExercise(ex.id, "name", e.target.value)} />
                                                            </div>
                                                            <div className="it-field">
                                                                <label>Serie</label>
                                                                <input type="number" min="1" max="20" value={ex.sets} onChange={(e) => updateExercise(ex.id, "sets", parseInt(e.target.value) || 1)} />
                                                            </div>
                                                            <div className="it-field">
                                                                <label>Obciążenie (kg)</label>
                                                                <input type="number" min="0" step="0.5" value={ex.load} onChange={(e) => updateExercise(ex.id, "load", parseFloat(e.target.value) || 0)} />
                                                            </div>
                                                            <div className="it-field">
                                                                <label>Czas pracy (s)</label>
                                                                <input type="number" min="1" max="600" value={ex.workTime} onChange={(e) => updateExercise(ex.id, "workTime", parseInt(e.target.value) || 1)} />
                                                            </div>
                                                            <div className="it-field">
                                                                <label>Czas przerwy (s)</label>
                                                                <input type="number" min="0" max="600" value={ex.restTime} onChange={(e) => updateExercise(ex.id, "restTime", parseInt(e.target.value) || 0)} />
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                        <button className="it-add-btn" onClick={addExercise}>+ Dodaj ćwiczenie</button>
                                    </div>
                                )}
                            </div>

                            <div>
                                <div className="it-section-title" onClick={() => toggleSection("shortcuts")}>
                                    <span>⌨️ Skróty klawiaturowe</span>
                                    <span>{openSections.shortcuts ? "▲" : "▼"}</span>
                                </div>
                                {openSections.shortcuts && (
                                    <div className="it-shortcuts">
                                        {[
                                            ["Spacja", "Start / Pauza"],
                                            ["R",      "Restart ćwiczenia"],
                                            ["F",      "Pełny ekran"],
                                            ["M",      "Wycisz / Dźwięk"],
                                            ["←",     "Poprzednia seria"],
                                            ["→",     "Następna seria"],
                                            ["Esc",   "Zamknij panel"],
                                        ].map(([key, desc]) => (
                                            <div key={key} className="it-shortcut">
                                                <span className="it-key">{key}</span>
                                                <span>{desc}</span>
                                            </div>
                                        ))}
                                        <div className="it-shortcut" style={{ gridColumn: "1/-1" }}>
                                            <span className="it-key">👆 Swipe ←→</span>
                                            <span>Zmiana serii (dotyk)</span>
                                        </div>
                                    </div>
                                )}
                            </div>

                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default IntervalTimer;