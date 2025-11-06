// analyze-text.js
const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI("AIzaSyAGZcayD9G0-j0CMyOI9Znwd2U19_rpvR4");
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

function normalize(text) {
  return text
    .toLowerCase()
    .replace(/[,\.;/]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

async function analyzeText(text) {
  try {
    const prompt = `
Extract the **single main English noun** that represents the concept in this text: "${text}"

Rules:
- Return ONLY the noun phrase, e.g. "cpu fan", "motherboard", "gpu".
- No explanation. No Vietnamese. No extra words.
- If multiple nouns appear, return ONLY the most correct one.
- Always output the simplest hardware/software term possible.
`;

    const result = await model.generateContent(prompt);
    let output = normalize(await result.response.text());

    // Nếu AI trả về quá dài → chỉ lấy 1 hoặc 2 từ đầu
    const words = output.split(" ");
    if (words.length > 2) {
      output = words.slice(0, 2).join(" ");
    }

    return output || "unknown";
  } catch (err) {
    console.error("[analyzeText] ❌", err.message);
    return "analysis error";
  }
}

module.exports = { analyzeText };
