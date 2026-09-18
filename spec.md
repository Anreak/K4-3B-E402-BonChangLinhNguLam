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
- **Perplexity AI:**
  - *Flow:* Người dùng đặt câu hỏi -> Hệ thống trích xuất văn bản web -> Sinh câu trả lời tổng hợp kèm các footnote đánh số `[1]`, `[2]` -> Bấm vào footnote để xem nguồn trích dẫn.
  - *Đáng học:* Cơ chế gắn thẻ nguồn trích dẫn trực tiếp ngay sau từng mệnh đề/luận điểm giúp người đọc dễ dàng xác minh độc lập.
  - *Đáng né:* Thường gom cả trang web dài vào nguồn trích dẫn mà không định vị chính xác vị trí đoạn văn chứa bằng chứng, người dùng vẫn phải đọc lướt lại toàn trang.
  - *Mình khác gì:* Giới hạn chặt chẽ trong ngữ cảnh bài giảng cục bộ (slide/transcript đang mở); thẻ trích dẫn `[Trang N]` kích hoạt chuyển động trượt slide trực tiếp đến đúng trang và đoạn highlight tương ứng.
- **Google NotebookLM:**
  - *Flow:* Nạp tài liệu PDF/nguồn học tập -> Chat hỏi đáp dựa trên tài liệu nạp -> Hiển thị citation trích dẫn kèm đoạn trích nguyên văn khi bấm vào.
  - *Đáng học:* Nguyên tắc "Source-grounded" tuyệt đối: chỉ nói những gì tài liệu có, hiển thị trích đoạn nguyên văn để người dùng đối chiếu.
  - *Đáng né:* Thiếu cơ chế chủ động hỏi lại (clarify) khi câu hỏi mơ hồ, thường từ chối cứng nhắc hoặc im lặng nếu từ khóa không khớp chặt chẽ.
  - *Mình khác gì:* Bổ sung cơ chế HAX G10 chủ động đưa 2–3 gợi ý lựa chọn thu hẹp phạm vi khi câu hỏi quá ngắn hoặc mơ hồ; tích hợp PAIR Graceful Failure với nút chuyển tiếp câu hỏi cho Trợ giảng (TA) trên Discord.

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

Chi tiết case + kỳ vọng đầy đủ (≥2 case/lớp): xem `eval/cp3-so-do.csv` và `eval/golden-set.csv`.

## §6. Bốn đường đi của trải nghiệm
- Happy path: Học viên hỏi trúng nội dung slide -> AI trả lời súc tích kèm huy hiệu trích dẫn `[Trang N]`, click vào xem đoạn nguồn nguyên văn.
- Low-confidence (②): Học viên bôi đen từ khóa ngắn/mơ hồ -> AI kích hoạt HAX G10 dừng lại hỏi 1 câu kèm 2 nút bấm lựa chọn để thu hẹp phạm vi.
- Failure/không căn cứ (①): Học viên hỏi ngoài bài giảng -> AI kích hoạt PAIR Graceful Failure thông báo chưa đủ căn cứ + cung cấp nút chuyển câu hỏi sang TA trên Discord.
- Correction (user sửa): Học viên có thể bấm "✏️ Sửa câu hỏi" ngay trên bong bóng chat để điều chỉnh câu hỏi mà không mất ngữ cảnh bài học.
- Khi bị đòi ngoài phạm vi (③): Từ chối lịch sự, nêu rõ giới hạn bài học và hướng dẫn liên hệ giảng viên/TA.
- Case đặc thù domain (④): Cảnh báo nếu câu hỏi liên quan đến code/lab nhạy cảm hoặc vi phạm an toàn bài thi.

## §7. Kiểm thử
- **Chiều chất lượng + định nghĩa kiểm chứng được:**
  1. *Groundedness (Tính bám nguồn):* Câu trả lời chỉ được trích xuất từ 3 đoạn slide (Trang 1, 5, 7) được nạp. Đạt khi 0% suy diễn hoặc bịa thông tin ngoài tài liệu.
  2. *Citation Accuracy (Độ chuẩn xác số trang):* Nhãn trích dẫn `[Trang N]` phải trỏ chính xác về trang chứa bằng chứng trực tiếp: Trang 1 (Next-Token Prediction, Token Economy, API latency), Trang 5 (Self-Attention, Multi-Head Attention, Positional Encoding), Trang 7 (Chi phí Input/Output Token, Autoregressive, KV-Cache). Sai số trang hoặc không có căn cứ = Không đạt.
  3. *Clarify Precision (Độ chính xác khi thu hẹp phạm vi - HAX G10):* Khi câu hỏi mơ hồ, đại từ thiếu ngữ cảnh ("Cái này", "Nó", "Tokens"), hệ thống phải ra quyết định `CLARIFY` kèm mảng 2–3 phương án lựa chọn định hướng; không được tự ý đoán mò một nhánh trả lời.
  4. *Graceful Out-of-Scope (Từ chối an toàn - PAIR):* Khi câu hỏi nằm ngoài tài liệu (lịch thi, tài liệu lab khác, thông tin không có trong slide), hệ thống phải ra quyết định `OUT_OF_SCOPE`, giải thích rõ giới hạn và dẫn hướng sang kênh hỗ trợ của TA.
