# Nhật ký Thu thập Bằng chứng & Khám phá Bài toán (Evidence Log — CP1)

> **Track:** A1 · Tối ưu VLearn AI Tutor hiện có  
> **Trọng tâm:** Giải quyết triệt để lỗi trả lời không căn cứ / thiếu trích dẫn nguồn tài liệu (`has_citation = False`)  
> **Dữ liệu phân tích:** `data/vlearn-pack/chatlog/TutorTurns.csv` (13.494 lượt hỏi–đáp từ 22/07 đến 15/09/2026, trong đó Khóa 4 chiếm 3.097 lượt)  
> **Tiêu chuẩn nghiệm thu:** Đáp ứng đầy đủ **Chuẩn B** (Mining dữ liệu có số đếm, phương pháp kiểm lại được, ≥5 ví dụ nguyên văn) và thiết lập sẵn khung **Chuẩn A** (Khảo sát 20 học viên theo Mom Test).

---

## 1. Phương pháp Mining Dữ liệu (Reproducible Methodology — Chuẩn B)

Toàn bộ số liệu dưới đây được trích xuất trực tiếp từ file `data/vlearn-pack/chatlog/TutorTurns.csv`. Bất kỳ thành viên hoặc Trợ giảng (TA) nào cũng có thể kiểm chứng lại bằng đoạn mã Python sau:

```python
import pandas as pd

# Nạp dữ liệu chatlog
df = pd.read_csv('data/vlearn-pack/chatlog/TutorTurns.csv')
total = len(df)
k4 = df[df['cohort_hint'] == 'K4']

# 1. Thống kê tỷ lệ thiếu trích dẫn (has_citation == False)
no_cite = df[df['has_citation'] == False]
no_cite_k4 = k4[k4['has_citation'] == False]

# 2. Học viên chịu ảnh hưởng
students_total = df['student'].nunique()
students_no_cite = no_cite['student'].nunique()
k4_students_total = k4['student'].nunique()
k4_students_no_cite = no_cite_k4['student'].nunique()

# 3. Tương quan với mức độ hài lòng (rating down)
rated = df[df['rating'].notna()]
rated_no_cite = rated[rated['has_citation'] == False]
rated_with_cite = rated[rated['has_citation'] == True]

down_rate_no_cite = (rated_no_cite['rating'] == 'down').sum() / len(rated_no_cite)
down_rate_with_cite = (rated_with_cite['rating'] == 'down').sum() / len(rated_with_cite)

print(f"Tổng lượt: {total} | Thiếu trích dẫn: {len(no_cite)} ({len(no_cite)/total:.2%})")
print(f"Khóa 4: {len(k4)} | K4 thiếu trích dẫn: {len(no_cite_k4)} ({len(no_cite_k4)/len(k4):.2%})")
print(f"Học viên toàn khóa gặp lỗi: {students_no_cite}/{students_total} ({students_no_cite/students_total:.2%})")
print(f"Học viên K4 gặp lỗi: {k4_students_no_cite}/{k4_students_total} ({k4_students_no_cite/k4_students_total:.2%})")
print(f"Downvote khi KHÔNG trích dẫn: {down_rate_no_cite:.2%} ({len(rated_no_cite)} lượt)")
print(f"Downvote khi CÓ trích dẫn: {down_rate_with_cite:.2%} ({len(rated_with_cite)} lượt)")
```

### Bảng tổng hợp số liệu cốt lõi

| Chỉ số | Toàn bộ dữ liệu (K3 + K4) | Riêng Khóa 4 (K4 — Khóa hiện tại) | Ý nghĩa nghiệp vụ |
|---|---|---|---|
| **Tổng số lượt hỏi–đáp** | 13.494 lượt | 3.097 lượt (từ 09/09 đến 15/09) | Quy mô mẫu lớn, đủ độ tin cậy thống kê |
| **Số lượt KHÔNG có trích dẫn (`has_citation = False`)** | **3.781 lượt (28,02%)** | **839 lượt (27,09%)** | Trung bình hơn 1 trong 4 câu trả lời của tutor không trỏ về slide hay transcript |
| **Số học viên bị ảnh hưởng** | **933 / 1.617 học viên (57,70%)** | **191 / 448 học viên (42,63%)** | Đa số học viên đều từng ít nhất một lần nhận câu trả lời không căn cứ |
| **Tỷ lệ Downvote khi KHÔNG có trích dẫn** | **62,22%** (56 down / 90 lượt có chấm) | — | Học viên thể hiện rõ sự bất mãn khi tutor trả lời vu vơ, không nguồn |
| **Tỷ lệ Downvote khi CÓ trích dẫn** | **33,33%** (29 down / 87 lượt có chấm) | — | Có trích dẫn giúp giảm nguy cơ downvote xuống gần một nửa (**giảm 1,87 lần**) |
| **Câu trả lời dài (>150 ký tự) không trích dẫn** | **2.457 lượt (18,21%)** | **803 lượt (25,93%)** | Nguy cơ ảo giác (hallucination) cao: tutor tự giải thích dài dòng bằng tri thức mô hình nhưng không gắn với bài giảng |

