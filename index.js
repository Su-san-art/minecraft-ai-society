import 'dotenv/config';
import bedrock from 'bedrock-protocol';

const cfg = {
  host: process.env.MC_HOST,
  port: parseInt(process.env.MC_PORT || '19132', 10),
  username: process.env.MC_USERNAME || 'AISocietyBot',
  auth: 'microsoft'
};

// ===== 仮想エージェント（AI社会のメンバー） =====
const agents = [
  { id: 'mayor',   name: '市長',   role: '政治',  mood: 0, say: (state) => `本日の議題は食料不足です。畑の拡張を提案します。` },
  { id: 'priest',  name: '司祭',   role: '宗教',  mood: 0, say: (state) => `恵みの儀式を執り行い、収穫を祈願します。` },
  { id: 'foreman', name: '監督',   role: '労務',  mood: 0, say: (state) => `坑道を東に3ブロック延長し、人手を配置します。` }
];

// ===== 状態 =====
const worldState = {
  food: 50,
  faith: 40,
  industry: 30,
  tick: 0
};

// ===== Bot 接続 =====
const client = bedrock.createClient({
  host: cfg.host, port: cfg.port, username: cfg.username, auth: cfg.auth
});

client.on('join', () => {
  log('✅ 接続OK。AI社会を起動します。');
  say(`§a[${cfg.username}] は世界に現れた。AI内閣を起動します。チャットで §e!help §fと入力でコマンド一覧。`);
});

// チャット受信
client.on('text', (p) => {
  if (p.type !== 'chat' && p.type !== 'whisper') return;
  let msg = (p.message || '').trim();
  const from = p.source_name || 'player';
  if (!msg.startsWith('!')) return;

  if (msg === '!help') {
    say('利用可能: !council（評議会）| !farm（農業）| !mine（掘削）| !status（社会指標） | !ritual（宗教儀式）');
  } else if (msg === '!status') {
    say(`社会指標 → 食料:${worldState.food} / 信仰:${worldState.faith} / 産業:${worldState.industry}`);
  } else if (msg === '!council') {
    council();
  } else if (msg === '!farm') {
    farmRoutine();
  } else if (msg === '!mine') {
    mineRoutine();
  } else if (msg === '!ritual') {
    ritual();
  } else {
    say(`未知のコマンド: ${msg}（!help 参照）`);
  }
});

// ===== 周期タスク =====
const TICK_INTERVAL = parseInt(process.env.TICK_INTERVAL_MS || '12000', 10);
setInterval(() => {
  worldState.tick++;
  if (worldState.tick % 1 === 0) council();
  if (worldState.tick % 2 === 0) farmRoutine(true);
  if (worldState.tick % 3 === 0) mineRoutine(true);
  if (worldState.tick % 4 === 0) ritual(true);
}, TICK_INTERVAL);

// ===== 会議ロールプレイ =====
function council() {
  speak(`§b[評議会] 開会。`);
  agents.forEach(a => speak(`§7${a.name}(${a.role}): ${a.say(worldState)}`));
  if (worldState.food < 60) farmRoutine();
  if (worldState.industry < 60) mineRoutine();
  if (worldState.faith < 60) ritual();
  speak(`§b[評議会] 閉会。`);
}

// ===== 農業 =====
function farmRoutine(auto=false) {
  const op = (process.env.ALLOW_OP_COMMANDS || 'false').toLowerCase() === 'true';
  if (op) {
    command('title @a actionbar {"rawtext":[{"text":"§aAI農業：畑を拡張中…"}]}');
    command('execute as @s at @s run fill ~-2 ~-1 ~-2 ~2 ~-1 ~2 farmland');
    command('execute as @s at @s run fill ~-2 ~ ~-2 ~2 ~ ~2 wheat');
    say('§a[農業] 畑拡張を実行しました。');
  } else {
    say('§a[農業] 畑の拡張を計画中（OP権限が無いのでロールプレイのみ）。');
  }
  worldState.food = Math.min(100, worldState.food + (op ? 10 : 3));
}

// ===== 掘削 =====
function mineRoutine(auto=false) {
  const op = (process.env.ALLOW_OP_COMMANDS || 'false').toLowerCase() === 'true';
  if (op) {
    command('title @a actionbar {"rawtext":[{"text":"§6AI掘削：坑道延長中…"}]}');
    command('execute as @s at @s facing entity @s eyes run fill ^-1 ~-1 ^1 ^1 ~1 ^5 air replace stone');
    say('§6[掘削] 坑道を延長しました。');
  } else {
    say('§6[掘削] 掘削隊を派遣（OP権限が無いのでロールプレイのみ）。');
  }
  worldState.industry = Math.min(100, worldState.industry + (op ? 10 : 3));
}

// ===== 宗教儀式 =====
function ritual(auto=false) {
  const op = (process.env.ALLOW_OP_COMMANDS || 'false').toLowerCase() === 'true';
  if (op) {
    command('title @a actionbar {"rawtext":[{"text":"§dAI儀式：信仰を高めています…"}]}');
    command('execute as @s at @s run setblock ~ ~ ~ torch');
  }
  speak('§d[儀式] 司祭が祝福を行い、民の心が静まった。');
  worldState.faith = Math.min(100, worldState.faith + (op ? 10 : 5));
}

// ===== 低レベル：チャット / コマンド =====
function say(msg) { if (!msg) msg=''; client.queue('text', { type: 'chat', needs_translation: false, source_name: cfg.username, message: msg, xuid: '', platform_chat_id: '' }); }
function speak(msg) { say(msg); }
function command(cmd) {
  if (!cmd) return;
  client.queue('command_request', {
    command: `/${cmd}`,
    origin: { type: 0, uuid: '', request_id: '0', player_entity_id: 0 },
    internal: false, version: 62
  });
}
function log(...a){ console.log(...a); }

// ===== 例外処理 =====
client.on('error', (e) => console.error('Client error:', e?.message || e));
client.on('kick', (p) => console.error('Kicked:', p));
client.on('close', () => console.error('Disconnected. 再起動が必要です。'));
