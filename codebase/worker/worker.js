// Cloudflare Worker: proxy giữa VLearn Tutor (client tĩnh trên GitHub Pages) và OpenRouter API.
// Giữ OPENROUTER_API_KEY phía server (Cloudflare secret) để key không bao giờ lộ ra browser,
// đồng thời tránh lỗi CORS khi gọi thẳng openrouter.ai từ client.
//
// Nguồn nội dung: data/vlearn-pack/slides/d1-slide-hackathon.pdf ("AI & LLM Foundation" — Day 01).
// Bộ 29 trang gốc đã được chọn lọc xuống 15 trang cốt lõi để giảm chi phí token.
//
// Retrieval nhẹ (lightweight retrieval): thay vì nạp nguyên văn cả 15 trang vào mọi request
// (full-context stuffing như bản trước), mỗi câu hỏi được chấm điểm liên quan (keyword overlap,
// không dùng embedding/vector DB) để chỉ chọn ra top-K trang khả năng liên quan nhất. Toàn bộ
// 15 tiêu đề (mục lục) luôn được gửi kèm — rẻ — để model còn biết phạm vi tài liệu ngay cả khi
// không trang nào khớp từ khóa, giúp model quyết định CLARIFY/OUT_OF_SCOPE đúng thay vì bịa.

