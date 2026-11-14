/* 四大痛點問卷｜網頁程式  v1.8｜2026-11-14（錄音上傳時一併送出邀請人、暱稱；v1.7 從 LINE 點開時自動改用 Safari／Chrome）
 * 題目都從 Google 試算表讀取（「痛點設定」「題目設定」「邀請人」分頁），要改題目改試算表就好。
 * 這個檔案只有 API_URL 需要填。
 */

// 從 LINE 聊天室點開時，LINE 內建瀏覽器常常不能錄音 → 加上 openExternalBrowser=1，LINE 會自動改用手機預設瀏覽器開啟
if (/\bLine\//i.test(navigator.userAgent) && !/openExternalBrowser=1/.test(location.search)) {
  location.replace(location.pathname + (location.search ? location.search + '&' : '?') + 'openExternalBrowser=1' + location.hash);
}

// ★ 部署 Apps Script 後，把「網頁應用程式網址」貼在這裡（結尾是 /exec）
const API_URL = 'https://script.google.com/macros/s/AKfycbxVDLUlpv_0aw1N6e99PwTAbAFreboHMK2NrShyCiIEgSfpKIZldubvyq4FBcAuhYbx/exec';

/* ───────── 固定內容（跟人格卡插圖綁在一起，不放試算表） ───────── */
const FREQ = ['幾乎每天', '每週幾次', '每月幾次', '很少'];
const OTHER_INVITER = '他人分享連結';
const TITLE2 = {
  '精打細算比價派': ['精打細算的', '每一塊錢都要花在刀口上，買之前一定先比價'],
  '方便至上派': ['方便至上的', '時間比什麼都寶貴，能少一步就少一步'],
  '品質品牌派': ['講究品質的', '寧可少買一點，也要買對、買好'],
  '環保永續派': ['環保永續的', '買之前會先想：這個會不會變成垃圾'] };
const TITLE3 = {
  '天天下廚': ['天天主廚', '廚房是你的主場，三餐自己掌握'],
  '週末才開伙': ['週末主廚', '平日交給外面，週末才大展身手'],
  '會煮但懶得煮': ['潛力廚師', '明明會煮，只是常被累和懶打敗'],
  '廚房只是擺設': ['外食探險家', '巷口每一家店都熟，廚房主要用來燒開水'] };
const IMG = { '天天下廚': 1, '週末才開伙': 2, '會煮但懶得煮': 3, '廚房只是擺設': 4 };
const MIN_LEN = 10;          // 開放題至少幾個字
const minLen = k => (k === 'F1a' || k === 'F1b') ? 1 : MIN_LEN;   // 花費兩題不限字數，有填就好
const MAX_REC_SEC = 300;     // 單題錄音上限（秒）

/* ───────── 小圖示（線條風，顏色跟主色） ───────── */
const ICONS = {
  person: '<circle cx="12" cy="8" r="3.5"/><path d="M5 20c1-4 4-6 7-6s6 2 7 6"/>',
  spark: '<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/><path d="M19 16l.7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7z"/>',
  meal: '<path d="M4 12h16a8 7 0 0 1-16 0z"/><path d="M14 3l-3 8M18 4l-4 7"/><path d="M9 21h6"/>',
  bulk: '<path d="M3 8l9-5 9 5v8l-9 5-9-5z"/><path d="M3 8l9 5 9-5M12 13v8"/>',
  roll: '<ellipse cx="9" cy="7" rx="5" ry="3"/><path d="M4 7v10c0 1.7 2.2 3 5 3s5-1.3 5-3V7"/><path d="M14 13h6v4h-6"/><circle cx="9" cy="7" r="1"/>',
  bin: '<path d="M4 7h16M9 7V4h6v3"/><path d="M6 7l1 13h10l1-13"/><path d="M10 11v5M14 11v5"/>',
  coin: '<circle cx="12" cy="12" r="8"/><path d="M14.5 9.5c-.5-1-1.5-1.5-2.5-1.5-1.5 0-2.5.8-2.5 2s1 1.7 2.5 2 2.5.8 2.5 2-1 2-2.5 2c-1 0-2-.5-2.5-1.5M12 6.5V8M12 16v1.5"/>',
  heart: '<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/>' };
