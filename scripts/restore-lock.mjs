import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dir = path.join(root, "lockparts");
const names = readdirSync(dir)
  .filter((name) => /^part-\d+$/.test(name))
  .sort();

if (names.length === 0) {
  console.error("lockparts/ has no part files.");
  process.exit(1);
}

const body = Buffer.concat(names.map((name) => readFileSync(path.join(dir, name))));
writeFileSync(path.join(root, "package-lock.json"), body);
console.log(`Wrote package-lock.json (${body.length} bytes from ${names.length} parts).`);