const SLIDES = [
  { page: 1, heading: `AI & LLM Foundation`, text: `AI & LLM Foundation
Bạn đang dùng AI mỗi ngày — nhưng thực sự bên trong nó đang làm gì?` },
  { page: 3, heading: `AI, ML, Deep Learning, GenAI, LLM — nằm ở đâu trong cùng một hệ?`, text: `AI, ML, Deep Learning, GenAI, LLM — nằm ở đâu trong cùng một hệ?
- AI — chiếc ô lớn nhất: mọi hệ thống có yếu tố "thông minh".
- Machine learning — học từ dữ liệu thay vì viết luật tay.
- Deep learning — mạng nơ-ron nhiều tầng tự học đặc trưng.
- Generative AI — sinh nội dung mới: văn bản, ảnh, code.
- LLM — model nền chuyên ngôn ngữ, tim của làn sóng hiện nay.` },
  { page: 4, heading: `Ba nhóm AI chính: phân loại · sinh nội dung · hành động`, text: `Ba nhóm AI chính: phân loại · sinh nội dung · hành động
- Discriminative AI: giỏi phân loại, dự đoán — lọc spam, phát hiện gian lận, nhận diện ảnh. Input → một nhãn, một con số.
- Generative AI: sinh ra thứ mới — văn bản, ảnh, code. ChatGPT, Claude, Midjourney. Prompt → nội dung mới.
- Agentic AI: nhận mục tiêu rồi tự làm nhiều bước — lập kế hoạch, dùng công cụ, hành động. Goal → Plan → Action.` },
  { page: 5, heading: `Lịch sử AI 70 năm`, text: `Lịch sử AI 70 năm
- 1956 — Dartmouth Workshop: khai sinh, lời hứa đầu tiên.
- 1966–1993 — hai lần mùa đông AI, cách tiếp cận chạm trần (Perceptrons 1969, báo cáo Lighthill 1973, hệ chuyên gia 1980, sụp đổ Lisp machine 1987).
- 2006 — Deep Learning; 2012 — AlexNet; 2016 — AlphaGo; 2017 — Transformer; 2018 — GPT-1/BERT; 2022 — ChatGPT; 2024 — Kỷ nguyên Agent; 2026 — hiện tại.` },
  { page: 10, heading: `LLM là gì? — một bộ não nền, không phải một chatbot`, text: `LLM là gì? — một bộ não nền, không phải một chatbot
LLM (Large Language Model) là một mô hình ngôn ngữ rất lớn, thường dựa trên kiến trúc Transformer, được luyện trên hàng nghìn tỷ mảnh chữ để học cách đoán mảnh chữ tiếp theo trong ngữ cảnh.
Nhờ được luyện đủ rộng, nó trở thành một nền chung: thay vì mỗi việc train một model riêng, cùng một model làm được rất nhiều việc.
Chatbot chỉ là một dạng sản phẩm đóng gói quanh bộ não đó — lớp áo bên ngoài.
- Chatbot · Tóm tắt tài liệu · Viết code · Dịch & phân tích — tất cả dùng chung 1 model nền (LLM).` },
  { page: 11, heading: `Bên trong Transformer: đầu ra luôn là một phân bố xác suất`, text: `Bên trong Transformer: đầu ra luôn là một phân bố xác suất
Ví dụ: "Behold, a wild pi creature, foraging in its native ___" — model chấm điểm MỌI từ trong từ vựng: "land" 22%, "forest" 9%, "country" 5%... rồi chọn theo xác suất đó.` },
  { page: 13, heading: `Token: model không đọc "từ", model đọc mảnh chữ`, text: `Token: model không đọc "từ", model đọc mảnh chữ
Model không nhìn từ nguyên vẹn. Nó cắt văn bản thành các mảnh nhỏ gọi là token: có từ là một mảnh, có từ vỡ ba bốn mảnh, cả dấu câu và khoảng trắng cũng là mảnh.
- Ví dụ: "Hello world" ≈ 2 token, nhưng "Xin chào" có thể tới 3–4 token.
- Tiếng Việt, code, JSON tốn token hơn tiếng Anh thường — vì dấu thanh, ký tự đặc biệt và cấu trúc bị cắt nhỏ ra.` },
  { page: 14, heading: `Context: bàn làm việc có hạn của model`, text: `Context: bàn làm việc có hạn của model
Mỗi lần trả lời, model chỉ nhìn được một lượng chữ có hạn — gọi là context. Hãy hình dung một bàn làm việc: mọi thứ muốn model "thấy" phải bày lên bàn.
Quy đổi: 128K token ≈ một cuốn sách 300 trang; 1M token ≈ 4–5 cuốn sách trên bàn cùng lúc.
Bàn đầy quá thì đồ ở giữa bàn dễ bị bỏ sót — đặt điều quan trọng ở giữa một prompt rất dài, model có thể "quên" mất.` },
  { page: 15, heading: `Attention: mỗi từ được "nhìn sang" những từ quan trọng khác`, text: `Attention: mỗi từ được "nhìn sang" những từ quan trọng khác
Thay vì đọc tuần tự từng chữ, cơ chế attention cho phép mỗi token:
- Chủ động "quay đầu" nhìn lại các token trước đó trong câu.
- Chấm điểm mức độ liên quan của từng token đối với nghĩa của mình.
- Khóa nghĩa theo ngữ cảnh — "nó" là quyển sách hay cái túi, tùy theo nó chú ý vào từ nào.` },
  { page: 17, heading: `Tham số (parameter): những "khớp nối" model học được`, text: `Tham số (parameter): những "khớp nối" model học được
Sau khi luyện xong, những gì model "biết" nằm trong các con số cố định bên trong gọi là tham số — hãy hình dung như khớp nối thần kinh: luyện càng kỹ, các khớp nối càng được siết đúng.
Tham số không phải thứ bạn chỉnh khi dùng model — nó được đóng gói sẵn trong "bộ não" (file weights). Bạn chỉ chỉnh được context và các núm vặn lúc gọi (như temperature).
- 2020 — GPT-3: 175 tỷ tham số, một "bác sĩ đa năng" — mọi token đều đi qua toàn bộ khớp nối (dense).
- 2026 — Kimi K3: 2.800 tỷ tham số, một "bệnh viện đa khoa" — mỗi token chỉ gọi vài chuyên gia (MoE).` },
  { page: 18, heading: `LLM được tạo ra như thế nào? — đọc nhiều, được chỉ, được uốn nắn, luyện đề`, text: `LLM được tạo ra như thế nào? — đọc nhiều, được chỉ, được uốn nắn, luyện đề
- ① Pre-training — "đọc cả thư viện": học tiếng nói và kiến thức từ hàng nghìn tỷ token.
- ② SFT — "được chỉ cách trả lời": học theo ví dụ mẫu để ra dáng trợ lý.
- ③ RLHF/DPO — "được uốn nắn": học theo phản hồi con người, an toàn và dễ chịu hơn.
- ④ Luyện suy luận (từ ~2025) — "giải đề tự chấm": luyện toán/code có đáp án kiểm chứng được, model biết làm nháp trước khi trả lời.` },
  { page: 20, heading: `Giới hạn bẩm sinh: học giả trong bong bóng`, text: `Giới hạn bẩm sinh: học giả trong bong bóng
- Bong bóng thời gian: model bị "đóng băng" tại ngày ngừng đọc — chuyện sau đó nó không biết trừ khi bạn cung cấp thêm (knowledge cutoff).
- Nói chắc như đúng rồi: model tối ưu cho câu nghe hợp lý, không phải tra sự thật — nên có thể tự tin mà sai (hallucination).
- Bàn làm việc có hạn: context có trần; quá dài vừa tốn tiền vừa dễ bỏ sót thông tin ở giữa.` },
  { page: 23, heading: `Từ LLM đến agent: bốn mức độ — mỗi bậc thêm một năng lực`, text: `Từ LLM đến agent: bốn mức độ — mỗi bậc thêm một năng lực
- Level 0 — Bộ não suy luận: LLM trần — không công cụ, không dữ liệu mới.
- Level 1 — Có kết nối: + tools (search web, đọc database, gọi API) — vượt khỏi bong bóng thời gian.
- Level 2 — Biết lập kế hoạch: + tự chia mục tiêu thành nhiều bước, dùng nhiều tool nối tiếp, tự kiểm tra kết quả từng bước.
- Level 3 — Đội agent phối hợp: + nhiều agent chuyên biệt chia việc như một đội ngũ (multi-agent).` },
  { page: 27, heading: `Token có giá: vé vào rẻ, vé ra đắt gấp 3–5 lần`, text: `Token có giá: vé vào rẻ, vé ra đắt gấp 3–5 lần
Ví dụ hóa đơn 1 lần gọi API: input 1.150 token × $3/1M = $0.00345; output 200 token × $15/1M = $0.00300; tổng ≈ $0.0065.
Đọc mục usage trong mỗi response — đó là hóa đơn chi tiết giúp bạn kiểm soát chi phí từ ngày đầu.
- Vé vào — Input ×1: chữ BẠN gửi đi (prompt, system instruction, context, lịch sử chat) — rẻ vì model chỉ cần đọc.
- Vé ra — Output ×3–5: chữ MODEL viết ra — nó phải tự sinh từng mảnh một, vừa chậm vừa tốn — đắt vì model phải "vắt óc".` },
  { page: 29, heading: `Hai núm vặn chọn từ: temperature & top_p`, text: `Hai núm vặn chọn từ: temperature & top_p
Lưu ý quan trọng: hai núm này không làm model thông minh hơn — chỉ đổi cách chọn từ, không thêm tri thức.
- temperature — "núm vặn độ liều": T=0 luôn chọn từ chắc nhất (ổn định, hợp code & phân tích); T=1 cân bằng tự nhiên; T=2 phân bố phẳng ra, dễ "lạc đề".
- top_p — "chỉ xem top đầu bảng" (p=0.9): chỉ giữ nhóm từ có xác suất cộng dồn ≥ 90%, các từ đuôi xác suất thấp bị loại khỏi lựa chọn.` }
];

