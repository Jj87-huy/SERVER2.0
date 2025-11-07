const express = require("express");
const https = require("https");
const vm = require("vm");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require('jsonwebtoken');

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
// 🔐 JWT CONFIG
// ===========================
const JWT_ACCESS_SECRET = "ACCESS_SECRET_KEY_123";
const JWT_REFRESH_SECRET = "REFRESH_SECRET_KEY_456";
const ACCESS_EXPIRES = "59m";    // Access token sống 59 phút
const REFRESH_EXPIRES = "31d";    // Refresh token sống 31 ngày

// ===========================
// ⚙️ MongoDB Setup
// ===========================
// 🧠 CHAT DB
const DATA = "mongodb+srv://admin:RBbFpKyGrn5vd3@miniplaydata.s3wquxr.mongodb.net/?appName=MiniplayData";
mongoose.connect(DATA)
  .then(() => console.log("✅ ChatDB connected"))
  .catch(err => console.error("❌ ChatDB error:", err));

// 👤 USER DB
const USER_DB = "mongodb+srv://admin:ucqYLGqaqMLnpZxV@cluster0.pwvcjhp.mongodb.net/?appName=Cluster0";
const userConnection = mongoose.createConnection(USER_DB);
userConnection.on("connected", () => console.log("✅ UserDB connected"));
userConnection.on("error", (err) => console.error("❌ UserDB error:", err));

// ===========================
// 🧩 Chat Schema
// ===========================
const ChatSchema = new mongoose.Schema({
  keyword: { type: String, required: true },
  answer: { type: String, required: true },
  link: { type: String, default: "" },
  source: { type: String, default: "manual" },
  time: { type: Date, default: Date.now }
});
const ChatData = mongoose.model("ChatData", ChatSchema);

// ===========================
// 👤 User Schema
// ===========================
const UserSchema = new mongoose.Schema({
  username: { type: String, unique: true, index: true },
  email: { type: String, unique: true, index: true },
  passwordHash: String,
  name: String,
  avatar: String,
  phone: { number: String, verification: { type: Boolean, default: false } },
  linked_account: { google: String, facebook: String, discord: String },
  role: { basic: { type: Boolean, default: true }, premium: { type: Boolean, default: false } },
  request_limit: { type: Number, default: 150 },
  refreshTokens: [{ token: String, createdAt: Date }],
  createdAt: { type: Date, default: Date.now }
});
const User = userConnection.model("User", UserSchema);

// ===========================
// 🔐 JWT Helpers
// ===========================
function generateAccessToken(user) {
  const payload = { sub: user._id.toString(), username: user.username, role: user.role };
  return jwt.sign(payload, JWT_ACCESS_SECRET, { expiresIn: ACCESS_EXPIRES });
}

function generateRefreshToken(user) {
  const payload = { sub: user._id.toString() };
  return jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: REFRESH_EXPIRES });
}

// ===========================
// 🧠 Middleware xác thực
// ===========================
function authenticateToken(req, res, next) {
  const auth = req.headers["authorization"];
  if (!auth) return res.status(401).json({ error: "No token" });

  const [type, token] = auth.split(" ");
  if (type !== "Bearer" || !token) return res.status(401).json({ error: "Invalid auth format" });

  try {
    const payload = jwt.verify(token, JWT_ACCESS_SECRET);
    req.user = { id: payload.sub, username: payload.username, role: payload.role };
    next();
  } catch (err) {
    return res.status(401).json({ error: "Token invalid or expired" });
  }
}

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

// Register
app.post("/auth/register", async (req, res) => {
  try {
    const { username, password, email, name } = req.body;
    if (!username || !password || !email)
      return res.status(400).json({ error: "username, password, email required" });

    const existing = await User.findOne({ $or: [{ username }, { email }] });
    if (existing)
      return res.status(400).json({ error: "Username or email already used" });

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = new User({
      username,
      email,
      passwordHash,
      name: name || username,
      avatar: "",
      request_limit: 150,
      role: { basic: true, premium: false }
    });

    await user.save();
    res.json({
      message: "✅ Registered successfully",
      user: { id: user._id, username: user.username, email: user.email, role: user.role }
    });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// Login
app.post("/auth/login", async (req, res) => {
  try {
    const { usernameOrEmail, password } = req.body;
    if (!usernameOrEmail || !password)
      return res.status(400).json({ error: "username/email and password required" });

    const user = await User.findOne({ $or: [{ username: usernameOrEmail }, { email: usernameOrEmail }] });
    if (!user) return res.status(400).json({ error: "Invalid credentials" });

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return res.status(400).json({ error: "Invalid credentials" });

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);
    user.refreshTokens.push({ token: refreshToken, createdAt: new Date() });
    await user.save();

    res.json({
      message: "✅ Login success",
      accessToken,
      refreshToken,
      user: { id: user._id, username: user.username, email: user.email, role: user.role, request_limit: user.request_limit }
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// Refresh Token
app.post("/auth/refresh", async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken)
      return res.status(400).json({ error: "refreshToken required" });

    let payload;
    try {
      payload = jwt.verify(refreshToken, JWT_REFRESH_SECRET);
    } catch (err) {
      return res.status(401).json({ error: "Invalid refresh token" });
    }

    const user = await User.findById(payload.sub);
    if (!user) return res.status(401).json({ error: "User not found" });

    const stored = user.refreshTokens.find(r => r.token === refreshToken);
    if (!stored) return res.status(401).json({ error: "Refresh token revoked" });

    const newAccess = generateAccessToken(user);
    res.json({ accessToken: newAccess });
  } catch (err) {
    console.error("Refresh error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// Logout
app.post("/auth/logout", async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.json({ ok: true });

    const payload = jwt.decode(refreshToken);
    if (!payload) return res.json({ ok: true });

    const user = await User.findById(payload.sub);
    if (!user) return res.json({ ok: true });

    user.refreshTokens = user.refreshTokens.filter(r => r.token !== refreshToken);
    await user.save();
    res.json({ ok: true });
  } catch (err) {
    console.error("Logout error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// Update Profile
app.put("/auth/profile", authenticateToken, async (req, res) => {
  try {
    const { name, email, phone, password, avatar } = req.body;
    const updateData = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (phone) updateData["phone.number"] = phone;
    if (avatar) updateData.avatar = avatar;
    if (password) updateData.passwordHash = await bcrypt.hash(password, 10);

    const updated = await User.findByIdAndUpdate(req.user.id, updateData, { new: true });
    res.json({ message: "✅ Profile updated", user: updated });
  } catch (err) {
    console.error("Profile error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// Get current user info
app.get("/auth/me", authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-passwordHash -refreshTokens");
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json({ user });
  } catch (err) {
    console.error("Me error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// ===========================
// 🚀 Start Server
// ===========================
const PORT = 8080;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
