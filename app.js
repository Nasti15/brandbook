// ============================================================
// app.js — брендбук «Обратный отсчёт»
// ============================================================

const STORAGE_KEY = 'brandbook-draft';
const TIMER_KEY = 'brandbook-timer-target';

const palettes = [
  { id: 'paper', name: 'Бумага', bg: '#FFFFFF', text: '#0B0B0F', accent: '#D9C7A7' },
  { id: 'ocean', name: 'Океан', bg: '#062A2E', text: '#E6FFFB', accent: '#FF7A59' },
  { id: 'ink', name: 'Чернила', bg: '#0B0B0F', text: '#FFFFFF', accent: '#C81D4A' },
  { id: 'cobalt', name: 'Кобальт', bg: '#F4F7FF', text: '#0B1B4B', accent: '#2E4A9E' },
  { id: 'mint', name: 'Мята', bg: '#EFFFF9', text: '#5C3A21', accent: '#3E7C4F' },
  { id: 'neon', name: 'Неон', bg: '#120021', text: '#E9D5FF', accent: '#B14BFF' },
];

const fonts = [
  { id: 'unbounded', name: 'Unbounded', family: "'Unbounded', system-ui, sans-serif", googleUrl: 'https://fonts.googleapis.com/css2?family=Unbounded:wght@400;700;800&display=swap' },
  { id: 'inter', name: 'Inter', family: "'Inter', system-ui, sans-serif", googleUrl: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;700;800&display=swap' },
  { id: 'manrope', name: 'Manrope', family: "'Manrope', system-ui, sans-serif", googleUrl: 'https://fonts.googleapis.com/css2?family=Manrope:wght@400;700;800&display=swap' },
  { id: 'russo', name: 'Russo One', family: "'Russo One', system-ui, sans-serif", googleUrl: 'https://fonts.googleapis.com/css2?family=Russo+One&display=swap' },
  { id: 'caveat', name: 'Caveat', family: "'Caveat', cursive", googleUrl: 'https://fonts.googleapis.com/css2?family=Caveat:wght@400;700&display=swap' },
  { id: 'pacifico', name: 'Pacifico', family: "'Pacifico', cursive", googleUrl: 'https://fonts.googleapis.com/css2?family=Pacifico&display=swap' },
];

const POSTER_LAYOUTS = ['poster-a', 'poster-b', 'poster-c'];
const CARD_LAYOUTS = ['card-a', 'card-b', 'card-c'];

const demoState = {
  name: 'Обратный отсчёт',
  slogan: 'Самое интересное — до',
  audience: '18–35, фандомы, любители премьер',
  goal: 'Продавать не событие, а ожидание события',
  character: 'Дерзкий · точный · азартный',
  paletteId: 'paper',
  fontId: 'unbounded',
  fontSize: 18,
  fontWeight: 700,
  posterLayoutId: 'poster-a',
  cardLayoutId: 'card-a',
  previewText: 'До премьеры осталось',
};

const getPalette = (id) => palettes.find((p) => p.id === id) || palettes[0];
const getFont = (id) => fonts.find((f) => f.id === id) || fonts[0];

// ============================================================
// 2. ХРАНИЛИЩЕ
// ============================================================

let storageAvailable = true;

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...demoState };
    const parsed = JSON.parse(raw);
    if (parsed.layoutId && !parsed.posterLayoutId && !parsed.cardLayoutId) {
      const [kind, variant] = String(parsed.layoutId).split('-');
      if (kind === 'poster') parsed.posterLayoutId = `poster-${variant}`;
      if (kind === 'card') parsed.cardLayoutId = `card-${variant}`;
      delete parsed.layoutId;
    }
    return { ...demoState, ...parsed };
  } catch {
    storageAvailable = false;
    return { ...demoState };
  }
}

function saveState(s) {
  if (!storageAvailable) return false;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
    return true;
  } catch {
    storageAvailable = false;
    return false;
  }
}

