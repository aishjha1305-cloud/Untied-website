/* Halftone renderer for Untied brand marks.
   Samples an image's alpha into a dot grid (like the brand book's halftone symbol)
   and animates it: dots assemble on load, swell and drift away from the pointer. */
(function () {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  function load(src) {
    return new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = src; });
  }

  async function mount(canvas, o) {
    const opt = Object.assign({ step: 9, fit: .82, field: true, intro: true, interactive: true, gain: 1 }, o);
    const img = await load(opt.src);
    const ctx = canvas.getContext('2d');
    let W, H, dpr, dots = [], start = performance.now();
    // colours follow the page theme (--moon / --saturn) unless passed in
    let color, accent;
    const readColors = () => { const cs = getComputedStyle(canvas); color = o.color || cs.getPropertyValue('--moon').trim() || '#FFF5C6'; accent = o.accent || cs.getPropertyValue('--saturn').trim() || '#FAE3FF'; };
    readColors();
    addEventListener('untied-theme', () => { readColors(); if (!running) frame(performance.now() + 5000); });
    const ptr = { x: -9999, y: -9999, tx: -9999, ty: -9999, active: false };

    function build() {
      dpr = Math.min(devicePixelRatio || 1, 2);
      const r = canvas.getBoundingClientRect();
      W = Math.max(1, r.width); H = Math.max(1, r.height);
      canvas.width = W * dpr; canvas.height = H * dpr;
      const s = opt.step;
      const cols = Math.ceil(W / s), rows = Math.ceil(H / s);
      const off = document.createElement('canvas'); off.width = cols; off.height = rows;
      const oc = off.getContext('2d');
      const scale = Math.min(cols / img.width, rows / img.height) * opt.fit;
      const iw = img.width * scale, ih = img.height * scale;
      oc.drawImage(img, (cols - iw) / 2, (rows - ih) / 2, iw, ih);
      const data = oc.getImageData(0, 0, cols, rows).data;
      dots = [];
      for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
        const a = data[(y * cols + x) * 4 + 3] / 255;
        const cx = x * s + s / 2, cy = y * s + s / 2;
        // faint dot field fading out from the centre, like the brand book backgrounds
        const fx = opt.field ? Math.max(0, .16 - Math.hypot(cx / W - .5, cy / H - .5) * .32) : 0;
        const v = Math.max(a, fx);
        if (v < .03) continue;
        const ang = Math.random() * Math.PI * 2, dist = 80 + Math.random() * 260;
        dots.push({ x: cx, y: cy, v, mark: a > .05, ox: Math.cos(ang) * dist, oy: Math.sin(ang) * dist, delay: Math.random() * 500, ph: Math.random() * 6.28 });
      }
    }

    function frame(t) {
      const el = t - start;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      ptr.x += (ptr.tx - ptr.x) * .14; ptr.y += (ptr.ty - ptr.y) * .14;
      const R = Math.min(W, H) * .22, s = opt.step;
      for (const d of dots) {
        let k = opt.intro && !reduce ? Math.min(1, Math.max(0, (el - d.delay) / 1100)) : 1;
        k = 1 - Math.pow(1 - k, 4);
        let x = d.x + d.ox * (1 - k), y = d.y + d.oy * (1 - k);
        let rad = s * .5 * Math.sqrt(d.v) * opt.gain;
        if (!reduce) rad *= 1 + Math.sin(t / 900 + d.ph + d.x * .01) * (d.mark ? .06 : .25);
        let hot = 0;
        if (opt.interactive && ptr.active) {
          const dx = x - ptr.x, dy = y - ptr.y, dist = Math.hypot(dx, dy);
          if (dist < R) {
            hot = 1 - dist / R;
            const push = hot * hot * 26;
            x += dx / (dist || 1) * push; y += dy / (dist || 1) * push;
            rad = d.mark ? rad * (1 - hot * .55) : Math.max(rad, s * .32 * hot);
          }
        }
        if (rad < .25) continue;
        ctx.fillStyle = hot > .45 ? accent : color;
        ctx.globalAlpha = d.mark ? k : k * .9;
        ctx.beginPath(); ctx.arc(x, y, rad, 0, 6.2832); ctx.fill();
      }
      ctx.globalAlpha = 1;
    }

    let running = false, visible = true, raf;
    const loop = t => { frame(t); if (running) raf = requestAnimationFrame(loop); };
    const play = () => { if (!running && visible) { running = true; raf = requestAnimationFrame(loop); } };
    const stop = () => { running = false; cancelAnimationFrame(raf); };

    build();
    if (reduce) { frame(performance.now() + 5000); }
    else play();
    new ResizeObserver(() => { build(); if (!running) frame(performance.now() + 5000); }).observe(canvas);
    if ('IntersectionObserver' in window) new IntersectionObserver(es => { visible = es[0].isIntersecting; visible && !reduce ? play() : stop(); }).observe(canvas);
    if (opt.interactive) {
      const host = opt.host || canvas;
      host.addEventListener('pointermove', e => { const r = canvas.getBoundingClientRect(); ptr.tx = e.clientX - r.left; ptr.ty = e.clientY - r.top; if (!ptr.active) { ptr.x = ptr.tx; ptr.y = ptr.ty; } ptr.active = true; });
      host.addEventListener('pointerleave', () => { ptr.active = false; });
    }
    return { stop, play };
  }

  window.UntiedHalftone = { mount };
})();
