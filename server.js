const express = require("express");
const https = require("https");
const vm = require("vm");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcryptjs");

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
// // ⚙️ CHAT DB
const DATA = "mongodb+srv://admin:RBbFpKyGrn5vd3@miniplaydata.s3wquxr.mongodb.net/?appName=MiniplayData";
mongoose.connect(DATA)
  .then(() => console.log("✅ MongoDB connected"))
  .catch(err => console.error("❌ MongoDB error:", err));
// ⚙️ USER DB
const USER_DB = "mongodb+srv://admin:ucqYLGqaqMLnpZxV@cluster0.pwvcjhp.mongodb.net/?appName=Cluster0";
const userConnection = mongoose.createConnection(USER_DB);
userConnection.on("connected", () => console.log("✅ UserDB connected"));
userConnection.on("error", (err) => console.error("❌ UserDB error:", err));


// ✅ Cập nhật Schema có thêm trường `link`
const ChatSchema = new mongoose.Schema({
  keyword: { type: String, required: true },
  answer: { type: String, required: true },
  link: { type: String, default: "" }, // 🔗 thêm trường link
  source: { type: String, default: "manual" },
  time: { type: Date, default: Date.now }
});
const ChatData = mongoose.model("ChatData", ChatSchema);

// User Schema dùng database UserDB
const UserSchema = new mongoose.Schema({
  username: { type: String, unique: true },
  password: String,
  name: String,
  avatar: { type: String, default: "" },
  email: { mail: String, verification: { type: Boolean, default: false } },
  phone: { number: String, verification: { type: Boolean, default: false } },
  linked_account: { google: String, facebook: String, github: String },
  role: { guest: { type: Boolean, default: false }, basic: { type: Boolean, default: true }, premium: { type: Boolean, default: false } },
  request_limit: { used: { type: Number, default: 0 }, max: { type: Number, default: 150 } },
  created_at: { type: Date, default: Date.now }
});
const User = userConnection.model("User", UserSchema);// ✅ Model nằm trên database UserDB (userConnection)

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
// 👤 Guest API – giới hạn 20 lần request
// ===========================
const guestLimits = {}; 
// Cấu trúc lưu:
// guestLimits[id] = { used: 0, lastActive: Date.now() }
app.post("/guest", (req, res) => {
  let guestId = req.body.guestId;

  // Nếu chưa có guestId => tạo mới
  if (!guestId) {
    guestId = "guest_" + Math.random().toString(36).substring(2, 10);
    guestLimits[guestId] = { used: 0, lastActive: Date.now() };

    return res.json({
      guestId,
      used: 0,
      limit: 20,
      remaining: 20,
      message: "✅ Tạo phiên khách mới!"
    });
  }

  // Nếu đã có → cập nhật
  if (!guestLimits[guestId]) {
    guestLimits[guestId] = { used: 0, lastActive: Date.now() };
  }
  const guest = guestLimits[guestId];
  guest.lastActive = Date.now();

  if (guest.used >= 20) {
    return res.json({
      guestId,
      used: guest.used,
      limit: 20,
      remaining: 0,
      blocked: true,
      message: "⛔ Bạn đã hết lượt dùng (20/20). Vui lòng đăng ký tài khoản!"
    });
  }

  guest.used++;
  res.json({
    guestId,
    used: guest.used,
    limit: 20,
    remaining: 20 - guest.used,
    message: "✅ OK"
  });
});

// ===========================
// ✅ Đăng ký tài khoản
// ===========================
app.post("/auth/register", async (req, res) => {
  try {
    const { username, password, email, name } = req.body;

    // ✅ Kiểm tra thiếu thông tin
    if (!username || !password || !email) {
      return res.status(400).json({ error: "Thiếu username, password hoặc email" });
    }

    // ✅ Kiểm tra username tồn tại
    const checkUsername = await User.findOne({ username });
    if (checkUsername) {
      return res.status(400).json({ error: "Tên đăng nhập đã tồn tại" });
    }

    // ✅ Kiểm tra email tồn tại
    const checkEmail = await User.findOne({ "email.mail": email });
    if (checkEmail) {
      return res.status(400).json({ error: "Email đã được sử dụng" });
    }

    // ✅ Mã hóa mật khẩu
    const hashedPassword = await bcrypt.hash(password, 10);

    // ✅ Tạo user mới
    const newUser = new User({
      username,
      password: hashedPassword,
      name: name || username,
      email: { mail: email, verification: false },
      role: { basic: true, premium: false },
      request_limit: 150 // mặc định cho basic
    });

    await newUser.save();

    res.json({
      message: "✅ Đăng ký thành công!",
      user: {
        username: newUser.username,
        email: newUser.email.mail,
        role: newUser.role,
        request_limit: newUser.request_limit
      }
    });

  } catch (err) {
    console.error("❌ Register error:", err);
    res.status(500).json({ error: "Lỗi server khi đăng ký" });
  }
});
// ===========================
// ✅ Đăng nhap tài khoản
// ===========================
app.post("/auth/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) 
    return res.status(400).json({ error: "Thiếu email hoặc password" });

  const user = await User.findOne({ "email.mail": email });
  if (!user) return res.status(400).json({ error: "Email không tồn tại" });

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return res.status(400).json({ error: "Sai mật khẩu" });

  res.json({
    message: "✅ Đăng nhập thành công!",
    user: {
      username: user.username,
      email: user.email.mail,
      role: user.role
    }
  });
});

// ===========================
// 🚀 Start Server
// ===========================
const PORT = 8080;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