const PICON = { 1: 'meal', 2: 'bulk', 3: 'roll', 4: 'bin' };
const STEP_ICON = { basic: 'person', style: 'spark', rate: 'heart', pick: 'spark', pay: 'coin', done: 'heart' };
const ico = (n, sz = 22) => `<svg width="${sz}" height="${sz}" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[n] || ''}</svg>`;
const SPROUT = `<svg class="sprout" width="96" height="72" viewBox="0 0 96 72" aria-hidden="true">
  <ellipse cx="48" cy="64" rx="30" ry="5" fill="var(--accent-soft)"/>
  <path d="M48 63 C48 50 47 40 48 30" stroke="var(--accent)" stroke-width="2.5" fill="none" stroke-linecap="round"/>
  <path d="M48 40 C40 40 30 36 26 26 C36 24 46 28 48 40 Z" fill="var(--accent)" opacity=".55"/>
  <path d="M48 32 C54 30 64 22 68 12 C58 10 48 18 48 32 Z" fill="var(--accent)" opacity=".85"/></svg>`;

/* ───────── 狀態 ───────── */
const STEPS = ['intro', 'basic', 'style', 'rate', 'pick', 'deep0', 'deep1', 'pay', 'done'];
const STEP_TITLE = { basic: '基本資料', style: '生活風格小測驗', rate: '這四件小事，對你來說怎麼樣？',
  pick: '你最困擾的兩件事', pay: '最後幾題' };
let CFG = null;
const byParam = new URLSearchParams(location.search).get('by') || '';
const newId = () => {
  const d = new Date(), c = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; let r = '';
  for (let i = 0; i < 4; i++) r += c[Math.floor(Math.random() * c.length)];
  return 'R' + String(d.getMonth() + 1).padStart(2, '0') + String(d.getDate()).padStart(2, '0') + '-' + r;
};
const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
let S = null;
const fresh = () => ({ rid: newId(), inviter: '', nick: '', step: 0, basic: {}, rate: {}, pick: [], answers: {}, rec: {},
  joinOK: false, recOK: false, sending: false, order: shuffle(CFG.pains.map(p => p.id)) });

/* ───────── 小工具 ───────── */
const $ = id => document.getElementById(id);
const view = $('view');
const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const br = s => esc(s).replace(/\n/g, '<br>');
const pain = id => CFG.pains.find(p => p.id === id);
const score = id => (S.rate[id] || {}).s || 0;
const noSpend = v => /^(沒|無|不曾|從來沒|從沒)/.test(String(v || '').trim());
const fail = msg => { const e = $('err'); e.textContent = msg; e.className = 'err'; e.hidden = false; };
const mark = (q, multi) => multi > 1 ? (multi >= 9 ? '（可複選）' : `（選 ${multi} 個）`) : '';
const sel = (k, o) => Array.isArray(S.basic[k]) ? S.basic[k].includes(o) : S.basic[k] === o;

/* ───────── 畫面 ───────── */
function qBlock(list) {
  return list.map(q => {
    if (q.max === 1 && q.opts.length <= 3)   // 選項少（性別）→ 題目和按鈕同一列
      return `<div class="q il" id="q-${q.code}"><span class="t">${esc(q.q)}</span>
        <div class="seg">${q.opts.map(o => `<button data-k="${q.code}" data-v="${esc(o)}" data-max="1" aria-pressed="${sel(q.code, o)}">${esc(o)}</button>`).join('')}</div></div>`;
    const cols = Math.min(Math.max(q.cols || 2, 1), 3);
    return `<div class="q" id="q-${q.code}"><span class="t">${esc(q.q)} <small>${mark(q.q, q.max)}</small></span>
      <div class="grid${cols === 3 ? ' c3' : ''}" style="--cols:${cols}">${q.opts.map(o =>
        `<button class="opt" data-k="${q.code}" data-v="${esc(o)}" data-max="${q.max}" aria-pressed="${sel(q.code, o)}"><span class="c${q.max > 1 ? ' sq' : ''}"></span>${esc(o)}</button>`).join('')}</div></div>`;
  }).join('');
}

function openQ(key, tag, q, hint) {
  const st = S.rec[key];
  return `<div class="vq" id="blk-${key}"><div class="vqhead"><span class="tag">${esc(tag)}</span><p>${br(q)}</p></div>
    <div class="acts"><button class="btn" data-play="${esc(q)}">▶ 聽提問</button>
      ${S.recOK ? `<button class="btn" data-rec="${key}">${recLabel(key)}</button>` : ''}
      <span class="recst" id="rst-${key}">${recStatus(key)}</span></div>
    <textarea id="ta-${key}" data-key="${key}" placeholder="${esc(hint)}">${esc(S.answers[key] || '')}</textarea>
    <p class="note" id="need-${key}" hidden></p></div>`;
}

