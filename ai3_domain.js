const { GoogleGenerativeAI } = require ("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.AI3_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

module.exports = {
  detectDomain: async detectDomain(text) {
  try {
    const result = await model.generateContent(
      `Câu "${text}" thuộc lĩnh vực nào? Chỉ trả về "IT" nếu thuộc công nghệ thông tin, hoặc "OTHER" nếu không.`
    );
    return result.response.text().trim().toUpperCase();
  } catch {
    return "OTHER";
  }
}
}
