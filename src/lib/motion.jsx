import { useEffect, useRef, useState } from 'react';

// Reveal-on-scroll for any element with a data-reveal attribute, including ones
// rendered later (route changes). Sets data-shown once it enters the viewport.
export function installReveal() {
  if (typeof window === 'undefined' || !('IntersectionObserver' in window)) return;
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (e.isIntersecting) {
          e.target.setAttribute('data-shown', '');
          io.unobserve(e.target);
        }
      }
    },
    { rootMargin: '0px 0px -8% 0px', threshold: 0.12 }
  );
  const scan = (root) => root.querySelectorAll?.('[data-reveal]:not([data-shown])').forEach((el) => io.observe(el));
  scan(document);
  new MutationObserver((muts) => {
    for (const m of muts) m.addedNodes.forEach((n) => n.nodeType === 1 && (n.matches?.('[data-reveal]') ? io.observe(n) : scan(n)));
  }).observe(document.body, { childList: true, subtree: true });
  document.documentElement.classList.add('reveal-ready');
}

// Number that counts up to its value the first time it is on screen
export function useCountUp(target, { duration = 1200 } = {}) {
  const ref = useRef(null);
  const [v, setV] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el || !Number.isFinite(target)) {
      setV(target);
      return undefined;
    }
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setV(target);
      return undefined;
    }
    let raf = 0;
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      io.disconnect();
      const t0 = performance.now();
      const tick = (t) => {
        const p = Math.min(1, (t - t0) / duration);
        setV(target * (1 - Math.pow(1 - p, 3)));
        if (p < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    });
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [target, duration]);
  return [ref, v];
}

export function CountUp({ value, format = (n) => Math.round(n).toLocaleString('en-IN'), className = '' }) {
  const [ref, v] = useCountUp(Number(value) || 0);
  return (
    <span ref={ref} className={className}>
      {format(v)}
    </span>
  );
}
