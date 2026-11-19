# TanaApp – Học tiếng Trung

Ứng dụng web học tiếng Trung cho người Việt: học từ vựng theo cấp HSK và chủ đề, ôn tập bằng lặp lại ngắt quãng, xem ngữ pháp, phân tích bộ thủ, tập viết và xem viết mẫu từng nét.

## Tính năng

| Mục | Mô tả |
| --- | --- |
| 📚 **Từ vựng** | ~580 từ HSK 1–3 (giản thể + pinyin + âm Hán Việt + nghĩa), lọc theo cấp độ và 15 chủ đề, tìm theo Hán tự / pinyin / nghĩa / Hán Việt |
| 🔎 **Chi tiết từ** | Giải thích nghĩa (ghép từ các chữ), cấu tạo từng chữ: bộ thủ, loại chữ (tượng hình / hội ý / hình thanh), thành phần chỉ nghĩa – chỉ âm, câu ví dụ và các từ đi kèm |
| 📝 **Ngữ pháp** | 45 điểm ngữ pháp HSK 1–3: cấu trúc, giải thích, ví dụ có pinyin và nghĩa, chế độ ẩn nghĩa để tự kiểm tra |
| ⭐ **Từ cần học** | Danh sách riêng: nhấn ☆ ở bất kỳ đâu để thêm; từ đánh “Quên” khi ôn hoặc viết sai ≥ 3 nét được tự động thêm. Có thể ôn, lật thẻ, tập viết riêng danh sách này |
| 🃏 **Flashcard** | Lật thẻ, nghe phát âm, lọc theo cấp / chủ đề / Từ cần học |
| 🔁 **Ôn tập** | Lặp lại ngắt quãng (biến thể SM-2) với 4 mức Quên / Khó / Được / Dễ, giới hạn từ mới mỗi ngày, chiều Hán → Việt hoặc Việt → Hán |
| ✍️ **Tập viết** | Viết từng nét vào ô 米字格, được chấm đúng sai, gợi ý sau 3 lần sai, xem mẫu |
| 📖 **Viết mẫu** | Hoạt ảnh thứ tự nét (phát / lặp / tạm dừng / tốc độ), sơ đồ từng nét, 8 nét cơ bản và quy tắc bút thuận |
| ⚙️ **Quản lý** | Thêm từ của riêng bạn, cài đặt, xuất / nhập dữ liệu JSON |

Tiến độ được lưu trong `localStorage` của trình duyệt.

## Chạy ứng dụng

Không cần cài đặt hay build. Chỉ cần một web server tĩnh:

```bash
python3 -m http.server 5173
```

Rồi mở <http://localhost:5173>. Cần có mạng để tải thư viện Hanzi Writer và dữ liệu nét chữ từ CDN.

## Cấu trúc

```
index.html
css/style.css
js/
  data/
    topics.js      Danh sách chủ đề
    hsk1..3.js     Từ vựng: [Hán tự, pinyin, nghĩa, mã chủ đề]
    index.js       Gom từ vựng thành thẻ
    grammar.js     Ngữ pháp theo cấp
    radicals.js    Bộ thủ: tên Hán Việt + ý nghĩa
    hanviet.js     Âm Hán Việt của từng chữ
    chars.js       Cấu tạo chữ (tự sinh, không sửa tay)
    writing.js     Nét cơ bản, quy tắc bút thuận
  lexicon.js       Phân tích chữ, giải thích nghĩa, từ đi kèm
  storage.js       Lưu trữ localStorage
  srs.js           Thuật toán lặp lại ngắt quãng
  app.js           Giao diện và điều hướng
tools/build-chars.mjs  Sinh js/data/chars.js
```

### Thêm từ vựng

Thêm dòng vào `js/data/hskN.js`, sau đó sinh lại dữ liệu cấu tạo chữ:

```bash
curl -L -o /tmp/dictionary.txt https://raw.githubusercontent.com/skishore/makemeahanzi/master/dictionary.txt
node tools/build-chars.mjs /tmp/dictionary.txt
```

Nếu có chữ mới, bổ sung âm Hán Việt vào `js/data/hanviet.js`.

## Nguồn dữ liệu

- [Hanzi Writer](https://hanziwriter.org) (MIT) – hoạt ảnh nét chữ và chấm điểm tập viết.
- [Make Me a Hanzi](https://github.com/skishore/makemeahanzi) – dữ liệu cấu tạo chữ, bộ thủ, từ nguyên (`js/data/chars.js`), theo giấy phép của dự án gốc.
