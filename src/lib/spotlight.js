// Light that follows the pointer across any .sheet (see .sheet::before/::after in index.css)
export function installSpotlight() {
  if (typeof window === 'undefined' || window.matchMedia('(pointer: coarse)').matches) return;
  let frame = 0;
  let last = null;
  window.addEventListener(
    'pointermove',
    (e) => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        const el = e.target instanceof Element ? e.target.closest('.sheet, .glow') : null;
        if (last && last !== el) {
          last.style.removeProperty('--mx');
          last.style.removeProperty('--my');
        }
        last = el;
        if (!el) return;
        const r = el.getBoundingClientRect();
        el.style.setProperty('--mx', `${e.clientX - r.left}px`);
        el.style.setProperty('--my', `${e.clientY - r.top}px`);
      });
    },
    { passive: true }
  );
}
