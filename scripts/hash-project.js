// usage: npm run hash -- path/to/project-file
const fs = require("fs");
const crypto = require("crypto");

const file = process.argv[2];
if (!file) {
  console.log("usage: npm run hash -- <file>");
  process.exit(1);
}

const hash = crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
console.log("0x" + hash);
