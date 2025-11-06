// analyze-text.js
const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI("AIzaSyAGZcayD9G0-j0CMyOI9Znwd2U19_rpvR4");
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

// 🔁 Danh sách đồng nghĩa mở rộng
const dup = {
  // ⚙️ CPU & quạt
  "cooling fan": "cpu fan",
  "cpu cooling fan": "cpu fan",
  "fan cpu": "cpu fan",
  "quạt tản nhiệt": "cpu fan",// analyze-text.js
const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
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

  "quạt cpu": "cpu fan",
  "heatsink": "cpu fan",
  "radiator": "cpu fan",

  // 💻 GPU / Card đồ họa
  "graphics card": "gpu",
  "vga": "gpu",
  "card màn hình": "gpu",
  "card do hoa": "gpu",
  "video card": "gpu",
  "gpu card": "gpu",

  // 🧠 Mainboard / Motherboard
  "mainboard": "motherboard",
  "bo mạch chủ": "motherboard",
  "mo bo": "motherboard",
  "mobo": "motherboard",
  "board mạch": "motherboard",

  // 💾 Ổ cứng
  "hdd": "hard drive",
  "ổ cứng hdd": "hard drive",
  "ổ cứng cơ": "hard drive",
  "harddisk": "hard drive",
  "hard disk drive": "hard drive",

  // ⚡ SSD
  "ssd": "solid state",
  "ổ cứng ssd": "solid state",
  "solid drive": "solid state",
  "solid state drive":"solid state",

  // 🔋 RAM / Bộ nhớ
  "ram": "memory",
  "bộ nhớ ram": "memory",
  "bộ nhớ tạm": "memory",
  "random access memory": "memory",

  // 🔌 PSU / Nguồn
  "psu": "power supply",
  "nguồn máy tính": "power supply",
  "power adapter": "power supply",
  "power unit": "power supply",
  "bộ nguồn": "power supply",

  // 🖥️ Case / Thùng máy
  "case": "computer case",
  "thùng máy": "computer case",
  "vỏ máy tính": "computer case",
  "vỏ case": "computer case",

  // 🧊 CPU
  "bộ xử lý": "cpu",
  "vi xử lý": "cpu",
  "processor": "cpu",
  "central processing unit": "cpu",
  "chip xử lý": "cpu",
  "chip cpu": "cpu",

  // 🔤 BIOS
  "bios": "bios",
  "uefi": "bios",
  "firmware": "bios",

  // 🖱️ Chuột
  "chuột": "mouse",
  "mouse": "mouse",
  "computer mouse": "mouse",
  "chuột máy tính": "mouse",

  // ⌨️ Bàn phím
  "bàn phím": "keyboard",
  "keyboard": "keyboard",
  "phím cơ": "keyboard",
  "mechanical keyboard": "keyboard",

  // 🖥️ Màn hình
  "màn hình": "monitor",
  "monitor": "monitor",
  "display": "monitor",
  "screen": "monitor",

  // 🔈 Âm thanh
  "loa": "speaker",
  "tai nghe": "headphone",
  "headphone": "headphone",
  "earphone": "headphone",
  "microphone": "microphone",
  "mic": "microphone",

  // 🌐 Internet / Mạng
  "router": "router",
  "modem": "router",
  "switch mạng": "network switch",
  "switch": "network switch",
  "hub mạng": "network hub",
  "hub": "network hub",
  "wifi": "wireless network",
  "mạng không dây": "wireless network",

  // 🧰 Ổ đĩa ngoài
  "usb": "flash drive",
  "usb drive": "flash drive",
  "ổ đĩa usb": "flash drive",
  "ổ đĩa ngoài": "external drive",

  // 💽 Ổ đĩa quang
  "ổ đĩa dvd": "optical drive",
  "ổ đĩa cd": "optical drive",
  "cd-rom": "optical drive",
  "dvd-rom": "optical drive",

  // 💾 Hệ điều hành
  "windows": "operating system",
  "linux": "operating system",
  "ubuntu": "operating system",
  "macos": "operating system",
  "os": "operating system",
  "hệ điều hành": "operating system",

  // 💾 Lưu trữ đám mây
  "google drive": "cloud storage",
  "onedrive": "cloud storage",
  "icloud": "cloud storage",
  "cloud": "cloud storage",

  // 🧰 Phần mềm
  "phần mềm": "software",
  "app": "software",
  "ứng dụng": "software",
  "application": "software",
  "chương trình": "software",

  // 🔧 Phần cứng
  "phần cứng": "hardware",
  "thiết bị vật lý": "hardware",
  "hardware": "hardware",
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