---

## 2. Bảng Impact Đánh giá ≥3 Ứng viên Bài toán (Theo Rubric R1)

Trước khi chốt hướng đi, nhóm đã khảo sát và cân nhắc 3 vấn đề nổi cộm nhất từ chatlog của VLearn Tutor:

| Ứng viên bài toán | Đối tượng & Quy mô gặp phải (từ log) | Tần suất xuất hiện | Tổn thất mỗi lần gặp (Cost-of-Error) | Tính khả thi trong Hackathon (Build nổi không) | Quyết định & Lý do |
|---|---|---|---|---|---|
| **Ứng viên 1 (CHỌN): Tutor trả lời không có căn cứ, thiếu trích dẫn (`has_citation = False`)** | **933/1.617 học viên** (57,70%); riêng K4 có **191/448 học viên** (42,63%). | **3.781 lượt** (28,02% tổng lượt chatlog); trung bình 4 lần/học viên. | • Mất **10–15 phút** tự lật lại từng slide/video để kiểm chứng.<br>• Tỷ lệ downvote vọt lên **62,22%**.<br>• Nguy cơ học sai kiến thức thi và làm sai lab. | **Rất khả thi.** Có thể xây dựng RAG pipeline chặt chẽ, kiểm định trích dẫn bằng rubric và đo lường định lượng chính xác trên golden set 20 case. | **CHỌN.** Bằng chứng áp đảo, nỗi đau có hậu quả nặng nề nhất về mặt học thuật và niềm tin của học viên. |
| **Ứng viên 2 (LOẠI): Tutor thụ động độc thoại 1 chiều, thiếu câu hỏi gợi mở / kiểm tra mức hiểu** | Toàn bộ học viên. `review_concept` chiếm **12.127/13.494 lượt** (89,87%), trong khi `ask_probing_question` chỉ vỏn vẹn **28 lượt** (0,21%). Trường `understanding_level` bỏ trống **99,85%**. | Hầu như mọi lượt tương tác đều là độc thoại 1 chiều của tutor. | Câu trả lời thường dài quá mức cần thiết (>400 ký tự), học viên bị ngợp chữ, tiếp thu thụ động, không được dẫn dắt sư phạm. | **Khó.** Cần thiết kế hội thoại nhiều lượt (multi-turn dialog state tracking) và đánh giá sư phạm mang tính định tính, khó đo đếm chính xác trong 39 giờ. | **LOẠI.** Mặc dù là vấn đề sư phạm hay, nhưng khó đo lường khách quan và rủi ro trễ hạn build cao hơn Ứng viên 1. |
| **Ứng viên 3 (LOẠI): Xử lý đoạn bôi đen rác, cực ngắn (≤5 ký tự) và câu hỏi mẫu gây nhiễu** | **3.067 lượt** câu hỏi mẫu (`is_preset = True`, 22,73%); **364 lượt** bôi đen ≤5 ký tự (như "r", "ủa", dấu cách). | ~23% tổng số tương tác trên hệ thống. | Tutor bối rối, trả lời xin lỗi lúng túng ("Rất tiếc tôi không tìm thấy..."), học viên phải bôi đen lại và gõ lại từ đầu. | **Dễ về kỹ thuật nhưng giá trị AI thấp.** Phần lớn xử lý được bằng validation logic đơn giản ở phía Client (Frontend UI). | **LOẠI.** Đây là vấn đề UX phía frontend hơn là bài toán cốt lõi về chất lượng quyết định của AI. |

> **Kết luận:** Chọn **Ứng viên 1** làm lát cắt trung tâm cho Checkpoint 1 và dự án.

---

## 3. Bộ Sưu tập 8 Ví dụ Nguyên văn (Verbatim Cases — Chuẩn B)

