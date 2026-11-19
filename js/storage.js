// Lưu trữ tiến độ học trong localStorage
const Store = (() => {
  const KEY = 'tanaapp.v1';

  const defaults = () => ({
    progress: {},   // cardId -> trạng thái SRS
    custom: [],     // thẻ do người dùng thêm
    study: {},      // "Từ cần học": cardId -> thời điểm thêm
    settings: { newPerDay: 10, direction: 'zh-vi', autoSpeak: true },
    log: {},        // 'YYYY-MM-DD' -> { reviewed, newLearned, written }
  });

  function normalize(raw) {
    const d = defaults();
    const s = Object.assign(d, raw || {});
    s.settings = Object.assign(defaults().settings, s.settings);
    return s;
  }

  let state;
  try {
    state = normalize(JSON.parse(localStorage.getItem(KEY) || '{}'));
  } catch {
    state = defaults();
  }

  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* bộ nhớ không khả dụng */ }
  }

  function today(d = new Date()) {
    const z = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())}`;
  }

  function todayLog() {
    return state.log[today()] || { reviewed: 0, newLearned: 0, written: 0 };
  }

  function bump(field, n = 1) {
    const k = today();
    const entry = (state.log[k] ||= { reviewed: 0, newLearned: 0, written: 0 });
    entry[field] = (entry[field] || 0) + n;
    save();
  }

  return {
    get state() { return state; },
    save,
    today,
    todayLog,
    bump,
    replace(raw) { state = normalize(raw); save(); },
    resetProgress() { state.progress = {}; state.log = {}; save(); },
  };
})();
