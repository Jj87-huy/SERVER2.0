// analyze-text.js
const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI("AIzaSyAGZcayD9G0-j0CMyOI9Znwd2U19_rpvR4");
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

async function analyzeText(text) {
  try {
    const prompt = `Phân tích câu "${text}" và trả về 3 từ khóa chính (giữ nguyên tiếng Việt, phân tách bằng dấu phẩy).`;
    const result = await model.generateContent(prompt);
    const keywords = (await result.response.text()).trim();
    return keywords || "không có từ khóa";
  } catch (err) {
    console.error("[AI1/analyzeText]❌", err.message);
    return "phân tích lỗi";
  }
}

module.exports = { analyzeText };
