// analyze-text.js
const { GoogleGenerativeAI } = require("@google/generative-ai");
const axios = require("axios");

const genAI = new GoogleGenerativeAI("AIzaSyCI4_KgdyJL-zMW3lGCNwFJ3BIHisD0s0g");
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
// ===========================
// 🌐 LOG Setup
// ===========================
const WEBHOOK_URL = "https://discord.com/api/webhooks/1435671927791550517/ZxQfJkwi0_mEuIqxeM_HGB8E-uw57RXTcsSHQxQRZBfSezlNJcrl6cZ-jZ9PmjEhlCzm?wait=true";
const username = "Takanashi Rikka";
function getTime() { return new Date().toLocaleTimeString("vi-VN", { hour12: false }); }
function colorize(type, msg) { const colors = { INFO: 32, WARN: 33, ERROR: 31 }; const code = colors[type] || 37; return `\x1b[${code}m[${getTime()}] [${type}]\x1b ${msg}`; }
async function sendMessage(payload) { const res = await axios.post(WEBHOOK_URL, payload); if (!res.data?.id) throw new Error("Không nhận được message ID từ Discord."); return res.data.id; }// ========== Discord helpers ==========
async function editMessage(id, payload) { await axios.patch(`${WEBHOOK_URL.replace("?wait=true", "")}/messages/${id}`, payload); }
// ========== SEND TEXT (code block mode) ==========
async function send(content) {
  try { const logLine = `[${getTime()}] ${content}`; textHistory.push(logLine); const formatted = "```log\n" + textHistory.join("\n") + "\n```"; if (!textMessageId || textEditCount >= 20) { textMessageId = await sendMessage({ content: formatted, username }); textEditCount = 0; textHistory = []; } else { await editMessage(textMessageId, { content: formatted, username }); textEditCount++; } } 
  catch (err) { console.error( colorize("ERROR", `Lỗi gửi text: ${err.response?.status || "?"} | ${err.response?.data?.message || err.message}`)); }}
// ========== Shortcut methods ==========
send.log = async msg => { console.log(colorize("INFO", msg)); await send(`[INFO] ${msg}`); };
send.warn = async msg => { console.warn(colorize("WARN", msg)); await send(`[WARN] ${msg}`); };
send.error = async msg => { console.error(colorize("ERROR", msg)); await send(`[ERROR] ${msg}`); };

// 🔁 Danh sách đồng nghĩa mở rộng
const dup = {
  // ⚙️ CPU & quạt
  "cooling fan": "cpu fan",
  "cpu cooling fan": "cpu fan",
  "fan cpu": "cpu fan",
  "quạt tản nhiệt": "cpu fan",
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
    send.error("[AI1/analyzeText]❌", err.message);
    return "phân tích lỗi";
  }
}
send.log(`[analyzeTex] Keywork: ${keywords}`);
module.exports = { analyzeText };