function render() {
  const s = STEPS[S.step], n = S.step;
  $('err').hidden = true;
  $('steps').innerHTML = (s === 'intro' || s === 'done') ? '' : Array.from({ length: 7 }, (_, i) => `<i class="${i < n ? 'd' : ''}"></i>`).join('');
  $('lbl').textContent = s === 'intro' ? '輔大商管（二）產業創新課｜小組問卷' : s === 'done' ? '完成' : `第 ${n} 步／共 7 步`;
  $('back').hidden = (s === 'intro' || s === 'done');
  $('next').textContent = s === 'intro' ? '開始填寫' : s === 'pay' ? '送出' : s === 'done' ? '再填一份' : '下一步';
  $('next').disabled = false;
  let title = STEP_TITLE[s] || '吃、買、丟的生活小困擾';
  if (s === 'deep0' || s === 'deep1') title = `${s === 'deep0' ? '第一件' : '第二件'}：${pain(S.pick[s === 'deep0' ? 0 : 1]).title}`;
  if (s === 'done') title = `謝謝你的分享，${S.nick}！`;
  $('title').textContent = title;
  const hi = (s === 'deep0' || s === 'deep1') ? PICON[S.pick[s === 'deep0' ? 0 : 1]] : STEP_ICON[s];
  $('hico').innerHTML = hi ? ico(hi) : ''; $('hico').hidden = !hi;

  if (s === 'intro') {
    const fixed = CFG.members.includes(byParam);
    if (fixed) S.inviter = byParam;
    view.innerHTML = `<div class="intro">
      <div class="icons">${['meal', 'bulk', 'roll', 'bin'].map(n => `<span class="ico">${ico(n, 24)}</span>`).join('')}</div>
      <p>Hi，我們是輔大商管（二）產業創新課程小組，想邀請你分享生活中的小困擾，讓我們更了解大家的日常需求，作為期末專題的研究參考。</p>
      <p class="t">一起花 10～12 分鐘聊聊：</p>
      <ol class="flow"><li>填寫基本資料與生活風格測驗，獲得專屬生活人格卡。</li><li>為四件生活小事評分，選出最困擾你的兩件。</li><li>和我們聊聊你的真實經驗，可以語音或打字分享。</li></ol>
      <p class="t">關於你的分享：</p>
      <ul class="terms"><li>資料僅供本課程專題使用，只有組員與老師可以查看。</li>
        <li>錄音會由 Google AI 轉成文字，再匿名整理分析，學期結束後刪除。</li><li>不方便錄音也沒關係，全程都可以打字回答。</li></ul>
      <p>謝謝你撥出時間，讓我們一起發現生活中的小問題！</p>
      ${fixed ? '' : `<div class="q" id="q-inv"><span class="t">請問是誰邀請你填寫這份問卷？</span><div class="grid inv">${
        CFG.members.concat(OTHER_INVITER).map(m => `<button class="opt" data-inv="${esc(m)}" aria-pressed="${S.inviter === m}"><span class="c"></span>${esc(m)}</button>`).join('')}</div></div>`}
      <button class="consent" id="joinOK" aria-pressed="${S.joinOK}"><span class="ck"></span><span>我同意參與這份問卷（必選）</span></button>
      <button class="consent" id="recOK" aria-pressed="${S.recOK}"><span class="ck"></span><span>我同意錄音，並供上述研究使用（不勾選也可以，改用打字回答）</span></button>
    </div>`;
  }
  if (s === 'basic') view.innerHTML = `<div class="q il" id="q-nick"><span class="t">你的暱稱</span>
      <input id="nick" class="in" maxlength="20" placeholder="例如：小晴（不用本名）" value="${esc(S.nick)}"></div>` + qBlock(CFG.basic);
  if (s === 'style') view.innerHTML = `<p class="muted" style="padding-top:12px">憑直覺選，沒有對錯，最後會送你一張生活人格卡。</p>` + qBlock(CFG.style);
  if (s === 'rate') view.innerHTML = S.order.map(id => {
    const p = pain(id), r = S.rate[id] || {};
    return `<div class="box" id="box-${id}"><div class="ptitle"><span class="ico sm">${ico(PICON[id], 18)}</span><span class="t ptext">${esc(p.text)}</span></div>
      <div class="line"><span>困擾程度</span><div><div class="seg">${[1, 2, 3, 4, 5].map(v => `<button data-rs="${id}" data-v="${v}" aria-pressed="${r.s === v}">${v}</button>`).join('')}</div>
        <div class="ends"><span>完全不困擾</span><span>非常困擾</span></div></div></div>
      <div class="line"><span>發生頻率</span><div class="seg sm">${FREQ.map(f => `<button data-rf="${id}" data-v="${f}" aria-pressed="${r.f === f}">${f}</button>`).join('')}</div></div>
    </div>`;
  }).join('');
  if (s === 'pick') {
    if (!S.pick.length) S.pick = S.order.slice().sort((a, b) => score(b) - score(a)).slice(0, 2);
    view.innerHTML = `<div class="intro">${SPROUT}<h2>原來這兩件事，也是讓你感到特別困擾的問題呢！</h2><p>你最在意的兩個問題是：</p>` +
      S.pick.map(id => `<div class="pick"><div class="ptitle"><span class="ico sm">${ico(PICON[id], 18)}</span><span class="t">${esc(pain(id).text)}</span></div><span class="muted pscore">困擾程度 ${score(id)}／5</span></div>`).join('') +
      `<p>接下來，想再和你聊聊幾個相關的小問題，沒有標準答案喔！只要依照自己的實際情況和真實想法，自然地分享就好～</p></div>`;
  }
  if (s === 'deep0' || s === 'deep1') {
    const p = pain(S.pick[s === 'deep0' ? 0 : 1]);
    view.innerHTML = `<p class="tip">${S.recOK ? '可以先按「聽提問」，再按「錄音回答」用講的分享，也可以直接打字。' : '直接打字回答就好。'}每一題都需要回答，想到什麼說什麼，多分享一些細節更好！</p>` +
      p.qs.map(q => openQ(q.code, q.code, q.q, q.hint)).join('');
  }
  if (s === 'pay') {
    const f = CFG.final, p = pain(S.pick[0]);
    view.innerHTML = openQ('F1a', '花費 1', f.F1a.q.replace(/\{痛點\}/g, p.short), f.F1a.hint)
      + openQ('F1b', '花費 2', f.F1b.q, f.F1b.hint)
      + `<div class="q"><span class="t">${br(f.F2.q)}</span><textarea id="ta-F2" data-key="F2" placeholder="${esc(f.F2.hint)}">${esc(S.answers.F2 || '')}</textarea></div>`;
    syncSpend();
  }
  if (s === 'done') {
    const t2 = TITLE2[S.basic.L2] || ['生活', ''], t3 = TITLE3[S.basic.L3] || ['探索家', ''];
    const g = S.basic.A0 === '女' ? 'f' : S.basic.A0 === '男' ? 'm' : '';
    const img = g && IMG[S.basic.L3] ? `img/${g}${IMG[S.basic.L3]}.webp` : 'img/n.webp';
    const picks = S.pick.map(pain);
    view.innerHTML = `<div class="done">
      <p class="muted">你的問卷編號：<b>${S.rid}</b>（之後想修改或刪除回答，把這個編號告訴邀請你的同學就好）</p>
      <div class="persona"><div class="phead"><div><span class="muted">你的生活人格</span><br><strong>${esc(t2[0])}<br>${esc(t3[0])}</strong></div>
        <img class="pimg" src="${img}" alt="你的生活人格插圖"></div>
        <div><h3>生活特徵</h3><ul>${[S.basic.L1, t2[1], t3[1]].filter(Boolean).map(x => `<li>${esc(x)}</li>`).join('')}</ul></div>
        <div><h3>你最想改善的生活問題</h3><ol>${picks.map(p => `<li>${esc(p.short)}</li>`).join('')}</ol></div>
        <div><h3>你的潛在需求</h3><ul>${picks.map(p => `<li>${esc(p.need)}</li>`).join('')}</ul></div>
      </div><p class="muted">可以截圖留念，也歡迎把問卷分享給朋友！</p></div>`;
  }
}
const syncSpend = () => { const b = $('blk-F1b'); if (b) b.hidden = noSpend(S.answers.F1a); };

