const bedrock = require('bedrock-protocol');

const client = bedrock.createClient({
  host: process.env.MC_HOST, // BedrockサーバのIP
  port: parseInt(process.env.MC_PORT || "19132"),
  username: "AISocietyBot"
});

client.on('join', () => {
  console.log("✅ AI Society connected");
});

client.on('text', (packet) => {
  if (packet.type === 'chat') {
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

    client.queue('text', { type: 'chat', needs_translation: false, source_name: 'AISocietyBot', message: reply, xuid: '', platform_chat_id: '' });
  }
});
