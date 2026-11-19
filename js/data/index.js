// Gom từ vựng các cấp thành danh sách thẻ
const LEVELS = Object.keys(HSK).map(Number).sort((a, b) => a - b);

const BUILTIN_CARDS = LEVELS.flatMap((lv) => HSK[lv].map(([hanzi, pinyin, meaning, topic]) => ({
  id: `hsk${lv}:${hanzi}`,
  deck: `HSK ${lv}`,
  level: lv,
  hanzi,
  pinyin,
  meaning,
  topic,
  builtin: true,
})));
