const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI("AIzaSyCdDHI06dI8RgyLN2FG0wEpwe2qK6C1yHM");
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

async function detectDomain(text) {
  try {
    const prompt = `Câu "${text}" thuộc lĩnh vực nào?
Chỉ trả về một trong hai từ:
- "IT" nếu liên quan đến công nghệ thông tin, máy tính, AI, phần mềm, phần cứng...
- "OTHER" nếu không.`;

    const result = await model.generateContent(prompt);
    const output = (await result.response.text()).trim().toUpperCase();

    // 🔍 Chuẩn hóa kết quả
    if (output.includes("IT")) return "IT";
    return "OTHER";
  } catch (err) {
    console.error("[detectDomain ERR]", err);
    return "OTHER";
  }
}

module.exports = { detectDomain };
