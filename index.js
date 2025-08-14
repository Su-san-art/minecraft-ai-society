import { createClient } from 'bedrock-protocol';
import dotenv from 'dotenv';
dotenv.config();

const cfg = {
  host: process.env.MC_HOST,
  port: parseInt(process.env.MC_PORT, 10) || 19132,
  username: process.env.MC_USERNAME || 'AISocietyBot',
  auth: 'microsoft'
};

let client;

function connect() {
  console.log(`接続中: ${cfg.host}:${cfg.port} ユーザー: ${cfg.username}`);
  client = createClient(cfg);

  client.on('join', () => {
    console.log('✅ 接続完了。AI社会を起動します。');
    safeSay('§a[AI社会] 接続しました。');
  });

  client.on('text', (packet) => {
    if (packet.source_name && packet.message) {
      console.log(`[CHAT] ${packet.source_name}: ${packet.message}`);
    }
  });

  client.on('disconnect', (reason) => {
    console.log('⚠️ 切断:', reason);
    setTimeout(connect, 5000);
  });

  client.on('error', (err) => {
    console.error('❌ エラー:', err);
  });
}

// 安全なチャット送信
function safeSay(msg) {
  if (typeof msg !== 'string') {
    console.warn('[WARN] safeSayにstring以外が渡されたため空文字に置換:', msg);
    msg = '';
  }
  if (!client || typeof client.queue !== 'function') {
    console.warn('[WARN] client未接続のためsafeSayスキップ');
    return;
  }
  client.queue('text', {
    type: 'chat',
    needs_translation: false,
    source_name: cfg.username || 'AISocietyBot',
    message: msg,
    xuid: '',
    platform_chat_id: ''
  });
}

// 安全なコマンド送信
function command(cmd) {
  if (typeof cmd !== 'string' || cmd.trim() === '') {
    console.warn('[WARN] 空または無効なcommand呼び出し');
    return;
  }
  if (!client || typeof client.queue !== 'function') {
    console.warn('[WARN] client未接続のためcommandスキップ');
    return;
  }
  client.queue('command_request', {
    command: `/${cmd}`,
    origin: { type: 0, uuid: '', request_id: '0', player_entity_id: 0 },
    internal: false,
    version: 62
  });
}

// 定期タスク（例：AIが会話する）
setInterval(() => {
  safeSay('§e[AI社会] 自動メッセージ送信テスト');
}, 60000);

connect();