/* ───────── 點選 ───────── */
view.addEventListener('click', e => {
  const t = e.target.closest('button'); if (!t) return;
  const group = sel2 => t.parentElement.querySelectorAll(sel2);
  if (t.dataset.inv) { S.inviter = t.dataset.inv; group('[data-inv]').forEach(b => b.setAttribute('aria-pressed', b === t)); }
  if (t.id === 'joinOK' || t.id === 'recOK') { S[t.id] = !S[t.id]; t.setAttribute('aria-pressed', S[t.id]); }
  if (t.dataset.k) {
    const k = t.dataset.k, v = t.dataset.v, max = +t.dataset.max;
    if (max > 1) {
      let a = Array.isArray(S.basic[k]) ? S.basic[k] : [];
      if (a.includes(v)) a = a.filter(x => x !== v); else { if (a.length >= max) a.shift(); a.push(v); }
      S.basic[k] = a; group('[data-k]').forEach(b => b.setAttribute('aria-pressed', a.includes(b.dataset.v)));
    } else { S.basic[k] = v; group('[data-k]').forEach(b => b.setAttribute('aria-pressed', b === t)); }
    const q = $('q-' + k); if (q) q.classList.remove('bad');
  }
  if (t.dataset.rf || t.dataset.rs) {
    const id = +(t.dataset.rf || t.dataset.rs); S.rate[id] = S.rate[id] || {};
    if (t.dataset.rf) S.rate[id].f = t.dataset.v; else S.rate[id].s = +t.dataset.v;
    group('button').forEach(b => b.setAttribute('aria-pressed', b === t)); S.pick = [];
    const bx = $('box-' + id); if (bx && S.rate[id].s && S.rate[id].f) bx.classList.remove('bad');
  }
  if (t.dataset.play) {
    try { speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(t.dataset.play); u.lang = 'zh-TW'; u.rate = .95; speechSynthesis.speak(u); } catch (_) { }
  }
  if (t.dataset.rec) toggleRec(t.dataset.rec);
});
view.addEventListener('input', e => {
  if (e.target.id === 'nick') S.nick = e.target.value.trim();
  const k = e.target.dataset.key;
  if (k) {
    S.answers[k] = e.target.value; if (k === 'F1a') syncSpend();
    const need = $('need-' + k); if (need && e.target.value.trim().length >= minLen(k)) need.hidden = true;
  }
});