function resetState() {
  try {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(TIMER_KEY);
  } catch {
    storageAvailable = false;
  }
  return { ...demoState };
}

// ============================================================
// 3. ОБЩЕЕ
// ============================================================

const state = loadState();

[
  ...fonts.map((f) => f.googleUrl),
  'https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&display=swap',
].forEach((href) => {
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = href;
  document.head.appendChild(link);
});

function applyTheme(s) {
  const p = getPalette(s.paletteId);
  const f = getFont(s.fontId);
  const root = document.documentElement.style;
  root.setProperty('--bg', p.bg);
  root.setProperty('--text', p.text);
  root.setProperty('--accent', p.accent);
  root.setProperty('--font-heading', f.family);
  root.setProperty('--font-body', f.family);
}

function persist(s) {
  const ok = saveState(s);
  const note = document.getElementById('storage-note');
  if (note) note.hidden = ok && storageAvailable;
}

function notifyChange() {
  document.dispatchEvent(new CustomEvent('state:change', { detail: state }));
}

const escapeHtml = (str) =>
  String(str).replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])
  );

// ============================================================
// 4. БРИФ
// ============================================================

function renderBrief(s) {
  const logo = document.getElementById('header-logo');
  if (logo) logo.textContent = s.name || 'Бренд';

  document.getElementById('fact-audience').textContent = s.audience;
  document.getElementById('fact-goal').textContent = s.goal;
  document.getElementById('fact-character').textContent = s.character;

  const nameInput = document.getElementById('name-input');
  const sloganInput = document.getElementById('slogan-input');
  if (document.activeElement !== nameInput) nameInput.value = s.name;
  if (document.activeElement !== sloganInput) sloganInput.value = s.slogan;
}

function validateField(input, errorEl, value) {
  const empty = !value.trim();
  errorEl.hidden = !empty;
  input.setAttribute('aria-invalid', String(empty));
  return !empty;
}

function bindBrief() {
  const nameInput = document.getElementById('name-input');
  const sloganInput = document.getElementById('slogan-input');
  const nameError = document.getElementById('name-error');
  const sloganError = document.getElementById('slogan-error');

  nameInput.addEventListener('input', () => {
    if (validateField(nameInput, nameError, nameInput.value)) {
      state.name = nameInput.value;
      persist(state);
      renderBrief(state);
      notifyChange();
    }
  });

  sloganInput.addEventListener('input', () => {
    if (validateField(sloganInput, sloganError, sloganInput.value)) {
      state.slogan = sloganInput.value;
      persist(state);
      renderBrief(state);
      notifyChange();
    }
  });
}

// ============================================================
// 5. ЦВЕТ
// ============================================================

function renderPalettes(s) {
  const list = document.getElementById('palette-list');
  list.innerHTML = '';

  palettes.forEach((p) => {
    const card = document.createElement('button');
    card.type = 'button';
    card.className = 'palette-card';
    card.setAttribute('role', 'radio');
    card.setAttribute('aria-checked', String(p.id === s.paletteId));
    card.style.background = p.bg;
    card.style.color = p.text;
    card.innerHTML = `
      <strong>${p.name}</strong>
      <span class="dots" aria-hidden="true">
        <span class="dot" style="background:${p.bg}"></span>
        <span class="dot" style="background:${p.text}"></span>
        <span class="dot" style="background:${p.accent}"></span>
      </span>
      <small>фон · текст · акцент</small>
    `;
    card.addEventListener('click', () => {
      state.paletteId = p.id;
      applyTheme(state);
      persist(state);
      renderPalettes(state);
      renderColorSample(state);
      notifyChange();
    });
    list.appendChild(card);
  });
}

function renderColorSample(s) {
  const p = getPalette(s.paletteId);
  const sample = document.getElementById('color-sample');
  sample.style.background = p.bg;
  sample.style.color = p.text;
  const btn = sample.querySelector('.sample-btn');
  if (btn) btn.style.background = p.accent;
}

