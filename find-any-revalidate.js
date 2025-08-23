const fs = require("fs");
const path = require("path");

function walk(dir) {
  let results = [];
  fs.readdirSync(dir).forEach((file) => {
    const filepath = path.resolve(dir, file);
    const stat = fs.statSync(filepath);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(filepath));
    } else if (file.endsWith(".ts") || file.endsWith(".tsx") || file.endsWith(".js") || file.endsWith(".jsx")) {
      results.push(filepath);
    }
  });
  return results;
}

const projectRoot = path.resolve(".");
const files = walk(projectRoot);

let foundAny = false;

files.forEach((file) => {
  const content = fs.readFileSync(file, "utf8");
  const lines = content.split("\n");
  lines.forEach((line, idx) => {
    if (line.toLowerCase().includes("revalidate")) {
      console.log(`📍 ${file}: Zeile ${idx + 1} → ${line.trim()}`);
      foundAny = true;
    }
  });
});

if (!foundAny) {
  console.log("✅ Keine Vorkommen von 'revalidate' gefunden.");
}
