// analyze-text.js
const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI("AIzaSyAGZcayD9G0-j0CMyOI9Znwd2U19_rpvR4");
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

const dup = {
  "cooling fan":"cpu fan"
};

async function analyzeText(text) {
  try {
    const prompt = `Phân tích ý chính của câu (VD ý chính: Quạt CPU) "${text}".
     LƯU Ý:
    - dịch ý chính vừa tìm sang tiếng anh.
    - lấy "${dup}" nếu có từ giống, không thì tiếp tục.
    - Không viết gì thêm sau tên.`;
    const result = await model.generateContent(prompt);
    const keywords = (await result.response.text()).trim();
    return keywords || "không có từ khóa";
  } catch (err) {
    console.error("[AI1/analyzeText]❌", err.message);
    return "phân tích lỗi";
  }
}

module.exports = { analyzeText };
