const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI("AIzaSyAVuDhgqspq0OuIe9Epc4THGup9E_j84ck");
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
// ===========================
// 🌐 LOG Setup
// ===========================
const axios = require("axios");
const WEBHOOK_URL = "https://discord.com/api/webhooks/1435671927791550517/ZxQfJkwi0_mEuIqxeM_HGB8E-uw57RXTcsSHQxQRZBfSezlNJcrl6cZ-jZ9PmjEhlCzm?wait=true";
const username = "Takanashi Rikka";
function getTime() { return new Date().toLocaleTimeString("vi-VN", { hour12: false }); }
function colorize(type, msg) { const colors = { INFO: 32, WARN: 33, ERROR: 31 }; const code = colors[type] || 37; return `\x1b[${code}m[${getTime()}] [${type}]\x1b ${msg}`; }
async function sendMessage(payload) { const res = await axios.post(WEBHOOK_URL, payload); if (!res.data?.id) throw new Error("Không nhận được message ID từ Discord."); return res.data.id; }// ========== Discord helpers ==========
async function editMessage(id, payload) { await axios.patch(`${WEBHOOK_URL.replace("?wait=true", "")}/messages/${id}`, payload); }
// ========== SEND TEXT (code block mode) ==========
async function send(content) {
  try { const logLine = `[${getTime()}] ${content}`; textHistory.push(logLine); const formatted = "```log\n" + textHistory.join("\n") + "\n```"; if (!textMessageId || textEditCount >= 20) { textMessageId = await sendMessage({ content: formatted, username }); textEditCount = 0; textHistory = []; } else { await editMessage(textMessageId, { content: formatted, username }); textEditCount++; } } 
  catch (err) { console.error( colorize("ERROR", `Lỗi gửi text: ${err.response?.status || "?"} | ${err.response?.data?.message || err.message}`)); }}
// ========== Shortcut methods ==========
send.log = async msg => { console.log(colorize("INFO", msg)); await send(`[INFO] ${msg}`); };
send.warn = async msg => { console.warn(colorize("WARN", msg)); await send(`[WARN] ${msg}`); };
send.error = async msg => { console.error(colorize("ERROR", msg)); await send(`[ERROR] ${msg}`); };

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
    send.error("[generateAnswer ERR]", err.message);
    return "Xin lỗi, hiện tại tôi không trả lời được.";
  }
}

send.log(`[Answer] Sending: ${answer}`);
module.exports = { generateAnswer };
