const { GoogleGenerativeAI } = require ("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.AI4_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

module.exports = {
  checkSanity: async checkSanity(text) {
  try {
    const result = await model.generateContent(
      `Đánh giá xem câu "${text}" có vô nghĩa hoặc troll không. Trả về JSON: {"isStupid": true/false, "reply": "..."}.`
    );
    return JSON.parse(result.response.text());
  } catch {
    return { isStupid: false, reply: "" };
  }
}
}
