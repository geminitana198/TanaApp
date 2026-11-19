// Chủ đề từ vựng và kho dữ liệu dùng chung
const TOPICS = {
  so: { name: 'Số đếm & lượng từ', icon: '🔢' },
  gd: { name: 'Gia đình & con người', icon: '👨‍👩‍👧' },
  tg: { name: 'Thời gian & ngày tháng', icon: '🕒' },
  au: { name: 'Ăn uống', icon: '🍜' },
  ms: { name: 'Mua sắm & tiền bạc', icon: '🛍️' },
  th: { name: 'Trường học & công việc', icon: '🏫' },
  dl: { name: 'Đi lại & địa điểm', icon: '🚆' },
  nc: { name: 'Nhà cửa & đồ dùng', icon: '🏠' },
  tt: { name: 'Thời tiết & thiên nhiên', icon: '🌤️' },
  sk: { name: 'Sức khỏe & cơ thể', icon: '🩺' },
  tc: { name: 'Tính chất & màu sắc', icon: '🎨' },
  cx: { name: 'Cảm xúc & suy nghĩ', icon: '💗' },
  hd: { name: 'Hoạt động & sở thích', icon: '⚽' },
  gt: { name: 'Giao tiếp & chào hỏi', icon: '💬' },
  cn: { name: 'Đại từ, phó từ & trợ từ', icon: '🧩' },
};

// HSK[cấp] = [[Hán tự, pinyin, nghĩa, mã chủ đề], ...]
const HSK = {};
