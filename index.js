import 'dotenv/config';
import bedrock from 'bedrock-protocol';

const cfg = {
  host: process.env.MC_HOST,
  port: parseInt(process.env.MC_PORT || '19132', 10),
  username: process.env.MC_USERNAME || 'AISocietyBot',
  auth: 'microsoft'
};

const agents = [
  { id: 'mayor',   name: '市長', role: '政治', say: () => `食料不足なので畑を拡張します。` },
  { id: 'priest',  name: '司祭', role: '宗教', say: () => `儀式で収穫を祈願します。` },
  { id: 'foreman', name: '監督', role: '労務', say: () => `坑道を延長します。` }
];

const worldState = { food:50, faith:40, industry:30, tick:0 };

const client = bedrock.createClient({ host: cfg.host, port: cfg.port, username: cfg.username, auth: cfg.auth });

client.on('join', () => {
  log('✅ 接続OK');
  say(`§a[${cfg.username}] が世界に現れた。`);
});

client.on('text', (p) => {
  if (p.type !== 'chat' && p.type !== 'whisper') return;
  let msg = (p.message || '').trim();
  const from = p.source_name || 'player';
  if (!msg.startsWith('!')) return;

  if (msg === '!help') say('!council | !farm | !mine | !status | !ritual');
  else if (msg === '!status') say(`食料:${worldState.food} / 信仰:${worldState.faith} / 産業:${worldState.industry}`);
  else if (msg === '!council') council();
  else if (msg === '!farm') farmRoutine();
  else if (msg === '!mine') mineRoutine();
  else if (msg === '!ritual') ritual();
  else say(`未知のコマンド: ${msg}`);
});

const TICK_INTERVAL = 12000;
setInterval(() => {
  worldState.tick++;
  if (worldState.tick % 1 === 0) council();
  if (worldState.tick % 2 === 0) farmRoutine(true);
  if (worldState.tick % 3 === 0) mineRoutine(true);
  if (worldState.tick % 4 === 0) ritual(true);
}, TICK_INTERVAL);

function council() { speak(`§b[評議会] 開会`); agents.forEach(a=>speak(`§7${a.name}(${a.role}): ${a.say()}`)); speak(`§b[評議会] 閉会`); }
function farmRoutine(auto=false) { worldState.food=Math.min(100,worldState.food+(auto?3:10)); speak(`§a[農業] 畑を更新しました。`); }
function mineRoutine(auto=false) { worldState.industry=Math.min(100,worldState.industry+(auto?3:10)); speak(`§6[掘削] 坑道を更新しました。`); }
function ritual(auto=false) { worldState.faith=Math.min(100,worldState.faith+(auto?5:10)); speak(`§d[儀式] 儀式を実施しました。`); }

function say(msg){ if(!msg) msg=''; client.queue('text',{ type:'chat',needs_translation:false,source_name:cfg.username,message:msg,xuid:'',platform_chat_id:'' }); }
function speak(msg){ say(msg); }
function log(...a){ console.log(...a); }

client.on('error', e=>console.error('Client error:', e?.message||e));
client.on('kick', p=>console.error('Kicked:', p));
client.on('close', ()=>console.error('Disconnected.'));
