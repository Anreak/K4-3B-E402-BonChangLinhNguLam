# AI SPEC — VLearn Tutor (Grounding & Citations) · Nhóm Lớp 3B · Zone E402/E403
Hướng: [x] A — VLearn  [ ] B — Trợ lý Học viên  [ ] C — Làn mở
Loại: [x] Tối ưu tính năng có sẵn  [ ] Tính năng mới

## §1. User & Job
- Job executor + workflow (đính kèm worksheet JTBD / ảnh sơ đồ):
  - Job executor: Học viên đang học trên VLearn (đọc slide hoặc làm lab), vừa bôi đen hoặc thắc mắc một khái niệm chưa hiểu.
  - Workflow: Đọc slide/lab -> Thắc mắc hoặc bôi đen đoạn khó hiểu -> Hỏi tutor -> Nhận câu trả lời -> Cần kiểm chứng nguồn trang để ôn tập/làm quiz.
- Core JTBD (không tên sản phẩm/AI trong câu):
  Khi gặp một khái niệm hoặc yêu cầu lab chưa rõ trong bài học, tôi muốn nhận được câu trả lời chính xác kèm dẫn chứng trang tài liệu bài giảng gốc, để có thể nhanh chóng đối chiếu và nắm vững bài học mà không sợ hiểu sai.
- Problem statement (KHÔNG chữ AI):
  Khi học viên hỏi để làm rõ bài học, câu trả lời nhận được không có trích dẫn hoặc tự suy đoán ngoài bài; học viên không biết dựa vào đâu nên phải tự dò lại slide mất 10–15 phút và dễ học sai phần quan trọng.
- Evidence (chuẩn A và/hoặc B — log đầy đủ trong repo):
  - Số liệu mining / kết quả khảo sát (n = ?, % xác nhận):
    - Đếm từ `data/vlearn-pack/chatlog/TutorTurns.csv`: 3.781/13.494 lượt (28,02%) phản hồi thiếu trích dẫn (`has_citation = False`); riêng Khóa 4 là 839/3.097 (27,09%), ảnh hưởng 191/448 học viên K4 (42,63%).
    - Tỷ lệ downvote khi thiếu trích dẫn vọt lên 62,22% (so với 33,33% khi có trích dẫn). Chi tiết thống kê lưu tại `evidence-cp1.md`.
  - ≥5 quote/ví dụ nguyên văn + nguồn:
    1. `T00079` (K3, downvote): Bôi đen Trang 33 hỏi "tóm tắt slide này", tutor match số "33" báo lỗi sang trang 60, 72.
    2. `T00111` (K3, downvote): Hỏi "slide 9 là gì", tutor từ chối vì không thấy từ khóa "slide 9".
    3. `T10288` (K4): Hỏi lab Day01 làm gì, tutor nói "chưa có nội dung chi tiết của slide bài học" nhưng vẫn giải thích chung chung, không có nguồn.
    4. `T10289` (K4): Hỏi "tôi phải làm gì ở đây", tutor đưa quy trình IT chung chung, không trích dẫn tài liệu lab của lớp.
    5. `T10311` (K4): Hỏi dữ liệu slide 1-5, tutor báo "chưa được nạp trực tiếp nội dung các slide".

## §2. Impact & quyết định chọn
- Bảng impact ≥3 ứng viên (bao nhiêu người · tần suất · tốn gì mỗi lần · khả thi):
  | Ứng viên bài toán | Quy mô ảnh hưởng | Tần suất | Tốn gì mỗi lần (Cost-of-error) | Khả thi | Chọn/Loại |
  |---|---|---|---|---|---|
  | 1. Trả lời thiếu trích dẫn/căn cứ | 933 học viên (57,7% toàn khóa; 42,6% K4) | 3.781 lượt (28,02%) | Mất 10-15' tự dò slide; downvote 62,2%; nguy cơ học sai kiến thức thi/lab | Rất cao | **CHỌN** |
  | 2. Độc thoại 1 chiều, thiếu hỏi gợi mở | Toàn bộ học viên | 12.127 lượt chỉ dùng `review_concept` (89,9%); chỉ 28 lượt hỏi lại | Câu trả lời dài quá mức (>400 ký tự), học viên bị quá tải nhận thức | Trung bình | **LOẠI** |
  | 3. Bôi đen rác/quá ngắn (≤5 ký tự) | ~23% tương tác | 364 lượt bôi đen ≤5 ký tự; 3.067 câu hỏi mẫu | Tutor bối rối, học viên phải bôi đen lại | Dễ (ở Client) | **LOẠI** |