Dưới đây là 8 ca điển hình trích xuất nguyên văn từ `TutorTurns.csv` minh họa cho 3 nhóm lỗi nghiêm trọng khi tutor thiếu trích dẫn:

### Nhóm A: Lỗi bị học viên Downvote trực tiếp do thiếu trích dẫn / không tra cứu được

#### Ca 1: `T00079` (Khóa K3 · Bài giảng D17 `5-day02-lecture-slides-v2` · Rating: `down`)
- **Câu hỏi của học viên:**
  ```text
  (Trang 33, đoạn được chọn: "tóm tắt slide này")
  tóm tắt slide này
  ```
- **Tutor trả lời (has_citation = False):**
  ```text
  Rất tiếc là tôi đã tra cứu trong tài liệu nhưng chưa tìm thấy nội dung cụ thể của **Trang 33**. Kết quả tìm kiếm chỉ hiển thị các trang khác có nhắc đến con số "33" (như mức điểm 33% trong các bài kiểm tra đánh giá AI trên trang 60 và 72).

  Bạn có thể cho tôi biết tiêu đề của slide đó hoặc một vài từ khóa có trên trang để tôi tìm kiếm lại chính xác hơn không?
  ```
- **Hậu quả & Phân tích:** Học viên đang mở đúng trang 33 nhưng hệ thống retrieval chỉ match từ khóa thô sơ con số "33" dẫn đến kết quả rác ở trang 60, 72. Học viên bực bội bấm `downvote`.

#### Ca 2: `T00111` (Khóa K3 · Bài giảng D17 `5-day02-lecture-slides-v2` · Rating: `down`)
- **Câu hỏi của học viên:**
  ```text
  (Trang 10, đoạn được chọn: "slide 9 là gì")
  slide 9 là gì
  ```
- **Tutor trả lời (has_citation = False):**
  ```text
  Rất tiếc là mình đã thử tra cứu nhưng chưa tìm thấy nội dung cụ thể được đánh dấu là "slide 9" trong tài liệu hiện tại. 

  Bạn có thể chia sẻ thêm tiêu đề của slide đó hoặc một từ khóa/nội dung chính xuất hiện trên slide 9 để mình có thể hỗ trợ bạn giải thích chi tiết hơn không?
  ```
- **Hậu quả & Phân tích:** Tutor không có khả năng truy vấn theo số trang tương đối hoặc ngữ cảnh liền kề, hoàn toàn bất lực và từ chối hỗ trợ.

#### Ca 3: `T00128` (Khóa K3 · Bài giảng D17 `5-day02-lecture-slides-v2` · Rating: `down`)
- **Câu hỏi của học viên:**
  ```text
  (Trang 1, đoạn được chọn: "giải thích cho tôi toàn bộ slide trong này đi")
  giải thích cho tôi toàn bộ slide trong này đi
  ```
- **Tutor trả lời (has_citation = False):**
  ```text
  Rất tiếc là mình đã thử tra cứu các từ khóa tổng quát như "tổng quan", "nội dung" hay "giới thiệu" nhưng chưa tìm thấy kết quả khớp trong bộ slide này. 

  Để mình có thể hỗ trợ bạn giải thích chi tiết, bạn có thể cho mình biết tiêu đề hoặc một vài từ khóa quan trọng xuất hiện trên trang slide đầu tiên mà bạn đang thấy không?...
  ```
- **Hậu quả & Phân tích:** Không có cơ chế tóm tắt tổng quan hay phân rã phạm vi bài giảng, tra cứu thất bại vì chỉ dựa trên từ khóa literal matching.

---

### Nhóm B: Dữ liệu thực tế Khóa 4 (K4) — Trả lời kiến thức nhưng không có trích dẫn nguồn

#### Ca 4: `T10288` (Khóa K4 · Học viên `S1278` · Bài giảng D01 `Day01`)
- **Câu hỏi của học viên:**
  ```text
  (Đang học phần “Tạo môi trường và chạy test baseline” của buổi này)
  phần lab này dùng để làm gì ?
  ```
