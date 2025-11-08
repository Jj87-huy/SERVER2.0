
const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.AI2);
const model = genAI.getGenerativeModel({ model: process.env.MODELS });

// ✅ Cache đơn giản
const cache = new Map();
const MAX_CACHE = 100;

async function generateAnswer(text, tone = "lich-su") {
  try {
    // ✅ 1. Cache
    const cacheKey = `${text}|${tone}`;
    if (cache.has(cacheKey)) return cache.get(cacheKey);

    // ✅ 2. Prompt duy nhất — AI tự nhận diện hết
    const prompt = `
Bạn là trợ lý AI tiếng Việt.
Hãy trả lời câu hỏi: "${text}"

Yêu cầu rất quan trọng:
- Trả lời bằng tiếng Việt, 1–2 câu, tự nhiên, dễ hiểu.
- Tuyệt đối không dùng bullet, không markdown, không ký hiệu như *, -, •.
- Không xuống dòng, chỉ trả lời một đoạn văn.
- Nếu câu hỏi chứa nội dung nhạy cảm, độc hại, 18+, xúc phạm, hãy từ chối lịch sự.
- Tự động hiểu và xử lý từ lóng, viết tắt, ngôn ngữ Gen Z.
- Tự chọn giọng:
    + Nếu tone = "vui": giọng thân thiện, tươi vui, nhẹ nhàng.
    + Nếu tone = "lich-su": giọng lịch sự, nhã nhặn.
Trả về đúng câu trả lời, không giải thích quy tắc.
    `;

    const result = await model.generateContent(prompt);
    let answer = (await result.response.text()).trim();

    // ✅ Làm sạch đơn giản
    answer = answer
      .replace(/\*\*/g, "")
      .replace(/[*•\-]+/g, "")
      .replace(/\n+/g, " ")
      .replace(/\s{2,}/g, " ")
      .trim();

    if (!answer) {
      answer = "Xin lỗi, tôi chưa có câu trả lời phù hợp.";
    }

    // ✅ Lưu cache
    if (cache.size >= MAX_CACHE) {
      const firstKey = cache.keys().next().value;
      cache.delete(firstKey);
    }
    cache.set(cacheKey, answer);

    return answer;
  } catch (err) {
    console.error("[generateAnswer ERR]", err.message);
    return "Xin lỗi, hiện tại tôi không trả lời được.";
  }
}

module.exports = { generateAnswer };