// ============================================================
// 6. ТИПОГРАФИКА
// ============================================================

function renderTypography(s) {
  const select = document.getElementById('font-select');
  select.innerHTML = fonts
    .map(
      (f) =>
        `<option value="${f.id}" ${f.id === s.fontId ? 'selected' : ''}>${f.name}</option>`
    )
    .join('');

  const text = document.getElementById('preview-text');
  if (document.activeElement !== text) text.value = s.previewText;

  document.getElementById('font-size').value = s.fontSize;
  document.getElementById('font-weight').value = s.fontWeight;
  document.getElementById('font-size-out').textContent = s.fontSize;
  document.getElementById('font-weight-out').textContent = s.fontWeight;

  renderTypeSample(s);
}

function renderTypeSample(s) {
  const f = getFont(s.fontId);
  const el = document.getElementById('type-sample');
  el.textContent = s.previewText || 'Введите текст';
  el.style.fontFamily = f.family;
  el.style.fontSize = `${s.fontSize}px`;
  el.style.fontWeight = String(s.fontWeight);
}

function bindTypography() {
  document.getElementById('preview-text').addEventListener('input', (e) => {
    state.previewText = e.target.value;
    renderTypeSample(state);
    persist(state);
    notifyChange();
  });

  document.getElementById('font-select').addEventListener('change', (e) => {
    state.fontId = e.target.value;
    applyTheme(state);
    renderTypeSample(state);
    persist(state);
    notifyChange();
  });

  document.getElementById('font-size').addEventListener('input', (e) => {
    state.fontSize = Number(e.target.value);
    document.getElementById('font-size-out').textContent = state.fontSize;
    renderTypeSample(state);
    persist(state);
    notifyChange();
  });

  document.getElementById('font-weight').addEventListener('input', (e) => {
    state.fontWeight = Number(e.target.value);
    document.getElementById('font-weight-out').textContent = state.fontWeight;
    renderTypeSample(state);
    persist(state);
    notifyChange();
  });
}

// ============================================================
// 7. МАКЕТЫ + ТАЙМЕР + ПЕЧАТЬ
// ============================================================

let timerTarget = loadTarget();

function loadTarget() {
  try {
    const raw = localStorage.getItem(TIMER_KEY);
    const t = raw ? Number(raw) : NaN;
    if (Number.isFinite(t) && t > Date.now()) return t;
  } catch {
    /* ignore */
  }
  return Date.now() + (3 * 24 + 12) * 3600 * 1000;
}

function saveTarget(ts) {
  try {
    localStorage.setItem(TIMER_KEY, String(ts));
  } catch {}
}

function formatForInput(ts) {
  const d = new Date(ts);
  const pad = (n) => String(n).padStart(2, '0');
  return (
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` +
    `T${pad(d.getHours())}:${pad(d.getMinutes())}`
  );
}

function formatTargetForDisplay(ts) {
  const d = new Date(ts);
  const pad = (n) => String(n).padStart(2, '0');
  return (
    `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()} ` +
    `${pad(d.getHours())}:${pad(d.getMinutes())}`
  );
}

function formatTargetDateOnly(ts) {
  const d = new Date(ts);
  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()}`;
}

