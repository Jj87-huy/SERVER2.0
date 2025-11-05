const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.AI4_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

async function checkSanity(text) {
  try {
    const prompt = `Đánh giá xem câu "${text}" có vô nghĩa, troll hoặc không phù hợp không.
Trả về JSON đúng định dạng sau:
{"isStupid": true/false, "reply": "phản hồi ngắn gọn bằng tiếng Việt"}`;

    const result = await model.generateContent(prompt);
    const output = await result.response.text();

    // Thử parse JSON
    try {
      const parsed = JSON.parse(output);
      return {
        isStupid: !!parsed.isStupid,
        reply: parsed.reply || "",
      };
    } catch {
      // Nếu model trả về text không chuẩn JSON
      return { isStupid: false, reply: output.trim() };
    }
  } catch (err) {
    console.error("[checkSanity ERR]", err);
    return { isStupid: false, reply: "" };
  }
}

module.exports = { checkSanity };