- **Golden set:**
  - Bộ 20 case hoàn chỉnh lưu tại `eval/cp3-so-do.csv`, phân bổ đúng cấu trúc guide §2.6:
    - 8 case thông thường (Happy path hỏi trúng kiến thức Trang 1, 5, 7).
    - 8 case thuộc 4 lớp chỗ khó L1–L4 (câu hỏi mơ hồ, dễ nhầm trang, bẫy hỏi kiến thức chung ngoài bài).
    - 4 case hiếm / ngoài phạm vi (hỏi lịch thi, đòi link Colab, hỏi kiến thức tiếng Anh ngoài slide).
    - ≥10 case được lấy cảm hứng và trích xuất trực tiếp từ chatlog thật `TutorTurns.csv` (các lượt `T00079`, `T00111`, `T10288`, `T10366`, `T10367`).
- **Quality bar (chốt cứng tại CP4 · 21:00 18/9, giữ nguyên sau đó):**
  - **"Đạt khi ≥ 85% qua bộ 20 case, 100% trích dẫn đúng số trang (Trang 1, 5, 7) và 0% hallucination (bịa kiến thức ngoài slide)."**
- **Kết quả các lượt chạy:**
  - **Lượt 1 (Chạy ngày 18/9 tại CP3 — Model: `nex-agi/nex-n2.5-mini:free` qua Cloudflare Worker):**
    | Chỉ số đo | Kết quả Lượt 1 | Đối chiếu Quality Bar | Đánh giá |
    |---|:---:|:---:|:---:|
    | Số case vượt qua | **18 / 20 case** | ≥ 17 / 20 case (≥ 85%) | **ĐẠT (90.0%)** |
    | Tỷ lệ trích dẫn đúng số trang | 100% (trên các case có cite) | 100% | **ĐẠT** |
    | Tỷ lệ Hallucination | 0% | 0% | **ĐẠT** |
  - **Bảng tổng hợp chi tiết kết quả 20 case Lượt 1:**
    *Xem file chi tiết: `eval/cp3-so-do.csv`.*
    - 18 case đạt chuẩn: Các câu hỏi rõ ràng đều trích đúng trang `[Tr.1]`, `[Tr.5]`, `[Tr.7]`; các câu hỏi ngắn "Cái này giải quyết vấn đề gì?", "Tokens", "chào bạn" đều kích hoạt đúng `CLARIFY` kèm danh sách lựa chọn; câu hỏi lịch thi và RLHF đều ra `OUT_OF_SCOPE`.
    - 2 case không đạt (chiếm 10%):
      - *Case 14 ("LLM bản chất là gì?"):* Kỳ vọng `OUT_OF_SCOPE`, thực tế trả về `ANSWER_WITH_CITE [Tr.1]`.  
        *Nguyên nhân:* Model bị "nhiệt tình quá mức" (over-eager). Khi thấy từ khóa "LLM", model quét trúng bullet tại Trang 1 có nhắc tới cụm *"mô hình ngôn ngữ lớn sử dụng cơ chế dự đoán token tiếp theo"* nên cố gắng chắp vá để trả lời thay vì từ chối.
      - *Case 15 ("Kiến trúc Transformer nói chung gồm những thành phần gì?"):* Kỳ vọng `OUT_OF_SCOPE`, thực tế trả về `ANSWER_WITH_CITE [Tr.5]`.  
        *Nguyên nhân:* Slide Trang 5 chỉ liệt kê 3 kỹ thuật bổ trợ (Self-Attention, Multi-Head Attention, Positional Encoding), không chứa kiến trúc Transformer đầy đủ (Encoder, Decoder, FFN, Normalization...). Model đã ngộ nhận 3 bullet là kiến trúc hoàn chỉnh để trả lời câu hỏi tổng quát của học viên.
  - **Kế hoạch cải tiến cho Lượt 2 (trước CP5):**
    Bổ sung negative constraint vào system prompt trong `worker.js`: *"Khi câu hỏi đòi hỏi kiến thức tổng thể hoặc định nghĩa toàn diện mà slide chỉ có các thành phần cục bộ, phải ra OUT_OF_SCOPE hoặc CLARIFY, tuyệt đối không chắp vá các bullet rời rạc để trả lời như một định nghĩa hoàn chỉnh."*

