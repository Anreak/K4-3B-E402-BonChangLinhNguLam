// Cloudflare Worker: proxy giữa VLearn Tutor (client tĩnh trên GitHub Pages) và OpenRouter API.
// Giữ OPENROUTER_API_KEY phía server (Cloudflare secret) để key không bao giờ lộ ra browser,
// đồng thời tránh lỗi CORS khi gọi thẳng openrouter.ai từ client.

const SLIDE_CONTEXT = `
[Trang 1]
Chào mừng bạn đến với khóa học AI Engineering & Product. Trong ngày học đầu tiên, bạn sẽ làm quen với các khái niệm cốt lõi:
- Next-Token Prediction: Cơ chế dự đoán xác suất từ tiếp theo của các mô hình ngôn ngữ lớn.
- Token Economy: Khái niệm về token, cách tính chi phí và độ trễ khi gọi model qua API.
- Thực hành: Gọi mô hình GPT-4o, Claude 3.5 Sonnet và đo lường latency P90/P99.

[Trang 5]
Trọng tâm kỹ thuật tạo nên sự đột phá của LLM nằm ở cơ chế Self-Attention:
"Cơ chế Self-Attention cho phép mô hình cân nhắc mối tương quan ngữ nghĩa giữa tất cả các từ trong câu đồng thời, loại bỏ điểm nghẽn xử lý tuần tự của các mạng RNN/LSTM cũ."
- Multi-Head Attention: Chia không gian vector thành nhiều chiều quan sát độc lập.
- Positional Encoding: Gắn thông tin vị trí vào từng token trước khi đưa vào khối xử lý.

[Trang 7]
Trong các sản phẩm AI thực tế, chi phí vận hành gắn liền trực tiếp với số lượng token:
"Chi phí của một lời gọi API thường được tính dựa trên số lượng Input Tokens và Output Tokens. Thông thường, giá của Output Tokens cao hơn Input Tokens từ 2 đến 4 lần do chi phí tính toán autoregressive sinh từng từ."
- Input Tokens: Prompt câu hỏi, tài liệu ngữ cảnh RAG.
- Output Tokens: Câu trả lời được mô hình sinh ra theo từng bước.
- KV-Cache: Kỹ thuật đệm bộ nhớ giúp giảm thiểu tính toán lặp lại.

[Trang 14]
Context: bàn làm việc có hạn của model
Mỗi lần trả lời, model chỉ nhìn được một lượng chữ có hạn — gọi là context. Hãy hình dung một bàn làm việc: mọi thứ muốn model "thấy" phải bày lên bàn.
Quy đổi: 128K token ≈ một cuốn sách 300 trang; 1M token ≈ 4–5 cuốn sách trên bàn cùng lúc.
Bàn đầy quá thì đồ ở giữa bàn dễ bị bỏ sót — đặt điều quan trọng ở giữa một prompt rất dài, model có thể "quên" mất.

[Trang 17]
Tham số (parameter): những "khớp nối" model học được
Sau khi luyện xong, những gì model "biết" nằm trong các con số cố định bên trong gọi là tham số — hãy hình dung như khớp nối thần kinh: luyện càng kỹ, các khớp nối càng được siết đúng.
Tham số không phải thứ bạn chỉnh khi dùng model — nó được đóng gói sẵn trong "bộ não" (file weights). Bạn chỉ chỉnh được context và các núm vặn lúc gọi (như temperature).
- 2020 — GPT-3: 175 tỷ tham số, một "bác sĩ đa năng" — mọi token đều đi qua toàn bộ khớp nối (dense).
- 2026 — Kimi K3: 2.800 tỷ tham số, một "bệnh viện đa khoa" — mỗi token chỉ gọi vài chuyên gia (MoE).

[Trang 20]
Giới hạn bẩm sinh: học giả trong bong bóng
- Bong bóng thời gian: model bị "đóng băng" tại ngày ngừng đọc — chuyện sau đó nó không biết trừ khi bạn cung cấp thêm (knowledge cutoff).
- Nói chắc như đúng rồi: model tối ưu cho câu nghe hợp lý, không phải tra sự thật — nên có thể tự tin mà sai (hallucination).
- Bàn làm việc có hạn: context có trần; quá dài vừa tốn tiền vừa dễ bỏ sót thông tin ở giữa.

[Trang 23]
Từ LLM đến agent: bốn mức độ — mỗi bậc thêm một năng lực
- Level 0 — Bộ não suy luận: LLM trần — không công cụ, không dữ liệu mới.
- Level 1 — Có kết nối: + tools (search web, đọc database, gọi API) — vượt khỏi bong bóng thời gian.
- Level 2 — Biết lập kế hoạch: + tự chia mục tiêu thành nhiều bước, dùng nhiều tool nối tiếp, tự kiểm tra kết quả từng bước.
- Level 3 — Đội agent phối hợp: + nhiều agent chuyên biệt chia việc như một đội ngũ (multi-agent).

[Trang 26]
Chọn model theo TẦNG, không chọn theo tên
Hai lỗi đối xứng: việc đơn giản mà gọi frontier → phí tiền; việc khó mà cố dùng rẻ → kết quả tệ.
- Tầng 1 — Frontier đóng: đắt nhất — chỉ trả cho việc thật sự khó.
- Tầng 2 — Rẻ mà mạnh (mặc định thử tầng này trước): giải quyết đa số việc hằng ngày.
- Tầng 3 — Self-host / siêu rẻ: khi cần kiểm soát dữ liệu hoặc chi phí quy mô lớn.

[Trang 28]
Giải phẫu một prompt: bốn lớp xếp chồng
- Lớp 1 — System instruction: "lời dặn đầu ca" — model là ai, cư xử thế nào, không được làm gì.
- Lớp 2 — User input: câu hỏi/yêu cầu của người dùng trong lượt này.
- Lớp 3 — Context bổ sung: tài liệu, lịch sử chat, dữ liệu tra sổ — phần bày lên "bàn làm việc".
- Lớp 4 — Output mong muốn: dạng kết quả mong muốn — gạch đầu dòng? bảng? JSON? dài bao nhiêu?

[Trang 29]
Hai núm vặn chọn từ: temperature & top_p
Lưu ý quan trọng: hai núm này không làm model thông minh hơn — chỉ đổi cách chọn từ, không thêm tri thức.
- temperature — "núm vặn độ liều": T=0 luôn chọn từ chắc nhất (ổn định, hợp code & phân tích); T=1 cân bằng tự nhiên; T=2 phân bố phẳng ra, dễ "lạc đề".
- top_p — "chỉ xem top đầu bảng" (p=0.9): chỉ giữ nhóm từ có xác suất cộng dồn ≥ 90%, các từ đuôi xác suất thấp bị loại khỏi lựa chọn.
`.trim();

