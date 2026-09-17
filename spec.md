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
- Non-goals (≥3 thứ KHÔNG build):
- Mức prototype nhắm tới: [ ] Sketch [ ] Mock [ ] Working — phần nào mock, phần nào thật:
- Automation: [ ] augment [ ] conditional [ ] automate — lý do theo cost-of-error:
- §4b. Nguyên tắc đã áp dụng (≥4 — HAX/PAIR, xem guide):
  | Nguyên tắc | Áp cụ thể vào đâu trong prototype |
  |---|---|

## §5. Kiểu lỗi — 4 lớp chỗ khó + kịch bản (≥8) [bảng theo guide §2.5]

## §6. Bốn đường đi của trải nghiệm
- Happy path: · Low-confidence (②): · Failure/không căn cứ (①): · Correction (user sửa):
- Khi bị đòi ngoài phạm vi (③): · Case đặc thù domain (④):

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
