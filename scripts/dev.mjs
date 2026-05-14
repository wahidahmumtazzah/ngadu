import { spawn } from "node:child_process";
import process from "node:process";

const children = [];
let shuttingDown = false;

function run(name, command, args, extraEnv = {}) {
  const child = spawn(command, args, {
    stdio: "inherit",
    shell: false,
    env: {
      ...process.env,
      ...extraEnv
    }
  });

  child.on("exit", (code, signal) => {
    if (shuttingDown) return;

    if (signal) {
      console.log(`[${name}] berhenti karena signal ${signal}`);
    } else if (code !== 0) {
      console.log(`[${name}] berhenti dengan kode ${code}`);
    }

    shutdown(code || 0);
  });

  child.on("error", (error) => {
    if (shuttingDown) return;
    console.error(`[${name}] gagal dijalankan: ${error.message}`);
    shutdown(1);
  });

  children.push(child);
}

function shutdown(code = 0) {
  if (shuttingDown) return;
  shuttingDown = true;

  for (const child of children) {
    if (!child.killed) {
      child.kill();
    }
  }

  process.exit(code);
}

process.on("SIGINT", () => shutdown(0));
process.on("SIGTERM", () => shutdown(0));

run("web", process.execPath, ["./node_modules/next/dist/bin/next", "dev"]);
run("api", process.execPath, ["--watch", "./server/server.js"]);
