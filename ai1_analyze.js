
const { GoogleGenerativeAI } = require ("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.AI1_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

module.exports = {
  analyzeText: async analyzeText(text) {
  try {
    const result = await model.generateContent(`Phân tích câu "${text}" và trả về 3 từ khóa chính (giữ nguyên tiếng Việt).`);
    return result.response.text().trim();
  } catch {
    return "phân tích lỗi";
  }
}
}