- Ứng viên ĐÃ LOẠI + vì sao:
  - Loại ứng viên 2: Đánh giá chất lượng hội thoại đa lượt mang tính định tính, khó xây dựng rubric đo lường khách quan trong 39 giờ.
  - Loại ứng viên 3: Bản chất là vấn đề UX phía frontend (chặn bôi đen rỗng), không làm nổi bật năng lực thiết kế quyết định AI.
- Ứng viên CHỌN + vì sao (bằng số):
  - Chọn ứng viên 1: Bằng chứng số liệu áp đảo (3.781 lượt lỗi, downvote tăng từ 33,3% lên 62,2%), giải quyết dứt điểm được bằng quyết định AI (chỉ trả lời khi có nguồn tin cậy, nếu không thì hỏi lại/từ chối) và đo được 100% trên Golden Set.

## §3. Giải pháp tương tự đã nghiên cứu
- [Sản phẩm 1]: flow / đáng học / đáng né / mình khác gì
- [Sản phẩm 2]: ...

## §4. Thiết kế
- Lát cắt MỘT CÂU (1 user · 1 việc · 1 quyết định AI · 1 kết quả):
  Một học viên hỏi về khái niệm/lab đang mở; hệ thống quyết định `ANSWER_WITH_CITE` / `CLARIFY` / `OUT_OF_SCOPE`; nếu có căn cứ thì trả lời kèm đúng mã trang `[trang N]`; học viên đối chiếu và nắm bài ngay.
- Non-goals (≥3 thứ KHÔNG build):
  1. Không build giao diện đọc slide mới (dùng lại khung VLearn hiện có).
  2. Không cố trả lời kiến thức mở ngoài bài học nếu slide/transcript không đề cập.
  3. Không tự giải hộ toàn bộ bài tập/code lab cho học viên.
- Mức prototype nhắm tới: [ ] Sketch [x] Mock [ ] Working — phần nào mock, phần nào thật:
  Phần mock: giao diện hiển thị tài liệu/slide bài học; phần thật: luồng logic quyết định AI, trích xuất căn cứ và hiển thị 4 đường đi tương tác trong `prototype/index.html`.
- Automation: [ ] augment [x] conditional [ ] automate — lý do theo cost-of-error:
  Conditional: AI tự trả lời khi tìm được đoạn trích dẫn đủ chắc; từ chối và hỏi lại khi thiếu căn cứ trong bài giảng. Lý do: kiến thức sai trong học tập có chi phí sửa chữa rất đắt (làm sai lab, mất điểm thi, mất niềm tin vào hệ thống).
- §4b. Nguyên tắc đã áp dụng (≥4 — HAX/PAIR, xem guide):
  | Nguyên tắc | Áp cụ thể vào đâu trong prototype |
  |---|---|
  | HAX G2 (Làm rõ mức độ tin cậy) | Gắn nhãn trích dẫn `[Trang N]` màu xanh dương ngay cạnh luận điểm câu trả lời |
  | HAX G10 (Thu hẹp phạm vi khi nghi ngờ) | Hộp thoại gợi ý màu vàng (`.clarification-box`) hiển thị 2 lựa chọn định hướng khi câu hỏi mơ hồ |
  | HAX G11 (Giải thích vì sao) | Hộp popover xem nguồn (`#citation-popover`) hiển thị đoạn trích dẫn nguyên văn khi click vào `[Trang N]` |
  | HAX G9 (Sửa dễ dàng) | Nút "✏️ Sửa câu hỏi" gắn trực tiếp dưới chân từng tin nhắn trả lời |
  | HAX G8 (Gạt bỏ dễ dàng) | Nút "Bỏ qua & quay lại bài học" khi nhận thông báo từ chối ngoài phạm vi |
  | PAIR Graceful Failure | Nút "💬 Chuyển câu hỏi cho TA trên Discord" khi không tìm thấy nguồn trong bài |

## §5. Kiểu lỗi — 4 lớp chỗ khó + kịch bản (≥8) [bảng theo guide §2.5]

