const express = require("express");
const https = require("https");
const vm = require("vm");
const dotenv = require("dotenv");
const mongoose = require("mongoose");

dotenv.config();
const app = express();
app.use(express.json());

// ===========================
// ⚙️ MongoDB Setup
// ===========================
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log("✅ MongoDB connected"))
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
        } catch (err) { reject(err); }
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
// ⚙️ Load toàn bộ module
// ===========================
let ai1, ai2, ai3, ai4;

(async () => {
  try { ai1 = await loadRemoteModule(MODULE_URLS.ai1); console.log("[GITHUB]✅ AI1 loaded"); } 
  catch (e) { console.warn("[GITHUB]⚠️ Fallback AI1:", e.message); ai1 = { analyzeText: async t => t }; }

  try { ai2 = await loadRemoteModule(MODULE_URLS.ai2); console.log("[GITHUB]✅ AI2 loaded"); } 
  catch (e) { console.warn("[GITHUB]⚠️ Fallback AI2:", e.message); ai2 = { generateAnswer: async t => "Fallback answer." }; }

  try { ai3 = await loadRemoteModule(MODULE_URLS.ai3); console.log("[GITHUB]✅ AI3 loaded"); } 
  catch (e) { console.warn("[GITHUB]⚠️ Fallback AI3:", e.message); ai3 = { detectDomain: async t => "IT" }; }

  try { ai4 = await loadRemoteModule(MODULE_URLS.ai4); console.log("[GITHUB]✅ AI4 loaded"); } 
  catch (e) { console.warn("[GITHUB]⚠️ Fallback AI4:", e.message); ai4 = { checkSanity: async t => ({ isStupid: false }) }; }
})();

// ===========================
// 📦 Load & Save từ MongoDB
// ===========================
async function loadData() {
  return await ChatData.find();
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
    const [analyze, sanity, domain] = await Promise.all([
      ai1.analyzeText(msg),
      ai4.checkSanity(msg),
      ai3.detectDomain(msg)
    ]);

    if (sanity.isStupid) return res.json({ reply: sanity.reply });

    const all = await loadData();
    const found = all.find(e => e.keyword.toLowerCase() === analyze.toLowerCase());
    if (found) return res.json({ reply: found.answer });

    const answer = await ai2.generateAnswer(msg);

    if (domain === "IT") {
      await saveLearned({ keyword: analyze, answer });
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
app.listen(0.0.0.0, 8080, () =>
  console.log(`🚀 Server running on port https://0.0.0.0:${process.env.PORT}`)
);