const TOTAL_PAGES = SLIDES.length; // 15
const TOP_K = 5; // số trang tối đa được nạp nội dung chi tiết mỗi request

// ---- Retrieval nhẹ: chấm điểm theo số từ khóa trùng (bag-of-words overlap) ----
const STOPWORDS = new Set([
  'là', 'của', 'và', 'có', 'trong', 'cho', 'này', 'đó', 'một', 'các', 'những',
  'để', 'với', 'khi', 'thì', 'mà', 'ở', 'ra', 'về', 'như', 'được', 'bạn', 'mình',
  'tôi', 'gì', 'sao', 'nào', 'làm', 'dùng', 'cái', 'hay', 'không', 'đang', 'từ',
  'trên', 'sau', 'trước', 'nếu', 'nên', 'vì', 'nó', 'em', 'anh', 'ạ', 'nhé', 'à',
  // Từ chung chung dễ gây nhiễu (đặc biệt các câu hỏi hành chính ngoài phạm vi
  // như "lịch thi", "phòng ốc" -- theo đúng định nghĩa OUT_OF_SCOPE trong spec):
  'ngày', 'giờ', 'mai', 'tối', 'sáng', 'chiều', 'tuần', 'tháng', 'phòng',
  'thời', 'gian', 'bao', 'nhiêu', 'mấy', 'ơi', 'nhỉ', 'vậy', 'đâu', 'ai',
]);

