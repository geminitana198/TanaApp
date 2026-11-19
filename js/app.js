(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const { hanChars } = Lexicon;
  const view = $('#view');
  const STUDY = '__study';
  const ui = { level: '', topic: '' };
  let keyHandler = null;

  // ---------- Dữ liệu ----------
  const settings = () => Store.state.settings;
  const progress = () => Store.state.progress;
  const study = () => Store.state.study;
  const allCards = () => [...BUILTIN_CARDS, ...Store.state.custom];
  const cardById = (id) => allCards().find((c) => c.id === id);
  const cardsOf = (f = ui) => allCards().filter((c) =>
    (!f.level || (f.level === STUDY ? study()[c.id] : c.deck === f.level)) && (!f.topic || c.topic === f.topic));
  const refreshIndex = () => Lexicon.buildIndex(allCards());

  function deckList() {
    const m = new Map();
    allCards().forEach((c) => m.set(c.deck, (m.get(c.deck) || 0) + 1));
    return [...m];
  }

  function deckStats(f) {
    const P = progress();
    const cs = cardsOf(f);
    const now = Date.now();
    return {
      total: cs.length,
      learned: cs.filter((c) => P[c.id]).length,
      due: cs.filter((c) => SRS.isDue(P[c.id], now)).length,
      mastered: cs.filter((c) => SRS.isMastered(P[c.id])).length,
      fresh: cs.filter((c) => !P[c.id]).length,
    };
  }

  const newLeftToday = () => Math.max(0, settings().newPerDay - (Store.todayLog().newLearned || 0));

  function streak() {
    const log = Store.state.log;
    const active = (k) => log[k] && (log[k].reviewed || log[k].written || log[k].newLearned);
    const d = new Date();
    if (!active(Store.today(d))) d.setDate(d.getDate() - 1);
    let n = 0;
    while (active(Store.today(d))) { n++; d.setDate(d.getDate() - 1); }
    return n;
  }

  // ---------- Từ cần học ----------
  const inStudy = (id) => !!study()[id];
  function setStudy(id, on, silent) {
    if (on === inStudy(id)) return;
    if (on) study()[id] = Date.now();
    else delete study()[id];
    Store.save();
    updateStudyUI();
    if (!silent) toast(on ? '⭐ Đã thêm vào Từ cần học' : 'Đã bỏ khỏi Từ cần học');
  }
  function updateStudyUI() {
    const n = Object.keys(study()).length;
    $('#studyCount').textContent = n || '';
    $$('[data-star]').forEach((b) => {
      const on = inStudy(b.dataset.star);
      b.classList.toggle('on', on);
      b.title = on ? 'Bỏ khỏi Từ cần học' : 'Thêm vào Từ cần học';
      b.textContent = b.classList.contains('label') ? (on ? '⭐ Đang học' : '☆ Thêm vào cần học') : on ? '⭐' : '☆';
    });
  }
  const starBtn = (id, label = false) => `<button class="btn icon star ${label ? 'label' : ''}" data-star="${esc(id)}"></button>`;

  // ---------- Tiện ích ----------
  function speak(text) {
    if (!('speechSynthesis' in window) || !text) return;
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'zh-CN';
    u.rate = 0.85;
    const voice = speechSynthesis.getVoices().find((v) => /^zh/i.test(v.lang));
    if (voice) u.voice = voice;
    speechSynthesis.speak(u);
  }

  const cssVar = (name, fallback) => getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;
  const writerColors = () => ({
    strokeColor: cssVar('--ink', '#1f1a17'),
    outlineColor: cssVar('--outline', '#e3dbcf'),
    drawingColor: cssVar('--accent', '#c0392b'),
    highlightColor: cssVar('--good', '#2e9d5b'),
  });

  function toast(msg) {
    const t = document.createElement('div');
    t.className = 'toast';
    t.textContent = msg;
    document.body.append(t);
    setTimeout(() => t.classList.add('show'), 10);
    setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.remove(), 300); }, 2200);
  }

  const speakBtn = (text) => `<button class="btn icon" data-speak="${esc(text)}" title="Phát âm">🔊</button>`;
  const topicName = (t) => (TOPICS[t] ? `${TOPICS[t].icon} ${TOPICS[t].name}` : '');
  const wordLink = (c) => `#/word?id=${encodeURIComponent(c.id)}`;

  // Bộ lọc dùng chung: cấp độ / bộ thẻ + chủ đề
  function filterBar() {
    const nStudy = Object.keys(study()).length;
    return `
      <select id="fLevel" class="select" aria-label="Cấp độ">
        <option value="">Tất cả cấp độ</option>
        ${deckList().map(([d, n]) => `<option value="${esc(d)}" ${d === ui.level ? 'selected' : ''}>${esc(d)} (${n})</option>`).join('')}
        <option value="${STUDY}" ${ui.level === STUDY ? 'selected' : ''}>⭐ Từ cần học (${nStudy})</option>
      </select>
      <select id="fTopic" class="select" aria-label="Chủ đề">
        <option value="">Tất cả chủ đề</option>
        ${Object.entries(TOPICS).map(([k, t]) => `<option value="${k}" ${k === ui.topic ? 'selected' : ''}>${t.icon} ${t.name}</option>`).join('')}
      </select>`;
  }
  function bindFilter(onChange) {
    $('#fLevel').onchange = (e) => { ui.level = e.target.value; onChange(); };
    $('#fTopic').onchange = (e) => { ui.topic = e.target.value; onChange(); };
  }
  const filterLabel = () => [ui.level === STUDY ? '⭐ Từ cần học' : ui.level || 'Tất cả cấp độ', ui.topic && TOPICS[ui.topic]?.name].filter(Boolean).join(' · ');

  // ---------- Trang chủ ----------
  function viewHome() {
    const s = deckStats({});
    const toReview = s.due + Math.min(newLeftToday(), s.fresh);
    const days = [...Array(7)].map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      const e = Store.state.log[Store.today(d)] || {};
      return { label: ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'][d.getDay()], n: (e.reviewed || 0) + (e.written || 0) };
    });
    const max = Math.max(5, ...days.map((d) => d.n));

    view.innerHTML = `
      <section class="hero">
        <div>
          <h1>你好！Chào bạn 👋</h1>
          <p class="muted">Mỗi ngày một chút — học từ mới theo cấp HSK và chủ đề, ôn đúng lúc sắp quên, hiểu bộ thủ và luyện viết từng nét.</p>
        </div>
        <a class="btn primary big" href="#/review">${toReview ? `Ôn tập ngay · ${toReview} thẻ` : 'Hôm nay đã xong 🎉'}</a>
      </section>

      <section class="stats">
        <div class="stat"><b>${toReview}</b><span>Cần ôn hôm nay</span></div>
        <div class="stat"><b>${s.learned}<small>/${s.total}</small></b><span>Đã học</span></div>
        <div class="stat"><b>${Object.keys(study()).length}</b><span>Từ cần học ⭐</span></div>
        <div class="stat"><b>${streak()} 🔥</b><span>Chuỗi ngày học</span></div>
      </section>

      <section class="levels">
        ${LEVELS.map((lv) => {
          const st = deckStats({ level: `HSK ${lv}` });
          const pct = st.total ? Math.round((st.learned / st.total) * 100) : 0;
          return `<a class="card level" href="#/vocab" data-level="HSK ${lv}">
            <b>HSK ${lv}</b><span class="muted">${st.total} từ · ${GRAMMAR.filter((g) => g.level === lv).length} ngữ pháp</span>
            <div class="progress"><div style="width:${pct}%"></div></div><small class="muted">Đã học ${pct}%</small></a>`;
        }).join('')}
      </section>

      <section class="card">
        <h3>Hoạt động 7 ngày qua</h3>
        <div class="bars">
          ${days.map((d) => `<div class="bar"><div class="bar-fill" style="height:${(d.n / max) * 100}%" title="${d.n}"></div><span>${d.label}</span></div>`).join('')}
        </div>
      </section>

      <section class="tiles">
        <a class="tile" href="#/vocab"><span>📚</span><b>Từ vựng</b><small>Theo cấp HSK và chủ đề, kèm bộ thủ</small></a>
        <a class="tile" href="#/grammar"><span>📝</span><b>Ngữ pháp</b><small>Cấu trúc câu theo từng cấp</small></a>
        <a class="tile" href="#/study"><span>⭐</span><b>Từ cần học</b><small>Danh sách bạn tự lưu để luyện</small></a>
        <a class="tile" href="#/flashcards"><span>🃏</span><b>Flashcard</b><small>Lật thẻ, nghe phát âm</small></a>
        <a class="tile" href="#/review"><span>🔁</span><b>Ôn tập</b><small>Lặp lại ngắt quãng, nhớ lâu</small></a>
        <a class="tile" href="#/write"><span>✍️</span><b>Tập viết</b><small>Tự viết từng nét, được chấm</small></a>
        <a class="tile" href="#/guide"><span>📖</span><b>Viết mẫu</b><small>Thứ tự nét và quy tắc viết</small></a>
      </section>`;
    $$('[data-level]').forEach((a) => a.addEventListener('click', () => { ui.level = a.dataset.level; ui.topic = ''; }));
  }

  // ---------- Từ vựng ----------
  function viewVocab(q) {
    let search = q.get('q') || '';
    const levels = [['', 'Tất cả'], ...deckList().map(([d]) => [d, d])];

    view.innerHTML = `
      <section class="page">
        <div class="toolbar">
          <h2>📚 Từ vựng</h2>
          <input id="search" class="input" placeholder="Tìm Hán tự, pinyin, nghĩa…" value="${esc(search)}">
        </div>
        <div class="tabs" id="levelTabs">${levels.map(([v, l]) => `<button class="tab ${v === ui.level ? 'on' : ''}" data-v="${esc(v)}">${esc(l)}</button>`).join('')}</div>
        <div class="topics" id="topics"></div>
        <div class="row wrap actions-bar" id="actionsBar"></div>
        <div id="list" class="word-list"></div>
      </section>`;

    function renderTopics() {
      const base = cardsOf({ level: ui.level === STUDY ? '' : ui.level });
      const counts = {};
      base.forEach((c) => { if (c.topic) counts[c.topic] = (counts[c.topic] || 0) + 1; });
      $('#topics').innerHTML = `<button class="topic ${!ui.topic ? 'on' : ''}" data-t=""><span>🌐</span><b>Tất cả</b><small>${base.length}</small></button>` +
        Object.entries(TOPICS).filter(([k]) => counts[k]).map(([k, t]) =>
          `<button class="topic ${ui.topic === k ? 'on' : ''}" data-t="${k}"><span>${t.icon}</span><b>${t.name}</b><small>${counts[k]}</small></button>`).join('');
      $$('#topics .topic').forEach((b) => (b.onclick = () => { ui.topic = b.dataset.t; renderTopics(); renderList(); }));
    }

    function renderList() {
      if (ui.level === STUDY) ui.level = '';
      const needle = search.trim().toLowerCase();
      const plain = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
      const list = cardsOf().filter((c) => !needle ||
        c.hanzi.includes(search.trim()) || plain(c.pinyin).includes(plain(needle)) || c.meaning.toLowerCase().includes(needle) ||
        Lexicon.wordHanViet(c.hanzi).includes(needle));
      $('#actionsBar').innerHTML = `<span class="muted">${list.length} từ · ${esc(filterLabel())}</span>
        <a class="btn" href="#/flashcards">🃏 Học flashcard</a><a class="btn" href="#/review">🔁 Ôn tập</a><a class="btn" href="#/write">✍️ Tập viết</a>`;
      $('#list').innerHTML = list.length ? list.slice(0, 400).map((c) => {
        const p = progress()[c.id];
        const dot = !p ? '' : SRS.isMastered(p) ? '<i class="dot good" title="Thuộc lòng"></i>' : '<i class="dot" title="Đang học"></i>';
        return `<div class="word-row">
          <a href="${wordLink(c)}" class="word-main">
            <span class="hanzi">${esc(c.hanzi)}</span>
            <span class="word-text"><b>${esc(c.pinyin)}</b> <small class="hv">${esc(Lexicon.wordHanViet(c.hanzi))}</small><br><span>${esc(c.meaning)}</span></span>
          </a>${dot}${speakBtn(c.hanzi)}${starBtn(c.id)}</div>`;
      }).join('') : '<p class="muted">Không tìm thấy từ nào.</p>';
      updateStudyUI();
    }

    $$('#levelTabs .tab').forEach((b) => (b.onclick = () => {
      ui.level = b.dataset.v;
      $$('#levelTabs .tab').forEach((x) => x.classList.toggle('on', x === b));
      renderTopics();
      renderList();
    }));
    $('#search').oninput = (e) => { search = e.target.value; renderList(); };
    renderTopics();
    renderList();
  }

  // ---------- Chi tiết từ ----------
  function charAnalysisHTML(a, withBox = true) {
    const comp = (p) => `<div class="comp">
        <span class="hanzi">${esc(p.ch)}</span>
        <div>${p.radical ? `<b>Bộ ${esc(p.radical.name)}</b> <span class="muted">${esc(p.radical.meaning)}</span>` : `<b>${esc((p.hv || '').toUpperCase() || p.ch)}</b>`}
        <small class="muted">${[p.pinyin, p.en && `EN: ${p.en}`].filter(Boolean).map(esc).join(' · ')}</small></div>
        ${a.semantic === p.ch ? '<span class="tag sem">chỉ nghĩa</span>' : a.phonetic === p.ch ? '<span class="tag pho">chỉ âm</span>' : ''}
      </div>`;
    return `<div class="char-analysis">
      ${withBox ? `<div class="hz-box mini-writer" data-char="${esc(a.ch)}" title="Nhấn để xem cách viết"></div>` : ''}
      <div class="char-body">
        <div class="row"><span class="hanzi lg">${esc(a.ch)}</span>
          <div><b class="hv-big">${esc(a.hv.toUpperCase())}</b> <span class="pinyin sm">${esc(a.pinyin)}</span><br>
          <span>${a.meaning.text ? (a.meaning.lang === 'en' ? `<span class="muted">EN:</span> ${esc(a.meaning.text)}` : esc(a.meaning.text)) : ''}</span></div>
        </div>
        <p class="row wrap small">
          ${a.radical ? `<span class="pill">Bộ thủ: <b>${esc(a.radical.ch)}</b> ${a.radical.radical ? esc(`${a.radical.radical.name} – ${a.radical.radical.meaning}`) : esc(a.radical.hv)}</span>` : ''}
          ${a.type ? `<span class="pill">Loại chữ: <b>${esc(a.type)}</b></span>` : ''}
        </p>
        ${a.summary ? `<p>${esc(a.summary)}</p>` : ''}
        ${a.parts.length ? `<div class="comps">${a.parts.map(comp).join('')}</div>` : ''}
        ${a.hint ? `<p class="small muted">Từ nguyên (EN): ${esc(a.hint)}</p>` : ''}
      </div>
    </div>`;
  }

  function mountMiniWriters(root = view) {
    $$('.mini-writer', root).forEach((el) => {
      const ch = el.dataset.char;
      const w = HanziWriter.create(el, ch, {
        width: 110, height: 110, padding: 6, showOutline: true, strokeAnimationSpeed: 1.2, delayBetweenStrokes: 150,
        ...writerColors(),
        onLoadCharDataError: () => { el.textContent = ch; el.classList.add('err'); },
      });
      el.addEventListener('click', () => w.animateCharacter());
    });
  }

  function viewWord(q) {
    const c = cardById(q.get('id')) || allCards().find((x) => x.hanzi === q.get('w'));
    if (!c) { view.innerHTML = '<section class="page"><p class="muted">Không tìm thấy từ.</p><a class="btn" href="#/vocab">← Từ vựng</a></section>'; return; }
    const chars = [...new Set(hanChars(c.hanzi))];
    const related = Lexicon.relatedWords(c);
    const examples = GRAMMAR.flatMap((g) => g.examples.map((e) => ({ e, g }))).filter(({ e }) => e[0].includes(c.hanzi)).slice(0, 4);
    const p = progress()[c.id];

    view.innerHTML = `
      <section class="page">
        <div class="row between"><a class="btn" href="javascript:history.back()">← Quay lại</a>
          <span class="muted">${esc(c.deck)}${c.topic ? ' · ' + esc(topicName(c.topic)) : ''}</span></div>
        <div class="card word-hero">
          <div class="hanzi xl">${esc(c.hanzi)}</div>
          <div>
            <div class="pinyin">${esc(c.pinyin)}</div>
            <div class="hv-big">${esc(Lexicon.wordHanViet(c.hanzi).toUpperCase())}</div>
            <div class="meaning lg">${esc(c.meaning)}</div>
            <div class="row wrap">${speakBtn(c.hanzi)}${starBtn(c.id, true)}
              <a class="btn" href="#/write?w=${encodeURIComponent(c.hanzi)}">✍️ Tập viết</a>
              <a class="btn" href="#/guide?c=${encodeURIComponent(c.hanzi)}">📖 Viết mẫu</a></div>
            <small class="muted">${!p ? 'Chưa học' : SRS.isMastered(p) ? 'Đã thuộc lòng' : `Đang học · ôn lại sau ${Math.max(0, Math.ceil((p.due - Date.now()) / 86400000))} ngày`}</small>
          </div>
        </div>

        <div class="card">
          <h3>💡 Giải thích nghĩa</h3>
          <p>${esc(Lexicon.explainWord(c))}</p>
          ${c.note ? `<p>${esc(c.note)}</p>` : ''}
          ${c.example ? `<div class="example">${esc(c.example)} ${speakBtn(c.example)}</div>` : ''}
        </div>

        <div class="card">
          <h3>🧩 Cấu tạo từng chữ & bộ thủ</h3>
          <p class="small muted">Nhấn vào ô chữ để xem thứ tự nét. Thành phần <span class="tag sem">chỉ nghĩa</span> gợi ý ý nghĩa, <span class="tag pho">chỉ âm</span> gợi ý cách đọc.</p>
          ${chars.map((ch) => charAnalysisHTML(Lexicon.analyzeChar(ch))).join('<hr>')}
        </div>

        ${examples.length ? `<div class="card"><h3>🗣️ Câu ví dụ</h3>${examples.map(({ e, g }) => `
          <div class="ex-line"><div><span class="zh">${esc(e[0])}</span> ${speakBtn(e[0])}<br><small class="pinyin sm">${esc(e[1])}</small><br><small>${esc(e[2])}</small></div>
          <a class="small muted" href="#/grammar?level=${g.level}">${esc(g.title)}</a></div>`).join('')}</div>` : ''}

        <div class="card">
          <h3>🔗 Từ đi kèm</h3>
          ${related.length ? `<div class="words">${related.map(({ via, card }) => `<a href="${wordLink(card)}" class="word"><span class="hanzi">${esc(card.hanzi)}</span><small>${esc(card.pinyin)} · ${esc(card.meaning)}</small><small class="muted">chứa ${esc(via)} · ${esc(card.deck)}</small></a>`).join('')}</div>`
            : '<p class="muted">Chưa có từ đi kèm trong kho từ vựng.</p>'}
        </div>
      </section>`;
    mountMiniWriters();
    updateStudyUI();
  }

  // ---------- Ngữ pháp ----------
  function viewGrammar(q) {
    let level = Number(q.get('level')) || 0;
    let hide = false;
    view.innerHTML = `
      <section class="page">
        <div class="toolbar"><h2>📝 Ngữ pháp</h2>
          <label class="switch"><input type="checkbox" id="hide"> Ẩn nghĩa để tự kiểm tra</label></div>
        <div class="tabs" id="gTabs">${[0, ...LEVELS].map((lv) => `<button class="tab ${lv === level ? 'on' : ''}" data-lv="${lv}">${lv ? `HSK ${lv}` : 'Tất cả'}</button>`).join('')}</div>
        <div id="gList"></div>
      </section>`;

    function render() {
      const list = GRAMMAR.filter((g) => !level || g.level === level);
      $('#gList').innerHTML = list.map((g, i) => `
        <details class="card grammar" ${i < 3 ? 'open' : ''}>
          <summary><span class="badge">HSK ${g.level}</span> <b>${esc(g.title)}</b></summary>
          <div class="pattern">${esc(g.pattern)}</div>
          <p>${esc(g.explain)}</p>
          ${g.examples.map((e) => `<div class="ex-line"><div><span class="zh">${esc(e[0])}</span> ${speakBtn(e[0])}<br>
            <small class="pinyin sm">${esc(e[1])}</small><br><small class="vi ${hide ? 'blur' : ''}">${esc(e[2])}</small></div></div>`).join('')}
        </details>`).join('');
      $$('#gList .vi').forEach((el) => el.addEventListener('click', () => el.classList.remove('blur')));
    }
    $$('#gTabs .tab').forEach((b) => (b.onclick = () => {
      level = +b.dataset.lv;
      $$('#gTabs .tab').forEach((x) => x.classList.toggle('on', x === b));
      history.replaceState(null, '', level ? `#/grammar?level=${level}` : '#/grammar');
      render();
    }));
    $('#hide').onchange = (e) => { hide = e.target.checked; render(); };
    render();
  }

  // ---------- Từ cần học ----------
  function viewStudy() {
    const ids = Object.entries(study()).sort((a, b) => b[1] - a[1]).map(([id]) => id);
    const list = ids.map(cardById).filter(Boolean);
    const go = (path) => `href="${path}" data-study`;
    view.innerHTML = `
      <section class="page">
        <div class="toolbar"><h2>⭐ Từ cần học <small class="muted">(${list.length})</small></h2>
          ${list.length ? `<div class="row wrap"><a class="btn primary" ${go('#/review')}>🔁 Ôn danh sách</a><a class="btn" ${go('#/flashcards')}>🃏 Flashcard</a><a class="btn" ${go('#/write')}>✍️ Tập viết</a><button id="clear" class="btn danger">Xóa hết</button></div>` : ''}
        </div>
        <p class="muted small">Nhấn ☆ ở bất kỳ từ nào (trang Từ vựng, Flashcard, Ôn tập, Chi tiết từ) để thêm vào đây. Từ bạn đánh “Quên” khi ôn tập hoặc viết sai từ 3 nét trở lên cũng được tự động thêm.</p>
        <div class="word-list">${list.length ? list.map((c) => `
          <div class="word-row">
            <a href="${wordLink(c)}" class="word-main"><span class="hanzi">${esc(c.hanzi)}</span>
            <span class="word-text"><b>${esc(c.pinyin)}</b> <small class="hv">${esc(Lexicon.wordHanViet(c.hanzi))}</small><br><span>${esc(c.meaning)}</span></span></a>
            <small class="muted">${new Date(study()[c.id]).toLocaleDateString('vi-VN')}</small>${speakBtn(c.hanzi)}${starBtn(c.id)}
          </div>`).join('') : '<div class="card center"><div class="big-emoji">📭</div><p>Chưa có từ nào. Hãy vào <a href="#/vocab">Từ vựng</a> và nhấn ☆ để lưu những từ bạn muốn luyện.</p></div>'}
        </div>
      </section>`;
    $$('[data-study]').forEach((a) => a.addEventListener('click', () => { ui.level = STUDY; ui.topic = ''; }));
    $('#clear') && ($('#clear').onclick = () => {
      if (!confirm('Xóa toàn bộ danh sách Từ cần học?')) return;
      Store.state.study = {};
      Store.save();
      updateStudyUI();
      viewStudy();
    });
    updateStudyUI();
  }

  // ---------- Flashcard ----------
  function viewFlashcards() {
    let list = cardsOf();
    let i = 0;

    view.innerHTML = `
      <section class="page">
        <div class="toolbar">
          <h2>🃏 Flashcard</h2>
          <div class="row wrap">${filterBar()}<button id="shuffle" class="btn">🔀 Trộn</button></div>
        </div>
        <div class="fc-wrap"><div class="fc" id="fc" tabindex="0">
          <div class="fc-face fc-front"></div>
          <div class="fc-face fc-back"></div>
        </div></div>
        <div class="fc-nav">
          <button id="prev" class="btn">← Trước</button>
          <span id="pos" class="muted"></span>
          <button id="next" class="btn">Sau →</button>
        </div>
        <p class="hint">Nhấn vào thẻ hoặc phím <kbd>Space</kbd> để lật · <kbd>←</kbd> <kbd>→</kbd> chuyển thẻ · <kbd>S</kbd> thêm vào Từ cần học</p>
      </section>`;

    const fc = $('#fc');

    function show() {
      fc.classList.remove('flipped');
      if (!list.length) {
        $('.fc-front', fc).innerHTML = '<p class="muted">Không có thẻ nào với bộ lọc này</p>';
        $('.fc-back', fc).innerHTML = '';
        $('#pos').textContent = '0 / 0';
        return;
      }
      const c = list[i];
      const p = progress()[c.id];
      const badge = !p ? '<span class="badge">Mới</span>' : SRS.isMastered(p) ? '<span class="badge good">Thuộc lòng</span>' : '<span class="badge">Đang học</span>';
      $('.fc-front', fc).innerHTML = `<div class="fc-top">${badge}${starBtn(c.id)}</div><div class="hanzi xl">${esc(c.hanzi)}</div><small class="muted">${esc(topicName(c.topic))}</small>`;
      $('.fc-back', fc).innerHTML = `
        <div class="fc-top"><span></span>${starBtn(c.id)}</div>
        <div class="hanzi md">${esc(c.hanzi)}</div>
        <div class="pinyin">${esc(c.pinyin)}</div>
        <div class="hv-big">${esc(Lexicon.wordHanViet(c.hanzi).toUpperCase())}</div>
        <div class="meaning">${esc(c.meaning)}</div>
        ${c.example ? `<div class="example">${esc(c.example)}</div>` : ''}
        <div class="row center wrap">${speakBtn(c.hanzi)}<a class="btn" href="${wordLink(c)}">🔎 Chi tiết & bộ thủ</a><a class="btn" href="#/write?w=${encodeURIComponent(c.hanzi)}">✍️ Viết</a></div>`;
      $('#pos').textContent = `${i + 1} / ${list.length}`;
      updateStudyUI();
    }

    function flip() {
      fc.classList.toggle('flipped');
      if (fc.classList.contains('flipped') && settings().autoSpeak && list[i]) speak(list[i].hanzi);
    }
    const go = (d) => { if (list.length) { i = (i + d + list.length) % list.length; show(); } };

    fc.addEventListener('click', (e) => { if (!e.target.closest('a,button')) flip(); });
    $('#prev').onclick = () => go(-1);
    $('#next').onclick = () => go(1);
    $('#shuffle').onclick = () => { list = [...list].sort(() => Math.random() - 0.5); i = 0; show(); };
    bindFilter(() => { list = cardsOf(); i = 0; show(); });
    keyHandler = (e) => {
      if (e.target.matches('input,select,textarea')) return;
      if (e.key === ' ') { e.preventDefault(); flip(); }
      else if (e.key === 'ArrowLeft') go(-1);
      else if (e.key === 'ArrowRight') go(1);
      else if (e.key.toLowerCase() === 's' && list[i]) setStudy(list[i].id, !inStudy(list[i].id));
    };
    show();
  }

  // ---------- Ôn tập (SRS) ----------
  function buildQueue() {
    const P = progress();
    const now = Date.now();
    const cs = cardsOf();
    if (ui.level === STUDY) {
      // Luyện danh sách Từ cần học: lấy tất cả, thẻ đến hạn / chưa học lên trước
      const rank = (c) => (!P[c.id] ? 1 : SRS.isDue(P[c.id], now) ? 0 : 2);
      return [...cs].sort((a, b) => rank(a) - rank(b));
    }
    const due = cs.filter((c) => SRS.isDue(P[c.id], now)).sort((a, b) => P[a.id].due - P[b.id].due);
    const fresh = cs.filter((c) => !P[c.id]).slice(0, newLeftToday());
    return [...due, ...fresh];
  }

  function viewReview() {
    let queue = buildQueue();
    const total = queue.length;
    const tally = [0, 0, 0, 0];
    let revealed = false;

    view.innerHTML = `
      <section class="page">
        <div class="toolbar">
          <h2>🔁 Ôn tập</h2>
          <div class="row wrap">${filterBar()}
            <select id="dir" class="select">
              <option value="zh-vi" ${settings().direction === 'zh-vi' ? 'selected' : ''}>Hán → Việt</option>
              <option value="vi-zh" ${settings().direction === 'vi-zh' ? 'selected' : ''}>Việt → Hán</option>
            </select>
          </div>
        </div>
        <div class="progress"><div id="pbar"></div></div>
        <div id="rv"></div>
      </section>`;

    bindFilter(viewReview);
    $('#dir').onchange = (e) => { settings().direction = e.target.value; Store.save(); viewReview(); };

    function finish() {
      $('#pbar').style.width = '100%';
      const done = tally.reduce((a, b) => a + b, 0);
      $('#rv').innerHTML = `
        <div class="card center done">
          <div class="big-emoji">🎉</div>
          <h3>${done ? 'Hoàn thành phiên ôn tập!' : 'Không có thẻ nào cần ôn'}</h3>
          ${done ? `<p class="muted">Quên ${tally[0]} · Khó ${tally[1]} · Được ${tally[2]} · Dễ ${tally[3]}</p>`
            : `<p class="muted">Bạn đã ôn hết thẻ đến hạn của “${esc(filterLabel())}” và đạt giới hạn ${settings().newPerDay} từ mới/ngày. Có thể đổi bộ lọc, ôn danh sách ⭐ Từ cần học, hoặc tăng giới hạn trong mục Quản lý.</p>`}
          <div class="row center"><a class="btn primary" href="#/">Về trang chủ</a><a class="btn" href="#/study">⭐ Từ cần học</a><a class="btn" href="#/write">✍️ Luyện viết</a></div>
        </div>`;
    }

    function show() {
      if (!queue.length) return finish();
      revealed = false;
      const c = queue[0];
      const p = progress()[c.id];
      const zhFirst = settings().direction === 'zh-vi';
      $('#pbar').style.width = `${(1 - queue.length / Math.max(total, queue.length)) * 100}%`;
      $('#rv').innerHTML = `
        <div class="card review-card">
          <div class="row between"><span class="badge ${p ? '' : 'new'}">${p ? 'Ôn lại' : 'Từ mới'}</span><span class="row"><span class="muted">Còn ${queue.length} thẻ</span>${starBtn(c.id)}</span></div>
          <div class="q">${zhFirst ? `<div class="hanzi xl">${esc(c.hanzi)}</div>` : `<div class="meaning lg">${esc(c.meaning)}</div>`}</div>
          <div class="a" hidden>
            ${zhFirst ? '' : `<div class="hanzi lg">${esc(c.hanzi)}</div>`}
            <div class="pinyin">${esc(c.pinyin)}</div>
            <div class="hv-big">${esc(Lexicon.wordHanViet(c.hanzi).toUpperCase())}</div>
            ${zhFirst ? `<div class="meaning">${esc(c.meaning)}</div>` : ''}
            <p class="small muted">${esc(Lexicon.explainWord(c))}</p>
            ${c.example ? `<div class="example">${esc(c.example)}</div>` : ''}
            <div class="row center">${speakBtn(c.hanzi)}<a class="btn" href="${wordLink(c)}">🔎 Chi tiết & bộ thủ</a></div>
          </div>
        </div>
        <div id="actions">
          <button id="reveal" class="btn primary wide">Hiện đáp án <kbd>Space</kbd></button>
        </div>`;
      $('#reveal').onclick = reveal;
      updateStudyUI();
    }

    function reveal() {
      if (revealed || !queue.length) return;
      revealed = true;
      const c = queue[0];
      const p = progress()[c.id];
      $('.a').hidden = false;
      if (settings().autoSpeak) speak(c.hanzi);
      const names = ['Quên', 'Khó', 'Được', 'Dễ'];
      $('#actions').innerHTML = `<div class="grade">${names.map((n, r) => `
        <button class="btn g${r}" data-r="${r}"><b>${n}</b><small>${SRS.label(p, r)}</small><kbd>${r + 1}</kbd></button>`).join('')}</div>`;
      $$('#actions [data-r]').forEach((b) => (b.onclick = () => rate(+b.dataset.r)));
    }

    function rate(r) {
      if (!revealed) return;
      const c = queue.shift();
      const wasNew = !progress()[c.id];
      progress()[c.id] = SRS.schedule(progress()[c.id], r);
      tally[r]++;
      Store.bump('reviewed');
      if (wasNew) Store.bump('newLearned');
      if (r === 0) {
        queue.splice(Math.min(queue.length, 3), 0, c);
        if (!inStudy(c.id)) setStudy(c.id, true, true);
      }
      Store.save();
      show();
    }

    keyHandler = (e) => {
      if (e.target.matches('input,select,textarea')) return;
      if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); reveal(); }
      else if (['1', '2', '3', '4'].includes(e.key)) rate(+e.key - 1);
    };
    show();
  }

  // ---------- Tập viết ----------
  function viewWrite(q) {
    const withHan = () => cardsOf().filter((c) => hanChars(c.hanzi).length);
    let list = withHan();
    let i = 0;
    let current = list[0];
    const w = q.get('w');
    if (w) {
      const k = list.findIndex((c) => c.hanzi === w);
      if (k >= 0) { i = k; current = list[k]; }
      else current = allCards().find((c) => c.hanzi === w) || { hanzi: w, pinyin: '', meaning: '' };
    }
    let writers = [];
    let outline = true;

    view.innerHTML = `
      <section class="page">
        <div class="toolbar">
          <h2>✍️ Tập viết</h2>
          <div class="row wrap">${filterBar()}
            <form id="free" class="row"><input id="freeInput" class="input short" placeholder="Nhập chữ bất kỳ…" maxlength="8"><button class="btn">Luyện</button></form>
          </div>
        </div>
        <div class="card write-card">
          <div class="row between">
            <button id="prev" class="btn">←</button>
            <div class="center">
              <div class="pinyin" id="wPinyin"></div>
              <div class="meaning" id="wMeaning"></div>
            </div>
            <button id="next" class="btn">→</button>
          </div>
          <div id="boxes" class="boxes"></div>
          <div id="status" class="status muted"></div>
          <div class="row center wrap">
            <label class="switch"><input type="checkbox" id="outline" checked> Hiện nét mờ</label>
            <button id="demo" class="btn">▶ Xem mẫu</button>
            <button id="retry" class="btn">↺ Viết lại</button>
            <button id="rand" class="btn">🎲 Ngẫu nhiên</button>
            <span id="extra" class="row"></span>
          </div>
        </div>
      </section>`;

    const IDLE = 'Viết từng nét theo đúng thứ tự vào ô. Sai 3 lần sẽ có gợi ý.';

    function mount() {
      writers.forEach((wr) => { try { wr.cancelQuiz(); } catch { /* chưa tải xong */ } });
      const boxes = $('#boxes');
      boxes.innerHTML = '';
      $('#wPinyin').textContent = current?.pinyin || '';
      $('#wMeaning').textContent = current?.meaning || '';
      $('#extra').innerHTML = current ? speakBtn(current.hanzi) + (current.id ? starBtn(current.id) + `<a class="btn" href="${wordLink(current)}">🔎</a>` : '') : '';
      updateStudyUI();
      const chars = hanChars(current?.hanzi);
      if (!chars.length) { boxes.innerHTML = '<p class="muted">Không có chữ Hán để luyện với bộ lọc này.</p>'; writers = []; return; }

      const size = Math.min(chars.length > 1 ? 220 : 280, window.innerWidth - 72);
      const results = new Array(chars.length).fill(null);
      const status = $('#status');
      status.className = 'status muted';
      status.textContent = IDLE;

      writers = chars.map((ch, idx) => {
        const el = document.createElement('div');
        el.className = 'hz-box';
        el.style.width = el.style.height = size + 'px';
        boxes.append(el);
        const wr = HanziWriter.create(el, ch, {
          width: size, height: size, padding: 10,
          showOutline: outline, showCharacter: false,
          showHintAfterMisses: 3, highlightOnComplete: true,
          drawingWidth: Math.round(size / 12),
          ...writerColors(),
          onLoadCharDataError: () => { el.classList.add('err'); el.textContent = `Không tải được dữ liệu chữ ${ch}`; },
        });
        wr.quiz({
          onMistake: (d) => { status.className = 'status bad'; status.textContent = `Chưa đúng nét ${d.strokeNum + 1} của chữ ${d.character} — thử lại nhé`; },
          onCorrectStroke: (d) => { status.className = 'status muted'; status.textContent = `Chữ ${d.character}: còn ${d.strokesRemaining} nét`; },
          onComplete: (d) => {
            results[idx] = d.totalMistakes;
            if (results.every((r) => r !== null)) {
              const miss = results.reduce((a, b) => a + b, 0);
              status.className = 'status good';
              status.textContent = miss === 0 ? '🎉 Hoàn hảo! Không sai nét nào.' : `✅ Hoàn thành! Sai ${miss} nét.`;
              if (miss >= 3 && current.id && !inStudy(current.id)) {
                setStudy(current.id, true, true);
                status.textContent += ' Đã thêm vào ⭐ Từ cần học để luyện thêm.';
              }
              Store.bump('written');
              if (settings().autoSpeak) speak(current.hanzi);
            }
          },
        });
        return wr;
      });
    }

    async function demo() {
      for (const wr of writers) { wr.cancelQuiz(); wr.hideCharacter(); }
      for (const wr of writers) await new Promise((r) => wr.animateCharacter({ onComplete: r }));
      setTimeout(mount, 700);
    }

    const go = (d) => { if (list.length) { i = (i + d + list.length) % list.length; current = list[i]; mount(); } };
    $('#prev').onclick = () => go(-1);
    $('#next').onclick = () => go(1);
    $('#rand').onclick = () => { if (list.length) { i = Math.floor(Math.random() * list.length); current = list[i]; mount(); } };
    $('#retry').onclick = mount;
    $('#demo').onclick = demo;
    $('#outline').onchange = (e) => { outline = e.target.checked; writers.forEach((wr) => (outline ? wr.showOutline() : wr.hideOutline())); };
    bindFilter(() => { list = withHan(); i = 0; current = list[0]; mount(); });
    $('#free').onsubmit = (e) => {
      e.preventDefault();
      const v = $('#freeInput').value.trim();
      if (!hanChars(v).length) return toast('Hãy nhập chữ Hán');
      current = allCards().find((c) => c.hanzi === v) || { hanzi: v, pinyin: '', meaning: '' };
      mount();
    };
    mount();
  }

  // ---------- Viết mẫu ----------
  function viewGuide(q) {
    let text = q.get('c') || '你好';
    let selected = hanChars(text)[0];
    let speed = 1;
    let writer = null;
    let paused = false;

    view.innerHTML = `
      <section class="page">
        <div class="toolbar">
          <h2>📖 Hướng dẫn viết mẫu</h2>
          <form id="search" class="row"><input id="q" class="input" value="${esc(text)}" placeholder="Nhập chữ Hán…" maxlength="12"><button class="btn primary">Xem</button></form>
        </div>
        <div id="chips" class="chips"></div>
        <div class="guide">
          <div class="card center">
            <div id="big" class="hz-box big"></div>
            <div class="row center wrap">
              <button id="play" class="btn primary">▶ Phát</button>
              <button id="loop" class="btn">🔁 Lặp lại</button>
              <button id="pause" class="btn">⏸ Tạm dừng</button>
              <label class="row small">Tốc độ <input id="speed" type="range" min="0.25" max="3" step="0.25" value="1"></label>
            </div>
            <p id="strokeCount" class="muted"></p>
          </div>
          <div class="card" id="info"></div>
        </div>
        <div class="card">
          <h3>Thứ tự từng nét</h3>
          <div id="fan" class="fan"></div>
        </div>
        <div class="two">
          <div class="card">
            <h3>8 nét cơ bản</h3>
            <div class="strokes">${BASIC_STROKES.map(([s, n, vi, d]) => `<div class="stroke"><span class="hanzi">${s}</span><b>${vi}</b><small>${n}</small><small class="muted">${d}</small></div>`).join('')}</div>
          </div>
          <div class="card">
            <h3>Quy tắc bút thuận</h3>
            <ol class="rules">${STROKE_RULES.map(([vi, zh, ex]) => `<li><b>${vi}</b> <span class="muted">${zh}</span> <a href="#/guide?c=${encodeURIComponent(ex)}" class="ex">${ex}</a></li>`).join('')}</ol>
          </div>
        </div>
      </section>`;

    function renderChips() {
      $('#chips').innerHTML = hanChars(text).map((ch) => `<button class="chip ${ch === selected ? 'on' : ''}" data-ch="${ch}">${ch}</button>`).join('');
      $$('#chips .chip').forEach((b) => (b.onclick = () => { selected = b.dataset.ch; renderChips(); renderChar(); }));
    }

    function renderInfo(ch) {
      const card = allCards().find((c) => c.hanzi === ch);
      const words = allCards().filter((c) => c.hanzi !== ch && c.hanzi.includes(ch)).slice(0, 8);
      $('#info').innerHTML = `
        ${charAnalysisHTML(Lexicon.analyzeChar(ch), false)}
        <div class="row wrap">${speakBtn(ch)}${card ? starBtn(card.id) + `<a class="btn" href="${wordLink(card)}">🔎 Chi tiết từ</a>` : ''}<a class="btn" href="#/write?w=${encodeURIComponent(ch)}">✍️ Luyện viết</a></div>
        ${words.length ? `<h4>Từ có chứa chữ này</h4><div class="words">${words.map((c) => `<a href="${wordLink(c)}" class="word"><span class="hanzi">${esc(c.hanzi)}</span><small>${esc(c.pinyin)} · ${esc(c.meaning)}</small></a>`).join('')}</div>` : ''}`;
      updateStudyUI();
    }

    function renderFan(data) {
      const fan = $('#fan');
      fan.innerHTML = '';
      const S = 84;
      const NS = 'http://www.w3.org/2000/svg';
      const { transform } = HanziWriter.getScalingTransform(S, S, 6);
      data.strokes.forEach((_, i) => {
        const box = document.createElement('div');
        box.className = 'fan-item';
        const svg = document.createElementNS(NS, 'svg');
        svg.setAttribute('width', S);
        svg.setAttribute('height', S);
        svg.classList.add('hz-mini');
        const g = document.createElementNS(NS, 'g');
        g.setAttribute('transform', transform);
        data.strokes.slice(0, i + 1).forEach((d, j) => {
          const path = document.createElementNS(NS, 'path');
          path.setAttribute('d', d);
          path.setAttribute('class', j === i ? 'cur' : 'prev');
          g.append(path);
        });
        svg.append(g);
        const lbl = document.createElement('small');
        lbl.textContent = i + 1;
        box.append(svg, lbl);
        fan.append(box);
      });
    }

    function renderChar() {
      if (!selected) { $('#big').innerHTML = '<p class="muted">Nhập chữ Hán để xem</p>'; return; }
      paused = false;
      $('#pause').textContent = '⏸ Tạm dừng';
      $('#big').innerHTML = '';
      $('#fan').innerHTML = '<p class="muted">Đang tải…</p>';
      $('#strokeCount').textContent = '';
      renderInfo(selected);
      const size = Math.min(300, window.innerWidth - 80);
      $('#big').style.width = $('#big').style.height = size + 'px';
      const ch = selected;
      writer = HanziWriter.create('big', ch, {
        width: size, height: size, padding: 12,
        showOutline: true, strokeAnimationSpeed: speed, delayBetweenStrokes: 300 / speed,
        ...writerColors(),
        onLoadCharDataSuccess: (data) => { $('#strokeCount').textContent = `Số nét: ${data.strokes.length}`; renderFan(data); },
        onLoadCharDataError: () => { $('#fan').innerHTML = `<p class="bad">Không có dữ liệu nét cho chữ ${esc(ch)}.</p>`; },
      });
      setTimeout(() => { if (selected === ch) writer.animateCharacter(); }, 400);
    }

    const resetPause = () => { paused = false; $('#pause').textContent = '⏸ Tạm dừng'; };
    $('#play').onclick = () => { resetPause(); writer?.animateCharacter(); };
    $('#loop').onclick = () => { resetPause(); writer?.loopCharacterAnimation(); };
    $('#pause').onclick = () => {
      if (!writer) return;
      paused = !paused;
      paused ? writer.pauseAnimation() : writer.resumeAnimation();
      $('#pause').textContent = paused ? '▶ Tiếp tục' : '⏸ Tạm dừng';
    };
    $('#speed').onchange = (e) => { speed = +e.target.value; renderChar(); };
    $('#search').onsubmit = (e) => {
      e.preventDefault();
      const v = $('#q').value.trim();
      if (!hanChars(v).length) return toast('Hãy nhập chữ Hán');
      text = v;
      selected = hanChars(v)[0];
      history.replaceState(null, '', `#/guide?c=${encodeURIComponent(v)}`);
      renderChips();
      renderChar();
    };
    renderChips();
    renderChar();
  }

  // ---------- Quản lý: bộ thẻ, thẻ tự thêm, cài đặt ----------
  function viewDecks() {
    const st = settings();
    view.innerHTML = `
      <section class="page">
        <div class="toolbar"><h2>⚙️ Quản lý</h2></div>
        <div class="deck-grid">
          ${deckList().map(([d]) => {
            const s = deckStats({ level: d });
            const pct = s.total ? Math.round((s.learned / s.total) * 100) : 0;
            return `<div class="card deck">
              <h3>${esc(d)}</h3>
              <p class="muted">${s.total} thẻ · đã học ${s.learned} · thuộc ${s.mastered} · đến hạn ${s.due}</p>
              <div class="progress"><div style="width:${pct}%"></div></div>
              <div class="row"><a class="btn" href="#/vocab" data-deck="${esc(d)}">📚 Xem</a><a class="btn" href="#/flashcards" data-deck="${esc(d)}">🃏 Học</a><a class="btn" href="#/review" data-deck="${esc(d)}">🔁 Ôn</a></div>
            </div>`;
          }).join('')}
        </div>

        <div class="two">
          <div class="card">
            <h3>➕ Thêm từ của riêng bạn</h3>
            <form id="add" class="form">
              <label>Chữ Hán (giản thể) *<input name="hanzi" class="input" required placeholder="例如：学习"></label>
              <label>Pinyin<input name="pinyin" class="input" placeholder="xuéxí"></label>
              <label>Nghĩa *<input name="meaning" class="input" required placeholder="học tập"></label>
              <label>Giải thích thêm<input name="note" class="input" placeholder="Cách dùng, mẹo nhớ…"></label>
              <label>Câu ví dụ<input name="example" class="input" placeholder="我在学习汉语。"></label>
              <label>Chủ đề
                <select name="topic" class="select"><option value="">(Không)</option>${Object.entries(TOPICS).map(([k, t]) => `<option value="${k}">${t.icon} ${t.name}</option>`).join('')}</select></label>
              <label>Bộ thẻ<input name="deck" class="input" list="deckNames" value="Của tôi"></label>
              <datalist id="deckNames">${deckList().map(([d]) => `<option value="${esc(d)}">`).join('')}</datalist>
              <label class="switch"><input type="checkbox" name="star" checked> Thêm vào ⭐ Từ cần học</label>
              <button class="btn primary">Thêm từ</button>
            </form>
          </div>
          <div class="card">
            <h3>Cài đặt</h3>
            <form id="settings" class="form">
              <label>Số từ mới mỗi ngày<input name="newPerDay" type="number" min="0" max="200" class="input" value="${st.newPerDay}"></label>
              <label>Chiều ôn tập
                <select name="direction" class="select">
                  <option value="zh-vi" ${st.direction === 'zh-vi' ? 'selected' : ''}>Hán → Việt</option>
                  <option value="vi-zh" ${st.direction === 'vi-zh' ? 'selected' : ''}>Việt → Hán</option>
                </select></label>
              <label class="switch"><input type="checkbox" name="autoSpeak" ${st.autoSpeak ? 'checked' : ''}> Tự động phát âm</label>
              <button class="btn primary">Lưu cài đặt</button>
            </form>
            <h3>💾 Dữ liệu</h3>
            <div class="row wrap">
              <button id="export" class="btn">⬇ Xuất JSON</button>
              <label class="btn">⬆ Nhập JSON<input id="import" type="file" accept="application/json" hidden></label>
              <button id="reset" class="btn danger">Xóa tiến độ</button>
            </div>
          </div>
        </div>

        <div class="card">
          <h3>Từ bạn đã thêm (${Store.state.custom.length})</h3>
          ${Store.state.custom.length ? `<table class="table"><thead><tr><th>Chữ</th><th>Pinyin</th><th>Nghĩa</th><th>Bộ</th><th></th></tr></thead><tbody>
            ${Store.state.custom.map((c) => `<tr><td class="hanzi"><a href="${wordLink(c)}">${esc(c.hanzi)}</a></td><td>${esc(c.pinyin)}</td><td>${esc(c.meaning)}</td><td>${esc(c.deck)}</td><td><button class="btn icon danger" data-del="${esc(c.id)}" title="Xóa">🗑</button></td></tr>`).join('')}
          </tbody></table>` : '<p class="muted">Chưa có từ nào. Hãy thêm từ vựng của riêng bạn ở trên.</p>'}
        </div>
      </section>`;

    $$('[data-deck]').forEach((a) => a.addEventListener('click', () => { ui.level = a.dataset.deck; ui.topic = ''; }));

    $('#add').onsubmit = (e) => {
      e.preventDefault();
      const f = Object.fromEntries(new FormData(e.target));
      const hanzi = f.hanzi.trim();
      if (!hanChars(hanzi).length) return toast('Chữ Hán không hợp lệ');
      const card = {
        id: 'c:' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
        hanzi, pinyin: f.pinyin.trim(), meaning: f.meaning.trim(), note: f.note.trim(), example: f.example.trim(),
        topic: f.topic, deck: f.deck.trim() || 'Của tôi',
      };
      Store.state.custom.push(card);
      if (f.star) Store.state.study[card.id] = Date.now();
      Store.save();
      refreshIndex();
      updateStudyUI();
      toast(`Đã thêm “${hanzi}”`);
      viewDecks();
    };

    $('#settings').onsubmit = (e) => {
      e.preventDefault();
      const f = new FormData(e.target);
      st.newPerDay = Math.max(0, Math.min(200, parseInt(f.get('newPerDay'), 10) || 0));
      st.direction = f.get('direction');
      st.autoSpeak = f.get('autoSpeak') === 'on';
      Store.save();
      toast('Đã lưu cài đặt');
    };

    $$('[data-del]').forEach((b) => (b.onclick = () => {
      const c = Store.state.custom.find((x) => x.id === b.dataset.del);
      if (!c || !confirm(`Xóa từ “${c.hanzi}”?`)) return;
      Store.state.custom = Store.state.custom.filter((x) => x.id !== c.id);
      delete progress()[c.id];
      delete study()[c.id];
      Store.save();
      refreshIndex();
      updateStudyUI();
      viewDecks();
    }));

    $('#export').onclick = () => {
      const blob = new Blob([JSON.stringify(Store.state, null, 2)], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `tanaapp-${Store.today()}.json`;
      a.click();
      URL.revokeObjectURL(a.href);
    };

    $('#import').onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      try {
        const data = JSON.parse(await file.text());
        if (typeof data !== 'object' || !data) throw new Error('invalid');
        Store.replace(data);
        refreshIndex();
        updateStudyUI();
        toast('Đã nhập dữ liệu');
        viewDecks();
      } catch {
        toast('File không hợp lệ');
      }
    };

    $('#reset').onclick = () => {
      if (!confirm('Xóa toàn bộ tiến độ học và lịch sử? Từ tự thêm và Từ cần học vẫn được giữ lại.')) return;
      Store.resetProgress();
      toast('Đã xóa tiến độ');
      viewDecks();
    };
  }

  // ---------- Router ----------
  const routes = {
    '': viewHome, vocab: viewVocab, word: viewWord, grammar: viewGrammar, study: viewStudy,
    flashcards: viewFlashcards, review: viewReview, write: viewWrite, guide: viewGuide, decks: viewDecks,
  };
  const navOf = { word: 'vocab' };

  function render() {
    keyHandler = null;
    if ('speechSynthesis' in window) speechSynthesis.cancel();
    const [path, query] = location.hash.replace(/^#\/?/, '').split('?');
    const route = routes[path] ? path : '';
    $$('.nav a').forEach((a) => a.classList.toggle('active', a.dataset.route === (navOf[route] ?? route)));
    routes[route](new URLSearchParams(query || ''));
    updateStudyUI();
    window.scrollTo(0, 0);
  }

  document.addEventListener('keydown', (e) => keyHandler && keyHandler(e));
  document.addEventListener('click', (e) => {
    const sp = e.target.closest('[data-speak]');
    if (sp) { e.stopPropagation(); speak(sp.dataset.speak); return; }
    const st = e.target.closest('[data-star]');
    if (st) { e.stopPropagation(); e.preventDefault(); setStudy(st.dataset.star, !inStudy(st.dataset.star)); }
  }, true);
  window.addEventListener('hashchange', render);
  if ('speechSynthesis' in window) speechSynthesis.getVoices();
  refreshIndex();
  render();
})();
