/* Untied storefront: hash-routed single page, cart in localStorage. */
(function () {
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const P = window.UntiedPattern, HT = window.UntiedHalftone;
  const A = Object.assign({ symbol: 'assets/img/symbol.png', wordmark: 'assets/img/wordmark-clean.png', comet: 'assets/img/halftone-comet.png' }, window.UNTIED_ASSETS || {});
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(pointer: fine)').matches;
  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* storage blocked: cart lasts this visit */ } }
  };

  const SIZES = [
    { id: 'classic', label: 'Classic', dims: '55 × 55 cm', add: 0 },
    { id: 'oversized', label: 'Oversized', dims: '65 × 65 cm', add: 150 }
  ];
  // shape = how the square is folded for that look (drives the morphing scarf in "Ways to wear")
  const WAYS = [
    { name: 'Headband', type: 'style', shape: 'strip', rot: -6, how: 'Fold into a long strip, wrap from the nape and knot on top.' },
    { name: 'Neck knot', type: 'style', shape: 'triangle', rot: 0, how: 'Fold into a triangle, roll the long edge and tie loose to one side.' },
    { name: 'Ponytail tie', type: 'style', shape: 'roll', rot: 18, how: 'Roll thin, loop twice around the hair tie and let the tails fall.' },
    { name: 'Bandana top', type: 'style', shape: 'diamond', rot: 0, how: 'Take the oversized square, fold to a triangle and tie at the back and neck.' },
    { name: 'Wrist cuff', type: 'style', shape: 'roll', rot: -12, how: 'Roll into a thin band, wrap twice and tuck the ends under.' },
    { name: 'Belt loop', type: 'style', shape: 'triangle', rot: 180, how: 'Fold once, thread through a loop and let it hang from the hip.' },
    { name: 'Rider', type: 'utility', shape: 'triangle', rot: 0, how: 'Triangle over nose and mouth, knot behind the head. Dust and sun stay out.' },
    { name: 'Sweatband', type: 'utility', shape: 'strip', rot: 4, how: 'A tight strip across the forehead for runs, gigs and festival days.' },
    { name: 'Sun cover', type: 'utility', shape: 'square', rot: 0, how: 'Open it flat over your head or shoulders when the afternoon gets loud.' },
    { name: 'Bag charm', type: 'carry', shape: 'roll', rot: 40, how: 'Double knot around the strap of any tote or backpack.' },
    { name: 'Pocket square', type: 'carry', shape: 'pocket', rot: 0, how: 'Fold into a neat rectangle with one star corner peeking out.' },
    { name: 'Gift wrap', type: 'carry', shape: 'square', rot: 45, how: 'Wrap a present the furoshiki way. The wrap becomes the second gift.' }
  ];
  const SHAPES = {
    square: '0% 0%, 50% 0%, 100% 0%, 100% 50%, 100% 100%, 50% 100%, 0% 100%, 0% 50%',
    diamond: '0% 0%, 50% 0%, 100% 0%, 100% 50%, 100% 100%, 50% 100%, 0% 100%, 0% 50%',
    triangle: '0% 24%, 50% 24%, 100% 24%, 75% 50%, 50% 76%, 50% 76%, 25% 50%, 0% 24%',
    strip: '0% 40%, 50% 37%, 100% 40%, 100% 50%, 100% 60%, 50% 63%, 0% 60%, 0% 50%',
    roll: '6% 47%, 50% 46%, 94% 47%, 96% 50%, 94% 53%, 50% 54%, 6% 53%, 4% 50%',
    pocket: '22% 30%, 50% 30%, 78% 30%, 78% 50%, 78% 70%, 50% 70%, 22% 70%, 22% 50%'
  };
  const MESSAGES = ['Remain Untied', 'Always Becoming', 'Follow The Orbit', 'Move Freely', 'The Future Is Unwritten', 'Born To Wander'];
  const ANNOUNCE = ['Free shipping in India over ₹999', 'Limited drops', 'Born in India', 'New: Untied Universe, collection 01', 'Remain untied'];
  const VALUES = [['Freedom', 'Expression without restriction.'], ['Movement', 'Growth through change.'], ['Curiosity', 'A desire to explore beyond the familiar.'], ['Individuality', 'No two journeys are identical.'], ['Optimism', 'Believing there is always another horizon.']];

  let DATA = { products: [], collections: [] };
  let cart = store.get('untied.cart', []);
  const inr = n => '₹' + n.toLocaleString('en-IN');
  const byId = id => DATA.products.find(p => p.id === id);
  const coll = id => DATA.collections.find(c => c.id === id);
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const star = (style = '') => `<span class="star" style="${style}"></span>`;
  const arrow = '<svg class="arrow" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';
  const pad = (n, l = 2) => String(n).padStart(l, '0');

  async function loadData() {
    const inline = document.getElementById('product-data');
    if (inline) return JSON.parse(inline.textContent);
    return (await fetch('data/products.json')).json();
  }

  function trails(n, seed = 1) {
    let s = seed, out = '';
    const r = () => (s = (s * 9301 + 49297) % 233280) / 233280;
    for (let i = 0; i < n; i++) {
      out += `<span class="trail ${r() > .5 ? 'up' : ''}" style="left:${(r() * 96 + 2).toFixed(1)}%;top:${(r() * 80 + 6).toFixed(1)}%;--len:${(60 + r() * 220).toFixed(0)}px;--t:${(10 + r() * 10).toFixed(1)}s;--d:${(-r() * 10).toFixed(1)}s;transform:scale(${(.45 + r() * .7).toFixed(2)})"><span class="star"></span></span>`;
    }
    return `<div class="trails" aria-hidden="true">${out}</div>`;
  }

  /* ---------- components ---------- */
  function card(p, i = 0) {
    const c = coll(p.collection);
    return `<article class="card" data-reveal style="--d:${(i % 4) * 80}ms">
      <a class="card-media" href="#p-${p.id}" aria-label="${esc(p.name)}">
        ${p.badge ? `<span class="badge">${esc(p.badge)}${p.stock ? ' · ' + p.stock + ' made' : ''}</span>` : ''}
        <span class="flat${p.image ? ' photo' : ''}"><img src="${P.url(p)}" alt="" loading="lazy"></span>
        <span class="alt"><img src="${P.url(p, 'detail')}" alt="" loading="lazy"></span>
      </a>
      <button class="add" data-add="${p.id}" aria-label="Add ${esc(p.name)} to bag"><svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg></button>
      <div class="card-info">
        <div><h3>${esc(p.name)}</h3><p class="ui dim">${esc(c ? c.name : '')}</p></div>
        <span class="price">${inr(p.price)}</span>
      </div>
    </article>`;
  }
  const head = (idx, label, title, right = '') => `<div class="section-head" data-reveal><div><p class="ui">${idx} — ${label}</p><h2 class="display">${title}</h2></div>${right}</div>`;
  const cats = active => `<div class="cats" role="group" aria-label="Filter by collection"><button class="cat ${active === 'all' ? 'on' : ''}" data-filter="all">All</button>${DATA.collections.map(c => `<button class="cat ${active === c.id ? 'on' : ''}" data-filter="${c.id}">${esc(c.name)}</button>`).join('')}</div>`;

  /* ---------- views ---------- */
  function viewHome() {
    const drops = DATA.products.filter(p => p.badge).concat(DATA.products.filter(p => !p.badge)).slice(0, 8);
    const gallery = DATA.products.flatMap(p => [{ p, v: 'detail' }, { p, v: 'flat' }]);
    const start = document.body.classList.contains('booting') ? 1500 : 0;
    const words = ['Remain', 'Untied'];
    return `
    <section class="hero" id="hero" style="--start:${start}ms">
      <span class="dots" id="heroDots"></span>

      <div class="wrap hero-grid">
        <div class="hero-copy">
          <p class="ui pink fade-in" style="--d:200ms">✦ A brand in motion · Drop 01</p>
          <h1 class="display" aria-label="Remain Untied">${words.map((w, i) => `<span class="w" aria-hidden="true"><span style="--i:${i}">${w}</span></span>`).join('<br>')}</h1>
          <p class="mind fade-in" style="--d:450ms">Untied is a state of mind.</p>
          <p class="lede fade-in" style="--d:600ms">Built to elevate your fashion game with one simple accessory. Useful every day, and made to express who you are.</p>
          <div class="fade-in" style="--d:750ms;display:flex;gap:12px;flex-wrap:wrap">
            <a class="btn" href="#shop">Enter the store ${arrow}</a>
            <a class="btn ghost" href="#story">The universe</a>
          </div>
        </div>
        <div class="hero-art">
          <span class="orbit"></span><span class="orbit o2"></span>
          <canvas id="heroCanvas" aria-label="Untied guiding star symbol in halftone"></canvas>
        </div>
      </div>
      <div class="hero-meta ui"><span class="scroll-cue"><i></i>Scroll</span></div>
    </section>


    <section class="section wrap" id="drops">
      ${head('001', 'Store', 'New drops', `<a class="btn ghost" href="#shop">View all ${arrow}</a>`)}
      <div class="grid">${drops.map(card).join('')}</div>
    </section>

    <section class="section wrap ways" id="ways">
      ${head('002', 'Ways to wear', 'One square. Twelve ways.')}
      <div class="why" data-reveal>
        <p class="lede">Untied is built to elevate your fashion game with one simple accessory. A bandana is useful every single day and says something about who you are, whether it is in your hair, on your wrist or keeping the dust out on a ride.</p>
        <div class="why-stats ui">
          <div><b class="display">12+</b><span>Ways to wear</span></div>
          <div><b class="display">1</b><span>Square, any outfit</span></div>
          <div><b class="display">55</b><span>cm, fits a pocket</span></div>
          <div><b class="display">365</b><span>Days a year</span></div>
        </div>
      </div>
    </section>

    <section class="section manifesto" id="manifesto">
      <img class="halftone-bg" src="${A.comet}" alt="" data-parallax=".12">
      <div class="wrap">
        <p class="ui pink" style="margin:0 0 26px">003 — Manifesto</p>
        <div class="manifesto-lines" id="manifestoLines">
          <span>We believe identity is fluid.</span>
          <span>We believe movement creates meaning.</span>
          <span>We believe curiosity expands horizons.</span>
          <span>The stars never stand still.</span>
          <span>Neither should we.</span>
          <span>Remain Untied.</span>
        </div>
      </div>
    </section>

    <section class="section wrap">
      ${head('004', 'untied.in', 'Join the orbit')}
      <div class="gallery">${gallery.map(({ p, v }) => `<a class="${v}" href="#p-${p.id}" data-name="${esc(p.name)}" data-reveal><img src="${P.url(p, v)}" alt="${esc(p.name)} print" loading="lazy"></a>`).join('')}</div>
      <div class="newsletter">
        <h2 class="display" data-reveal>New drops land here first.</h2>
        <form id="newsForm" novalidate data-reveal>
          <div class="field"><label class="sr-only" for="newsEmail">Email</label><input id="newsEmail" type="email" placeholder="Your email" required><button class="btn" type="submit">Join ${arrow}</button></div>
          <p class="note ui dim" id="newsNote">One email per drop. Never loud.</p>
        </form>
      </div>
    </section>`;
  }

  function viewShop(filter = 'all') {
    const c = coll(filter);
    return `
    <section class="wrap page-head">
      <span class="dots fade-down" style="opacity:.14"></span>
      <p class="ui pink">✦ Store · ${DATA.products.length} scarves</p>
      <h1 class="display">${c ? esc(c.name) : DATA.collections.length === 1 ? esc(DATA.collections[0].name) : 'All bandanas'}</h1>
      <p class="lede">${c ? esc(c.blurb) : (DATA.collections.length === 1 ? esc(DATA.collections[0].blurb) : 'Every print, every fabric. Each one made for a different orbit.')}</p>
    </section>
    <section class="wrap" style="padding-bottom:110px">
      <div class="toolbar">${DATA.collections.length > 1 ? cats(filter) : `<span class="ui dim">${DATA.products.length} prints · Satin</span>`}
        <label class="sort ui" for="sortSel">Sort <select id="sortSel"><option value="featured">Featured</option><option value="low">Price low–high</option><option value="high">Price high–low</option><option value="name">A–Z</option></select></label>
      </div>
      <div class="grid" id="shopGrid"></div>
    </section>`;
  }
  function renderShopGrid(filter, sort) {
    let list = DATA.products.filter(p => filter === 'all' || p.collection === filter);
    if (sort === 'low') list = list.slice().sort((a, b) => a.price - b.price);
    if (sort === 'high') list = list.slice().sort((a, b) => b.price - a.price);
    if (sort === 'name') list = list.slice().sort((a, b) => a.name.localeCompare(b.name));
    const g = $('#shopGrid');
    g.innerHTML = list.length ? list.map(card).join('') : '<p class="empty">Nothing in this orbit yet.</p>';
    if (!reduce) $$('.card', g).forEach((c, i) => c.animate([{ opacity: 0, transform: 'translateY(24px)' }, { opacity: 1, transform: 'none' }], { duration: 800, delay: i * 50, easing: 'cubic-bezier(.16,1,.3,1)', fill: 'backwards' }));
  }

  function viewProduct(p) {
    const c = coll(p.collection);
    const rel = DATA.products.filter(x => x.collection === p.collection && x.id !== p.id);
    const more = rel.concat(DATA.products.filter(x => x.collection !== p.collection)).slice(0, 4);
    return `
    <div class="wrap">
      <nav class="crumbs ui" aria-label="Breadcrumb"><a href="#home">Home</a><span>/</span><a href="#shop">Store</a><span>/</span><a href="#c-${c.id}">${esc(c.name)}</a><span>/</span><span style="color:var(--moon)">${esc(p.name)}</span></nav>
      <div class="pdp">
        <div class="pdp-media">
          <div class="stage${p.image ? ' photo' : ''}" id="stage">
            <div class="view flat on" style="background-image:url('${P.url(p)}')"></div>
            <div class="view fold" style="background-image:url('${P.url(p)}')"></div>
            <div class="view detail" style="background-image:url('${P.url(p, 'detail')}')"></div>
            <div class="lens" id="lens" style="background-image:url('${P.url(p)}')"></div>
          </div>
          <div class="views ui" role="tablist" aria-label="Views">
            <button class="on" data-view="flat">Flat</button><button data-view="fold">Folded</button><button data-view="detail">Detail</button>
            <span class="dim" style="margin-left:auto">${fine ? 'Hover to zoom' : 'Tap a view'}</span>
          </div>
        </div>
        <div class="buy">
          <div style="display:grid;gap:14px">
            <p class="ui pink" style="margin:0">${esc(c.name)}${c.kicker ? ' · ' + esc(c.kicker) : ''}</p>
            <h1 class="display">${esc(p.name)}</h1>
            <span class="price" id="pdpPrice">${inr(p.price)}</span>
          </div>
          <p class="lede">${esc(p.story)}</p>
          ${p.stock ? `<p class="limited ui"><i></i>Limited drop · only ${p.stock} made</p>` : ''}
          <div class="opt">
            <div class="opt-head ui"><span>Size</span><span id="sizeNote">${SIZES[0].dims}</span></div>
            <div class="sizes" role="radiogroup" aria-label="Size">${SIZES.map((s, i) => `<button class="size ${i ? '' : 'on'}" role="radio" aria-checked="${!i}" data-size="${s.id}"><b>${s.label}</b><small>${s.dims}${s.add ? ' · +' + inr(s.add) : ''}</small></button>`).join('')}</div>
          </div>
          <div class="buy-row">
            <div class="qty" aria-label="Quantity"><button data-q="-1" aria-label="Decrease">−</button><output id="pdpQty">1</output><button data-q="1" aria-label="Increase">+</button></div>
            <button class="btn" id="pdpAdd">Add to bag ${arrow}</button>
          </div>
          <div class="specs ui"><span>${esc(c.fabric)}</span>${c.features.map(f => `<span>✦ ${esc(f)}</span>`).join('')}</div>
          <div class="acc ui">
            <details open><summary>Story of the print</summary><div class="body"><p>${esc(p.story)}</p><p>${esc(c.blurb)}</p></div></details>
            <details><summary>How to wear</summary><div class="body"><p>Headband, neck knot, ponytail, wrist cuff, rider, sweatband, bag charm, pocket square, even gift wrap. One square, twelve ways and counting. Every box carries a QR code to our styling guide.</p><p><a class="link" href="#ways">See all ways to wear</a></p></div></details>
            <details><summary>Care</summary><div class="body"><p>Hand wash cold with mild soap. Dry in shade. Hand-dyed colours soften with the first wash.</p></div></details>
            <details><summary>Shipping &amp; returns</summary><div class="body"><p>Free shipping in India over ₹999. Exchanges within 7 days on unworn pieces.</p></div></details>
          </div>
        </div>
      </div>
      <section class="section" style="padding-top:0">${head('✦', 'Same orbit', 'You may also like')}<div class="grid">${more.map(card).join('')}</div></section>
    </div>`;
  }

  function viewStory() {
    return `
    <section class="story-hero">
      <span class="dots" style="--mx:80%;--my:30%"></span>
      <div class="wrap">
        <p class="ui pink">✦ The universe</p>
        <h1 class="display">Who are we?</h1>
        <p class="lede">Untied is built to elevate your fashion game with one simple accessory. A bandana that is useful every day and expresses who you are.</p>
      </div>
    </section>
    <section class="section wrap" style="padding-top:0">
      <div class="two">
        <h2 class="display" data-reveal>A brand in motion</h2>
        <div class="stack" data-reveal><p>Untied is built on the belief that identity is never fixed.</p><p class="dim">Like stars moving through an endless sky, people evolve through experiences, relationships, cultures and time.</p><p>Untied exists for those who embrace change rather than resist it.</p></div>
      </div>
    </section>
    <section class="band section">
      <img class="comet" src="${A.comet}" alt="" data-parallax=".15" style="opacity:.55">
      <div class="wrap two" style="position:relative;z-index:2">
        <h2 class="display" data-reveal>Always becoming</h2>
        <div class="stack" data-reveal><p>We are not meant to remain the same.</p><p>We outgrow places.</p><p>We outgrow ideas.</p><p>We outgrow versions of ourselves.</p><p class="pink">Growth begins where certainty ends.</p></div>
      </div>
    </section>
    <section class="section wrap">
      <div class="mv">
        <div data-reveal><p class="ui pink" style="margin:0">Why we exist</p><h3>Mission</h3><p class="lede">To create products, experiences and stories that encourage self-expression and celebrate personal freedom.</p></div>
        <div data-reveal style="--d:100ms"><p class="ui pink" style="margin:0">Where we are going</p><h3>Vision</h3><p class="lede">To build a cultural brand that inspires people to move through life with curiosity, confidence and authenticity.</p></div>
      </div>
    </section>
    <section class="section wrap" style="padding-top:0">
      <div class="two">
        <div data-reveal><p class="ui pink" style="margin:0 0 16px">The guiding star</p><h2 class="display">Part orbit. Part bird. Part comet. Part possibility.</h2><p class="lede" style="margin-top:20px">Our symbol is a celestial body moving through space. Its ambiguity lets each person discover their own meaning.</p></div>
        <div class="box" data-reveal><canvas id="storyCanvas" style="width:100%;height:100%;position:absolute;inset:0"></canvas></div>
      </div>
    </section>
    <section class="section wrap" style="padding-top:0">
      <div class="two">
        <div class="box" data-reveal><img src="${A.comet}" alt="" style="opacity:.8"><span class="mask wordmark"></span></div>
        <div data-reveal><p class="ui pink" style="margin:0 0 16px">The box</p><h2 class="display">Opened like a night sky.</h2>
          <div class="specs ui" style="display:grid;gap:12px;margin-top:24px"><span>✦ Halftone comet on deep space black</span><span>✦ Nova blue inside, scattered with trail stars</span><span>✦ "Remain Untied" on every side</span><span>✦ Care card and a QR code to our styling guide</span></div>
          <p style="margin-top:30px"><a class="btn" href="#shop">Enter the store ${arrow}</a></p>
        </div>
      </div>
    </section>`;
  }

  function viewInfo(kind) {
    const INFO = {
      care: ['Help', 'Care guide', [
        ['Washing', 'Hand wash cold with a mild soap, or dry clean. Never wring the satin.'],
        ['Drying', 'Roll in a towel to lift the water, then dry flat in the shade.'],
        ['Ironing', 'Low heat on the reverse, with a cloth between the iron and the print.'],
        ['Storing', 'Fold loosely or roll. Keep away from direct sun so the colours stay deep.']
      ]],
      faq: ['Help', 'Shipping & returns', [
        ['Shipping', 'Free shipping across India over ₹999. Below that, ₹79. Dispatch in 2 to 3 working days.'],
        ['Exchanges', 'Exchange unworn pieces with tags within 7 days of delivery.'],
        ['Limited drops', 'Pieces marked Limited can be exchanged for store credit only.'],
        ['Cash on delivery', 'Available on most pin codes in India.']
      ]],
      terms: ['Legal', 'Terms & conditions', [
        ['About these terms', 'These terms apply when you browse untied.in or buy from Untied. By placing an order you agree to them. We may update them from time to time, and the version on this page is the one that applies.'],
        ['Products', 'Every Untied piece is printed in small batches, so colours and placement can vary slightly from the photos. Sizes are listed on each product page.'],
        ['Prices & payment', 'Prices are in Indian rupees and include applicable taxes. Shipping is added at checkout. An order is confirmed once payment is received, or once you choose cash on delivery where available.'],
        ['Shipping', 'We ship across India and usually dispatch within 2 to 3 working days. Delivery times are estimates from our courier partners and can change.'],
        ['Exchanges & returns', 'Unworn pieces with tags can be exchanged within 7 days of delivery. Limited drop pieces can be exchanged for store credit only. See Shipping & returns for details.'],
        ['Cancellations', 'You can cancel an order before it is dispatched by contacting us. Once shipped, it follows the exchange policy.'],
        ['Intellectual property', 'All prints, artwork, photos, logos and text on this site belong to Untied and may not be copied or reused without permission.'],
        ['Privacy', 'We only use your details to process your order and, if you sign up, to send drop news. We never sell your information.'],
        ['Governing law', 'These terms are governed by the laws of India.'],
        ['Questions', 'Write to us any time from the Contact page.']
      ]]
    };
    if (kind === 'contact') return `<section class="wrap page-head"><p class="ui pink">✦ Say hello</p><h1 class="display">Contact</h1><p class="lede" style="max-width:560px">Questions about an order, a collaboration, or just want to talk stars? We usually reply within two working days.</p></section>
    <section class="wrap" style="padding-bottom:110px;max-width:980px;margin-inline:0"><div class="acc ui">${[
      ['Email', '<a class="link" href="mailto:hello@untied.in">hello@untied.in</a>'],
      ['Instagram', '<a class="link" href="https://instagram.com/untiedco" target="_blank" rel="noopener">@untiedco</a>'],
      ['Orders & exchanges', 'Include your order number (it starts with UNT-) so we can find it quickly.'],
      ['Collaborations & pop-ups', 'Tell us about your event or idea and we will get back to you.']
    ].map(([q, a]) => `<details open><summary>${q}</summary><div class="body"><p>${a}</p></div></details>`).join('')}</div></section>`;
    const [eyebrow, title, rows] = INFO[kind];
    return `<section class="wrap page-head"><p class="ui pink">✦ ${eyebrow}</p><h1 class="display">${title}</h1></section>
    <section class="wrap" style="padding-bottom:110px;max-width:980px;margin-inline:0"><div class="acc ui">${rows.map(([q, a], i) => `<details ${i ? '' : 'open'}><summary>${q}</summary><div class="body"><p>${a}</p></div></details>`).join('')}</div></section>`;
  }

  /* ---------- cart ---------- */
  const key = l => l.id + '|' + l.size;
  const unit = l => byId(l.id).price + (SIZES.find(s => s.id === l.size)?.add || 0);
  const subtotal = () => cart.reduce((s, l) => s + unit(l) * l.qty, 0);
  const count = () => cart.reduce((s, l) => s + l.qty, 0);
  const shipping = () => (subtotal() >= DATA.freeShippingOver || !cart.length ? 0 : 79);
  function saveCart() { store.set('untied.cart', cart); renderCart(); }
  function addToCart(id, size = 'classic', qty = 1, fromEl) {
    const p = byId(id); if (!p) return;
    const ex = cart.find(l => l.id === id && l.size === size);
    if (ex) ex.qty = Math.min(ex.qty + qty, 10); else cart.push({ id, size, qty });
    saveCart(); fly(p, fromEl); toast(`${p.name} added`);
  }
  function fly(p, fromEl) {
    const bag = $('#bagBtn'), n = $('#bagCount');
    const bump = () => { n.classList.remove('bump'); void n.offsetWidth; n.classList.add('bump'); };
    if (!fromEl || reduce) return bump();
    const a = fromEl.getBoundingClientRect(), b = bag.getBoundingClientRect();
    const d = document.createElement('div'); d.className = 'fly'; d.style.backgroundImage = `url("${P.url(p, 'detail')}")`;
    d.style.left = a.left + a.width / 2 - 22 + 'px'; d.style.top = a.top + a.height / 2 - 22 + 'px';
    document.body.appendChild(d);
    const dx = b.left + b.width / 2 - (a.left + a.width / 2), dy = b.top + b.height / 2 - (a.top + a.height / 2);
    d.animate([{ transform: 'translate(0,0) scale(1)' }, { transform: `translate(${dx * .4}px, ${dy - 120}px) scale(.8)`, offset: .5 }, { transform: `translate(${dx}px, ${dy}px) scale(.15)`, opacity: .3 }], { duration: 850, easing: 'cubic-bezier(.5,0,.3,1)' }).onfinish = () => { d.remove(); bump(); };
  }
  function renderCart() {
    const n = count(); $('#bagCount').textContent = pad(n);
    const left = DATA.freeShippingOver - subtotal();
    $('#meter').innerHTML = cart.length
      ? `<span>${left > 0 ? `${inr(left)} away from free shipping` : '✦ Free shipping unlocked'}</span><div class="track"><div class="fill" style="width:${Math.min(100, subtotal() / DATA.freeShippingOver * 100)}%"></div></div>`
      : `<span>Free shipping in India over ${inr(DATA.freeShippingOver)}</span>`;
    $('#items').innerHTML = cart.length ? cart.map(l => {
      const p = byId(l.id), s = SIZES.find(x => x.id === l.size);
      return `<div class="item" data-key="${key(l)}"><a href="#p-${p.id}" data-close-drawer><img src="${P.url(p)}" alt=""></a>
        <div><h3>${esc(p.name)}</h3><p class="ui dim">${s.label} · ${s.dims}</p><div class="qty"><button data-lq="-1" aria-label="Decrease">−</button><output>${l.qty}</output><button data-lq="1" aria-label="Increase">+</button></div></div>
        <div style="text-align:right;display:grid;align-content:space-between"><span class="price">${inr(unit(l) * l.qty)}</span><button class="rm ui" data-rm>Remove</button></div></div>`;
    }).join('') : `<div class="drawer-empty"><span class="mask symbol"></span><p class="display" style="font-size:18px;color:var(--moon)">Your bag is empty</p><p class="ui">Every journey starts somewhere.</p><a class="btn" href="#shop" data-close-drawer>Start shopping ${arrow}</a></div>`;
    $('#drawerFoot').innerHTML = cart.length ? `<div class="sum ui"><span>Subtotal</span><span class="price">${inr(subtotal())}</span></div><a class="btn block" href="#checkout" data-close-drawer>Checkout · ${inr(subtotal() + shipping())}</a><p class="ui dim" style="margin:0;text-align:center">Shipping ${shipping() ? inr(shipping()) : 'free'} · taxes included</p>` : '';
  }
  function openDrawer(open = true) {
    $('#drawer').classList.toggle('open', open); $('#scrim').classList.toggle('on', open);
    $('#drawer').setAttribute('aria-hidden', String(!open)); document.body.style.overflow = open ? 'hidden' : '';
    if (open) setTimeout(() => $('#drawerClose').focus(), 350);
  }

  /* ---------- ways to wear: the scarf photo morphs into each fold ---------- */
  let waysTimer;
  function bindWays() {
    const fold = $('#fold'); if (!fold) return;
    const rows = $$('.way-row'), img = $('#foldImg');
    let cur = 0, paused = false;
    const show = i => {
      cur = i; const w = WAYS[i], p = DATA.products[i % DATA.products.length];
      rows.forEach(r => r.classList.toggle('on', +r.dataset.way === i));
      fold.style.clipPath = `polygon(${SHAPES[w.shape]})`;
      fold.style.transform = `rotate(${w.shape === 'diamond' ? 45 : w.rot}deg) scale(${w.shape === 'diamond' ? .74 : w.shape === 'roll' ? 1.08 : 1})`;
      if (img.dataset.id !== p.id) { img.style.opacity = 0; setTimeout(() => { img.src = P.url(p); img.dataset.id = p.id; img.style.opacity = 1; }, 250); }
      $('#foldName').textContent = w.name; $('#foldN').textContent = `${pad(i + 1)} / ${pad(WAYS.length)}`;
    };
    const visible = () => rows.filter(r => !r.hidden).map(r => +r.dataset.way);
    rows.forEach(r => {
      const go = () => { paused = true; show(+r.dataset.way); };
      r.addEventListener('mouseenter', () => fine && go()); r.addEventListener('click', go);
      r.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); } });
    });
    $('.ways-list').addEventListener('mouseleave', () => { paused = false; });
    $$('[data-way-filter]').forEach(b => b.addEventListener('click', () => {
      $$('[data-way-filter]').forEach(x => x.classList.toggle('on', x === b));
      rows.forEach(r => { r.hidden = b.dataset.wayFilter !== 'all' && r.dataset.type !== b.dataset.wayFilter; });
      show(visible()[0]);
    }));
    img.dataset.id = DATA.products[0].id; show(0);
    clearInterval(waysTimer);
    if (!reduce && fine) waysTimer = setInterval(() => { if (paused || !document.body.contains(fold)) return; const v = visible(); show(v[(v.indexOf(cur) + 1) % v.length]); }, 2600);
  }

  /* ---------- light / dark mode ---------- */
  function setThemeLabels() {
    const light = document.documentElement.dataset.theme === 'light';
    $$('.theme-label').forEach(l => (l.textContent = light ? 'Dark' : 'Light'));
  }
  function toggleTheme() {
    const apply = () => {
      const light = document.documentElement.dataset.theme !== 'light';
      if (light) document.documentElement.dataset.theme = 'light'; else delete document.documentElement.dataset.theme;
      try { localStorage.removeItem('untied.theme'); } catch (e) {}
      setThemeLabels(); dispatchEvent(new Event('untied-theme'));
    };
    if (reduce) return apply();
    const w = $('#wipe'); w.className = 'wipe theme in';
    setTimeout(() => { apply(); w.className = 'wipe theme out'; setTimeout(() => (w.className = 'wipe'), 550); }, 460);
  }

  /* ---------- checkout ---------- */
  function viewCheckout() {
    if (!cart.length) return `<section class="wrap confirm"><span class="mask symbol"></span><h1 class="display">Your bag is empty</h1><a class="btn" href="#shop">Enter the store ${arrow}</a></section>`;
    const f = (id, label, type = 'text', extra = '', full = false) => `<div class="f ${full ? 'full' : ''}"><label class="ui" for="${id}">${label}</label><input id="${id}" name="${id}" type="${type}" ${extra}><span class="err"></span></div>`;
    const states = ['Andhra Pradesh', 'Assam', 'Bihar', 'Chandigarh', 'Chhattisgarh', 'Delhi', 'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jammu & Kashmir', 'Jharkhand', 'Karnataka', 'Kerala', 'Ladakh', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Puducherry', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal'];
    return `
    <section class="wrap page-head"><p class="ui pink">✦ Almost yours</p><h1 class="display">Checkout</h1></section>
    <section class="wrap checkout">
      <form class="form" id="checkoutForm" novalidate>
        <fieldset><legend>Contact</legend><div class="fields">${f('co-name', 'Full name', 'text', 'autocomplete="name"', true)}${f('co-email', 'Email', 'email', 'autocomplete="email"')}${f('co-phone', 'Phone', 'tel', 'autocomplete="tel" inputmode="numeric" placeholder="10-digit mobile"')}</div></fieldset>
        <fieldset><legend>Delivery</legend><div class="fields">${f('co-address', 'Address', 'text', 'autocomplete="street-address"', true)}${f('co-city', 'City', 'text', 'autocomplete="address-level2"')}
          <div class="f"><label class="ui" for="co-state">State</label><select id="co-state" name="co-state"><option value="">Select state</option>${states.map(s => `<option>${s}</option>`).join('')}</select><span class="err"></span></div>
          ${f('co-pin', 'PIN code', 'text', 'inputmode="numeric" maxlength="6" placeholder="6 digits"')}</div></fieldset>
        <fieldset><legend>Payment</legend><div class="pay ui">
          <label><input type="radio" name="pay" value="UPI" checked> UPI <small>GPay · PhonePe · Paytm</small></label>
          <label><input type="radio" name="pay" value="Card"> Card <small>Visa · Mastercard · RuPay</small></label>
          <label><input type="radio" name="pay" value="Cash on delivery"> Cash on delivery</label>
        </div><p class="demo ui">Demo checkout: no payment is taken yet. Connect Razorpay or Shopify to take real orders.</p></fieldset>
        <button class="btn block" type="submit">Place order · ${inr(subtotal() + shipping())}</button>
      </form>
      <aside class="summary"><h2>Your order</h2>
        ${cart.map(l => { const p = byId(l.id); return `<div class="sum"><span style="display:flex;gap:12px;align-items:center;min-width:0"><img src="${P.url(p)}" alt="" style="width:46px;height:46px;object-fit:cover;border-radius:3px"><span>${esc(p.name)} × ${l.qty}<br><small class="ui dim">${SIZES.find(s => s.id === l.size).label}</small></span></span><span class="price">${inr(unit(l) * l.qty)}</span></div>`; }).join('')}
        <div class="sum ui"><span>Subtotal</span><span class="price">${inr(subtotal())}</span></div>
        <div class="sum ui"><span>Shipping</span><span class="price">${shipping() ? inr(shipping()) : 'Free'}</span></div>
        <div class="sum total"><span>Total</span><span class="price" style="font-size:16px">${inr(subtotal() + shipping())}</span></div>
      </aside>
    </section>`;
  }
  function validate(form) {
    const rules = {
      'co-name': v => v.trim().length > 1 || 'Enter your name',
      'co-email': v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) || 'Enter an email like name@mail.com',
      'co-phone': v => /^[6-9]\d{9}$/.test(v.replace(/\D/g, '').slice(-10)) || 'Enter a 10-digit Indian mobile number',
      'co-address': v => v.trim().length > 5 || 'Enter your street address',
      'co-city': v => v.trim().length > 1 || 'Enter your city',
      'co-state': v => !!v || 'Pick your state',
      'co-pin': v => /^[1-9]\d{5}$/.test(v) || 'PIN codes have 6 digits'
    };
    let first = null;
    Object.entries(rules).forEach(([id, fn]) => {
      const el = form.elements[id], w = el.closest('.f'), r = fn(el.value);
      w.classList.toggle('bad', r !== true); $('.err', w).textContent = r === true ? '' : r;
      if (r !== true && !first) first = el;
    });
    if (first) first.focus();
    return !first;
  }
  function viewConfirm() {
    const o = store.get('untied.orders', []).slice(-1)[0];
    if (!o) return viewCheckout();
    return `<section class="wrap confirm"><span class="dots"></span><span class="mask symbol"></span><p class="ui pink">Order ${esc(o.id)}</p><h1 class="display">Follow the orbit</h1>
      <p class="lede">Thank you, ${esc(o.name.split(' ')[0])}. Updates are on their way to ${esc(o.email)}. Total ${inr(o.total)} via ${esc(o.pay)}.</p><a class="btn" href="#shop">Keep exploring ${arrow}</a></section>`;
  }

  /* ---------- router ---------- */
  const shop = { sort: 'featured' };
  function parse() {
    const h = location.hash.replace('#', '') || 'home';
    if (h.startsWith('p-') && byId(h.slice(2))) return { name: 'product', id: h.slice(2) };
    if (h.startsWith('c-') && coll(h.slice(2))) return { name: 'shop', filter: h.slice(2) };
    if (['shop', 'story', 'checkout', 'order', 'care', 'faq', 'terms', 'contact'].includes(h)) return { name: h };
    if (['collections', 'ways', 'drops', 'manifesto'].includes(h)) return { name: 'home', anchor: h };
    return { name: 'home' };
  }
  let first = true, last = '';
  function route() {
    const r = parse(), app = $('#app'), k = r.name + (r.id || '') + (r.filter || '');
    const go = () => {
      if (k !== last || r.name !== 'home') {
        app.innerHTML = r.name === 'product' ? viewProduct(byId(r.id)) : r.name === 'shop' ? viewShop(r.filter || 'all') : r.name === 'story' ? viewStory()
          : r.name === 'checkout' ? viewCheckout() : r.name === 'order' ? viewConfirm() : ['care', 'faq', 'terms', 'contact'].includes(r.name) ? viewInfo(r.name) : viewHome();
        if (r.name === 'shop') { renderShopGrid(r.filter || 'all', shop.sort); $('#sortSel').value = shop.sort; }
        if (r.name === 'product') bindProduct(byId(r.id));
        if (r.name === 'home') bindHome();
        if (r.name === 'story') HT.mount($('#storyCanvas'), { src: A.symbol, step: 7, fit: .7, field: true }).catch(() => {});
        setupReveal(); parallax();
      }
      last = k;
      $$('.nav a').forEach(a => a.classList.toggle('active', a.dataset.nav === (r.anchor || r.name)));
      document.title = r.name === 'product' ? `${byId(r.id).name} · Untied` : r.name === 'home' ? 'Untied' : 'Untied · ' + ({ shop: 'Store', story: 'Universe', checkout: 'Checkout', order: 'Order placed', care: 'Care', faq: 'Shipping' }[r.name] || '');
      if (r.anchor) requestAnimationFrame(() => document.getElementById(r.anchor)?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' }));
      else if (!first) window.scrollTo(0, 0);
      first = false;
    };
    if (first || reduce || (r.name === 'home' && last === 'home')) return go();
    const w = $('#wipe'); w.className = 'wipe in';
    setTimeout(() => { go(); w.className = 'wipe out'; setTimeout(() => (w.className = 'wipe'), 550); }, 460);
  }

  /* ---------- page bindings ---------- */
  function bindHome() {
    const hero = $('#hero');
    HT.mount($('#heroCanvas'), { src: A.symbol, step: fine ? 8 : 7, fit: .74, host: hero }).catch(() => {
      $('#heroCanvas').outerHTML = `<span class="mask symbol" style="width:60%;margin:auto;position:absolute;inset:0;color:var(--moon)"></span>`;
    });
    if (fine) hero.addEventListener('pointermove', e => {
      const r = hero.getBoundingClientRect();
      $('#heroDots').style.setProperty('--mx', ((e.clientX - r.left) / r.width * 100).toFixed(1) + '%');
      $('#heroDots').style.setProperty('--my', ((e.clientY - r.top) / r.height * 100).toFixed(1) + '%');
    });
    bindWays();
    // floating preview on collection rows
    const pv = $('#preview'), pimg = $('#previewImg');
    $$('.coll-row').forEach(row => {
      if (!fine) return;
      row.addEventListener('pointerenter', () => { pimg.src = row.dataset.preview; pv.classList.add('on'); });
      row.addEventListener('pointerleave', () => pv.classList.remove('on'));
      row.addEventListener('pointermove', e => { pv.style.left = e.clientX + 'px'; pv.style.top = e.clientY + 'px'; });
    });
    const form = $('#newsForm');
    form.addEventListener('submit', e => {
      e.preventDefault();
      const email = $('#newsEmail').value.trim(), note = $('#newsNote');
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { note.textContent = 'That email looks off. Try name@mail.com.'; note.className = 'note ui pink'; return; }
      const list = store.get('untied.newsletter', []); if (!list.includes(email)) list.push(email); store.set('untied.newsletter', list);
      note.textContent = "✦ You're in. See you at the next drop."; note.className = 'note ui ok'; form.reset();
    });
  }
  function bindProduct(p) {
    let size = 'classic', qty = 1;
    const stage = $('#stage'), lens = $('#lens');
    $$('.views [data-view]').forEach(b => b.addEventListener('click', () => {
      $$('.views [data-view]').forEach(x => x.classList.toggle('on', x === b));
      $$('.stage .view').forEach(v => v.classList.toggle('on', v.classList.contains(b.dataset.view)));
      lens.style.backgroundImage = `url('${P.url(p, b.dataset.view === 'detail' ? 'detail' : 'flat')}')`;
    }));
    if (fine) {
      stage.addEventListener('pointerenter', () => stage.classList.add('zoom'));
      stage.addEventListener('pointerleave', () => stage.classList.remove('zoom'));
      stage.addEventListener('pointermove', e => {
        const r = stage.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
        lens.style.left = x + 'px'; lens.style.top = y + 'px';
        lens.style.backgroundSize = `${r.width * 2.6}px ${r.height * 2.6}px`;
        lens.style.backgroundPosition = `${-(x * 2.6 - 95)}px ${-(y * 2.6 - 95)}px`;
      });
    }
    $$('.size').forEach(b => b.addEventListener('click', () => {
      size = b.dataset.size;
      $$('.size').forEach(x => { x.classList.toggle('on', x === b); x.setAttribute('aria-checked', String(x === b)); });
      $('#sizeNote').textContent = SIZES.find(s => s.id === size).dims;
      $('#pdpPrice').textContent = inr(p.price + SIZES.find(s => s.id === size).add);
    }));
    $$('[data-q]').forEach(b => b.addEventListener('click', () => { qty = Math.max(1, Math.min(10, qty + +b.dataset.q)); $('#pdpQty').textContent = qty; }));
    $('#pdpAdd').addEventListener('click', () => addToCart(p.id, size, qty, stage));
  }

  /* ---------- scroll effects ---------- */
  let pending = [], para = [];
  function setupReveal() {
    if (reduce) return;
    pending = $$('[data-reveal]').filter(el => el.getBoundingClientRect().top > innerHeight);
    pending.forEach(el => el.classList.add('reveal-pending'));
  }
  function parallax() { para = reduce ? [] : $$('[data-parallax]'); }
  function onScroll() {
    const vh = innerHeight;
    if (pending.length) pending = pending.filter(el => { if (el.getBoundingClientRect().top < vh * .94) { el.classList.add('reveal-in'); el.classList.remove('reveal-pending'); return false; } return true; });
    para.forEach(el => { const r = el.parentElement.getBoundingClientRect(); el.style.setProperty('--py', ((r.top + r.height / 2 - vh / 2) * -+el.dataset.parallax).toFixed(1) + 'px'); });
    const lines = $('#manifestoLines');
    if (lines) $$('span', lines).forEach(s => s.classList.toggle('lit', s.getBoundingClientRect().top < vh * .72));
    const h = $('#header'), y = scrollY;
    h.classList.toggle('scrolled', y > 20);
    h.classList.toggle('hide', y > 500 && y > onScroll.ly + 4 && !$('#drawer').classList.contains('open'));
    if (y < onScroll.ly - 4) h.classList.remove('hide');
    onScroll.ly = y;
  }
  onScroll.ly = 0;

  /* ---------- misc ---------- */
  let tT;
  function toast(msg) {
    const t = $('#toast'); t.innerHTML = `<span>✦ ${esc(msg)}</span><button data-open-bag>View bag</button>`;
    t.classList.add('on'); clearTimeout(tT); tT = setTimeout(() => t.classList.remove('on'), 3000);
  }
  function search(q) {
    q = q.trim().toLowerCase();
    const res = q ? DATA.products.filter(p => (p.name + ' ' + coll(p.collection).name + ' ' + coll(p.collection).fabric).toLowerCase().includes(q)) : DATA.products.slice(0, 4);
    $('#searchResults').innerHTML = res.length ? res.map(card).join('') : `<p class="empty">Nothing matches “${esc(q)}”. Try indigo, satin or jaal.</p>`;
  }
  function openSearch(open = true) {
    $('#search').classList.toggle('open', open); document.body.style.overflow = open ? 'hidden' : '';
    if (open) { search($('#searchInput').value); setTimeout(() => $('#searchInput').focus(), 60); }
  }
  function cursor() {
    if (!fine || reduce) return;
    const c = $('#cursor'), ring = $('.c-ring', c); document.documentElement.classList.add('star-cursor'); let x = 0, y = 0, rx = 0, ry = 0;
    addEventListener('pointermove', e => {
      x = e.clientX; y = e.clientY; c.classList.add('on');
      c.classList.toggle('big', !!e.target.closest('a, button, select, label, .stage'));
      c.classList.toggle('text', !!e.target.closest('input'));
    });
    document.addEventListener('pointerleave', () => c.classList.remove('on'));
    (function tick() { rx += (x - rx) * .18; ry += (y - ry) * .18; c.style.transform = `translate(${x}px, ${y}px)`; ring.style.transform = `translate(${rx - x}px, ${ry - y}px)`; requestAnimationFrame(tick); })();
  }

  function bindGlobal() {
    document.addEventListener('click', e => {
      const add = e.target.closest('[data-add]');
      if (add) { e.preventDefault(); addToCart(add.dataset.add, 'classic', 1, add.closest('.card')?.querySelector('.card-media') || add); return; }
      const f = e.target.closest('[data-filter]');
      if (f) { location.hash = f.dataset.filter === 'all' ? 'shop' : 'c-' + f.dataset.filter; return; }
      if (e.target.closest('[data-open-bag]')) { openDrawer(true); return; }
      if (e.target.closest('[data-open-search]')) { e.preventDefault(); $('#mobileNav').classList.remove('open'); openSearch(true); return; }
      if (e.target.closest('[data-close-drawer]')) openDrawer(false);
      const it = e.target.closest('.item');
      if (it) {
        const l = cart.find(x => key(x) === it.dataset.key); if (!l) return;
        const q = e.target.closest('[data-lq]');
        if (q) { l.qty = Math.max(0, Math.min(10, l.qty + +q.dataset.lq)); if (!l.qty) cart = cart.filter(x => x !== l); saveCart(); }
        if (e.target.closest('[data-rm]')) { it.classList.add('leaving'); setTimeout(() => { cart = cart.filter(x => x !== l); saveCart(); }, 330); }
      }
      if (e.target.closest('#search a')) openSearch(false);
      if (e.target.closest('.mobile-nav a')) $('#mobileNav').classList.remove('open');
    });
    document.addEventListener('change', e => { if (e.target.id === 'sortSel') { shop.sort = e.target.value; renderShopGrid(parse().filter || 'all', shop.sort); setupReveal(); } });
    document.addEventListener('submit', e => {
      if (e.target.id !== 'checkoutForm') return;
      e.preventDefault(); if (!validate(e.target)) return;
      const fd = new FormData(e.target);
      const order = { id: 'UNT-' + Date.now().toString(36).toUpperCase().slice(-6), name: fd.get('co-name'), email: fd.get('co-email'), pay: fd.get('pay'), total: subtotal() + shipping(), items: cart, at: new Date().toISOString() };
      const orders = store.get('untied.orders', []); orders.push(order); store.set('untied.orders', orders);
      cart = []; saveCart(); location.hash = 'order';
    });
    $('#bagBtn').addEventListener('click', () => openDrawer(true));
    $('#drawerClose').addEventListener('click', () => openDrawer(false));
    $('#scrim').addEventListener('click', () => openDrawer(false));
    $('#searchBtn').addEventListener('click', () => openSearch(true));
    $('#searchClose').addEventListener('click', () => openSearch(false));
    $('#searchInput').addEventListener('input', e => search(e.target.value));
    $('#menuBtn').addEventListener('click', () => $('#mobileNav').classList.add('open'));
    $('#menuClose').addEventListener('click', () => $('#mobileNav').classList.remove('open'));
    addEventListener('keydown', e => { if (e.key === 'Escape') { openDrawer(false); openSearch(false); $('#mobileNav').classList.remove('open'); } });
    addEventListener('hashchange', route);
    addEventListener('scroll', onScroll, { passive: true });
    addEventListener('resize', onScroll);
  }

  /* ---------- boot ---------- */
  async function boot() {
    $('#announce').innerHTML = Array(2).fill(`<span>${ANNOUNCE.map(a => `${a} ${star()}`).join(' ')}</span>`).join('');
    $('#year').textContent = new Date().getFullYear();
    const loader = $('#loader');
    let seen = false; try { seen = sessionStorage.getItem('untied.loaded'); sessionStorage.setItem('untied.loaded', '1'); } catch (e) { }
    if (seen || reduce) loader.remove();
    else {
      document.body.classList.add('booting');
      HT.mount($('#loaderCanvas'), { src: A.wordmark, step: 4, fit: .98, field: false, interactive: false }).catch(() => {});
      const cnt = $('#loaderCount'), t0 = performance.now();
      (function tick() { const k = Math.min(1, (performance.now() - t0) / 1400); cnt.textContent = pad(Math.round(k * 100), 3); if (k < 1) requestAnimationFrame(tick); })();
    }
    try { DATA = await loadData(); } catch (err) {
      $('#app').innerHTML = `<section class="wrap confirm"><h1 class="display">The store didn't load</h1><p class="lede">data/products.json couldn't be read. Open the site through a local server, for example python3 -m http.server.</p></section>`;
      loader?.remove(); return;
    }
    cart = cart.filter(l => byId(l.id));
    setThemeLabels(); $$('[data-theme-toggle]').forEach(b => b.addEventListener('click', e => { e.preventDefault(); $('#mobileNav').classList.remove('open'); toggleTheme(); }));
    bindGlobal(); renderCart(); route(); cursor(); onScroll();
    if (!seen && !reduce) setTimeout(() => { loader.classList.add('done'); document.body.classList.remove('booting'); setTimeout(() => loader.remove(), 900); }, 1600);
  }
  boot();
})();
