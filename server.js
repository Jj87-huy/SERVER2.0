const express = require("express");
const https = require("https");
const vm = require("vm");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();
app.use(express.json());

// ===========================
// 🌐 CORS Setup
// ===========================
app.use(cors({
  origin: ["https://kbot-ai.name.vn", "http://localhost:3000"],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));
app.options("*", cors());

// ===========================
// ⚙️ MongoDB Setup
// ===========================
const DATA = "mongodb+srv://admin:RBbFpKyGrn5vd3@miniplaydata.s3wquxr.mongodb.net/?appName=MiniplayData";
mongoose.connect(DATA)
  .then(() => console.log("✅ MongoDB connected"))
  .catch(err => console.error("❌ MongoDB error:", err));

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
    const [keywords, sanity, domain] = await Promise.all([
      ai1.analyzeText(msg),
      ai4.checkSanity(msg),
      ai3.detectDomain(msg)
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

    const answer = await ai2.generateAnswer(msg);
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
// 🧾 API quản lý dữ liệu MongoDB
// ===========================
app.get("/data", async (req, res) => {
  try {
    const allData = await ChatData.find().sort({ time: -1 });
    res.json(allData);
  } catch (err) {
    console.error("❌ Lỗi khi lấy dữ liệu:", err);
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
    console.error("❌ Lỗi khi thêm dữ liệu:", err);
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
    console.error("❌ Lỗi khi cập nhật:", err);
    res.status(500).json({ error: "Không thể cập nhật dữ liệu" });
  }
});

app.delete("/data/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await ChatData.findByIdAndDelete(id);
    res.json({ message: "🗑️ Đã xóa dữ liệu thành công!" });
  } catch (err) {
    console.error("❌ Lỗi khi xóa dữ liệu:", err);
    res.status(500).json({ error: "Không thể xóa dữ liệu" });
  }
});

// ===========================
// 🚀 Start Server
// ===========================
const PORT = 8080;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
