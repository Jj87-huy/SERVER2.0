const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI("AIzaSyAmC9yci8D3f0dZLN8mb8OxXnwn9upo7TY");
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

async function checkSanity(text) {
  try {
    const prompt = `
Hãy đánh giá câu sau: "${text}"

Mục tiêu:
- success = true nếu câu vô nghĩa, troll, nhảm, không phù hợp, spam hoặc thật sự không thể hiểu.
- success = false nếu câu hợp lệ, có ý nghĩa hoặc là câu hỏi bình thường.
- reply = phản hồi ngắn gọn bằng tiếng Việt (1 câu).

Chỉ trả về JSON **đúng cấu trúc sau, không thêm ký tự thừa**:
{"success": true/false, "reply": "text"}
    `;

    const result = await model.generateContent(prompt);
    let output = (await result.response.text()).trim();

    // ✅ Clean các ký tự có thể gây lỗi JSON (vd: ```json)
    output = output.replace(/```json|```/gi, "").trim();

    // ✅ Tránh AI trả lời thừa text ngoài JSON → chỉ lấy JSON đầu tiên
    const jsonMatch = output.match(/\{[\s\S]*\}/);
    if (jsonMatch) output = jsonMatch[0];

    // ✅ Parse JSON an toàn
    try {
      const parsed = JSON.parse(output);

      return {
        success: typeof parsed.success === "boolean" ? parsed.success : true,
        reply: parsed.reply || "",
      };
    } catch (e) {
      send.warn("[checkSanity] JSON parse failed:", output);
      return {
        success: true,
        reply: output,
      };
    }

  } catch (err) {
    send.error("[checkSanity ERR]", err.message);
    return { success: true, reply: "" };
  }
}

send.log(`[Sanity] Sending: ${output}`);
module.exports = { checkSanity };
