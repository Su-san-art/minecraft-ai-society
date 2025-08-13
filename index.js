import 'dotenv/config';
import bedrock from 'bedrock-protocol';

const cfg = {
  host: process.env.MC_HOST,
  port: parseInt(process.env.MC_PORT || '19132', 10),
  username: process.env.MC_USERNAME || 'AISocietyBot',
  auth: 'microsoft'
};

// ===== AI社会のメンバー =====
const agents = [
  { id: 'mayor',   name: '市長',   role: '政治',  mood: 0, say: (state) => `本日の議題は食料不足です。畑の拡張を提案します。` },
  { id: 'priest',  name: '司祭',   role: '宗教',  mood: 0, say: (state) => `恵みの儀式を執り行い、収穫を祈願します。` },
  { id: 'foreman', name: '監督',   role: '労務',  mood: 0, say: (state) => `坑道を東に3ブロック延長し、人手を配置します。` }
];

// ===== 世界状態 =====
const worldState = { food: 50, faith: 40, industry: 30, tick: 0 };

// ===== Bot 接続 =====
const client = bedrock.createClient(cfg);

let connected = false; // ← 接続待ちフラグ

client.on('join', () => {
  connected = true;
  log('✅ 接続OK。AI社会を起動します。');
  safeSay(`§a[${cfg.username}] は世界に現れた。AI内閣を起動します。チャットで §e!help §fと入力でコマンド一覧。`);
});

// チャット受信
client.on('text', (p) => {
  if (!p.message) return;
  const msg = p.message.trim();
  if (!msg.startsWith('!')) return;

  switch(msg) {
    case '!help':
      safeSay('利用可能: !council | !farm | !mine | !status | !ritual');
      break;
    case '!status':
      safeSay(`社会指標 → 食料:${worldState.food} / 信仰:${worldState.faith} / 産業:${worldState.industry}`);
      break;
    case '!council': council(); break;
    case '!farm': farmRoutine(); break;
    case '!mine': mineRoutine(); break;
    case '!ritual': ritual(); break;
    default: safeSay(`未知のコマンド: ${msg}（!help 参照）`); break;
  }
});

// ===== 周期タスク =====
const TICK_INTERVAL = parseInt(process.env.TICK_INTERVAL_MS || '12000', 10);
setInterval(() => {
  if (!connected) return; // ← 接続前は何もしない
  worldState.tick++;
  try {
    council();
    farmRoutine(true);
    mineRoutine(true);
    ritual(true);
  } catch(e){
    log('Tick error:', e);
  }
}, TICK_INTERVAL);

// ===== 会議 =====
function council() {
  speak(`§b[評議会] 開会。`);
  agents.forEach(a => speak(`§7${a.name}(${a.role}): ${a.say(worldState)}`));
  speak(`§b[評議会] 閉会。`);
}

// ===== 農業 =====
function farmRoutine(auto=false) {
  const op = (process.env.ALLOW_OP_COMMANDS || 'false').toLowerCase() === 'true';
  if (op) command('title @a actionbar {"rawtext":[{"text":"§aAI農業：畑を拡張中…"}]}');
  safeSay(op ? '§a[農業] 畑拡張を実行しました。' : '§a[農業] 畑の拡張を計画中（OP権限なし）');
  worldState.food = Math.min(100, worldState.food + (op ? 10 : 3));
}

// ===== 掘削 =====
function mineRoutine(auto=false) {
  const op = (process.env.ALLOW_OP_COMMANDS || 'false').toLowerCase() === 'true';
  if (op) command('title @a actionbar {"rawtext":[{"text":"§6AI掘削：坑道延長中…"}]}');
  safeSay(op ? '§6[掘削] 坑道を延長しました。' : '§6[掘削] 掘削隊を派遣（OP権限なし）');
  worldState.industry = Math.min(100, worldState.industry + (op ? 10 : 3));
}

// ===== 儀式 =====
function ritual(auto=false) {
  const op = (process.env.ALLOW_OP_COMMANDS || 'false').toLowerCase() === 'true';
  if (op) command('title @a actionbar {"rawtext":[{"text":"§dAI儀式：信仰を高めています…"}]}');
  safeSay('§d[儀式] 司祭が祝福を行い、民の心が静まった。');
  worldState.faith = Math.min(100, worldState.faith + (op ? 10 : 5));
}

// ===== 安全ラッパー =====
function safeSay(msg){
  if(!msg || typeof msg !== 'string') msg='';
  if(!client || !client.queue) return; // ← queueが未定義なら送信しない
  client.queue('text', { type:'chat', needs_translation:false, source_name:cfg.username, message:msg, xuid:'', platform_chat_id:'' });
}
function speak(msg){ safeSay(msg); }
function command(cmd){ 
  if(!cmd || typeof cmd !== 'string') return;
  if(!client || !client.queue) return;
  client.queue('command_request', {
    command: `/${cmd}`,
    origin:{ type:0, uuid:'', request_id:'0', player_entity_id:0 },
    internal:false, version:62
  });
}
function log(...a){ console.log(...a); }

// ===== 例外処理 =====
client.on('error', (e) => console.error('Client error:', e?.message || e));
client.on('kick', (p) => console.error('Kicked:', p));
client.on('close', () => console.error('Disconnected. 再起動が必要です。'));
