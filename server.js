const express = require("express");
const https = require("https");
const vm = require("vm");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const axios = require("axios");

const WEBHOOK_URL = process.env.WEBHOOK;
const username = "Takanashi Rikka";
let textMessageId = null;
let textHistory = [];
let textEditCount = 0;

const app = express();
app.use(express.json());

// ===========================
// 🌐 CORS Setup — FIX cho Render
// ===========================
const allowedOrigins = [ "https://kbot-ai.name.vn" ];
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.header("Access-Control-Allow-Origin", origin);
  }
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.header("Access-Control-Allow-Credentials", "true");

  if (req.method === "OPTIONS") {
    return res.sendStatus(200); // Xử lý preflight request
  }
  next();
});



// ===========================
// 🌐 LOG Setup
// ===========================
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

// ===========================
// ⚙️ MongoDB Setup
// ===========================
// // ⚙️ CHAT DB
const DATA = process.env.DATACHAT;
mongoose.connect(DATA)
  .then(() => send.log("✅ MongoDB connected"))
  .catch(err => send.error("❌ MongoDB error:", err));

// ✅ Cập nhật Schema có thêm trường `link`
const ChatSchema = new mongoose.Schema({
  keyword: { type: String, required: true },
  answer: { type: String, required: true },
  link: { type: String, default: "" }, // 🔗 thêm trường link
  source: { type: String, default: "manual" },
  time: { type: Date, default: Date.now }
});
const ChatData = mongoose.model("ChatData", ChatSchema);

// ===========================
// 🧩 Load module từ GitHub raw
// ===========================
async function loadRemoteModule(url) {
  return new Promise((resolve, reject) => {
    https.get(url, res => {
      let data = "";
      res.on("data", chunk => data += chunk);
      res.on("end", () => {
        try {
          const script = new vm.Script(data, { filename: "remote-module.js" });
          const sandbox = { module: {}, exports: {}, require, console, process };
          script.runInNewContext(sandbox);
          resolve(sandbox.module.exports);
        } catch (err) {
          reject(err);
        }
      });
    }).on("error", reject);
  });
}

// ===========================
// 🔗 GitHub module links
// ===========================
const MODULE_URLS = {
  ai1: "https://raw.githubusercontent.com/Jj87-huy/SERVER2.0/main/ai1_analyze.js",
  ai2: "https://raw.githubusercontent.com/Jj87-huy/SERVER2.0/main/ai2_answer.js",
  ai3: "https://raw.githubusercontent.com/Jj87-huy/SERVER2.0/main/ai3_domain.js",
  ai4: "https://raw.githubusercontent.com/Jj87-huy/SERVER2.0/main/ai4_sanity.js"
};

// ===========================
// ⚙️ Load toàn bộ module (có fallback)
// ===========================
let ai1, ai2, ai3, ai4;

(async () => {
  try {
    ai1 = await loadRemoteModule(MODULE_URLS.ai1);
    console.log("[GITHUB]✅ AI1 loaded");
  } catch (e) {
    send.warn("[GITHUB]⚠️ Fallback AI1:", e.message);
    ai1 = { analyzeText: async t => t };
  }

  try {
    ai2 = await loadRemoteModule(MODULE_URLS.ai2);
    console.log("[GITHUB]✅ AI2 loaded");
  } catch (e) {
    send.warn("[GITHUB]⚠️ Fallback AI2:", e.message);
    ai2 = { generateAnswer: async (msg) => `🤖 Tôi đang bảo trì, vui lòng thử lại sau vài phút.\n\n(Có thể đã vượt hạn mức API Gemini)` };
  }

  try {
    ai3 = await loadRemoteModule(MODULE_URLS.ai3);
    console.log("[GITHUB]✅ AI3 loaded");
  } catch (e) {
    send.warn("[GITHUB]⚠️ Fallback AI3:", e.message);
    ai3 = { detectDomain: async t => "OTHER" };
  }

  try {
    ai4 = await loadRemoteModule(MODULE_URLS.ai4);
    console.log("[GITHUB]✅ AI4 loaded");
  } catch (e) {
    send.warn("[GITHUB]⚠️ Fallback AI4:", e.message);
    ai4 = { checkSanity: async t => ({ isStupid: false, reply: "" }) };
  }
})();