/* ───────── 錄音 ───────── */
let R = null;   // 目前錄音中的 {key, mr, stream, t0, timer}
const fmt = s => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
function recLabel(key) { return R && R.key === key ? '■ 停止錄音' : (S.rec[key] && S.rec[key].st === 'ok' ? '● 重錄' : '● 錄音回答'); }
function recStatus(key) {
  const r = S.rec[key]; if (R && R.key === key) return '錄音中 0:00';
  if (!r) return '';
  return r.st === 'up' ? '上傳中…（可以繼續作答）' : r.st === 'ok' ? `已收到你的錄音（${fmt(r.sec)}）` : '上傳失敗，請按「重錄」或改用打字';
}
function paintRec(key) {
  const b = document.querySelector(`[data-rec="${key}"]`), st = $('rst-' + key);
  if (b) { b.textContent = recLabel(key); b.classList.toggle('rec', !!(R && R.key === key)); }
  if (st) { st.textContent = recStatus(key); const r = S.rec[key]; st.className = 'recst' + (r && r.st === 'ok' ? ' ok' : r && r.st === 'bad' ? ' bad' : ''); }
  const need = $('need-' + key); if (need && S.rec[key] && S.rec[key].st !== 'bad') need.hidden = true;
}
// 停止目前的錄音；回傳的 Promise 在錄音檔交給上傳後才完成
function stopRec() { if (!R) return Promise.resolve(); const me = R; return new Promise(ok => { me.done = ok; me.mr.stop(); }); }
async function toggleRec(key) {
  if (R && R.key === key) return stopRec();
  if (R) await stopRec();                  // 另一題還在錄 → 先停掉並上傳
  if (!navigator.mediaDevices || !window.MediaRecorder) return fail('這個瀏覽器不支援錄音，請改用打字回答');
  let stream;
  try { stream = await navigator.mediaDevices.getUserMedia({ audio: true }); }
  catch (_) { return fail('沒有取得麥克風權限，請改用打字回答（或到瀏覽器設定允許麥克風）'); }
  const mime = ['audio/webm;codecs=opus', 'audio/mp4', 'audio/webm', 'audio/ogg'].find(m => MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(m)) || '';
  let mr;   // 32kbps：人聲夠清楚，檔案只有預設的 1/4，上傳快很多
  try { mr = new MediaRecorder(stream, Object.assign({ audioBitsPerSecond: 32000 }, mime ? { mimeType: mime } : {})); }
  catch (_) { mr = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined); }
  const chunks = [];
  const me = { key, mr, stream, t0: Date.now() };
  mr.ondataavailable = e => e.data.size && chunks.push(e.data);
  mr.onstop = () => {
    clearInterval(me.timer); stream.getTracks().forEach(t => t.stop());
    const sec = Math.round((Date.now() - me.t0) / 1000);
    if (R === me) R = null;
    upload(key, new Blob(chunks, { type: mr.mimeType || mime || 'audio/webm' }), sec);
    if (me.done) me.done();
  };
  R = me; mr.start(1000); paintRec(key);
  me.timer = setInterval(() => {
    const sec = (Date.now() - me.t0) / 1000, st = $('rst-' + key);
    if (st) st.textContent = '錄音中 ' + fmt(sec);
    if (sec >= MAX_REC_SEC) mr.stop();
  }, 500);
}
// 背景上傳：不用等傳完就能繼續作答；失敗自動重試一次；送出時才統一等全部傳完
function upload(key, blob, sec) {
  const st0 = S, rid = S.rid;
  const p = (async () => {
    const b64 = await new Promise((ok, no) => { const fr = new FileReader(); fr.onload = () => ok(String(fr.result).split(',')[1]); fr.onerror = no; fr.readAsDataURL(blob); });
    for (let i = 0; i < 2; i++) {
      try { const r = await post({ type: 'audio', rid, inviter: st0.inviter, nick: st0.nick, key, mime: blob.type, sec, b64 }); if (r.ok) return 'ok'; } catch (_) { }
    }
    return 'bad';
  })().catch(() => 'bad').then(st => {
    if (S === st0 && S.rec[key] && S.rec[key].p === p) { S.rec[key] = { st, sec }; paintRec(key); }
  });
  S.rec[key] = { st: 'up', sec, p }; paintRec(key);
}
async function post(data) {
  const res = await fetch(API_URL, { method: 'POST', body: JSON.stringify(data) });   // text/plain，不會觸發跨網域預檢
  return res.json();
}