function formatTargetTimeOnly(ts) {
  const d = new Date(ts);
  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function formatRemaining(ms) {
  if (ms <= 0) return { d: '00', h: '00', m: '00', s: '00' };
  const totalSec = Math.floor(ms / 1000);
  const d = Math.floor(totalSec / 86400);
  const h = Math.floor((totalSec % 86400) / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const sec = totalSec % 60;
  const pad = (n) => String(n).padStart(2, '0');
  return { d: pad(d), h: pad(h), m: pad(m), s: pad(sec) };
}

function remainingHtml(ms) {
  const r = formatRemaining(ms);
  return `${r.d}:${r.h}:<span class="sec">${r.m}:${r.s}</span>`;
}

let timerInterval = null;

function startTimer() {
  if (timerInterval) clearInterval(timerInterval);
  const update = () => {
    document.querySelectorAll('.timer[data-live]').forEach((el) => {
      el.innerHTML = remainingHtml(timerTarget - Date.now());
    });
  };
  update();
  timerInterval = setInterval(update, 1000);
}

function layoutClass(id) {
  const [kind, variant] = String(id).split('-');
  return `layout-${kind}-${variant}`;
}

function posterClass(s) {
  const id = POSTER_LAYOUTS.includes(s.posterLayoutId) ? s.posterLayoutId : POSTER_LAYOUTS[0];
  return 'poster ' + layoutClass(id);
}

function cardClass(s) {
  const id = CARD_LAYOUTS.includes(s.cardLayoutId) ? s.cardLayoutId : CARD_LAYOUTS[0];
  return 'social-card ' + layoutClass(id);
}

/** Общие блоки разметки для обоих макетов */
function eventChip(s) {
  return `
    <span class="event-chip" aria-label="Дата и время события">
      <span class="event-chip__date">${formatTargetDateOnly(timerTarget)}</span>
      <span class="event-chip__dot" aria-hidden="true"></span>
      <span class="event-chip__time">${formatTargetTimeOnly(timerTarget)}</span>
    </span>
  `;
}

function posterMarkup(s, { compact = false } = {}) {
  const p = getPalette(s.paletteId);

  // «Орбита» — собственная композиция
  if (s.posterLayoutId === 'poster-c') {
    return `
      <div class="orbit-deco" aria-hidden="true">
        <span class="orbit-dot orbit-dot--1"></span>
        <span class="orbit-dot orbit-dot--2"></span>
        <span class="orbit-dot orbit-dot--3"></span>
      </div>
      <div class="layout-inner orbit-inner">
        <span class="timer-label orbit-label-top">До события</span>
        <div class="orbit-ring">
          <div class="orbit-core">
            <div class="timer timer--orbit${compact ? ' timer--compact' : ''}" data-live>${remainingHtml(
      timerTarget - Date.now()
    )}</div>
          </div>
        </div>
        <div class="orbit-meta">
          ${eventChip(s)}
        </div>
        <div class="orbit-foot">
          <h3 style="font-size:${Math.round(
            s.fontSize * 0.9
          )}px;font-weight:${s.fontWeight}">${escapeHtml(s.name || 'Бренд')}</h3>
          <p>${escapeHtml(s.slogan || '')}</p>
        </div>
      </div>
      <span class="accent-line orbit-accent" style="background:${p.accent}"></span>
    `;
  }

  // «Классика» и «Акцентный блок»
  return `
    <div class="poster-deco" aria-hidden="true"></div>
    <div class="layout-inner">
      <div class="poster-top">
        <span class="timer-label">До события</span>
        ${eventChip(s)}
      </div>
      <div class="timer${compact ? ' timer--compact' : ''}" data-live>${remainingHtml(
    timerTarget - Date.now()
  )}</div>
      <div class="poster-bottom">
        <h3 style="font-size:${s.fontSize}px;font-weight:${s.fontWeight}">${escapeHtml(
    s.name || 'Бренд'
  )}</h3>
        <p>${escapeHtml(s.slogan || '')}</p>
      </div>
    </div>
    <span class="accent-line" style="background:${p.accent}"></span>
  `;
}

function cardMarkup(s, { compact = false } = {}) {
  const p = getPalette(s.paletteId);

  // «Каскад · таймер на подложке»
  if (s.cardLayoutId === 'card-b') {
    return `
      <div class="cascade-top">
        <span class="timer-label">До события</span>
        ${eventChip(s)}
      </div>
      <div class="cascade-stage">
        <div class="cascade-backdrop" aria-hidden="true"></div>
        <div class="timer${compact ? ' timer--compact' : ''}" data-live>${remainingHtml(
      timerTarget - Date.now()
    )}</div>
      </div>
      <div class="cascade-foot">
        <h3 style="font-size:${Math.round(
          s.fontSize * 0.7
        )}px;font-weight:${s.fontWeight}">${escapeHtml(s.name || 'Бренд')}</h3>
        <p>${escapeHtml(s.slogan || '')}</p>
      </div>
      <span class="cascade-accent" style="background:${p.accent}"></span>
    `;
  }

  if (s.cardLayoutId === 'card-c') {
    return `
      <div class="stamp-grid" aria-hidden="true"></div>
      <div class="stamp-diagonal" style="background:${p.accent}" aria-hidden="true"></div>
      <div class="stamp-inner">
        <div class="stamp-head">
          <span class="timer-label">До события</span>
          ${eventChip(s)}
        </div>
        <div class="stamp-stage">
           <div class="timer${compact ? ' timer--compact' : ''}" data-live>${remainingHtml(
      timerTarget - Date.now()
    )}</div> 
          <div class="stamp-units" aria-hidden="true">
            <span>дн</span><span>час</span><span>мин</span><span>сек</span>
          </div>
        </div>
        <div class="stamp-foot">
          <h3 style="font-size:${Math.min(Math.round(s.fontSize * 0.7), 40)}px;font-weight:${s.fontWeight}">${escapeHtml(
      s.name || 'Бренд'
    )}</h3>
          <p>${escapeHtml(s.slogan || '')}</p>
        </div>
      </div>
      <span class="stamp-corner" style="border-color:${p.accent}" aria-hidden="true"></span>
    `;
  }

  return `
    <div class="card-deco" aria-hidden="true"></div>
    <div class="layout-inner">
      <div class="card-head">
        <span class="timer-label">До события</span>
        ${eventChip(s)}
      </div>
      <div class="timer${compact ? ' timer--compact' : ''}" data-live>${remainingHtml(
    timerTarget - Date.now()
  )}</div>
      <div class="card-foot">
        <h3 style="font-size:${Math.round(
          s.fontSize * 0.6
        )}px;font-weight:${s.fontWeight}">${escapeHtml(s.name || 'Бренд')}</h3>
        <p>${escapeHtml(s.slogan || '')}</p>
      </div>
    </div>
    <span class="accent-line" style="background:${p.accent}"></span>
  `;
}

function applyVars(el, s) {
  const p = getPalette(s.paletteId);
  const f = getFont(s.fontId);
  el.style.background = p.bg;
  el.style.color = p.text;
  el.style.fontFamily = f.family;
}

function renderPoster(s) {
  const el = document.getElementById('poster');
  el.className = posterClass(s);
  applyVars(el, s);
  el.innerHTML = posterMarkup(s);
  startTimer();
}

function renderCard(s) {
  const el = document.getElementById('social-card');
  el.className = cardClass(s);
  applyVars(el, s);
  el.innerHTML = cardMarkup(s);
  startTimer();
}

function renderBrandbook(s) {
  document.getElementById('bb-name').textContent = s.name;
  document.getElementById('bb-slogan').textContent = s.slogan;
  document.getElementById('bb-audience').textContent = s.audience;
  document.getElementById('bb-goal').textContent = s.goal;
  document.getElementById('bb-character').textContent = s.character;
  const bbTarget = document.getElementById('bb-target');
  if (bbTarget) bbTarget.textContent = formatTargetForDisplay(timerTarget);

  const p = getPalette(s.paletteId);
  document.getElementById('bb-swatches').innerHTML = [
    ['Фон', p.bg],
    ['Текст', p.text],
    ['Акцент', p.accent],
  ]
    .map(
      ([label, color]) => `
    <div class="swatch">
      <div class="color" style="background:${color}"></div>
      <small>${label}: ${color}</small>
    </div>`
    )
    .join('');

  const f = getFont(s.fontId);
  document.getElementById('bb-font').textContent =
    `${f.name} · размер ${s.fontSize} px · насыщенность ${s.fontWeight}`;

  const bbLayouts = document.getElementById('bb-layouts');
  bbLayouts.innerHTML = '';

  const posterPreview = document.createElement('div');
  posterPreview.className = posterClass(s);
  applyVars(posterPreview, s);
  posterPreview.innerHTML = posterMarkup(s, { compact: true });
  bbLayouts.appendChild(posterPreview);

  const cardPreview = document.createElement('div');
  cardPreview.className = cardClass(s);
  applyVars(cardPreview, s);
  cardPreview.innerHTML = cardMarkup(s, { compact: true });
  bbLayouts.appendChild(cardPreview);

  startTimer();
}

function syncLayoutRadios(s) {
  const posterRadio = document.querySelector(
    `input[name="poster-layout"][value="${s.posterLayoutId}"]`
  );
  if (posterRadio) posterRadio.checked = true;

  const cardRadio = document.querySelector(
    `input[name="card-layout"][value="${s.cardLayoutId}"]`
  );
  if (cardRadio) cardRadio.checked = true;
}

function renderAllLayouts(s) {
  renderPoster(s);
  renderCard(s);
  renderBrandbook(s);
  syncLayoutRadios(s);
}

function bindTimerSetup() {
  const input = document.getElementById('target-input');
  const err = document.getElementById('target-error');
  const saveBtn = document.getElementById('target-save');
  if (!input || !saveBtn) return;

  input.value = formatForInput(timerTarget);

  const commit = () => {
    const ts = new Date(input.value).getTime();
    if (!Number.isFinite(ts) || ts <= Date.now()) {
      err.hidden = false;
      input.setAttribute('aria-invalid', 'true');
      return;
    }
    err.hidden = true;
    input.setAttribute('aria-invalid', 'false');
    timerTarget = ts;
    saveTarget(ts);
    renderAllLayouts(state);
  };

  input.addEventListener('change', commit);
  saveBtn.addEventListener('click', commit);
}

function bindLayouts() {
  document.querySelectorAll('input[name="poster-layout"]').forEach((radio) => {
    radio.addEventListener('change', (e) => {
      state.posterLayoutId = e.target.value;
      renderPoster(state);
      renderBrandbook(state);
      persist(state);
      notifyChange();
    });
  });

  document.querySelectorAll('input[name="card-layout"]').forEach((radio) => {
    radio.addEventListener('change', (e) => {
      state.cardLayoutId = e.target.value;
      renderCard(state);
      renderBrandbook(state);
      persist(state);
      notifyChange();
    });
  });

  document.getElementById('print-btn').addEventListener('click', () => window.print());
}

// ============================================================
// 8. СТАРТ
// ============================================================

function renderAll(s) {
  applyTheme(s);
  renderBrief(s);
  renderPalettes(s);
  renderColorSample(s);
  renderTypography(s);
  renderAllLayouts(s);
}

function bindReset() {
  document.getElementById('reset-btn').addEventListener('click', () => {
    const fresh = resetState();
    Object.assign(state, fresh);

    document.getElementById('name-error').hidden = true;
    document.getElementById('slogan-error').hidden = true;
    document.getElementById('target-error').hidden = true;
    document.getElementById('name-input').setAttribute('aria-invalid', 'false');
    document.getElementById('slogan-input').setAttribute('aria-invalid', 'false');
    document.getElementById('target-input').setAttribute('aria-invalid', 'false');

    timerTarget = Date.now() + (3 * 24 + 12) * 3600 * 1000;
    document.getElementById('target-input').value = formatForInput(timerTarget);

    renderAll(state);
    notifyChange();
  });
}

document.addEventListener('state:change', () => {
  renderAllLayouts(state);
});

function init() {
  renderAll(state);
  bindBrief();
  bindTypography();
  bindTimerSetup();
  bindLayouts();
  bindReset();

  const note = document.getElementById('storage-note');
  if (note) note.hidden = storageAvailable;
}

init();