const { GoogleGenerativeAI } = require ("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.AI2_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

module.exports = {
  generateAnswer: async generateAnswer(text) {
  try {
    const result = await model.generateContent(`Trả lời ngắn gọn, dễ hiểu cho câu: "${text}".`);
    return result.response.text().trim();
  } catch {
    return "Xin lỗi, hiện tại tôi không trả lời được.";
  }
}
}