- **Tutor trả lời (has_citation = False):**
  ```text
  Chào [HV], phần lab "Tạo môi trường và chạy test baseline" giúp em thiết lập nền tảng làm việc ổn định và xác định kết quả cơ sở (baseline) cho dự án.

  Việc chạy test baseline cho phép em có một điểm đối chiếu quan trọng để đánh giá hiệu quả của các cải tiến hoặc thay đổi mô hình sau này. Nếu không có kết quả baseline, em sẽ khó có cơ sở khách quan để đo lường xem mô hình của mình có thực sự tốt lên hay không.

  Vì hiện tại chưa có nội dung chi tiết của slide bài học, em có thể cho anh biết cụ thể hơn về những công cụ hoặc thư viện em đang làm trong lab này không? Anh sẽ hỗ trợ em giải thích sâu hơn về cách chúng vận hành.
  ```
- **Hậu quả & Phân tích:** Tutor tự thừa nhận *"Vì hiện tại chưa có nội dung chi tiết của slide bài học..."* nhưng vẫn tự giải thích lý thuyết chung chung. Học viên không biết phần lab thực tế trong repo của lớp yêu cầu những file gì, biến số nào.

#### Ca 5: `T10289` (Khóa K4 · Học viên `S1278` · Bài giảng D01 `Day01`)
- **Câu hỏi của học viên:**
  ```text
  (Đang học phần “Tạo môi trường và chạy test baseline” của buổi này)
  tôi phải làm gì ? ở đây
  ```
- **Tutor trả lời (has_citation = False):**
  ```text
  Chào [HV], để bắt đầu phần "Tạo môi trường và chạy test baseline", em cần thực hiện các công việc thiết lập hạ tầng cần thiết để đảm bảo code có thể chạy được.

  Thông thường, quy trình này sẽ bao gồm:
  1. **Thiết lập môi trường**: Cài đặt các thư viện cần thiết, định cấu hình môi trường ảo (như virtualenv hoặc conda) để tránh xung đột phiên bản.
  2. **Chạy test baseline**: Thực thi các file test đã được cung cấp để kiểm tra xem hệ thống đã được thiết lập đúng hay chưa và ghi lại kết quả gốc làm cơ sở so sánh.

  Vì hiện tại chưa có slide cụ thể cho buổi học, em hãy kiểm tra hướng dẫn trong file `README` hoặc tài liệu lab đi kèm để biết danh sách các thư viện cần cài đặt nhé...
  ```
- **Hậu quả & Phân tích:** Trả lời một quy trình chung chung của ngành IT thay vì chỉ ra đúng tài liệu hướng dẫn và mã lệnh của bài học khóa 4.

#### Ca 6: `T10311` (Khóa K4 · Học viên `S0569` · Bài giảng D01 `Data`)
- **Câu hỏi của học viên:**
  ```text
  (Đang học phần “Chạy phân loại ảnh và đọc nhãn cấp ảnh” của buổi này)
  có dữ liệu về slide 1->5 luôn không
  ```
- **Tutor trả lời (has_citation = False):**
  ```text
  Chào [HV]! Hiện tại, hệ thống của anh chưa được nạp trực tiếp nội dung các slide từ 1 đến 5 của buổi "Data" này.

  Để anh hỗ trợ em tốt nhất, em có thể cho anh biết cụ thể khái niệm hay phần nào trong nội dung "Chạy phân loại ảnh và đọc nhãn cấp ảnh" mà em đang gặp khó khăn hoặc cần làm rõ không? Khi đó, anh có thể tra cứu và giải thích chi tiết hơn cho em.
  ```
- **Hậu quả & Phân tích:** Dữ liệu bài giảng bị thiếu hoặc kết nối RAG bị đứt, tutor không phản hồi được nội dung slide của khóa học.

---

### Nhóm C: Trả lời kiến thức kỹ thuật sâu hoàn toàn từ tri thức tham số của LLM (Không trích dẫn, nguy cơ sai lệch bài thi)

#### Ca 7: `T10197` (Khóa K3 · Học viên `S0037` · Bài giảng D26 `day13-monitoring-logging-observability_v2`)
- **Câu hỏi của học viên:**
  ```text
  (Đang học phần “day13-monitoring-logging-observability_v2” của buổi này)
  trả lời luôn cho tôi
  ```
- **Tutor trả lời (has_citation = False, độ dài 868 ký tự):**
  ```text
  Việc đo lường độ trễ ở **P99** quan trọng hơn giá trị trung bình vì:

  1. **Phản ánh trải nghiệm thực tế của người dùng:** Giá trị trung bình thường làm "mượt" các khoảng thời gian trễ cao, khiến bạn không thấy được những trải nghiệm tồi tệ của nhóm người dùng gặp sự cố.
  2. **Phát hiện các điểm nghẽn ẩn:** P99 giúp phát hiện các vấn đề nghiêm trọng như nghén mạng, tài nguyên hệ thống bị quá tải tạm thời...
  ```
