const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI("AIzaSyANjA9tNSStsTPzSUy6xByzDi_33UxlfIY");
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

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
      console.warn("[checkSanity] JSON parse failed:", output);
      return {
        success: true,
        reply: output,
      };
    }

  } catch (err) {
    console.error("[checkSanity ERR]", err.message);
    return { success: true, reply: "" };
  }
}

module.exports = { checkSanity };
