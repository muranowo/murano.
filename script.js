/* =========================================================================
   Nikhil Maharjan — hero particle system
   A few thousand points, fourteen mathematical formations, one set of rules:
   spring toward a target, drift on ambient shimmer, flee the cursor.
   ========================================================================= */
(function () {
  const hero = document.getElementById('hero');
  const canvas = document.getElementById('scene');
  const ctx = canvas.getContext('2d');
  const label = document.getElementById('formationLabel');

  const BLUE = [43, 76, 255];
  const CORAL = [255, 92, 57];
  const SPRING = 0.028;
  const FRICTION = 0.90;
  const MOUSE_RADIUS = 130;
  const MOUSE_FORCE = 6.2;

  const FORMATIONS = [
    { key: 'name', label: 'Nikhil Maharjan' },
    { key: 'phyllotaxis', label: 'Phyllotaxis \u00B7 golden angle spiral' },
    { key: 'lissajous', label: 'Lissajous curve \u00B7 5:4' },
    { key: 'wave', label: 'Sine field' },
    { key: 'rose', label: 'Rose curve \u00B7 r = cos(7\u03B8)' },
    { key: 'spirograph', label: 'Hypotrochoid \u00B7 spirograph' },
    { key: 'star', label: 'Star polygon \u00B7 5 points' },
    { key: 'mandala', label: 'Mandala \u00B7 counter-rotating rings' },
    { key: 'sphere', label: 'Fibonacci sphere \u00B7 rotating' },
    { key: 'harmonograph', label: 'Harmonograph \u00B7 damped pendulum' },
    { key: 'superellipse', label: 'Superellipse \u00B7 squircle' },
    { key: 'sierpinski', label: 'Sierpinski triangle \u00B7 chaos game' },
    { key: 'tree', label: 'Fractal tree \u00B7 recursive branching' },
    { key: 'helix', label: 'Double helix \u00B7 rotating' }
  ];

  let w = 0, h = 0, dpr = 1;
  let particles = [];
  let formationIndex = 0;
  let mouse = { x: -9999, y: -9999, active: false };
  let autoTimer = null;
  let rafId = null;
  let reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------------- geometry / DPR setup ---------------- */

  function resizeCanvas() {
    const rect = hero.getBoundingClientRect();
    w = rect.width;
    h = rect.height;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = '#e4e7de';
    ctx.fillRect(0, 0, w, h);
  }

  function particleCount() {
    const area = w * h;
    return Math.max(700, Math.min(2200, Math.round(area / 1300)));
  }

  /* ---------------- formation generators ---------------- */

  function textTargets(count) {
    const off = document.createElement('canvas');
    off.width = w;
    off.height = h;
    const octx = off.getContext('2d');
    octx.clearRect(0, 0, w, h);
    octx.fillStyle = '#000';
    octx.textAlign = 'center';
    octx.textBaseline = 'middle';
    const fontSize = Math.max(28, Math.min(w / 6.4, h / 3.4));
    octx.font = `700 ${fontSize}px Fraunces, serif`;
    octx.fillText('NIKHIL', w / 2, h / 2 - fontSize * 0.58);
    octx.fillText('MAHARJAN', w / 2, h / 2 + fontSize * 0.58);

    const data = octx.getImageData(0, 0, w, h).data;
    const step = Math.max(2, Math.floor(Math.min(w, h) / 340));
    const candidates = [];
    for (let y = 0; y < h; y += step) {
      for (let x = 0; x < w; x += step) {
        const a = data[(y * w + x) * 4 + 3];
        if (a > 128) candidates.push({ x, y });
      }
    }
    for (let i = candidates.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
    }
    const pts = [];
    for (let i = 0; i < count; i++) {
      pts.push(candidates.length ? candidates[i % candidates.length] : { x: w / 2, y: h / 2 });
    }
    return pts;
  }

  function phyllotaxisTargets(count) {
    const cx = w / 2, cy = h / 2;
    const maxR = Math.min(w, h) * 0.46;
    const c = maxR / Math.sqrt(count);
    const goldenAngle = Math.PI * (3 - Math.sqrt(5)); // ~137.508 degrees
    const pts = [];
    for (let i = 0; i < count; i++) {
      const r = c * Math.sqrt(i);
      const theta = i * goldenAngle;
      pts.push({ x: cx + r * Math.cos(theta), y: cy + r * Math.sin(theta) });
    }
    return pts;
  }

  function lissajousTargets(count) {
    const cx = w / 2, cy = h / 2;
    const A = Math.min(w, h) * 0.42;
    const B = Math.min(w, h) * 0.38;
    const a = 5, b = 4, delta = Math.PI / 2;
    const pts = [];
    for (let i = 0; i < count; i++) {
      const t = (i / count) * Math.PI * 2;
      pts.push({
        x: cx + A * Math.sin(a * t + delta),
        y: cy + B * Math.sin(b * t)
      });
    }
    return pts;
  }

  function waveTargets(count) {
    const marginX = w * 0.1, marginY = h * 0.18;
    const gridW = w - marginX * 2, gridH = h - marginY * 2;
    const cols = Math.max(1, Math.round(Math.sqrt(count * (gridW / gridH))));
    const rows = Math.max(1, Math.ceil(count / cols));
    const pts = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (pts.length >= count) break;
        pts.push({
          x: marginX + (c + 0.5) * (gridW / cols),
          y: marginY + (r + 0.5) * (gridH / rows)
        });
      }
    }
    while (pts.length < count) pts.push({ x: w / 2, y: h / 2 });
    return pts;
  }

  // ---- rose curve: r = cos(k * theta), the classic rhodonea family ----
  function roseTargets(count) {
    const cx = w / 2, cy = h / 2;
    const R = Math.min(w, h) * 0.44;
    const k = 7;
    const pts = [];
    for (let i = 0; i < count; i++) {
      const t = (i / count) * Math.PI * 2;
      const r = R * Math.cos(k * t);
      pts.push({ x: cx + r * Math.cos(t), y: cy + r * Math.sin(t) });
    }
    return pts;
  }

  // ---- hypotrochoid / spirograph ----
  function spirographTargets(count) {
    const cx = w / 2, cy = h / 2;
    const scale = Math.min(w, h) * 0.42;
    const R = 5, r = 3, d = 5;
    const loops = 12;
    const raw = [];
    let maxAbs = 0.0001;
    for (let i = 0; i < count; i++) {
      const t = (i / count) * Math.PI * 2 * loops;
      const x = (R - r) * Math.cos(t) + d * Math.cos(((R - r) / r) * t);
      const y = (R - r) * Math.sin(t) - d * Math.sin(((R - r) / r) * t);
      raw.push({ x, y });
      maxAbs = Math.max(maxAbs, Math.abs(x), Math.abs(y));
    }
    const s = scale / maxAbs;
    return raw.map(p => ({ x: cx + p.x * s, y: cy + p.y * s }));
  }

  // ---- star polygon: evenly distributed points along a 5-point star outline ----
  function starTargets(count) {
    const cx = w / 2, cy = h / 2;
    const points = 5;
    const outerR = Math.min(w, h) * 0.46;
    const innerR = outerR * 0.42;
    const totalVerts = points * 2;
    const verts = [];
    for (let i = 0; i <= totalVerts; i++) {
      const ang = (i / totalVerts) * Math.PI * 2 - Math.PI / 2;
      const rad = i % 2 === 0 ? outerR : innerR;
      verts.push({ x: cx + rad * Math.cos(ang), y: cy + rad * Math.sin(ang) });
    }
    const segLens = [];
    let total = 0;
    for (let i = 0; i < verts.length - 1; i++) {
      const len = Math.hypot(verts[i + 1].x - verts[i].x, verts[i + 1].y - verts[i].y);
      segLens.push(len);
      total += len;
    }
    const pts = [];
    for (let i = 0; i < count; i++) {
      let target = (i / count) * total;
      let segIdx = 0;
      while (segIdx < segLens.length - 1 && target > segLens[segIdx]) {
        target -= segLens[segIdx];
        segIdx++;
      }
      const a = verts[segIdx], b = verts[segIdx + 1];
      const segLen = segLens[segIdx] || 1;
      const tt = target / segLen;
      pts.push({ x: a.x + (b.x - a.x) * tt, y: a.y + (b.y - a.y) * tt });
    }
    return pts;
  }

  // ---- mandala: concentric rings that counter-rotate at different speeds ----
  function mandalaTargets(count) {
    const cx = w / 2, cy = h / 2;
    const rings = 6;
    const maxR = Math.min(w, h) * 0.46;
    const totalInRing = Math.ceil(count / rings);
    const pts = [];
    for (let i = 0; i < count; i++) {
      const ringIndex = i % rings;
      const ringR = ((ringIndex + 1) / rings) * maxR;
      const perRingIndex = Math.floor(i / rings);
      const angle0 = (perRingIndex / totalInRing) * Math.PI * 2;
      const speed = 0.00022 * (ringIndex % 2 === 0 ? 1 : -1) * (1 + ringIndex * 0.35);
      pts.push({ x: cx + ringR * Math.cos(angle0), y: cy + ringR * Math.sin(angle0), ringR, angle0, speed });
    }
    return pts;
  }

  // ---- Fibonacci sphere, projected and slowly rotated ----
  function sphereTargets(count) {
    const pts = [];
    const offset = 2 / count;
    const increment = Math.PI * (3 - Math.sqrt(5));
    for (let i = 0; i < count; i++) {
      const y3 = (i * offset - 1) + offset / 2;
      const r = Math.sqrt(Math.max(0, 1 - y3 * y3));
      const phi = i * increment;
      pts.push({ x3: Math.cos(phi) * r, y3, z3: Math.sin(phi) * r });
    }
    return pts;
  }

  // ---- harmonograph: two damped, slightly detuned pendulums ----
  function harmonographTargets(count) {
    const cx = w / 2, cy = h / 2;
    const scale = Math.min(w, h) * 0.42;
    const f1 = 3, f2 = 2, p1 = 0, p2 = Math.PI / 2, d1 = 0.012, d2 = 0.012;
    const f3 = 3.005, f4 = 2, p3 = Math.PI / 16, p4 = 0, d3 = 0.012, d4 = 0.012;
    const totalT = 300;
    const raw = [];
    let maxAbs = 0.0001;
    for (let i = 0; i < count; i++) {
      const t = (i / count) * totalT;
      const x = Math.sin(t * f1 + p1) * Math.exp(-d1 * t) + Math.sin(t * f2 + p2) * Math.exp(-d2 * t);
      const y = Math.sin(t * f3 + p3) * Math.exp(-d3 * t) + Math.sin(t * f4 + p4) * Math.exp(-d4 * t);
      raw.push({ x, y });
      maxAbs = Math.max(maxAbs, Math.abs(x), Math.abs(y));
    }
    const s = scale / maxAbs;
    return raw.map(p => ({ x: cx + p.x * s, y: cy + p.y * s }));
  }

  // ---- superellipse / squircle: |x/a|^n + |y/b|^n = 1 ----
  function superellipseTargets(count) {
    const cx = w / 2, cy = h / 2;
    const a = Math.min(w, h) * 0.44, b = a;
    const n = 4;
    const pts = [];
    for (let i = 0; i < count; i++) {
      const t = (i / count) * Math.PI * 2;
      const ct = Math.cos(t), st = Math.sin(t);
      const x = Math.sign(ct) * Math.pow(Math.abs(ct), 2 / n) * a;
      const y = Math.sign(st) * Math.pow(Math.abs(st), 2 / n) * b;
      pts.push({ x: cx + x, y: cy + y });
    }
    return pts;
  }

  // ---- Sierpinski triangle via the chaos game ----
  function sierpinskiTargets(count) {
    const cx = w / 2, cy = h / 2;
    const R = Math.min(w, h) * 0.46;
    const verts = [
      { x: cx, y: cy - R },
      { x: cx - R * 0.8660254, y: cy + R * 0.5 },
      { x: cx + R * 0.8660254, y: cy + R * 0.5 }
    ];
    let cur = { x: cx, y: cy };
    for (let i = 0; i < 24; i++) {
      const v = verts[(Math.random() * 3) | 0];
      cur = { x: (cur.x + v.x) / 2, y: (cur.y + v.y) / 2 };
    }
    const pts = [];
    for (let i = 0; i < count; i++) {
      const v = verts[(Math.random() * 3) | 0];
      cur = { x: (cur.x + v.x) / 2, y: (cur.y + v.y) / 2 };
      pts.push({ x: cur.x, y: cur.y });
    }
    return pts;
  }

  // ---- recursive fractal tree, points sampled along its branches ----
  function fractalTreeTargets(count) {
    const startX = w / 2, startY = h * 0.86;
    const length0 = Math.min(w, h) * 0.24;
    const segments = [];

    function branch(x, y, angle, len, depth) {
      if (depth > 9 || len < 4) return;
      const x2 = x + Math.cos(angle) * len;
      const y2 = y + Math.sin(angle) * len;
      segments.push({ x1: x, y1: y, x2, y2 });
      const wiggle = (Math.random() * 0.12 - 0.06);
      branch(x2, y2, angle - 0.44 + wiggle, len * 0.72, depth + 1);
      branch(x2, y2, angle + 0.44 + wiggle, len * 0.72, depth + 1);
    }
    branch(startX, startY, -Math.PI / 2, length0, 0);

    let totalLen = 0;
    segments.forEach(s => {
      s.len = Math.hypot(s.x2 - s.x1, s.y2 - s.y1);
      totalLen += s.len;
    });

    const pts = [];
    for (let i = 0; i < count; i++) {
      let r = Math.random() * totalLen;
      let seg = segments[segments.length - 1];
      for (const s of segments) {
        if (r <= s.len) { seg = s; break; }
        r -= s.len;
      }
      const tt = Math.random();
      pts.push({ x: seg.x1 + (seg.x2 - seg.x1) * tt, y: seg.y1 + (seg.y2 - seg.y1) * tt });
    }
    return pts;
  }

  // ---- double helix, rotating about its vertical axis ----
  function helixTargets(count) {
    const topY = h * 0.12, bottomY = h * 0.88;
    const R = Math.min(w, h) * 0.16;
    const turns = 4;
    const half = Math.max(1, Math.floor(count / 2));
    const pts = [];
    for (let i = 0; i < count; i++) {
      const strand = i % 2;
      const tt = Math.floor(i / 2) / half;
      const y3 = topY + tt * (bottomY - topY);
      const angle0 = tt * Math.PI * 2 * turns + (strand === 0 ? 0 : Math.PI);
      pts.push({ y3, angle0, R });
    }
    return pts;
  }

  function generateTargets(key, count) {
    switch (key) {
      case 'phyllotaxis': return phyllotaxisTargets(count);
      case 'lissajous': return lissajousTargets(count);
      case 'wave': return waveTargets(count);
      case 'rose': return roseTargets(count);
      case 'spirograph': return spirographTargets(count);
      case 'star': return starTargets(count);
      case 'mandala': return mandalaTargets(count);
      case 'sphere': return sphereTargets(count);
      case 'harmonograph': return harmonographTargets(count);
      case 'superellipse': return superellipseTargets(count);
      case 'sierpinski': return sierpinskiTargets(count);
      case 'tree': return fractalTreeTargets(count);
      case 'helix': return helixTargets(count);
      default: return textTargets(count);
    }
  }

  /* ---------------- particle lifecycle ---------------- */

  function initParticles() {
    const count = particleCount();
    const cx = w / 2, cy = h / 2;
    particles = new Array(count);
    for (let i = 0; i < count; i++) {
      particles[i] = {
        x: cx + (Math.random() - 0.5) * 24,
        y: cy + (Math.random() - 0.5) * 24,
        vx: 0, vy: 0,
        tx: cx, ty: cy,
        baseX: cx, baseY: cy,
        meta: null,
        size: 1.1 + Math.random() * 1.9,
        phase: Math.random() * Math.PI * 2
      };
    }
    setFormation(0, true);
  }

  function setFormation(idx, silent) {
    formationIndex = ((idx % FORMATIONS.length) + FORMATIONS.length) % FORMATIONS.length;
    const f = FORMATIONS[formationIndex];
    const pts = generateTargets(f.key, particles.length);
    for (let i = 0; i < particles.length; i++) {
      particles[i].tx = pts[i].x;
      particles[i].ty = pts[i].y;
      particles[i].baseX = pts[i].x;
      particles[i].baseY = pts[i].y;
      particles[i].meta = pts[i];
    }
    const n = String(formationIndex + 1).padStart(2, '0');
    label.textContent = `${n} \u2014 ${f.label}`;
    if (!silent) resetAutoCycle();
    if (reduceMotion) drawStatic();
  }

  function nextFormation() { setFormation(formationIndex + 1); }

  /* ---------------- render loop ---------------- */

  function lerpColor(a, b, t) {
    return [
      Math.round(a[0] + (b[0] - a[0]) * t),
      Math.round(a[1] + (b[1] - a[1]) * t),
      Math.round(a[2] + (b[2] - a[2]) * t)
    ];
  }

  // Draws particles once, snapped straight to their target positions —
  // the fallback used when prefers-reduced-motion is on, so the hero
  // never renders as an empty canvas.
  function drawStatic() {
    ctx.fillStyle = '#e4e7de';
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      p.x = p.tx;
      p.y = p.ty;
      const mix = (Math.sin(p.phase) + 1) / 2;
      const col = lerpColor(BLUE, CORAL, mix);
      ctx.fillStyle = `rgb(${col[0]},${col[1]},${col[2]})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function step(time) {
    ctx.fillStyle = 'rgba(228, 231, 222, 0.16)';
    ctx.fillRect(0, 0, w, h);

    const cx = w / 2, cy = h / 2;
    const key = FORMATIONS[formationIndex].key;

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      let targetX, targetY, sizeMod = 1;

      if (key === 'wave') {
        targetX = p.baseX + Math.cos(time * 0.0011 + p.baseY * 0.01) * 12;
        targetY = p.baseY + Math.sin(time * 0.0016 + p.baseX * 0.012) * 26;
      } else if (key === 'mandala') {
        const m = p.meta;
        const ang = m.angle0 + time * m.speed;
        targetX = cx + m.ringR * Math.cos(ang);
        targetY = cy + m.ringR * Math.sin(ang);
      } else if (key === 'sphere') {
        const m = p.meta;
        const ang = time * 0.00055;
        const rx = m.x3 * Math.cos(ang) + m.z3 * Math.sin(ang);
        const rz = -m.x3 * Math.sin(ang) + m.z3 * Math.cos(ang);
        const scale = Math.min(w, h) * 0.4;
        targetX = cx + rx * scale;
        targetY = cy + m.y3 * scale;
        sizeMod = 0.55 + 0.55 * ((rz + 1) / 2);
      } else if (key === 'helix') {
        const m = p.meta;
        const ang = m.angle0 + time * 0.0009;
        targetX = cx + m.R * Math.cos(ang);
        targetY = m.y3;
        sizeMod = 0.55 + 0.55 * ((Math.sin(ang) + 1) / 2);
      } else {
        targetX = p.tx + Math.sin(time * 0.001 + p.phase) * 2.4;
        targetY = p.ty + Math.cos(time * 0.0012 + p.phase) * 2.4;
      }

      p.vx += (targetX - p.x) * SPRING;
      p.vy += (targetY - p.y) * SPRING;

      if (mouse.active) {
        const mdx = p.x - mouse.x, mdy = p.y - mouse.y;
        const d2 = mdx * mdx + mdy * mdy;
        if (d2 < MOUSE_RADIUS * MOUSE_RADIUS) {
          const d = Math.sqrt(d2) || 0.001;
          const f = (MOUSE_RADIUS - d) / MOUSE_RADIUS;
          p.vx += (mdx / d) * f * MOUSE_FORCE;
          p.vy += (mdy / d) * f * MOUSE_FORCE;
        }
      }

      p.vx *= FRICTION;
      p.vy *= FRICTION;
      p.x += p.vx;
      p.y += p.vy;

      const mix = (Math.sin(time * 0.00028 + p.phase) + 1) / 2;
      const col = lerpColor(BLUE, CORAL, mix);
      ctx.fillStyle = `rgb(${col[0]},${col[1]},${col[2]})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * sizeMod, 0, Math.PI * 2);
      ctx.fill();
    }

    rafId = requestAnimationFrame(step);
  }

  /* ---------------- input handling ---------------- */

  function toLocal(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    return { x: clientX - rect.left, y: clientY - rect.top };
  }

  canvas.addEventListener('mousemove', (e) => {
    const p = toLocal(e.clientX, e.clientY);
    mouse.x = p.x; mouse.y = p.y; mouse.active = true;
  });
  canvas.addEventListener('mouseleave', () => { mouse.active = false; });
  canvas.addEventListener('touchmove', (e) => {
    if (!e.touches.length) return;
    const p = toLocal(e.touches[0].clientX, e.touches[0].clientY);
    mouse.x = p.x; mouse.y = p.y; mouse.active = true;
  }, { passive: true });
  canvas.addEventListener('touchend', () => { mouse.active = false; });

  canvas.addEventListener('click', nextFormation);

  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      resizeCanvas();
      setFormation(formationIndex, true);
    }, 150);
  });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      cancelAnimationFrame(rafId);
      rafId = null;
    } else if (!rafId) {
      rafId = requestAnimationFrame(step);
    }
  });

  function startAutoCycle() {
    if (reduceMotion) return;
    autoTimer = setInterval(nextFormation, 7000);
  }
  function resetAutoCycle() {
    clearInterval(autoTimer);
    startAutoCycle();
  }

  /* ---------------- boot ---------------- */

  function boot() {
    resizeCanvas();
    initParticles();
    startAutoCycle();
    if (!reduceMotion) {
      rafId = requestAnimationFrame(step);
    }
  }

  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(boot).catch(boot);
  } else {
    boot();
  }
})();
