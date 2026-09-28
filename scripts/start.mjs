import { spawn } from "node:child_process";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const nextBin = require.resolve("next/dist/bin/next");

const raw = process.env.PORT;
const port = raw && String(raw).trim() !== "" ? String(raw).trim() : "43123";

if (!/^\d+$/.test(port)) {
  console.error("PORT must be a number.");
  process.exit(1);
}

const child = spawn(process.execPath, [nextBin, "start", "-H", "0.0.0.0", "-p", port], {
  stdio: "inherit",
});

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }
  process.exit(code ?? 1);
});
