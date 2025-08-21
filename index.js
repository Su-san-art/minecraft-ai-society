const bedrock = require('bedrock-protocol');

const client = bedrock.createClient({
  host: process.env.MC_HOST || "AIMinecraft1129.aternos.me", // デフォルト値を指定
  port: parseInt(process.env.MC_PORT || "27106"),
  username: process.env.BOT_NAME || "AISocietyBot",
  offline: true
});

client.on('connect', () => {
  console.log("✅ AI Society connected to Aternos!");
  client.queue('text', { 
    type: 'chat',
    needs_translation: false,
    source_name: client.username,
    message: "AI社会が始動しました！",
    xuid: '',
    platform_chat_id: ''
  });
});

client.on('text', (packet) => {
  if (packet.type === 'chat' && packet.message) { // undefined防止
    const msg = packet.message;
    let reply = "";

    if (msg.includes("農業")) {
      reply = "畑を拡張します！";
    } else if (msg.includes("宗教")) {
      reply = "宗教集会を開始します！";
    } else if (msg.includes("政治")) {
      reply = "会議を開きます。";
    } else {
      reply = "わかりました、その件について検討します。";
    }

    client.queue('text', { 
      type: 'chat',
      needs_translation: false,
      source_name: client.username,
      message: reply,
      xuid: '',
      platform_chat_id: ''
    });
  }
});

client.on('error', (err) => {
  console.error("⚠️ Bot Error:", err);
});

client.on('disconnect', (packet) => {
  console.log("❌ Bot disconnected:", packet);
});
