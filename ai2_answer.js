const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI("AIzaSyAbcO9qrxxI-43NPT2GwXgz5u1Yai2PQuA");
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

async function generateAnswer(text) {
  try {
    const prompt = `Trả lời ngắn gọn, dễ hiểu cho câu: "${text}".`;
    const result = await model.generateContent(prompt);
    const answer = (await result.response.text()).trim();
    return answer || "Xin lỗi, hiện tại tôi không có câu trả lời phù hợp.";
  } catch (err) {
    console.error("[generateAnswer ERR]", err);
    return "Xin lỗi, hiện tại tôi không trả lời được.";
  }
}

module.exports = { generateAnswer };
