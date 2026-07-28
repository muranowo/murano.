/* =========================================================================
   Collage mosaic — fills five rows (9, 8, 8, 8, 9) from images/collage-NN.png,
   then a click-to-enlarge viewer that morphs the tile itself into the
   full-screen view (a FLIP transition: animate top/left/width/height
   from the tile's real on-page position out to a centered frame, and
   back again on close) instead of a plain fade-in modal.

   Swap the files in /images to replace these with real work; the row
   counts and numbering below don't need to change.
   ========================================================================= */
(function () {
  const ROW_COUNTS = [11, 9, 11, 9, 11, 9, 11, 9, 11, 9];
  const TOTAL = ROW_COUNTS.reduce((a, b) => a + b, 0); // 100
  const PAD = 3;
  const EASE_OPEN = 'cubic-bezier(.16, 1.4, .3, 1)';   // springy overshoot
  const EASE_CLOSE = 'cubic-bezier(.4, 0, .2, 1)';

  const overlay = document.getElementById('collageOverlay');
  const modalImg = document.getElementById('collageModalImg');
  const closeBtn = document.getElementById('collageClose');
  const prevBtn = document.getElementById('collagePrev');
  const nextBtn = document.getElementById('collageNext');
  const countEl = document.getElementById('collageCount');

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const tiles = []; // { el, imgEl, src, num }
  let currentIndex = -1;
  let isOpen = false;

  /* ---------------- build the rows ---------------- */

  function buildRows() {
    let n = 1;
    ROW_COUNTS.forEach((count, rowIdx) => {
      const row = document.querySelector(`.collage-row[data-row="${rowIdx + 1}"]`);
      if (!row) return;
      const frag = document.createDocumentFragment();
      for (let i = 0; i < count; i++) {
        const num = String(n).padStart(PAD, '0');
        const src = `images/collage-${num}.png`;
        const tile = document.createElement('div');
        tile.className = 'collage-tile';
        tile.innerHTML = `
          <img src="${src}" alt="Collage ${num}" loading="lazy">
          <span class="collage-tile-num">${num} / ${TOTAL}</span>
        `;
        const index = tiles.length;
        tile.addEventListener('click', () => openAt(index));
        frag.appendChild(tile);
        tiles.push({ el: tile, imgEl: tile.querySelector('img'), src, num });
        n++;
      }
      row.appendChild(frag);
    });
  }

  /* ---------------- geometry ---------------- */

  function finalRect() {
    const maxW = Math.min(window.innerWidth * 0.86, 760);
    const maxH = Math.min(window.innerHeight * 0.84, 900);
    let fw = maxW, fh = fw * 1.25; // 4:5
    if (fh > maxH) { fh = maxH; fw = fh * 0.8; }
    return {
      width: fw,
      height: fh,
      left: (window.innerWidth - fw) / 2,
      top: (window.innerHeight - fh) / 2
    };
  }

  function applyRect(el, r, rotate) {
    el.style.top = r.top + 'px';
    el.style.left = r.left + 'px';
    el.style.width = r.width + 'px';
    el.style.height = r.height + 'px';
    if (rotate !== undefined) el.style.transform = `rotate(${rotate}deg)`;
  }

  /* ---------------- open / close / navigate ---------------- */

  function openAt(index) {
    currentIndex = index;
    isOpen = true;
    const tile = tiles[index];
    const startRect = tile.el.getBoundingClientRect();

    document.body.style.overflow = 'hidden';
    overlay.classList.add('is-open');

    modalImg.src = tile.src;
    modalImg.alt = `Collage ${tile.num}`;
    modalImg.classList.add('is-visible');

    if (reduceMotion) {
      modalImg.style.transition = 'none';
      applyRect(modalImg, finalRect(), 0);
      modalImg.style.opacity = '1';
      updateCount();
      return;
    }

    // Start exactly where the clicked tile is, no transition.
    modalImg.style.transition = 'none';
    applyRect(modalImg, {
      top: startRect.top, left: startRect.left,
      width: startRect.width, height: startRect.height
    }, -4);
    modalImg.style.opacity = '1';

    // Force layout, then animate to the centered frame.
    void modalImg.offsetWidth;
    modalImg.style.transition =
      `top .55s ${EASE_OPEN}, left .55s ${EASE_OPEN}, width .55s ${EASE_OPEN}, height .55s ${EASE_OPEN}, transform .55s ${EASE_OPEN}`;
    requestAnimationFrame(() => {
      applyRect(modalImg, finalRect(), 0);
    });

    updateCount();
  }

  function closeModal() {
    if (!isOpen) return;
    isOpen = false;
    overlay.classList.remove('is-open');
    document.body.style.overflow = '';

    const tile = tiles[currentIndex];
    const rect = tile ? tile.el.getBoundingClientRect() : null;

    if (reduceMotion || !rect) {
      modalImg.style.opacity = '0';
      modalImg.classList.remove('is-visible');
      return;
    }

    modalImg.style.transition =
      `top .45s ${EASE_CLOSE}, left .45s ${EASE_CLOSE}, width .45s ${EASE_CLOSE}, height .45s ${EASE_CLOSE}, transform .45s ${EASE_CLOSE}, opacity .45s ${EASE_CLOSE}`;
    applyRect(modalImg, rect, 4);
    modalImg.style.opacity = '0';
    setTimeout(() => { modalImg.classList.remove('is-visible'); }, 460);
  }

  function step(delta) {
    if (!isOpen) return;
    currentIndex = (currentIndex + delta + tiles.length) % tiles.length;
    const tile = tiles[currentIndex];

    // Quick crossfade + pulse rather than a full FLIP (there's no single
    // "origin" tile when hopping via arrow keys), but keep the frame in place.
    const r = finalRect();
    modalImg.style.transition = 'opacity .18s ease, transform .18s ease';
    modalImg.style.opacity = '0';
    modalImg.style.transform = 'scale(0.97)';
    setTimeout(() => {
      modalImg.src = tile.src;
      modalImg.alt = `Collage ${tile.num}`;
      applyRect(modalImg, r, 0);
      modalImg.style.opacity = '1';
      modalImg.style.transform = 'scale(1)';
    }, 180);

    updateCount();
  }

  function updateCount() {
    const tile = tiles[currentIndex];
    countEl.textContent = `${tile.num} / ${TOTAL}`;
  }

  /* ---------------- events ---------------- */

  closeBtn.addEventListener('click', closeModal);
  overlay.addEventListener('click', closeModal);
  prevBtn.addEventListener('click', (e) => { e.stopPropagation(); step(-1); });
  nextBtn.addEventListener('click', (e) => { e.stopPropagation(); step(1); });
  modalImg.addEventListener('click', (e) => e.stopPropagation());

  document.addEventListener('keydown', (e) => {
    if (!isOpen) return;
    if (e.key === 'Escape') closeModal();
    if (e.key === 'ArrowLeft') step(-1);
    if (e.key === 'ArrowRight') step(1);
  });

  window.addEventListener('resize', () => {
    if (!isOpen) return;
    modalImg.style.transition = 'none';
    applyRect(modalImg, finalRect(), 0);
  });

  buildRows();
})();
