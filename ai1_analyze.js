// analyze-text.js
const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI("AIzaSyAGZcayD9G0-j0CMyOI9Znwd2U19_rpvR4");
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

// 🔁 Danh sách đồng nghĩa
const dup = {
  "cooling fan": "cpu fan",
  "cpu cooling fan": "cpu fan",
  "quạt tản nhiệt": "cpu fan",
  "graphics card": "gpu",
  "vga": "gpu",
  "mainboard": "motherboard",
  "bo mạch chủ": "motherboard",
  "hdd": "hard drive",
  "ssd": "solid state drive"
};

async function analyzeText(text) {
  try {
    const prompt = `Phân tích ý chính của câu sau (ví dụ: "Quạt CPU") "${text}".

    Quy tắc:
    - Chỉ trả về **1 danh từ chính duy nhất**, dạng tiếng Anh (vd: "cpu fan").
    - Không viết tiếng Việt, không thêm giải thích.
    - Nếu có nhiều từ (vd: "quạt tản nhiệt, cpu fan"), chỉ chọn **1 từ tiếng Anh chính xác nhất**.
    - Nếu trùng từ trong danh sách này ${JSON.stringify(dup)}, thay bằng giá trị tương ứng.`;

    const result = await model.generateContent(prompt);
    let keywords = (await result.response.text()).trim().toLowerCase();

    // 🧹 Làm sạch chuỗi (bỏ dấu phẩy, khoảng trắng thừa, ký tự đặc biệt)
    keywords = keywords.replace(/[,/;]+/g, " ").replace(/\s+/g, " ").trim();

    // 🔎 Dò xem có nằm trong danh sách đồng nghĩa không
    for (const [key, val] of Object.entries(dup)) {
      if (keywords.includes(key)) return val;
    }

    // Nếu AI trả về nhiều từ (vd: "cpu fan cooling system") → chỉ lấy 2 từ đầu
    const words = keywords.split(" ");
    if (words.length > 2) keywords = words.slice(0, 2).join(" ");

    return keywords || "unknown";
  } catch (err) {
    console.error("[AI1/analyzeText]❌", err.message);
    return "phân tích lỗi";
  }
}

module.exports = { analyzeText };
