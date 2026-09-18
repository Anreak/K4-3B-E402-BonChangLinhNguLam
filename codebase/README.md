# Hướng Dẫn Chạy Prototype (Run Guide)

Prototype VLearn AI Tutor hỗ trợ 2 chế độ: **chấm nhanh 1 phút (offline)** và **hỏi đáp AI thật (online)**.

---

## Chế độ 1: Xem nhanh kịch bản (Offline — 1 phút)
*Dành cho giám khảo/TA chấm nhanh luồng tương tác, không cần mạng hay API key.*

1. Mở file [`index.html`](index.html) trực tiếp trên trình duyệt web.
2. Bấm nút **"Bắt đầu học ➔"** trên thanh điều hướng để duyệt 4 bước kịch bản:
   - **Bước 1 (Happy Path):** Trả lời trúng bài kèm nhãn `[Trang 7]`; slide tự trượt và highlight đoạn nguồn.
   - **Bước 2 (Đối chiếu):** Slide lật sang Trang 5 làm rõ cơ chế Self-Attention.
   - **Bước 3 (HAX G10):** Câu hỏi mơ hồ *"Cái này dùng làm gì?"* ➔ hiển thị 2 lựa chọn thu hẹp phạm vi.
   - **Bước 4 (PAIR Failure):** Hỏi ngoài bài (lịch thi) ➔ từ chối an toàn kèm nút chuyển TA Discord.
3. Click nhãn `[Trang N]` hoặc nút *"🔍 Xem nguồn"* để mở popover trích dẫn nguyên văn (HAX G11).

---

## Chế độ 2: Chat tự do với AI thật (Chạy Localhost)

### 1. Khởi chạy Worker cục bộ (Wrangler Dev)

Không cần tài khoản hay deploy lên Cloudflare, bạn có thể chạy Worker giả lập trực tiếp trên máy:

1. Di chuyển vào thư mục `worker` và tạo file `.dev.vars` để lưu khóa bí mật:
```bash
cd codebase/worker
echo OPENROUTER_API_KEY=sk-or-v1-your-api-key-here > .dev.vars

```


*(Thay `sk-or-v1-your-api-key-here` bằng API key OpenRouter hợp lệ).*
2. Khởi chạy Worker ở chế độ phát triển nội bộ:
```bash
npx wrangler dev

```


Sau khi nạp xong, terminal sẽ báo Worker đang lắng nghe tại:
`Ready on http://localhost:8787`
*(Giữ nguyên cửa sổ terminal này để Worker duy trì hoạt động).*

---

### 2. Cấu hình `config.js`

1. Sao chép file cấu hình mẫu (nếu chưa có sẵn `config.js`):
```bash
cp config.example.js config.js

```


2. Mở file `config.js` (nằm cùng cấp với `index.html`) và trỏ URL về cổng local của Worker:
```javascript
const WORKER_URL = "http://localhost:8787";

```


*(Worker proxy chạy ở cổng 8787 tự động xử lý CORS, che API key phía sau và định tuyến prompt tới model).*

---

### 3. Thử nghiệm & Xuất minh chứng

1. Mở file `index.html` bằng trình duyệt (nhấp đúp chuột hoặc mở qua tiện ích Live Server trong VS Code).
2. Nhập câu hỏi bất kỳ vào ô chat (hoặc bấm chọn các chip prompt gợi ý) rồi chọn **"Gửi"**. Worker local sẽ trả về phản hồi theo đúng 3 cấu trúc JSON (`ANSWER_WITH_CITE`, `CLARIFY`, `OUT_OF_SCOPE`).
3. Bấm **"⬇️ Tải trace log"** ở góc trên bên phải khung chat để lưu file `trace-log.json` làm tài liệu minh chứng kiểm thử.
---

## 📂 Cấu trúc thư mục

| Tệp / Thư mục | Vai trò |
|---|---|
| [`index.html`](index.html) | Giao diện tương tác 2 cột: Slide Carousel + Chat AI Tutor |
| [`config.example.js`](config.example.js) | File mẫu cấu hình endpoint URL |
| [`worker/worker.js`](worker/worker.js) | Cloudflare Worker proxy: nạp slide, phân loại 3 nhánh JSON, gọi OpenRouter |
| [`worker/wrangler.toml`](worker/wrangler.toml) | Cấu hình deploy Worker lên Cloudflare |
| `Recording CP2.mp4` | Video minh chứng thao tác luồng prototype mốc CP2 |
| `Recording CP3.mp4` | Video minh chứng AI chạy thật mốc CP3 (10.4MB) |
