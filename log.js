const axios = require("axios");

const WEBHOOK_URL = "https://discord.com/api/webhooks/1402866497117884498/OO16uLv7u-4XmwU8-YsfUmuB_Gz1eohIZKauWWao1Rjua2JowXpqP_NU0OjY53EHhQu9"; // thay bằng webhook thật

function sendDiscordMessage(content, username = "ServerBot") {
  axios.post(WEBHOOK_URL, {
    content,
    username
  })
  .then(res => {
    console.log("✅ Đã gửi:", res.status);
  })
  .catch(err => {
    console.error("❌ Lỗi gửi webhook:", err.response?.status, err.message);
  });
}

function sendDiscordEmbed(title, description, color = 0x00ff99) {
  axios.post(WEBHOOK_URL, {
    username: "EmbedBot",
    embeds: [
      {
        title,
        description,
        color,
        timestamp: new Date()
      }
    ]
  })
  .then(res => console.log("✅ Embed gửi:", res.status))
  .catch(err => console.error("❌ Lỗi gửi embed:", err.message));
}

module.exports = { sendDiscordMessage, sendDiscordEmbed };