const SYSTEM_INSTRUCTION = `Bạn là VLearn Tutor, trợ giảng AI cho khóa học "AI Engineering & Product", buổi Day 01 (LLM Foundation).

Bạn CHỈ được dùng đúng nội dung 10 đoạn slide dưới đây (Trang 1, 5, 7, 14, 17, 20, 23, 26, 28, 29) làm nguồn duy nhất để trả lời. Tuyệt đối không bịa thêm kiến thức ngoài các đoạn này, kể cả khi bạn biết câu trả lời từ nguồn khác.

=== NGUỒN TÀI LIỆU (DUY NHẤT) ===
${SLIDE_CONTEXT}
=== HẾT NGUỒN TÀI LIỆU ===

Quy tắc quyết định:
- ANSWER_WITH_CITE: dùng khi câu hỏi có thể trả lời rõ ràng, đầy đủ dựa trên đúng một đoạn slide (Trang 1, 5, 7, 14, 17, 20, 23, 26, 28 hoặc 29). "citation_page" là số trang đó.
- CLARIFY: dùng khi câu hỏi quá ngắn/mơ hồ hoặc có thể ánh xạ tới nhiều hơn một cách hiểu/đoạn nội dung. "answer" là lời giải thích ngắn vì sao cần làm rõ, "clarify_options" là mảng 2-3 lựa chọn ngắn gọn (chuỗi text, viết như một câu hỏi cụ thể hơn) để người dùng chọn, "citation_page" = null.
- OUT_OF_SCOPE: dùng khi câu hỏi hoàn toàn không có căn cứ trong 10 đoạn slide trên (ví dụ hỏi về lịch thi, phòng ốc, thông tin hành chính, hoặc kiến thức ngoài phạm vi các đoạn). "answer" là lời từ chối lịch sự, "citation_page" = null.

Bạn PHẢI trả lời đúng và chỉ bằng một object JSON thuần (không markdown, không code fence, không giải thích thêm) theo schema sau:
{"decision": "ANSWER_WITH_CITE" | "CLARIFY" | "OUT_OF_SCOPE", "answer": "...", "citation_page": 1 | 5 | 7 | 14 | 17 | 20 | 23 | 26 | 28 | 29 | null, "clarify_options": ["...", "..."]}

Lưu ý: "clarify_options" chỉ có giá trị khi decision = "CLARIFY"; các trường hợp khác để mảng rỗng [].`;

