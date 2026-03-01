import React, { useEffect, useRef, useState } from 'react';

/*
  FlameSlides — scroll scrubbing + snap to slides + slide-in text (no crossfade)
  - scroll snaps to nearest slide when user stops scrolling
  - text animates in from outside (clip-path + translate), no opacity crossfade
  - video.currentTime driven by scroll progress
*/

const VIDEO_URL = 'https://cdn.jsdelivr.net/gh/ElTarzano/media/output_scrub.mp4';

const SLIDES = [
    { eyebrow: '01', heading: ['Stories that', 'Move People'],  body: 'We transform complicated ideas into simple, human, and impactful narratives.' },
    { eyebrow: '02', heading: ['Bold', 'Marketing'],            body: 'Helping brands discover what makes them unique and capturing it through video.' },
    { eyebrow: '03', heading: ['Winning', 'Campaigns'],         body: 'Every frame is crafted to change the way your audience thinks and feels.' },
    { eyebrow: '04', heading: ['Made With', 'Passion'],         body: 'A dedicated creative team that treats every project as their most important one.' },
    { eyebrow: '05', heading: ['Start', 'Something'],           body: "Ready to find your fascinating? Let's create something unforgettable together." },
];

const STYLE = `
.fs-root {
  background: #0a0a0a;
  color: #f0ede6;
  font-family: inherit;
  position: relative;
}

.fs-scroll-space {
  height: 500vh;
  position: relative;
}

.fs-sticky {
  position: sticky;
  top: 0;
  height: 100vh;
  overflow: hidden;
}

.fs-video {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.fs-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    to bottom,
    rgba(0,0,0,0.35) 0%,
    rgba(0,0,0,0.15) 40%,
    rgba(0,0,0,0.55) 100%
  );
}

/* ── text container ── */
.fs-slides-wrapper {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
  overflow: hidden;
}

.fs-slide {
  position: absolute;
  text-align: center;
  max-width: 720px;
  width: 100%;
  padding: 0 2rem;
}

.fs-eyebrow {
  font-family: inherit;
  font-size: clamp(9px, 1.1vw, 12px);
  letter-spacing: 0.3em;
  text-transform: uppercase;
  color: var(--ifm-color-primary);
  margin-bottom: 1rem;
  overflow: hidden;
}

.fs-eyebrow-inner {
  display: block;
  transform: translateY(100%);
  transition: transform 0.55s cubic-bezier(0.16, 1, 0.3, 1);
}

/* each heading line clips independently */
.fs-heading-line {
  display: block;
  overflow: hidden;
  line-height: 1;
}

.fs-heading-line-inner {
  display: block;
  font-size: clamp(2.5rem, 7.5vw, 6.5rem);
  font-weight: 800;
  letter-spacing: -0.04em;
  text-shadow: 0 2px 10px rgba(0,0,0,0.6);
  /* default: hidden below */
  transform: translateY(110%);
  transition: transform 0.65s cubic-bezier(0.16, 1, 0.3, 1);
}

/* stagger lines */
.fs-heading-line:nth-child(2) .fs-heading-line-inner {
  transition-delay: 0.08s;
}

.fs-body-wrap {
  overflow: hidden;
  margin-top: 1.4rem;
}

.fs-body-inner {
  font-size: clamp(0.95rem, 1.5vw, 1.2rem);
  line-height: 1.7;
  color: rgba(240,237,230,0.75);
  max-width: 480px;
  margin: 0 auto;
  text-shadow: 0 1px 12px rgba(0,0,0,0.5);
  transform: translateY(100%);
  transition: transform 0.65s cubic-bezier(0.16, 1, 0.3, 1) 0.15s;
}

/* ── active state: slide everything in ── */
.fs-slide.is-active .fs-eyebrow-inner,
.fs-slide.is-active .fs-heading-line-inner,
.fs-slide.is-active .fs-body-inner {
  transform: translateY(0);
}

/* ── exit: slide out upward ── */
.fs-slide.is-exit .fs-eyebrow-inner,
.fs-slide.is-exit .fs-heading-line-inner,
.fs-slide.is-exit .fs-body-inner {
  transform: translateY(-110%);
  transition-duration: 0.45s;
  transition-timing-function: cubic-bezier(0.7, 0, 0.84, 0);
}

/* ── loader ── */
.fs-loader {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: #0a0a0a;
  gap: 1.2rem;
  z-index: 30;
  transition: opacity 0.6s ease;
}
.fs-loader.hidden {
  opacity: 0;
  pointer-events: none;
}
.fs-loader-bar-track {
  width: 200px;
  height: 2px;
  background: rgba(255,255,255,0.12);
  border-radius: 2px;
  overflow: hidden;
}
.fs-loader-bar {
  height: 100%;
  background: var(--ifm-color-primary);
  border-radius: 2px;
  transition: width 0.2s ease;
}
.fs-loader-label {
  font-family: inherit;
  font-size: 11px;
  letter-spacing: 0.2em;
  color: rgba(240,237,230,0.4);
  text-transform: uppercase;
}

/* ── progress bar ── */
.fs-progress-bar {
  position: absolute;
  bottom: 0;
  left: 0;
  height: 3px;
  background: var(--ifm-color-primary);
  z-index: 20;
  pointer-events: none;
}

/* ── dots ── */
.fs-dots {
  position: absolute;
  right: clamp(1.2rem, 3vw, 2.5rem);
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  flex-direction: column;
  gap: 14px;
  z-index: 20;
}
.fs-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  border: 1.5px solid rgba(240,237,230,0.35);
  background: transparent;
  cursor: pointer;
  transition: background 0.3s, border-color 0.3s, transform 0.3s;
}
.fs-dot.active {
  background: var(--ifm-color-primary);
  border-color: var(--ifm-color-primary);
  transform: scale(1.5);
}
`;

