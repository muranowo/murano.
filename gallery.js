/* =========================================================================
   Design gallery — scattered tiles, click-through modal viewer.
   ========================================================================= */
(function () {
  const DESIGNS = [
    { title: 'Kiln Ceramics Branding', tag: 'Brand identity', hue: 'coral', size: 'wide', mark: 'K',
      desc: 'Full brand system for a small-batch ceramics studio — mark, packaging, and a signage set that had to survive a kiln room.' },
    { title: 'Loop Transit Dashboard', tag: 'UI \u00B7 Data viz', hue: 'blue', size: 'tall', mark: 'L',
      desc: 'Real-time bus tracking dashboard built for dispatchers, prioritizing scan-ability over density.' },
    { title: 'Paper Trail Cover Series', tag: 'Editorial', hue: 'mustard', size: '', mark: 'P',
      desc: 'A running cover system for an independent print magazine — one grid, twelve very different moods.' },
    { title: 'Aperture Icon Set', tag: 'Icon design', hue: 'mint', size: '', mark: 'A',
      desc: 'A 48-icon set for a photography tool, drawn on a strict 2px grid so nothing ever looks slightly off.' },
    { title: 'Groundwork Onboarding', tag: 'UX \u00B7 Flow', hue: 'ink', size: '', mark: 'G',
      desc: 'Turned an 11-step signup into 4 screens for a construction-scheduling B2B product.' },
    { title: 'Fieldnote Poster', tag: 'Poster', hue: 'blue', size: 'big', mark: 'F',
      desc: 'Launch poster for a research note-taking app — typographic, a little loud, entirely on purpose.' },
    { title: 'Midnight Radio', tag: 'Poster', hue: 'paper', size: '', mark: 'M',
      desc: 'Gig poster for a late-night radio show, screen-printed in two colors.' },
    { title: 'Sunday Market Flyer', tag: 'Print', hue: 'mustard', size: 'wide', mark: 'S',
      desc: 'Weekly flyer template for a farmers market — designed so a volunteer could update it in five minutes.' },
    { title: 'Glasshouse Type Specimen', tag: 'Type design', hue: 'coral', size: '', mark: 'G',
      desc: 'A specimen sheet for an in-progress display typeface, shown across three weights.' },
    { title: 'Northbound Zine', tag: 'Editorial', hue: 'ink', size: 'tall', mark: 'N',
      desc: 'Self-published travel zine, risograph-printed in two spot colors on newsprint.' },
    { title: 'Ohm Coffee Packaging', tag: 'Packaging', hue: 'mint', size: '', mark: 'O',
      desc: 'Bag design for a small coffee roaster, color-coded by roast level instead of origin.' },
    { title: 'Static Festival Identity', tag: 'Brand identity', hue: 'blue', size: '', mark: 'S',
      desc: 'Identity system for a two-day music festival, built to survive being photocopied onto flyers.' }
  ];

  const grid = document.getElementById('galleryGrid');
  const overlay = document.getElementById('modalOverlay');
  const panel = document.getElementById('modalPanel');
  const closeBtn = document.getElementById('modalClose');
  const prevBtn = document.getElementById('modalPrev');
  const nextBtn = document.getElementById('modalNext');
  const mark = document.getElementById('modalMark');
  const indexEl = document.getElementById('modalIndex');
  const titleEl = document.getElementById('modalTitle');
  const tagEl = document.getElementById('modalTag');
  const descEl = document.getElementById('modalDesc');

  let currentIndex = 0;

  function buildTiles() {
    const frag = document.createDocumentFragment();
    DESIGNS.forEach((d, i) => {
      const btn = document.createElement('button');
      btn.className = 'tile' + (d.size ? ' size-' + d.size : '');
      btn.type = 'button';
      btn.dataset.hue = d.hue;
      btn.dataset.index = i;
      btn.innerHTML = `
        <span class="tile-num">${String(i + 1).padStart(2, '0')}</span>
        <span class="tile-title">${d.title}</span>
        <span class="tile-tag">${d.tag}</span>
      `;
      btn.addEventListener('click', () => openModal(i));
      frag.appendChild(btn);
    });
    grid.appendChild(frag);
  }

  function renderModal() {
    const d = DESIGNS[currentIndex];
    mark.textContent = d.mark;
    document.getElementById('modalVisual').dataset.hue = d.hue;
    indexEl.textContent = `${String(currentIndex + 1).padStart(2, '0')} / ${String(DESIGNS.length).padStart(2, '0')}`;
    titleEl.textContent = d.title;
    tagEl.textContent = d.tag;
    descEl.textContent = d.desc;
  }

  function openModal(i) {
    currentIndex = i;
    renderModal();
    overlay.classList.add('is-open');
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    overlay.classList.remove('is-open');
    document.body.style.overflow = '';
  }

  function step(delta) {
    currentIndex = (currentIndex + delta + DESIGNS.length) % DESIGNS.length;
    renderModal();
  }

  closeBtn.addEventListener('click', closeModal);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) closeModal(); });
  prevBtn.addEventListener('click', () => step(-1));
  nextBtn.addEventListener('click', () => step(1));

  document.addEventListener('keydown', (e) => {
    if (!overlay.classList.contains('is-open')) return;
    if (e.key === 'Escape') closeModal();
    if (e.key === 'ArrowLeft') step(-1);
    if (e.key === 'ArrowRight') step(1);
  });

  buildTiles();
})();