// ===========================
// 📦 MongoDB helpers
// ===========================
async function loadData() {
  return ChatData.find();
}

async function saveLearned(entry) {
  const doc = new ChatData({ ...entry, source: "learned" });
  await doc.save();
}

// ===========================
// 💬 API /chat (phiên bản gốc chuẩn hóa)
// ===========================
app.post("/chat", async (req, res) => {
  const msg = req.body.message?.trim();
  if (!msg) return res.json({ reply: "Bạn chưa nhập gì nè 😅" });

  try {
    const [keywords, sanity, domain, answer] = await Promise.all([
      ai1.analyzeText(msg),
      ai4.checkSanity(msg),
      ai3.detectDomain(msg),
      ai2.generateAnswer(msg)
    ]);

    if (sanity.isStupid) {
      return res.json({ reply: sanity.reply });
    }

    const all = await loadData();
    const found = all.find(e => e.keyword.toLowerCase() === keywords.toLowerCase());

    if (found) {
      // ✅ Nếu có link => trả kèm
      return res.json({ reply: found.answer, link: found.link || null });
    }

    if (domain === "IT") {
      await saveLearned({ keyword: keywords, answer });
      send.log(`💾 Lưu vào MongoDB: ${keywords}`);
    }

    // 🧠 Log thông tin chat
    send.log(`\n=== CHAT LOG ===\n[Message]: ${msg}\n[Analyze]: ${keywords}\n[Domain]: ${domain}\n[Sanity]: ${sanity}\n[Answer]: ${answer}\n=================\n`);

    res.json({ reply: answer });
  } catch (err) {
    send.error("[SERVER ERR]", err);
    res.status(500).json({ reply: "⚠️ Server lỗi, chờ tý nha." });
  }
});


// ===========================
// 🧾 API quản lý dữ liệu MongoDB
// ===========================
app.get("/data", async (req, res) => {
  try {
    const allData = await ChatData.find().sort({ time: -1 });
    res.json(allData);
  } catch (err) {
    send.error("❌ Lỗi khi lấy dữ liệu:", err);
    res.status(500).json({ error: "Không thể lấy dữ liệu MongoDB" });
  }
});

app.post("/data", async (req, res) => {
  try {
    const { keyword, answer, link } = req.body;
    if (!keyword || !answer) {
      return res.status(400).json({ error: "Thiếu keyword hoặc answer" });
    }

    const newEntry = new ChatData({ keyword, answer, link: link || "", source: "manual" });
    await newEntry.save();
    res.json({ message: "✅ Đã thêm dữ liệu thành công!" });
  } catch (err) {
    send.error("❌ Lỗi khi thêm dữ liệu:", err);
    res.status(500).json({ error: "Không thể thêm dữ liệu" });
  }
});

app.put("/data/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { keyword, answer, link } = req.body;
    if (!keyword || !answer) {
      return res.status(400).json({ error: "Thiếu keyword hoặc answer" });
    }

    await ChatData.findByIdAndUpdate(id, { keyword, answer, link: link || "" });
    res.json({ message: "✏️ Cập nhật thành công!" });
  } catch (err) {
    send.error("❌ Lỗi khi cập nhật:", err);
    res.status(500).json({ error: "Không thể cập nhật dữ liệu" });
  }
});

app.delete("/data/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await ChatData.findByIdAndDelete(id);
    res.json({ message: "🗑️ Đã xóa dữ liệu thành công!" });
  } catch (err) {
    send.error("❌ Lỗi khi xóa dữ liệu:", err);
    res.status(500).json({ error: "Không thể xóa dữ liệu" });
  }
});

// ===========================
// 🚀 Start Server
// ===========================
const PORT = 8080;
app.listen(PORT, () => send.log(`🚀 Server running on port ${PORT}`));