function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

export default function FlameSlides() {
    const rootRef       = useRef(null);
    const videoRef      = useRef(null);
    const slideRefs     = useRef([]);
    const dotRefs       = useRef([]);
    const progressRef   = useRef(0);
    const rafRef        = useRef(null);
    const snapTimerRef  = useRef(null);
    const isSnappingRef = useRef(false);
    const lastSlideRef  = useRef(-1);

    const [loadPct, setLoadPct] = useState(0);
    const [ready, setReady]     = useState(false);

    const N = SLIDES.length;

    // ── set slide state (active / exit / default) ──────────────────────
    const setSlideState = (idx, state) => {
        const el = slideRefs.current[idx];
        if (!el) return;
        el.classList.remove('is-active', 'is-exit');
        if (state === 'active') el.classList.add('is-active');
        if (state === 'exit')   el.classList.add('is-exit');
    };

    // ── RAF loop ────────────────────────────────────────────────────────
    useEffect(() => {
        let alive = true;

        const loop = () => {
            if (!alive) return;

            const p = progressRef.current;
            const rawSlide = p * (N - 1);
            const currentSlide = Math.round(rawSlide);

            // scrub video
            const video = videoRef.current;
            if (video && video.readyState >= 2 && video.duration) {
                const target = p * video.duration;
                if (Math.abs(video.currentTime - target) > 0.01) {
                    video.currentTime = target;
                }
            }

            // progress bar
            const bar = document.getElementById('fs-pbar');
            if (bar) bar.style.width = `${p * 100}%`;

            // slide text state — only update when slide changes
            if (currentSlide !== lastSlideRef.current) {
                const prev = lastSlideRef.current;

                // exit previous slide
                if (prev >= 0) setSlideState(prev, 'exit');

                // activate current slide
                setSlideState(currentSlide, 'active');

                // reset all others (not prev, not current)
                for (let i = 0; i < N; i++) {
                    if (i !== currentSlide && i !== prev) setSlideState(i, 'none');
                }

                lastSlideRef.current = currentSlide;
            }

            // dots
            dotRefs.current.forEach((el, i) => {
                if (!el) return;
                el.classList.toggle('active', i === currentSlide);
            });

            rafRef.current = requestAnimationFrame(loop);
        };

        rafRef.current = requestAnimationFrame(loop);
        return () => { alive = false; cancelAnimationFrame(rafRef.current); };
    }, [N]);

    // ── scroll → snap logic ─────────────────────────────────────────────
    useEffect(() => {
        const SNAP_DELAY = 600; // ms after scroll stops before snapping

        const scrollToSlide = (i, smooth = true) => {
            const el = rootRef.current;
            if (!el) return;
            const scrollable = el.offsetHeight - window.innerHeight;
            const target = el.offsetTop + (i / (N - 1)) * scrollable;
            isSnappingRef.current = true;
            window.scrollTo({ top: target, behavior: smooth ? 'smooth' : 'instant' });
            // release snap lock after animation
            setTimeout(() => { isSnappingRef.current = false; }, 800);
        };

        const onScroll = () => {
            const el = rootRef.current;
            if (!el) return;
            const scrollable = el.offsetHeight - window.innerHeight;
            if (scrollable <= 0) return;
            const scrolled = window.scrollY - el.offsetTop;

            // only update progress if we're within the component
            if (scrolled >= 0 && scrolled <= scrollable) {
                progressRef.current = clamp(scrolled / scrollable, 0, 1);
            }

            // debounce snap
            clearTimeout(snapTimerRef.current);
            snapTimerRef.current = setTimeout(() => {
                // check we're still inside the component
                const s2 = window.scrollY - el.offsetTop;
                if (s2 < 0 || s2 > scrollable) return;

                const rawSlide = clamp(s2 / scrollable, 0, 1) * (N - 1);
                const nearest = Math.round(rawSlide);
                scrollToSlide(nearest);
            }, SNAP_DELAY);
        };

        window.addEventListener('scroll', onScroll, { passive: true });
        return () => {
            window.removeEventListener('scroll', onScroll);
            clearTimeout(snapTimerRef.current);
        };
    }, [N]);

    // ── video loading ───────────────────────────────────────────────────
    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        const onProgress = () => {
            if (!video.duration) return;
            try {
                const buf = video.buffered;
                if (buf.length > 0) {
                    setLoadPct(Math.round((buf.end(buf.length - 1) / video.duration) * 100));
                }
            } catch (e) {}
        };

        const onCanPlay = () => {
            setReady(true);
            video.pause();
            // trigger first slide
            lastSlideRef.current = -1;
        };

        video.addEventListener('progress', onProgress);
        video.addEventListener('canplay', onCanPlay);
        video.addEventListener('canplaythrough', onCanPlay);

        return () => {
            video.removeEventListener('progress', onProgress);
            video.removeEventListener('canplay', onCanPlay);
            video.removeEventListener('canplaythrough', onCanPlay);
        };
    }, []);

    // ── dot click ───────────────────────────────────────────────────────
    const scrollToSlide = (i) => {
        const el = rootRef.current;
        if (!el) return;
        const scrollable = el.offsetHeight - window.innerHeight;
        window.scrollTo({ top: el.offsetTop + (i / (N - 1)) * scrollable, behavior: 'smooth' });
    };

    return (
        <div className="fs-root" ref={rootRef}>
            <style>{STYLE}</style>

            <div className="fs-scroll-space">
                <div className="fs-sticky">

                    <video
                        ref={videoRef}
                        className="fs-video"
                        src={VIDEO_URL}
                        preload="auto"
                        muted
                        playsInline
                        disablePictureInPicture
                    />

                    <div className="fs-overlay" />

                    {/* Loader */}
                    <div className={`fs-loader${ready ? ' hidden' : ''}`}>
                        <div className="fs-loader-label">Ładowanie</div>
                        <div className="fs-loader-bar-track">
                            <div className="fs-loader-bar" style={{ width: `${loadPct}%` }} />
                        </div>
                    </div>

                    {/* Slides */}
                    <div className="fs-slides-wrapper">
                        {SLIDES.map((s, i) => (
                            <div
                                key={i}
                                className="fs-slide"
                                ref={el => { slideRefs.current[i] = el; }}
                            >
                                <div className="fs-eyebrow">
                                    <span className="fs-eyebrow-inner">{s.eyebrow}</span>
                                </div>

                                {s.heading.map((line, li) => (
                                    <div className="fs-heading-line" key={li}>
                                        <span className="fs-heading-line-inner">{line}</span>
                                    </div>
                                ))}

                                <div className="fs-body-wrap">
                                    <div className="fs-body-inner">{s.body}</div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Progress bar */}
                    <div id="fs-pbar" className="fs-progress-bar" style={{ width: '0%' }} />

                    {/* Dots */}
                    <div className="fs-dots">
                        {SLIDES.map((_, i) => (
                            <div
                                key={i}
                                className="fs-dot"
                                ref={el => { dotRefs.current[i] = el; }}
                                onClick={() => scrollToSlide(i)}
                            />
                        ))}
                    </div>

                </div>
            </div>
        </div>
    );
}