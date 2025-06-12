// fix-blocklock.js
const fs = require("fs");
const path = "./node_modules/blocklock-js/package.json";

try {
  const pkg = JSON.parse(fs.readFileSync(path, "utf8"));
  console.log(pkg.main);
  if (pkg.main === "./dist/cjs/index.js") {
    pkg.main = "./dist/cjs/index.cjs";
    pkg.exports["."]["require"]["default"] = "./dist/cjs/index.cjs";
    pkg.exports["."]["import"]["default"] = "./dist/esm/index.mjs";
    fs.writeFileSync(path, JSON.stringify(pkg, null, 2));
    console.log("✅ blocklock-js main field fixed.");
  }
} catch (err) {
  console.error("❌ Failed to fix blocklock-js:", err.message);
}
