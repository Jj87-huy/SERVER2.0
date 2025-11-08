// analyze-text.js
const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.AI1);
const model = genAI.getGenerativeModel({ model: process.env.MODELS });

// 🔁 Danh sách đồng nghĩa mở rộng (tối ưu tối đa, giữ nguyên logic)
const synonymGroups = {
  "cpu fan": ["cooling fan", "cpu cooling fan", "fan cpu", "quạt tản nhiệt", "quạt cpu", "heatsink", "radiator"],// ⚙️ CPU & quạt
  "gpu": ["graphics card", "vga", "card màn hình", "card do hoa", "video card", "gpu card"],// 💻 GPU / Card đồ họa
  "motherboard": ["mainboard", "bo mạch chủ", "mo bo", "mobo", "board mạch"],// 🧠 Mainboard / Motherboard
  "hard drive": ["hdd", "ổ cứng hdd", "ổ cứng cơ", "harddisk", "hard disk drive"],// 💾 Ổ cứng
  "solid state": ["ssd", "ổ cứng ssd", "solid drive", "solid state drive"],// ⚡ SSD
  "memory": ["ram", "bộ nhớ ram", "bộ nhớ tạm", "random access memory"],// 🔋 RAM
  "power supply": ["psu", "nguồn máy tính", "power adapter", "power unit", "bộ nguồn"],// 🔌 PSU
  "computer case": ["case", "thùng máy", "vỏ máy tính", "vỏ case"],// 🖥️ Case
  "cpu": ["bộ xử lý", "vi xử lý", "processor", "central processing unit", "chip xử lý", "chip cpu"],// 🧊 CPU
  "bios": ["bios", "uefi", "firmware"],// 🔤 BIOS
  "mouse": ["chuột", "mouse", "computer mouse", "chuột máy tính"],// 🖱️ Chuột
  "keyboard": ["bàn phím", "keyboard", "phím cơ", "mechanical keyboard"],// ⌨️ Bàn phím
  "monitor": ["màn hình", "monitor", "display", "screen"],// 🖥️ Màn hình
  "optical drive": ["ổ đĩa dvd", "ổ đĩa cd", "cd-rom", "dvd-rom"],// 💽 Ổ đĩa quang
  "operating system": ["windows", "linux", "ubuntu", "macos", "os", "hệ điều hành"],// 💾 Hệ điều hành
  "cloud storage": ["google drive", "onedrive", "icloud", "cloud"],// ☁️ Lưu trữ đám mây
  "software": ["phần mềm", "app", "ứng dụng", "application", "chương trình"], // 🧰 Phần mềm
  "hardware": ["phần cứng", "thiết bị vật lý", "hardware"],// 🔧 Phần cứng
  // 🔈 Âm thanh
  "speaker": ["loa"],
  "headphone": ["tai nghe", "headphone", "earphone"],
  "microphone": ["microphone", "mic"],
  // 🌐 Internet / Mạng
  "router": ["router", "modem"],
  "network switch": ["switch mạng", "switch"],
  "network hub": ["hub mạng", "hub"],
  "wireless network": ["wifi", "mạng không dây"],
  // 🧰 Ổ đĩa ngoài
  "flash drive": ["usb", "usb drive", "ổ đĩa usb"],
  "external drive": ["ổ đĩa ngoài"],
};
const dup = Object.fromEntries(// 👉 Tự động chuyển nhóm thành object tra cứu (giữ nguyên kiểu dữ liệu)
  Object.entries(synonymGroups).flatMap(([main, synonyms]) =>
    synonyms.map(s => [s.toLowerCase(), main])
  )
);

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
