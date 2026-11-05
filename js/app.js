if("serviceWorker" in navigator){ window.addEventListener("load", () => { navigator.serviceWorker.register("sw.js").catch(() => {}); }); }

fetch("data/data.json").then(r => { if(!r.ok) throw new Error("HTTP " + r.status); return r.json(); }).then(start).catch(e => {
  console.error(e);
  document.getElementById("app").innerHTML = '<div class="card"><p><b>The study material could not load.</b> Check your connection and reload the page.</p></div>';
});

function start(DATA){
"use strict";
const Q = DATA.qs, TOP = DATA.topics;
const QBY = {}; Q.forEach(q => QBY[q.id] = q);
const TBY = {}; TOP.forEach(t => TBY[t.id] = t);
const L = "ABCDEF";
const KEY = "botswana-theory-prep-v1";

/* ---------- storage (browser only, safe if blocked) ---------- */
function load(){ try{ const r = localStorage.getItem(KEY); if(r){ const o = JSON.parse(r); if(o && o.q) return o; } }catch(e){} return {v:1, examDate:"", q:{}, exams:[]}; }
let store = load();
function save(){ try{ localStorage.setItem(KEY, JSON.stringify(store)); }catch(e){} }
function rec(id, ok){ const s = store.q[id] || {a:0,c:0,lw:false}; s.a++; if(ok) s.c++; s.lw = !ok; s.t = Date.now(); store.q[id] = s; }

/* ---------- helpers ---------- */
const esc = s => String(s).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const $ = s => document.querySelector(s);
function shuffle(a){ a = a.slice(); for(let i=a.length-1;i>0;i--){ const j = Math.floor(Math.random()*(i+1)); [a[i],a[j]] = [a[j],a[i]]; } return a; }
const webp = f => f.replace(/\.jpg$/, ".webp");
const thumb = f => f.replace(/^pages\/(.*)\.jpg$/, "pages/thumbs/$1.webp");
function qImg(q){
  const img = `<img class="q-img ${q.signImg?"sign":""}" src="${q.img}" alt="${q.signImg?"Road sign":"Picture for the question"}" decoding="async">`;
  return q.signImg ? img : `<button class="zoom" data-act="zoom" data-src="${q.img}" aria-label="Enlarge the picture">${img}</button>`;
}
const poolAll = () => Q.filter(q => !q.dup);
const poolSingle = () => Q.filter(q => !q.dup && !q.multi);
const inTopic = t => poolAll().filter(q => q.topic === t);
function topicStats(t){
  const qs = inTopic(t); let seen = 0, att = 0, cor = 0;
  qs.forEach(q => { const s = store.q[q.id]; if(s){ seen++; att += s.a; cor += s.c; } });
  const acc = att ? Math.round(100*cor/att) : null;
  let status = "New", cls = "";
  if(att >= 3){ if(acc < 70){ status = "Weak"; cls = "bad"; } else if(acc < 90){ status = "Getting there"; cls = "warn"; } else { status = "Strong"; cls = "good"; } }
  else if(att > 0){ status = "Started"; }
  return {n: qs.length, seen, att, acc, status, cls};
}
function mistakeIds(){ return Object.keys(store.q).filter(id => store.q[id].lw && QBY[id]); }
function fmtTime(sec){ const m = Math.floor(sec/60), s = sec%60; return m + ":" + String(s).padStart(2,"0"); }
function daysLeft(){ if(!store.examDate) return null; const d = new Date(store.examDate + "T00:00:00"); if(isNaN(d)) return null; const t = new Date(); t.setHours(0,0,0,0); return Math.round((d - t)/86400000); }
function weighted(pool, n){
  const keyed = pool.map(q => { const s = store.q[q.id]; const w = !s ? 1 : (s.lw ? 1.6 : 0.4); return {q, k: Math.pow(Math.random(), 1/w)}; });
  keyed.sort((a,b) => b.k - a.k); return keyed.slice(0, n).map(x => x.q);
}

/* ---------- sign questions ---------- */
const SIGNQ = DATA.signs.map((s, i) => ({id:"SG-"+i, src:"SG", topic:7, q:"What does this sign mean?", img:s.f, signImg:true, ans:[0], _name:s.n, _g:s.g}));
SIGNQ.forEach(q => { QBY[q.id] = q; });
function buildSignQ(){
  SIGNQ.forEach(q => {
    const same = SIGNQ.filter(o => o !== q && o._g === q._g);
    const others = shuffle(same).slice(0,3);
    q.opts = [q._name].concat(others.map(o => o._name));
  });
}
buildSignQ();

/* ---------- session ---------- */
let S = null;          // active quiz session
let route = location.hash.replace("#","") || "home";

function mk(q, doShuffle){
  const order = q.opts.map((_,i) => i);
  const ord = doShuffle ? shuffle(order) : order;
  return {q, order: ord, sel: [], done: false, ok: null};
}
const isRight = (it, k) => it.q.ans.indexOf(it.order[k]) >= 0;
function itemCorrect(it){
  const want = it.order.map((_,k) => k).filter(k => isRight(it,k)).join(",");
  return it.sel.slice().sort((a,b)=>a-b).join(",") === want;
}
function startSession(o){
  S = Object.assign({i:0, t0:Date.now(), flags:{}, finished:false, back:"home"}, o);
  S.items = o.qs.map(q => mk(q, o.shuffle !== false));
  window.scrollTo(0,0);
  render();
}
function startTopic(t, n){
  const pool = inTopic(t);
  const qs = weighted(pool, n || pool.length);
  startSession({kind:"practice", title:"Practice: " + TBY[t].title, qs, exam:false, back:"learn"});
}
function startMock(){
  const qs = weighted(poolSingle(), 30);
  startSession({kind:"mock", title:"Mock exam, 30 random questions", qs, exam:true, back:"exams"});
}
function startOfficial(id){
  const t = DATA.tests.find(x => x.id === id);
  startSession({kind:"test", testId:id, title:t.label + " as printed", qs:t.ids.map(i => QBY[i]), exam:true, shuffle:false, back:"exams"});
}
function startMistakes(){
  const qs = shuffle(mistakeIds().map(id => QBY[id]));
  if(!qs.length) return;
  startSession({kind:"practice", title:"Your mistakes", qs, exam:false, back:"mistakes"});
}
function startSigns(n){
  buildSignQ();
  const qs = shuffle(SIGNQ).slice(0, n);
  startSession({kind:"practice", title:"Sign quiz", qs, exam:false, back:"signs"});
}
function startWeak(){
  const weak = TOP.filter(t => ["Weak","Getting there"].includes(topicStats(t.id).status)).map(t => t.id);
  let pool = weak.length ? poolAll().filter(q => weak.indexOf(q.topic) >= 0) : poolAll();
  const qs = weighted(pool, 20);
  startSession({kind:"practice", title: weak.length ? "Weak topics" : "Mixed practice", qs, exam:false, back:"practice"});
}

function pick(k){
  if(!S || S.finished) return;
  const it = S.items[S.i];
  if(S.exam){
    it.sel = [k]; render(true); return;
  }
  if(it.done) return;
  if(it.q.ans.length > 1){
    const p = it.sel.indexOf(k); if(p >= 0) it.sel.splice(p,1); else it.sel.push(k);
    render(true); return;
  }
  it.sel = [k]; it.done = true; it.ok = itemCorrect(it); rec(it.q.id, it.ok); save(); render(true); focusOn(".fb");
}
function checkMulti(){
  const it = S.items[S.i]; if(it.done || !it.sel.length) return;
  it.done = true; it.ok = itemCorrect(it); rec(it.q.id, it.ok); save(); render(true); focusOn(".fb");
}
function go(d){
  const n = S.i + d;
  if(n < 0 || n >= S.items.length) return;
  S.i = n; window.scrollTo(0, 0); render();
}
function finish(){
  S.finished = true; S.secs = Math.round((Date.now() - S.t0)/1000);
  let score = 0; const wrong = [];
  S.items.forEach(it => {
    const ok = itemCorrect(it); it.ok = ok;
    if(S.exam){ rec(it.q.id, ok); }
    if(ok) score++; else wrong.push(it.q.id);
  });
  S.score = score; S.wrong = wrong;
  if(S.exam){ store.exams.push({t:Date.now(), kind:S.kind, testId:S.testId||null, label:S.title, score, total:S.items.length, secs:S.secs, wrong}); }
  save(); window.scrollTo(0,0); render();
}
function leave(){ const b = S ? S.back : "home"; S = null; setRoute(b); }

/* ---------- views ---------- */
const ICONS = {
  home:'<svg viewBox="0 0 24 24"><path d="M3 11 12 4l9 7"/><path d="M5 10v10h14V10"/></svg>',
  learn:'<svg viewBox="0 0 24 24"><path d="M4 5h7a3 3 0 0 1 3 3v12a2 2 0 0 0-2-2H4z"/><path d="M20 5h-7a3 3 0 0 0-3 3"/><path d="M20 5v13h-6"/></svg>',
  signs:'<svg viewBox="0 0 24 24"><path d="M12 3 2.5 20h19z"/><path d="M12 10v4"/><path d="M12 17v.1"/></svg>',
  practice:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="m8 12 3 3 5-6"/></svg>',
  exams:'<svg viewBox="0 0 24 24"><rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 8h6M9 12h6M9 16h4"/></svg>',
  mistakes:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="m9 9 6 6M15 9l-6 6"/></svg>'
};
const TABS = [["home","Home"],["learn","Learn"],["signs","Signs"],["practice","Practice"],["exams","Exams"],["mistakes","Mistakes"]];
function renderTabs(){
  const cur = S ? (S.back === "exams" ? "exams" : S.back) : route.split("-")[0];
  const base = ["home","learn","signs","practice","exams","mistakes"].indexOf(cur) >= 0 ? cur : (cur === "cheat" ? "learn" : "home");
  $("#tabs").innerHTML = TABS.map(t => `<button data-act="nav" data-to="${t[0]}" ${t[0]===base?'aria-current="page"':''}>${ICONS[t[0]]}<span>${t[1]}</span></button>`).join("");
}
function setRoute(r){ S = null; route = r; if(location.hash !== "#"+r){ try{ history.replaceState(null,"","#"+r); }catch(e){ location.hash = r; } } window.scrollTo(0,0); render(); }
window.addEventListener("hashchange", () => { const r = location.hash.replace("#","") || "home"; if(r !== route){ route = r; S = null; render(); } });

function viewHome(){
  const dl = daysLeft();
  const mocks = store.exams.filter(e => e.kind === "mock" || e.kind === "test");
  const last = mocks[mocks.length-1];
  const best = mocks.reduce((m,e) => Math.max(m, e.score), 0);
  const l3 = mocks.slice(-3);
  const avg = l3.length ? (l3.reduce((s,e) => s + e.score/e.total*30, 0)/l3.length).toFixed(1) : null;
  const all = poolAll(); const seen = all.filter(q => store.q[q.id]).length;
  const mist = mistakeIds().length;
  const tstats = TOP.map(t => Object.assign({t}, topicStats(t.id)));
  const weakest = tstats.filter(x => x.att >= 1).sort((a,b) => (a.acc||0) - (b.acc||0))[0];
  const unseen = tstats.find(x => x.att === 0);
  let next;
  if(!seen) next = `Start with <b>Lesson 1</b>, or take a first mock exam to see where you stand.`;
  else if(weakest && weakest.acc < 80) next = `Work on <b>${esc(weakest.t.title)}</b> (${weakest.acc}% right so far): read the lesson, then answer its questions again.`;
  else if(unseen) next = `You have not touched <b>${esc(unseen.t.title)}</b> yet. Read it, then practise it.`;
  else if(mocks.length < 3) next = `Take a full <b>mock exam</b>. Aim to finish three with few mistakes.`;
  else next = `Keep drilling: retake an official test and clear your mistakes list.`;
  return `
  <section class="hero">
    <div class="stack">
      <h1>Pass the 30-question theory test</h1>
      <p class="muted">Built from your books: the Let's Drive Safely manual, four official test papers, the Majuma sheets and the sign chart. Learn a topic, then test it until the mistakes stop.</p>
      <div class="row">
        <button class="btn big" data-act="mock">Start a 30-question mock</button>
        <button class="btn alt big" data-act="weak">Practise weak spots</button>
      </div>
    </div>
    <div class="card stack">
      <div>
        <label for="examDate">Exam date</label>
        <div class="row" style="margin-top:6px"><input type="date" id="examDate" value="${esc(store.examDate||"")}"></div>
      </div>
      ${dl === null ? `<p class="muted small">Set the date to see the countdown.</p>` : dl >= 0 ? `<div><span class="big-num">${dl}</span> <span class="muted">day${dl===1?"":"s"} to go${dl===0?" (today)":""}</span></div>` : `<p class="muted small">That date has passed. Pick a new one.</p>`}
      <p class="small"><b>Next step.</b> ${next}</p>
    </div>
  </section>
  <section class="grid g3" style="margin-top:18px" aria-label="Progress">
    <div class="card"><div class="muted small">Questions tried</div><div class="big-num">${seen}<span class="muted" style="font-size:1.4rem"> / ${all.length}</span></div><div class="bar" style="margin-top:8px"><i style="width:${all.length?Math.round(100*seen/all.length):0}%"></i></div></div>
    <div class="card"><div class="muted small">Exams taken</div><div class="big-num">${mocks.length}</div><div class="small muted">${last ? `Last ${last.score}/${last.total}. Best ${best}/30.` + (avg ? ` Average of last ${l3.length}: ${avg}/30.` : "") : "None yet."}</div></div>
    <div class="card"><div class="muted small">Mistakes to clear</div><div class="big-num">${mist}</div>${mist ? `<button class="btn alt" style="margin-top:8px" data-act="mist">Practise them</button>` : `<div class="small muted">Nothing waiting.</div>`}</div>
  </section>
  <h2 style="margin:28px 0 12px">Topics</h2>
  <section class="grid g2">
    ${tstats.map(x => `
      <div class="card topic">
        <div class="topic-head"><span class="num">${x.t.id}</span><div><h3>${esc(x.t.title)}</h3><div class="muted small">${esc(x.t.sub)}</div></div></div>
        <div class="row"><span class="pill ${x.cls}">${x.status}</span><span class="muted small">${x.n} questions${x.acc!==null ? ", " + x.acc + "% right" : ""}</span></div>
        <div class="bar"><i style="width:${x.acc||0}%"></i></div>
        <div class="row"><button class="btn alt" data-act="topic" data-id="${x.t.id}">Learn</button><button class="btn ghost" data-act="drill" data-id="${x.t.id}">Practise</button></div>
      </div>`).join("")}
  </section>`;
}

function viewLearn(){
  return `
  <h1>Learn</h1>
  <p class="muted" style="margin:6px 0 16px">Fourteen lessons that follow the manual. Read one, then practise it. The numbers sheet gathers every figure the test likes to ask.</p>
  <div class="card row" style="justify-content:space-between;margin-bottom:14px"><div><h2 class="h3">Numbers to remember</h2><div class="muted small">Speeds, distances, dimensions, time limits</div></div><button class="btn" data-act="cheat">Open</button></div>
  <section class="grid g2">
  ${TOP.map(t => { const s = topicStats(t.id); return `
    <button class="card topic" data-act="topic" data-id="${t.id}" style="cursor:pointer">
      <div class="topic-head"><span class="num">${t.id}</span><div><h2 class="h3">${esc(t.title)}</h2><div class="muted small">${esc(t.sub)}</div></div></div>
      <div class="row"><span class="pill ${s.cls}">${s.status}</span><span class="muted small">${(DATA.lessons[t.id]||[]).length} key points</span></div>
    </button>`; }).join("")}
  </section>`;
}

function viewTopic(id){
  const t = TBY[id]; if(!t) return viewLearn();
  const pts = DATA.lessons[id] || [];
  const pg = DATA.pages[id] || [];
  const s = topicStats(id);
  return `
  <div class="row" style="margin-bottom:10px"><button class="btn ghost" data-act="nav" data-to="learn">All lessons</button>
    ${id>1?`<button class="btn ghost" data-act="topic" data-id="${id-1}">Previous</button>`:""}${id<TOP.length?`<button class="btn ghost" data-act="topic" data-id="${id+1}">Next</button>`:""}</div>
  <div class="topic-head" style="margin-bottom:14px"><span class="num plate" style="font-size:1.6rem">${id}</span><div><h1 style="font-size:clamp(1.9rem,5vw,2.8rem)">${esc(t.title)}</h1><div class="muted">${esc(t.sub)}</div></div></div>
  <section class="card lesson"><h2 class="h3" style="margin-bottom:12px">What to know</h2><ul>${pts.map(p => `<li>${esc(p)}</li>`).join("")}</ul></section>
  ${pg.length ? `<section class="card" style="margin-top:14px"><h2 class="h3">Picture pages from the manual</h2><p class="muted small" style="margin:4px 0 12px">These are the pages from your book, with the correct answer printed under each question. Tap a page to read it large. The number is the printed page number.</p><div class="thumbs">${pg.map((p,i) => `<button data-act="page" data-t="${id}" data-i="${i}" aria-label="Open manual page ${p.p}"><picture><source srcset="${thumb(p.f)}" type="image/webp"><img loading="lazy" decoding="async" src="${p.f}" alt="Manual page ${p.p}" width="240" height="340"></picture><span>p.${p.p}</span></button>`).join("")}</div></section>` : ""}
  <section class="card row" style="margin-top:14px;justify-content:space-between"><div><h2 class="h3">Test yourself</h2><div class="muted small">${s.n} questions on this topic${s.acc!==null?`, ${s.acc}% right so far`:""}</div></div>
    <div class="row"><button class="btn" data-act="drill" data-id="${id}" data-n="10">10 questions</button><button class="btn alt" data-act="drill" data-id="${id}">All of them</button></div></section>`;
}

function viewCheat(){
  return `
  <div class="row" style="margin-bottom:10px"><button class="btn ghost" data-act="nav" data-to="learn">All lessons</button></div>
  <h1>Numbers to remember</h1>
  <p class="muted" style="margin:6px 0 16px">Every figure here comes from your manual or the Majuma sheets.</p>
  <div class="grid g2">
  ${DATA.cheat.map(g => `<section class="card"><div class="tw" tabindex="0"><table><thead><tr><th colspan="2">${esc(g.h)}</th></tr></thead><tbody>${g.rows.map(r => `<tr><td>${esc(r[0])}</td><td>${esc(r[1])}</td></tr>`).join("")}</tbody></table></div></section>`).join("")}
  </div>
  <div class="row" style="margin-top:16px"><button class="btn" data-act="mock">Test me on these</button></div>`;
}

function viewSigns(){
  const groups = ["Regulatory","Warning"];
  return `
  <h1>Road signs</h1>
  <p class="muted" style="margin:6px 0 16px">From your Botswana sign chart. The manual's lesson 7 pages show many more signs with their official meaning.</p>
  <div class="row" style="margin-bottom:18px"><button class="btn big" data-act="signquiz" data-n="10">Quiz me: 10 signs</button><button class="btn alt big" data-act="signquiz" data-n="29">All 29 signs</button><button class="btn ghost big" data-act="topic" data-id="7">Manual sign pages</button></div>
  ${groups.map(g => `<h2 style="margin:18px 0 10px">${g} signs</h2><div class="signs">${DATA.signs.filter(s => s.g === g).map(s => `<figure><img loading="lazy" decoding="async" src="${s.f}" alt="${esc(s.n)} sign" width="110" height="110"><figcaption>${esc(s.n)}</figcaption></figure>`).join("")}</div>`).join("")}`;
}

function viewPractice(){
  const opts = TOP.map(t => `<option value="${t.id}">${t.id}. ${esc(t.title)} (${inTopic(t.id).length})</option>`).join("");
  return `
  <h1>Practice</h1>
  <p class="muted" style="margin:6px 0 16px">You get the answer right after each question, with the page of the manual to look it up.</p>
  <section class="card stack">
    <div class="fields">
      <div><label for="pTopic">Topic</label><select id="pTopic"><option value="all">All topics (${poolAll().length})</option>${opts}</select></div>
      <div><label for="pType">Question type</label><select id="pType"><option value="any">Everything</option><option value="single">Single answer (like the real test)</option><option value="multi">Select all that apply</option><option value="pics">Picture questions</option></select></div>
      <div><label for="pCount">How many</label><select id="pCount"><option value="10">10</option><option value="20" selected>20</option><option value="40">40</option><option value="all">All</option></select></div>
    </div>
    <div class="row"><button class="btn big" data-act="startprac">Start</button><button class="btn alt big" data-act="weak">Weak spots</button></div>
  </section>`;
}

function viewExams(){
  const stat = id => { const es = store.exams.filter(e => e.testId === id); return es.length ? `Last ${es[es.length-1].score}/30, best ${Math.max.apply(null, es.map(e => e.score))}/30` : "Not taken yet"; };
  const mocks = store.exams.filter(e => e.kind === "mock");
  const hist = store.exams.slice(-8).reverse();
  return `
  <h1>Exams</h1>
  <p class="muted" style="margin:6px 0 16px">Thirty questions, no feedback until you finish, like the paper. Your stencil has a "Mistakes" box, so this page counts mistakes too.</p>
  <section class="card row" style="justify-content:space-between;margin-bottom:14px"><div><h2 class="h3">Mock exam</h2><div class="muted small">30 questions picked from the whole bank, favouring ones you have missed or not seen. ${mocks.length ? `Last ${mocks[mocks.length-1].score}/30.` : ""}</div></div><button class="btn big" data-act="mock">Start</button></section>
  <h2 style="margin:20px 0 10px">Official test papers</h2>
  <section class="grid g2">${DATA.tests.map(t => `<div class="card row" style="justify-content:space-between"><div><h3>${esc(t.label)}</h3><div class="muted small">30 questions, original order. ${stat(t.id)}</div></div><button class="btn alt" data-act="official" data-id="${t.id}">Start</button></div>`).join("")}</section>
  ${hist.length ? `<h2 style="margin:24px 0 10px">Recent results</h2><div class="card tw" tabindex="0"><table><tbody>${hist.map(e => `<tr><td style="white-space:normal;font-weight:500">${esc(e.label)}<div class="muted small">${new Date(e.t).toLocaleString()}</div></td><td>${e.score}/${e.total}<div class="muted small" style="font-weight:400">${e.total-e.score} mistake${e.total-e.score===1?"":"s"}, ${fmtTime(e.secs)}</div></td></tr>`).join("")}</tbody></table></div>` : ""}`;
}

function viewMistakes(){
  const ids = mistakeIds();
  if(!ids.length) return `<h1>Mistakes</h1><p class="muted" style="margin:6px 0 16px">Every question you get wrong lands here until you answer it right.</p><div class="card"><p>Nothing here yet. Do a practice set or a mock exam and the questions you miss will collect on this page.</p></div>`;
  return `
  <h1>Mistakes</h1>
  <p class="muted" style="margin:6px 0 16px">${ids.length} question${ids.length===1?"":"s"} you last got wrong. A question leaves this list the next time you answer it right.</p>
  <div class="row" style="margin-bottom:16px"><button class="btn big" data-act="mist">Practise all ${ids.length}</button></div>
  <div class="stack">${ids.map(id => { const q = QBY[id]; const ans = q.ans.map(i => q.opts[i]).join(" / "); return `<div class="card"><div class="row" style="justify-content:space-between"><span class="pill">${esc(TBY[q.topic].title)}</span>${q.ref?`<span class="pill">Manual ${esc(q.ref)}</span>`:""}</div><p style="margin-top:8px;font-weight:600">${esc(q.q)}</p>${q.img?qImg(q):""}<p class="small" style="margin-top:6px"><b>Answer:</b> ${esc(ans)}</p></div>`; }).join("")}</div>`;
}

/* ---------- quiz view ---------- */
function viewQuiz(){
  if(S.finished) return viewResults();
  const it = S.items[S.i], q = it.q, n = S.items.length, multi = q.ans.length > 1;
  const showFb = !S.exam && it.done;
  const answered = S.items.filter(x => x.sel.length).length;
  const opts = it.order.map((oi,k) => {
    const sel = it.sel.indexOf(k) >= 0, right = isRight(it,k);
    let cls = "opt", tag = "";
    if(showFb){ if(right){ cls += " right"; tag = sel ? "Correct, your answer" : "Correct answer"; } else if(sel){ cls += " wrong"; tag = "Your answer"; } }
    else if(sel) cls += " sel";
    return `<button class="${cls}" data-act="pick" data-k="${k}" ${showFb?"disabled":""} aria-pressed="${sel}"><span class="ltr">${L[k]}</span><span>${esc(q.opts[oi])}</span>${tag?`<span class="tag">${tag}</span>`:""}</button>`;
  }).join("");
  const topic = TBY[q.topic];
  let fb = "";
  if(showFb){
    const good = it.ok;
    fb = `<div class="fb ${good?"good":"bad"}" role="status" tabindex="-1"><b>${good?"Correct.":"Not quite."}</b> ${q.ans.length>1?"All of the marked answers are needed.":""}
      <div class="small" style="margin-top:6px">${q.ref?`Look it up: manual ${esc(q.ref)}. `:""}Topic: <a href="#learn-${q.topic}" data-act="topic" data-id="${q.topic}">${esc(topic.title)}</a>.</div>
      ${q.note?`<div class="note">${esc(q.note)}</div>`:""}</div>`;
  }
  const last = S.i === n-1;
  return `
  <div class="row" style="justify-content:space-between;margin-bottom:10px">
    <div><h1 style="font-size:1.4rem">${esc(S.title)}</h1><div class="muted small">Question ${S.i+1} of ${n}${S.exam?`, ${answered} answered`:""}</div></div>
    <div class="row"><span class="timer pill" id="timer">${fmtTime(Math.round((Date.now()-S.t0)/1000))}</span><button class="btn ghost" data-act="quit">${S.exam?"Quit":"Stop"}</button></div>
  </div>
  <div class="bar" style="margin-bottom:16px"><i style="width:${Math.round(100*(S.i+(showFb?1:0))/n)}%"></i></div>
  <div class="grid ${S.exam?"quizgrid":""}" style="${S.exam?"grid-template-columns:repeat(auto-fit,minmax(min(100%,340px),1fr));align-items:start":""}">
  <section class="card">
    <div class="qhead"><span class="pill">${esc(topic.title)}</span>${S.exam?`<button class="btn ghost" data-act="flag">${S.flags[S.i]?"Unflag":"Flag for review"}</button>`:""}</div>
    <div class="q-text">${esc(q.q)}</div>
    ${multi?`<div class="muted small" style="margin-top:4px">Select all that apply.</div>`:""}
    ${q.img?qImg(q):""}
    <div class="opts">${opts}</div>
    ${multi && !it.done ? `<div class="row" style="margin-top:12px"><button class="btn" data-act="check" ${it.sel.length?"":"disabled"}>Check answer</button></div>`:""}
    ${fb}
    <div class="row" style="margin-top:16px;justify-content:space-between">
      <button class="btn ghost" data-act="prev" ${S.i===0?"disabled":""}>Back</button>
      ${S.exam
        ? (last ? `<button class="btn" data-act="finish">Finish exam</button>` : `<button class="btn" data-act="next">Next</button>`)
        : (last ? `<button class="btn" data-act="finish" ${it.done?"":"disabled"}>See results</button>` : `<button class="btn" data-act="next" ${it.done?"":"disabled"}>Next question</button>`)}
    </div>
  </section>
  ${S.exam ? `<aside class="card"><h2 class="h3" style="margin-bottom:10px">Questions</h2><div class="nav-grid">${S.items.map((x,i) => `<button data-act="jump" data-i="${i}" class="${i===S.i?"cur":(x.sel.length?"ans":"")} ${S.flags[i]?"flag":""}" aria-label="Question ${i+1}${x.sel.length?", answered":""}${S.flags[i]?", flagged":""}">${i+1}</button>`).join("")}</div><p class="muted small" style="margin-top:10px">${n-answered} unanswered. Underlined boxes are flagged. You can change an answer until you finish.</p></aside>` : ""}
  </div>
  ${S.confirmFinish ? `<div class="card" style="margin-top:14px;border-color:var(--warn)"><p><b>${n-answered} question${n-answered===1?" is":"s are"} still unanswered.</b> Finish anyway? Unanswered counts as a mistake.</p><div class="row" style="margin-top:10px"><button class="btn" data-act="finishyes">Finish now</button><button class="btn ghost" data-act="finishno">Keep going</button></div></div>`:""}
  ${S.confirmQuit ? `<div class="card" style="margin-top:14px;border-color:var(--warn)"><p><b>Leave this ${S.exam?"exam":"set"}?</b> ${S.exam?"The exam will not be scored.":"Answers so far are saved."}</p><div class="row" style="margin-top:10px"><button class="btn" data-act="quityes">Leave</button><button class="btn ghost" data-act="quitno">Stay</button></div></div>`:""}`;
}

function viewResults(){
  const n = S.items.length, mist = n - S.score;
  const wrong = S.items.filter(it => !it.ok);
  const pct = Math.round(100*S.score/n);
  const byTopic = {};
  S.items.forEach(it => { const t = it.q.topic; (byTopic[t] = byTopic[t] || {n:0,w:0}).n++; if(!it.ok) byTopic[t].w++; });
  const weakT = Object.keys(byTopic).filter(t => byTopic[t].w).sort((a,b) => byTopic[b].w - byTopic[a].w);
  return `
  <h1>${esc(S.title)}</h1>
  <section class="card" style="margin:14px 0"><div class="row" style="gap:24px;align-items:flex-end"><div><div class="score">${S.score}<span class="muted" style="font-size:2rem">/${n}</span></div><div class="muted">${pct}% right</div></div>
    <div><div class="big-num" style="color:${mist?"var(--bad)":"var(--good)"}">${mist}</div><div class="muted">mistake${mist===1?"":"s"}</div></div>
    <div><div class="big-num">${fmtTime(S.secs)}</div><div class="muted">time taken</div></div></div>
    <p class="small muted" style="margin-top:12px">Your books do not state a pass mark. Ask your testing station for it, and aim to leave fewer mistakes each round.</p></section>
  ${weakT.length ? `<section class="card"><h2 class="h3">Where the mistakes were</h2><div class="row" style="margin-top:8px">${weakT.map(t => `<button class="pill bad" style="border:0;cursor:pointer" data-act="topic" data-id="${t}">${esc(TBY[t].title)}: ${byTopic[t].w}</button>`).join("")}</div></section>` : `<section class="card"><b>Clean sheet.</b> Take another mock to make sure it was not luck.</section>`}
  <div class="row" style="margin:16px 0">
    ${wrong.length && S.exam ? `<button class="btn big" data-act="retrywrong">Retry my ${wrong.length} mistake${wrong.length===1?"":"s"}</button>` : ""}
    ${S.kind==="mock"?`<button class="btn alt big" data-act="mock">Another mock</button>`:""}
    <button class="btn ghost big" data-act="quityes">Done</button>
  </div>
  ${wrong.length ? `<h2 style="margin:20px 0 10px">Review your mistakes</h2><div class="stack">${wrong.map(it => { const q = it.q;
    const yours = it.sel.length ? it.sel.map(k => q.opts[it.order[k]]).join(" / ") : "No answer";
    const right = q.ans.map(i => q.opts[i]).join(" / ");
    return `<div class="card"><div class="row" style="justify-content:space-between"><span class="pill">${esc(TBY[q.topic].title)}</span>${q.ref?`<span class="pill">Manual ${esc(q.ref)}</span>`:""}</div>
      <p style="margin-top:8px;font-weight:600">${esc(q.q)}</p>${q.img?qImg(q):""}
      <p class="small" style="margin-top:6px;color:var(--bad)"><b>You:</b> ${esc(yours)}</p><p class="small" style="color:var(--good)"><b>Correct:</b> ${esc(right)}</p>${q.note?`<div class="note">${esc(q.note)}</div>`:""}</div>`; }).join("")}</div>` : ""}`;
}

/* ---------- lightbox ---------- */
let LB = null, lbOpener = null;
function openLB(list, i){ LB = {list, i}; lbOpener = document.activeElement; drawLB(); }
function closeLB(){ LB = null; drawLB(); if(lbOpener && lbOpener.isConnected) lbOpener.focus({preventScroll:true}); lbOpener = null; }
function drawLB(){
  $("#shell").inert = !!LB;
  if(!LB){ $("#lbRoot").innerHTML = ""; return; }
  const fk = focusKey(document.activeElement);
  const cur = LB.list[LB.i];
  $("#lbRoot").innerHTML = `<div class="lb" role="dialog" aria-modal="true" aria-label="Enlarged picture"><div class="bar2"><span>${cur.label||""}</span><div class="row">${LB.list.length>1?`<button class="btn alt" data-act="lbprev">Previous</button><button class="btn alt" data-act="lbnext">Next</button>`:""}<button class="btn" data-act="lbclose">Close</button></div></div><div class="view"><picture>${cur.src.startsWith("pages/")?`<source srcset="${webp(cur.src)}" type="image/webp">`:""}<img src="${cur.src}" alt="${esc(cur.label||"Enlarged picture")}"></picture></div></div>`;
  focusOn(fk && fk.indexOf('"lb') > 0 ? fk : '[data-act="lbclose"]');
}

/* ---------- render ---------- */
function focusOn(sel){ const el = $(sel); if(el){ if(!el.matches("button,a,input,select")) el.setAttribute("tabindex","-1"); el.focus({preventScroll:true}); } }
function focusKey(el){
  if(!el || !el.dataset || !el.dataset.act) return null;
  return '[data-act="' + el.dataset.act + '"]' + ["k","i","id","to","n","t"].map(a => el.dataset[a] !== undefined ? `[data-${a}="${el.dataset[a]}"]` : "").join("");
}
const BASE_TITLE = document.title;
const SCREEN_TITLES = {learn:"Learn", cheat:"Numbers to remember", signs:"Road signs", practice:"Practice", exams:"Exams", mistakes:"Mistakes"};
let firstRender = true;
function render(keep){
  const y = window.scrollY, fk = focusKey(document.activeElement);
  renderTabs();
  let html;
  if(S) html = viewQuiz();
  else {
    const [r, arg] = route.split("-");
    if(r === "learn" && arg) html = viewTopic(+arg);
    else html = ({home:viewHome, learn:viewLearn, cheat:viewCheat, signs:viewSigns, practice:viewPractice, exams:viewExams, mistakes:viewMistakes}[r] || viewHome)();
  }
  $("#app").innerHTML = html;
  const st = S ? S.title : SCREEN_TITLES[route.split("-")[0]];
  document.title = st ? st + " | Botswana Theory Test Prep" : BASE_TITLE;
  if(keep){
    window.scrollTo(0, y);
    const again = fk && $(fk); if(again && !again.disabled) again.focus({preventScroll:true});
  }else if(!firstRender){
    focusOn(S && !S.finished ? ".q-text" : "#app h1");
  }
  firstRender = false;
}
setInterval(() => { if(S && !S.finished){ const t = $("#timer"); if(t) t.textContent = fmtTime(Math.round((Date.now()-S.t0)/1000)); } }, 1000);

/* ---------- events ---------- */
document.addEventListener("click", e => {
  const el = e.target.closest("[data-act]"); if(!el) return;
  const a = el.dataset.act;
  if(a !== "topic" || !el.getAttribute("href")) { /* normal */ }
  if(el.tagName === "A") e.preventDefault();
  switch(a){
    case "nav": setRoute(el.dataset.to); break;
    case "topic": setRoute("learn-" + el.dataset.id); break;
    case "cheat": setRoute("cheat"); break;
    case "drill": startTopic(+el.dataset.id, el.dataset.n ? +el.dataset.n : 0); break;
    case "mock": startMock(); break;
    case "official": startOfficial(el.dataset.id); break;
    case "mist": startMistakes(); break;
    case "weak": startWeak(); break;
    case "signquiz": startSigns(+el.dataset.n); break;
    case "startprac": {
      const t = $("#pTopic").value, ty = $("#pType").value, c = $("#pCount").value;
      let pool = poolAll();
      if(t !== "all") pool = pool.filter(q => q.topic === +t);
      if(ty === "single") pool = pool.filter(q => q.ans.length === 1 && q.src !== "CK");
      if(ty === "multi") pool = pool.filter(q => q.ans.length > 1);
      if(ty === "pics") pool = pool.filter(q => q.img);
      if(!pool.length){ return; }
      const qs = weighted(pool, c === "all" ? pool.length : +c);
      startSession({kind:"practice", title:"Practice", qs, exam:false, back:"practice"});
      break; }
    case "pick": pick(+el.dataset.k); break;
    case "check": checkMulti(); break;
    case "next": go(1); break;
    case "prev": go(-1); break;
    case "jump": S.i = +el.dataset.i; render(); window.scrollTo(0,0); break;
    case "skip": focusOn("#app"); break;
    case "flag": S.flags[S.i] = !S.flags[S.i]; render(true); break;
    case "finish": {
      const un = S.items.filter(x => !x.sel.length).length;
      if(S.exam && un){ S.confirmFinish = true; render(true); focusOn('[data-act="finishyes"]'); } else finish();
      break; }
    case "finishyes": S.confirmFinish = false; finish(); break;
    case "finishno": S.confirmFinish = false; render(true); focusOn('[data-act="finish"]'); break;
    case "quit": S.confirmQuit = true; render(true); focusOn('[data-act="quityes"]'); break;
    case "quitno": S.confirmQuit = false; render(true); focusOn('[data-act="quit"]'); break;
    case "quityes": leave(); break;
    case "retrywrong": {
      const qs = shuffle(S.wrong.map(id => QBY[id]));
      startSession({kind:"practice", title:"Retry: mistakes from " + S.title, qs, exam:false, back:"mistakes"}); break; }
    case "zoom": openLB([{src: el.dataset.src}], 0); break;
    case "page": {
      const t = el.dataset.t, list = DATA.pages[t].map(p => ({src:p.f, label:"Manual page " + p.p}));
      openLB(list, +el.dataset.i); break; }
    case "lbclose": closeLB(); break;
    case "lbprev": LB.i = (LB.i - 1 + LB.list.length) % LB.list.length; drawLB(); break;
    case "lbnext": LB.i = (LB.i + 1) % LB.list.length; drawLB(); break;
  }
});
document.addEventListener("change", e => {
  if(e.target.id === "examDate"){ store.examDate = e.target.value; save(); render(true); }
});
document.addEventListener("keydown", e => {
  if(e.target.matches && e.target.matches("input,select,textarea")) return;
  if(LB){ if(e.key === "Escape"){ closeLB(); } else if(e.key === "ArrowRight" && LB.list.length>1){ LB.i = (LB.i+1)%LB.list.length; drawLB(); } else if(e.key === "ArrowLeft" && LB.list.length>1){ LB.i = (LB.i-1+LB.list.length)%LB.list.length; drawLB(); } return; }
  if(!S || S.finished) return;
  const it = S.items[S.i];
  const k = "abcdef".indexOf(e.key.toLowerCase());
  const d = "123456".indexOf(e.key);
  const idx = e.key.length === 1 && k >= 0 ? k : d;
  if(idx >= 0 && idx < it.order.length && !e.ctrlKey && !e.metaKey){ pick(idx); return; }
  if(e.key === "Enter" && e.target.closest && e.target.closest("button,a,summary")) return;
  if(e.key === "ArrowRight" || e.key === "Enter"){ const nb = document.querySelector('[data-act="next"]:not([disabled])'); if(nb) go(1); }
  if(e.key === "ArrowLeft") go(-1);
});

/* ---------- sources footnote ---------- */
$("#sources").innerHTML = `<summary>Where the questions come from</summary>
<p style="margin-top:8px">The manual "Let's Drive Safely" (Official Question Catalogue for class B and EB) supplies the lessons, the picture pages, the numbers sheet and the "select all that apply" questions. The four official test papers (Tests 1 to 4, each 30 questions with the answer marked) give the exam-style questions; duplicates between papers are kept in the papers but shown once in practice and mock exams. The Majuma speed and parking sheets add 28 more, and the sign chart gives the sign quiz. Two answer marks on the papers disagree with the manual (Test 1 Q30, Test 4 Q3) and one on the Majuma parking sheet (Q1), and each is flagged where it appears. Progress is saved in this browser only.</p>`;

render();
}