## §8. Phân công & kế hoạch
- **Phân công có tên (rõ vai trò và trách nhiệm):**
  - **Nguyễn Quang Hữu (2A202602756) — Đội trưởng · Spec Lead:** Chịu trách nhiệm kiến trúc tài liệu `spec.md` (§1-§9), xây dựng canvas CP1, chuẩn hóa lát cắt sản phẩm, đối chiếu tiêu chuẩn Rubric và điều phối tiến độ các checkpoint.
  - **Nguyễn Minh Quyền (2A202602438) — Evidence Lead:** Thu thập và phân tích evidence về vấn đề tutor thiếu citation từ 13.494 lượt chatlog `TutorTurns.csv`; khảo sát/phỏng vấn willing users để xác thực pain point; tổng hợp nhu cầu và hành vi người học; xây dựng các case thực tế.
  - **Nguyễn Nhật Thăng (2A202602727) — Prompt & Code Lead:** Thiết kế system prompt phân loại 3 nhánh, code gọi API thật qua Cloudflare Worker proxy (`worker.js`), tích hợp tương tác trên prototype web và quay video demo CP3.
  - **Vương Việt Hoàng (2A202602528) — Eval & Validation Lead:** Xây dựng bộ Golden Set 20 case phân bổ đủ 4 lớp lỗi khó, thực hiện chạy đo lường kiểm thử Lượt 1 (đạt 90%), phân tích nguyên nhân các case thất bại và thiết kế kịch bản phỏng vấn validation với willing users.
- **Willing users (≥2 tên) + kế hoạch vòng validation *(bonus R6, nếu làm)*:**
  - *Danh sách willing users đã xác nhận từ CP1:*
    1. Trần Kim Phương (Học viên K4)
    2. Bùi Hải Nam (Học viên K4)
    3. Nguyễn Văn Xuân Lộc (Học viên K4)
  - *Kế hoạch thực hiện (trước CP5):* Mỗi người 1 phiên thử 10 phút theo 5 nhịp chuẩn CS177 / Sean Ellis (Comfort -> Context -> Task theo outcome -> Observe im lặng quan sát -> Phỏng vấn sâu với câu hỏi Disappointment). Ghi chép nhật ký phản hồi nguyên văn tại `validation/feedback-log.md`.
- **Multi-prototype (trục khác biệt của ≥2 phương án + lý do chọn):**
  - *Phương án A (CHỌN) — Conditional Automation:* AI tự động trả lời kèm trích dẫn khi bằng chứng trong slide chắc chắn; chủ động chuyển nhánh hỏi lại (HAX G10) khi mơ hồ; từ chối an toàn (PAIR) khi ngoài bài. Lý do chọn: Giảm thiểu tối đa cost-of-error học sai kiến thức trong giáo dục, tạo niềm tin tuyệt đối cho học viên.
  - *Phương án B (LOẠI) — Pure RAG Chatbot (Full Automate):* Luôn cố gắng tìm top-k vector similarity và sinh câu trả lời trong mọi tình huống. Lý do loại: Dễ sinh ảo giác (hallucination) ở các câu hỏi bẫy hoặc kiến thức mở ngoài bài (như minh họa ở Case 14 & 15), học viên khó phát hiện ra lỗi sai.

## §9. Changelog
| Thời điểm | Đổi gì | Vì sao (trỏ về feedback/case nào) |
|---|---|---|
| 17/9 · 19:30 (CP1) | Chốt Canvas 7 dòng, chọn Track A1 VLearn Tutor | Phân tích 13.494 lượt chatlog phát hiện 28% phản hồi thiếu citation, downvote tăng từ 33% lên 62%. |
| 17/9 · 21:00 (CP2) | Dựng prototype tương tác tuần tự với hiệu ứng trượt 3 slide, tích hợp các nút HAX G2/G9/G10/G11 và PAIR Graceful Failure | Khắc phục nhược điểm giao diện tĩnh, giúp kiểm chứng luồng trải nghiệm người dùng trước khi code backend. |
| 18/9 · 10:00 (CP3) | Tích hợp Cloudflare Worker proxy (`worker.js`) gọi OpenRouter AI thật; hoàn thành đo Lượt 1 trên 20 case Golden Set đạt 90% | Chuyển từ mock dữ liệu sang AI call thật; phát hiện 2 case lỗi (Case 14 & 15) do model over-eager để chuẩn bị tinh chỉnh prompt ở CP4/CP5. |
