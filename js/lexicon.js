// Phân tích chữ Hán: âm Hán Việt, bộ thủ, cấu tạo, giải thích nghĩa, từ liên quan
const Lexicon = (() => {
  const isHan = (ch) => /\p{Script=Han}/u.test(ch);
  const hanChars = (s) => [...(s || '')].filter(isHan);
  const firstDef = (d) => (d || '').split(/[;,]/)[0].trim();
  const TYPE_NAMES = { pictographic: 'Tượng hình', ideographic: 'Hội ý', pictophonetic: 'Hình thanh' };

  let index = null; // chữ đơn -> thẻ, chữ -> danh sách thẻ chứa nó
  function buildIndex(cards) {
    const single = new Map();
    const byChar = new Map();
    for (const c of cards) {
      const chars = hanChars(c.hanzi);
      // Chữ đứng một mình, hoặc lặp lại như 妈妈 / 爸爸
      const solo = chars.length && chars.every((ch) => ch === chars[0]);
      if (solo && (!single.has(chars[0]) || chars.length === 1)) single.set(chars[0], c);
      for (const ch of new Set(chars)) {
        if (!byChar.has(ch)) byChar.set(ch, []);
        byChar.get(ch).push(c);
      }
    }
    index = { single, byChar };
  }

  const hanViet = (ch) => HANVIET[ch] || '';
  const wordHanViet = (w) => hanChars(w).map((ch) => hanViet(ch) || '?').join(' ');

  // Nghĩa tiếng Việt của một chữ (nếu chữ đó có thẻ riêng), không thì dùng nghĩa tiếng Anh
  function charMeaning(ch) {
    const card = index?.single.get(ch);
    if (card) return { text: card.meaning, lang: 'vi' };
    const info = CHARS[ch];
    return info ? { text: firstDef(info.d), lang: 'en' } : { text: '', lang: 'vi' };
  }

  // Mô tả ngắn một thành phần
  function component(ch) {
    const rad = RADICALS[ch];
    const info = CHARS[ch];
    return {
      ch,
      radical: rad ? { name: rad[0], meaning: rad[1] } : null,
      hv: hanViet(ch),
      pinyin: info?.p || '',
      en: info ? firstDef(info.d) : '',
    };
  }

  function describe(ch) {
    const c = component(ch);
    if (c.radical) return `bộ ${c.radical.name} ${ch} (${c.radical.meaning})`;
    const bits = [c.hv && c.hv.toUpperCase(), c.pinyin, c.en && `“${c.en}”`].filter(Boolean);
    return bits.length ? `${ch} (${bits.join(', ')})` : ch;
  }

  // Phân tích cấu tạo một chữ
  function analyzeChar(ch) {
    const info = CHARS[ch] || {};
    const parts = [...(info.c || '')].filter((p) => p !== ch);
    const type = info.t || '';
    let summary = '';
    if (type === 'pictophonetic' && info.s && info.ph) {
      summary = `Chữ hình thanh: ${describe(info.s)} biểu thị nghĩa, ${describe(info.ph)} biểu thị âm đọc.`;
    } else if (type === 'pictophonetic' && info.s) {
      summary = `Chữ hình thanh: ${describe(info.s)} biểu thị nghĩa.`;
    } else if (type === 'ideographic') {
      summary = parts.length ? `Chữ hội ý: ghép ${parts.map(describe).join(' + ')} để gợi nghĩa.` : 'Chữ hội ý.';
    } else if (type === 'pictographic') {
      summary = 'Chữ tượng hình: mô phỏng hình dáng của sự vật.';
    } else if (parts.length) {
      summary = `Gồm các thành phần: ${parts.map(describe).join(' + ')}.`;
    }
    return {
      ch,
      hv: hanViet(ch),
      pinyin: info.p || '',
      en: info.d || '',
      meaning: charMeaning(ch),
      radical: info.r ? component(info.r) : null,
      type: TYPE_NAMES[type] || '',
      parts: parts.map(component),
      semantic: info.s || '',
      phonetic: info.ph || '',
      summary,
      hint: info.h || '',
    };
  }

  // Giải thích nghĩa của cả từ
  function explainWord(card) {
    const chars = hanChars(card.hanzi);
    const hv = wordHanViet(card.hanzi);
    if (chars.length <= 1) {
      const a = chars[0] ? analyzeChar(chars[0]) : null;
      return `Âm Hán Việt: ${hv.toUpperCase() || '—'}. “${card.hanzi}” nghĩa là ${card.meaning}.` +
        (a?.en ? ` Các nghĩa khác (EN): ${a.en}.` : '');
    }
    const pieces = chars.map((ch) => {
      const m = charMeaning(ch);
      const h = hanViet(ch);
      return `${ch} (${[h, m.text && (m.lang === 'en' ? `“${m.text}”` : m.text)].filter(Boolean).join(': ')})`;
    });
    const same = chars.every((ch) => ch === chars[0]);
    return `Âm Hán Việt: ${hv.toUpperCase()}. ` +
      (same ? `Lặp lại chữ ${pieces[0]}` : `Ghép từ ${pieces.join(' + ')}`) +
      ` → ${card.meaning}.`;
  }

  // Từ đi kèm: các từ khác chứa chữ trong từ này
  function relatedWords(card, limit = 16) {
    const seen = new Set([card.id]);
    const out = [];
    for (const ch of new Set(hanChars(card.hanzi))) {
      for (const c of index?.byChar.get(ch) || []) {
        if (seen.has(c.id) || c.hanzi === card.hanzi) continue;
        seen.add(c.id);
        out.push({ via: ch, card: c });
      }
    }
    return out.slice(0, limit);
  }

  return { isHan, hanChars, buildIndex, hanViet, wordHanViet, analyzeChar, explainWord, relatedWords, component };
})();
