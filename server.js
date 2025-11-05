const express = require("express");
const https = require("https");
const vm = require("vm");
const dotenv = require("dotenv");
const mongoose = require("mongoose");

dotenv.config();
const app = express();
app.use(express.json());

// ===========================
// 🌐 CORS Setup
// ===========================
app.use(cors({
  origin: ["https://kbot-ai.name.vn", "http://localhost:3000"],
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type"],
}));
app.options("*", cors()); // ✅ Cho phép preflight request (quan trọng với POST)

// ===========================
// ⚙️ MongoDB Setup
// ===========================
const DATA= "mongodb+srv://admin:RBbFpKyGrn5vd3@miniplaydata.s3wquxr.mongodb.net/?appName=MiniplayData"
mongoose.connect(DATA)
  .then(() => console.log("✅ MongoDB connected"))
  .catch(err => console.error("❌ MongoDB error:", err));

const ChatSchema = new mongoose.Schema({
  keyword: String,
  answer: String,
  source: String,
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
// ⚙️ Load toàn bộ module (tự động fallback)
// ===========================
let ai1, ai2, ai3, ai4;

(async () => {
  try {
    ai1 = await loadRemoteModule(MODULE_URLS.ai1);
    console.log("[GITHUB]✅ AI1 loaded");
  } catch (e) {
    console.warn("[GITHUB]⚠️ Fallback AI1:", e.message);
    ai1 = { analyzeText: async t => t };
  }

  try {
    ai2 = await loadRemoteModule(MODULE_URLS.ai2);
    console.log("[GITHUB]✅ AI2 loaded");
  } catch (e) {
    console.warn("[GITHUB]⚠️ Fallback AI2:", e.message);
    ai2 = { generateAnswer: async t => "Fallback answer." };
  }

  try {
    ai3 = await loadRemoteModule(MODULE_URLS.ai3);
    console.log("[GITHUB]✅ AI3 loaded");
  } catch (e) {
    console.warn("[GITHUB]⚠️ Fallback AI3:", e.message);
    ai3 = { detectDomain: async t => "OTHER" };
  }

  try {
    ai4 = await loadRemoteModule(MODULE_URLS.ai4);
    console.log("[GITHUB]✅ AI4 loaded");
  } catch (e) {
    console.warn("[GITHUB]⚠️ Fallback AI4:", e.message);
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
// 💬 API /chat
// ===========================
app.post("/chat", async (req, res) => {
  const msg = req.body.message?.trim();
  if (!msg) return res.json({ reply: "Bạn chưa nhập gì nè 😅" });

  try {
    // 🔍 Phân tích song song
    const [keywords, sanity, domain] = await Promise.all([
      ai1.analyzeText(msg),
      ai4.checkSanity(msg),
      ai3.detectDomain(msg)
    ]);

    // 🧠 Nếu là câu troll/vô nghĩa
    if (sanity.isStupid) {
      return res.json({ reply: sanity.reply });
    }

    // 🔎 Tìm trong DB
    const all = await loadData();
    const found = all.find(e => e.keyword.toLowerCase() === keywords.toLowerCase());
    if (found) {
      return res.json({ reply: found.answer });
    }

    // 🤖 Tạo câu trả lời mới
    const answer = await ai2.generateAnswer(msg);

    // 💾 Lưu nếu thuộc lĩnh vực IT
    if (domain === "IT") {
      await saveLearned({ keyword: keywords, answer });
      console.log(`💾 Lưu vào MongoDB: ${keywords}`);
    }

    res.json({ reply: answer });
  } catch (err) {
    console.error("[SERVER ERR]", err);
    res.status(500).json({ reply: "⚠️ Server lỗi, chờ tý nha." });
  }
});

// ===========================
// 🚀 Start Server
// ===========================
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
