const { GoogleGenerativeAI } = require("@google/generative-ai");

// 🔑 Dùng key từ biến môi trường hoặc fallback
const genAI = new GoogleGenerativeAI("AIzaSyAbcO9qrxxI-43NPT2GwXgz5u1Yai2PQuA");
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

async function generateAnswer(text) {
  try {
    const prompt = `
Trả lời cho câu hỏi: "${text}".
Yêu cầu:
- Viết câu trả lời bằng tiếng Việt, tự nhiên, dễ hiểu.
- Không dùng danh sách, bullet, markdown hoặc ký hiệu như *, **, -, •.
    `;

    const result = await model.generateContent(prompt);
    let answer = (await result.response.text()).trim();

    // 🧹 Làm sạch định dạng
    answer = answer
      .replace(/\*\*/g, "")
      .replace(/^\s*[-*•]+\s*/gm, "")
      .replace(/\n{2,}/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    return answer || "Xin lỗi, hiện tại tôi không có câu trả lời phù hợp.";
  } catch (err) {
    console.error("[generateAnswer ERR]", err);
    return "Xin lỗi, hiện tại tôi không trả lời được.";
  }
}

module.exports = { generateAnswer };
