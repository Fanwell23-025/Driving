#!/usr/bin/env node
/* Content check. Run before every commit (the pre-commit hook does it) and on every push (GitHub Actions).
   Exits 1 and lists the problems if anything is wrong. Uses Node only, nothing to install. */
"use strict";
const fs = require("fs"), path = require("path"), crypto = require("crypto");
const ROOT = path.join(__dirname, "..");
const KEY_FILE = path.join(ROOT, "data", "answer-key.lock");
const data = JSON.parse(fs.readFileSync(path.join(ROOT, "data", "data.json"), "utf8"));
const problems = [];
const bad = m => problems.push(m);
const exists = f => fs.existsSync(path.join(ROOT, f));
const blank = s => typeof s !== "string" || !s.trim();

/* Questions: unique ids, some text, non-empty options, answers that point at a real option. */
const ids = new Set(), topics = new Set(data.topics.map(t => t.id));
data.qs.forEach(q => {
  if(ids.has(q.id)) bad(`Duplicate question id: ${q.id}`);
  ids.add(q.id);
  if(blank(q.q)) bad(`${q.id}: empty question text`);
  if(!topics.has(q.topic)) bad(`${q.id}: unknown topic ${q.topic}`);
  if(!Array.isArray(q.opts) || q.opts.length < 2){ bad(`${q.id}: needs at least two options`); return; }
  q.opts.forEach((o, i) => { if(blank(o)) bad(`${q.id}: option ${i} is empty`); });
  if(!Array.isArray(q.ans) || !q.ans.length) bad(`${q.id}: has no answer`);
  else{
    q.ans.forEach(a => { if(!Number.isInteger(a) || a < 0 || a >= q.opts.length) bad(`${q.id}: answer index ${a} is not one of its ${q.opts.length} options`); });
    if(new Set(q.ans).size !== q.ans.length) bad(`${q.id}: repeats an answer index`);
  }
  if(q.img && !exists(q.img)) bad(`${q.id}: image not found: ${q.img}`);
});

/* Test papers point at real questions. */
data.tests.forEach(t => t.ids.forEach(id => { if(!ids.has(id)) bad(`${t.label}: unknown question ${id}`); }));

/* Signs and manual pages exist, with their WebP and thumbnail versions. */
data.signs.forEach(s => {
  if(blank(s.n)) bad(`Sign with no name: ${s.f}`);
  if(!exists(s.f)) bad(`Sign image not found: ${s.f}`);
});
Object.keys(data.pages).forEach(t => data.pages[t].forEach(p => {
  if(!exists(p.f)) bad(`Manual page not found: ${p.f}`);
  const webp = p.f.replace(/\.jpg$/, ".webp"), thumb = p.f.replace(/^pages\/(.*)\.jpg$/, "pages/thumbs/$1.webp");
  if(!exists(webp)) bad(`WebP version not found: ${webp}`);
  if(!exists(thumb)) bad(`Thumbnail not found: ${thumb}`);
}));

/* Every topic has a lesson. */
data.topics.forEach(t => { if(!(data.lessons[t.id] || []).length) bad(`Topic ${t.id} has no lesson`); });

/* The three answer keys that disagree with the manual must keep their notes. */
[
  ["T1-30", "Test 1 Q30"],
  ["T4-3", "Test 4 Q3"],
  ["MJ-P1", "Majuma Parking Q1"]
].forEach(([id, label]) => {
  const q = data.qs.find(x => x.id === id);
  if(!q || blank(q.note)) bad(`${label}: the note saying this key disagrees with the manual is missing`);
});

/* The answer key must not change by accident. To change it on purpose, run with --update-answer-key. */
const answers = data.qs.map(q => q.id + "=" + q.ans.join(",")).join("\n");
const hash = crypto.createHash("sha256").update(answers).digest("hex");
if(process.argv.includes("--update-answer-key")){
  fs.writeFileSync(KEY_FILE, hash + "\n");
  console.log("Answer key lock updated.");
}else if(!exists("data/answer-key.lock")) bad("data/answer-key.lock is missing");
else if(fs.readFileSync(KEY_FILE, "utf8").trim() !== hash) bad("The answer key changed. If that was deliberate, run: node scripts/check-content.js --update-answer-key");

if(problems.length){
  console.error(`Content check FAILED, ${problems.length} problem${problems.length === 1 ? "" : "s"}:`);
  problems.forEach(p => console.error(" - " + p));
  process.exit(1);
}
console.log(`Content check passed: ${data.qs.length} questions, ${data.signs.length} signs, ${data.tests.length} test papers, ${Object.values(data.pages).reduce((n, v) => n + v.length, 0)} manual pages.`);
