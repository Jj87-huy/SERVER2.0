const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI("AIzaSyA4utCzVBb3cejvsg1_HeHBVLPjw6ZkoU8");
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

async function detectDomain(text) {
  try {
    const prompt = `
Phân loại lĩnh vực của câu sau: "${text}"

Chỉ trả về DUY NHẤT một trong hai từ:
- IT
- OTHER

Quy tắc:
- Trả về IT nếu câu liên quan đến máy tính, phần cứng, phần mềm, lỗi máy, sửa PC, mạng, công nghệ, thiết bị điện tử, game lỗi, hệ điều hành, IT support.
- Hiểu cả từ lóng, sai chính tả, viết tắt, ngôn ngữ Gen Z (vd: pc lag vl, win lỗi, ko boot, máy đơ, game crash).
- Tuyệt đối không trả về thêm bất kỳ ký tự nào khác.
- Không giải thích.
    `;

    const result = await model.generateContent(prompt);
    let output = (await result.response.text()).trim().toUpperCase();

    // ✅ Loại bỏ toàn bộ ký tự không phải chữ cái để tránh lỗi output
    // (ví dụ: "IT.", "IT ✅", "IT domain", "=> IT")
    output = output.replace(/[^A-Z]/g, "").trim();

    // ✅ Chuẩn hóa mạnh
    if (output === "IT") return "IT";
    return "OTHER";
  } catch (err) {
    send.error("[detectDomain ERR]", err.message);
    return "OTHER";
  }
}

send.log(`[Domain] Domain: ${output}`)
module.exports = { detectDomain };
