const fs = require("fs");
const path = require("path");

function walk(dir) {
  let results = [];
  fs.readdirSync(dir).forEach((file) => {
    file = path.resolve(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else if (file.endsWith(".ts") || file.endsWith(".tsx")) {
      results.push(file);
    }
  });
  return results;
}

const projectRoot = path.resolve(".");
const files = walk(projectRoot);

let foundAny = false;

files.forEach((file) => {
  const content = fs.readFileSync(file, "utf8");
  const regex = /export\s+const\s+revalidate\s*=\s*([^;]+);/g;
  let match;
  while ((match = regex.exec(content)) !== null) {
    console.log(`📍 ${file}: revalidate = ${match[1].trim()}`);
    foundAny = true;
  }
});

if (!foundAny) {
  console.log("✅ Keine revalidate-Deklarationen gefunden.");
}
