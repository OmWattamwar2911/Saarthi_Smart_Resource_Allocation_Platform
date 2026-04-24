import { spawn } from "node:child_process";
import net from "node:net";
import process from "node:process";

const npmExecPath = process.env.npm_execpath;

if (!npmExecPath) {
  console.error("Unable to resolve npm executable path (npm_execpath is missing).");
  process.exit(1);
}

function runNpm(prefix, script) {
  return spawn(process.execPath, [npmExecPath, "--prefix", prefix, "run", script], {
    stdio: "inherit",
    env: process.env
  });
}

function isPortInUse(port) {
  return new Promise((resolve) => {
    const socket = new net.Socket();

    socket.setTimeout(500);
    socket.once("connect", () => {
      socket.destroy();
      resolve(true);
    });
    socket.once("timeout", () => {
      socket.destroy();
      resolve(false);
    });
    socket.once("error", () => {
      resolve(false);
    });

    socket.connect(port, "127.0.0.1");
  });
}

const children = [];
let shuttingDown = false;

function terminateAll(signal = "SIGTERM") {
  for (const child of children) {
    if (!child.killed) {
      child.kill(signal);
    }
  }
}

function shutdown(code = 0) {
  if (shuttingDown) return;
  shuttingDown = true;
  terminateAll("SIGTERM");
  process.exitCode = code;
}

process.on("SIGINT", () => shutdown(0));
process.on("SIGTERM", () => shutdown(0));

function wireChildEvents(child, index) {
  child.on("exit", (code, signal) => {
    if (shuttingDown) return;

    if (signal) {
      console.error(`dev process #${index + 1} exited due to signal ${signal}`);
      shutdown(1);
      return;
    }

    if (code && code !== 0) {
      console.error(`dev process #${index + 1} exited with code ${code}`);
      shutdown(code);
      return;
    }

    shutdown(0);
  });
}

const backendPortBusy = await isPortInUse(5000);
if (backendPortBusy) {
  console.warn("Port 5000 is already in use. Skipping backend startup and launching frontend only.");
} else {
  children.push(runNpm("backend", "dev"));
}

children.push(runNpm("frontend", "dev"));
children.forEach(wireChildEvents);
