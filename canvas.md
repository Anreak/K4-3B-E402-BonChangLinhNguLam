# CP1 Canvas — VLearn Tutor (Grounding & Citations)

| Mục | Nội dung |
|---|---|
| **Hướng** | A1 · VLearn Tutor — Trả lời có căn cứ xác thực từ tài liệu bài giảng |
| **Job executor** | Học viên đang học trên VLearn (đọc slide hoặc làm lab), vừa bôi đen hoặc thắc mắc một khái niệm chưa hiểu. |
| **Pain 1 câu** | Khi học viên hỏi để làm rõ bài học, tutor trả lời không trích dẫn hoặc tự suy đoán ngoài bài; học viên không biết dựa vào đâu nên phải tự dò lại slide mất 10–15 phút và dễ học sai phần quan trọng. |
| **Evidence ban đầu** | • 3.781/13.494 lượt (28%) phản hồi thiếu trích dẫn; riêng K4 là 839/3.097 (27%).<br>• Tỷ lệ downvote khi thiếu trích dẫn vọt lên 62,2% (so với 33,3% khi có trích dẫn). Mã minh họa: `T00079`, `T00111`, `T10288`. |
| **Lát cắt 1 câu** | Một học viên hỏi về khái niệm/lab đang mở; hệ thống quyết định `ANSWER_WITH_CITE` / `CLARIFY` / `OUT_OF_SCOPE`; nếu có căn cứ thì trả lời kèm đúng mã trang `[trang N]`; học viên đối chiếu và nắm bài ngay. |
| **Automation** | Conditional: AI tự trả lời khi tìm được đoạn trích dẫn đủ chắc; từ chối và hỏi lại khi thiếu căn cứ trong bài giảng. |
| **Willing users dự kiến** | Trần Kim Phương, Bùi Hải Nam, Nguyễn Văn Xuân Lộc |
| **Phân công** | Hữu: spec + canvas; Quyền 2: evidence + khảo sát; Thăng 3: prompt/AI call, demo; Hoàng: eval, validation; |
