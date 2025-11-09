# 📘 Tổng quan dự án ChatBot AI + Hệ thống Quản lý Dữ liệu + Xác thực Người dùng

Dự án này bao gồm **hệ thống ChatBot AI**, **backend Node.js với MongoDB**, **trình quản lý nội dung (CMS)**, và **hệ thống tài khoản (guest/basic/premium)**. Toàn bộ phục vụ cho mục tiêu tạo ra một nền tảng AI thông minh, có khả năng tự học và phân quyền người dùng rõ ràng.

---

## ✅ 1. Chức năng chính

### 🤖 ChatBot AI thông minh
- Nhận câu hỏi từ người dùng qua frontend.
- Phân tích từ khóa bằng module AI1.
- Kiểm tra câu hỏi hợp lệ (AI4 – sanity check).
- Phân loại lĩnh vực câu hỏi (AI3 – domain detect).
- Trả lời bằng AI2 hoặc dữ liệu lưu trong MongoDB.
- Tự học với dữ liệu IT (auto-save nếu thuộc domain IT).
- Hỗ trợ trả về **ảnh / video / YouTube / link ngoài**.

---

## ✅ 2. Quản lý nội dung (CMS)
Backend hỗ trợ CRUD đầy đủ trên MongoDB:

### 📥 GET /data
Lấy toàn bộ dữ liệu đã lưu (keyword, answer, link…).

### ➕ POST /data
Thêm mới nội dung thủ công.

### ✏️ PUT /data/:id
Cập nhật nội dung.

### 🗑️ DELETE /data/:id
Xóa nội dung theo ID.

### ✅ Hỗ trợ trường link
Cho phép đính kèm:
- Ảnh (jpg/png/gif)
- Video mp4/webm
- Liên kết YouTube (embed)
- Link ngoài

Frontend tự hiển thị phù hợp theo loại link.

---

## ✅ 3. Hệ thống AI tải từ GitHub Raw
Dự án dùng 4 module AI:
- **AI1** – Phân tích từ khóa
- **AI2** – Tạo câu trả lời
- **AI3** – Xác định domain
- **AI4** – Phát hiện troll/spam

Tất cả load từ GitHub raw bằng `https.get()` + sandbox VM.

Nếu lỗi tải → fallback module tự động.

---

## ✅ 5. Frontend (Chat UI + Auth UI)
### 🔹 Chat UI
- Gửi/nhận tin nhắn real-time
- Hiển thị ảnh/video/link
- Cơ chế auto-scroll
- LocalStorage lưu guestID

### 🔹 Register UI
- Kiểm tra độ mạnh mật khẩu
- Kiểm tra email/phone hợp lệ
- Hiệu ứng loading / toast message
- Tuỳ chỉnh giao diện qua config

### 🔹 Login UI
- Login bằng email/password
- Hiệu ứng toast + loading
- Gợi ý demo login

---

## ✅ 6. Công nghệ sử dụng
- **Node.js / Express** – server backend
- **MongoDB Atlas** – lưu data + user
- **Mongoose** – ORM
- **Google Generative AI (Gemini)** – phân tích + trả lời
- **Vanilla JS Frontend** – không framework
- **Raw GitHub Module Loader** – AI load tự động
- **bcryptjs** – mã hóa mật khẩu

---

## ✅ 7. Kiến trúc tổng quan
```
Frontend (Chat + Auth)
     │
     ├── POST /chat → AI xử lý + DB Lookup
     └── CRUD /data → CMS quản lý

Backend Node.js
     ├── AI (tải từ GitHub)
     ├── MongoDB Chat Data
     └── MongoDB Users

AI Modules (GitHub Raw)
```

---

## ✅ 8. Ứng dụng thực tế
- ChatBot hỗ trợ kỹ thuật IT
- Hệ thống tự học từ câu hỏi người dùng
- CMS chỉnh sửa câu trả lời
- Nền tảng AI có phân quyền người dùng
- API phù hợp mobile app / web app

---

## ✅ 9. Hướng phát triển
- Login bằng Google/Facebook
- Nâng cấp UI Chat đẹp hơn
- Tính năng Premium: lịch sử chat, lưu ghi chú
- Realtime chat (WebSocket)
- Dashboard admin

---

## 🎉 Kết luận
Dự án đã xây dựng được **một hệ sinh thái AI đầy đủ**:
✅ ChatBot thông minh  
✅ Tự học nội dung  
✅ Hệ thống dữ liệu + CMS  
✅ Khách giới hạn 20 lượt  
✅ Tài khoản Basic/Premium  
✅ UI đẹp + dễ mở rộng

Tiếp theo bạn muốn bổ sung phần nào?