function tokenize(text) {
  return text
    .toLowerCase()
    .replace(/[.,!?;:"'()\-–—""''`]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length >= 2 && !STOPWORDS.has(t));
}

function scoreSlide(queryTokens, slide) {
  const headingTokens = tokenize(slide.heading);
  const bodyTokens = tokenize(slide.text);
  let score = 0;
  for (const qt of queryTokens) {
    score += headingTokens.filter((t) => t === qt).length * 3;
    score += bodyTokens.filter((t) => t === qt).length;
  }
  return score;
}

// Trả về mảng slide được chọn (có thể rỗng nếu câu hỏi không khớp từ khóa nào)
function retrieveRelevantSlides(question) {
  const queryTokens = tokenize(question);
  if (queryTokens.length === 0) return [];
  const scored = SLIDES.map((s) => ({ slide: s, score: scoreSlide(queryTokens, s) }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score);
  return scored.slice(0, TOP_K).map((x) => x.slide);
}

function buildIndexText() {
  return SLIDES.map((s) => `- Trang ${s.page}: ${s.heading}`).join('\n');
}

function buildDetailText(selectedSlides) {
  return selectedSlides.map((s) => `[Trang ${s.page}] ${s.text}`).join('\n\n');
}

function buildSystemInstruction(question) {
  const selected = retrieveRelevantSlides(question);
  const selectedPages = selected.map((s) => s.page);
  const indexText = buildIndexText();
  const detailText = selected.length > 0
    ? buildDetailText(selected)
    : '(Không trang nào khớp từ khóa với câu hỏi này — có thể câu hỏi mơ hồ hoặc ngoài phạm vi tài liệu.)';

  const instruction = `Bạn là VLearn Tutor, trợ giảng AI cho khóa học "AI Engineering & Product", buổi Day 01 (AI & LLM Foundation).

QUY TẮC NGÔN NGỮ (áp dụng cho MỌI trường hợp, không có ngoại lệ): dù câu hỏi của học viên được gõ bằng ngôn ngữ nào (tiếng Anh, tiếng Trung, tiếng Việt không dấu, v.v.), toàn bộ nội dung trong trường "answer" và "clarify_options" PHẢI được viết bằng tiếng Việt tự nhiên, có dấu đầy đủ. Không được trả lời bằng tiếng Anh, tiếng Trung hay bất kỳ ngôn ngữ nào khác.

Tài liệu gốc có ${TOTAL_PAGES} trang. Dưới đây là MỤC LỤC đầy đủ (chỉ tiêu đề) và NỘI DUNG CHI TIẾT của các trang được hệ thống truy xuất (retrieval) là khả năng liên quan nhất tới câu hỏi hiện tại.

=== MỤC LỤC (${TOTAL_PAGES} TRANG) ===
${indexText}
=== HẾT MỤC LỤC ===

=== NỘI DUNG CHI TIẾT (CÁC TRANG ĐƯỢC TRUY XUẤT CHO CÂU HỎI NÀY) ===
${detailText}
=== HẾT NỘI DUNG CHI TIẾT ===

Quy tắc quyết định — CLARIFY và OUT_OF_SCOPE dễ nhầm nhau, đọc kỹ ranh giới sau:

- ANSWER_WITH_CITE: CHỈ dùng khi câu hỏi có thể trả lời rõ ràng, đầy đủ dựa trên đúng một trang có mặt trong phần NỘI DUNG CHI TIẾT ở trên. Tuyệt đối không bịa thêm kiến thức ngoài phần này, kể cả khi bạn biết câu trả lời từ nguồn khác, và kể cả khi trang đó có tên trong MỤC LỤC nhưng KHÔNG có trong NỘI DUNG CHI TIẾT. "citation_page" là số trang đó.

- CLARIFY: CHỈ dùng cho 2 trường hợp cụ thể sau, không dùng cho trường hợp khác:
  (a) Câu hỏi của người dùng tự nó quá ngắn/mơ hồ/dùng đại từ không rõ nghĩa (vd "cái này", "nó", một từ khóa đơn lẻ như "Token") — không đủ để xác định người dùng thực sự muốn hỏi gì, BẤT KỂ nội dung chi tiết có gì.
  (b) Câu hỏi đủ rõ nghĩa, và có từ 2 trang trở lên TRONG PHẦN NỘI DUNG CHI TIẾT (không phải chỉ trong mục lục) đều trả lời được một phần hợp lý cho câu hỏi, khiến không thể chọn chắc chắn một trang duy nhất.
  "answer" là lời giải thích ngắn vì sao cần làm rõ, "clarify_options" là mảng 2-3 lựa chọn ngắn gọn (viết như một câu hỏi cụ thể hơn) để người dùng chọn, "citation_page" = null.

- OUT_OF_SCOPE: dùng khi câu hỏi đủ rõ nghĩa nhưng KHÔNG có căn cứ trả lời đúng những gì được hỏi trong NỘI DUNG CHI TIẾT. QUAN TRỌNG: nếu nội dung chi tiết chỉ nhắc tới một chủ đề LIÊN QUAN chung chung (ví dụ trang nói về "Attention" nói chung) nhưng KHÔNG chứa đúng thuật ngữ/khái niệm cụ thể được hỏi (ví dụ hỏi riêng "Multi-Head Attention" hoặc "Positional Encoding" — những cụm từ này không xuất hiện trong nội dung), đây VẪN LÀ OUT_OF_SCOPE, không được dùng CLARIFY để né tránh. Tương tự, câu hỏi về lịch thi, phòng ốc, thông tin hành chính, hoặc kiến thức hoàn toàn ngoài phạm vi tài liệu cũng là OUT_OF_SCOPE. "answer" là lời từ chối lịch sự, nêu rõ tài liệu không có đúng khái niệm được hỏi, "citation_page" = null.

Khi câu hỏi đòi hỏi kiến thức tổng thể hoặc định nghĩa toàn diện mà nội dung chi tiết chỉ có các thành phần cục bộ (một vài bullet rời rạc), phải ra OUT_OF_SCOPE, tuyệt đối không chắp vá các bullet rời rạc lại để trả lời như một định nghĩa hoàn chỉnh, và cũng không né sang CLARIFY chỉ vì chủ đề nghe có vẻ liên quan.

Nhắc lại: "answer" và "clarify_options" luôn viết bằng tiếng Việt có dấu, bất kể câu hỏi đầu vào bằng ngôn ngữ gì.

Bạn PHẢI trả lời đúng và chỉ bằng một object JSON thuần (không markdown, không code fence, không giải thích thêm) theo schema sau:
{"decision": "ANSWER_WITH_CITE" | "CLARIFY" | "OUT_OF_SCOPE", "answer": "...", "citation_page": <số trang xuất hiện trong NỘI DUNG CHI TIẾT> | null, "clarify_options": ["...", "..."]}

Lưu ý: "clarify_options" chỉ có giá trị khi decision = "CLARIFY"; các trường hợp khác để mảng rỗng [].`;

  return { instruction, selectedPages };
}

// Bảo hiểm ngôn ngữ: một số model free-tier trên OpenRouter thỉnh thoảng phớt lờ
// chỉ dẫn ngôn ngữ trong system prompt và trả lời bằng tiếng Trung/Anh. Thay vì chỉ
// trông cậy vào prompt, ta kiểm tra thẳng ký tự Hán trong output và tự gọi lại model
// một lần để sửa, đảm bảo học viên luôn nhận câu trả lời tiếng Việt.
const CJK_REGEX = /[一-鿿㐀-䶿぀-ヿ]/;

function containsNonVietnameseScript(parsed) {
  if (!parsed) return false;
  const fields = [parsed.answer, ...(Array.isArray(parsed.clarify_options) ? parsed.clarify_options : [])];
  return fields.some((f) => typeof f === 'string' && CJK_REGEX.test(f));
}

function extractJson(text) {
  try {
    return JSON.parse(text);
  } catch {
    // Model có thể bọc JSON trong ```json ... ``` hoặc thêm text thừa quanh -- cố gắng tách phần {...}
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

    const model = env.OPENROUTER_MODEL || 'nex-agi/nex-n2.5-mini:free';

    async function callModel(messages) {
      const orRes = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${env.OPENROUTER_API_KEY}`,
        },
        // temperature = 0: ưu tiên ổn định/nhất quán cho tác vụ phân loại quyết định + trích dẫn
        // (đúng khuyến nghị ở chính Trang 29: "T=0 luôn chọn từ chắc nhất — ổn định, hợp phân tích").
        body: JSON.stringify({ model, temperature: 0, messages }),
      });

      if (!orRes.ok) {
        const errText = await orRes.text();
        throw new Error(`OpenRouter API error ${orRes.status}: ${errText}`);
      }

      const data = await orRes.json();
      const rawContent = data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;
      if (!rawContent) {
        throw new Error('Empty response from OpenRouter');
      }

      const parsed = extractJson(rawContent);
      if (!parsed || !parsed.decision) {
        throw new Error('Missing "decision" field in AI response');
      }
      return parsed;
    }

    try {
      const { instruction, selectedPages } = buildSystemInstruction(question);
      const baseMessages = [
        { role: 'system', content: instruction },
        { role: 'user', content: question },
      ];

      let parsed = await callModel(baseMessages);

      // Bảo hiểm ngôn ngữ: model free-tier đôi khi phớt lờ chỉ dẫn và trả lời bằng
      // tiếng Trung/Anh dù prompt đã yêu cầu tiếng Việt. Nếu phát hiện, gọi lại MỘT lần
      // với yêu cầu sửa ngôn ngữ, giữ nguyên nội dung/schema.
      if (containsNonVietnameseScript(parsed)) {
        try {
          const fixMessages = [
            ...baseMessages,
            { role: 'assistant', content: JSON.stringify(parsed) },
            {
              role: 'user',
              content: 'Câu trả lời trên bị sai ngôn ngữ (lẫn tiếng Trung/tiếng khác). Hãy trả lời lại TOÀN BỘ nội dung "answer" và "clarify_options" bằng tiếng Việt có dấu, giữ nguyên ý nghĩa, giữ đúng decision và citation_page, và giữ đúng schema JSON như đã hướng dẫn ở đầu.',
            },
          ];
          const fixed = await callModel(fixMessages);
          if (!containsNonVietnameseScript(fixed)) {
            parsed = fixed;
          }
        } catch {
          // Nếu lần gọi sửa lỗi thất bại, vẫn dùng kết quả gốc thay vì làm hỏng cả request.
        }
      }

      // An toàn: model chỉ được trích dẫn trang mà retrieval THỰC SỰ đã nạp nội dung chi tiết
      // cho request này -- chặn trường hợp model "nhớ nhầm" hoặc bịa số trang không có trong context.
      if (parsed.citation_page != null && !selectedPages.includes(parsed.citation_page)) {
        parsed.citation_page = null;
      }

      parsed.retrieved_pages = selectedPages;
      return jsonResponse(parsed, 200, allowedOrigin);
    } catch (err) {
      return jsonResponse({ error: err.message || 'Unknown server error' }, 500, allowedOrigin);
    }
  },
};
