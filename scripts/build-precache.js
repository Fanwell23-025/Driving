#!/usr/bin/env node
/* Writes the list of files to keep offline, and a version hash of their contents, into sw.js.
   Any change to a listed file changes the hash, which is what makes phones pick up the update.
   `--check` changes nothing and exits 1 if sw.js is out of date. */
"use strict";
const fs = require("fs"), path = require("path"), crypto = require("crypto");
const ROOT = path.join(__dirname, "..");
const SW = path.join(ROOT, "sw.js");
const SKIP_DIRS = new Set(["scripts", "docs", "node_modules"]);
const SKIP_FILES = new Set(["sw.js", "README.md", "robots.txt", "fonts/OFL.txt", "package.json", "icons/og-image.png"]);

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

function generated(){
  const files = walk("", []);
  const hash = crypto.createHash("sha256");
  // js/config.js is left out of the hash because the service worker always asks the network for it first.
  files.forEach(f => { hash.update(f); if(f !== "js/config.js") hash.update(fs.readFileSync(path.join(ROOT, f))); });
  const list = ["./"].concat(files).map(f => "  " + JSON.stringify(f)).join(",\n");
  return `/* BEGIN GENERATED */\nconst VERSION = "${hash.digest("hex").slice(0, 12)}";\nconst PRECACHE = [\n${list}\n];\n/* END GENERATED */`;
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
