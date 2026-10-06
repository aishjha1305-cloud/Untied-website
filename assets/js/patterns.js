/* Untied print generator.
   Each product's "pattern" in products.json is drawn here as an SVG bandana,
   then cached as a data URI so the browser rasterises it once.
   When real product photos exist, set "image" on the product and it is used instead. */
(function () {
  const cache = new Map();
  const STAR = 'M0,-1 C.07,-.2 .2,-.07 1,0 C.2,.07 .07,.2 0,1 C-.07,.2 -.2,.07 -1,0 C-.2,-.07 -.07,-.2 0,-1Z';

  function rng(seed) {
    let s = (seed * 9301 + 49297) % 233280 || 1;
    return () => (s = (s * 9301 + 49297) % 233280) / 233280;
  }
  function hex(c) {
    const n = parseInt(c.slice(1), 16);
    return [(n >> 16) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255].map(v => v.toFixed(3));
  }
  const star = (x, y, r, fill, rot = 0) =>
    `<path d="${STAR}" fill="${fill}" transform="translate(${x} ${y}) rotate(${rot}) scale(${r})"/>`;

  // hand-block wobble, shared by printed styles
  const rough = (id, seed, scale = 2.4) =>
    `<filter id="${id}" x="-5%" y="-5%" width="110%" height="110%"><feTurbulence type="fractalNoise" baseFrequency=".8" numOctaves="1" seed="${seed}" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="${scale}"/></filter>`;

  const draw = {
    tiedye([a, b, c], seed) {
      const [A, B, C] = [hex(a), hex(b), hex(c)];
      const t = i => [A[i], A[i], B[i], C[i], B[i], A[i], B[i], C[i], A[i]].join(' ');
      return {
        defs: `<filter id="td" x="-100" y="-100" width="600" height="600" filterUnits="userSpaceOnUse">
          <feTurbulence type="turbulence" baseFrequency=".0045 .011" numOctaves="4" seed="${seed}" result="t0"/>
          <feTurbulence type="fractalNoise" baseFrequency=".006" numOctaves="2" seed="${seed + 5}" result="w"/>
          <feDisplacementMap in="t0" in2="w" scale="120" xChannelSelector="R" yChannelSelector="G" result="t"/>
          <feColorMatrix in="t" type="matrix" values=".5 .5 0 0 0  .5 .5 0 0 0  .5 .5 0 0 0  0 0 0 0 1" result="g"/>
          <feComponentTransfer in="g"><feFuncR type="table" tableValues="${t(0)}"/><feFuncG type="table" tableValues="${t(1)}"/><feFuncB type="table" tableValues="${t(2)}"/></feComponentTransfer>
        </filter>`,
        body: `<rect width="400" height="400" fill="${a}"/><rect x="-100" y="-100" width="600" height="600" filter="url(#td)"/>`
      };
    },

    bandhani([a, b, c], seed) {
      const dot = (x, y, f) => `<rect x="${x - 3.5}" y="${y - 3.5}" width="7" height="7" rx="1.8" fill="${f}"/><rect x="${x - 1}" y="${y - 1}" width="2" height="2" fill="${a}"/>`;
      let cluster = '';
      [[0, -14], [-14, 0], [14, 0], [0, 14], [0, 0], [-7, -7], [7, -7], [-7, 7], [7, 7]].forEach(([dx, dy]) => cluster += dot(72 + dx, 72 + dy, c));
      return {
        defs: `${rough('r', seed, 2)}
          <pattern id="p1" width="36" height="36" patternUnits="userSpaceOnUse">${dot(9, 9, b)}${dot(27, 27, b)}</pattern>
          <pattern id="p2" width="144" height="144" patternUnits="userSpaceOnUse"><rect x="50" y="50" width="44" height="44" fill="${a}"/>${cluster}</pattern>`,
        body: `<rect width="400" height="400" fill="${a}"/><g filter="url(#r)"><rect width="400" height="400" fill="url(#p1)"/><rect width="400" height="400" fill="url(#p2)"/></g>`
      };
    },

    blockgrid([a, b], seed) {
      return {
        defs: `${rough('r', seed, 3.2)}<pattern id="p" width="80" height="80" patternUnits="userSpaceOnUse"><rect x="12" y="12" width="56" height="56" fill="none" stroke="${b}" stroke-width="11"/><rect x="33" y="33" width="14" height="14" fill="${b}"/></pattern>`,
        body: `<rect width="400" height="400" fill="${a}"/><rect width="400" height="400" fill="url(#p)" filter="url(#r)"/>`
      };
    },

    diamond([a, b], seed) {
      const petals = [0, 90, 180, 270].map(r => `<ellipse cx="0" cy="-7" rx="4.5" ry="7" fill="${b}" transform="rotate(${r})"/>`).join('');
      return {
        defs: `${rough('r', seed, 2.2)}<pattern id="p" width="60" height="60" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect x="0" y="0" width="60" height="60" fill="none" stroke="${b}" stroke-width="7"/><g transform="translate(30 30) rotate(45)">${petals}<circle r="2.6" fill="${a}"/></g></pattern>`,
        body: `<rect width="400" height="400" fill="${a}"/><rect width="400" height="400" fill="url(#p)" filter="url(#r)"/>`
      };
    },

    booti([a, b, c], seed) {
      const flower = (x, y, s) => `<g transform="translate(${x} ${y}) scale(${s})">${[0, 60, 120, 180, 240, 300].map(r => `<ellipse cx="0" cy="-7" rx="3.6" ry="6.5" fill="${b}" transform="rotate(${r})"/>`).join('')}<circle r="3.4" fill="${c}"/></g>`;
      return {
        defs: `${rough('r', seed, 1.8)}<pattern id="p" width="64" height="64" patternUnits="userSpaceOnUse">${flower(16, 16, 1)}${flower(48, 48, 1)}<circle cx="48" cy="16" r="2" fill="${b}"/><circle cx="16" cy="48" r="2" fill="${b}"/></pattern>`,
        body: `<rect width="400" height="400" fill="${a}"/><rect width="400" height="400" fill="url(#p)" filter="url(#r)"/>`
      };
    },

    floral([a, b], seed) {
      const big = (x, y) => `<g transform="translate(${x} ${y})">${[0, 45, 90, 135, 180, 225, 270, 315].map(r => `<ellipse cx="0" cy="-15" rx="6.5" ry="12" fill="${b}" transform="rotate(${r})"/>`).join('')}<circle r="7" fill="${a}"/><circle r="4" fill="${b}"/>
        <path d="M18 18 q16 4 22 20 q-18 -2 -22 -20Z M-18 18 q-16 4 -22 20 q18 -2 22 -20Z" fill="${b}" opacity=".85"/></g>`;
      return {
        defs: `${rough('r', seed, 2)}<pattern id="p" width="120" height="120" patternUnits="userSpaceOnUse">${big(30, 30)}${big(90, 90)}<circle cx="90" cy="30" r="3" fill="${b}"/><circle cx="30" cy="90" r="3" fill="${b}"/></pattern>`,
        body: `<rect width="400" height="400" fill="${a}"/><rect width="400" height="400" fill="url(#p)" filter="url(#r)"/>`
      };
    },

    jaal([a, b, c, d], seed) {
      const bloom = (x, y) => `<g transform="translate(${x} ${y})">${[0, 40, 80, 120, 160, 200, 240, 280, 320].map(r => `<ellipse cx="0" cy="-10" rx="4.6" ry="9" fill="${c}" stroke="${d}" stroke-width="1.2" transform="rotate(${r})"/>`).join('')}<circle r="5" fill="${d}"/><circle r="2.4" fill="${b}"/></g>`;
      const leaf = (x, y, r) => `<path d="M0 0 q8 -12 0 -24 q-8 12 0 24Z" fill="${b}" transform="translate(${x} ${y}) rotate(${r})"/>`;
      return {
        defs: `${rough('r', seed, 2)}<pattern id="p" width="100" height="100" patternUnits="userSpaceOnUse">
          <path d="M0 50 C25 50 25 0 50 0 C75 0 75 50 100 50 M0 50 C25 50 25 100 50 100 C75 100 75 50 100 50" fill="none" stroke="${d}" stroke-width="3.5"/>
          ${leaf(50, 50, 45)}${leaf(50, 50, -45)}${leaf(50, 50, 135)}${leaf(50, 50, -135)}
          ${bloom(50, 50)}${bloom(0, 0)}${bloom(100, 0)}${bloom(0, 100)}${bloom(100, 100)}</pattern>`,
        body: `<rect width="400" height="400" fill="${a}"/><rect width="400" height="400" fill="url(#p)" filter="url(#r)"/>`
      };
    },

    artichoke([a, b, c], seed) {
      const bud = (x, y) => {
        let s = `<g transform="translate(${x} ${y})"><rect x="-1.6" y="4" width="3.2" height="14" fill="${b}"/><path d="M0 14 q-10 -2 -13 -9 M0 14 q10 -2 13 -9" stroke="${b}" stroke-width="2.4" fill="none"/>`;
        [[4, 6], [3, -2], [2, -10]].forEach(([n, yy], i) => {
          for (let k = 0; k < n; k++) {
            const xx = (k - (n - 1) / 2) * 8;
            s += `<path d="M${xx - 4.6} ${yy} a4.6 6 0 0 1 9.2 0Z" fill="${b}" stroke="${a}" stroke-width="1"/>`;
          }
        });
        return s + `<path d="M-3 -12 q3 -10 6 0Z" fill="${c}"/></g>`;
      };
      return {
        defs: `${rough('r', seed, 1.6)}<pattern id="p" width="72" height="84" patternUnits="userSpaceOnUse">${bud(18, 24)}${bud(54, 66)}${bud(54, -18)}</pattern>`,
        body: `<rect width="400" height="400" fill="${a}"/><rect width="400" height="400" fill="url(#p)" filter="url(#r)"/>`
      };
    },

    satin([a, b], seed) {
      return {
        defs: `<linearGradient id="g1" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${a}"/><stop offset=".28" stop-color="${b}" stop-opacity=".9"/><stop offset=".42" stop-color="${a}"/><stop offset=".63" stop-color="${b}" stop-opacity=".65"/><stop offset=".8" stop-color="${a}"/><stop offset="1" stop-color="${b}" stop-opacity=".5"/></linearGradient>
          <filter id="dr" x="0" y="0" width="400" height="400" filterUnits="userSpaceOnUse"><feTurbulence type="fractalNoise" baseFrequency=".004 .009" numOctaves="2" seed="${seed}" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="90"/></filter>`,
        body: `<rect width="400" height="400" fill="${a}"/><rect x="-60" y="-60" width="520" height="520" fill="url(#g1)" filter="url(#dr)"/>`
      };
    },

    web([a, b, c]) {
      let corner = '';
      for (let i = 0; i <= 6; i++) {
        const ang = (i * 15) * Math.PI / 180;
        corner += `<line x1="0" y1="0" x2="${(Math.cos(ang) * 190).toFixed(1)}" y2="${(Math.sin(ang) * 190).toFixed(1)}"/>`;
      }
      for (let r = 34; r <= 180; r += 30) {
        let d = '';
        for (let i = 0; i <= 6; i++) {
          const ang = (i * 15) * Math.PI / 180, x = Math.cos(ang) * r, y = Math.sin(ang) * r;
          if (i === 0) d += `M${x.toFixed(1)} ${y.toFixed(1)}`;
          else { const m = ((i - .5) * 15) * Math.PI / 180, q = r * .86; d += ` Q${(Math.cos(m) * q).toFixed(1)} ${(Math.sin(m) * q).toFixed(1)} ${x.toFixed(1)} ${y.toFixed(1)}`; }
        }
        corner += `<path d="${d}" fill="none"/>`;
      }
      const g = t => `<g transform="${t}" stroke="${b}" stroke-width="2.2">${corner}</g>`;
      let ring = '';
      for (let i = 0; i < 8; i++) ring += `<path d="M0 -66 L6 -84 L0 -102 L-6 -84Z" fill="${b}" transform="rotate(${i * 45})"/>`;
      return {
        defs: '',
        body: `<rect width="400" height="400" fill="${a}"/>${g('translate(0 0)')}${g('translate(400 0) scale(-1 1)')}${g('translate(0 400) scale(1 -1)')}${g('translate(400 400) scale(-1 -1)')}
          <g transform="translate(200 200)"><circle r="60" fill="${a}" stroke="${b}" stroke-width="7"/>${ring}${star(0, 0, 30, c)}</g>`
      };
    },

    bleach([a, b], seed) {
      const R = rng(seed);
      let marks = '';
      for (let i = 0; i < 22; i++) {
        const x = (R() * 380 + 10).toFixed(0), y = (R() * 380 + 10).toFixed(0), r = (10 + R() * 22).toFixed(1);
        marks += R() > .3
          ? `<circle cx="${x}" cy="${y}" r="${r}" fill="none" stroke="${b}" stroke-width="${(1.5 + R() * 2.5).toFixed(1)}" opacity=".85"/>`
          : `<circle cx="${x}" cy="${y}" r="${(r / 3).toFixed(1)}" fill="${b}" opacity=".8"/>`;
      }
      for (let i = 0; i < 7; i++) marks += star((R() * 360 + 20).toFixed(0), (R() * 360 + 20).toFixed(0), 8 + R() * 10, b, R() * 30);
      return {
        defs: `<filter id="bl" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="1.1"/></filter>
          <filter id="dn" x="0" y="0" width="400" height="400" filterUnits="userSpaceOnUse"><feTurbulence type="fractalNoise" baseFrequency=".9 .05" numOctaves="2" seed="${seed}"/><feColorMatrix type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 .22 -.04"/></filter>`,
        body: `<rect width="400" height="400" fill="${a}"/><rect width="400" height="400" filter="url(#dn)"/><g filter="url(#bl)">${marks}</g>`
      };
    },

    sigil([a, b, c]) {
      const orn = (x, y, r) => `<g transform="translate(${x} ${y}) rotate(${r})" fill="none" stroke="${b}" stroke-width="2.2"><path d="M0 0 C18 0 26 10 26 26 M0 0 C0 18 10 26 26 26"/><circle cx="26" cy="26" r="4" fill="${b}"/><path d="M8 -6 q10 -14 22 -6 M-6 8 q-14 10 -6 22"/></g>`;
      return {
        defs: '',
        body: `<rect width="400" height="400" fill="${a}"/>
          <rect x="48" y="48" width="304" height="304" fill="none" stroke="${b}" stroke-width="3"/>
          <rect x="62" y="62" width="276" height="276" fill="none" stroke="${b}" stroke-width="1.4" stroke-dasharray="2 5"/>
          ${orn(48, 48, 0)}${orn(352, 48, 90)}${orn(352, 352, 180)}${orn(48, 352, 270)}
          <circle cx="200" cy="200" r="74" fill="none" stroke="${b}" stroke-width="2"/><circle cx="200" cy="200" r="88" fill="none" stroke="${b}" stroke-width="1" stroke-dasharray="1 6"/>
          ${star(200, 200, 66, b)}${star(200, 200, 18, c, 45)}`
      };
    }
  };

  function svg(p, view) {
    const pt = p.pattern || { type: 'bandhani', colors: ['#1F44B0', '#F4EDDD', '#F28B4B'], seed: 1 };
    const fn = draw[pt.type] || draw.bandhani;
    const { defs, body } = fn(pt.colors, pt.seed || 1);
    const box = view === 'detail' ? '130 130 140 140' : '0 0 400 400';
    const hemColor = pt.type === 'satin' ? pt.colors[1] : (pt.colors[1] || '#fff');
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${box}" width="800" height="800" preserveAspectRatio="xMidYMid slice">
      <defs>${defs}<filter id="grain" x="0" y="0" width="400" height="400" filterUnits="userSpaceOnUse"><feTurbulence type="fractalNoise" baseFrequency="1.4" numOctaves="2" seed="3"/><feColorMatrix type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 .5 -.12"/></filter></defs>
      ${body}
      <rect width="400" height="400" filter="url(#grain)" opacity=".28"/>
      <rect x="11" y="11" width="378" height="378" fill="none" stroke="${hemColor}" stroke-opacity=".55" stroke-width="1.6" stroke-dasharray="5 4"/>
    </svg>`;
  }

  window.UntiedPattern = {
    url(p, view = 'flat') {
      if (p.image) return view === 'detail' && p.imageDetail ? p.imageDetail : p.image;
      const key = p.id + ':' + view;
      if (!cache.has(key)) cache.set(key, 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg(p, view).replace(/\s{2,}/g, ' ')));
      return cache.get(key);
    },
    STAR
  };
})();
