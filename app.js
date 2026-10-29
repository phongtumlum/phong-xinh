/* Phòng Xinh — đọc data/site.json + data/listings.json do bot xuất ra */
(function () {
  'use strict';

  const $ = (s) => document.querySelector(s);
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const cap = (s) => { s = String(s || ''); return s.charAt(0).toUpperCase() + s.slice(1); };
  const million = (v) => (v / 1e6).toLocaleString('vi-VN', { maximumFractionDigits: 1 });

  const DEFAULT_TRENDS = ['Phòng xinh giá yêu, chốt liền tay', 'Ở đây là chill, về là thấy nhà', 'Thả tim đi, chần chừ là mất phòng'];
  const WORDS = ['xinh xỉu', 'giá yêu', 'đáng iu', 'chốt lẹ'];
  const MOODS = [
    { key: 'happy', say: 'Chào bạn nha!' },
    { key: 'wink', say: 'Phòng bí mật nè~' },
    { key: 'love', say: 'Mê phòng này quá!' },
    { key: 'wow', say: 'Giá yêu luôn á!' },
    { key: 'sleepy', say: 'Ngủ trưa xíu...' },
    { key: 'cool', say: 'Chốt phòng liền!' }
  ];
  const KIND_ORDER = ['Phòng trọ', 'Căn hộ dịch vụ', 'Chung cư'];
  const LAYOUT_ORDER = ['Studio', 'Gác (duplex)', '1PN', '2PN', '3PN'];
  const NEW_SECONDS = 2 * 24 * 3600;

  const HEART = 'M12 21s-8-5.3-8-11a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 20 10c0 5.7-8 11-8 11z';
  const STAR = 'M12 2l2.9 6.6 7.1.7-5.4 4.8 1.6 7L12 17.3 5.8 21.1l1.6-7L2 9.3l7.1-.7z';
  const SPARK = 'M12 0C13 8 16 11 24 12C16 13 13 16 12 24C11 16 8 13 0 12C8 11 11 8 12 0Z';
  const STICKERS = [
    '<svg width="58" height="58" viewBox="0 0 48 48"><path d="M8 20 L11 6 L22 14Z M40 20 L37 6 L26 14Z" fill="#fff" stroke="#141013" stroke-width="3" stroke-linejoin="round"/><ellipse cx="24" cy="28" rx="17" ry="14" fill="#fff" stroke="#141013" stroke-width="3"/><circle cx="18" cy="27" r="2" fill="#141013"/><circle cx="30" cy="27" r="2" fill="#141013"/><ellipse cx="13" cy="32" rx="3" ry="2" fill="#FF8FB8"/><ellipse cx="35" cy="32" rx="3" ry="2" fill="#FF8FB8"/><path d="M21 32 Q24 35 27 32" fill="none" stroke="#141013" stroke-width="2.4" stroke-linecap="round"/></svg>',
    '<svg width="54" height="54" viewBox="0 0 48 48"><ellipse cx="24" cy="31" rx="10" ry="8.5" fill="#FF8FB8" stroke="#141013" stroke-width="2.5"/><ellipse cx="11" cy="21" rx="4.5" ry="5.5" fill="#FF8FB8" stroke="#141013" stroke-width="2.5"/><ellipse cx="20" cy="13" rx="4.5" ry="5.5" fill="#FF8FB8" stroke="#141013" stroke-width="2.5"/><ellipse cx="29" cy="13" rx="4.5" ry="5.5" fill="#FF8FB8" stroke="#141013" stroke-width="2.5"/><ellipse cx="38" cy="21" rx="4.5" ry="5.5" fill="#FF8FB8" stroke="#141013" stroke-width="2.5"/></svg>',
    '<svg width="60" height="60" viewBox="0 0 48 48"><path d="M5 24 Q19 8 33 24 Q19 40 5 24Z" fill="#fff" stroke="#141013" stroke-width="3" stroke-linejoin="round"/><path d="M33 24 L44 13 V35Z" fill="#FF8FB8" stroke="#141013" stroke-width="3" stroke-linejoin="round"/><circle cx="14" cy="22" r="2.2" fill="#141013"/><path d="M20 17 Q23 24 20 31" fill="none" stroke="#141013" stroke-width="2" stroke-linecap="round"/></svg>',
    '<svg width="56" height="56" viewBox="0 0 48 48"><circle cx="24" cy="24" r="16" fill="#fff" stroke="#141013" stroke-width="3"/><path d="M10 20 Q24 28 38 16 M9 28 Q24 36 39 24 M17 10 Q27 24 20 38" fill="none" stroke="#FF5C9A" stroke-width="2.6" stroke-linecap="round"/><path d="M38 36 Q46 40 44 46" fill="none" stroke="#141013" stroke-width="3" stroke-linecap="round"/></svg>',
    '<svg width="54" height="54" viewBox="0 0 24 24"><path d="' + HEART + '" fill="#fff" stroke="#141013" stroke-width="1.6" stroke-linejoin="round"/></svg>'
  ];
  const ROOM_ICON = '<svg width="84" height="84" viewBox="0 0 64 64" fill="none" stroke="#141013" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="8" y="30" width="48" height="18" rx="4"/><path d="M8 48v6M56 48v6M14 30v-8h14v8M36 30v-8h14v8"/><rect x="40" y="8" width="16" height="14" rx="2"/></svg>';
  const PEEK = '<svg class="peek" aria-hidden="true" viewBox="0 0 56 30"><path d="M4 30 L10 4 L26 22Z" fill="#fff" stroke="#141013" stroke-width="3.5" stroke-linejoin="round"/><path d="M52 30 L46 4 L30 22Z" fill="#fff" stroke="#141013" stroke-width="3.5" stroke-linejoin="round"/><path d="M11 24 L12 12 L20 21Z M45 24 L44 12 L36 21Z" fill="#FF8FB8"/></svg>';

  // ---------- trạng thái ----------
  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* trình duyệt chặn lưu: bỏ qua */ } }
  };
  const S = {
    district: 'Tất cả', ward: 'Tất cả', kind: 'Tất cả', layout: 'Tất cả',
    maxPrice: null, amen: new Set(), onlySaved: false,
    saved: new Set(store.get('px_saved', []))
  };
  let LIST = [];
  let SITE = {};
  let PRICE_CAP = 15;

  // ---------- tải dữ liệu ----------
  async function getJSON(path, fallback) {
    try {
      const r = await fetch(path + '?v=' + Date.now(), { cache: 'no-store' });
      if (!r.ok) throw new Error(r.status);
      return await r.json();
    } catch (e) {
      return fallback;
    }
  }

  async function init() {
    const [site, list] = await Promise.all([getJSON('data/site.json', {}), getJSON('data/listings.json', [])]);
    SITE = site || {};
    LIST = Array.isArray(list) ? list.filter((l) => l && l.id != null) : [];
    applySite();
    setupPrice();
    bindStatic();
    renderAll();
    startMotion();
  }

  function applySite() {
    const zalo = String(SITE.zalo_phone || '').replace(/\D/g, '');
    const href = zalo ? 'https://zalo.me/' + zalo : 'https://zalo.me/';
    document.querySelectorAll('.zalo-link').forEach((a) => { a.href = href; });
    if (zalo) $('#footZalo').textContent = 'Zalo ' + zalo.replace(/(\d{4})(\d{3})(\d+)/, '$1 $2 $3');
    if (SITE.brand) $('#brandName').textContent = SITE.brand;
    if (SITE.motion === 'system') $('#root').classList.add('rm');

    const trends = (Array.isArray(SITE.trends) ? SITE.trends : []).map((t) => String(t).trim()).filter(Boolean);
    SITE._trends = trends.length ? trends : DEFAULT_TRENDS;
    let base = [];
    while (base.length < 8) base = base.concat(SITE._trends);
    const items = base.concat(base);
    $('#ticker').innerHTML = items.map((t) => '<span>♥ ' + esc(t) + '</span>').join('');
    $('#tape1').innerHTML = items.map((t) => '<span>' + esc(t) + '<svg class="twi" width="22" height="22" viewBox="0 0 24 24"><path d="' + SPARK + '" fill="#FF8FB8"/></svg></span>').join('');
    $('#tape2').innerHTML = items.map((t) => '<span>' + esc(t) + '<svg width="24" height="24" viewBox="0 0 24 24"><path d="' + HEART + '" fill="#fff" stroke="#141013" stroke-width="2"/></svg></span>').join('');
    const speed = Number(SITE.tape_seconds) || 26;
    $('#tape1').style.animationDuration = speed + 's';
    $('#tape2').style.animationDuration = speed + 's';
    $('#trendNow').textContent = SITE._trends[0];
    $('#ppText').textContent = SITE._trends[0];

    if (SITE.updated) {
      const d = new Date(SITE.updated * 1000);
      const el = $('#updated');
      el.textContent = 'Cập nhật ' + d.toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' });
      el.hidden = false;
    }
  }

  function setupPrice() {
    const prices = LIST.map((l) => l.price).filter((p) => p > 0);
    PRICE_CAP = Math.max(5, Math.ceil(Math.max(0, ...prices) / 1e6));
    const r = $('#price');
    r.max = String(PRICE_CAP);
    r.value = String(PRICE_CAP);
    S.maxPrice = PRICE_CAP;
  }

  // ---------- bộ lọc ----------
  function chips(container, options, current, onPick) {
    container.innerHTML = options.map((o) =>
      '<button class="chip btnk" type="button" aria-pressed="' + (o === current) + '" data-v="' + esc(o) + '">' + esc(o) + '</button>'
    ).join('');
    container.querySelectorAll('button').forEach((b) => b.addEventListener('click', () => onPick(b.dataset.v)));
  }

  function present(field, order) {
    const have = new Set(LIST.map((l) => l[field]).filter(Boolean));
    const ordered = order ? order.filter((x) => have.has(x)) : Array.from(have).sort((a, b) => a.localeCompare(b, 'vi', { numeric: true }));
    return ['Tất cả'].concat(ordered);
  }

  function renderFilters() {
    chips($('#fDistrict'), present('district'), S.district, (v) => { S.district = v; S.ward = 'Tất cả'; renderAll(); });
    const wardGroup = $('#wardGroup');
    if (S.district !== 'Tất cả') {
      const wards = Array.from(new Set(LIST.filter((l) => l.district === S.district).map((l) => l.ward).filter(Boolean)))
        .sort((a, b) => a.localeCompare(b, 'vi', { numeric: true }));
      wardGroup.hidden = wards.length === 0;
      chips($('#fWard'), ['Tất cả'].concat(wards), S.ward, (v) => { S.ward = v; renderAll(); });
    } else {
      wardGroup.hidden = true;
    }
    chips($('#fLayout'), ['Tất cả'].concat(LAYOUT_ORDER), S.layout, (v) => { S.layout = v; renderAll(); });
    chips($('#fKind'), ['Tất cả'].concat(KIND_ORDER), S.kind, (v) => { S.kind = v; renderAll(); });

    const amenAll = Array.from(new Set(LIST.flatMap((l) => l.amenities || [])));
    const amenBox = $('#fAmen');
    amenBox.innerHTML = amenAll.map((a) =>
      '<button class="chip btnk" type="button" aria-pressed="' + S.amen.has(a) + '" data-v="' + esc(a) + '">' + esc(cap(a)) + '</button>'
    ).join('');
    amenBox.querySelectorAll('button').forEach((b) => b.addEventListener('click', () => {
      const v = b.dataset.v;
      if (S.amen.has(v)) S.amen.delete(v); else S.amen.add(v);
      renderAll();
    }));
    $('#onlySaved').setAttribute('aria-pressed', String(S.onlySaved));
    $('#priceLabel').textContent = S.maxPrice >= PRICE_CAP ? 'Mọi mức giá' : million(S.maxPrice * 1e6) + ' triệu';
    $('#savedCount').textContent = String(S.saved.size);
  }

  function filtered() {
    return LIST.filter((l) =>
      (S.district === 'Tất cả' || l.district === S.district) &&
      (S.ward === 'Tất cả' || l.ward === S.ward) &&
      (S.kind === 'Tất cả' || l.kind === S.kind) &&
      (S.layout === 'Tất cả' || l.layout === S.layout) &&
      (S.maxPrice >= PRICE_CAP || !l.price || l.price <= S.maxPrice * 1e6) &&
      Array.from(S.amen).every((a) => (l.amenities || []).indexOf(a) !== -1) &&
      (!S.onlySaved || S.saved.has(l.id))
    );
  }

  // ---------- thẻ phòng ----------
  const titleOf = (l) => [l.layout || l.kind || 'Phòng cho thuê', l.street].filter(Boolean).join(' · ');
  const whereOf = (l) => [l.ward, l.district].filter(Boolean).join(', ') || 'TP. Hồ Chí Minh';
  const priceOf = (l) => {
    if (!l.price) return 'Giá liên hệ';
    let s = million(l.price);
    if (l.price_max && l.price_max !== l.price) s += ' – ' + million(l.price_max);
    return s + ' triệu';
  };

  function cardHTML(l, i) {
    const saved = S.saved.has(l.id);
    const isNew = l.updated && (Date.now() / 1000 - l.updated) < NEW_SECONDS;
    const imgs = l.images || [];
    const photo = imgs.length
      ? '<img src="' + esc(imgs[0]) + '" alt="Ảnh ' + esc(titleOf(l)) + '" loading="lazy">'
      : '<span class="noimg">' + ROOM_ICON + '</span>';
    return '<article class="card ' + (i % 2 ? 'sb' : 'sa') + (saved ? ' is-saved' : '') + '" style="animation-delay:' + Math.min(i, 12) * 0.06 + 's" data-id="' + esc(l.id) + '">' +
      PEEK +
      '<button class="photo" type="button" data-open="' + esc(l.id) + '" aria-label="Xem chi tiết ' + esc(titleOf(l)) + '">' + photo +
        (l.kind ? '<span class="badge">' + esc(l.kind) + '</span>' : '') +
        (isNew ? '<span class="newb">mới toanh!</span>' : '') +
        (imgs.length > 1 ? '<span class="count">' + imgs.length + ' ảnh</span>' : '') +
      '</button>' +
      '<button class="heartbtn" type="button" aria-pressed="' + saved + '" aria-label="Thả tim lưu phòng #' + esc(l.id) + '" data-save="' + esc(l.id) + '">' +
        '<svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true"><path d="' + HEART + '" fill="' + (saved ? '#FF5C9A' : '#FFFFFF') + '" stroke="#141013" stroke-width="2.2" stroke-linejoin="round"/></svg>' +
      '</button>' +
      '<div class="body">' +
        '<div class="prow"><span class="price">' + esc(priceOf(l)) + '<svg class="twi" aria-hidden="true" width="18" height="18" viewBox="0 0 24 24"><path d="' + SPARK + '" fill="#FF5C9A"/></svg></span>' +
        (l.layout ? '<span class="layoutpill">' + esc(l.layout) + '</span>' : '') + '</div>' +
        '<h3>' + esc(titleOf(l)) + ' <span style="color:var(--muted); font-weight:700">#' + esc(l.id) + '</span></h3>' +
        '<span class="where">' + esc(whereOf(l)) + '</span>' +
        ((l.amenities || []).length ? '<div class="amen">' + l.amenities.map((a) => '<span>' + esc(cap(a)) + '</span>').join('') + '</div>' : '') +
        '<div class="cardcta">' +
          '<a class="btn-dark btnk shine" href="' + esc(zaloHref()) + '" target="_blank" rel="noopener">Nhắn Zalo hỏi #' + esc(l.id) + '</a>' +
          '<button class="btn-light btnk" type="button" data-open="' + esc(l.id) + '">Chi tiết</button>' +
        '</div>' +
      '</div>' +
    '</article>';
  }

  function zaloHref() {
    const z = String(SITE.zalo_phone || '').replace(/\D/g, '');
    return z ? 'https://zalo.me/' + z : 'https://zalo.me/';
  }

  function renderGrid() {
    const list = filtered();
    const grid = $('#grid');
    grid.innerHTML = list.map(cardHTML).join('');
    $('#countText').textContent = LIST.length === 0 ? 'Phòng mới đang về' : list.length + ' phòng xinh cho bạn';
    const empty = $('#empty');
    empty.hidden = list.length !== 0;
    if (LIST.length === 0) {
      $('#emptyTitle').textContent = 'Phòng mới đang được duyệt nè';
      $('#emptyText').textContent = 'Quay lại sau xíu, hoặc nhắn Zalo để mình tìm giúp liền.';
    } else {
      $('#emptyTitle').textContent = 'Hic, chưa có phòng khớp rồi';
      $('#emptyText').textContent = 'Nới giá hoặc bỏ bớt tiện ích thử nha.';
    }
  }

  function renderAll() { renderFilters(); renderGrid(); }

  function toggleSave(id, btn) {
    const was = S.saved.has(id);
    if (was) S.saved.delete(id); else S.saved.add(id);
    store.set('px_saved', Array.from(S.saved));
    $('#savedCount').textContent = String(S.saved.size);
    btn.setAttribute('aria-pressed', String(!was));
    btn.querySelector('path').setAttribute('fill', was ? '#FFFFFF' : '#FF5C9A');
    const own = btn.closest('.card');
    if (own) own.classList.toggle('is-saved', !was);      // tai mèo hiện khi thả tim, mất khi bỏ tim
    if (!was) {
      btn.classList.remove('pop'); void btn.offsetWidth; btn.classList.add('pop');
      const card = btn.closest('.card');
      const burst = document.createElement('div');
      burst.className = 'burst';
      burst.setAttribute('aria-hidden', 'true');
      const shapes = [[HEART, '#FF5C9A'], [HEART, '#FFB3D1'], [HEART, '#FF5C9A'], [STAR, '#fff'], [STAR, '#FFB3D1'], [HEART, '#fff']];
      burst.innerHTML = shapes.map((s, i) => '<svg class="bh bh' + (i + 1) + '" viewBox="0 0 24 24"><path d="' + s[0] + '" fill="' + s[1] + '" stroke="#141013" stroke-width="2"/></svg>').join('');
      card.appendChild(burst);
      setTimeout(() => burst.remove(), 950);
    }
    if (S.onlySaved) renderGrid();
  }

  // ---------- xem chi tiết ----------
  function openDetail(id) {
    const l = LIST.find((x) => String(x.id) === String(id));
    if (!l) return;
    const dlg = $('#detail');
    $('#dTitle').textContent = titleOf(l) + ' · #' + l.id;
    $('#dWhere').textContent = whereOf(l);
    $('#dPrice').textContent = priceOf(l);
    $('#dLayout').textContent = l.layout || '';
    $('#dLayout').hidden = !l.layout;
    $('#dAmen').innerHTML = (l.amenities || []).map((a) => '<span>' + esc(cap(a)) + '</span>').join('');
    $('#dDesc').textContent = l.description || '';
    $('#dZalo').textContent = 'Nhắn Zalo hỏi phòng #' + l.id;
    const imgs = l.images || [];
    VIEW.imgs = imgs;
    VIEW.i = 0;
    const main = $('#dImg');
    const thumbs = $('#dThumbs');
    if (imgs.length) {
      main.hidden = false;
      main.src = imgs[0];
      main.alt = 'Ảnh ' + titleOf(l);
      thumbs.innerHTML = imgs.length > 1 ? imgs.map((src, i) =>
        '<button type="button" aria-label="Ảnh ' + (i + 1) + '" aria-current="' + (i === 0) + '" data-src="' + esc(src) + '"><img src="' + esc(src) + '" alt="" loading="lazy"></button>'
      ).join('') : '';
      thumbs.querySelectorAll('button').forEach((b, bi) => b.addEventListener('click', () => {
        main.src = b.dataset.src;
        VIEW.i = bi;
        thumbs.querySelectorAll('button').forEach((x) => x.setAttribute('aria-current', String(x === b)));
      }));
    } else {
      main.hidden = true;
      thumbs.innerHTML = '';
    }
    if (typeof dlg.showModal === 'function') dlg.showModal(); else dlg.setAttribute('open', '');
  }

  // ---------- xem ảnh lớn: đè lên thông tin phòng, có nút quay lại + ảnh trước/sau ----------
  const VIEW = { imgs: [], i: 0 };

  function showView() {
    const n = VIEW.imgs.length;
    $('#vImg').src = VIEW.imgs[VIEW.i];
    $('#vCount').textContent = (VIEW.i + 1) + ' / ' + n;
    $('#vPrev').hidden = n < 2;
    $('#vNext').hidden = n < 2;
  }

  function openViewer(i) {
    if (!VIEW.imgs.length) return;
    VIEW.i = i;
    showView();
    const v = $('#viewer');
    if (typeof v.showModal === 'function') v.showModal(); else v.setAttribute('open', '');
  }

  function stepView(d) {
    const n = VIEW.imgs.length;
    if (n < 2) return;
    VIEW.i = (VIEW.i + d + n) % n;
    showView();
  }

  function closeViewer() {
    const v = $('#viewer');
    v.close ? v.close() : v.removeAttribute('open');
    // ảnh lớn trong khung thông tin đi theo ảnh vừa xem
    const main = $('#dImg');
    if (VIEW.imgs.length) main.src = VIEW.imgs[VIEW.i];
    $('#dThumbs').querySelectorAll('button').forEach((x, xi) => x.setAttribute('aria-current', String(xi === VIEW.i)));
  }

  function bindViewer() {
    $('#dImg').addEventListener('click', () => openViewer(VIEW.i));
    $('#vBack').addEventListener('click', closeViewer);
    $('#vPrev').addEventListener('click', (e) => { e.stopPropagation(); stepView(-1); });
    $('#vNext').addEventListener('click', (e) => { e.stopPropagation(); stepView(1); });
    const v = $('#viewer');
    v.addEventListener('cancel', (e) => { e.preventDefault(); closeViewer(); });   // phím Esc = quay lại
    v.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight') stepView(1);
      if (e.key === 'ArrowLeft') stepView(-1);
    });
    // vuốt trái/phải trên điện thoại
    let x0 = null;
    const st = $('#vStage');
    st.addEventListener('touchstart', (e) => { x0 = e.touches[0].clientX; }, { passive: true });
    st.addEventListener('touchend', (e) => {
      if (x0 === null) return;
      const dx = e.changedTouches[0].clientX - x0;
      if (Math.abs(dx) > 40) stepView(dx < 0 ? 1 : -1);
      x0 = null;
    });
  }

  // ---------- gắn sự kiện ----------
  function bindStatic() {
    bindViewer();
    $('#reset').addEventListener('click', () => {
      Object.assign(S, { district: 'Tất cả', ward: 'Tất cả', kind: 'Tất cả', layout: 'Tất cả', maxPrice: PRICE_CAP, onlySaved: false });
      S.amen.clear();
      $('#price').value = String(PRICE_CAP);
      renderAll();
    });
    $('#onlySaved').addEventListener('click', () => { S.onlySaved = !S.onlySaved; renderAll(); });
    $('#price').addEventListener('input', (e) => {
      S.maxPrice = parseFloat(e.target.value);
      $('#priceLabel').textContent = S.maxPrice >= PRICE_CAP ? 'Mọi mức giá' : million(S.maxPrice * 1e6) + ' triệu';
      renderGrid();
    });
    $('#grid').addEventListener('click', (e) => {
      const save = e.target.closest('[data-save]');
      if (save) { toggleSave(Number(save.dataset.save) || save.dataset.save, save); return; }
      const open = e.target.closest('[data-open]');
      if (open) openDetail(open.dataset.open);
    });
    const dlg = $('#detail');
    $('#dClose').addEventListener('click', () => dlg.close());
    dlg.addEventListener('click', (e) => { if (e.target === dlg) dlg.close(); });

    const hero = $('#hero');
    const paw = $('#pawf');
    hero.addEventListener('mousemove', (e) => {
      const r = hero.getBoundingClientRect();
      paw.style.left = (e.clientX - r.left) + 'px';
      paw.style.top = (e.clientY - r.top) + 'px';
      paw.style.opacity = '1';
    });
    hero.addEventListener('mouseleave', () => { paw.style.opacity = '0'; });
  }

  // ---------- mèo đổi mặt, sticker, chữ trend ----------
  function startMotion() {
    const slots = Array.from(document.querySelectorAll('.slot'));
    slots.forEach((s) => { s.innerHTML = STICKERS.join(''); });
    const reduce = SITE.motion === 'system' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let tick = 0;

    function step() {
      const pop = tick % 2 ? 'pb' : 'pa';
      const m = MOODS[tick % MOODS.length];
      document.querySelectorAll('[data-mood]').forEach((g) => g.classList.toggle('on', g.dataset.mood === m.key));
      document.querySelector('[data-mouth="normal"]').classList.toggle('on', m.key !== 'wow');
      document.querySelector('[data-mouth="wow"]').classList.toggle('on', m.key === 'wow');
      const say = $('#say');
      say.textContent = m.say;
      say.className = 'say ' + pop;

      slots.forEach((s) => {
        const k = (tick + Number(s.dataset.off || 0)) % STICKERS.length;
        Array.from(s.children).forEach((svg, i) => { svg.classList.toggle('on', i === k); svg.classList.remove('pa', 'pb'); });
        s.children[k].classList.add(pop);
      });

      if (tick % 2 === 0) {
        const t = SITE._trends[(tick / 2) % SITE._trends.length];
        const tn = $('#trendNow');
        tn.textContent = t;
        tn.className = pop;
        $('#ppText').textContent = t;
      }
      if (tick % 3 === 0) {
        const w = WORDS[(tick / 3) % WORDS.length];
        const word = $('#word');
        word.textContent = w;
        word.className = 'word rainbow ' + pop;
        $('#heroTitle').setAttribute('aria-label', 'Tìm phòng ' + w);
      }
      tick++;
    }
    step();
    if (!reduce) setInterval(step, 1600);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
