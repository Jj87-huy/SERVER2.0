// analyze-text.js
const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI("AIzaSyAGZcayD9G0-j0CMyOI9Znwd2U19_rpvR4");
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

const dup = {
  "cooling fan": "cpu fan",
  "graphics card": "gpu",
  "mainboard": "motherboard"
};

async function analyzeText(text) {
  try {
    const prompt = `Hãy phân tích ý chính của câu sau (ví dụ: ý chính là "Quạt CPU"): "${text}". 
    
    Quy tắc:
    - Chỉ xuất ra duy nhất ý chính (dạng danh từ).
    - Dịch ý chính sang tiếng Anh.
    - Nếu ý chính trùng từ trong danh sách này ${JSON.stringify(dup)}, 
      thì dùng giá trị thay thế tương ứng.
    - Không thêm giải thích hoặc ký tự nào khác ngoài từ khóa.`;
    const result = await model.generateContent(prompt);
    const keywords = (await result.response.text()).trim();
    for (const [key, val] of Object.entries(dup)) {
      if (keywords.includes(key)) return val;
    }
    return keywords || "không có từ khóa";
  } catch (err) {
    console.error("[AI1/analyzeText]❌", err.message);
    return "phân tích lỗi";
  }
}

module.exports = { analyzeText };