/* ───────── 檢查與下一步 ───────── */
function checkOpen(keys) {
  let bad = null;
  keys.forEach(k => {
    const el = $('need-' + k); if (!el) return;
    const v = String(S.answers[k] || '').trim(), hasRec = S.rec[k] && S.rec[k].st !== 'bad';
    const short = !hasRec && v.length < minLen(k);
    el.hidden = !short;
    if (short) { el.textContent = v ? `再多說一點吧！可以補充當時的情況、你的感受或想法（至少 ${MIN_LEN} 個字）` : '這題還沒回答喔，說說你的經驗吧！'; bad = bad || k; }
  });
  if (bad) { $('ta-' + bad).scrollIntoView({ block: 'center', behavior: 'smooth' }); fail('還有題目沒回答，或回答太短喔'); }
  return !bad;
}
function checkChoice(list) {
  const miss = list.filter(q => { const v = S.basic[q.code]; return Array.isArray(v) ? !v.length : !v; });
  list.forEach(q => { const el = $('q-' + q.code); if (el) el.classList.toggle('bad', miss.includes(q)); });
  if (miss.length) { $('q-' + miss[0].code).scrollIntoView({ block: 'center', behavior: 'smooth' }); fail('還有題目沒選喔（標成紅字的題目）'); }
  return !miss.length;
}