function extractJson(text) {
  try {
    return JSON.parse(text);
  } catch {
    // Model có thể bọc JSON trong ```json ... ``` hoặc thêm text thừa quanh — cố gắng tách phần {...}
    const match = text.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]);
    throw new Error('Không parse được JSON từ phản hồi model');
  }
}

function corsHeaders(origin) {
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

function jsonResponse(obj, status, origin) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) },
  });
}

export default {
  async fetch(request, env) {
    const allowedOrigin = env.ALLOWED_ORIGIN || '*';

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders(allowedOrigin) });
    }

    if (request.method !== 'POST') {
      return jsonResponse({ error: 'Method not allowed' }, 405, allowedOrigin);
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return jsonResponse({ error: 'Invalid JSON body' }, 400, allowedOrigin);
    }

    const question = body && typeof body.question === 'string' ? body.question.trim() : '';
    if (!question) {
      return jsonResponse({ error: 'Missing "question" field' }, 400, allowedOrigin);
    }

    try {
      const model = env.OPENROUTER_MODEL || 'nex-agi/nex-n2.5-mini:free';
      const orRes = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${env.OPENROUTER_API_KEY}`,
        },
        body: JSON.stringify({
          model,
          // temperature = 0: giảm dao động ngẫu nhiên giữa các lần gọi cho tác vụ phân loại
          // quyết định + trích dẫn (đúng khuyến nghị ở chính Trang 29: "T=0 ổn định, hợp phân tích").
          temperature: 0,
          messages: [
            { role: 'system', content: SYSTEM_INSTRUCTION },
            { role: 'user', content: question },
          ],
        }),
      });

      if (!orRes.ok) {
        const errText = await orRes.text();
        return jsonResponse({ error: `OpenRouter API error ${orRes.status}: ${errText}` }, 502, allowedOrigin);
      }

      const data = await orRes.json();
      const rawContent = data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;
      if (!rawContent) {
        return jsonResponse({ error: 'Empty response from OpenRouter' }, 502, allowedOrigin);
      }

      const parsed = extractJson(rawContent);
      if (!parsed || !parsed.decision) {
        return jsonResponse({ error: 'Missing "decision" field in AI response' }, 502, allowedOrigin);
      }

      // An toàn: chặn model trích dẫn số trang không thật (không nằm trong 10 trang nguồn).
      const VALID_PAGES = new Set([1, 5, 7, 14, 17, 20, 23, 26, 28, 29]);
      if (parsed.citation_page != null && !VALID_PAGES.has(parsed.citation_page)) {
        parsed.citation_page = null;
      }

      return jsonResponse(parsed, 200, allowedOrigin);
    } catch (err) {
      return jsonResponse({ error: err.message || 'Unknown server error' }, 500, allowedOrigin);
    }
  },
};
