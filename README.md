# SERVER2.0 - CHATBOX 2.0

SERVER2.0 là một dự án chatbot phiên bản 2.0, được xây dựng bằng **Node.js** với mục tiêu tạo một server backend xử lý các tương tác AI, phân tích dữ liệu, trả lời câu hỏi, và quản lý log hoạt động.

---

## 📂 Cấu trúc dự án

```
SERVER2.0/
├─ ai1_analyze.js        # Module phân tích dữ liệu đầu vào
├─ ai2_answer.js         # Module xử lý và trả lời câu hỏi
├─ ai3_domain.js         # Module xác định domain / phân loại yêu cầu
├─ ai4_sanity.js         # Module kiểm tra tính hợp lệ (sanity check)
├─ log.js                # Module quản lý ghi log
├─ server.js             # File khởi động server chính
├─ package.json          # Quản lý dependencies & scripts
├─ .env                  # File cấu hình môi trường (biến nhạy cảm)
└─ README.md             # Hướng dẫn dự án
```

---

## ⚙️ Cài đặt & chạy thử

1. **Clone repository**
```bash
git clone https://github.com/Jj87-huy/SERVER2.0.git
cd SERVER2.0
```

2. **Cài đặt dependencies**
```bash
npm install
```

3. **Tạo file `.env`**  
Tạo file `.env` dựa trên mẫu hoặc theo hướng dẫn trong README. Nhập các biến môi trường cần thiết, ví dụ:
```
PORT=3000
API_KEY=<Your_API_Key>
```

4. **Khởi động server**
```bash
node server.js
```

5. **Truy cập ứng dụng**  
Mở trình duyệt và truy cập `http://kbot-ai.name.vn` để sử dụng chatbox.

---

## 🧩 Mô-đun chính

| File               | Chức năng |
|--------------------|-----------|
| ai1_analyze.js     | Phân tích dữ liệu đầu vào |
| ai2_answer.js      | Xử lý câu hỏi & trả lời |
| ai3_domain.js      | Xác định domain / loại yêu cầu |
| ai4_sanity.js      | Kiểm tra tính hợp lệ của input |
| log.js             | Ghi nhật ký hoạt động server |
| server.js          | Khởi động server, cấu hình routes |

---

## 💡 Lưu ý & khuyến nghị

- **Bảo mật `.env`**: Không đưa thông tin nhạy cảm lên GitHub công khai.  
- **Node.js version**: Chạy với Node.js >= 16.x để đảm bảo tương thích.  
- **Debug & log**: Kiểm tra `log.js` để theo dõi các request và lỗi.  
- **Mở rộng**: Có thể thêm Contributing Guide, template Issues, và test script cho dự án cộng đồng.

---

## 📝 License

Tùy chỉnh theo nhu cầu dự án (MIT, GPL, hoặc private repository).

---

## 🔗 Liên kết

- Repository: [https://github.com/Jj87-huy/SERVER2.0](https://github.com/Jj87-huy/SERVER2.0)
