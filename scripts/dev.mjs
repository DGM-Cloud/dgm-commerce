/**
 * Local Next.js launcher.
 * Sets NODE_TLS_REJECT_UNAUTHORIZED=0 so corporate SSL inspection
 * does not break Google Fonts + Supabase fetches during `npm run dev`.
 * Production (`next start` / deploy) must keep strict TLS.
 */
import { spawn } from "node:child_process";

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const child = spawn("npx", ["next", "dev", "--turbopack", ...process.argv.slice(2)], {
  stdio: "inherit",
  shell: true,
  env: process.env,
});

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }
  process.exit(code ?? 0);
});
