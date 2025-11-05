// analyze-text.js
const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI("AIzaSyAGZcayD9G0-j0CMyOI9Znwd2U19_rpvR4");
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

async function analyzeText(text) {
  try {
    const prompt = `Phân tích, định nghĩa ý chính của câu "${text}". LƯU Ý: phải nói ngắn gọn(VD: Định nghĩa Quạt CPU)`;
    const result = await model.generateContent(prompt);
    const keywords = (await result.response.text()).trim();
    return keywords || "không có từ khóa";
  } catch (err) {
    console.error("[AI1/analyzeText]❌", err.message);
    return "phân tích lỗi";
  }
}

module.exports = { analyzeText };