$('next').onclick = async () => {
  const s = STEPS[S.step];
  if (R) await stopRec();                  // 還在錄音就先停止（自動開始上傳）
  if (s === 'intro') {
    if (!S.inviter) { fail('請選擇是誰邀請你填寫的'); return; }
    if (!S.joinOK) { fail('請先勾選「我同意參與這份問卷」'); return; }
  }
  if (s === 'basic') {
    if (!S.nick) { $('q-nick').classList.add('bad'); fail('請留一個稱呼，暱稱也可以'); return; }
    $('q-nick').classList.remove('bad');
    if (!checkChoice(CFG.basic)) return;
  }
  if (s === 'style' && !checkChoice(CFG.style)) return;
  if (s === 'rate') {
    const miss = S.order.filter(id => !(S.rate[id] && S.rate[id].s && S.rate[id].f));
    S.order.forEach(id => $('box-' + id).classList.toggle('bad', miss.includes(id)));
    if (miss.length) { $('box-' + miss[0]).scrollIntoView({ block: 'center', behavior: 'smooth' }); fail('每一件小事都要選困擾程度和發生頻率'); return; }
  }
  if (s === 'deep0' || s === 'deep1') {
    if (!checkOpen(pain(S.pick[s === 'deep0' ? 0 : 1]).qs.map(q => q.code))) return;
  }
  if (s === 'pay') {
    const v = String(S.answers.F1a || '').trim(), hasRec = S.rec.F1a && S.rec.F1a.st !== 'bad', el = $('need-F1a');
    el.hidden = !!(v || hasRec);
    if (!v && !hasRec) { el.textContent = '這題還沒回答喔（沒有花過就寫「沒有」）'; fail('還有題目沒回答喔'); return; }
    if (noSpend(v)) { delete S.answers.F1b; } else if (!checkOpen(['F1b'])) return;
    return submit();
  }
  if (s === 'done') { S = fresh(); render(); window.scrollTo(0, 0); return; }
  S.step++; render(); window.scrollTo(0, 0);
};
$('back').onclick = () => { if (R) R.mr.stop(); S.step--; render(); window.scrollTo(0, 0); };

// 錄音沒傳成功、也沒打字的題目 → 帶回那一頁
function recFailed() {
  const bad = Object.keys(S.rec).filter(k => S.rec[k].st === 'bad' && String(S.answers[k] || '').trim().length < minLen(k));
  if (!bad.length) return false;
  const k = bad[0], pid = Number(k.split('-')[0]);
  S.step = /^F1/.test(k) ? STEPS.indexOf('pay') : STEPS.indexOf(S.pick[0] === pid ? 'deep0' : 'deep1');
  render(); fail(`這一題的錄音沒有傳成功，請按「重錄」或改用打字（${k}）`);
  const el = $('blk-' + k); if (el) el.scrollIntoView({ block: 'center', behavior: 'smooth' });
  return true;
}
async function submit() {
  const btn = $('next'); btn.disabled = true; btn.textContent = '送出中…';
  $('back').disabled = true;
  let pend;
  while ((pend = Object.values(S.rec).filter(r => r.st === 'up')).length) {   // 等背景錄音全部傳完
    btn.textContent = '上傳中…';
    const e = $('err'); e.textContent = `錄音上傳中，還剩 ${pend.length} 段，請先不要關閉頁面`; e.className = 'err info'; e.hidden = false;
    await Promise.all(pend.map(r => r.p));
  }
  $('back').disabled = false; $('err').hidden = true;
  if (recFailed()) return;
  btn.textContent = '送出中…';
  const answers = Object.fromEntries(Object.entries(S.answers).filter(([, v]) => String(v).trim()));
  const rec = Object.fromEntries(Object.entries(S.rec).filter(([, r]) => r.st === 'ok').map(([k]) => [k, true]));
  try {
    const r = await post({ type: 'submit', rid: S.rid, inviter: S.inviter, nick: S.nick, basic: S.basic, rate: S.rate,
      pick: S.pick, answers, rec, recOK: S.recOK, ua: navigator.userAgent.slice(0, 150) });
    if (!r.ok) throw new Error(r.error || '');
    S.step++; render(); window.scrollTo(0, 0);
  } catch (_) {
    btn.disabled = false; btn.textContent = '送出';
    fail('送出失敗，請確認網路後再按一次「送出」（你的回答都還在）');
  }
}

/* ───────── 啟動：讀題目 ───────── */
(async () => {
  try {
    const res = await fetch(API_URL + '?action=config');
    const r = await res.json();
    if (!r.ok) throw new Error(r.error);
    CFG = r.config;
    if (!CFG.pains.length || !CFG.final.F1a) throw new Error('題目設定不完整');
    S = fresh(); render();
  } catch (_) {
    view.innerHTML = '<p class="center">目前連不上問卷系統，請稍後重新整理頁面再試一次。</p>';
  }
})();