| Lớp | Trigger | Biểu hiện | Hậu quả | Kịch bản minh hoạ |
|---|---|---|---|---|
| **L1 — Từ chối nhầm dù đủ căn cứ** | Câu hỏi rõ ràng, map thẳng vào đúng 1 đoạn slide | `decision` ra `CLARIFY`/`OUT_OF_SCOPE` dù ground truth là `ANSWER_WITH_CITE` | Học viên phải hỏi lại nhiều lần dù câu đã đủ rõ, giảm trải nghiệm | 1. "Multi-Head Attention là gì?" (rõ, Trang 5) đáng lẽ trả lời thẳng<br>2. "Cho tôi biết chi tiết về KV-Cache" (rõ, Trang 7) |
| **L2 — Đoán bừa khi mơ hồ** | Câu hỏi ngắn/đại từ không rõ ngữ cảnh (có thể ánh xạ >1 đoạn) | `decision` ra `ANSWER_WITH_CITE` (chọn đại 1 trang) dù đúng ra cần `CLARIFY` | Trả lời sai ý học viên, dễ học sai kiến thức thi | 3. "Cái này giải quyết vấn đề gì?" (đại từ mơ hồ)<br>4. "Note lại giúp tôi" — không rõ ghi nội dung nào |
| **L3 — Bịa/trả lời chung chung ngoài phạm vi nguồn** | Câu hỏi liên quan bề mặt tới chủ đề bài học (LLM, Transformer, token…) nhưng nội dung cụ thể không có trong 3 đoạn slide | `decision` ra `ANSWER_WITH_CITE` dùng kiến thức ngoài, hoặc answer không trace được về 3 đoạn nguồn | Root-cause chính đã đo trong evidence (3.781 lượt/28% thiếu trích dẫn, downvote 62,2%) | 5. "LLM bản chất là gì?" — hệ thống thật (T10366/T10429) từng trả lời bằng "kiến thức tổng quát", không trích dẫn<br>6. "Kiến trúc Transformer nói chung gồm những thành phần gì?" — thật (T10367) mô tả cả kiến trúc bằng kiến thức chung dù slide chỉ nói Self-Attention |
| **L4 — Trích dẫn sai trang dù chọn đúng nhánh** | Hai đoạn slide có chủ đề/từ khoá gần nhau (Trang 5 & Trang 7 đều thuộc "kỹ thuật LLM") | `decision` = `ANSWER_WITH_CITE` đúng, nhưng `citation_page` sai | Học viên đối chiếu nhầm trang khi ôn bài, giống hệt evidence gốc | 7. "Cơ chế nào khiến việc sinh Output tốn kém hơn Input?" — dễ nhầm sang Trang 5 (chữ "cơ chế") dù đúng là Trang 7<br>8. "Cách tính chi phí khi gọi model qua API là gì?" — gần giống bullet nông ở Trang 1 nhưng nội dung số liệu thật nằm ở Trang 7 |

Chi tiết case + kỳ vọng đầy đủ (≥2 case/lớp): xem `eval/golden-set.csv` (cột `error_class`).

## §6. Bốn đường đi của trải nghiệm
- Happy path: Học viên hỏi trúng nội dung slide -> AI trả lời súc tích kèm huy hiệu trích dẫn `[Trang N]`, click vào xem đoạn nguồn nguyên văn.
- Low-confidence (②): Học viên bôi đen từ khóa ngắn/mơ hồ -> AI kích hoạt HAX G10 dừng lại hỏi 1 câu kèm 2 nút bấm lựa chọn để thu hẹp phạm vi.
- Failure/không căn cứ (①): Học viên hỏi ngoài bài giảng -> AI kích hoạt PAIR Graceful Failure thông báo chưa đủ căn cứ + cung cấp nút chuyển câu hỏi sang TA trên Discord.
- Correction (user sửa): Học viên có thể bấm "✏️ Sửa câu hỏi" ngay trên bong bóng chat để điều chỉnh câu hỏi mà không mất ngữ cảnh bài học.
- Khi bị đòi ngoài phạm vi (③): Từ chối lịch sự, nêu rõ giới hạn bài học và hướng dẫn liên hệ giảng viên/TA.
- Case đặc thù domain (④): Cảnh báo nếu câu hỏi liên quan đến code/lab nhạy cảm hoặc vi phạm an toàn bài thi.

## §7. Kiểm thử
- Chiều chất lượng + định nghĩa kiểm chứng được:
- Golden set (≥20 case theo cơ cấu trong guide §2.6, file trong eval/):
- Quality bar (chốt từ hạn chốt spec của khoá, giữ nguyên sau đó): "Đạt khi ≥ ___% qua bộ, và ___"
- Kết quả các lượt chạy (bảng % — cập nhật đến trước CP6):

## §8. Phân công & kế hoạch
- Phân công có tên: spec / evidence / prompt / code / demo
- Willing users (≥2 tên) + kế hoạch vòng validation *(bonus, nếu làm)*:
- Multi-prototype (nếu làm): trục khác biệt của ≥2 phương án + lý do chọn:

## §9. Changelog
| Thời điểm | Đổi gì | Vì sao (trỏ về feedback/case nào) |
