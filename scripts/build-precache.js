#!/usr/bin/env node
/* Writes the lists of files to keep offline, and version hashes of their contents, into sw.js.
   Any change to a listed file changes a hash, which is what makes phones pick up the update.
   `--check` changes nothing and exits 1 if sw.js is out of date. */
"use strict";
const fs = require("fs"), path = require("path"), crypto = require("crypto");
const ROOT = path.join(__dirname, "..");
const SW = path.join(ROOT, "sw.js");
const SKIP_DIRS = new Set(["scripts", "docs", "node_modules"]);
const SKIP_FILES = new Set(["sw.js", "README.md", "data/answer-key.lock", "robots.txt", "fonts/OFL.txt", "package.json", "icons/og-image.png"]);

function walk(dir, out){
  for(const name of fs.readdirSync(path.join(ROOT, dir)).sort()){
    if(name.startsWith(".")) continue;
    const rel = dir ? dir + "/" + name : name;
    if(fs.statSync(path.join(ROOT, rel)).isDirectory()){ if(!SKIP_DIRS.has(rel)) walk(rel, out); }
    else if(!SKIP_FILES.has(rel) && !isFallback(rel)) out.push(rel);
  }
  return out;
}
// WebP pages are what every browser with a service worker asks for, so the JPEG fallbacks stay online-only.
function isFallback(rel){ return /^pages\/[^/]+\.jpg$/.test(rel) && fs.existsSync(path.join(ROOT, rel.replace(/\.jpg$/, ".webp"))); }

function version(files){
  const hash = crypto.createHash("sha256");
  // js/config.js is left out of the hash because the service worker always asks the network for it first.
  files.forEach(f => { hash.update(f); if(f !== "js/config.js") hash.update(fs.readFileSync(path.join(ROOT, f))); });
  return hash.digest("hex").slice(0, 12);
}
const listOf = files => "[\n" + files.map(f => "  " + JSON.stringify(f)).join(",\n") + "\n]";

// Pictures get their own version, so a code or wording change does not make phones download them all again.
function generated(){
  const files = walk("", []);
  const media = files.filter(f => /^(img|signs|pages)\//.test(f));
  const shell = files.filter(f => media.indexOf(f) < 0);
  return `/* BEGIN GENERATED */\nconst SHELL_VERSION = "${version(shell)}";\nconst MEDIA_VERSION = "${version(media)}";\nconst SHELL = ${listOf(["./"].concat(shell))};\nconst MEDIA = ${listOf(media)};\n/* END GENERATED */`;
}

const cur = fs.readFileSync(SW, "utf8");
const next = cur.replace(/\/\* BEGIN GENERATED \*\/[\s\S]*?\/\* END GENERATED \*\//, generated());
if(process.argv.includes("--check")){
  if(cur !== next){ console.error("sw.js is out of date. Run: node scripts/build-precache.js"); process.exit(1); }
  console.log("sw.js is up to date");
}else{
  fs.writeFileSync(SW, next);
  console.log("sw.js updated, " + (next.match(/^  "/gm) || []).length + " files");
}