- **Hậu quả & Phân tích:** Câu trả lời rất dài và có vẻ thuyết phục, nhưng hoàn toàn KHÔNG có trích dẫn slide hay transcript. Nếu giảng viên có định nghĩa riêng hoặc tiêu chí tính toán cụ thể cho bài quiz, học viên sẽ không thể đối chiếu và có thể bị mất điểm.

#### Ca 8: `T04638` (Khóa K3 · Học viên `S0820` · Bài giảng D25)
- **Câu hỏi của học viên:**
  ```text
  liệt kê những bài học từ trước tới giờ
  ```
- **Tutor trả lời (has_citation = False, độ dài 612 ký tự):**
  ```text
  Hiện tại, khoá học của chúng ta đã đi qua 12 ngày học với các chủ đề chính sau:
  1. **Ngày 1-3:** Giới thiệu về AI Agent, các thành phần cấu tạo và kiến trúc cơ bản.
  2. **Ngày 4-6:** Các kỹ thuật Prompt Engineering nâng cao và xây dựng chuỗi suy luận...
  ```
- **Hậu quả & Phân tích:** Tutor tự "bịa" (hallucinate) ra cấu trúc 12 ngày học không hề khớp với curriculum thực tế của khóa AI20k (Day 1 là LLM Foundation & Token Economics, không phải AI Agent). Đây là minh chứng rõ nhất cho việc thiếu căn cứ gây tai hại nghiêm trọng cho việc học tập.

---

## 4. Khung Khảo sát Thực tế 20 Học viên (Chuẩn Bị cho Chuẩn A — Mom Test)

Nhóm chuẩn bị tiến hành khảo sát nhanh 20 học viên ngoài nhóm tại phòng học E402/E403 trong giờ nghỉ giải lao để đạt trọn vẹn điểm thưởng Chuẩn A.

### Bộ câu hỏi Mom Test (Hỏi về sự kiện đã xảy ra, không hỏi ý kiến tương lai)
1. **Câu 1:** *"Trong 2 ngày học vừa qua, bạn đã hỏi AI Tutor trên VLearn bao nhiêu lần?"* (Định lượng tần suất sử dụng thật).
2. **Câu 2:** *"Lần gần nhất bạn hỏi Tutor về một bài lab hoặc slide, câu trả lời có chỉ rõ nằm ở trang nào/video nào không? Bạn đã làm gì sau đó?"* (Tìm kiếm hành vi: tự dò slide, hỏi bạn, hay bỏ qua).
3. **Câu 3:** *"Bạn đã bao giờ gặp trường hợp câu trả lời của Tutor đọc thì mượt nhưng không biết đúng hay sai so với bài giảng chưa? Lúc đó bạn mất khoảng bao lâu để tự kiểm tra lại?"* (Xác thực hậu quả đo lường được: số phút tiêu tốn).

### Bảng ghi chép mẫu (Survey Log Template)

| STT | Người được hỏi (Mã/Tên) | Lớp/Phòng | Câu 1 (Tần suất hỏi) | Câu 2 (Trải nghiệm trích dẫn lần gần nhất) | Câu 3 (Tốn bao nhiêu phút kiểm tra lại) | Xác nhận Pain? (Có/Không) |
|:---:|---|---|---|---|---|:---:|
| 1 | `[HV ngoài nhóm 1]` | 3B - E403 | 4–5 lần | "Tutor giải thích dài nhưng không ghi trang nào, mình phải tự Ctrl+F trong slide" | ~10 phút | **Có** |
| 2 | `[HV ngoài nhóm 2]` | 3B - E403 | 2 lần | "Hỏi về task lab thì tutor nói chưa nạp slide, bảo đọc README" | ~15 phút | **Có** |
| 3 | `[HV ngoài nhóm 3]` | 3B - E402 | >10 lần | "Nhiều khi trả lời chung chung như ChatGPT, phải hỏi lại TA" | ~10 phút | **Có** |
| ... | ... | ... | ... | ... | ... | ... |
| 20 | `[HV ngoài nhóm 20]` | 3B - E402 | 3 lần | "Không thấy trích dẫn, nghi ngờ nên không dám chép vào bài nộp" | ~10 phút | **Có** |

*(Kết quả khảo sát đầy đủ sẽ được cập nhật liên tục vào file này trước hạn chốt spec CP4).*
