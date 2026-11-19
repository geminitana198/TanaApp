// 8 nét cơ bản: [nét, tên Trung, tên Việt, cách viết]
const BASIC_STROKES = [
  ['一', 'Héng 横', 'Nét ngang', 'Viết từ trái sang phải'],
  ['丨', 'Shù 竖', 'Nét sổ', 'Viết từ trên xuống dưới'],
  ['丿', 'Piě 撇', 'Nét phẩy', 'Cong từ phải trên xuống trái dưới'],
  ['㇏', 'Nà 捺', 'Nét mác', 'Từ trái trên xuống phải dưới'],
  ['丶', 'Diǎn 点', 'Nét chấm', 'Chấm ngắn từ trên xuống'],
  ['㇀', 'Tí 提', 'Nét hất', 'Hất từ trái dưới lên phải trên'],
  ['㇕', 'Zhé 折', 'Nét gập', 'Ngang rồi gập xuống'],
  ['㇚', 'Gōu 钩', 'Nét móc', 'Kết thúc bằng một móc nhỏ'],
];

// Quy tắc bút thuận: [tiếng Việt, tiếng Trung, chữ ví dụ]
const STROKE_RULES = [
  ['Ngang trước, sổ sau', '先横后竖', '十'],
  ['Phẩy trước, mác sau', '先撇后捺', '人'],
  ['Trên trước, dưới sau', '从上到下', '三'],
  ['Trái trước, phải sau', '从左到右', '你'],
  ['Ngoài trước, trong sau', '从外到内', '月'],
  ['Vào trước, đóng sau', '先里头后封口', '回'],
  ['Giữa trước, hai bên sau', '先中间后两边', '小'],
];
